/* واجهة حاسبة التغذية (للأدمن فقط). تعتمد على nutri.js وعلى دوال app.js (ar, esc, modal, toast, savePD, EDIT, P, sb ...) وقت التشغيل فقط.
   مفيش أي تعديل على بيانات البرنامج المحفوظة: الحساب بيتعمل لحظيًا من نص الخيارات، ماعدا زرار «اعتماد التبادلات» اللي بيكتب جدول التبادلات بعد تأكيد. */
let NXOK=true;   // false لو جدول custom_foods مش متفعّل
async function nxLoadFoods(){
  let ok=true;
  try{
    const r=await sb.from("custom_foods").select("id,data").order("created_at",{ascending:true});
    ok=!r.error;NX.setCustom(r.error?[]:(r.data||[]));
  }catch(e){ok=false;try{NX.setCustom([])}catch(x){}}
  NXOK=ok;
  // لو الأدمن فاتح صفحة التغذية وقت وصول الأصناف نعيد الرسم (محمي: مايأثرش على أي حاجة لو البرنامج لسه ما اتحمّلش)
  try{if(ok&&typeof EDIT==="function"&&EDIT()&&P&&P.data&&location.hash==="#food"&&!document.querySelector(".md"))food()}catch(e){}
}
const nxN=(n,d)=>{n=+n||0;const v=Math.round(n*(d?10:1))/(d?10:1);return ar(String(v).replace(".","٫"))};
const nxMac=m=>`<b>${nxN(m.k)}</b> سعرة | بروتين ${nxN(m.p,1)} | كارب ${nxN(m.c,1)} | دهون ${nxN(m.f,1)}`;
function nxItem(i){
  if(!i.ok){
    const add=i.unknown?`<button type="button" class="nx-btn" data-t="${esc(i.src)}" onclick="nxAddFood(this.dataset.t)">+ إضافة هذا الصنف</button>`:"";
    return `<div class="nx-r bad"><div class="nx-s">${esc(i.src)}</div><div class="nx-n w">✖ ${esc(i.err||"غير معروف")} — مش داخل في الإجمالي</div>${add}</div>`;
  }
  const f=i.food,un=i.u&&i.u!=="g"?`${nxN(i.q,1)} ${NX.UNAME[i.u]}${i.per?" × "+nxN(i.per,1)+" جم":""} = `:"";
  const edt=`<button type="button" class="nx-ed" data-id="${esc(f.id)}" onclick="nxEditFood(this.dataset.id)" title="تعديل قيم الصنف">✎</button>`;
  return `<div class="nx-r${i.weak?" weak":""}"><div class="nx-s">${esc(i.src)}</div><div class="nx-m"><b>${esc(f.n)}</b>${edt} | ${un}${nxN(i.g,1)} جم</div><div class="nx-m">${nxMac(i.m)}</div>${i.notes.map(n=>`<div class="nx-n ${n.t}">${n.t==="w"?"⚠":"ℹ"} ${esc(n.m)}</div>`).join("")}</div>`;
}
function nxFlags(r){
  const a=[];if(r.bad)a.push(`<span class="nx-fl bad">✖ ${nxN(r.bad)} غير محسوب</span>`);if(r.weak)a.push(`<span class="nx-fl w">⚠ ${nxN(r.weak)} للمراجعة</span>`);return a.join(" ");
}
/* تثبيت النافذة فوق الكيبورد: على الآيفون الكيبورد بيصغّر المساحة المرئية بس (visualViewport) فالنافذة كانت بتتزحزح لوحدها مع كل تغيير في ارتفاع الحساب أو تبديل الكيبورد (حروف/أرقام).
   هنا بنخلي النافذة بالظبط في المساحة المرئية فمفيش حاجة تحت الكيبورد يحتاج المتصفح يسكرول لها. تنسيق فقط ومحمي: لو الدعم مش موجود مفيش أي تأثير. */
