// التذكيرات التلقائية. بتشتغل من مهمتين في Vercel Cron (أو يدويًا من حساب الأدمن):
//   /api/reminders?job=clients  → رسائل العملاء (العصر قبل ميعاد التمرين)
//   /api/reminders?job=digest   → ملخص الغياب للمدرب (الصبح)
//   /api/reminders?job=nudge    → «ابدأ جلستك» لمن سجّل دخول الجيم من ساعة ولسه ما بدأش تمرين
//                                  (محتاج استدعاء كل ~١٥ دقيقة من خارج Vercel — راجع gym_nudge.sql والشرح)
// من غير job (زر الأدمن اليدوي) بيشتغل الاتنين.
// الحضور = أحدث تاريخ بين آخر تمرين مسجّل وآخر «تسجيل دخول الجيم».
// متغيرات Vercel المطلوبة: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (موجودين)
// + CRON_SECRET (جديد: أي نص عشوائي طويل، وVercel بيبعته تلقائيًا مع المهمة المجدولة)
const { createClient } = require("@supabase/supabase-js");
const webpush = require("web-push");

const TZ = "Africa/Cairo";
const ymd = d => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const dnum = s => Math.floor(Date.parse(s + "T00:00:00Z") / 864e5);
const diff = (a, b) => dnum(a) - dnum(b);
const AR = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const first = n => String(n || "").trim().split(/\s+/)[0] || "بطل";
const absMile = d => d === 2 || d === 4 || d === 7 || (d >= 14 && d <= 42 && d % 7 === 0);

