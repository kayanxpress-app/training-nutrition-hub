// جلب صورة منتج من لينك (مثل iHerb) للأدمن فقط.
// بيقرأ صفحة المنتج من السيرفر، يلاقي صورة og:image، وينزّلها ويرجّعها للتطبيق عشان تتحفظ كنسخة عندك.
// المتغيرات المطلوبة في Vercel: SUPABASE_URL, SUPABASE_ANON_KEY (أو نفس أسماء NEXT_PUBLIC_)
const { createClient } = require("@supabase/supabase-js");

const UAS = [
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "Twitterbot/1.0",
];
const MAX_IMG = 2.5 * 1024 * 1024;

function badHost(h) {
  h = String(h || "").toLowerCase();
  return !h || !h.includes(".") || h === "localhost" || /^\[/.test(h) ||
    /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || /\.(local|internal|localdomain)$/.test(h);
}
function okUrl(u) {
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) && !badHost(x.hostname) ? x : null; } catch (e) { return null; }
}
const dec = (s) => String(s || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function findImage(html) {
  for (const n of ["og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"]) {
    const a = new RegExp("<meta[^>]+(?:property|name)=[\"']" + n + "[\"'][^>]*content=[\"']([^\"']+)[\"']", "i").exec(html);
    const b = new RegExp("<meta[^>]+content=[\"']([^\"']+)[\"'][^>]*(?:property|name)=[\"']" + n + "[\"']", "i").exec(html);
    const m = a || b; if (m && m[1].trim()) return dec(m[1].trim());
  }
  const l = /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i.exec(html); if (l) return dec(l[1]);
  const j = /"image"\s*:\s*\[?\s*"(https?:[^"]+)"/i.exec(html); if (j) return dec(j[1].replace(/\\\//g, "/"));
  return "";
}

async function get(url, ua, ms, referer) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { signal: ac.signal, redirect: "follow", headers: { "User-Agent": ua, "Accept": "text/html,application/xhtml+xml,image/*,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9,ar;q=0.8", ...(referer ? { Referer: referer } : {}) } });
  } finally { clearTimeout(t); }
}

async function downloadImage(src, ua, ms, referer) {
  if (!okUrl(src)) return null;
  const r = await get(src, ua, ms, referer);
  if (!r.ok || !okUrl(r.url)) return null;
  const type = (r.headers.get("content-type") || "").split(";")[0].trim();
  if (!/^image\//.test(type)) return null;
  const buf = Buffer.from(await r.arrayBuffer());
  if (!buf.length || buf.length > MAX_IMG) return null;
  return "data:" + type + ";base64," + buf.toString("base64");
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return res.status(500).json({ error: "إعدادات السيرفر ناقصة في Vercel" });
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "غير مصرح" });
    const asUser = createClient(url, anon, { global: { headers: { Authorization: "Bearer " + token } } });
    const { data: u, error: ue } = await asUser.auth.getUser(token);
    if (ue || !u || !u.user) return res.status(401).json({ error: "غير مصرح" });
    const { data: prof } = await asUser.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
    if (!prof || prof.role !== "admin") return res.status(403).json({ error: "للأدمن فقط" });

    const target = okUrl(String((req.body || {}).url || "").trim());
    if (!target) return res.status(400).json({ error: "اللينك غير صالح" });

    const t0 = Date.now(), left = () => 9000 - (Date.now() - t0);
    let image = "", blocked = false;
    for (const ua of UAS) {
      if (left() < 1500) break;
      try {
        const r = await get(target.href, ua, Math.min(3500, left()));
        if (!okUrl(r.url)) { blocked = true; continue; }
        const type = (r.headers.get("content-type") || "").split(";")[0].trim();
        if (/^image\//.test(type)) { image = r.url; break; }            // اللينك نفسه صورة مباشرة
        if (!r.ok) { blocked = true; continue; }
        const html = (await r.text()).slice(0, 1500000);
        const f = findImage(html);
        if (f) { image = new URL(f, r.url).href; break; }
      } catch (e) { blocked = true; }
    }
    if (!image) return res.status(200).json({ ok: false, error: blocked ? "الموقع منع الجلب التلقائي" : "مفيش صورة في صفحة المنتج" });

    let data = null;
    for (const ua of [UAS[0], UAS[1]]) {
      if (left() < 1200) break;
      try { data = await downloadImage(image, ua, Math.min(4000, left()), target.origin + "/"); if (data) break; } catch (e) { /* نجرّب اللي بعده */ }
    }
    return res.status(200).json({ ok: true, image, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "خطأ في السيرفر" });
  }
};