function nxFit(m){
  const vv=window.visualViewport,sh=m.querySelector(".sh");if(!vv||!sh)return;
  const fit=()=>{
    if(!m.isConnected){vv.removeEventListener("resize",fit);vv.removeEventListener("scroll",fit);return}
    try{
      if(vv.scale>1.01||(vv.height>=window.innerHeight-2&&vv.offsetTop<=0)){m.style.top=m.style.bottom=m.style.height=sh.style.maxHeight="";return}
      m.style.top=Math.max(0,vv.offsetTop)+"px";m.style.bottom="auto";m.style.height=vv.height+"px";sh.style.maxHeight=Math.floor(vv.height*.96)+"px";
    }catch(e){}
  };
  sh.style.overscrollBehavior="contain";
  vv.addEventListener("resize",fit);vv.addEventListener("scroll",fit);fit();
}
/* لوحة حية تحت خانة الكتابة داخل النافذة: mode = one (خيار واحد) | list (كل خيارات الوجبة) */
function nxPanel(m,mode){
  const ta=m.querySelector("textarea");if(!ta)return;
  const box=document.createElement("div");box.className="nx";ta.closest("label").after(box);
  nxFit(m);
  const sh=m.querySelector(".sh");
  let tm;
  const draw=()=>{
    const st=sh?sh.scrollTop:0;
    try{
      if(mode==="one"){
        const r=NX.calcOpt(ta.value);
        box.innerHTML=r.items.length?`<div class="nx-h">الحساب التلقائي ${nxFlags(r)}</div>${r.items.map(nxItem).join("")}<div class="nx-tot">إجمالي الخيار: ${nxMac(r.t)}</div>`:`<div class="nx-h">اكتب المكونات وهتظهر السعرات هنا</div>`;
      }else{
        const opts=parseOpts(ta.value),rs=opts.map(NX.calcOpt),ml=NX.calcMeal(opts);
        box.innerHTML=opts.length?`<div class="nx-h">الحساب التلقائي لكل خيار</div>`+rs.map((r,i)=>`<details class="nx-d"${r.bad||r.weak?" open":""}><summary>خيار ${ar(i+1)}: ${nxMac(r.t)} ${nxFlags(r)}</summary>${r.items.map(nxItem).join("")}</details>`).join("")+(ml.counted?`<div class="nx-tot">متوسط الوجبة: ${nxMac(ml.avg)}<br><small>من ${nxN(ml.min.k)} إلى ${nxN(ml.max.k)} سعرة (${nxN(ml.counted)} من ${nxN(ml.n)} خيار محسوب)</small></div>`:""):`<div class="nx-h">اكتب الخيارات وهتظهر السعرات هنا</div>`;
      }
    }catch(e){box.innerHTML=`<div class="nx-n w">تعذر الحساب</div>`}
    if(sh&&sh.scrollTop!==st)sh.scrollTop=st;
  };
  ta.addEventListener("input",()=>{clearTimeout(tm);tm=setTimeout(draw,180)});
  draw();
}
/* سطر الإجمالي تحت كل خيار في صفحة التغذية */
function nxLine(o){
  const r=NX.calcOpt(o);if(!r.items.length)return "";
  return `<div class="nx-ln">${r.complete?"":"≈ "}${nxMac(r.t)} ${nxFlags(r)}</div>`;
}
const nxPlan=()=>{const E=(P.data.energy||{}),n=String(E.plan||"").replace(/[٠-٩]/g,c=>"٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/[٫,]/g,".").match(/\d+(\.\d+)?/);return n?+n[0]:0};
function nxMealCard(M){
  const r=NX.calcMeal(M.opts);if(!r.n)return "";
  if(!r.counted)return `<div class="card nx-c"><div class="lbl">حساب «${esc(M.t)}»</div><p>مفيش خيار اتحسب بالكامل — راجع الخيارات اللي فيها ✖.</p></div>`;
  const sk=r.skipped.length?`<p class="nx-n w">⚠ خيارات مستبعدة من المتوسط لأن فيها مكوّن غير محسوب: ${r.skipped.map(i=>ar(i+1)).join("، ")}</p>`:"";
  const sp=r.spread>.15&&r.counted>1?`<p class="nx-n w">⚠ الخيارات مش متقاربة: الفرق ${nxN(r.spread*100)}٪ بين أعلى وأقل خيار</p>`:"";
  return `<div class="card nx-c"><div class="lbl">حساب «${esc(M.t)}» | متوسط ${nxN(r.counted)} خيار</div><div class="nx-big">${nxMac(r.avg)}</div><p class="nx-sm">أقل خيار ${nxN(r.min.k)} | أعلى خيار ${nxN(r.max.k)} سعرة</p>${sp}${sk}</div>`;
}
function nxDayCard(){
  const dt=P.data,d=NX.calcDay(dt.meals),E=dt.energy||{},plan=nxPlan();
  if(!d.ms.length)return "";
  const k=d.avg.k,pr=k?d.avg.p*4/k*100:0,cr=k?d.avg.c*4/k*100:0,fr=k?d.avg.f*9/k*100:0;
  const lab=x=>String(x||"").replace(/[\u064B-\u065F]/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي");
  const gOf=l=>{l=lab(l);return /بروتين/.test(l)?"p":/نشو/.test(l)?"s":/خضار|خضر/.test(l)?"v":/فاك/.test(l)?"fr":/دهن|دهو/.test(l)?"f":/لبن|البان/.test(l)?"d":""};
  const cur={};(E.exch||[]).forEach(x=>{const g=gOf(x[1]);if(g)cur[g]=parseFloat(String(x[0]).replace(/[٠-٩]/g,c=>"٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace("٫","."))});
  const rows=NX.GORDER.map(g=>{
    const v=Math.round(d.ex[g]*2)/2,c=cur[g],diff=c!=null&&Math.abs(c-d.ex[g])>=1;
    return `<div class="nx-x${diff?" df":""}"><span>${NX.SERV[g].name} <small>(حصة = ${NX.SERV[g].lbl})</small></span><b>${nxN(d.ex[g],1)}</b><em>${c!=null?"الجدول: "+nxN(c,1):"مش في الجدول"}</em></div>`;
  }).join("");
  const warn=[];
  if(d.missing.length)warn.push(`وجبات ما اتحسبتش: ${d.missing.map(esc).join("، ")}`);
  d.ms.forEach(m=>{if(m.r.skipped.length&&m.r.counted)warn.push(`«${esc(m.t)}»: ${nxN(m.r.skipped.length)} خيار مستبعد`)});
  const pd=plan?(()=>{const df=k-plan,pc=df/plan*100,bad=Math.abs(pc)>7;return `<p class="${bad?"nx-n w":"nx-sm"}">${bad?"⚠ ":""}سعرات الخطة ${nxN(plan)} ← الفرق ${df>0?"+":""}${nxN(df)} سعرة (${nxN(pc)}٪)</p>`})():"";
  return `<div class="card nx-c nx-day"><div class="lbl">إجمالي اليوم (وجبة واحدة من كل نوع) — للأدمن فقط</div><div class="nx-big">${nxN(k)} <small>سعرة / يوم</small></div><p class="nx-sm">من ${nxN(d.min.k)} إلى ${nxN(d.max.k)} حسب اختيار العميل</p><div class="nx-big">بروتين ${nxN(d.avg.p)} | كارب ${nxN(d.avg.c)} | دهون ${nxN(d.avg.f)} جم</div><p class="nx-sm">توزيع السعرات: بروتين ${nxN(pr)}٪ | كارب ${nxN(cr)}٪ | دهون ${nxN(fr)}٪</p>${pd}${warn.map(w=>`<p class="nx-n w">⚠ ${w}</p>`).join("")}<div class="lbl" style="margin-top:12px">التبادلات المحسوبة (متوسط) مقابل الجدول</div>${rows}<button type="button" class="btn o" onclick="nxApplyEx()">اعتماد القيم المحسوبة في جدول التبادلات</button><p class="nx-sm">القيم ما بتتغير إلا لما تضغط الزرار. تعريف الحصة قابل للتعديل في nutri.js (SERV).</p></div>`;
}
async function nxApplyEx(){
  const d=NX.calcDay(P.data.meals);
  if(!d.ms.some(m=>m.r.counted)){toast("مفيش وجبات محسوبة");return}
  if(!confirm("هيتم استبدال جدول التبادلات الحالي بالقيم المحسوبة (متقربة لأقرب نص حصة). متأكد؟"))return;
  const lbl={p:"بروتين",s:"نشويات",v:"خضار",fr:"فاكهه",f:"دهون",d:"البان"};
  const E=P.data.energy=P.data.energy||{};
  E.exch=NX.GORDER.map(g=>[ar(String(Math.round(d.ex[g]*2)/2).replace(".","٫")),lbl[g]]);
  await savePD();
}
/* إضافة صنف جديد / تعديل قيم صنف (للقاعدة المخصصة) */
function nxFoodDlg(base,text){
  if(!NXOK){alert("شغّل ملف supabase/foods.sql مرة واحدة في Supabase ← SQL Editor، ثم أعد تحميل الصفحة.");return}
  const G=["بروتين","نشويات","خضار","فاكهه","دهون","البان","أخرى"],GK=["p","s","v","fr","f","d","o"];
  const b=base||{n:text||"",al:[],k:"",p:"",c:"",f:"",g:"o",pc:0};
  const fields=[{k:"n",l:"اسم الصنف (عربي)",v:b.n},{k:"al",l:"أسماء تانية بنفس المعنى (افصل بفاصلة — عربي وإنجليزي)",v:(b.al||[]).filter(x=>x!==b.n).join(", ")},
    {k:"k",l:"السعرات لكل ١٠٠ جم",v:b.k,type:"number"},{k:"p",l:"بروتين (جم لكل ١٠٠ جم)",v:b.p,type:"number"},{k:"c",l:"كارب (جم لكل ١٠٠ جم)",v:b.c,type:"number"},{k:"f",l:"دهون (جم لكل ١٠٠ جم)",v:b.f,type:"number"},
    {k:"g",l:"المجموعة في نظام التبادل",type:"sel",o:G,v:G[GK.indexOf(b.g)]||"أخرى"},{k:"pc",l:"وزن الحبة الواحدة بالجرام (اختياري)",v:b.pc||"",type:"number"}];
  modal(base?"تعديل قيم صنف":"إضافة صنف جديد",fields,async v=>{
    const n=v.n.trim();if(!n){toast("اكتب اسم الصنف");return false}
    let k=parseFloat(v.k),p=parseFloat(v.p)||0,c=parseFloat(v.c)||0,f=parseFloat(v.f)||0;
    if(!isFinite(k))k=Math.round(p*4+c*4+f*9);
    if(k<0||p<0||c<0||f<0||k>950){toast("راجع القيم (لكل ١٠٠ جم)");return false}
    const data={n,al:[n].concat(v.al.split(/[,،]/).map(x=>x.trim()).filter(Boolean)),k,p,c,f,g:GK[G.indexOf(v.g)]||"o",pc:parseFloat(v.pc)||0};
    if(base){["st","alt","d","m","amb","est","zero"].forEach(x=>{if(base[x]&&(typeof base[x]!=="object"||Object.keys(base[x]).length))data[x]=base[x]});data.est=false;data.amb=base.cust?base.amb:"";if(!base.cust)data.ov=base.id;else if(base.ov)data.ov=base.ov}
    const r=base&&base.rowId?await sb.from("custom_foods").update({data}).eq("id",base.rowId):await sb.from("custom_foods").insert({data});
    if(r.error){toast("تعذر حفظ الصنف");return false}
    await nxLoadFoods();nxRedraw();toast("تم حفظ الصنف");return true;
  },base&&base.cust?async()=>{const r=await sb.from("custom_foods").delete().eq("id",base.rowId);if(r.error){toast("تعذر الحذف");return}await nxLoadFoods();nxRedraw();toast(base.ov?"تم الرجوع للقيمة الأصلية":"تم حذف الصنف")}:null);
}
const nxRedraw=()=>document.querySelectorAll(".md textarea").forEach(t=>t.dispatchEvent(new Event("input")));
const nxAddFood=t=>{
  const T=NX.toks(t),w=T.filter(x=>isNaN(+x)&&!NX.UNAME[x]&&x.length>1).join(" ");
  nxFoodDlg(null,w||t);
};
function nxEditFood(id){const f=NX.foods().find(x=>x.id===id);if(f)nxFoodDlg(f)}