async function all(mk) {
  const out = [];
  for (let i = 0; i < 30; i++) {
    const { data, error } = await mk().range(i * 1000, i * 1000 + 999);
    if (error) return { error, data: out };
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return { data: out };
}

function msgFor(kind, nm, d, rk) {
  if (kind === "req") return { title: "⏳ مطلوب منك: " + (rk === "inbody" ? "قياس InBody" : "قياس الوزن"), body: "الدكتور بانتظار القياس عشان يتابع تطورك. سجّله في ثواني.", url: "./#body", tag: "rem-req" };
  if (kind === "start") return { title: nm + "، يلا نبدأ 💪", body: "برنامجك جاهز من " + AR(d) + " أيام. افتح أول جلسة وابدأ النهارده.", url: "./", tag: "rem-abs" };
  if (kind === "wt") return { title: nm + "، وقت وزنك الأسبوعي ⚖", body: "سجّل وزنك الأسبوع ده عشان نتابع تطورك مع بعض.", url: "./#body", tag: "rem-wt" };
  const body = d <= 2 ? "بقالك يومين من غير تمرين. نص ساعة النهارده تفرق، افتح جلستك وابدأ."
    : d <= 4 ? "مرّ " + AR(d) + " أيام على آخر تمرين. ارجع لخطتك النهارده وأنا معاك."
    : d <= 7 ? "أسبوع من غير تمرين. لو في عائق قولي نحله مع بعض."
    : "مرّ " + AR(d) + " يوم من غير تمرين. ابعتلي عشان نرجّعك للمسار.";
  return { title: (nm === "بطل" ? "" : nm + "، ") + "جلستك في انتظارك 💪", body, url: "./", tag: "rem-abs" };
}

async function plan(admin, today) {
  const { data: cl, error: ce } = await admin.from("profiles").select("id,full_name,role");
  if (ce) return { error: "تعذر قراءة العملاء" };
  const clients = (cl || []).filter(x => x.role === "client"), admins = (cl || []).filter(x => x.role === "admin");

  const pr = await all(() => admin.from("programs").select("client_id,month_start,published,info:data->info").order("month_start", { ascending: false }));
  if (pr.error) return { error: "تعذر قراءة البرامج" };
  const active = new Map();
  for (const p of pr.data) {
    if (!p.published || !p.month_start) continue;
    const days = Number(p.info && p.info.days) || 30, st = p.month_start;
    if (diff(today, st) >= 0 && diff(today, st) <= days - 1 && !active.has(p.client_id)) active.set(p.client_id, { start: st });
  }

  const since = ymd(new Date(Date.now() - 50 * 864e5));
  const lg = await all(() => admin.from("logs").select("client_id,log_date,data").gte("log_date", since).order("log_date", { ascending: false }));
  if (lg.error) return { error: "تعذر قراءة السجلات" };
  const lastTrain = new Map();
  for (const r of lg.data) {
    if (r.data && r.data.d && Object.keys(r.data.d).length && (!lastTrain.has(r.client_id) || r.log_date > lastTrain.get(r.client_id))) lastTrain.set(r.client_id, r.log_date);
  }

  const gm = await all(() => admin.from("gym_checkins").select("client_id,created_at").gte("created_at", new Date(Date.now() - 50 * 864e5).toISOString()).order("created_at", { ascending: false }));
  const lastGym = new Map();
  if (!gm.error) for (const r of gm.data) { const g = ymd(new Date(r.created_at)); if (!lastGym.has(r.client_id) || g > lastGym.get(r.client_id)) lastGym.set(r.client_id, g); }

  const dl = await admin.from("reminder_log").select("client_id").eq("sent_on", today);
  if (dl.error) return { error: "شغّل ملف supabase/reminders.sql في Supabase أولًا" };
  const done = new Set((dl.data || []).map(x => x.client_id));

  const rq = await admin.from("measure_requests").select("client_id,kind,created_at").eq("status", "pending");
  const pend = new Map();
  if (!rq.error) for (const r of (rq.data || []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))) if (!pend.has(r.client_id)) pend.set(r.client_id, r);
  const ms = await all(() => admin.from("measurements").select("client_id,taken_on").not("weight", "is", null).order("taken_on", { ascending: false }));
  const lastW = new Map();
  if (!ms.error) for (const r of ms.data) if (!lastW.has(r.client_id)) lastW.set(r.client_id, r.taken_on);

  const items = [], dig = [], nolog = [];
  for (const c of clients) {
    const a = active.get(c.id);
    if (!a) continue;
    const nm = first(c.full_name), tr = lastTrain.get(c.id), gy = lastGym.get(c.id);
    const lt = tr && gy ? (tr > gy ? tr : gy) : (tr || gy);   // آخر حضور: تمرين مسجّل أو دخول جيم
    const d = Math.max(0, diff(today, lt || a.start));
    if (d >= 3) dig.push({ name: nm, d, never: !lt });
    else if (gy && diff(today, tr || a.start) >= 3) nolog.push({ name: nm, d: diff(today, tr || a.start) });   // بيحضر بس مش بيسجّل تمرينه
    if (done.has(c.id)) continue;
    const pq = pend.get(c.id);
    const age = pq ? diff(today, ymd(new Date(pq.created_at))) : -1;
    let kind = null;
    if (pq && (age === 2 || age === 4 || age === 7)) kind = "req";
    else if (absMile(d)) kind = lt ? "abs" : "start";
    else if (!pq) {
      const dw = diff(today, lastW.get(c.id) || a.start);
      if (dw >= 7 && dw <= 35 && (dw - 7) % 7 === 0) kind = "wt";
    }
    if (kind) items.push({ id: c.id, name: nm, kind, days: kind === "req" ? age : kind === "wt" ? diff(today, lastW.get(c.id) || a.start) : d, ...msgFor(kind, nm, kind === "req" ? age : d, pq && pq.kind) });
  }
  dig.sort((x, y) => y.d - x.d);
  nolog.sort((x, y) => y.d - x.d);
  let digest = null;
  if ((dig.length || nolog.length) && admins.length) {
    const lst = (a) => a.slice(0, 6).map(x => x.name + " (" + AR(x.d) + ")").join("، ") + (a.length > 6 ? " و" + AR(a.length - 6) + " آخرين" : "");
    const names = dig.length ? lst(dig) : "";
    const nolNames = nolog.length ? lst(nolog) : "";
    digest = { n: dig.length, names, nl: nolog.length, nolNames, key: admins[0].id, adminIds: admins.map(x => x.id), done: done.has(admins[0].id) };
  }
  return { items, digest };
}

