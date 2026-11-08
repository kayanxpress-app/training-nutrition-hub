// إشعارات الموبايل (Web Push). متغيرات Vercel المطلوبة:
// SUPABASE_URL, SUPABASE_ANON_KEY (موجودين)، SUPABASE_SERVICE_ROLE_KEY (موجود)،
// VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (جداد، سري: لا تضعهم في config.js ولا GitHub)
// اختياري: VAPID_SUBJECT (لينك موقعك أو mailto:)
const { createClient } = require("@supabase/supabase-js");
const webpush = require("web-push");

const clip = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safeUrl = (u, def) => (typeof u === "string" && u.length <= 200 && /^\.\/[#?\w\-=&%.]*$/.test(u)) ? u : def;

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
    const missing = [!url && "SUPABASE_URL", !svc && "SUPABASE_SERVICE_ROLE_KEY", !pub && "VAPID_PUBLIC_KEY", !priv && "VAPID_PRIVATE_KEY"].filter(Boolean);
    if (missing.length) return res.status(500).json({ error: "ناقص في Vercel: " + missing.join(" ، ") });
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "غير مصرح" });

    const admin = createClient(url, svc, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: u, error: ue } = await admin.auth.getUser(token);
    if (ue || !u || !u.user) return res.status(401).json({ error: "غير مصرح" });
    const uid = u.user.id;
    const { data: me } = await admin.from("profiles").select("role,full_name").eq("id", uid).maybeSingle();
    if (!me) return res.status(403).json({ error: "غير مصرح" });
    const b = req.body || {};

    // ===== تسجيل / إلغاء تسجيل جهاز =====
    if (b.action === "subscribe") {
      const s = b.sub || {}, k = s.keys || {};
      if (typeof s.endpoint !== "string" || !/^https:\/\//.test(s.endpoint) || s.endpoint.length > 1000 || typeof k.p256dh !== "string" || typeof k.auth !== "string" || k.p256dh.length > 200 || k.auth.length > 100)
        return res.status(400).json({ error: "اشتراك غير صالح" });
      const { error } = await admin.from("push_subscriptions").upsert({ endpoint: s.endpoint, user_id: uid, p256dh: k.p256dh, auth: k.auth, ua: clip(req.headers["user-agent"], 200) }, { onConflict: "endpoint" });
      if (error) return res.status(500).json({ error: "تعذر الحفظ (هل شغّلت push.sql؟)" });
      // أقصى ١٠ أجهزة للحساب: نمسح الأقدم
      const { data: all } = await admin.from("push_subscriptions").select("endpoint,created_at").eq("user_id", uid).order("created_at", { ascending: false });
      if (all && all.length > 10) await admin.from("push_subscriptions").delete().in("endpoint", all.slice(10).map(x => x.endpoint));
      return res.status(200).json({ ok: true });
    }
    if (b.action === "unsubscribe") {
      if (typeof b.endpoint !== "string") return res.status(400).json({ error: "طلب غير صالح" });
      await admin.from("push_subscriptions").delete().eq("endpoint", b.endpoint).eq("user_id", uid);
      return res.status(200).json({ ok: true });
    }

    // ===== إرسال =====
    if (b.action === "send") {
      let ids = [], msg;
      if (b.to === "client") {
        if (me.role !== "admin") return res.status(403).json({ error: "للأدمن فقط" });
        if (typeof b.client_id !== "string" || !UUID.test(b.client_id)) return res.status(400).json({ error: "عميل غير صالح" });
        ids = [b.client_id];
        msg = { title: clip(b.title, 80) || "رسالة من الدكتور", body: clip(b.body, 240) || "افتح التطبيق لمشاهدة الرسالة", url: safeUrl(b.url, "./#notes"), tag: clip(b.tag, 60) || undefined };
      } else if (b.to === "admin") {
        if (me.role === "admin") return res.status(400).json({ error: "غير مطلوب" });
        const name = clip(me.full_name, 40) || "عميل", label = clip(b.label, 40);
        const kinds = {
          start: { title: name + " بدأ تمرين اليوم 💪", body: "افتح ملفه وشجّعه", tag: "start-" + uid },
          done: { title: name + " خلّص جلسته ✅" + (label ? " · " + label : ""), body: "افتح ملفه وشوف أداءه", tag: "done-" + uid + "-" + label },
          meas: { title: name + " سجّل " + (label === "inbody" ? "نتيجة InBody" : "وزنه") + " ⚖", body: "شوف تطوره في صفحة القياسات", tag: "meas-" + uid }
        };
        const m = kinds[b.kind];
        if (!m) return res.status(400).json({ error: "نوع غير معروف" });
        msg = { ...m, url: "./?c=" + uid + "&n=" + encodeURIComponent(name) };
        const { data: ad } = await admin.from("profiles").select("id").eq("role", "admin");
        ids = (ad || []).map(x => x.id);
      } else return res.status(400).json({ error: "طلب غير معروف" });

      if (!ids.length) return res.status(200).json({ ok: true, sent: 0, total: 0 });
      const { data: subs } = await admin.from("push_subscriptions").select("endpoint,p256dh,auth").in("user_id", ids);
      if (!subs || !subs.length) return res.status(200).json({ ok: true, sent: 0, total: 0 });

      webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://training-nutrition-hub.vercel.app", pub, priv);
      const payload = JSON.stringify(msg);
      const rs = await Promise.allSettled(subs.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 43200, urgency: "high" })));
      const dead = [];
      let sent = 0;
      rs.forEach((r, i) => {
        if (r.status === "fulfilled") sent++;
        else if (r.reason && (r.reason.statusCode === 404 || r.reason.statusCode === 410)) dead.push(subs[i].endpoint);
      });
      if (dead.length) await admin.from("push_subscriptions").delete().in("endpoint", dead);
      return res.status(200).json({ ok: true, sent, total: subs.length });
    }

    return res.status(400).json({ error: "طلب غير معروف" });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e).slice(0, 300) });
  }
};
