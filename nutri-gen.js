/* nutri-gen.js — مولّد خيارات الوجبات المتوازنة (ملف مستقل)
   - مابيعدّلش أي بيانات ولا بيحفظ حاجة: بيرجّع نص خيارات بس، والواجهة هي اللي بتكتبه في خانة النص.
   - كل رقم بيتحسب ويتراجع بنفس محرك الحساب (NX.calcOpt) فالنتيجة هي نفسها اللي التطبيق هيحسبها.
   - لو NX مش موجود مفيش أي تأثير (الملف بيقفل نفسه). */
(function (root) {
  "use strict";
  var NXe = root.NX || (typeof require !== "undefined" ? require("./nutri.js") : null);
  if (!NXe || !NXe.calcOpt) return;

  /* ============ قاعدة الأصناف المصنّفة ============
     add(مجموعة, وجبات(b=فطار l=غداء d=عشاء), الاسم كما في القاعدة, وحدة, خطوة, أقل, أكثر, وسوم, {خيارات})
     r: 1=بروتين أساسي 2=بروتين مساعد 12=الاتنين | cat: y=زبادي m=حليب | fam: عيلة البروتين */
  var POOL = [], VEG = [];
  function T(s) { return s ? s.split(" ") : []; }
  function add(g, meals, lab, unit, step, min, max, tags, o) {
    POOL.push(Object.assign({ g: g, meals: meals, lab: lab, unit: unit, step: step, min: min, max: max, tags: T(tags) }, o || {}));
  }
  function addV(meals, lab, kind, tags) { VEG.push({ meals: meals, lab: lab, kind: kind, tags: T(tags) }); }

  /* --- بروتين --- */
  add("p", "bd", "فول", "g", 10, 80, 250, "lgm gas fod fe lowgi", { r: "12", fam: "leg" });
  add("p", "bd", "بيض", "pc", 1, 1, 3, "egg anm", { r: "12", fam: "egg", lab2: "بيض", lab1: "بيضه" });
  add("p", "bd", "بياض بيض", "pc", 1, 2, 6, "egg anm eggw", { r: "2", fam: "egg", lab2: "بياض بيض", lab1: "بياض بيض" });
  add("p", "bd", "جبنه قريش", "g", 10, 50, 200, "mlk lh anm", { r: "12", fam: "dai" });
  add("p", "bd", "موتزاريلا قليله الدسم", "g", 10, 30, 100, "mlk anm hna", { r: "1", fam: "dai" });
  add("p", "bd", "ريكوتا", "g", 10, 30, 120, "mlk lh anm", { r: "1", fam: "dai" });
  add("p", "bd", "تركي مدخن", "g", 10, 30, 120, "flesh prc hna raw", { r: "12", fam: "pou" });
  add("p", "bld", "تونه", "g", 10, 50, 150, "flesh fsh hna hg1", { r: "12", fam: "fsh" });
  add("p", "b", "سلمون مدخن", "g", 10, 30, 100, "flesh fsh prc hna raw o3", { r: "2", fam: "fsh" });
  add("p", "bd", "واي بروتين", "sc", 0.5, 0.5, 2, "mlk anm", { r: "2", fam: "whey", lab1: "سكوب واي بروتين", lab2: "سكوب واي بروتين", sport: true });
  add("p", "ld", "صدر فراخ", "g", 10, 80, 220, "flesh", { r: "1", fam: "pou" });
  add("p", "l", "ورك فراخ", "g", 10, 80, 200, "flesh mfat", { r: "1", fam: "pou" });
  add("p", "ld", "درمستيك", "g", 10, 80, 200, "flesh", { r: "1", fam: "pou" });
  add("p", "ld", "صدر حبش", "g", 10, 80, 220, "flesh", { r: "1", fam: "pou" });
  add("p", "l", "لحم قليل الدهن", "g", 10, 80, 200, "flesh red fe", { r: "1", fam: "red" });
  add("p", "l", "ضاني", "g", 10, 70, 180, "flesh red mfat fe", { r: "1", fam: "red" });
  add("p", "l", "كبده", "g", 10, 70, 150, "flesh org pur fe", { r: "1", fam: "red" });
  add("p", "l", "كبدة فراخ", "g", 10, 70, 150, "flesh org pur fe", { r: "1", fam: "pou" });
  add("p", "ld", "سلمون", "g", 10, 80, 180, "flesh fsh o3 fatty ldl", { r: "1", fam: "fsh" });
  add("p", "ld", "بلطي", "g", 10, 100, 250, "flesh fsh", { r: "1", fam: "fsh" });
  add("p", "ld", "قاروص", "g", 10, 100, 250, "flesh fsh", { r: "1", fam: "fsh" });
  add("p", "ld", "سمك ابيض", "g", 10, 100, 250, "flesh fsh", { r: "1", fam: "fsh" });
  add("p", "ld", "جمبري", "g", 10, 80, 220, "flesh shl pur", { r: "1", fam: "shl" });
  add("p", "ld", "تونه طازجه", "g", 10, 80, 200, "flesh fsh hg", { r: "1", fam: "fsh" });
  add("p", "ld", "سردين", "g", 10, 80, 160, "flesh fsh o3 pur fatty ldl", { r: "1", fam: "fsh" });
  add("p", "l", "ماكريل", "g", 10, 70, 150, "flesh fsh o3 pur fatty hg", { r: "1", fam: "fsh" });
  add("p", "ld", "عدس", "g", 10, 100, 300, "lgm gas fod fe lowgi ldl", { r: "1", fam: "leg" });
  add("p", "bld", "حمص", "g", 10, 80, 220, "lgm gas fod lowgi ldl", { r: "1", fam: "leg" });
  add("p", "ld", "فاصوليا بيضاء", "g", 10, 100, 250, "lgm gas fod fe lowgi ldl", { r: "1", fam: "leg" });
  add("p", "ld", "لوبيا", "g", 10, 100, 250, "lgm gas fod fe lowgi ldl", { r: "1", fam: "leg" });
  add("p", "bld", "ايدامامي", "g", 10, 80, 200, "soy lgm", { r: "1", fam: "soy" });
  add("p", "bld", "توفو", "g", 10, 80, 250, "soy", { r: "12", fam: "soy" });
  /* --- بروتين نباتي إضافي (للنباتي والفيجان وأي نظام: تنويع الخيارات) --- */
  add("p", "bld", "تمبيه", "g", 10, 70, 200, "soy lgm fod", { r: "1", fam: "soy" });
  add("p", "bd", "طعميه", "g", 10, 60, 200, "lgm gas fod mfat", { r: "1", fam: "leg" });
  add("p", "bd", "حمص بالطحينه", "g", 10, 40, 150, "lgm gas fod ses", { r: "12", fam: "leg" });
  add("p", "ld", "ماش", "g", 10, 100, 280, "lgm gas fod lowgi fe ldl", { r: "1", fam: "leg" });
  add("p", "ld", "فاصوليا حمراء", "g", 10, 100, 250, "lgm gas fod fe lowgi ldl", { r: "1", fam: "leg" });
  add("p", "ld", "فاصوليا سوداء", "g", 10, 100, 250, "lgm gas fod fe lowgi ldl", { r: "1", fam: "leg" });
  add("p", "ld", "فاصوليا بنتو", "g", 10, 100, 250, "lgm gas fod fe lowgi ldl", { r: "1", fam: "leg" });
  /* ألبان وبيض كبروتين أساسي في الغداء: للنباتي (لاكتو-أوفو) بس (العشاء والفطار فيهم الأصناف دي أصلًا) — dg = الأنظمة المسموح بيها الصنف */
  add("p", "bd", "زبادي يوناني خالي الدسم", "g", 10, 100, 250, "mlk anm", { r: "12", fam: "dai" });
  add("p", "l", "زبادي يوناني خالي الدسم", "g", 10, 100, 250, "mlk anm", { r: "12", fam: "dai", dg: ["veg"] });
  add("p", "l", "جبنه قريش", "g", 10, 80, 250, "mlk lh anm", { r: "1", fam: "dai", dg: ["veg"] });
  add("p", "l", "ريكوتا", "g", 10, 60, 200, "mlk lh anm", { r: "1", fam: "dai", dg: ["veg"] });
  add("p", "l", "موتزاريلا قليله الدسم", "g", 10, 50, 150, "mlk anm hna", { r: "1", fam: "dai", dg: ["veg"] });
  add("p", "bld", "جبنه بيضه", "g", 10, 30, 100, "mlk anm mfat hna", { r: "2", fam: "dai", dg: ["veg"] });
  add("p", "l", "بيض", "pc", 1, 2, 4, "egg anm", { r: "12", fam: "egg", lab2: "بيض", lab1: "بيضه", dg: ["veg"] });
  add("p", "l", "بياض بيض", "pc", 1, 3, 8, "egg anm eggw", { r: "2", fam: "egg", lab2: "بياض بيض", lab1: "بياض بيض", dg: ["veg"] });

  /* --- نشويات --- */
  add("s", "bd", "توست بني", "pc", 1, 1, 4, "gl wg fib fod", { lab1: "توست بني", lab2: "توست بني" });
  add("s", "bld", "خبز بني", "g", 10, 30, 120, "gl wg fib fod", {});
  add("s", "bld", "عيش شامي", "g", 10, 30, 120, "gl fod", {});
  add("s", "bd", "فينو", "g", 10, 30, 100, "gl hgi fod", {});
  add("s", "b", "رايس كيك", "pc", 1, 2, 8, "hgi", { lab1: "رايس كيك", lab2: "رايس كيك" });
  add("s", "bd", "شوفان", "g", 10, 30, 90, "gl oats fib lowgi ldl", {});
  add("s", "bld", "بطاطا", "g", 10, 100, 300, "fib", {});
  add("s", "ld", "بطاطس", "g", 10, 100, 300, "hgi", {});
  add("s", "ld", "رز", "g", 10, 60, 220, "hgi", {});
  add("s", "ld", "رز بني", "g", 10, 60, 220, "wg fib lowgi", {});
  add("s", "ld", "مكرونه", "g", 10, 60, 220, "gl fod", {});
  add("s", "ld", "مكرونه بر", "g", 10, 60, 220, "gl wg fib lowgi fod", {});
  add("s", "ld", "كسكسي", "g", 10, 60, 220, "gl fod", {});
  add("s", "ld", "برغل", "g", 10, 80, 250, "gl wg fib lowgi fod", {});
  add("s", "ld", "كينوا", "g", 10, 60, 220, "fib lowgi", {});
  add("s", "ld", "شعير", "g", 10, 60, 220, "gl wg fib lowgi fod", {});
  add("s", "ld", "قمح سراسين", "g", 10, 60, 200, "wg fib lowgi", {});
  add("s", "ld", "دخن", "g", 10, 60, 220, "fib lowgi", {});
  add("s", "bld", "ذره", "g", 10, 80, 250, "fib", {});
  add("s", "b", "كورن فليكس", "g", 10, 20, 80, "gl hgi fod", {});
  add("s", "ld", "بطاطس مشويه", "g", 10, 100, 300, "hgi", {});
  add("s", "ld", "بسله", "g", 10, 100, 300, "fib lowgi fod", {});

  /* --- فاكهة --- */
  var FRUITS = [
    ["تين", "fod fib"], ["برقوق", "fod lowgi"], ["توت", "lcf bry lowgi"], ["بابايا", "vc lowgi"], ["كريز", "fod lowgi"],
    ["تفاح", "fod lowgi ldl fib"], ["برتقال", "vc acid lowgi ldl"], ["يوسفي", "vc acid lowgi"], ["جريب فروت", "vc acid lowgi gfr"],
    ["عنب", "hgi fod"], ["فراوله", "vc lcf bry lowgi"], ["توت ازرق", "lcf bry lowgi"], ["توت احمر", "lcf bry lowgi"], ["بطيخ", "hgi fod"],
    ["شمام", "vc"], ["مانجو", "hgi fod vc"], ["اناناس", "vc acid"], ["خوخ", "fod lowgi"], ["مشمش", "fod"], ["كمثري", "fod lowgi ldl fib"],
    ["كيوي", "vc lowgi"], ["رمان", ""], ["جوافه", "vc lowgi fib"], ["موز", "hgi"]
  ];
  var FMAX = { "تفاح": 200, "برتقال": 200, "يوسفي": 200, "جريب فروت": 200, "عنب": 150, "فراوله": 200, "توت ازرق": 150, "توت احمر": 150, "بطيخ": 250, "شمام": 250, "مانجو": 150, "اناناس": 200, "خوخ": 200, "مشمش": 150, "كمثري": 200, "كيوي": 150, "رمان": 120, "جوافه": 150, "موز": 120, "تين": 150, "برقوق": 180, "توت": 150, "بابايا": 200, "كريز": 150 };
  FRUITS.forEach(function (f) { add("fr", "bld", f[0], "g", 10, 50, FMAX[f[0]] || 180, f[1], {}); });

  /* --- دهون صحية فقط (مفيش زبدة/سمن/مايونيز/كريمة/جوز هند) --- */
  add("f", "bld", "زيت زيتون", "g", 5, 5, 25, "mufa ldl", {});
  add("f", "bld", "لوز", "g", 5, 5, 40, "nut mufa ldl", {});
  add("f", "bld", "عين جمل", "g", 5, 5, 40, "nut o3 ldl", {});
  add("f", "bld", "كاجو", "g", 5, 5, 40, "nut fod hcf", {});
  add("f", "bld", "فستق", "g", 5, 5, 40, "nut fod hcf", {});
  add("f", "bld", "بندق", "g", 5, 5, 40, "nut", {});
  add("f", "bld", "بيكان", "g", 5, 5, 40, "nut", {});
  add("f", "bld", "ماكاداميا", "g", 5, 5, 30, "nut", {});
  add("f", "bld", "جوز برازيلي", "g", 5, 5, 25, "nut", {});
  add("f", "bld", "افوكادو", "g", 10, 20, 150, "mufa ldl fod", {});
  add("f", "ld", "زيتون", "g", 10, 20, 80, "mufa hna", {});
  add("f", "bld", "طحينه", "g", 5, 5, 30, "ses", {});
  add("f", "bld", "زبده فول سوداني", "g", 5, 5, 30, "pnt", {});
  add("f", "bld", "زبده اللوز", "g", 5, 5, 30, "nut", {});
  add("f", "bld", "فول سوداني", "g", 5, 5, 40, "pnt hcf", {});
  add("f", "bld", "لب عباد الشمس", "g", 5, 5, 30, "seed", {});
  add("f", "bld", "لب قرع", "g", 5, 5, 30, "seed", {});
  add("f", "bld", "سمسم", "g", 5, 5, 25, "seed ses", {});
  add("f", "bld", "بذور الكتان", "g", 5, 5, 20, "seed o3 fib ldl", {});
  add("f", "bld", "شيا", "g", 5, 5, 25, "seed o3 fib ldl", {});

  /* --- ألبان (y زبادي / m حليب أو بديل) --- */
  add("d", "bld", "زبادي خالي الدسم", "g", 25, 100, 250, "mlk anm ca dc", { cat: "y" });
  add("d", "bld", "زبادي قليل الدسم", "g", 25, 100, 250, "mlk anm ca dc", { cat: "y" });
  add("d", "bld", "حليب خالي الدسم", "ml", 50, 100, 250, "mlk lh anm ca dc", { cat: "m" });
  add("d", "bld", "حليب قليل الدسم", "ml", 50, 100, 250, "mlk lh anm ca dc", { cat: "m" });
  add("d", "bld", "حليب صويا", "ml", 50, 100, 300, "soy", { cat: "m", alt: true });
  add("d", "bld", "حليب لوز", "ml", 50, 100, 300, "nut", { cat: "m", alt: true });
  add("d", "bld", "حليب شوفان", "ml", 50, 100, 300, "gl oats", { cat: "m", alt: true });

  /* --- خضار (سلطة) --- */
  ["خس", "خيار", "جرجير", "فلفل اخضر", "فلفل احمر"].forEach(function (n) { addV("bld", n, "raw", ""); });
  addV("bld", "جزر", "raw", "hcv");
  addV("bld", "كرنب احمر", "raw", "gas");
  addV("bld", "فجل", "raw", "");
  addV("bld", "طماطم", "raw", "acid");
  addV("ld", "كرنب", "raw", "gas fod");
  ["بروكلي:gas", "قرنبيط:gas fod", "كوسه:", "سبانخ:fe", "باذنجان:", "فاصوليا:fod", "مشروم:fod", "بامبه:", "قرع:hcv", "بنجر:hcv"].forEach(function (s) {
    var p = s.split(":"); addV("ld", p[0], "cook", p[1]);
  });

  /* ============ تجهيز الأصناف: كل صنف بيتحقق منه بمحرك الحساب ============ */
  var UID = 0, DROPPED = [], ALLP = null, ALLV = null;
  function probe(it) {
    var txt = it.unit === "pc" ? "1 " + (it.lab1 || it.lab) : it.unit === "sc" ? "1 " + it.lab1 : "100 " + (it.unit === "ml" ? "مل" : "ج") + " " + it.lab;
    var r;
    try { r = NXe.calcOpt(txt); } catch (e) { return null; }
    var x = r && r.items && r.items[0];
    if (!x || !x.ok || x.weak || x.est) return null;
    var q = (it.unit === "pc" || it.unit === "sc") ? 1 : 100;
    return { k: r.t.k / q, p: r.t.p / q, c: r.t.c / q, f: r.t.f / q };
  }
  function prepare() {
    if (!ALLP) { ALLP = POOL.slice(); ALLV = VEG.slice(); }
    DROPPED = [];
    POOL = ALLP.filter(function (it) {
      var m = probe(it);
      if (!m) { DROPPED.push(it.g + ":" + it.lab); return false; }
      it.mu = m; it.id = it.id || ++UID; it.key = it.g + ":" + it.lab; return true;
    });
    VEG = ALLV.filter(function (v) {
      var r; try { r = NXe.calcOpt("100 ج " + v.lab); } catch (e) { return false; }
      var x = r && r.items && r.items[0];
      if (!x || !x.ok || x.weak || x.est) { DROPPED.push("v:" + v.lab); return false; }
      v.mu = { k: r.t.k / 100, p: r.t.p / 100, c: r.t.c / 100, f: r.t.f / 100 }; v.key = "v:" + v.lab; return true;
    });
  }

  /* ============ الأنظمة العلاجية والغذائية ============
     split=[بروتين%,كارب%,دهون%] من السعرات | ban=وسوم ممنوعة | pen=وسوم مفضّل تجنبها | bst=وسوم مفضّل وجودها
     cap=أقصى عدد خيارات فيها وسم | grp=تعديل مدى الكميات {مجموعة:[ضرب الأقل, ضرب الأكثر]} | off=مجموعات مقفولة */
  var DIETS = [
    { id: "reg", cat: "عام", n: "عادي / متوازن (من خطة العميل)", split: null, ban: [], note: "متوازن بدون قيود خاصة. القيم بتتاخد من خطة العميل لو متاحة." },
    { id: "med", cat: "أنظمة", n: "Mediterranean", split: [18, 45, 37], ban: [], pen: { red: 2, prc: 3, hgi: 1 }, bst: { o3: 1.2, lgm: 0.8, wg: 0.6, mufa: 0.8 }, note: "زيت زيتون وسمك وبقوليات وحبوب كاملة؛ اللحوم الحمراء والمصنعة في أضيق نطاق." },
    { id: "dash", cat: "أنظمة", n: "DASH (ضغط)", split: [18, 55, 27], ban: ["prc", "hna"], pen: { red: 2, mfat: 1 }, bst: { wg: 0.6, lgm: 0.6, nut: 0.5 }, note: "بدون أصناف عالية الصوديوم. الصوديوم مش محسوب في الأداة: بدون ملح والتتبيل بالأعشاب." },
    { id: "sb1", cat: "أنظمة", n: "South Beach (مرحلة ١)", split: [32, 14, 54], ban: ["hgi", "prc", "hcv"], off: ["s", "fr"], pen: { red: 1, mfat: 1, lgm: 1, hcf: 1 }, bst: { o3: 0.8, nut: 0.5, mufa: 0.6 }, note: "المرحلة ١: بدون نشويات وبدون فاكهة، والكارب من الخضار والألبان قليلة الدسم والمكسرات بس. بدون جزر وبنجر وقرع. البقوليات مسموحة بأقل نطاق (عدّلها من «اختيار الأطعمة» لو عايز تمنعها). عادةً بتستمر ١٤ يوم." },
    { id: "sb", cat: "أنظمة", n: "South Beach (مرحلة ٢/٣)", split: [28, 35, 37], ban: ["hgi", "prc"], pen: { red: 1, mfat: 1 }, bst: { lowgi: 1, o3: 0.8, nut: 0.5 }, note: "بروتين قليل الدهن ودهون صحية وكارب منخفض المؤشر الجلايسيمي. النشويات والفاكهة بترجع بالتدريج. للمرحلة ١ (بدون نشويات وفاكهة) اختار «South Beach (مرحلة ١)»." },
    { id: "cchi", cat: "أنظمة", n: "Carb cycle — يوم كارب عالي", split: [25, 55, 20], ban: [], bst: { lowgi: 0.3 }, note: "يوم كارب عالي (مثلاً يوم تمرين ثقيل)." },
    { id: "ccmid", cat: "أنظمة", n: "Carb cycle — يوم كارب متوسط", split: [30, 40, 30], ban: [], bst: { lowgi: 0.5 }, note: "يوم كارب متوسط." },
    { id: "cclo", cat: "أنظمة", n: "Carb cycle — يوم كارب منخفض", split: [35, 20, 45], ban: ["hgi"], grp: { s: [0.4, 0.7], fr: [0.5, 0.8] }, bst: { lowgi: 0.8, lcf: 0.6 }, note: "يوم كارب منخفض: النشويات والفاكهة بكميات صغيرة." },
    { id: "lc", cat: "أنظمة", n: "Low carb", split: [30, 25, 45], ban: ["hgi"], grp: { s: [0.4, 0.7], fr: [0.5, 0.8] }, bst: { lowgi: 0.8, lcf: 0.6 }, note: "كارب حوالي ٢٥٪ من السعرات: نشويات صغيرة وفاكهة قليلة السكر." },
    { id: "keto", cat: "أنظمة", n: "Keto", split: [20, 6, 74], ban: ["hgi", "dc", "lgm", "hcf", "hcv"], off: ["s"], fat2: true, frTag: "lcf", grp: { fr: [0, 0.4], f: [1, 1.5], d: [1, 0.8] }, bst: { fatty: 0.5, mfat: 0.5, o3: 0.4 }, note: "كارب حوالي ٦٪: بدون نشويات، فاكهة توت بكمية صغيرة، وألبان بحليب اللوز بس (الزبادي والحليب كارب عالي). راجع الكيتونات والأملاح." },
    { id: "if", cat: "أنظمة", n: "صيام متقطع (IF)", split: [28, 42, 30], ban: ["hgi"], bst: { lowgi: 0.8, fib: 0.5 }, note: "الصيام المتقطع نظام توقيت؛ الأداة بتجهز وجبة عالية البروتين والشبع، ونافذة الأكل بتحددها انت." },
    { id: "sport", cat: "أنظمة", n: "تغذية رياضية", split: [25, 55, 20], ban: [], sport: true, note: "كارب وبروتين مرتفعين للتدريب والاستشفاء. واي بروتين متاح كبروتين مساعد." },
    { id: "preg", cat: "حالات فسيولوجية", n: "حمل", split: [18, 52, 30], ban: ["prc", "raw", "org", "hg"], cap: { hg1: 1 }, bst: { fe: 0.8, ca: 0.4, o3: 0.5 }, note: "بدون مدخنات/كبدة/أسماك عالية الزئبق. الأكل لازم يكون مطبوخ كويس. السعرات الإضافية (+٣٤٠ لـ ٤٥٠ في الثلث الثاني/الثالث) بتحددها انت." },
    { id: "lact", cat: "حالات فسيولوجية", n: "رضاعة", split: [20, 50, 30], ban: ["hg", "raw"], cap: { hg1: 1 }, bst: { o3: 0.6, ca: 0.4, fe: 0.5, oats: 0.8 }, note: "السعرات الإضافية حوالي +٣٣٠ لـ ٤٠٠ سعرة. أسماك الزئبق العالي محظورة." },
    { id: "gb", cat: "حالات طبية", n: "مرارة (دهون منخفضة)", split: [25, 60, 15], ban: ["egg", "fatty", "mfat", "org", "gas", "prc"], grp: { f: [1, 0.5] }, note: "دهون قليلة وموزعة، بدون بيض كامل ولا أسماك دهنية ولا مقليات. بياض البيض مسموح. تحمل كل حالة بيختلف." },
    { id: "gi", cat: "حالات طبية", n: "جهاز هضمي (هضمي لطيف)", split: [20, 55, 25], ban: ["gas", "fatty", "mfat"], pen: { fib: 1 }, note: "بدون أصناف مسببة غازات أو دسمة. الأفضل الطبخ الجيد وكميات صغيرة موزعة." },
    { id: "ibs", cat: "حالات طبية", n: "قولون عصبي (Low-FODMAP تقريبي)", split: [20, 50, 30], ban: ["fod", "gas", "lh"], note: "استبعاد أصناف FODMAP العالية (تقريبي). الحساسية فردية والتصنيف مش شامل." },
    { id: "gerd", cat: "حالات طبية", n: "ارتجاع المريء", split: [20, 50, 30], ban: ["acid", "fatty", "mfat"], note: "بدون الأصناف الحمضية والدسمة. تجنب الوجبات الكبيرة قبل النوم." },
    { id: "chol", cat: "حالات طبية", n: "كوليسترول / دهون ثلاثية", split: [20, 52, 28], ban: ["org", "prc"], cap: { egg: 2 }, pen: { red: 2, shl: 1, mfat: 1 }, bst: { ldl: 1, o3: 0.6, mufa: 0.4 }, note: "بدون كبدة ومصنعات، البيض في أقل عدد خيارات، تفضيل الشوفان والبقوليات والمكسرات وزيت الزيتون والسمك." },
    { id: "anem", cat: "حالات طبية", n: "أنيميا (نقص حديد)", split: [20, 50, 30], ban: [], bst: { fe: 1.2, vc: 1 }, note: "مصادر حديد + فيتامين C في نفس الوجبة. الألبان والشاي بيقللوا امتصاص الحديد (فاصل ساعتين)؛ الألبان موجودة بحكم المجموعات الستة — عدّلها لو لازم." },
    { id: "dm", cat: "حالات طبية", n: "سكري / مقاومة إنسولين (Low-GI)", split: [20, 45, 35], ban: ["hgi"], bst: { lowgi: 1.2, fib: 0.6 }, note: "كارب منخفض المؤشر وموزع بالتساوي بين الوجبات. الأدوية والجرعات خارج نطاق الأداة." },
    { id: "gout", cat: "حالات طبية", n: "نقرس (بيورين منخفض)", split: [20, 52, 28], ban: ["pur", "org"], pen: { red: 1.5 }, note: "بدون كبدة وسردين وماكريل وجمبري. البقوليات محسوبة مسموحة (بيورينها النباتي أقل خطورة)." },
    { id: "fliver", cat: "حالات طبية", n: "كبد دهني (دهون على الكبد)", split: [22, 42, 36], ban: ["hgi", "prc"], pen: { red: 2, mfat: 1, hcf: 0.5 }, bst: { o3: 1.2, mufa: 1, lowgi: 1, fib: 0.6, wg: 0.5, nut: 0.4 }, grp: { s: [0.8, 0.9] }, note: "أسلوب متوسطي: بدون نشويات سريعة السكر ولا مصنعات، تقليل اللحوم الحمراء، وتفضيل السمك والزيوت والمكسرات والألياف والحبوب الكاملة. السعرات بتحددها بما يناسب نزول الوزن التدريجي. العصائر والسكريات والمشروبات المحلّاة والدهون المتحولة خارج حساب الأداة: ممنوعة." },
    { id: "hypot", cat: "حالات طبية", n: "قصور الغدة الدرقية", split: [25, 40, 35], ban: ["hgi"], pen: { soy: 1, gas: 0.5, red: 0.5 }, bst: { fsh: 0.8, egg: 0.6, mlk: 0.4, fib: 0.8, lowgi: 0.6, nut: 0.3 }, note: "بروتين كفاية وكارب معتدل منخفض المؤشر وألياف عالية (للإمساك). مصادر اليود والسيلينيوم (سمك وبيض وألبان) مفضّلة، والصويا والخضار الصليبية النيئة بأقل نطاق. أدوية الغدة (ليفوثيروكسين) على معدة فاضية وبفاصل ٤ ساعات عن الكالسيوم والحديد والصويا: بتتابعها انت." },
    { id: "ovw", cat: "حالات طبية", n: "زيادة الوزن (عجز سعرات)", split: [30, 40, 30], ban: ["hgi"], pen: { mfat: 1, hcf: 1, red: 1 }, bst: { fib: 1, lowgi: 0.8, fsh: 0.4 }, grp: { s: [0.8, 0.9], f: [1, 0.7] }, note: "بروتين عالي وألياف وكارب منخفض المؤشر ودهون مضبوطة لزيادة الشبع. السعرات المستهدفة (العجز) بتحطها انت أو بتتاخد من خطة العميل." },
    { id: "lactose", cat: "حساسية", n: "حساسية لاكتوز", split: null, ban: ["lh"], note: "بدون حليب وجبنة قريش وريكوتا؛ الزبادي مسموح (لاكتوزه أقل) والبدائل النباتية متاحة. لو الحالة شديدة اختار «حساسية أكل» ← لبن." },
    { id: "gluten", cat: "حساسية", n: "سيلياك / حساسية جلوتين", split: null, ban: ["gl"], note: "بدون قمح ومشتقاته، والشوفان محذوف احتياطًا لتلوثه بالجلوتين. راجع ملصقات المنتجات." },
    { id: "allergy", cat: "حساسية", n: "حساسية أكل (اختار الأنواع)", split: null, ban: [], allergy: true, note: "الأنواع اللي تختارها بتتشال من كل الخيارات." },
    { id: "veg", cat: "نباتي", n: "نباتي (لاكتو-أوفو)", split: null, ban: ["flesh"], note: "بدون لحوم وأسماك ودواجن؛ بيض وألبان مسموحة." },
    { id: "vegan", cat: "نباتي", n: "نباتي صرف (Vegan)", split: null, ban: ["flesh", "anm"], note: "بدون أي منتج حيواني. لازم متابعة B12 والحديد والكالسيوم والأوميجا ٣." },
    { id: "bar1", cat: "ما بعد عمليات السمنة", n: "ما بعد السمنة — مرحلة المهروس/اللين", split: [38, 32, 30], ban: ["hgi", "gas", "fatty", "mfat", "raw", "prc", "nut", "seed", "pnt", "ses", "hcf", "hna", "org"], vk: "cook", vm: 0.5, grp: { p: [0.3, 0.5], s: [0.3, 0.5], fr: [0.4, 0.6], f: [0.5, 0.6], d: [0.5, 0.8] }, bst: { lh: 0.3, anm: 0.5 }, note: "مرحلة المهروس واللين (عادةً بعد السوائل): البروتين أولًا بكميات صغيرة، قوام ناعم، بدون سكر ولا دهون ولا أكل مسبب غازات، والخضار مطبوخ بس. السعرات صغيرة (أقل من الحد العملي)، فرجّع للتحذيرات. مدة المرحلة والتدرج بتحددها فريق الجراحة/التغذية. ما تشربش مع الأكل (فاصل ٣٠ دقيقة)." },
    { id: "bar2", cat: "ما بعد عمليات السمنة", n: "ما بعد السمنة — مرحلة الأطعمة اللينة/التدرج", split: [35, 35, 30], ban: ["hgi", "prc", "gas", "fatty", "mfat", "hcf", "hna", "seed"], vm: 0.7, grp: { p: [0.4, 0.7], s: [0.4, 0.6], fr: [0.5, 0.7], f: [0.5, 0.7], d: [0.6, 0.9] }, bst: { anm: 0.5, lowgi: 0.6 }, note: "رجوع تدريجي للأكل الصلب اللين: بروتين أولًا ثم الخضار ثم النشويات. بدون سكريات وأكل دسم أو مقلي أو غازات. وجبات صغيرة، مضغ كويس، ومتابعة تحمل كل صنف. التوقيت بتحدده الجراحة/التغذية." },
    { id: "bar3", cat: "ما بعد عمليات السمنة", n: "ما بعد السمنة — صيانة طويلة المدى", split: [30, 38, 32], ban: ["hgi", "prc"], pen: { mfat: 1, hcf: 1, red: 1 }, bst: { fib: 0.6, lowgi: 1, o3: 0.5 }, vm: 0.8, grp: { p: [0.6, 0.9], s: [0.5, 0.7], fr: [0.6, 0.8], f: [0.7, 0.9], d: [0.7, 1] }, note: "بروتين عالي أولًا، كارب منخفض المؤشر بكميات صغيرة، ودهون صحية مضبوطة. ركّز على الفيتامينات والمعادن (B12 والحديد والكالسيوم وD) بالمكملات اللي بيحددها الطبيب: خارج حساب الأداة." },
    { id: "kid1", cat: "أطفال ومراهقين", n: "طفل ٦–١٢ شهر (تغذية تكميلية)", split: [12, 48, 40], ban: ["prc", "hna", "raw", "hg", "nut", "seed", "pnt", "hcf"], off: ["d"], vk: "cook", vm: 0.25, grp: { p: [0.15, 0.3], s: [0.2, 0.4], fr: [0.2, 0.4], f: [0.5, 0.6] }, bst: { fe: 1, o3: 0.4, egg: 0.3 }, note: "الرضاعة (طبيعية أو صناعي) بتفضل الأساس، والأكل ده تكميلي بقوام مهروس أو ناعم. بدون ملح ولا سكر ولا عسل، وبدون مكسرات كاملة. الأصناف المسببة للحساسية (بيض، سمسم، سمك) بتتدخّل واحد واحد. الحليب والألبان خارج الحساب (متاخدة من الرضاعة). الأرقام تقريبية: راجع دكتور الأطفال." },
    { id: "kid2", cat: "أطفال ومراهقين", n: "طفل ١–٣ سنين", split: [15, 50, 35], ban: ["prc", "hna", "raw", "hg", "nut", "seed", "pnt", "hcf"], vm: 0.4, grp: { p: [0.3, 0.5], s: [0.3, 0.5], fr: [0.3, 0.5], f: [0.4, 0.6], d: [0.8, 1] }, bst: { fe: 0.8, ca: 0.6, o3: 0.4 }, note: "كميات صغيرة موزعة، بدون ملح ولا سكر مضاف ولا مكسرات كاملة (خطر اختناق). الخضار والفاكهة تتقطع أو تتبشر. الأفضل اللبن كامل الدسم حتى سنتين، والألبان في القاعدة قليلة الدسم فبدّلها يدويًا." },
    { id: "kid3", cat: "أطفال ومراهقين", n: "طفل ٤–٨ سنين", split: [15, 52, 33], ban: ["prc", "hna", "hg"], vm: 0.6, grp: { p: [0.5, 0.7], s: [0.5, 0.7], fr: [0.5, 0.7], f: [0.5, 0.7] }, bst: { ca: 0.6, fe: 0.5, fib: 0.4 }, note: "مرحلة النمو: كالسيوم وحديد وألياف، بدون مصنعات وأسماك عالية الزئبق وأصناف مالحة. تقليل السكر المضاف، والمكسرات الكاملة بحذر تحت ٥ سنين." },
    { id: "kid4", cat: "أطفال ومراهقين", n: "طفل ٩–١٣ سنة", split: [16, 52, 32], ban: ["prc", "hg"], vm: 0.8, grp: { p: [0.7, 0.9], s: [0.7, 0.9], fr: [0.7, 0.9], f: [0.7, 0.9] }, bst: { ca: 0.8, fe: 0.5, fib: 0.4 }, note: "بداية البلوغ: كالسيوم وحديد (خصوصًا للبنات) وبروتين كفاية. بدون مصنعات وأسماك عالية الزئبق." },
    { id: "teen", cat: "أطفال ومراهقين", n: "مراهق ١٤–١٨ سنة", split: [17, 52, 31], ban: ["prc"], bst: { ca: 0.8, fe: 0.6, o3: 0.4 }, note: "احتياجات مرتفعة للنمو والنشاط: كالسيوم وحديد وبروتين كفاية. ما بيُنصحش بنظم تخسيس قاسية في السن ده. بدون مصنعات." }
  ];
  var ALLERGENS = [
    { id: "egg", n: "بيض", tags: ["egg"] }, { id: "mlk", n: "لبن ومنتجاته", tags: ["mlk"] },
    { id: "nut", n: "مكسرات", tags: ["nut"] }, { id: "pnt", n: "فول سوداني", tags: ["pnt"] },
    { id: "fsh", n: "سمك", tags: ["fsh"] }, { id: "shl", n: "جمبري/قشريات", tags: ["shl"] },
    { id: "ses", n: "سمسم/طحينة", tags: ["ses"] }, { id: "soy", n: "صويا", tags: ["soy"] },
    { id: "gl", n: "قمح/جلوتين", tags: ["gl"] }
  ];
  var MEALS = [{ id: "b", n: "فطار" }, { id: "l", n: "غداء" }, { id: "d", n: "عشاء" }];
  var SHARE = { b: 0.30, l: 0.40, d: 0.30 };

  function dietById(id) { for (var i = 0; i < DIETS.length; i++) if (DIETS[i].id === id) return DIETS[i]; return DIETS[0]; }
  function banSet(diet, allergies) {
    var s = {}; (diet.ban || []).forEach(function (t) { s[t] = 1; });
    (allergies || []).forEach(function (a) { ALLERGENS.forEach(function (x) { if (x.id === a) x.tags.forEach(function (t) { s[t] = 1; }); }); });
    return s;
  }
  function usable(it, meal, ban, diet, only) {
    if (it.meals.indexOf(meal) < 0) return false;
    if (it.sport && !diet.sport) return false;
    if (it.dg && it.dg.indexOf(diet.id) < 0) return false;
    for (var i = 0; i < it.tags.length; i++) if (ban[it.tags[i]]) return false;
    if (diet.frTag && it.g === "fr" && it.tags.indexOf(diet.frTag) < 0) return false;
    if (diet.off && diet.off.indexOf(it.g) >= 0) return false;
    if (only && !only[it.key]) return false;
    return true;
  }

  /* المتاح فعلاً لوجبة ونظام (للواجهة: اختيار الأطعمة) */
  function catalog(meal, dietId, allergies) {
    prepare();
    var diet = dietById(dietId), ban = banSet(diet, allergies), out = { p: [], s: [], fr: [], f: [], d: [], v: [] };
    POOL.forEach(function (it) { if (usable(it, meal, ban, diet, null)) out[it.g].push({ key: it.key, lab: it.lab }); });
    VEG.forEach(function (v) {
      if (v.meals.indexOf(meal) < 0) return;
      if (diet.vk && v.kind !== diet.vk) return;
      for (var i = 0; i < v.tags.length; i++) if (ban[v.tags[i]]) return;
      out.v.push({ key: v.key, lab: v.lab });
    });
    return out;
  }

  /* أهداف مبدئية: من الخطة (سعرات/بروتين/كارب في اليوم × حصة الوجبة) أو من نسب النظام. kOv = سعرات مكتوبة يدويًا */
  function targets(meal, dietId, plan, kOv) {
    var diet = dietById(dietId), sh = SHARE[meal] || 0.3;
    var K = kOv > 0 ? +kOv : (plan && plan.kcal ? plan.kcal * sh : 0);
    if (!K) return { k: 0, p: 0, c: 0, f: 0 };
    var sp = diet.split;
    if (!sp && plan && plan.kcal && plan.p && plan.c) { var pp = plan.p * 4 / plan.kcal * 100, cc = plan.c * 4 / plan.kcal * 100; sp = [pp, cc, Math.max(0, 100 - pp - cc)]; }
    if (!sp) sp = [20, 50, 30];
    var r1 = function (x) { return Math.round(x * 10) / 10; };
    return { k: Math.round(K), p: r1(K * sp[0] / 100 / 4), c: r1(K * sp[1] / 100 / 4), f: r1(K * sp[2] / 100 / 9) };
  }

  /* ============ المولّد ============ */
  function rngFrom(seed) {
    var a = (seed >>> 0) || 1;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var AR = "٠١٢٣٤٥٦٧٨٩";
  function ar(s) { return String(s).replace(/[0-9]/g, function (d) { return AR[+d]; }).replace(/\./g, "٫"); }

  function amountText(it, a) {
    if (it.unit === "g") return ar(a) + " ج " + it.lab;
    if (it.unit === "ml") return ar(a) + " مل " + it.lab;
    if (it.unit === "sc") return (a === 0.5 ? "نصف سكوب واي بروتين" : ar(a) + " " + it.lab1);
    return ar(a) + " " + (a === 1 ? (it.lab1 || it.lab) : (it.lab2 || it.lab));
  }
  function bounds(it, diet) {
    var m = (diet.grp && diet.grp[it.g]) || [1, 1];
    var lo = Math.ceil(it.min * m[0] / it.step - 1e-9), hi = Math.floor(it.max * m[1] / it.step + 1e-9);
    if (m[0] > 0) lo = Math.max(1, lo); else lo = Math.max(0, lo);
    if (hi < lo) hi = lo;
    return [lo, hi];
  }

  /* حل كمية كل صنف في خيار واحد (بحث محلي على خطوات الكميات) */
  function solve(vars, cst, Tg) {
    var n = vars.length;
    function ev(a) { var k = cst.k, p = cst.p, c = cst.c, f = cst.f; for (var i = 0; i < n; i++) { var v = vars[i], q = a[i]; k += v.k * q; p += v.p * q; c += v.c * q; f += v.f * q; } return [k, p, c, f]; }
    function cs(m, a) { var dk = (m[0] - Tg.k) / (Tg.k * 0.01), dp = (m[1] - Tg.p) / 2, dc = (m[2] - Tg.c) / 2, df = (m[3] - Tg.f) / 2, t = dk * dk + dp * dp + dc * dc + df * df;
      for (var i = 0; i < n; i++) { var v = vars[i], z = (a[i] - (v.lo + v.hi) / 2) / (v.hi - v.lo + 1); t += 0.6 * z * z; } return t; }
    var best = null, starts = [0.5, 0.2, 0.8, 0.0];
    for (var si = 0; si < starts.length; si++) {
      var a = vars.map(function (v) { return Math.round(v.lo + (v.hi - v.lo) * starts[si]); }), cur = cs(ev(a), a);
      for (var it = 0; it < 90; it++) {
        var bc = cur, ba = null, i, j, d, b, c2;
        for (i = 0; i < n; i++) {
          for (d = -2; d <= 2; d++) {
            if (!d) continue; var q = a[i] + d; if (q < vars[i].lo || q > vars[i].hi) continue;
            b = a.slice(); b[i] = q; c2 = cs(ev(b), b); if (c2 < bc - 1e-9) { bc = c2; ba = b; }
          }
          for (j = i + 1; j < n; j++) {
            for (var di = -1; di <= 1; di += 2) for (var dj = -1; dj <= 1; dj += 2) {
              var qi = a[i] + di, qj = a[j] + dj;
              if (qi < vars[i].lo || qi > vars[i].hi || qj < vars[j].lo || qj > vars[j].hi) continue;
              b = a.slice(); b[i] = qi; b[j] = qj; c2 = cs(ev(b), b); if (c2 < bc - 1e-9) { bc = c2; ba = b; }
            }
          }
        }
        if (!ba) break; a = ba; cur = bc;
      }
      if (!best || cur < best.cost) best = { n: a, cost: cur, m: ev(a) };
      if (best.cost < 0.2) break;
    }
    return best;
  }

  /* تركيب السلطة بصيغة «وزن الطبق كله + الأنواع»: مثلًا «١٠٠ ج فلفل اخضر + خس + خيار».
     العميل بيوزن طبق مكوناته مع بعض لحد الوزن ده، والمحرك (NX.calcOpt) بيقسم الوزن بالتساوي بين الأنواع ويحسب عليه.
     الأشكال: A نوعين | B سلطة جاهزة | C تلاتة أنواع | D مطبوخ + نيّ */
  function buildSalads(N, meal, vegAll, ban, rnd, diet) {
    var raw = vegAll.filter(function (v) { return v.kind === "raw"; }), cook = vegAll.filter(function (v) { return v.kind === "cook"; });
    var gen = vegAll.filter(function (v) { return v.kind === "gen"; });
    var styles = [];
    if (raw.length >= 2) styles.push("A");
    if (gen.length) styles.push("B");
    if (raw.length >= 3) styles.push("C");
    if (cook.length >= 1 && raw.length >= 1) styles.push("D");
    /* لو اتعلّم نوع خضار واحد بس (مفيش تركيبة ممكنة): سلطة من الصنف ده لوحده بدل ما تتشال السلطة بالكامل */
    if (!styles.length && cook.length >= 1) styles.push("F");
    if (!styles.length && vegAll.length === 1) styles.push("E");
    if (!styles.length) return null;
    var vm = (diet && diet.vm) || 1;
    var out = [], seen = {}, tries = 0, order = shuffle(styles, rnd), si = 0;
    var TOT = { A: [80, 100, 120, 150], B: [100, 120, 150], C: [100, 120, 150, 200], D: [100, 120, 150, 200], E: [80, 100, 120, 150], F: [100, 120, 150, 200] };
    while (out.length < N && tries < 400) {
      tries++;
      var st = order[si % order.length]; si++; if (si % order.length === 0) order = shuffle(styles, rnd);
      var W = TOT[st][Math.floor(rnd() * TOT[st].length)], vs, sig;
      if (vm !== 1) W = Math.max(20, Math.round(W * vm / 10) * 10);
      if (st === "B") vs = [gen[0]];
      else if (st === "E") vs = [vegAll[0]];
      else if (st === "F") { var pc = shuffle(cook, rnd); vs = pc.length >= 2 ? [pc[0], pc[1]] : [pc[0]]; }
      else {
        var pickR = shuffle(raw, rnd), pickC = shuffle(cook, rnd);
        vs = st === "A" ? [pickR[0], pickR[1]] : st === "C" ? [pickR[0], pickR[1], pickR[2]] : [pickC[0], pickR[0]];
      }
      sig = st + W + vs.map(function (v) { return v.lab; }).sort().join(",");
      if (seen[sig] && tries < 300) continue; seen[sig] = 1;
      var n = vs.length, m = { k: 0, p: 0, c: 0, f: 0 }, tags = [];
      vs.forEach(function (v) { m.k += v.mu.k * W / n; m.p += v.mu.p * W / n; m.c += v.mu.c * W / n; m.f += v.mu.f * W / n; tags = tags.concat(v.tags || []); });
      out.push({ text: ar(W) + " ج " + vs.map(function (v) { return v.lab; }).join(" + "), m: m, tags: tags, style: st, keys: vs.map(function (v) { return v.key; }) });
    }
    while (out.length < N) out.push(out[out.length % Math.max(1, out.length)]);
    return out;
  }

  function generate(o) {
    prepare();
    var t0 = Date.now(), budget = o.ms || 1100;
    var meal = o.meal || "b", diet = dietById(o.diet), N = Math.max(1, Math.min(12, o.n || 7));
    var ban = banSet(diet, o.allergies), rnd = rngFrom(o.seed || (Date.now() & 0xffffff)), warnings = [];
    var Tg = { k: +o.k, p: +o.p, c: +o.c, f: +o.f };
    if (!(Tg.k > 0) || !(Tg.p >= 0) || !(Tg.c >= 0) || !(Tg.f >= 0)) return { ok: false, error: "اكتب السعرات والبروتين والكارب والدهون." };
    if (Tg.k < 350) warnings.push("السعرات قليلة: الحد الأدنى العملي لوجبة فيها المجموعات الست حوالي ٣٥٠ سعرة، فالدقة هتقل.");
    var implied = 4 * Tg.p + 4 * Tg.c + 9 * Tg.f;
    if (Math.abs(implied - Tg.k) / Tg.k > 0.04) warnings.push("السعرات المكتوبة (" + ar(Math.round(Tg.k)) + ") مختلفة عن اللي بتطلع من البروتين والكارب والدهون (" + ar(Math.round(implied)) + ") — الأداة بتوازن بين الاتنين، وللدقة اخلي الأرقام متسقة.");

    var pool = { p1: [], p2: [], s: [], fr: [], f: [], d: [] };
    POOL.forEach(function (it) {
      if (!usable(it, meal, ban, diet, o.only)) return;
      if (it.g === "p") { if (it.r.indexOf("1") >= 0) pool.p1.push(it); if (it.r.indexOf("2") >= 0) pool.p2.push(it); }
      else pool[it.g].push(it);
    });
    var vegAll = VEG.filter(function (v) {
      if (v.meals.indexOf(meal) < 0) return false;
      if (diet.vk && v.kind !== diet.vk) return false;
      for (var i = 0; i < v.tags.length; i++) if (ban[v.tags[i]]) return false;
      return !(o.only && !o.only[v.key]);
    });
    // "سلطه" الجاهزة (قيمة تقديرية معروفة في القاعدة) كشكل مستقل، وبتتخطى لو الحمضيات ممنوعة
    var gen = NXe.calcOpt("100 ج سلطه"), gx = gen && gen.items && gen.items[0];
    if (gx && gx.ok && !ban.acid && !o.only && !diet.vk) {
      vegAll.push({ meals: "bld", lab: "سلطه", kind: "gen", tags: [], mu: { k: gen.t.k / 100, p: gen.t.p / 100, c: gen.t.c / 100, f: gen.t.f / 100 } });
    }
    // الألبان النباتية بدائل: بتدخل بس لو مفيش حليب عادي متاح (لاكتوز / نباتي / حساسية لبن)
    if (pool.d.some(function (x) { return x.cat === "m" && !x.alt; })) pool.d = pool.d.filter(function (x) { return !x.alt; });
    if (!pool.p1.length) return { ok: false, error: "مفيش أي مصدر بروتين متاح مع القيود المختارة." };
    var useG = { s: pool.s.length > 0, fr: pool.fr.length > 0, f: pool.f.length > 0, d: pool.d.length > 0 };
    var GN = { s: "النشويات", fr: "الفاكهة", f: "الدهون", d: "الألبان" };
    ["s", "fr", "f", "d"].forEach(function (g) {
      if (!useG[g] && !(diet.off && diet.off.indexOf(g) >= 0)) warnings.push("مفيش أصناف متاحة لمجموعة " + GN[g] + " مع القيود المختارة — الخيارات هتطلع من غيرها.");
    });
    var salads = buildSalads(N, meal, vegAll, ban, rnd, diet);
    if (!salads) warnings.push("مفيش خضار متاح مع القيود المختارة.");

    function p2ok(a, b) { return a !== b && (a.fam !== b.fam || a.fam === "egg"); }
    function capOf(len, base) { return Math.max(base, Math.ceil(N / Math.max(1, len))); }
    var CAP = { p1: capOf(pool.p1.length, 1), s: capOf(pool.s.length, 1), f: capOf(pool.f.length, 1), fr: capOf(pool.fr.length, 2), d: 99 };
    if (pool.p1.length < N) warnings.push("أنواع البروتين المتاحة (" + ar(pool.p1.length) + ") أقل من عدد الخيارات — هيتكرر بعضها.");
    if (useG.s && pool.s.length < N) warnings.push("أنواع النشويات المتاحة (" + ar(pool.s.length) + ") أقل من عدد الخيارات — هيتكرر بعضها.");
    if (useG.f && pool.f.length < N) warnings.push("أنواع الدهون المتاحة (" + ar(pool.f.length) + ") أقل من عدد الخيارات.");

    var useF2 = !!diet.fat2 && pool.f.length > 1, slots = ["p1"]; if (pool.p2.length) slots.push("p2"); ["s", "fr", "f", "d"].forEach(function (g) { if (useG[g]) slots.push(g); }); if (useF2) slots.push("f2");
    /* تنويع الشكل: بعض الخيارات ممكن تستغنى عن فاكهة/دهون/ألبان (والخضار في الفطار) طالما الأرقام متظبطة */
    var DROPS = []; ["fr", "f", "d"].forEach(function (g) { if (useG[g] && !(g === "f" && diet.fat2)) DROPS.push(g); });
    if (meal === "b" && salads) DROPS.push("v");
    var maxDrop = N >= 4 ? Math.max(1, Math.floor(N / 3)) : 0;
    function nulls(stt, g) { var n = 0; stt.forEach(function (op) { if (g === "v" ? op.nv : !op[g]) n++; }); return n; }
    var cache = {};
    function optKey(op, i) { return [op.nv ? 1 : 0, op.p1.id, op.p2 ? op.p2.id : 0, op.s ? op.s.id : 0, op.fr ? op.fr.id : 0, op.f ? op.f.id : 0, op.f2 ? op.f2.id : 0, op.d ? op.d.id : 0, i].join("|"); }
    function solveOpt(op, i) {
      var key = optKey(op, i); if (cache[key]) return cache[key];
      var vars = [], sv = (salads && !op.nv) ? salads[i].m : { k: 0, p: 0, c: 0, f: 0 };
      ["p1", "p2", "s", "fr", "f", "f2", "d"].forEach(function (sl) {
        var it = op[sl]; if (!it) return; var b = bounds(it, diet);
        vars.push({ sl: sl, it: it, k: it.mu.k * it.step, p: it.mu.p * it.step, c: it.mu.c * it.step, f: it.mu.f * it.step, lo: b[0], hi: b[1] });
      });
      var r = solve(vars, sv, Tg); r.vars = vars; cache[key] = r; return r;
    }
    function tagsOf(op, i) { var t = []; ["p1", "p2", "s", "fr", "f", "f2", "d"].forEach(function (sl) { if (op[sl]) t = t.concat(op[sl].tags); }); if (salads && !op.nv) t = t.concat(salads[i].tags); return t; }
    function penalty(st) {
      var c = 0, i, cnt = {};
      for (i = 0; i < st.length; i++) {
        if (st[i].p2) c += 0.12;
        if (st[i].f2) c += 0.12;
        if (i && st[i].fr && st[i].fr === st[i - 1].fr) c += 0.6;
        if (i && salads && !st[i].nv && !st[i - 1].nv && salads[i].style === salads[i - 1].style) c += 0.15;
        if (st[i].p1.tags.indexOf("ses") >= 0 && st[i].f && st[i].f.tags.indexOf("ses") >= 0) c += 1;
        if (maxDrop) { if (st[i].nv) c += 0.15; ["fr", "f", "d"].forEach(function (g) { if (useG[g] && !st[i][g] && !(g === "f" && diet.fat2)) c += 0.15; }); }
        var tg = tagsOf(st[i], i), seen = {};
        tg.forEach(function (t) { if (seen[t]) return; seen[t] = 1; cnt[t] = (cnt[t] || 0) + 1; if (diet.pen && diet.pen[t]) c += 0.5 * diet.pen[t]; if (diet.bst && diet.bst[t]) c -= 0.3 * diet.bst[t]; });
        var fam = st[i].p1.fam; cnt["fam:" + fam] = (cnt["fam:" + fam] || 0) + 1;
      }
      Object.keys(cnt).forEach(function (k) { if (k.indexOf("fam:") === 0 && cnt[k] > 3 && N >= 5) c += (cnt[k] - 3) * 0.8; });
      // تكرار البروتين المساعد / الدهن الثانوي: مسموح قليل، بعد كده مكلف
      var c2 = {}, c3 = {}; st.forEach(function (op) { if (op.p2) c2[op.p2.id] = (c2[op.p2.id] || 0) + 1; if (op.f2) c3[op.f2.id] = (c3[op.f2.id] || 0) + 1; });
      var lim2 = Math.max(2, Math.ceil(N / 3));
      Object.keys(c2).forEach(function (k) { if (c2[k] > lim2) c += (c2[k] - lim2) * 1.5; });
      Object.keys(c3).forEach(function (k) { if (c3[k] > lim2 + 1) c += (c3[k] - lim2 - 1) * 0.6; });
      if (diet.cap) Object.keys(diet.cap).forEach(function (t) { if ((cnt[t] || 0) > diet.cap[t]) c += 6 * (cnt[t] - diet.cap[t]); });
      if (maxDrop) {
        var sg = {}; st.forEach(function (op) { sg[(op.s ? "s" : "") + (op.fr ? "r" : "") + (op.f ? "f" : "") + (op.d ? "d" : "") + (op.p2 ? "2" : "") + ((salads && !op.nv) ? "v" : "")] = 1; });
        c -= 0.35 * Math.min(3, Object.keys(sg).length - 1);
      }
      for (var pa = 0; pa < st.length; pa++) for (var pb = pa + 1; pb < st.length; pb++) {
        var A = st[pa], B = st[pb];
        if (A.p1 === B.p1 && A.s && A.s === B.s) c += 1.2;
        else if (A.p1.fam === B.p1.fam && A.s && A.s === B.s) c += 0.3;
        if (A.fr && A.fr === B.fr) c += 0.3;
        if (A.f && A.f === B.f) c += 0.25;
      }
      if (useG.d) { var ny = 0, nm = 0; st.forEach(function (op) { if (!op.d) return; if (op.d.cat === "y") ny++; else nm++; }); var hasY = pool.d.some(function (x) { return x.cat === "y"; }), hasM = pool.d.some(function (x) { return x.cat === "m"; }); if (hasY && hasM && N > 1) c += Math.max(0, Math.abs(ny - nm) - 1) * 3; }
      return c;
    }
    function total(st) { var t = penalty(st); for (var i = 0; i < st.length; i++) t += solveOpt(st[i], i).cost; return t; }

    function roundRobin(arr) { var sh = shuffle(arr, rnd), out = []; for (var i = 0; i < N; i++) out.push(sh[i % sh.length]); return out; }
    var st = [], P1 = roundRobin(pool.p1), S = useG.s ? roundRobin(pool.s) : null, FR = null, FF = useG.f ? roundRobin(pool.f) : null;
    var Y = pool.d.filter(function (x) { return x.cat === "y"; }), M = pool.d.filter(function (x) { return x.cat === "m"; });
    var D = [];
    if (useG.d) for (var di = 0; di < N; di++) { var useY = (di % 2 === 0) ? Y.length > 0 : !(M.length > 0); var arr = useY ? Y : M; if (!arr.length) arr = useY ? M : Y; D.push(arr[Math.floor(rnd() * arr.length)]); }
    // الفاكهة: كل نوع حد أقصى ٢ (أو أكتر بس لو الأنواع المتاحة قليلة)
    if (useG.fr) { var frs = shuffle(pool.fr, rnd); FR = []; for (var q = 0; q < N; q++) FR.push(frs[q % frs.length]); }
    for (var ii = 0; ii < N; ii++) st.push({ p1: P1[ii], p2: null, s: S ? S[ii] : null, fr: FR ? FR[ii] : null, f: FF ? FF[ii] : null, f2: null, d: useG.d ? D[ii] : null });
    // بروتين مساعد مبدئي: أفضل واحد لكل خيار (أو من غير)
    if (pool.p2.length) {
      for (var a = 0; a < N; a++) {
        var bestC = solveOpt(st[a], a).cost, bestP = null;
        pool.p2.forEach(function (c2) { if (!p2ok(st[a].p1, c2)) return; var tmp = Object.assign({}, st[a], { p2: c2 }); var cc = solveOpt(tmp, a).cost + 0.12; if (cc < bestC) { bestC = cc; bestP = c2; } });
        st[a].p2 = bestP;
      }
    }
    if (useF2) {
      for (var b2 = 0; b2 < N; b2++) {
        var bc2 = solveOpt(st[b2], b2).cost, bf = null;
        pool.f.forEach(function (c3) { if (c3 === st[b2].f) return; var t3 = Object.assign({}, st[b2], { f2: c3 }); var cc3 = solveOpt(t3, b2).cost + 0.12; if (cc3 < bc2) { bc2 = cc3; bf = c3; } });
        st[b2].f2 = bf;
      }
    }
    function count(stt, sl, it) { var n = 0; stt.forEach(function (op) { if (op[sl] === it) n++; }); return n; }
    var cur = total(st), best = st.map(function (x) { return Object.assign({}, x); }), bestT = cur, iter = 0, temp0 = 1.0;
    while (Date.now() - t0 < budget && iter < 6000) {
      iter++;
      var temp = temp0 * Math.max(0.03, 1 - (Date.now() - t0) / budget);
      var sl = slots[Math.floor(rnd() * slots.length)], i = Math.floor(rnd() * N), nst = st.map(function (x) { return Object.assign({}, x); });
      if (maxDrop && DROPS.length && rnd() < 0.2) {
        var dg = DROPS[Math.floor(rnd() * DROPS.length)];
        if (dg === "v") { if (!nst[i].nv) { if (nulls(nst, "v") >= maxDrop) continue; nst[i].nv = true; } else nst[i].nv = false; }
        else if (nst[i][dg]) { if (nulls(nst, dg) >= maxDrop) continue; nst[i][dg] = null; if (dg === "f") nst[i].f2 = null; }
        else { var rc = pool[dg][Math.floor(rnd() * pool[dg].length)]; if (dg === "f" && nst[i].f2 === rc) nst[i].f2 = null; nst[i][dg] = rc; }
      } else if (sl === "f2") {
        var fc = [null].concat(pool.f.filter(function (x) { return x !== nst[i].f; }));
        nst[i].f2 = fc[Math.floor(rnd() * fc.length)];
      } else if (sl === "p2") {
        var cands = [null].concat(pool.p2.filter(function (x) { return p2ok(nst[i].p1, x); }));
        nst[i].p2 = cands[Math.floor(rnd() * cands.length)];
      } else if (rnd() < 0.5 && N > 1) {
        var j = Math.floor(rnd() * N); if (j === i) continue;
        var tmp2 = nst[i][sl]; nst[i][sl] = nst[j][sl]; nst[j][sl] = tmp2;
        if (sl === "f") { if (nst[i].f2 === nst[i].f) nst[i].f2 = null; if (nst[j].f2 === nst[j].f) nst[j].f2 = null; }
        if (sl === "p1") { if (nst[i].p2 && !p2ok(nst[i].p1, nst[i].p2)) nst[i].p2 = null; if (nst[j].p2 && !p2ok(nst[j].p1, nst[j].p2)) nst[j].p2 = null; }
      } else {
        var pl = sl === "p1" ? pool.p1 : pool[sl], cd = pl[Math.floor(rnd() * pl.length)];
        if (cd === nst[i][sl]) continue;
        if (sl === "d") { if (nst[i].d && cd.cat !== nst[i].d.cat) continue; }
        else if (count(nst, sl, cd) >= CAP[sl]) continue;
        nst[i][sl] = cd; if (sl === "p1" && nst[i].p2 && !p2ok(cd, nst[i].p2)) nst[i].p2 = null; if (sl === "f" && nst[i].f2 === cd) nst[i].f2 = null;
      }
      var nt = total(nst);
      if (nt <= cur || rnd() < Math.exp(-(nt - cur) / temp)) {
        st = nst; cur = nt;
        if (cur < bestT) { bestT = cur; best = st.map(function (x) { return Object.assign({}, x); }); }
      }
    }
    st = best;

    /* تركيب النصوص + مراجعة نهائية بمحرك الحساب */
    var options = [], i2;
    for (i2 = 0; i2 < N; i2++) {
      var sol = solveOpt(st[i2], i2), amt = {};
      sol.vars.forEach(function (v, k) { amt[v.sl] = sol.n[k] * v.it.step; });
      var parts = [];
      ["p1", "p2"].forEach(function (sl) { if (st[i2][sl] && amt[sl] > 0) parts.push(amountText(st[i2][sl], amt[sl])); });
      if (st[i2].s && amt.s > 0) parts.push(amountText(st[i2].s, amt.s));
      if (salads && !st[i2].nv) parts.push(salads[i2].text);
      if (st[i2].fr && amt.fr > 0) parts.push(amountText(st[i2].fr, amt.fr));
      if (st[i2].d && amt.d > 0) parts.push(amountText(st[i2].d, amt.d));
      if (st[i2].f && amt.f > 0) parts.push(amountText(st[i2].f, amt.f));
      if (st[i2].f2 && amt.f2 > 0) parts.push(amountText(st[i2].f2, amt.f2));
      var text = parts.join(" + "), r = NXe.calcOpt(text);
      var weak = r.items.filter(function (x) { return !x.ok || x.weak; }).length;
      var ukeys = []; ["p1", "p2", "s", "fr", "f", "f2", "d"].forEach(function (sl) { if (st[i2][sl] && amt[sl] > 0) ukeys.push(st[i2][sl].key); });
      if (salads && !st[i2].nv && salads[i2].keys) ukeys = ukeys.concat(salads[i2].keys);
      options.push({ keys: ukeys, text: text, k: r.t.k, p: r.t.p, c: r.t.c, f: r.t.f, weak: weak, p1: st[i2].p1.lab, s: st[i2].s ? st[i2].s.lab : "", fr: st[i2].fr ? st[i2].fr.lab : "", f_: st[i2].f ? st[i2].f.lab : "", d: st[i2].d ? st[i2].d.lab : "" });
    }
    function rng2(key) { var v = options.map(function (x) { return x[key]; }); return [Math.min.apply(null, v), Math.max.apply(null, v)]; }
    var rg = { k: rng2("k"), p: rng2("p"), c: rng2("c"), f: rng2("f") };
    var spread = { k: rg.k[1] - rg.k[0], p: rg.p[1] - rg.p[0], c: rg.c[1] - rg.c[0], f: rg.f[1] - rg.f[0] };
    var devMax = Math.max.apply(null, options.map(function (x) { return Math.max(Math.abs(x.p - Tg.p), Math.abs(x.c - Tg.c), Math.abs(x.f - Tg.f)); }));
    var okSpread = spread.p <= 5.01 && spread.c <= 5.01 && spread.f <= 5.01 && spread.k <= Tg.k * 0.03;
    if (!okSpread) warnings.push("الفرق بين الخيارات أكبر من المطلوب (بروتين " + ar(Math.round(spread.p * 10) / 10) + " / كارب " + ar(Math.round(spread.c * 10) / 10) + " / دهون " + ar(Math.round(spread.f * 10) / 10) + " جم). جرّب «إعادة توليد» أو وسّع الأطعمة المتاحة أو راجع تناسق الأرقام.");
    if (options.some(function (x) { return x.weak; })) warnings.push("في خيار فيه صنف محتاج مراجعة في الحساب — راجع اللوحة اللي تحت.");
    return { ok: true, options: options, range: rg, spread: spread, devMax: devMax, okSpread: okSpread, warnings: warnings, diet: diet, ms: Date.now() - t0, dropped: DROPPED.slice() };
  }

  root.NXG = { generate: generate, catalog: catalog, targets: targets, DIETS: DIETS, ALLERGENS: ALLERGENS, MEALS: MEALS, SHARE: SHARE, prepare: prepare, ar: ar, dietById: dietById, _pool: function () { prepare(); return { POOL: POOL, VEG: VEG, DROPPED: DROPPED }; } };
  if (typeof module !== "undefined" && module.exports) module.exports = root.NXG;
})(typeof window !== "undefined" ? window : globalThis);
