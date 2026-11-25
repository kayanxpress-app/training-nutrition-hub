/* محرك حساب السعرات والماكروز من نص الخيار (عربي / إنجليزي).
   دوال نقية بلا DOM ولا Supabase ولا أي اعتماد على app.js. يستخدمها الأدمن فقط كأداة مساعدة، ولا يغيّر شكل البيانات المحفوظة. */
(function(root){
"use strict";
const DB=(typeof NX_DB!=="undefined")?NX_DB:(typeof require!=="undefined"?require("./nutri-data.js"):"");

/* ---------- تعريف الحصة في نظام التبادل (قابل للتعديل) ---------- */
// key: العنصر الغذائي اللي بنقسمه، size: جرامات العنصر في الحصة الواحدة
const SERV={
  p:{key:"p",size:7,name:"بروتين",lbl:"٧ جم بروتين"},
  s:{key:"c",size:15,name:"نشويات",lbl:"١٥ جم كارب"},
  v:{key:"c",size:5,name:"خضار",lbl:"٥ جم كارب"},
  fr:{key:"c",size:15,name:"فاكهه",lbl:"١٥ جم كارب"},
  f:{key:"f",size:5,name:"دهون",lbl:"٥ جم دهون"},
  d:{key:"c",size:12,name:"البان",lbl:"١٢ جم كارب"}
};
const GORDER=["p","s","v","fr","f","d"];
const GNAME={p:"بروتين",s:"نشويات",v:"خضار",fr:"فاكهه",f:"دهون",d:"البان",o:"أخرى"};

/* ---------- تطبيع النص ---------- */
const AD="٠١٢٣٤٥٦٧٨٩",PD="۰۱۲۳۴۵۶۷۸۹",DOT="\u0001";
function norm(s){
  s=String(s==null?"":s);
  s=s.replace(/\u00A0/g," ").replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,""); // مسافات/رموز غير مرئية (بتيجي من كيبورد الموبايل / النسخ واللصق)
  s=s.replace(/[٠-٩]/g,c=>AD.indexOf(c)).replace(/[۰-۹]/g,c=>PD.indexOf(c));
  s=s.replace(/(\d)[٫,](\d)/g,"$1.$2").replace(/\u066C/g,"");
  s=s.replace(/½/g," 0.5 ").replace(/¼/g," 0.25 ").replace(/¾/g," 0.75 ").replace(/⅓/g," 0.333 ").replace(/⅔/g," 0.667 ");
  s=s.toLowerCase();
  s=s.replace(/[\u064B-\u065F\u0670\u0640]/g,"");
  s=s.replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/ء/g,"");
  s=s.replace(/(حبه|حبوب|قمح)\s+كامل(ه|ين)?/g,"قمحكامل").replace(/whole\s*-?\s*(wheat|grain)/g,"قمحكامل");
  s=s.replace(/(نص|نصف)\s+دسم/g,"نصفدسم");
  s=s.replace(/غير\s+مطبوخ(ه)?/g,"ني").replace(/قبل\s+(ال)?(طبخ|سلق|شوي|طهي)/g,"ني").replace(/بعد\s+(ال)?(طبخ|سلق|شوي|طهي)/g,"مطبوخ");
  s=s.replace(/(\d)\.(\d)/g,"$1"+DOT+"$2").replace(/\./g," ").replace(new RegExp(DOT,"g"),".");
  s=s.replace(/(\d)([^\d\s.\/])/g,"$1 $2").replace(/([^\d\s.\/])(\d)/g,"$1 $2");
  s=s.replace(/[^a-z0-9\u0600-\u06FF.\/\s]/g," ");
  return s.replace(/\s+/g," ").trim();
}
function tok(t){
  if(/^[a-z]+$/.test(t)&&t.length>3){
    if(t.endsWith("ies"))return t.slice(0,-3)+"y";
    if(/(ch|sh|x|ss|o)es$/.test(t))return t.slice(0,-2);
    if(t.endsWith("s")&&!t.endsWith("ss")&&!t.endsWith("us"))return t.slice(0,-1);
    return t;
  }
  if(t.length>=5&&t.startsWith("ال"))return t.slice(2);
  return t;
}
const toks=s=>norm(s).split(" ").filter(Boolean).map(tok);