// الأقساط المستحقة: يوم الميعاد (أو بعده لو فاتت) نبلّغ العميل ونبلّغ الأدمن «تم تذكير فلان». notified_at بيمنع التكرار.
// بتشتغل في مسارها المستقل: أي خطأ فيها (أو لو installments.sql لسه ما اتشغلش) مبيأثرش على باقي التذكيرات.
async function instJob(admin, today) {
  try {
    const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
    const q = await admin.from("installments").select("id,client_id,amount,due_on").eq("status", "pending").is("notified_at", null).lte("due_on", today).order("due_on");
    if (q.error) return { skipped: true };
    const rows = q.data || [];
    if (!rows.length) return { n: 0 };
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://training-nutrition-hub.vercel.app", pub, priv);
    const uids = [...new Set(rows.map(r => r.client_id))];
    const pf = await admin.from("profiles").select("id,full_name").in("id", uids);
    const ad = await admin.from("profiles").select("id").eq("role", "admin");
    const nm = new Map((pf.data || []).map(x => [x.id, String(x.full_name || "").trim() || "عميل"]));
    const adminIds = (ad.data || []).map(x => x.id);
    const sb = await admin.from("push_subscriptions").select("user_id,endpoint,p256dh,auth").in("user_id", uids.concat(adminIds));
    const subs = sb.data || [], dead = [];
    const push = async (ids, m) => {
      const mine = subs.filter(s => ids.includes(s.user_id));
      const payload = JSON.stringify({ title: String(m.title).slice(0, 80), body: String(m.body).slice(0, 240), url: m.url, tag: m.tag });
      const rs = await Promise.allSettled(mine.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 43200, urgency: "high" })));
      let ok = 0;
      rs.forEach((x, i) => { if (x.status === "fulfilled") ok++; else if (x.reason && (x.reason.statusCode === 404 || x.reason.statusCode === 410)) dead.push(mine[i].endpoint); });
      return ok;
    };
    const out = [];
    for (const r of rows) {
      // نحجز القسط الأول (لو حد تاني بلّغ عنه في نفس اللحظة نتخطاه) عشان مفيش إشعار يتكرر
      const c = await admin.from("installments").update({ notified_at: new Date().toISOString() }).eq("id", r.id).is("notified_at", null).select("id");
      if (c.error || !c.data || !c.data.length) continue;
      const name = nm.get(r.client_id) || "عميل";
      const m = { title: "مطلوب منك: سداد القسط الشهري", body: "مطلوب سداد قسطك الشهري بمبلغ " + r.amount + ". سدّد وارفع إيصال العملية من صفحة «سداد رسوم البرنامج».", url: "./#pay", tag: "inst-" + r.id };
      await admin.from("notifications").insert({ client_id: r.client_id, title: m.title, body: m.body });
      const pushed = await push([r.client_id], m);
      await push(adminIds, { title: "🔔 تم تذكير " + name + " بميعاد قسطه", body: (r.due_on === today ? "بتاريخ اليوم" : "ميعاده كان " + r.due_on) + " · المبلغ: " + r.amount, url: "./?c=" + r.client_id + "&n=" + encodeURIComponent(name), tag: "inst-adm-" + r.id });
      out.push({ name, amount: r.amount, pushed });
    }
    if (dead.length) await admin.from("push_subscriptions").delete().in("endpoint", [...new Set(dead)]);
    return { n: out.length, items: out };
  } catch (e) {
    return { error: String((e && e.message) || e).slice(0, 200) };
  }
}

