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
  add("p", "bld", "تونه", "g", 10, 50, 220, "flesh fsh hna hg1", { r: "12", fam: "fsh" });
  add("p", "b", "سلمون مدخن", "g", 10, 30, 100, "flesh fsh prc hna raw o3", { r: "2", fam: "fsh" });
  add("p", "bd", "واي بروتين", "sc", 0.5, 0.5, 2, "mlk anm", { r: "2", fam: "whey", lab1: "سكوب واي بروتين", lab2: "سكوب واي بروتين", sport: true });
  add("p", "ld", "صدر فراخ", "g", 10, 80, 220, "flesh", { r: "1", fam: "pou" });
  add("p", "l", "ورك فراخ", "g", 10, 80, 200, "flesh mfat", { r: "1", fam: "pou" });
  add("p", "ld", "درمستيك", "g", 10, 80, 200, "flesh", { r: "1", fam: "pou" });
  add("p", "ld", "صدر حبش", "g", 10, 80, 220, "flesh", { r: "1", fam: "pou" });
  add("p", "l", "لحم قليل الدهن", "g", 10, 80, 220, "flesh red fe", { r: "1", fam: "red" });
  add("p", "ld", "ضاني", "g", 10, 70, 200, "flesh red mfat fe", { r: "1", fam: "red", est: true });
  add("p", "ld", "شيش طاووق", "g", 10, 100, 250, "flesh", { r: "1", fam: "pou", est: true });
  add("p", "ld", "كفته دجاج", "g", 10, 100, 250, "flesh", { r: "1", fam: "pou", est: true });
  add("p", "ld", "كفته لحم", "g", 10, 100, 220, "flesh red mfat", { r: "1", fam: "red" });
  add("p", "l", "كبده", "g", 10, 70, 150, "flesh org pur fe", { r: "1", fam: "red" });
  add("p", "l", "كبدة فراخ", "g", 10, 70, 150, "flesh org pur fe", { r: "1", fam: "pou" });
  add("p", "ld", "سلمون", "g", 10, 80, 220, "flesh fsh o3 fatty ldl", { r: "1", fam: "fsh" });
  add("p", "ld", "بلطي", "g", 10, 100, 250, "flesh fsh", { r: "1", fam: "fsh" });
  add("p", "ld", "قاروص", "g", 10, 100, 250, "flesh fsh", { r: "1", fam: "fsh" });
  add("p", "ld", "سمك ابيض", "g", 10, 100, 250, "flesh fsh", { r: "1", fam: "fsh" });
  add("p", "ld", "جمبري", "g", 10, 80, 220, "flesh shl pur", { r: "1", fam: "shl" });
  add("p", "ld", "تونه طازجه", "g", 10, 80, 220, "flesh fsh hg", { r: "1", fam: "fsh" });
  add("p", "ld", "سردين", "g", 10, 80, 160, "flesh fsh o3 pur fatty ldl", { r: "1", fam: "fsh" });
  add("p", "l", "ماكريل", "g", 10, 70, 150, "flesh fsh o3 pur fatty hg", { r: "1", fam: "fsh" });
  add("p", "bld", "عدس", "g", 10, 100, 300, "lgm gas fod fe lowgi ldl", { r: "1", fam: "leg" });
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
  /* الجبنة البيضاء كانت محصورة على النباتي (dg) في كل الوجبات فمكانتش بتظهر للنظام العادي: دلوقتي متاحة في الفطار والعشاء لكل الأنظمة (والغداء للنباتي بس زي ما كان) */
  add("p", "l", "جبنه بيضه", "g", 10, 30, 100, "mlk anm mfat hna", { r: "2", fam: "dai", dg: ["veg"] });
  add("p", "bd", "جبنه بيضه", "g", 10, 30, 100, "mlk anm mfat hna", { r: "12", fam: "dai" });
  /* --- أجبان ولحوم باردة للفطار (اقتصادية ومعروفة). الأصناف est: قيمها تقريبية في قاعدة الأصناف وبتتراجع بزرار ✎ --- */
  add("p", "bd", "جبنه بيضه قليله الملح", "g", 10, 30, 120, "mlk anm mfat", { r: "12", fam: "dai", est: true });
  add("p", "bd", "جبنه بيضه قليله الدسم", "g", 10, 30, 120, "mlk anm hna", { r: "12", fam: "dai", est: true });
  add("p", "bd", "جبنه رومي", "g", 10, 20, 60, "mlk anm mfat hna", { r: "12", fam: "dai" });
  add("p", "bd", "جبنه فلمنك", "pc", 1, 1, 4, "mlk anm mfat hna", { r: "2", fam: "dai", lab1: "شريحه جبنه فلمنك", lab2: "شريحه جبنه فلمنك" });
  add("p", "bd", "جبنه مثلثات", "pc", 1, 1, 4, "mlk lh anm hna", { r: "2", fam: "dai", est: true, lab1: "قطعه جبنه مثلثات", lab2: "قطعه جبنه مثلثات" });
  add("p", "bd", "لبنه", "g", 10, 30, 100, "mlk lh anm", { r: "12", fam: "dai", est: true });
  add("p", "b", "روست بيف", "g", 10, 30, 120, "flesh red prc hna", { r: "12", fam: "red", est: true });
  add("p", "b", "بسطرمه", "g", 10, 30, 100, "flesh red prc hna mfat", { r: "12", fam: "red", est: true });
  add("p", "b", "صدر فراخ", "g", 10, 50, 150, "flesh", { r: "12", fam: "pou" });
  add("p", "b", "لانشون", "g", 10, 30, 100, "flesh red prc hna mfat gl", { r: "2", fam: "lun", est: true });
  add("p", "b", "لانشون فراخ", "g", 10, 30, 100, "flesh prc hna mfat gl", { r: "2", fam: "lun", est: true });
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
  add("f", "bld", "لوز", "g", 5, 10, 40, "nut mufa ldl", {});
  add("f", "bld", "عين جمل", "g", 5, 10, 40, "nut o3 ldl", {});
  add("f", "bld", "كاجو", "g", 5, 10, 40, "nut fod hcf", {});
  add("f", "bld", "فستق", "g", 5, 10, 40, "nut fod hcf", {});
  add("f", "bld", "بندق", "g", 5, 10, 40, "nut", {});
  add("f", "bld", "بيكان", "g", 5, 10, 40, "nut", {});
  add("f", "bld", "ماكاداميا", "g", 5, 10, 30, "nut", {});
  add("f", "bld", "جوز برازيلي", "g", 5, 10, 25, "nut", {});
  add("f", "bld", "افوكادو", "g", 10, 20, 100, "mufa ldl fod", {});
  add("f", "ld", "زيتون", "g", 10, 20, 80, "mufa hna", {});
  add("f", "bld", "طحينه", "g", 5, 5, 30, "ses", {});
  add("f", "bld", "زبده فول سوداني", "g", 5, 5, 30, "pnt", {});
  add("f", "bld", "زبده اللوز", "g", 5, 5, 30, "nut", {});
  add("f", "bld", "فول سوداني", "g", 5, 10, 40, "pnt hcf", {});
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
  add("d", "bld", "حليب شوفان", "ml", 50, 100, 300, "gl oats dc", { cat: "m", alt: true });

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
    if (!x || !x.ok || x.weak || (x.est && !it.est)) return null;
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
    { id: "anem", cat: "حالات طبية", n: "أنيميا (نقص حديد)", split: [20, 50, 30], ban: [], nd: true, bst: { fe: 1.2, vc: 1 }, note: "مصادر حديد + فيتامين C في نفس الوجبة. الألبان والشاي بيقللوا امتصاص الحديد (فاصل ساعتين)؛ الألبان موجودة بحكم المجموعات الستة — عدّلها لو لازم." },
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

  /* البروتين والكارب والدهون هم المرجع: السعرات بتتحسب منهم (٤/٤/٩). لو السعرات المكتوبة بعيدة عنهم (أكتر من ٣٪) المولّد مابيوازنش بينهم (كان بيطلّع أرقام مش بتاعتك):
     بيلتزم بالماكروز زي ما كتبتهم وبيقولك السعرات الفعلية في ملاحظة. */
  function fixK(Tg, notes) {
    var implied = 4 * Tg.p + 4 * Tg.c + 9 * Tg.f;
    if (!(implied > 0)) return;
    if (Tg.k > 0 && Math.abs(implied - Tg.k) / Tg.k > 0.03) notes.push("السعرات المكتوبة (" + ar(Math.round(Tg.k)) + ") مش بتساوي مجموع البروتين والكارب والدهون (" + ar(Math.round(implied)) + "). الأداة التزمت بالبروتين والكارب والدهون زي ما كتبتهم، والسعرات اتحسبت " + ar(Math.round(implied)) + ". لو عايز سعرات تانية عدّل الماكروز.");
    notes.asked = Math.round(Tg.k) > 0 && Math.abs(implied - Tg.k) / Tg.k > 0.03 ? Math.round(Tg.k) : 0;
    Tg.k = implied;
  }
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

  function generateLegacy(o) {
    prepare();
    var t0 = Date.now(), budget = o.ms || 1100;
    var meal = o.meal || "b", diet = dietById(o.diet), N = Math.max(1, Math.min(12, o.n || 7));
    var needD = (meal === "b" || meal === "d") && !diet.nd; YOGOK = (meal === "b" || meal === "d"); /* فطار وعشاء: لازم حصة زبادي/لبن في كل خيار (الأنيميا استثناء: الألبان بتقلل امتصاص الحديد فبتفضل اختيارية) */
    var ban = banSet(diet, o.allergies), rnd = rngFrom(o.seed || (Date.now() & 0xffffff)), warnings = [];
    var Tg = { k: +o.k, p: +o.p, c: +o.c, f: +o.f };
    if (!(Tg.k > 0) || !(Tg.p >= 0) || !(Tg.c >= 0) || !(Tg.f >= 0)) return { ok: false, error: "اكتب السعرات والبروتين والكارب والدهون." };
    if (Tg.k < 350) warnings.push("السعرات قليلة: الحد الأدنى العملي لوجبة فيها المجموعات الست حوالي ٣٥٠ سعرة، فالدقة هتقل.");
    var notes = []; fixK(Tg, notes);

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

    function p2ok(a, b) { return a !== b && (a.fam !== b.fam || a.fam === "egg") && !pairBad(a, b); }
    function capOf(len, base) { return Math.max(base, Math.ceil(N / Math.max(1, len))); }
    var CAP = { p1: capOf(pool.p1.length, 1), s: capOf(pool.s.length, 1), f: capOf(pool.f.length, 1), fr: capOf(pool.fr.length, 2), d: 99 };
    if (pool.p1.length < N) warnings.push("أنواع البروتين المتاحة (" + ar(pool.p1.length) + ") أقل من عدد الخيارات — هيتكرر بعضها.");
    if (useG.s && pool.s.length < N) warnings.push("أنواع النشويات المتاحة (" + ar(pool.s.length) + ") أقل من عدد الخيارات — هيتكرر بعضها.");
    if (useG.f && pool.f.length < N) warnings.push("أنواع الدهون المتاحة (" + ar(pool.f.length) + ") أقل من عدد الخيارات.");

    var useF2 = !!diet.fat2 && pool.f.length > 1, slots = ["p1"]; if (pool.p2.length) slots.push("p2"); ["s", "fr", "f", "d"].forEach(function (g) { if (useG[g]) slots.push(g); }); if (useF2) slots.push("f2");
    /* تنويع الشكل: بعض الخيارات ممكن تستغنى عن فاكهة/دهون/ألبان (والخضار في الفطار) طالما الأرقام متظبطة */
    var DROPS = []; ["fr", "f", "d"].forEach(function (g) { if (useG[g] && !(g === "f" && diet.fat2) && !(g === "d" && needD)) DROPS.push(g); });
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
        c += 8 * badCombos([st[i].p1, st[i].p2, st[i].d]);
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
      var pu0 = {}; st.forEach(function (op) { [op.p1, op.p2].forEach(function (it) { if (it && it.fam !== "egg") pu0[it.id] = (pu0[it.id] || 0) + 1; }); });
      Object.keys(pu0).forEach(function (k) { if (pu0[k] > 1) c += (pu0[k] - 1) * 4; });
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
      options.push({ keys: ukeys, text: text, k: r.t.k, p: r.t.p, c: r.t.c, f: r.t.f, weak: weak, p1: st[i2].p1.lab, s: st[i2].s ? st[i2].s.lab : "", fr: st[i2].fr ? st[i2].fr.lab : "", f_: st[i2].f ? st[i2].f.lab : "", d: st[i2].d ? st[i2].d.lab : "", dOk: !!(st[i2].d && amt.d > 0), dcat: st[i2].d ? st[i2].d.cat : "", fish: pcat(st[i2].p1) === "fish" || pcat(st[i2].p2) === "fish" });
    }
    function rng2(key) { var v = options.map(function (x) { return x[key]; }); return [Math.min.apply(null, v), Math.max.apply(null, v)]; }
    var rg = { k: rng2("k"), p: rng2("p"), c: rng2("c"), f: rng2("f") };
    var spread = { k: rg.k[1] - rg.k[0], p: rg.p[1] - rg.p[0], c: rg.c[1] - rg.c[0], f: rg.f[1] - rg.f[0] };
    var devMax = Math.max.apply(null, options.map(function (x) { return Math.max(Math.abs(x.p - Tg.p), Math.abs(x.c - Tg.c), Math.abs(x.f - Tg.f)); }));
    var okSpread = spread.p <= 5.01 && spread.c <= 5.01 && spread.f <= 5.01 && spread.k <= Tg.k * 0.03;
    if (!okSpread) warnings.push("الفرق بين الخيارات أكبر من المطلوب (بروتين " + ar(Math.round(spread.p * 10) / 10) + " / كارب " + ar(Math.round(spread.c * 10) / 10) + " / دهون " + ar(Math.round(spread.f * 10) / 10) + " جم). جرّب «إعادة توليد» أو وسّع الأطعمة المتاحة.");
    else if (devMax > 6) warnings.push("الخيارات قريبة من بعض لكن بعيدة عن أرقامك بحوالي " + ar(Math.round(devMax)) + " جم في أكتر ماكرو. جرّب «إعادة توليد» أو وسّع الأطعمة المتاحة.");
    if (options.some(function (x) { return x.weak; })) warnings.push("في خيار فيه صنف محتاج مراجعة في الحساب — راجع اللوحة اللي تحت.");
    return { ok: true, needD: needD, options: options, range: rg, spread: spread, devMax: devMax, okSpread: okSpread, warnings: warnings, notes: notes, kUsed: Math.round(Tg.k), diet: diet, ms: Date.now() - t0, dropped: DROPPED.slice() };
  }

  /* ================================================================
     المولّد الذكي (v2) — قوالب وجبات + قواعد منع بالكود
     - كل خيار بيتبني على «قالب» (بيض / فول / شوفان وزبادي / ساندوتش للفطار، وطبق بروتين+نشويات+سلطة+دهون للغداء والعشاء) بدل ما كل الأصناف تتخلط.
     - قواعد صارمة (لو اتكسرت الخيار مرفوض مش مجرد عقوبة): صنف ألبان واحد بس في الوجبة (مفيش زبادي يوناني + عادي)، بيض كامل أو بياض مش الاتنين،
       البيض في أقل خيارات (ربع الخيارات)، بروتين أساسي مختلف في كل خيار، الكبدة مرة واحدة بالكتير.
     - الغداء والعشاء: بروتين واحد بكمية طبق (بيتحسب بقدرته على تغطية بروتين الوجبة) + نشويات شائعة + سلطة + دهون، من غير فاكهة. الغداء من غير ألبان؛ الفطار والعشاء فيهم حصة زبادي/حليب في كل خيار (للكالسيوم) لو النظام والأصناف المختارة تسمح.
     - لو أي حاجة فشلت (قالب مش متاح للنظام، استثناء، قاعدة مش متحققة): بيرجع تلقائيًا للمولّد القديم (generateLegacy) بدون أي تغيير في شكل النتيجة.
     - الشكل الراجع من generate هو نفسه بالظبط (+ حقول إضافية: smart, shape) فالواجهة ما بتتأثرش. */
  var LUNCH_P = ["صدر فراخ", "ورك فراخ", "درمستيك", "صدر حبش", "لحم قليل الدهن", "ضاني", "كبده", "سلمون", "بلطي", "قاروص", "جمبري", "تونه طازجه"];
  var DINNER_P = ["صدر فراخ", "لحم قليل الدهن", "سمك ابيض", "شيش طاووق", "كفته دجاج", "كفته لحم", "ضاني"];
  var DINNER_S = ["رز", "رز بني", "بطاطا", "مكرونه بر", "بطاطس مشويه", "برغل"];
  var BREAD = ["توست بني", "خبز بني", "عيش شامي", "فينو"];
  var PLATE_S = ["رز", "رز بني", "بطاطا", "بطاطس", "بطاطس مشويه", "مكرونه", "مكرونه بر", "برغل", "كينوا", "كسكسي"];
  var PLATE_F = ["زيت زيتون", "لوز", "عين جمل", "افوكادو", "زيتون", "طحينه", "كاجو"];
  var SAVORY_F = ["زيت زيتون", "افوكادو", "زيتون", "طحينه"];
  var NUTS = ["لوز", "عين جمل", "كاجو", "فستق", "بندق", "بيكان", "ماكاداميا", "جوز برازيلي", "فول سوداني", "زبده فول سوداني", "زبده اللوز", "شيا", "بذور الكتان", "لب عباد الشمس", "لب قرع", "سمسم"];
  /* m: وضع كل مجموعة في القالب: r=لازم o=اختياري n=ممنوع | dc: نوع الألبان المسموح (y زبادي / m حليب) | w: وزن القالب في التوزيع | max: أقصى نسبة من الخيارات */
  var SHAPES = {
    b: [
      { id: "egg", n: "بيض", w: 2, max: 0.3, p1: ["بيض"], p2: ["تركي مدخن", "روست بيف", "بسطرمه", "صدر فراخ", "جبنه بيضه قليله الملح", "جبنه بيضه قليله الدسم", "موتزاريلا قليله الدسم", "سلمون مدخن", "جبنه قريش", "جبنه رومي"], s: BREAD, m: { s: "r", v: "r", fr: "o", f: "o", d: "r" }, fl: SAVORY_F, dc: "y" },
      { id: "foul", n: "فول / طعمية / بقوليات", w: 2, max: 0.35, p1: ["فول", "طعميه", "حمص بالطحينه", "عدس", "حمص"], p2: ["بيض", "جبنه بيضه قليله الملح", "جبنه بيضه قليله الدسم", "جبنه بيضه", "واي بروتين"], s: ["خبز بني", "عيش شامي", "فينو", "توست بني"], m: { s: "r", v: "r", fr: "o", f: "o", d: "r" }, fl: ["زيت زيتون", "طحينه", "زيتون"], dc: "y" },
      { id: "chz", n: "جبنة وخضار", w: 2, max: 0.4, p1: ["جبنه قريش", "جبنه بيضه قليله الملح", "جبنه بيضه قليله الدسم", "جبنه بيضه", "جبنه رومي", "جبنه فلمنك", "جبنه مثلثات", "لبنه", "موتزاريلا قليله الدسم", "ريكوتا"], p2: ["بياض بيض", "تركي مدخن", "روست بيف", "بسطرمه", "بيض"], s: BREAD, m: { s: "r", v: "r", fr: "o", f: "o", d: "r" }, fl: SAVORY_F, dc: "ym" },
      { id: "sand", n: "ساندوتش / توست لحوم باردة وتونة", w: 2, max: 0.4, p1: ["تركي مدخن", "روست بيف", "بسطرمه", "صدر فراخ", "تونه", "سلمون مدخن", "لانشون فراخ", "لانشون"], p2: ["بياض بيض", "بيض", "لانشون فراخ", "لانشون"], s: BREAD, m: { s: "r", v: "r", fr: "o", f: "o", d: "r" }, fl: SAVORY_F, dc: "y" },
      { id: "soy", n: "توفو / تمبيه", w: 1, max: 0.3, p1: ["توفو", "تمبيه", "ايدامامي"], p2: ["بيض"], s: BREAD, m: { s: "r", v: "r", fr: "o", f: "o", d: "r" }, fl: SAVORY_F, dc: "m" },
      { id: "bowl", n: "شوفان / زبادي", w: 1, max: 0.3, p1: ["زبادي يوناني خالي الدسم", "جبنه قريش", "ريكوتا", "واي بروتين"], p2: ["واي بروتين"], s: ["شوفان", "كورن فليكس"], m: { s: "r", v: "n", fr: "r", f: "o", d: "r" }, fl: NUTS, dc: "m" }
    ],
    l: [
      { id: "plate", n: "طبق", w: 1, max: 1, p1: LUNCH_P, p2: null, s: PLATE_S, m: { s: "r", v: "r", fr: "n", f: "r", d: "n" }, fl: PLATE_F, plate: true }
    ],
    d: [
      { id: "plate", n: "طبق", w: 3, max: 1, p1: DINNER_P, p2: null, s: DINNER_S, m: { s: "r", v: "r", fr: "n", f: "r", d: "r" }, fl: PLATE_F, plate: true, dc: "y" },
      { id: "light", n: "عشاء خفيف", w: 1, max: 0.3, p1: ["فول", "بيض", "تونه", "تركي مدخن"], p2: ["بيض", "جبنه بيضه", "جبنه بيضه قليله الملح"], s: BREAD, m: { s: "r", v: "r", fr: "n", f: "o", d: "r" }, fl: ["زيت زيتون", "طحينه"], dc: "y" }
    ]
  };
  /* توافق الأصناف جوه الخيار الواحد (p1 / p2 / الألبان): تونة/سمك مع جبنة أو زبادي أو بقوليات أو لحوم، وبقوليات مع لحوم باردة، وصنفين لحوم باردة: مرفوضين */
  function pcat(it) {
    if (!it) return "";
    if (it.tags.indexOf("fsh") >= 0 || it.tags.indexOf("shl") >= 0) return "fish";
    if (isDairy(it)) return (YOGOK && (it.cat === "y" || /زبادي/.test(it.lab))) ? "yog" : "dairy"; /* فطار/عشاء: الزبادي مسموح مع التونة والسمك (الحليب والجبنة لأ) */
    if (it.fam === "leg" || it.fam === "soy") return "leg";
    if (it.tags.indexOf("prc") >= 0) return "proc";
    if (it.tags.indexOf("flesh") >= 0) return "meat";
    return "";
  }
  var YOGOK = false; /* بيتظبط في بداية كل توليد: true للفطار والعشاء */
  var BADPAIR = { "fish|dairy": 1, "fish|leg": 1, "fish|proc": 1, "fish|meat": 1, "leg|proc": 1, "leg|meat": 1, "proc|proc": 1, "meat|proc": 1 };
  function pairBad(a, b) { var x = pcat(a), y = pcat(b); if (!x || !y) return false; return !!(BADPAIR[x + "|" + y] || BADPAIR[y + "|" + x]); }
  function badCombos(items) { var n = 0; for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) if (items[i] && items[j] && pairBad(items[i], items[j])) n++; return n; }
  function isDairy(it) { return !!it && (it.fam === "dai" || it.cat === "y" || it.cat === "m"); }
  function inLabs(it, labs) { return !labs || labs.indexOf(it.lab) >= 0; }

  function generateSmart(o) {
    prepare();
    var t0 = Date.now(), budget = o.ms || 1100;
    var meal = o.meal || "b", diet = dietById(o.diet), N = Math.max(1, Math.min(12, o.n || 7));
    if (!SHAPES[meal]) return null;
    var needD = (meal === "b" || meal === "d") && !diet.nd; YOGOK = (meal === "b" || meal === "d"); /* فطار وعشاء: لازم حصة زبادي/لبن في كل خيار (الأنيميا استثناء: الألبان بتقلل امتصاص الحديد فبتفضل اختيارية) */
    var ban = banSet(diet, o.allergies), rnd = rngFrom(o.seed || (Date.now() & 0xffffff)), warnings = [];
    var Tg = { k: +o.k, p: +o.p, c: +o.c, f: +o.f };
    if (!(Tg.k > 0) || !(Tg.p >= 0) || !(Tg.c >= 0) || !(Tg.f >= 0)) return { ok: false, error: "اكتب السعرات والبروتين والكارب والدهون." };
    if (Tg.k < 350) warnings.push("السعرات قليلة: الحد الأدنى العملي لوجبة فيها المجموعات الست حوالي ٣٥٠ سعرة، فالدقة هتقل.");
    var notes = []; fixK(Tg, notes);

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
    var gen = NXe.calcOpt("100 ج سلطه"), gx = gen && gen.items && gen.items[0];
    if (gx && gx.ok && !ban.acid && !o.only && !diet.vk) {
      vegAll.push({ meals: "bld", lab: "سلطه", kind: "gen", tags: [], mu: { k: gen.t.k / 100, p: gen.t.p / 100, c: gen.t.c / 100, f: gen.t.f / 100 } });
    }
    if (pool.d.some(function (x) { return x.cat === "m" && !x.alt; })) pool.d = pool.d.filter(function (x) { return !x.alt; });
    if (!pool.p1.length) return { ok: false, error: "مفيش أي مصدر بروتين متاح مع القيود المختارة." };
    if (meal !== "b") { var vNo = vegAll.filter(function (v) { return v.tags.indexOf("hcv") < 0; }); if (vNo.length >= 3) vegAll = vNo; } /* بنجر/قرع/جزر مش خضار طبق أساسي: بره الغداء والعشا */
    var salads = buildSalads(N, meal, vegAll, ban, rnd, diet);
    if (!salads) warnings.push("مفيش خضار متاح مع القيود المختارة.");

    /* ---- القوالب المتاحة فعلاً للنظام والأصناف المختارة ---- */
    var pMaxOf = function (it) { return it.mu.p * bounds(it, diet)[1] * it.step; };
    var thr = 0.8 * Math.max(0, Tg.p - 6);
    var capable = pool.p1.filter(function (it) { return pMaxOf(it) >= thr; });
    var need = Math.min(N, 3);
    var shapes = [];
    SHAPES[meal].forEach(function (S) {
      if (o._skip && o._skip.indexOf(S.id) >= 0) return;
      var sh = { id: S.id, n: S.n, w: S.w, max: Math.max(1, Math.round(S.max * N)), m: {}, c: {} };
      var base;
      if (S.plate) {
        var labd = pool.p1.filter(function (x) { return inLabs(x, S.p1); }); if (!labd.length) labd = pool.p1;
        var capd = labd.filter(function (x) { return pMaxOf(x) >= thr; });
        sh.capOk = capd.length >= need; base = sh.capOk ? capd : labd;
      } else base = pool.p1.filter(function (x) { return inLabs(x, S.p1); });
      sh.c.p1 = base;
      sh.c.p2 = (S.plate ? (sh.capOk ? [] : pool.p2) : (S.p2 ? pool.p2.filter(function (x) { return inLabs(x, S.p2); }) : []));
      var sl = pool.s.filter(function (x) { return inLabs(x, S.s); }); if (!sl.length) sl = pool.s;
      sh.c.s = sl;
      sh.c.fr = S.m.fr === "n" ? [] : pool.fr;
      var fl = pool.f.filter(function (x) { return inLabs(x, S.fl); }); if (!fl.length) fl = pool.f;
      sh.c.f = fl;
      sh.c.d = (S.m.d === "n" || !S.dc) ? [] : pool.d.filter(function (x) { return S.dc.indexOf(x.cat) >= 0; });
      if (S.dc === "y" && !sh.c.d.length) sh.c.d = (needD && pool.d.length && pool.d.every(function (x) { return x.alt; })) ? pool.d : []; /* نباتي/حساسية لبن: مفيش زبادي، فنستخدم الحليب النباتي بدل ما الوجبة تطلع من غير كالسيوم */
      ["s", "fr", "f", "d"].forEach(function (g) { sh.m[g] = sh.c[g].length ? S.m[g] : "n"; });
      sh.m.p2 = sh.c.p2.length ? (S.plate ? "o" : "o") : "n";
      sh.m.v = (salads ? S.m.v : "n");
      /* عشاء خفيف: لازم يغطي بروتين الوجبة تقريبًا (أكبر بروتين أساسي + أكبر مساعد) */
      if (S.id === "light") {
        var mp1 = 0, mp2 = 0; sh.c.p1.forEach(function (x) { mp1 = Math.max(mp1, pMaxOf(x)); }); sh.c.p2.forEach(function (x) { mp2 = Math.max(mp2, pMaxOf(x)); });
        if (mp1 + mp2 < 0.85 * Tg.p) return;
      }
      if (!sh.c.p1.length) return;
      if (!S.plate && S.id !== "light") {
        var q1 = 0, q2 = 0, qd = 0, qs = 0;
        sh.c.p1.forEach(function (x) { q1 = Math.max(q1, pMaxOf(x)); }); sh.c.p2.forEach(function (x) { q2 = Math.max(q2, pMaxOf(x)); });
        sh.c.d.forEach(function (x) { qd = Math.max(qd, pMaxOf(x)); }); sh.c.s.forEach(function (x) { qs = Math.max(qs, pMaxOf(x)); });
        if (S.id === "bowl") { /* الشوفان/الزبادي من غير واي بروتين مش بيوصل لبروتين عالي: القالب بيشتغل بس لو الأرقام تسمح (بدون الاعتماد على البيض) */
          q2 = 0; sh.c.p2.forEach(function (x) { if (x.fam !== "egg") q2 = Math.max(q2, pMaxOf(x)); });
          if (q1 + q2 < 0.85 * Tg.p) return;
        }
        if (q1 + q2 + qd + qs < 0.9 * Tg.p) return; /* القالب ده مش هيوصل لبروتين الوجبة مهما اتظبط: نستبعده */
      }
      if (S.m.s === "r" && !sh.c.s.length && !(diet.off && diet.off.indexOf("s") >= 0)) { /* مفيش نشويات ممكنة: القالب يشتغل من غيرها */ }
      shapes.push(sh);
    });
    if (!shapes.length) return null;
    if (shapes.some(function (x) { return x.id === "plate" && !x.capOk; })) warnings.push("مفيش بروتين أساسي بيغطي بروتين الوجبة لوحده مع القيود دي — الخيارات بتجمّع بروتين مساعد.");

    /* ---- توزيع القوالب على الخيارات (لكل قالب حد أقصى، وأكبر تنوع ممكن) ---- */
    /* لو سقف القوالب (النسبة القصوى لكل قالب) أقل من عدد الخيارات: نرفعه لعدد أنواع البروتين الفعلي في القالب بدل ما نكرر نفس الصنف (مثلاً نباتي صرف) */
    var capSum = 0; shapes.forEach(function (sh) { capSum += sh.max; });
    if (capSum < N) shapes.forEach(function (sh) { if (!sh.c.p1.every(function (x) { return x.fam === "egg"; })) sh.max = Math.max(sh.max, sh.c.p1.length); });
    var counts = shapes.map(function () { return 0; }), assign = [];
    var iL = -1, iP = -1; shapes.forEach(function (x, k) { if (x.id === "light") iL = k; if (x.id === "plate") iP = k; });
    if (meal === "d" && iL >= 0 && iP >= 0) { /* العشاء: ٣ من ٧ خفيف (فول/بيض/تونه/تركي) والباقي أطباق زي الغداء */
      var nl = N < 2 ? 0 : Math.max(1, Math.round(N * 3 / 7));
      for (var q0 = 0; q0 < N; q0++) assign.push(q0 < nl ? iL : iP);
      shapes[iL].max = nl; shapes[iP].max = N - nl;
    } else

    for (var ai = 0; assign.length < N && ai < N; ai++) {
      var bi = -1, bs = 1e9;
      for (var si = 0; si < shapes.length; si++) {
        if (counts[si] >= shapes[si].max) continue;
        var sc = counts[si] / shapes[si].w + rnd() * 0.01;
        if (sc < bs) { bs = sc; bi = si; }
      }
      if (bi < 0) { bi = 0; for (var sj = 1; sj < shapes.length; sj++) if (counts[sj] / shapes[sj].w < counts[bi] / shapes[bi].w) bi = sj; }
      counts[bi]++; assign.push(bi);
    }
    assign = shuffle(assign, rnd);

    var unionP1 = {}; shapes.forEach(function (sh) { sh.c.p1.forEach(function (x) { unionP1[x.id] = 1; }); });
    var nP1 = Object.keys(unionP1).length;
    if (nP1 < N) warnings.push("أنواع البروتين المتاحة (" + ar(nP1) + ") أقل من عدد الخيارات — هيتكرر بعضها.");
    var GN = { s: "النشويات", f: "الدهون" };
    ["s", "f"].forEach(function (g) {
      if (!pool[g].length && !(diet.off && diet.off.indexOf(g) >= 0)) warnings.push("مفيش أصناف متاحة لمجموعة " + GN[g] + " مع القيود المختارة — الخيارات هتطلع من غيرها.");
    });

    var eggCap = Math.max(1, Math.ceil(N / 4));
    var SL = ["p1", "p2", "s", "fr", "f", "d"];
    function capOf(len, base) { return Math.max(base, Math.ceil(N / Math.max(1, len))); }
    var CAP = { p1: capOf(nP1, 1), s: capOf(pool.s.length, 1), f: capOf(pool.f.length, 1), fr: capOf(pool.fr.length, 2) };
    function itemCap(sl, it) {
      if (sl === "p1") return it.fam === "egg" ? eggCap : CAP.p1;
      if (sl === "f" && it.lab === "زيت زيتون") return meal === "b" ? Math.max(2, Math.ceil(N / 2)) : N;
      if (sl === "s" && (it.lab === "رز" || it.lab === "عيش شامي" || it.lab === "توست بني")) return Math.max(CAP.s, Math.ceil(N / 3));
      return CAP[sl] || 99;
    }
    var cache = {};
    function optKey(op, i) { return [op.nv ? 1 : 0, op.p1.id, op.p2 ? op.p2.id : 0, op.s ? op.s.id : 0, op.fr ? op.fr.id : 0, op.f ? op.f.id : 0, op.d ? op.d.id : 0, i].join("|"); }
    function solveOpt(op, i) {
      var key = optKey(op, i); if (cache[key]) return cache[key];
      var vars = [], sv = (salads && !op.nv) ? salads[i].m : { k: 0, p: 0, c: 0, f: 0 };
      SL.forEach(function (sl) {
        var it = op[sl]; if (!it) return; var b = bounds(it, diet);
        vars.push({ sl: sl, it: it, k: it.mu.k * it.step, p: it.mu.p * it.step, c: it.mu.c * it.step, f: it.mu.f * it.step, lo: b[0], hi: b[1] });
      });
      var r = solve(vars, sv, Tg); r.vars = vars; cache[key] = r; return r;
    }
    function tagsOf(op, i) { var t = []; SL.forEach(function (sl) { if (op[sl]) t = t.concat(op[sl].tags); }); if (salads && !op.nv) t = t.concat(salads[i].tags); return t; }
    function p2ok(a, b) { return a !== b && a.fam !== b.fam && !pairBad(a, b); }

    /* قواعد صارمة: بترجّع عدد المخالفات (لازم صفر) */
    function viol(st) {
      var v = 0, eggOpts = 0, eggwOpts = 0, org = 0;
      st.forEach(function (op, i) {
        var dc = 0, eg = 0, whole = 0;
        (needD ? [op.p1, op.p2] : [op.p1, op.p2, op.d]).forEach(function (it) { if (isDairy(it)) dc++; });
        [op.p1, op.p2].forEach(function (it) { if (it && it.fam === "egg") { eg++; if (it.tags.indexOf("eggw") < 0) whole++; } });
        if (dc > 1) v++;
        if (needD && shapes[op.sh].m.d === "r" && !op.d) v++;
        if (eg > 1) v++;
        if (whole) eggOpts++; else if (eg) eggwOpts++;
        if (op.p2 && op.p1.fam === op.p2.fam) v++;
        v += badCombos([op.p1, op.p2, op.d]);
        if (op.p1.tags.indexOf("ses") >= 0 && op.f && op.f.tags.indexOf("ses") >= 0) v++;
        if (tagsOf(op, i).indexOf("org") >= 0) org++;
      });
      if (eggOpts > eggCap) v += eggOpts - eggCap;
      if (eggwOpts > eggCap) v += eggwOpts - eggCap;
      if (org > 1) v += org - 1;
      return v;
    }
    function penalty(st) {
      var c = 0, i, cnt = {};
      for (i = 0; i < st.length; i++) {
        var op = st[i];
        if (op.p2) c += 0.08;
        if (i && op.fr && op.fr === st[i - 1].fr) c += 0.6;
        if (i && salads && !op.nv && !st[i - 1].nv && salads[i].style === salads[i - 1].style) c += 0.15;
        if (i && op.sh === st[i - 1].sh && shapes.length > 1) c += 0.2;
        if (op.p1.tags.indexOf("ses") >= 0 && op.f && op.f.tags.indexOf("ses") >= 0) c += 1;
        var tg = tagsOf(op, i), seen = {};
        tg.forEach(function (t) { if (seen[t]) return; seen[t] = 1; cnt[t] = (cnt[t] || 0) + 1; if (diet.pen && diet.pen[t]) c += 0.5 * diet.pen[t]; if (diet.bst && diet.bst[t]) c -= 0.3 * diet.bst[t]; });
        var fam = op.p1.fam; cnt["fam:" + fam] = (cnt["fam:" + fam] || 0) + 1;
      }
      Object.keys(cnt).forEach(function (k) { if (k.indexOf("fam:") === 0 && cnt[k] > 3 && N >= 5 && k !== "fam:egg") c += (cnt[k] - 3) * 0.8; });
      if (diet.cap) Object.keys(diet.cap).forEach(function (t) { if ((cnt[t] || 0) > diet.cap[t]) c += 6 * (cnt[t] - diet.cap[t]); });
      var pu = {}; st.forEach(function (op) { [op.p1, op.p2].forEach(function (it) { if (it && it.fam !== "egg") pu[it.id] = (pu[it.id] || 0) + 1; }); });
      Object.keys(pu).forEach(function (k) { if (pu[k] > 1) c += (pu[k] - 1) * 5; });
      for (var pa = 0; pa < st.length; pa++) for (var pb = pa + 1; pb < st.length; pb++) {
        var A = st[pa], B = st[pb];
        if (A.p1 === B.p1 && A.s && A.s === B.s) c += 1.2;
        else if (A.p1.fam === B.p1.fam && A.s && A.s === B.s) c += 0.3;
        if (A.fr && A.fr === B.fr) c += 0.3;
        if (A.f && A.f === B.f && A.f.lab !== "زيت زيتون") c += 0.25;
        if (A.d && A.d === B.d) c += 0.1;
      }
      return c;
    }
    /* إصلاح تلقائي للمخالفات بعد أي حركة: ألبان مكررة، بروتين مساعد من نفس العيلة، بيض زيادة عن الحد */
    function repairAll(st) {
      var i, n = 0;
      st.forEach(function (op) {
        if (op.p2 && (op.p2.fam === op.p1.fam)) op.p2 = null;
        var dc = (isDairy(op.p1) ? 1 : 0) + (isDairy(op.p2) ? 1 : 0) + (needD ? 0 : (isDairy(op.d) ? 1 : 0));
        if (dc > 1) {
          if (!needD && op.d && (isDairy(op.p1) || isDairy(op.p2))) op.d = null;
          else if (op.p2 && isDairy(op.p2) && isDairy(op.p1)) op.p2 = null;
        }
      });
      var isW = function (it) { return it.tags.indexOf("eggw") < 0; };
      st.forEach(function (op) { if ((op.p1.fam === "egg" && isW(op.p1)) || (op.p2 && op.p2.fam === "egg" && isW(op.p2))) n++; });
      for (i = st.length - 1; i >= 0 && n > eggCap; i--) { if (st[i].p2 && st[i].p2.fam === "egg" && isW(st[i].p2) && st[i].p1.fam !== "egg") { st[i].p2 = null; n--; } }
    }
    function total(st) { var t = penalty(st) + 40 * viol(st); for (var i = 0; i < st.length; i++) t += solveOpt(st[i], i).cost; return t; }
    function clone(st) { return st.map(function (x) { return Object.assign({}, x); }); }
    function count(stt, sl, it) { var n = 0; stt.forEach(function (op) { if (op[sl] === it) n++; }); return n; }
    function leastUsed(list, sl, stt) {
      var best = [], bn = 1e9;
      list.forEach(function (it) { var n = count(stt, sl, it); if (n < bn) { bn = n; best = [it]; } else if (n === bn) best.push(it); });
      return best[Math.floor(rnd() * best.length)];
    }
    function activeSlots(op) { return SL.filter(function (sl) { return shapes[op.sh].m[sl] !== "n" && shapes[op.sh].c[sl].length; }); }

    function run(ms) {
      var tA = Date.now(), st = [], i;
      for (i = 0; i < N; i++) st.push({ sh: assign[i], p1: null, p2: null, s: null, fr: null, f: null, d: null, nv: !(salads && shapes[assign[i]].m.v !== "n") });
      for (i = 0; i < N; i++) {
        var S = shapes[st[i].sh];
        st[i].p1 = leastUsed(S.c.p1, "p1", st);
        ["s", "fr", "f", "d"].forEach(function (g) {
          if (S.m[g] === "r" || (S.m[g] === "o" && rnd() < 0.5)) st[i][g] = leastUsed(S.c[g], g, st);
        });
        if (S.m.p2 === "o" && rnd() < 0.6) { var pc = S.c.p2.filter(function (x) { return p2ok(st[i].p1, x); }); if (pc.length) st[i].p2 = pc[Math.floor(rnd() * pc.length)]; }
        if (S.m.v === "o") st[i].nv = rnd() < 0.5;
      }
      repairAll(st);
      var cur = total(st), best = clone(st), bestT = cur, iter = 0;
      while (Date.now() - tA < ms && iter < 6000) {
        iter++;
        var temp = Math.max(0.03, 1 - (Date.now() - tA) / ms);
        var a = Math.floor(rnd() * N), op = st[a], S2 = shapes[op.sh], act = activeSlots(op), nst = clone(st);
        var sl = act[Math.floor(rnd() * act.length)], n2 = nst[a];
        if (!sl) continue;
        var mode = sl === "p1" ? "r" : S2.m[sl], cands = S2.c[sl], r = rnd();
        if (mode === "o" && r < 0.3) {
          if (n2[sl]) n2[sl] = null;
          else { var cc = sl === "p2" ? cands.filter(function (x) { return p2ok(n2.p1, x); }) : cands; if (!cc.length) continue; n2[sl] = cc[Math.floor(rnd() * cc.length)]; }
        } else if (r < 0.5 && N > 1) {
          var b = Math.floor(rnd() * N); if (b === a) continue;
          var o2 = nst[b], S3 = shapes[o2.sh];
          if (sl === "p2") continue;
          if ((n2[sl] && S3.c[sl].indexOf(n2[sl]) < 0) || (o2[sl] && S2.c[sl].indexOf(o2[sl]) < 0)) continue;
          if (S3.m[sl] === "r" && !n2[sl]) continue; if (S2.m[sl] === "r" && !o2[sl]) continue;
          var tmp = n2[sl]; n2[sl] = o2[sl]; o2[sl] = tmp;
          if (sl === "p1") { [n2, o2].forEach(function (x) { if (x.p2 && !p2ok(x.p1, x.p2)) x.p2 = null; }); }
        } else {
          var pl = sl === "p2" ? cands.filter(function (x) { return p2ok(n2.p1, x); }) : cands; if (!pl.length) continue;
          var cd = pl[Math.floor(rnd() * pl.length)];
          if (cd === n2[sl]) continue;
          if (sl !== "d" && sl !== "p2" && count(nst, sl, cd) >= itemCap(sl, cd)) continue;
          n2[sl] = cd; if (sl === "p1" && n2.p2 && !p2ok(cd, n2.p2)) n2.p2 = null;
        }
        repairAll(nst);
        var nt = total(nst);
        if (nt <= cur || rnd() < Math.exp(-(nt - cur) / temp)) { st = nst; cur = nt; if (cur < bestT) { bestT = cur; best = clone(st); } }
      }
      return { st: best, cost: bestT, viol: viol(best) };
    }

    var res = run(budget * 0.65);
    var remain = budget - (Date.now() - t0);
    if ((res.viol > 0) && remain > 80) { var r2 = run(remain * 0.9); if (r2.viol < res.viol || (r2.viol === res.viol && r2.cost < res.cost)) res = r2; }
    if (res.viol > 0) return null;
    var st = res.st;

    /* ---- تركيب النصوص + مراجعة نهائية بمحرك الحساب ---- */
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
      var text = parts.join(" + "), r = NXe.calcOpt(text);
      var weak = r.items.filter(function (x) { return !x.ok || x.weak; }).length;
      var ukeys = []; SL.forEach(function (sl) { if (st[i2][sl] && amt[sl] > 0) ukeys.push(st[i2][sl].key); });
      if (salads && !st[i2].nv && salads[i2].keys) ukeys = ukeys.concat(salads[i2].keys);
      options.push({ keys: ukeys, text: text, k: r.t.k, p: r.t.p, c: r.t.c, f: r.t.f, weak: weak, shape: shapes[st[i2].sh].id, p1: st[i2].p1.lab, s: st[i2].s ? st[i2].s.lab : "", fr: st[i2].fr ? st[i2].fr.lab : "", f_: st[i2].f ? st[i2].f.lab : "", d: st[i2].d ? st[i2].d.lab : "", dOk: !!(st[i2].d && amt.d > 0), dcat: st[i2].d ? st[i2].d.cat : "", fish: pcat(st[i2].p1) === "fish" || pcat(st[i2].p2) === "fish" });
    }
    function rng2(key) { var v = options.map(function (x) { return x[key]; }); return [Math.min.apply(null, v), Math.max.apply(null, v)]; }
    var rg = { k: rng2("k"), p: rng2("p"), c: rng2("c"), f: rng2("f") };
    var spread = { k: rg.k[1] - rg.k[0], p: rg.p[1] - rg.p[0], c: rg.c[1] - rg.c[0], f: rg.f[1] - rg.f[0] };
    var devMax = Math.max.apply(null, options.map(function (x) { return Math.max(Math.abs(x.p - Tg.p), Math.abs(x.c - Tg.c), Math.abs(x.f - Tg.f)); }));
    /* قالب مش قادر يوصل لأرقامك (مثلاً فول مع بروتين عالي جدًا): نستبعده ونعيد التوليد بالقوالب القادرة بس */
    if ((o._depth || 0) < 2 && Date.now() - t0 < budget * 1.5) {
      var badSh = {}; options.forEach(function (x) { if (Math.max(Math.abs(x.p - Tg.p), Math.abs(x.c - Tg.c), Math.abs(x.f - Tg.f)) > 4.5) badSh[x.shape] = 1; });
      var bl = Object.keys(badSh);
      if (bl.length && shapes.length - bl.length >= 1) {
        var again = generateSmart(Object.assign({}, o, { _skip: (o._skip || []).concat(bl), _depth: (o._depth || 0) + 1, ms: Math.max(300, budget * 0.8) }));
        if (again && again.ok && again.devMax < devMax - 0.5) return again;
      }
    }
    var okSpread = spread.p <= 5.01 && spread.c <= 5.01 && spread.f <= 5.01 && spread.k <= Tg.k * 0.03;
    if (!okSpread) warnings.push("الفرق بين الخيارات أكبر من المطلوب (بروتين " + ar(Math.round(spread.p * 10) / 10) + " / كارب " + ar(Math.round(spread.c * 10) / 10) + " / دهون " + ar(Math.round(spread.f * 10) / 10) + " جم). جرّب «إعادة توليد» أو وسّع الأطعمة المتاحة.");
    else if (devMax > 6) warnings.push("الخيارات قريبة من بعض لكن بعيدة عن أرقامك بحوالي " + ar(Math.round(devMax)) + " جم في أكتر ماكرو. جرّب «إعادة توليد» أو وسّع الأطعمة المتاحة.");
    if (options.some(function (x) { return x.weak; })) warnings.push("في خيار فيه صنف محتاج مراجعة في الحساب — راجع اللوحة اللي تحت.");
    return { ok: true, smart: true, needD: needD, options: options, range: rg, spread: spread, devMax: devMax, okSpread: okSpread, warnings: warnings, notes: notes, kUsed: Math.round(Tg.k), diet: diet, ms: Date.now() - t0, dropped: DROPPED.slice() };
  }

  /* الواجهة العامة: الذكي أولًا، ولو ما نفعش (أو حصل أي استثناء) بنرجع للقديم بنفس الشكل.
     لو النتيجة خرجت بفرق أكبر من المسموح بنعيد المحاولة بتوزيع عشوائي مختلف (في حدود الوقت) وناخد الأقرب لأرقامك. */
  function once(o) {
    if (o.smart !== false) {
      var r = null;
      try { r = generateSmart(o); } catch (e) { r = null; }
      /* الكيتو: القوالب الذكية أحيانًا مابتوصلش لأرقام الدهون العالية بدقة؛ لو الفرق طلع كبير نقارن بالنمط العام ونخد الأدق (أرقامك أهم) */
      if (r && r.ok && !r.okSpread && (o.meal === "b" || dietById(o.diet).fat2)) { /* الفطار (والكيتو): لو الذكي ماوصلش لأرقامك نقارن بالعام ونخد الأدق */
        var L2 = generateLegacy(Object.assign({}, o, { ms: Math.min(o.ms || 1100, 500) }));
        if (L2 && L2.ok && L2.okSpread) { L2.fallback = true; return L2; }
      }
      if (r) return r;
      var L = generateLegacy(o);
      if (L && L.ok) { L.fallback = true; L.warnings = (L.warnings || []).concat("القوالب الذكية مش كفاية للعدد/القيود دي (مثلاً ١٢ خيار بروتين عالي) فاتولّد بالنمط العام: راجع الخيارات بعينك أو قلّل العدد."); }
      return L;
    }
    return generateLegacy(o);
  }
  /* فطار/عشاء: كل خيار لازم فيه زبادي/لبن، ومفيش حليب مع تونة/سمك. بيرجّع عدد المخالفات */
  function dairyIssues(r) {
    if (!r || !r.ok || !r.needD) return 0;
    var n = 0; r.options.forEach(function (op) { if (!op.dOk) n++; if (op.fish && op.dcat === "m") n++; }); return n;
  }
  function better(a, b) { /* a أحسن من b؟ */
    if (!b || !b.ok) return !!(a && a.ok);
    if (!a || !a.ok) return false;
    var da = dairyIssues(a), db = dairyIssues(b); if (da !== db) return da < db; /* الأقل مخالفات ألبان الأول */
    if (!!a.okSpread !== !!b.okSpread) return !!a.okSpread;
    if (!!a.fallback !== !!b.fallback) return !a.fallback;
    return (a.devMax || 0) + (a.spread ? a.spread.p + a.spread.c + a.spread.f : 0) < (b.devMax || 0) + (b.spread ? b.spread.p + b.spread.c + b.spread.f : 0);
  }
  function generate(o) {
    o = o || {};
    var t0 = Date.now(), total = (o.ms || 1100) * 2.2, best = null, seed0 = o.seed || (Date.now() & 0xffffff);
    for (var a = 0; a < 4; a++) {
      var o2 = Object.assign({}, o, { seed: seed0 + a * 104729, ms: Math.min(o.ms || 1100, Math.max(250, total - (Date.now() - t0))) });
      var r = once(o2);
      if (better(r, best)) best = r;
      if (!best || !best.ok) break;
      if (best.okSpread && best.devMax <= 6 && !dairyIssues(best)) break;
      if (Date.now() - t0 > total - 250) break;
    }
    if (best && best.ok && dairyIssues(best)) { best.warnings = (best.warnings || []).concat("في خيار من غير زبادي/لبن (أو فيه حليب مع تونة) لأن الأصناف المتاحة مع القيود دي مش بتسمح — دوس «إعادة توليد» أو وسّع الألبان المعلّمة."); }
    return best;
  }

  root.NXG = { generate: generate, generateLegacy: generateLegacy, catalog: catalog, targets: targets, DIETS: DIETS, ALLERGENS: ALLERGENS, MEALS: MEALS, SHARE: SHARE, prepare: prepare, ar: ar, dietById: dietById, _pool: function () { prepare(); return { POOL: POOL, VEG: VEG, DROPPED: DROPPED }; } };
  if (typeof module !== "undefined" && module.exports) module.exports = root.NXG;
})(typeof window !== "undefined" ? window : globalThis);