/* ---------- الأرقام والوحدات ---------- */
const NUMW={};
[["واحد",1],["واحده",1],["اتنين",2],["اثنين",2],["اثنان",2],["تلاته",3],["ثلاثه",3],["تلات",3],["ثلاث",3],["اربعه",4],["اربع",4],["خمسه",5],["خمس",5],["سته",6],["ست",6],["سبعه",7],["سبع",7],["تمانيه",8],["ثمانيه",8],["تمان",8],["ثمان",8],["تسعه",9],["تسع",9],["عشره",10],["عشر",10],["نص",.5],["نصف",.5],["ربع",.25],["ثلث",1/3],["تلت",1/3]].forEach(a=>NUMW[norm(a[0])]=a[1]);
function numTok(t){
  if(/^\d+(\.\d+)?$/.test(t))return +t;
  const m=/^(\d+)\/(\d+)$/.exec(t);if(m&&+m[2])return +m[1]/+m[2];
  return NUMW[t]!=null?NUMW[t]:null;
}
const UNITS={};
const UW={
  g:"ج جم جرام غم غرام غ جرامات g gm gms gr gram",
  kg:"كجم كيلو كيلوجرام كيلوجرامات kg kilo kilogram",
  oz:"اوقيه اونصه اونس oz ounce",
  lb:"lb pound",
  ml:"مل ملل ملي ميلي ملليلتر مللي ml cc milliliter",
  l:"لتر l liter litre",
  tbsp:"ملعقه ملاعق معلقه معالق tbsp tablespoon spoon",
  cup:"كوب اكواب كوبايه كوبايات كباييه cup",
  scoop:"سكوب سكوبات scoop",
  slice:"شريحه شرايح slice",
  piece:"حبه حبات حبايه قطعه قطع ثمره ثمرات قرص اقراص فص فصوص piece unit clove pc pcs",
  can:"علبه علب can tin",
  bowl:"طبق اطباق كاسه كاسات bowl plate",
  handful:"حفنه حفنات handful"
};
Object.keys(UW).forEach(k=>UW[k].split(" ").forEach(w=>UNITS[tok(norm(w))]=k));
const UNAME={g:"جم",kg:"كجم",oz:"أونصة",lb:"باوند",ml:"مل",l:"لتر",tsp:"ملعقة صغيرة",tbsp:"ملعقة",cup:"كوب",scoop:"سكوب",slice:"شريحة",piece:"حبة",can:"علبة",bowl:"طبق",handful:"حفنة"};
const MASS={g:1,kg:1000,oz:28.35,lb:453.6},VOL={ml:1,l:1000};
const BIGW=new Set(["كبيره","كبار","كبير","اكل","طعام"].map(w=>tok(norm(w)))),SMALLW=new Set(["صغيره","صغار","صغير","شاي","قهوه"].map(w=>tok(norm(w))));
const NOISE=new Set(["من","في","of","the","an","كبير","كبيره","كبار","صغير","صغيره","وسط","متوسط","متوسطه","medium","large","small","طازج","طازجه","fresh","ساده","plain","تقريبا","حوالي","about","نيو"]);
const ST_RAW=new Set(["ني","نيي","خام","raw","uncooked","dry","جاف","جافه"].map(w=>tok(norm(w))));
const ST_COOK=new Set(["مسلوق","مسلوقه","مطبوخ","مطبوخه","مشوي","مشويه","مشوح","مغلي","مخبوز","مخبوزه","مبخر","cooked","boiled","grilled","baked","roasted","steamed"].map(w=>tok(norm(w))));
const ST_FRY=new Set(["مقلي","مقليه","محمر","محمره","fried"].map(w=>tok(norm(w))));
/* كلمات وصفية لا تغيّر القيمة الغذائية (طريقة تقديم / تفاصيل) — بنتجاهلها بدون تحذير، وبس لو الصنف اتفهم من غيرها */
const FILL=new Set(["فريش","بخار","بالبخار","مسحب","مسحبه","بدون","جلد","مصفاه"].map(w=>tok(norm(w))));
/* حجم الطبق للخضار/السلطة (جم) لما الكوتش يكتب صغير/متوسط/كبير */
const BOWLV={s:50,m:100,l:200};
const BOWL_OK=new Set(["salad","veg_mixed","lettuce","arugula","spinach","cabbage","cabbage_red","broccoli","cauliflower","carrot","zucchini","eggplant","green_beans","okra","molokhia","tomato","cucumber","pepper_green","pepper_red","mushroom","kale","asparagus","celery"]); // أصناف بتتاكل بالطبق فقط (مش ثوم/بصل/ليمون…)
const SZ_M=new Set(["متوسط","متوسطه","وسط","medium"].map(w=>tok(norm(w)))),SZ_L=new Set(["كبير","كبيره","كبار","large"].map(w=>tok(norm(w)))),SZ_S=new Set(["صغير","صغيره","small"].map(w=>tok(norm(w))));
const isState=t=>ST_RAW.has(t)||ST_COOK.has(t)||ST_FRY.has(t);