// مواعيد المتابعة المحكمة: قبل الميعاد بيوم (غدًا) نبلّغ العميل، ونبلّغ الأدمن بإشعار واحد فيه كل العملاء اللي ميعادهم غدًا.
// مسار مستقل: أي خطأ فيه (أو لو restriction_followup.sql لسه ما اتشغلش) مبيأثرش على باقي التذكيرات. notified_at بيمنع التكرار.
async function followJob(admin) {
  try {
    const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
    const tmr = ymd(new Date(Date.now() + 864e5));
    const q = await admin.from("inquiry_windows").select("id,client_id,open_on").eq("open_on", tmr).is("notified_at", null);
    if (q.error) return { skipped: true };
    const rows0 = q.data || [];
    if (!rows0.length) return { n: 0 };
    const ids0 = [...new Set(rows0.map(r => r.client_id))];
    const rs = await admin.from("account_restrictions").select("client_id").eq("active", true).in("client_id", ids0);
    const act = new Set((rs.data || []).map(x => x.client_id));
    const rows = rows0.filter(r => act.has(r.client_id));   // القيد لازم يكون لسه مفعّل
    if (!rows.length) return { n: 0 };
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://training-nutrition-hub.vercel.app", pub, priv);
    const uids = [...new Set(rows.map(r => r.client_id))];
    const pf = await admin.from("profiles").select("id,full_name").in("id", uids);
    const ad = await admin.from("profiles").select("id").eq("role", "admin");
    const nm = new Map((pf.data || []).map(x => [x.id, String(x.full_name || "").trim() || "عميل"]));
    const adminIds = (ad.data || []).map(x => x.id);
    const sb = await admin.from("push_subscriptions").select("user_id,endpoint,p256dh,auth").in("user_id", uids.concat(adminIds));
    const subs = sb.data || [], dead = [];
    const push = async (ids, m) => {
      const mine = subs.filter(s => ids.includes(s.user_id));
      const payload = JSON.stringify({ title: String(m.title).slice(0, 80), body: String(m.body).slice(0, 240), url: m.url, tag: m.tag });
      const rr = await Promise.allSettled(mine.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 43200, urgency: "high" })));
      let ok = 0;
      rr.forEach((x, i) => { if (x.status === "fulfilled") ok++; else if (x.reason && (x.reason.statusCode === 404 || x.reason.statusCode === 410)) dead.push(mine[i].endpoint); });
      return ok;
    };
    const ds = AR(tmr.split("-").reverse().join("/"));
    const done = [];
    for (const r of rows) {
      // نحجز الميعاد الأول (لو حد تاني بلّغ عنه في نفس اللحظة نتخطاه) عشان مفيش إشعار يتكرر
      const c = await admin.from("inquiry_windows").update({ notified_at: new Date().toISOString() }).eq("id", r.id).is("notified_at", null).select("id");
      if (c.error || !c.data || !c.data.length) continue;
      const m = { title: "غدًا ميعاد متابعتك 📅", body: "غدًا " + ds + " ميعاد متابعتك مع الدكتور. هتقدر تستخدم زر «استفسر» والمحادثة داخل التطبيق لمدة ٢٤ ساعة.", url: "./", tag: "follow-" + r.id };
      await admin.from("notifications").insert({ client_id: r.client_id, title: m.title, body: m.body });
      const pushed = await push([r.client_id], m);
      done.push({ id: r.client_id, name: nm.get(r.client_id) || "عميل", pushed });
    }
    // إشعار واحد للأدمن فيه كل عملاء الميعاد ده
    let adminPushed = 0;
    if (done.length && adminIds.length) {
      const names = done.map(x => x.name);
      const lst = names.slice(0, 8).join("، ") + (names.length > 8 ? " و" + AR(names.length - 8) + " آخرين" : "");
      const one = done.length === 1;
      adminPushed = await push(adminIds, {
        title: one ? "📅 غدًا ميعاد متابعة " + names[0] : "📅 غدًا ميعاد متابعة " + AR(done.length) + " عملاء",
        body: (one ? "تتفتح له أزرار «استفسر» والمحادثة ٢٤ ساعة · " + ds : lst + " · " + ds),
        url: one ? "./?c=" + done[0].id + "&n=" + encodeURIComponent(names[0]) : "./",
        tag: "follow-adm-" + tmr
      });
    }
    if (dead.length) await admin.from("push_subscriptions").delete().in("endpoint", [...new Set(dead)]);
    return { n: done.length, names: done.map(x => x.name), adminPushed };
  } catch (e) {
    return { error: String((e && e.message) || e).slice(0, 200) };
  }
}

