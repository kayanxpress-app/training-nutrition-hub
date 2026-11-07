// إنشاء حسابات العملاء وتغيير كلمات مرورهم (للأدمن فقط).
// متغيرات Vercel المطلوبة: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (سري: لا تضعه في config.js ولا GitHub)
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY, svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!url || !anon || !svc) return res.status(500).json({ error: "إعدادات السيرفر ناقصة في Vercel" });
    if (!token) return res.status(401).json({ error: "غير مصرح" });

    const asUser = createClient(url, anon, { global: { headers: { Authorization: "Bearer " + token } } });
    const { data: u, error: ue } = await asUser.auth.getUser(token);
    if (ue || !u || !u.user) return res.status(401).json({ error: "غير مصرح" });
    const { data: prof } = await asUser.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
    if (!prof || prof.role !== "admin") return res.status(403).json({ error: "للأدمن فقط" });

    const admin = createClient(url, svc, { auth: { persistSession: false, autoRefreshToken: false } });
    const b = req.body || {};

    if (b.action === "create") {
      const email = String(b.email || "").trim().toLowerCase();
      const password = String(b.password || "");
      const name = String(b.name || "").trim();
      if (!name) return res.status(400).json({ error: "اكتب اسم العميل" });
      if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "الإيميل غير صحيح" });
      if (password.length < 6) return res.status(400).json({ error: "كلمة المرور أقل من ٦ أحرف" });
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
      if (error) return res.status(400).json({ error: error.message });
      if (b.phone) await admin.from("profiles").update({ phone: String(b.phone).trim() }).eq("id", data.user.id);
      return res.status(200).json({ ok: true, id: data.user.id });
    }

    if (b.action === "password") {
      const password = String(b.password || "");
      if (typeof b.id !== "string" || password.length < 6) return res.status(400).json({ error: "كلمة المرور أقل من ٦ أحرف" });
      const { error } = await admin.auth.admin.updateUserById(b.id, { password });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "طلب غير معروف" });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e).slice(0, 300) });
  }
};