/* ---------- بناء الفهرس ---------- */
let BUILTIN=[],FOODS=[],CUSTOM=[],ALIASES=[],INDEX=new Map(),VOCAB=new Set(),DUAL={};
function expand(a){
  const m=/\{([^{}]*)\}/.exec(a);if(!m)return [a];
  return [].concat(...m[1].split("/").map(o=>expand(a.slice(0,m.index)+o+a.slice(m.index+m[0].length))));
}
function parseMac(t){const a=String(t).split(",").map(Number);return a.length===4&&a.every(x=>isFinite(x))?{k:a[0],p:a[1],c:a[2],f:a[3]}:null}
function parseDB(txt){
  const out=[];
  String(txt).split("\n").forEach(raw=>{
    const l=raw.trim();if(!l||l[0]==="#")return;
    const a=l.split("|");if(a.length<4)return;
    const mac=parseMac(a[3]);if(!mac)return;
    const al=[].concat(...a[2].split(",").map(x=>x.trim()).filter(Boolean).map(expand));
    const f={id:a[0].trim(),g:a[1].trim(),n:al[0],al,k:mac.k,p:mac.p,c:mac.c,f:mac.f,st:"",alt:null,pc:0,d:0,m:{},amb:"",est:false,zero:false,cust:false};
    (a[4]||"").split(/\s+/).filter(Boolean).forEach(o=>{
      const i=o.indexOf(":");if(i<0)return;const k=o.slice(0,i),v=o.slice(i+1);
      if(k==="st")f.st=v;else if(k==="alt")f.alt=parseMac(v);else if(k==="pc")f.pc=+v;else if(k==="d")f.d=+v;
      else if(k==="amb")f.amb=v.replace(/_/g," ");else if(k==="est")f.est=v==="1";else if(k==="zero")f.zero=v==="1";
      else if(["cup","tbsp","tsp","scoop","slice","can","bowl","handful"].includes(k))f.m[k]=+v;
    });
    out.push(f);
  });
  return out;
}
function rebuild(){
  const over=new Set(CUSTOM.map(c=>c.ov).filter(Boolean));
  FOODS=CUSTOM.concat(BUILTIN.filter(b=>!over.has(b.id)));
  ALIASES=[];INDEX=new Map();VOCAB=new Set();DUAL={};
  FOODS.forEach((f,fi)=>f.al.forEach(al=>{
    const t=[...new Set(toks(al))];if(!t.length)return;
    const ai=ALIASES.length;ALIASES.push({t,len:t.join("").length,fi,f});
    t.forEach(x=>{VOCAB.add(x);(INDEX.get(x)||INDEX.set(x,[]).get(x)).push(ai)});
  }));
  Object.keys(UNITS).forEach(u=>VOCAB.add(u));
  VOCAB.forEach(w=>{
    if(w.length<3||!/[\u0600-\u06FF]/.test(w))return;
    const d=w.endsWith("ه")?w.slice(0,-1)+"تين":w+"ين";
    if(!VOCAB.has(d)&&!DUAL[d])DUAL[d]=w;
  });
}
BUILTIN=parseDB(DB);rebuild();
function toFood(o){ // كائن مخصص (من Supabase) ← صنف جاهز للمحرك
  const al=[].concat(...(o.al||[]).concat([o.n]).filter(Boolean).map(x=>expand(String(x))));
  return {id:o.id||("c"+Math.random().toString(36).slice(2)),ov:o.ov||null,g:o.g||"o",n:o.n||al[0],al,k:+o.k||0,p:+o.p||0,c:+o.c||0,f:+o.f||0,st:o.st||"",alt:o.alt||null,pc:+o.pc||0,d:+o.d||0,m:o.m||{},amb:o.amb||"",est:!!o.est,zero:!!o.zero,cust:true};
}
function setCustom(list){CUSTOM=(list||[]).map(x=>{const f=toFood(x.data||x);if(x.id&&x.data){f.rowId=x.id;f.id=x.id}return f}).filter(f=>f.al.length);rebuild()}

