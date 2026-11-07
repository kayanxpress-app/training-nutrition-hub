// استيراد برنامج من PDF: يقرأ الملف بالذكاء الاصطناعي ويرجّعه بنفس بنية التطبيق.
// المتغيرات المطلوبة في Vercel: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY (واختياري ANTHROPIC_MODEL)
const { createClient } = require("@supabase/supabase-js");
const { PDFDocument, PDFName, PDFDict, PDFArray, PDFString, PDFHexString, PDFNumber } = require("pdf-lib");

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

async function extractLinks(buf) {
  const out = [];
  try {
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
    doc.getPages().forEach((pg, pi) => {
      const an = pg.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
      if (!an) return;
      const seen = new Set();
      const page = [];
      for (let i = 0; i < an.size(); i++) {
        const a = an.lookupMaybe(i, PDFDict);
        if (!a) continue;
        const act = a.lookupMaybe(PDFName.of("A"), PDFDict);
        if (!act) continue;
        const u = act.lookupMaybe(PDFName.of("URI"), PDFString, PDFHexString);
        const r = a.lookupMaybe(PDFName.of("Rect"), PDFArray);
        if (!u || !r) continue;
        const n = [0, 1, 2, 3].map((k) => r.lookup(k, PDFNumber).asNumber());
        const uri = u.decodeText();
        if (seen.has(uri)) continue;
        seen.add(uri);
        page.push({ y: Math.max(n[1], n[3]), x: Math.min(n[0], n[2]), uri });
      }
      page.sort((a, b) => Math.round(b.y / 40) - Math.round(a.y / 40) || b.x - a.x);
      page.forEach((l, k) => out.push({ id: `p${pi + 1}-l${k + 1}`, y: Math.round(l.y), x: Math.round(l.x), uri: l.uri }));
    });
  } catch (e) { /* بدون لينكات */ }
  return out;
}

async function ask(b64, instruction, maxTokens) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
        { type: "text", text: instruction }
      ] }]
    })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || "AI error");
  const t = (j.content || []).map((c) => c.text || "").join("");
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("لم يتم التعرف على محتوى الملف");
  return JSON.parse(t.slice(s, e + 1));
}

const COMMON = `You read a personal coaching program PDF (training, nutrition, supplements) and output ONE JSON object only (no prose, no markdown fences).
Rules: copy text exactly as written in the PDF (Arabic or English); never translate unless told; never invent content. If a field is absent use "" (or null / [] as the schema shows).
Hyperlinks: the LINKS list below shows the hyperlinks embedded in the PDF with ids like p3-l2 (page 3, link 2 in top-to-bottom, right-to-left order; y = top edge in PDF points measured from the bottom of the page). When an item (video thumbnail, product button) has a link, put its id (e.g. "p3-l2") in the url/link field. Use the page images to decide which link belongs to which item. Never invent ids or URLs.`;

const P_TRAIN = `${COMMON}
Extract ONLY the training part. Schema:
{"brand":"program name shown big (e.g. FIGHT 2 FIT)","sub":"program subtitle line","info":{"sex":"","age":"","weight":"","height":"","start":"","end":"","days":30,"minutes":"weekly exercise minutes text","so2":"","rs":"","pulse":"","bp":""},
"reps":[n,n,n],"weeks":[[n,n,n]] or null,"rest":seconds or null,
"sessions":[{"t":"session title","s":"muscles/subtitle line","c":"cardio machine + level","cw":"when (before/after workout text)","cm":cardio minutes number,"cu":"link id","ex":[{"n":"exercise name","tag":"one of: جهاز | دامبل | بار | وزن حر | كابل | بدون أدوات","url":"link id"}],"ab":{"t":"abs/core instruction text","vids":[{"url":"link id"}]} or null}],
"blocks":[{"t":"title","b":"text"}]}
Tags: M/Machine=جهاز, D/Dumbbell=دامبل, B/Barbell=بار, C/Cable=كابل, bodyweight/free=وزن حر. List every session in order with ALL its exercises (including those on the "part 2" pages). reps = the fixed reps per set (or week 1 if a weekly progression table exists); weeks = the progression table rows if present. Put any other training notes/instructions in blocks, else [].
Keep numbers in the same digit style as the PDF.`;

const P_FOOD = `${COMMON}
Extract ONLY the nutrition part. Schema:
{"info":{"sex":"","so2":"","rs":"","pulse":"","bp":""},
"energy":{"bmr":"","act":"","tdee":"","plan":"plan calories","water":"e.g. 2700 ML","ptn":"","cho":"","exch":[["number","Arabic label"]]},
"meals":{"b":{"t":"الفطار","note":"","opts":["option text"]},"l":{"t":"الغداء","note":"","opts":[]},"d":{"t":"العشاء","note":"","opts":[]}},
"blocks":[{"t":"title","b":"text"}]}
exch labels in Arabic: protein=بروتين, grains/carbs=نشويات, vegetables=خضروات, fruits=فواكه, fat=دهون, dairy=ألبان.
Each meal option is ONE string with its components joined by " + " exactly as listed. note = a short note shown above a meal's options (e.g. protein cooked weight) else "".
If the plan is a day-by-day table (Day 1, Day 2...) instead of choose-one options, leave opts [] and add one block per day: {"t":"اليوم الأول","b":"الفطار: ...\\nالغداء: ...\\nالعشاء: ..."}.
Also add blocks for: diet name/type, allowed/forbidden foods, general instructions, snack rules, required lab tests, next follow-up date, doctor notes (anything nutrition-related not captured above). Else [].`;

