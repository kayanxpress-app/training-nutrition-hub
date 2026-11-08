// التذكيرات التلقائية (بتشتغل مرة يوميًا من Vercel Cron، أو يدويًا من حساب الأدمن).
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
  return { title: "وحشتنا يا " + nm + " 💪", body, url: "./", tag: "rem-abs" };
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

  const dl = await admin.from("reminder_log").select("client_id").eq("sent_on", today);
  if (dl.error) return { error: "شغّل ملف supabase/reminders.sql في Supabase أولًا" };
  const done = new Set((dl.data || []).map(x => x.client_id));

  const rq = await admin.from("measure_requests").select("client_id,kind,created_at").eq("status", "pending");
  const pend = new Map();
  if (!rq.error) for (const r of (rq.data || []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))) if (!pend.has(r.client_id)) pend.set(r.client_id, r);
  const ms = await all(() => admin.from("measurements").select("client_id,taken_on").not("weight", "is", null).order("taken_on", { ascending: false }));
  const lastW = new Map();
  if (!ms.error) for (const r of ms.data) if (!lastW.has(r.client_id)) lastW.set(r.client_id, r.taken_on);

  const items = [], dig = [];
  for (const c of clients) {
    const a = active.get(c.id);
    if (!a) continue;
    const nm = first(c.full_name), lt = lastTrain.get(c.id), d = Math.max(0, diff(today, lt || a.start));
    if (d >= 3) dig.push({ name: nm, d, never: !lt });
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
  let digest = null;
  if (dig.length && admins.length) {
    const names = dig.slice(0, 6).map(x => x.name + " (" + AR(x.d) + ")").join("، ") + (dig.length > 6 ? " و" + AR(dig.length - 6) + " آخرين" : "");
    digest = { n: dig.length, names, key: admins[0].id, adminIds: admins.map(x => x.id), done: done.has(admins[0].id) };
  }
  return { items, digest };
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

    const today = ymd(new Date());
    const P = await plan(admin, today);
    if (P.error) return res.status(500).json({ error: P.error });
    const view = x => ({ name: x.name, kind: x.kind, days: x.days, title: x.title });
    const dview = P.digest && !P.digest.done ? { n: P.digest.n, names: P.digest.names } : null;
    if (!send) return res.status(200).json({ ok: true, mode: "preview", date: today, items: P.items.map(view), digest: dview });

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
    for (const it of P.items) {
      await admin.from("notifications").insert({ client_id: it.id, title: it.title, body: it.body });
      const pushed = await push([it.id], it);
      await admin.from("reminder_log").upsert({ client_id: it.id, sent_on: today, kind: it.kind }, { onConflict: "client_id,sent_on", ignoreDuplicates: true });
      out.push({ ...view(it), pushed });
    }
    let dg = null;
    if (P.digest && !P.digest.done) {
      const pushed = await push(P.digest.adminIds, { title: "📋 غياب يحتاج متابعة", body: P.digest.n + " عميل غايبين ٣ أيام أو أكتر: " + P.digest.names, url: "./", tag: "digest" });
      await admin.from("reminder_log").upsert({ client_id: P.digest.key, sent_on: today, kind: "digest" }, { onConflict: "client_id,sent_on", ignoreDuplicates: true });
      dg = { n: P.digest.n, names: P.digest.names, pushed };
    }
    if (dead.length) await admin.from("push_subscriptions").delete().in("endpoint", dead);
    return res.status(200).json({ ok: true, mode: "send", date: today, items: out, digest: dg });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e).slice(0, 300) });
  }
};