/* ---------- تصحيح الأخطاء الإملائية (فرق حرف واحد) ---------- */
function ed1(a,b){
  if(a===b)return true;const la=a.length,lb=b.length;if(Math.abs(la-lb)>1)return false;
  let i=0;while(i<la&&i<lb&&a[i]===b[i])i++;
  if(la===lb){if(a.slice(i+1)===b.slice(i+1))return true;return a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2)}
  return la>lb?a.slice(i+1)===b.slice(i):b.slice(i+1)===a.slice(i);
}
function fixTok(t){
  if(VOCAB.has(t)||t.length<3||/\d/.test(t)||isState(t)||NOISE.has(t))return null;
  const c=[];VOCAB.forEach(v=>{if(v.length>=3&&ed1(t,v))c.push(v)});
  return c.length===1?c[0]:null;
}

/* ---------- تحليل قطعة واحدة ---------- */
const splitSegs=t=>String(t||"").split(/\s*[+＋]\s*|\s*[،;؛\n]\s*|\s+و\s+(?!نص|ربع|ثلث)|\s+(?:مع|and|with)\s+|\s*&\s*/i).map(x=>x.trim()).filter(Boolean);
const fmt1=n=>String(Math.round(n*10)/10);
function parseQty(T){
  T=T.slice();let qty=null,unit=null,had=false,dualQ=null;
  for(let i=0;i<T.length;i++){if(DUAL[T[i]]){dualQ=2;T[i]=DUAL[T[i]]}}
  let ni=-1;
  for(let i=0;i<T.length;i++){const v=numTok(T[i]);if(v!=null){ni=i;break}}
  if(ni>=0){
    qty=numTok(T[ni]);had=true;let end=ni+1;
    while(end<T.length){const v=numTok(T[end]);if(v!=null&&v<1&&/^(\d|\.)/.test(T[end]||"")){qty+=v;end++}else if(/^و?نص(ف)?$/.test(T[end])){qty+=.5;end++}else break}
    if(end<T.length&&UNITS[T[end]]){unit=UNITS[T[end]];end++}
    else{for(let i=0;i<T.length;i++)if(UNITS[T[i]]&&(i<ni||i>=end)){unit=UNITS[T[i]];T.splice(i,1);if(i<ni)ni--,end--;break}}
    T.splice(ni,end-ni);
  }else{
    const ui=T.findIndex(x=>UNITS[x]);
    if(ui>=0){unit=UNITS[T[ui]];qty=dualQ||1;had=true;T.splice(ui,1)}
    else if(dualQ){qty=2;had=true}
  }
  {const hi=T.findIndex(x=>/^ون(ص|صف)$/.test(x));if(hi>=0&&had){qty+=.5;T.splice(hi,1)}}
  if(unit==="tbsp"){ // ملعقة كبيرة/صغيرة/شاي
    const bi=T.findIndex(x=>SMALLW.has(x)||BIGW.has(x));
    if(bi>=0){if(SMALLW.has(T[bi]))unit="tsp";T.splice(bi,1)}
  }
  return {qty,unit,had,rest:T.filter(x=>x&&x!=="."&&numTok(x)==null)};
}
function findFood(T){
  const hits=new Map();
  new Set(T).forEach(t=>{const L=INDEX.get(t);if(L)L.forEach(ai=>hits.set(ai,(hits.get(ai)||0)+1))});
  let best=null,bs=null;
  hits.forEach((c,ai)=>{
    const A=ALIASES[ai];if(c!==A.t.length)return;
    const as=new Set(A.t),left=T.filter(t=>!as.has(t)&&!NOISE.has(t)&&!isState(t));
    const sc=[c,-left.length,A.len,-A.fi];
    if(!bs||sc[0]>bs[0]||(sc[0]===bs[0]&&(sc[1]>bs[1]||(sc[1]===bs[1]&&(sc[2]>bs[2]||(sc[2]===bs[2]&&sc[3]>bs[3]))))))
      {bs=sc;best={A,left,as}}
  });
  return best;
}
function gramsFor(f,q,u,had,size){
  if(f.zero)return {g:0};
  const M=f.m||{};
  if(!u){
    if(!had)return f.pc?{g:f.pc,u:"piece",q:1}:{err:"اكتب الكمية (مثلاً ١٠٠ جم)"};
    if(f.pc&&q<=30&&q*f.pc<=400)return {g:q*f.pc,u:"piece",q};
    if(q>=10)return {g:q,u:"g",q,assumed:true};
    return {err:"حدّد الوحدة (جم / كوب / ملعقة …)"};
  }
  if(MASS[u])return {g:q*MASS[u],u,q};
  if(VOL[u]){if(!f.d)return {err:"الصنف ده مش سائل — اكتبه بالجرام"};return {g:q*VOL[u]*f.d,u,q}}
  let w=null;
  if(u==="piece")w=f.pc||null;
  else if(u==="tsp")w=M.tsp||(M.tbsp?M.tbsp/3:(M.cup?M.cup/48:(f.d?5*f.d:null)));
  else if(u==="tbsp")w=M.tbsp||(M.cup?M.cup/16:(f.d?15*f.d:null));
  else if(u==="cup")w=M.cup||(f.d?240*f.d:null);
  else if(u==="slice")w=M.slice||(f.pc&&/توست|toast|bread/.test(f.id)?f.pc:null);
  else w=M[u]||null;
  if(u==="bowl"&&size&&BOWL_OK.has(f.id)&&BOWLV[size])w=BOWLV[size]; // طبق خضار/سلطة بحجم محدد
  if(!w)return {err:"مفيش وزن معروف لـ«"+UNAME[u]+"» مع الصنف ده — اكتبه بالجرام"};
  return {g:q*w,u,q,per:w};
}
function calcOne(src,inh){
  const it={src,ok:false,notes:[],food:null,g:0,m:{k:0,p:0,c:0,f:0},ex:{p:0,s:0,v:0,fr:0,f:0,d:0},weak:false,est:false};
  let T=toks(src);
  if(!T.length){it.err="فاضي";return it}
  const size=T.some(t=>SZ_M.has(t))?"m":T.some(t=>SZ_L.has(t))?"l":T.some(t=>SZ_S.has(t))?"s":"";
  const pq=parseQty(T);
  if(!pq.had&&inh&&inh.had){pq.qty=inh.qty;pq.unit=inh.unit;pq.had=true;it.inherited=true} // البديل بياخد نفس كمية الأول لو مفيش كمية
  it.pq={qty:pq.qty,unit:pq.unit,had:pq.had};
  let rest=pq.rest.filter(t=>!NOISE.has(t)||isState(t));
  let body=rest.filter(t=>!NOISE.has(t));
  let best=body.length?findFood(body):null;
  if(!best&&body.length){ // تصحيح إملائي: بنقبله بس لو الجملة كلها اتفهمت بعده (غير كده الصنف يفضل «غير معروف»)
    const fx=[];const nb=body.map(t=>{const x=fixTok(t);if(x){fx.push([t,x]);return x}return t});
    const b2=fx.length?findFood(nb):null;
    if(b2&&!b2.left.length){best=b2;body=nb;fx.forEach(a=>it.notes.push({t:"w",m:"فهمت «"+a[0]+"» على إنها «"+a[1]+"»"}));it.weak=true}
  }
  if(best&&best.left.length){ // كلمات وصفية/وحدة زيادة (بدون جلد، فريش، (ملعقة كبيرة)…) — نحاول من غيرها، ونقبل بس لو الفهم اتحسّن
    const sb=body.filter(t=>!FILL.has(t)&&!UNITS[t]);
    if(sb.length&&sb.length<body.length){const b2=findFood(sb);if(b2&&b2.A.f===best.A.f&&b2.left.length<best.left.length){best=b2;body=sb}}
  }
  if(!best){it.err="صنف غير معروف";it.unknown=true;it.mod=body.every(t=>FILL.has(t)||isState(t)||UNITS[t]);return it}
  const f=best.A.f;it.food=f;
  const sw=body.filter(t=>isState(t)&&!best.as.has(t));
  let st=null;if(sw.some(t=>ST_RAW.has(t)))st="r";else if(sw.some(t=>ST_COOK.has(t)))st="c";else if(sw.some(t=>ST_FRY.has(t)))st="f";
  if(best.left.length){it.notes.push({t:"w",m:"كلمات لم تُفهم: "+best.left.join(" ")+" — راجع الصنف"});it.weak=true}
  let m={k:f.k,p:f.p,c:f.c,f:f.f};
  if(st==="f"){it.notes.push({t:"w",m:"مقلي: الزيت غير محسوب — أضفه كمكوّن لو لزم"})}
  else if(st&&f.st&&st!==f.st){
    if(f.alt)m=f.alt;
    else{it.notes.push({t:"w",m:"مفيش قيمة معروفة لل"+(st==="r"?"نيء":"مطبوخ")+" — محسوب ك"+(f.st==="c"?"مطبوخ":"نيء")});it.weak=true}
  }
  if(!st&&f.amb)it.notes.push({t:"i",m:f.amb});
  if(f.est){it.est=true;it.notes.push({t:"i",m:"قيمة تقديرية — راجعها"})}
  const gr=gramsFor(f,pq.qty,pq.unit,pq.had,size);
  if(gr.err){it.err=gr.err;it.bad=true;return it}
  if(gr.assumed){it.notes.push({t:"w",m:"مفيش وحدة — افترضت إن الرقم بالجرام"});it.weak=true}
  it.g=gr.g;it.u=gr.u;it.q=gr.q;it.per=gr.per||(gr.u==="piece"?f.pc:0);
  const r=gr.g/100;
  it.m={k:m.k*r,p:m.p*r,c:m.c*r,f:m.f*r};
  const S=SERV[f.g];if(S)it.ex[f.g]=it.m[S.key]/S.size;
  it.ok=true;return it;
}
/* بدائل جوه نفس المكوّن («افوكادو او ملعقة زيت زيتون» / «فريش او بخار»):
   - جزء وصفي بس (مشوي / بخار …) بيتجاهل. - أول بديل متفهم هو اللي بيتحسب، والباقي بيظهر كملاحظة بسعراته ومش داخل في الإجمالي. */