const NUDGE_AFTER_MIN = 60, NUDGE_UNTIL_H = 3;
async function nudge(admin, send, webpush) {
  const now = Date.now(), today = ymd(new Date());
  const from = new Date(now - NUDGE_UNTIL_H * 36e5).toISOString(), to = new Date(now - NUDGE_AFTER_MIN * 6e4).toISOString();
  const g = await admin.from("gym_checkins").select("id,client_id,created_at").is("left_at", null).is("nudged_at", null).gte("created_at", from).lte("created_at", to);
  if (g.error) return { error: "شغّل ملف supabase/gym_nudge.sql في Supabase أولًا" };
  const rows = g.data || [];
  if (!rows.length) return { items: [] };
  const ids = [...new Set(rows.map(r => r.client_id))];

  const lg = await admin.from("logs").select("client_id,log_date,data").in("client_id", ids).gte("log_date", ymd(new Date(from)));
  if (lg.error) return { error: "تعذر قراءة السجلات" };
  const trained = new Set((lg.data || []).filter(r => r.data && r.data.d && Object.keys(r.data.d).length).map(r => r.client_id));

  const pr = await admin.from("programs").select("client_id,month_start,published,info:data->info").in("client_id", ids);
  if (pr.error) return { error: "تعذر قراءة البرامج" };
  const active = new Set();
  for (const p of pr.data || []) {
    if (!p.published || !p.month_start) continue;
    const days = Number(p.info && p.info.days) || 30, d = diff(today, p.month_start);
    if (d >= 0 && d <= days - 1) active.add(p.client_id);
  }
  const nm = new Map(((await admin.from("profiles").select("id,full_name").in("id", ids)).data || []).map(x => [x.id, first(x.full_name)]));

  const todo = ids.filter(id => !trained.has(id) && active.has(id));
  const items = todo.map(id => ({ id, name: nm.get(id) || "بطل" }));
  if (!send) return { items: items.map(x => ({ name: x.name })) };

  let subs = [];
  if (todo.length) subs = ((await admin.from("push_subscriptions").select("user_id,endpoint,p256dh,auth").in("user_id", todo)).data) || [];
  const dead = [], out = [];
  for (const it of items) {
    const m = { title: it.name + "، ابدأ جلستك 💪", body: "عدّت ساعة على دخولك الجيم. افتح تمرينك وسجّل أول تمرين عشان الدكتور يتابعك.", url: "./#train", tag: "gym-nudge" };
    await admin.from("notifications").insert({ client_id: it.id, title: m.title, body: m.body });
    const mine = subs.filter(s => s.user_id === it.id);
    const rs = await Promise.allSettled(mine.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(m), { TTL: 3600, urgency: "normal" })));
    let ok = 0;
    rs.forEach((r, i) => { if (r.status === "fulfilled") ok++; else if (r.reason && (r.reason.statusCode === 404 || r.reason.statusCode === 410)) dead.push(mine[i].endpoint); });
    out.push({ name: it.name, pushed: ok });
  }
  // نعلّم كل الدخولات اللي اتفحصت (حتى اللي بدأ تمرينه أو برنامجه مش شغّال) عشان متتفحصش تاني
  await admin.from("gym_checkins").update({ nudged_at: new Date().toISOString() }).in("id", rows.map(r => r.id));
  if (dead.length) await admin.from("push_subscriptions").delete().in("endpoint", dead);
  return { items: out };
}

