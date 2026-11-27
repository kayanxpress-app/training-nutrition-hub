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
/* ===== مولّد الخيارات المتوازنة (واجهة) =====
   زرار جوه نافذة «كل خيارات الوجبة». بيعرض معاينة الأول، ومابيكتب في خانة النص إلا لما تدوس «استخدم هذه الخيارات».
   مفيش حفظ تلقائي: الحفظ بيفضل بزرار «حفظ» العادي. لو nutri-gen.js مش محمّل الزرار مابيظهرش خالص. */
function nxGenCss(){
  if(document.getElementById("nxg-css"))return;
  const s=document.createElement("style");s.id="nxg-css";
  s.textContent=`.nxg{margin-top:10px;border:1.5px solid var(--line);border-radius:16px;padding:12px;background:var(--bg)}
.nxg[hidden]{display:none}
.nxg label{display:block;font-size:12.5px;font-weight:800;color:var(--mut);margin-top:10px}
.nxg label>select,.nxg label>input{margin-top:5px}
.nxg-2{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}
.nxg-note{font-size:12px;line-height:1.7;color:var(--mut);margin:8px 0 0}
.nxg-ch{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.nxg-c{border:1.5px solid var(--line);background:var(--card);color:var(--mut);border-radius:999px;padding:6px 11px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.nxg-c.on{background:var(--pk);border-color:var(--pk);color:#0a1505}
.nxg-gh{display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:13px;font-weight:800;color:var(--ink)}
.nxg-l{background:none;border:0;color:var(--pk);font:inherit;font-size:12px;font-weight:800;padding:2px 6px;cursor:pointer}
.nxg-sum{font-size:13.5px;line-height:1.9;margin-top:4px}
.nxg-op{border-bottom:1px solid var(--line);padding:7px 0;font-size:13px;line-height:1.7}
.nxg-op:last-child{border-bottom:0}
.nxg-op small{display:block;color:var(--mut);font-size:12px}
.nxg details summary{cursor:pointer;font-size:13px;font-weight:800;color:var(--pk);margin-top:10px}`;
  document.head.appendChild(s);
}
function nxGenUI(m,ta,box){
  const G=window.NXG;if(!G||!box)return;
  nxGenCss();
  const sh=m.querySelector(".sh");
  const nrm=t=>String(t||"").replace(/[\u064B-\u065F]/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي");
  const num=v=>{const x=String(v==null?"":v).replace(/[٠-٩]/g,c=>"٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/[٫,]/g,".").match(/\d+(\.\d+)?/);return x?+x[0]:0};
  const title=nrm((m.querySelector("h3")||{}).textContent||"");
  const mealOf=/فطار|صباح|بريك/.test(title)?"b":/عشا/.test(title)?"d":"l";
  const E=(P.data&&P.data.energy)||{},plan={kcal:num(E.plan),p:num(E.ptn),c:num(E.cho)};
  const cats=[];G.DIETS.forEach(d=>{let c=cats.find(x=>x.n===d.cat);if(!c){c={n:d.cat,l:[]};cats.push(c)}c.l.push(d)});
  const wrap=document.createElement("div");
  wrap.innerHTML=`<button type="button" class="btn o g-open">✨ توليد خيارات متوازنة</button>
<div class="nxg" hidden>
<div class="nxg-2"><label>الوجبة<select class="g-meal">${G.MEALS.map(x=>`<option value="${x.id}"${x.id===mealOf?" selected":""}>${x.n}</option>`).join("")}</select></label>
<label>عدد الخيارات<input class="g-n" type="text" inputmode="numeric" value="${ar(7)}"></label></div>
<label>النظام الغذائي<select class="g-diet">${cats.map(c=>`<optgroup label="${c.n}">${c.l.map(d=>`<option value="${d.id}">${d.n}</option>`).join("")}</optgroup>`).join("")}</select></label>
<p class="nxg-note g-note"></p>
<div class="g-al" hidden><div class="nxg-gh"><span>الأنواع اللي عنده حساسية منها</span></div><div class="nxg-ch g-alc"></div></div>
<div class="nxg-2"><label>سعرات الوجبة<input class="g-k" type="text" inputmode="decimal"></label><label>بروتين (جم)<input class="g-p" type="text" inputmode="decimal"></label>
<label>كارب (جم)<input class="g-c" type="text" inputmode="decimal"></label><label>دهون (جم)<input class="g-f" type="text" inputmode="decimal"></label></div>
<button type="button" class="btn o g-avg">خد الأرقام من متوسط الخيارات الحالية</button>
<details class="g-fd"><summary>اختيار الأطعمة (اختياري)</summary><p class="nxg-note">الأصناف المضيئة هي اللي هتشتغل عليها. اطفي أي صنف مش عايزه، أو «مسح» ثم اختار اللي عايزه بس.</p><div class="g-foods"></div></details>
<button type="button" class="btn g-go">توليد</button>
<p class="nxg-note">مسودة بتجهزها الأداة من قاعدة الأصناف: راجعها قبل الاعتماد (الميكرونيوترينتس والصوديوم والأدوية خارج حسابها).</p>
<div class="g-out"></div></div>`;
  box.before(wrap);
  const $=s=>wrap.querySelector(s),val=s=>num($(s).value);
  let dirtyK=false,al=[],off={},lastCat=null,last=null,opened=false;
  const GROUPS=["p","s","fr","f","d","v"],GN={p:"البروتين",s:"النشويات",fr:"الفاكهة",f:"الدهون",d:"الألبان",v:"الخضار"};
  const setV=(s,v,d)=>{$(s).value=v?nxN(v,d):""};
  function refill(){
    const T=G.targets($(".g-meal").value,$(".g-diet").value,plan,dirtyK?val(".g-k"):0);
    setV(".g-k",T.k);setV(".g-p",T.p,1);setV(".g-c",T.c,1);setV(".g-f",T.f,1);
    $(".g-note").textContent=G.dietById($(".g-diet").value).note||"";
  }
  function renderAl(){
    const on=$(".g-diet").value==="allergy";$(".g-al").hidden=!on;
    if(!on){al=[];return}
    $(".g-alc").innerHTML=G.ALLERGENS.map(a=>`<button type="button" class="nxg-c${al.includes(a.id)?" on":""}" data-a="${a.id}">${a.n}</button>`).join("");
  }
  function renderFoods(){
    lastCat=G.catalog($(".g-meal").value,$(".g-diet").value,al);
    $(".g-foods").innerHTML=GROUPS.map(g=>lastCat[g].length?`<div class="nxg-gh"><span>${GN[g]}</span><span><button type="button" class="nxg-l" data-all="${g}">الكل</button><button type="button" class="nxg-l" data-none="${g}">مسح</button></span></div><div class="nxg-ch">${lastCat[g].map(x=>`<button type="button" class="nxg-c${off[x.key]?"":" on"}" data-k="${esc(x.key)}">${esc(x.lab)}</button>`).join("")}</div>`:"").join("");
  }
  const onlySet=()=>{let any=false;const o={};GROUPS.forEach(g=>lastCat[g].forEach(x=>{if(off[x.key])any=true;else o[x.key]=1}));return any?o:null};
  function open(){
    const h=$(".nxg");h.hidden=!h.hidden;
    if(!h.hidden&&!opened){opened=true;refill();renderAl();renderFoods()}
  }
  $(".g-open").onclick=open;
  $(".g-meal").onchange=()=>{refill();renderFoods()};
  $(".g-diet").onchange=()=>{off={};refill();renderAl();renderFoods()};
  $(".g-k").oninput=()=>{dirtyK=true};
  $(".g-alc").onclick=e=>{const b=e.target.closest("[data-a]");if(!b)return;const id=b.dataset.a;al=al.includes(id)?al.filter(x=>x!==id):al.concat(id);off={};renderAl();renderFoods()};
  $(".g-foods").onclick=e=>{
    const b=e.target.closest("button");if(!b)return;
    if(b.dataset.k){off[b.dataset.k]=!off[b.dataset.k];b.classList.toggle("on",!off[b.dataset.k]);return}
    const g=b.dataset.all||b.dataset.none;if(!g)return;
    lastCat[g].forEach(x=>{off[x.key]=!!b.dataset.none});renderFoods();
  };
  $(".g-avg").onclick=()=>{
    try{
      const r=NX.calcMeal(parseOpts(ta.value));
      if(!r||!r.counted){toast("مفيش خيارات محسوبة في الخانة");return}
      dirtyK=true;setV(".g-k",r.avg.k);setV(".g-p",r.avg.p,1);setV(".g-c",r.avg.c,1);setV(".g-f",r.avg.f,1);
    }catch(e){toast("تعذر قراءة الخيارات الحالية")}
  };
  function renderOut(r){
    const out=$(".g-out");
    if(!r||!r.ok){out.innerHTML=`<p class="nx-n w">⚠ ${esc((r&&r.error)||"تعذر التوليد")}</p>`;return}
    const rg=r.range,sp=r.spread,R=(a,d)=>nxN(a[0],d)+"–"+nxN(a[1],d);
    out.innerHTML=`<div class="nxg-sum">${r.okSpread?"✔":"⚠"} <b>${nxN(r.options.length)}</b> خيارات<br>سعرات ${R(rg.k)} | بروتين ${R(rg.p,1)} | كارب ${R(rg.c,1)} | دهون ${R(rg.f,1)}<br><span class="nx-n">أقصى فرق بين الخيارات: بروتين ${nxN(sp.p,1)} | كارب ${nxN(sp.c,1)} | دهون ${nxN(sp.f,1)} جم | سعرات ${nxN(sp.k)}</span></div>`
      +(r.notes||[]).map(w=>`<p class="nx-n">ℹ ${esc(w)}</p>`).join("")
      +r.warnings.map(w=>`<p class="nx-n w">⚠ ${esc(w)}</p>`).join("")
      +`<details><summary>عرض الخيارات</summary>${r.options.map((o,i)=>`<div class="nxg-op">${nxN(i+1)}) ${esc(o.text)}<small>${nxMac(o)}</small></div>`).join("")}</details>
<button type="button" class="btn g-use">استخدم هذه الخيارات</button><button type="button" class="btn o g-re">إعادة توليد</button>`;
    out.querySelector(".g-use").onclick=()=>{
      ta.value=last.options.map(o=>o.text).join("\n");
      ta.dispatchEvent(new Event("input",{bubbles:true}));
      if(sh)sh.scrollTop=0;
      out.insertAdjacentHTML("afterbegin",`<p class="nx-n">✔ اتكتبت في خانة الخيارات فوق. راجع الحساب واضغط «حفظ» لما تخلص.</p>`);
    };
    out.querySelector(".g-re").onclick=run;
  }
  function run(){
    const out=$(".g-out"),go=$(".g-go"),k=val(".g-k"),p=val(".g-p"),c=val(".g-c");
    let n=Math.round(val(".g-n"))||7;n=Math.max(1,Math.min(12,n));$(".g-n").value=ar(n);
    if(!(k>0)){out.innerHTML=`<p class="nx-n w">⚠ اكتب سعرات الوجبة الأول.</p>`;return}
    const f=$(".g-f").value.trim()?val(".g-f"):Math.max(0,(k-4*p-4*c)/9);
    go.disabled=true;out.innerHTML=`<p class="nx-n">جاري التوليد…</p>`;
    setTimeout(()=>{
      let r;
      const only=onlySet();
      try{r=G.generate({meal:$(".g-meal").value,diet:$(".g-diet").value,allergies:al,k,p,c,f,n,only,seed:(Math.random()*1e9)|0,ms:900})}
      catch(e){r={ok:false,error:"حصل خطأ غير متوقع في التوليد."}}
      /* تحقق نهائي من الالتزام باختيارك: لو أي خيار فيه صنف مش معلّم يتشال من النتيجة ويظهر تنبيه (مايتكتبش في خانة النص) */
      try{
        if(r&&r.ok&&only){
          const bad=r.options.filter(o=>(o.keys||[]).some(x=>x&&!only[x]));
          if(bad.length){
            r.options=r.options.filter(o=>!bad.includes(o));
            r.warnings=(r.warnings||[]).concat("اتشال "+nxN(bad.length)+" خيار فيه صنف خارج اللي اخترته — دوس «إعادة توليد»، ولو اتكرر وسّع الأصناف المعلّمة.");
            if(!r.options.length){r={ok:false,error:"مفيش خيار التزم بالأصناف المعلّمة. وسّع الاختيار وجرّب تاني."}}
          }
        }
      }catch(e){}
      /* لو السعرات اتضبطت على مجموع الماكروز: نحدّث خانة السعرات عشان تبقى الأرقام قدامك هي اللي اتولّد عليها فعلاً */
      try{if(r&&r.ok&&r.kUsed>0&&Math.round(r.kUsed)!==Math.round(k)){dirtyK=true;setV(".g-k",r.kUsed)}}catch(e){}
      go.disabled=false;last=r;renderOut(r);
    },40);
  }
  $(".g-go").onclick=run;
}
function nxPanel(m,mode){
  const ta=m.querySelector("textarea");if(!ta)return;
  const box=document.createElement("div");box.className="nx";ta.closest("label").after(box);
  nxFit(m);
  if(mode==="list"&&window.NXG){try{nxGenUI(m,ta,box)}catch(e){}}
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