const ALT_RE=/\s+(?:أو|او|or)\s+/i;
function calcSeg(src){
  const parts=String(src==null?"":src).split(ALT_RE).map(x=>x.trim()).filter(Boolean);
  if(parts.length<2)return calcOne(src);
  const rs=[];let inh=null;
  parts.forEach(p=>{const r=calcOne(p,inh);rs.push(r);if(!inh&&r.pq&&r.pq.had&&!r.inherited)inh=r.pq});
  const ch=rs.find(r=>r.ok);
  if(!ch){const r=rs.find(x=>!x.mod)||rs[0];r.src=src;return r}
  const out=Object.assign({},ch,{src,notes:ch.notes.slice()});
  rs.forEach(r=>{
    if(r===ch||r.mod)return;
    if(r.ok)out.notes.push({t:"i",m:"بديل «"+r.src+"»: "+Math.round(r.m.k)+" سعرة — مش داخل في الإجمالي (المحسوب أول بديل)"});
    else{out.notes.push({t:"w",m:"جزء غير محسوب: «"+r.src+"» — "+(r.err||"غير معروف")});out.weak=true}
  });
  return out;
}
/* ---------- خيار كامل / وجبة / يوم ---------- */
/* صيغة السلطة: «١٠٠ ج فلفل اخضر + خس + خيار» = وزن الطبق كله ١٠٠ جم (مش ١٠٠ لكل صنف).
   القاعدة: خضار أول مكوّن له وزن بالجرام، وبعده خضار تانية من غير أي كمية ← بيتقسم الوزن بينهم بالتساوي، والسعرات تتحسب على ده.
   نفس الشيء لو كتبتها بأقواس «١٠٠ ج (فلفل اخضر + خس + خيار)» (الأقواس بتتجاهل). بتقف عند أول مكوّن ليه كمية أو مش خضار. */