const P_SUPP = `${COMMON}
Extract ONLY the supplements / recommendations part. Schema:
{"supp":[{"n":"product name as written","en":"English name if shown separately","how":"usage text","warn":"special request/warning if any","badge":"short badge like حتى النفاذ if any","link":"link id of its buy/view button","ll":"button text as shown (e.g. عرض على iHerb)"}],
"blocks":[{"t":"title","b":"text"}]}
blocks: other recommendation notes not belonging to a product (required tests, follow-up date, disclaimers). Else [].`;

function resolve(o, map) {
  if (Array.isArray(o)) return o.map((x) => resolve(x, map));
  if (o && typeof o === "object") {
    const r = {};
    for (const k of Object.keys(o)) {
      if (["url", "cu", "link"].includes(k) && typeof o[k] === "string") {
        r[k] = map[o[k]] || (/^https?:\/\//.test(o[k]) ? o[k] : "");
      } else r[k] = resolve(o[k], map);
    }
    return r;
  }
  return o;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "غير مصرح" });
    const sb = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { global: { headers: { Authorization: "Bearer " + token } } });
    const { data: u, error: ue } = await sb.auth.getUser(token);
    if (ue || !u || !u.user) return res.status(401).json({ error: "غير مصرح" });
    const { data: prof } = await sb.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
    if (!prof || prof.role !== "admin") return res.status(403).json({ error: "للأدمن فقط" });

    const path = req.body && req.body.path;
    if (typeof path !== "string" || path.includes("..")) return res.status(400).json({ error: "مسار غير صحيح" });
    const { data: blob, error: de } = await sb.storage.from("docs").download(path);
    if (de || !blob) return res.status(404).json({ error: "تعذر قراءة الملف المرفوع" });
    const buf = Buffer.from(await blob.arrayBuffer());
    const b64 = buf.toString("base64");

    const links = await extractLinks(buf);
    const map = {};
    links.forEach((l) => (map[l.id] = l.uri));
    const list = links.length ? "LINKS:\n" + links.map((l) => `${l.id} y=${l.y} x=${l.x} ${l.uri}`).join("\n") : "LINKS: (none)";

    const [tr, fd, sp] = await Promise.all([
      ask(b64, P_TRAIN + "\n\n" + list, 7000),
      ask(b64, P_FOOD + "\n\n" + list, 7000),
      ask(b64, P_SUPP + "\n\n" + list, 3000)
    ]);

    const t = resolve(tr, map), f = resolve(fd, map), s = resolve(sp, map);
    const info = Object.assign({}, f.info || {}, t.info || {});
    ["sex", "so2", "rs", "pulse", "bp"].forEach((k) => { if (!info[k] && f.info && f.info[k]) info[k] = f.info[k]; });
    const data = {
      brand: t.brand || "", sub: t.sub || "",
      info: Object.assign({ age: "", weight: "", height: "", start: "", end: "", days: 30, minutes: "" }, info),
      reps: Array.isArray(t.reps) && t.reps.length ? t.reps : [12, 10, 10],
      energy: Object.assign({ bmr: "", act: "", tdee: "", plan: "", water: "", ptn: "", cho: "", exch: [] }, f.energy || {}),
      sessions: (t.sessions || []).map((x) => Object.assign({ t: "", s: "", c: "", cw: "", cm: 15, cu: "", ci: "", ex: [], ab: null }, x, {
        ex: (x.ex || []).map((e) => ({ n: e.n || "", tag: e.tag || "جهاز", cls: { "جهاز": "t1", "دامبل": "t2", "بار": "t3", "وزن حر": "t4", "كابل": "t5", "بدون أدوات": "t4" }[e.tag] || "t1", url: e.url || "", img: "" }))
      })),
      meals: Object.assign({ b: { t: "الفطار", note: "", opts: [] }, l: { t: "الغداء", note: "", opts: [] }, d: { t: "العشاء", note: "", opts: [] } }, f.meals || {}),
      supp: (s.supp || []).map((x) => Object.assign({ n: "", en: "", how: "", warn: "", badge: "", link: "", ll: "", img: "" }, x)),
      blocks: { train: t.blocks || [], food: f.blocks || [], supp: s.blocks || [] }
    };
    if (Array.isArray(t.weeks) && t.weeks.length) data.weeks = t.weeks;
    if (t.rest) data.rest = t.rest;
    return res.status(200).json({ data, links: links.length });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e).slice(0, 300) });
  }
};