module.exports = async (req, res) => {
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY, cs = process.env.CRON_SECRET;
    const missing = [!url && "SUPABASE_URL", !svc && "SUPABASE_SERVICE_ROLE_KEY", !pub && "VAPID_PUBLIC_KEY", !priv && "VAPID_PRIVATE_KEY"].filter(Boolean);
    if (missing.length) return res.status(500).json({ error: "ناقص في Vercel: " + missing.join(" ، ") });
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "غير مصرح" });
    const admin = createClient(url, svc, { auth: { persistSession: false, autoRefreshToken: false } });

    let send = false;
    if (cs && token === cs) send = true;   // المهمة المجدولة
    else {
      if (req.method !== "POST") return res.status(401).json({ error: "غير مصرح" });
      const { data: u, error: ue } = await admin.auth.getUser(token);
      if (ue || !u || !u.user) return res.status(401).json({ error: "غير مصرح" });
      const { data: me } = await admin.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
      if (!me || me.role !== "admin") return res.status(403).json({ error: "للأدمن فقط" });
      send = !!(req.body && req.body.send === true);
    }

    const jq = (() => { try { return new URL(req.url, "http://x").searchParams.get("job"); } catch (e) { return null; } })();
    const job = jq || (req.body && req.body.job) || "all";
    const doClients = job !== "digest", doDigest = job !== "clients";
    const INST = send && job !== "nudge" ? await instJob(admin, ymd(new Date())) : null;   // الأقساط المستحقة (مسار مستقل)
    const FOL = send && job !== "nudge" ? await followJob(admin) : null;   // مواعيد المتابعة المحكمة (مسار مستقل)
    if (job === "nudge") {
      if (send) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://training-nutrition-hub.vercel.app", pub, priv);
      const N = await nudge(admin, send, webpush);
      if (N.error) return res.status(500).json({ error: N.error });
      return res.status(200).json({ ok: true, mode: send ? "send" : "preview", job, items: N.items });
    }
    const today = ymd(new Date());
    const P = await plan(admin, today);
    if (P.error) return res.status(500).json({ error: P.error });
    const view = x => ({ name: x.name, kind: x.kind, days: x.days, title: x.title });
    const dview = doDigest && P.digest && !P.digest.done ? { n: P.digest.n, names: P.digest.names, noLog: P.digest.nl, noLogNames: P.digest.nolNames } : null;
    if (!send) return res.status(200).json({ ok: true, mode: "preview", job, date: today, items: doClients ? P.items.map(view) : [], digest: dview });

    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://training-nutrition-hub.vercel.app", pub, priv);
    const sb = await all(() => admin.from("push_subscriptions").select("user_id,endpoint,p256dh,auth").order("created_at", { ascending: false }));
    const byUser = new Map();
    for (const s of sb.data || []) { if (!byUser.has(s.user_id)) byUser.set(s.user_id, []); byUser.get(s.user_id).push(s); }
    const dead = [];
    const push = async (uids, m) => {
      const subs = uids.flatMap(id => byUser.get(id) || []);
      const payload = JSON.stringify({ title: m.title, body: m.body, url: m.url, tag: m.tag });
      const rs = await Promise.allSettled(subs.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 43200, urgency: "normal" })));
      let ok = 0;
      rs.forEach((r, i) => { if (r.status === "fulfilled") ok++; else if (r.reason && (r.reason.statusCode === 404 || r.reason.statusCode === 410)) dead.push(subs[i].endpoint); });
      return ok;
    };

    const out = [];
    for (const it of (doClients ? P.items : [])) {
      await admin.from("notifications").insert({ client_id: it.id, title: it.title, body: it.body });
      const pushed = await push([it.id], it);
      await admin.from("reminder_log").upsert({ client_id: it.id, sent_on: today, kind: it.kind }, { onConflict: "client_id,sent_on", ignoreDuplicates: true });
      out.push({ ...view(it), pushed });
    }
    let dg = null;
    if (doDigest && P.digest && !P.digest.done) {
      const parts = [];
      if (P.digest.n) parts.push(AR(P.digest.n) + " عميل غايبين ٣ أيام أو أكتر: " + P.digest.names);
      if (P.digest.nl) parts.push("حضروا الجيم بس ما سجّلوش تمرين: " + P.digest.nolNames);
      const pushed = await push(P.digest.adminIds, { title: "📋 غياب يحتاج متابعة", body: parts.join(" • "), url: "./", tag: "digest" });
      await admin.from("reminder_log").upsert({ client_id: P.digest.key, sent_on: today, kind: "digest" }, { onConflict: "client_id,sent_on", ignoreDuplicates: true });
      dg = { n: P.digest.n, names: P.digest.names, noLog: P.digest.nl, pushed };
    }
    if (dead.length) await admin.from("push_subscriptions").delete().in("endpoint", dead);
    return res.status(200).json({ ok: true, mode: "send", date: today, items: out, digest: dg, installments: INST, followups: FOL });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e).slice(0, 300) });
  }
};