const SAL_X=new Set(["salad","veg_mixed"]);
const isSalLead=r=>!!(r&&r.ok&&r.food&&r.food.g==="v"&&!SAL_X.has(r.food.id)&&r.pq&&r.pq.had&&!r.inherited&&r.u==="g"&&r.g>0);
const isSalFol=r=>!!(r&&r.food&&r.food.g==="v"&&!SAL_X.has(r.food.id)&&r.pq&&!r.pq.had);
function groupSalad(items){
  for(let i=0;i<items.length;i++){
    const L=items[i];if(!isSalLead(L))continue;
    const F=[];for(let j=i+1;j<items.length&&isSalFol(items[j]);j++)F.push(j);
    if(!F.length)continue;
    const n=F.length+1,W=L.g,share=W/n,sh=String(+share.toFixed(3));
    // المكوّن الأول: نفس قيمه لكن بحصته من الوزن الكلي
    L.g=share;if(L.q)L.q=L.q/n;
    ["k","p","c","f"].forEach(x=>L.m[x]/=n);
    Object.keys(L.ex).forEach(g=>L.ex[g]/=n);
    L.notes.push({t:"i",m:"سلطة من "+n+" أنواع وزنها الكلي "+(+W.toFixed(1))+" جم (محسوبة بالتساوي: "+(+share.toFixed(1))+" جم لكل نوع)"});
    // باقي المكوّنات: بتتحسب بنفس الحصة
    F.forEach(k=>{
      const o=items[k],r=calcSeg(sh+" ج "+o.src);
      if(r&&r.ok){r.src=o.src;r.inSalad=true;items[k]=r}
    });
  }
  return items;
}
/* عرض الخيار في صفحة العميل: مكوّنات السلطة (خضار بوزن كلي + خضار من غير كمية) بتظهر في زرار واحد «١٠٠ ج (فلفل اخضر + خس + خيار)».
   بترجّع مصفوفة نصوص (واحد لكل زرار). عرض فقط: النص المحفوظ ما بيتغيرش. لو مفيش سلطة بترجّع نفس التقسيم القديم على + */
function chips(text){
  const segs=String(text==null?"":text).split(/\s*[+＋]\s*/).map(x=>x.trim()).filter(Boolean);
  let rs;try{rs=segs.map(calcSeg)}catch(e){return segs}
  const out=[];
  for(let i=0;i<segs.length;i++){
    if(isSalLead(rs[i])){
      const m=/^([\d٠-٩۰-۹][\d٠-٩۰-۹.,٫\/]*\s*(?:كجم|كيلو|جرام|جم|غ|ج|kg|gm|gr|g)?)\s+(\S.*)$/i.exec(segs[i]);
      const F=[];for(let j=i+1;j<segs.length&&isSalFol(rs[j]);j++)F.push(segs[j]);
      if(m&&F.length){out.push(m[1].trim()+" ("+[m[2]].concat(F).join(" + ")+")");i+=F.length;continue}
    }
    out.push(segs[i]);
  }
  return out;
}
function calcOpt(text){
  const items=groupSalad(splitSegs(text).map(calcSeg)),T={k:0,p:0,c:0,f:0},EX={p:0,s:0,v:0,fr:0,f:0,d:0};
  let bad=0,weak=0,est=0;
  items.forEach(i=>{
    if(!i.ok){bad++;return}
    ["k","p","c","f"].forEach(x=>T[x]+=i.m[x]);GORDER.forEach(g=>EX[g]+=i.ex[g]);
    if(i.weak)weak++;if(i.est)est++;
  });
  return {items,t:T,ex:EX,bad,weak,est,complete:bad===0&&items.length>0};
}
function calcMeal(opts){
  const rs=(opts||[]).map(calcOpt),ok=rs.filter(r=>r.complete);
  const z=()=>({k:0,p:0,c:0,f:0});
  const out={rs,n:rs.length,counted:ok.length,avg:z(),min:z(),max:z(),ex:{p:0,s:0,v:0,fr:0,f:0,d:0},skipped:rs.map((r,i)=>r.complete?-1:i).filter(i=>i>=0)};
  if(!ok.length)return out;
  ["k","p","c","f"].forEach(x=>{const v=ok.map(r=>r.t[x]);out.avg[x]=v.reduce((a,b)=>a+b,0)/v.length;out.min[x]=Math.min(...v);out.max[x]=Math.max(...v)});
  GORDER.forEach(g=>out.ex[g]=ok.reduce((a,r)=>a+r.ex[g],0)/ok.length);
  out.spread=out.avg.k?(out.max.k-out.min.k)/out.avg.k:0;
  return out;
}
function calcDay(meals){ // meals: {key:{t,opts}}
  const keys=Object.keys(meals||{}),ms=keys.map(k=>({key:k,t:meals[k].t,r:calcMeal(meals[k].opts)}));
  const z=()=>({k:0,p:0,c:0,f:0}),d={ms,avg:z(),min:z(),max:z(),ex:{p:0,s:0,v:0,fr:0,f:0,d:0},missing:ms.filter(m=>m.r.counted===0).map(m=>m.t)};
  ms.forEach(m=>{["k","p","c","f"].forEach(x=>{d.avg[x]+=m.r.avg[x];d.min[x]+=m.r.min[x];d.max[x]+=m.r.max[x]});GORDER.forEach(g=>d.ex[g]+=m.r.ex[g])});
  return d;
}
const API={norm,toks,splitSegs,calcSeg,calcOpt,chips,calcMeal,calcDay,setCustom,SERV,GORDER,GNAME,UNAME,
  foods:()=>FOODS,builtin:()=>BUILTIN,custom:()=>CUSTOM,parseDB};
if(typeof module!=="undefined"&&module.exports)module.exports=API;else root.NX=API;
})(typeof window!=="undefined"?window:globalThis);
