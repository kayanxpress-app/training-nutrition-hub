const $=s=>document.querySelector(s);
const ar=n=>String(n).replace(/\d/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const D=new Date(),TODAY=iso(D);
const sb=window.supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_ANON_KEY);
let ME,PROF={},ADMIN=false,VIEW=null,PROGS=[],PI=0,P,LOGS={},NOTIFS=[],ft="b";
const CID=()=>VIEW?VIEW.id:ME.id;
const EDIT=()=>ADMIN&&VIEW;
const NAME=()=>VIEW?VIEW.name:(PROF.full_name||"");

function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2800)}
const L=()=>LOGS[TODAY]=LOGS[TODAY]||{d:{},w:{},m:{},s:{}};
let tm;
function save(){if(ADMIN)return;clearTimeout(tm);tm=setTimeout(async()=>{
  const {error}=await sb.from("logs").upsert({client_id:ME.id,log_date:TODAY,data:L(),updated_at:new Date().toISOString()},{onConflict:"client_id,log_date"});
  if(error)toast("تعذر الحفظ، تأكد من الإنترنت")},500)}
const lastW=(k,i)=>{const ds=Object.keys(LOGS).filter(x=>x<TODAY).sort().reverse();for(const x of ds){const w=(LOGS[x].w||{})[k];if(w&&w[i])return w[i]}return""};
const yt=u=>{const m=/(?:shorts\/|youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/.exec(u||"");return m?`https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`:""};
const vid=(u,n,c,img)=>{const im=img||yt(u);return `<a class="v ${c||""}" href="${u||("https://www.youtube.com/results?search_query="+encodeURIComponent(n+" شرح التمرين"))}" target="_blank" rel="noopener" ${im?`style="background-image:url(${im})"`:""}><span>▶ مشاهدة الفيديو</span></a>`};
const ed=(fn,t)=>`<button class="ed" onclick="${fn}">✎ ${t||"تعديل"}</button>`;
const addb=(fn,t)=>`<button class="addb" onclick="${fn}">+ ${t}</button>`;
const hd=(t,sub,back)=>{
  $("#hd").innerHTML=`<div class="hd">${back?'<button class="back" onclick="location.hash=\'train\'">›</button>':''}<div><small>${sub}</small><h1>${t}</h1></div><img class="lgo" src="img/logo.png" alt=""></div>`+(VIEW?`<div class="vb"><span>حساب: ${esc(VIEW.name)} · وضع التعديل</span><button onclick="closeClient()">العملاء ›</button></div>`:"");
};
const dayNo=()=>{const s=new Date(P.month_start+"T00:00:00"),t=new Date(D.getFullYear(),D.getMonth(),D.getDate());const T=P.data.info.days||30;return Math.min(T,Math.max(0,Math.floor((t-s)/864e5)+1))};
const WK=()=>{const w=P.data.weeks;if(!w||!w.length)return null;return Math.min(w.length,Math.max(1,Math.ceil((dayNo()||1)/7)))};
const REPS=()=>{const w=WK();return w?P.data.weeks[w-1]:P.data.reps};
function repsCard(){
  const dt=P.data;
  if(dt.weeks&&dt.weeks.length){const w=WK();return `<div class="card dk"><div class="lbl">تدرّج التكرارات حسب الأسبوع · المجموعات ١ · ٢ · ٣</div><div class="rt4">${dt.weeks.map((r,i)=>`<div class="${i+1==w?"cur":""}"><span>الأسبوع ${ar(i+1)}</span><b>${r.map(ar).join("·")}</b></div>`).join("")}</div>${dt.rest?`<div style="margin-top:8px;font-size:12px;opacity:.75">الراحة بين المجموعات: ${ar(dt.rest)} ثانية</div>`:""}</div>`}
  return `<div class="card dk"><div class="lbl">التكرارات في كل مجموعة</div><div class="rt">${dt.reps.map((x,i)=>`<div><span>المجموعة ${ar(i+1)}</span><b>${ar(x)}</b></div>`).join("")}</div></div>`;
}
const doneCount=i=>Object.keys(L().d).filter(k=>k.startsWith("s"+i+"e")).length;

/* ===== الدخول ===== */
function login(msg){
  $("#hd").innerHTML="";$("nav").style.display="none";document.body.classList.remove("av");
  $("#app").innerHTML=`<div class="login"><img src="img/logo.png" alt=""><h1>Training <b>Nutrition</b> Hub</h1><p>تسجيل الدخول لمتابعة برنامجك</p><input id="em" type="email" autocomplete="username" placeholder="الإيميل" dir="ltr"><input id="pw" type="password" autocomplete="current-password" placeholder="كلمة المرور" dir="ltr"><button id="go">دخول</button><div id="er">${msg||""}</div></div>`;
  const go=async()=>{
    $("#er").textContent="";$("#go").disabled=true;
    const {error}=await sb.auth.signInWithPassword({email:$("#em").value.trim(),password:$("#pw").value});
    $("#go").disabled=false;
    if(error)$("#er").textContent="الإيميل أو كلمة المرور غير صحيحة";else load();
  };
  $("#go").onclick=go;$("#pw").onkeydown=e=>{if(e.key==="Enter")go()};
}
async function out(){await sb.auth.signOut();LOGS={};PROGS=[];P=null;VIEW=null;location.hash="";login()}

/* ===== تحميل ===== */
async function loadData(cid){
  const [b,c,d]=await Promise.all([
    sb.from("programs").select("*").eq("client_id",cid).order("month_start",{ascending:false}),
    sb.from("logs").select("log_date,data").eq("client_id",cid),
    sb.from("notifications").select("*").eq("client_id",cid).order("created_at",{ascending:false}).limit(30)]);
  if(b.error)throw b.error;
  PROGS=b.data||[];LOGS={};(c.data||[]).forEach(r=>LOGS[r.log_date]=r.data);NOTIFS=d.data||[];
  const i=PROGS.findIndex(p=>p.month_start<=TODAY);PI=i<0?PROGS.length-1:i;P=PROGS[PI];
}
async function load(){
  try{
    const {data:{user}}=await sb.auth.getUser();
    if(!user)return login();
    ME=user;$("#app").innerHTML='<p class="ld">جاري التحميل...</p>';
    const a=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();
    PROF=a.data||{};ADMIN=PROF.role==="admin";VIEW=null;
    if(ADMIN){document.body.classList.remove("av");$("nav").style.display="none";return clients()}
    await loadData(user.id);$("nav").style.display="flex";badge();route();
  }catch(e){
    $("#app").innerHTML=`<div class="card" style="text-align:center"><b>تعذر تحميل البيانات</b><p style="color:var(--mut)">تأكد من الإنترنت وحاول مرة أخرى.</p><button class="btn" onclick="load()">إعادة المحاولة</button></div>`;
  }
}
function badge(){const n=NOTIFS.filter(x=>!x.read).length,b=$("#nb");b.hidden=!n||!!EDIT();b.textContent=ar(n)}
function setProg(i){PI=+i;P=PROGS[PI];route()}

/* ===== الأدمن: العملاء ===== */
async function clients(){
  VIEW=null;P=null;document.body.classList.remove("av");$("nav").style.display="none";
  $("#hd").innerHTML=`<div class="hd"><div><small>لوحة المدرب</small><h1>عملائي</h1></div><img class="lgo" src="img/logo.png" alt=""></div>`;
  $("#app").innerHTML='<p class="ld">جاري التحميل...</p>';
  const since=new Date(D.getTime()-14*864e5);
  const [a,b,c]=await Promise.all([
    sb.from("profiles").select("id,full_name,phone").eq("role","client").order("full_name"),
    sb.from("logs").select("client_id,log_date,data").gte("log_date",iso(since)),
    sb.from("programs").select("client_id,title,month_start,data").order("month_start",{ascending:false})]);
  const cl=a.data||[],lg=b.data||[],pr=c.data||[];
  let h=`<div class="card" style="text-align:center"><b>${ar(cl.length)} عميل</b><p style="margin:2px 0 0;color:var(--mut);font-size:13px">اضغط على العميل لعرض حسابه وتعديل برنامجه</p></div>`;
  cl.forEach(x=>{
    const mine=lg.filter(l=>l.client_id===x.id).sort((p,q)=>q.log_date.localeCompare(p.log_date));
    const last=mine[0],t=mine.find(l=>l.log_date===TODAY);
    const cnt=t?Object.keys(t.data.d||{}).length:0,sup=t?Object.keys(t.data.s||{}).length:0,mel=t?Object.keys(t.data.m||{}).length:0;
    const days=last?Math.round((new Date(TODAY)-new Date(last.log_date))/864e5):null;
    const act=last?(days===0?"نشط اليوم":days===1?"آخر نشاط أمس":`غائب منذ ${ar(days)} أيام`):"لم يبدأ بعد";
    const bad=days===null||days>=3;
    const p=pr.find(z=>z.client_id===x.id);
    const left=p?Math.round((new Date(p.month_start)-new Date(TODAY))/864e5)+((p.data&&p.data.info&&p.data.info.days)||30)-1:null;
    h+=`<div class="card cl"><div style="flex:1;cursor:pointer" onclick="openClient('${x.id}','${esc(x.full_name||"عميل").replace(/'/g,"")}')"><h3>${esc(x.full_name||"بدون اسم")}</h3><p class="${bad?"no2":"ok"}">${act}</p><p>اليوم: ${ar(cnt)} تمارين · ${ar(mel)} وجبات · ${ar(sup)} مكملات</p>${left!==null?`<p>${left>=0?`باقي ${ar(left)} يوم على نهاية البرنامج`:"البرنامج انتهى"}</p>`:'<p>لا يوجد برنامج</p>'}</div><button class="ed" style="display:inline-block" onclick="sendNote('${x.id}')">✉ إشعار</button></div>`;
  });
  h+=`<div class="card"><b>إضافة عميل جديد</b><p style="color:var(--mut);font-size:14px;margin:4px 0 0">من Supabase ← Authentication ← Users ← Add user (فعّل Auto Confirm)، وهيظهر هنا تلقائي. ثم افتحه وأضف برنامجه.</p></div><button class="btn o" onclick="out()">تسجيل الخروج</button>`;
  $("#app").innerHTML=h;
}
async function openClient(id,name){
  VIEW={id,name};$("#app").innerHTML='<p class="ld">جاري التحميل...</p>';
  try{await loadData(id)}catch(e){toast("تعذر التحميل");return clients()}
  document.body.classList.add("av");$("nav").style.display="flex";badge();
  if(location.hash==="#home"||location.hash==="")route();else location.hash="home";
}
function closeClient(){location.hash="";clients()}
function sendNote(cid){
  modal("إرسال إشعار للعميل",[{k:"t",l:"العنوان",v:""},{k:"b",l:"الرسالة",v:"",type:"area"}],async v=>{
    if(!v.t.trim()){toast("اكتب العنوان");return false}
    const {error}=await sb.from("notifications").insert({client_id:cid,title:v.t.trim(),body:v.b.trim()});
    toast(error?"تعذر الإرسال":"تم إرسال الإشعار");return !error;
  });
}

/* ===== النوافذ والتعديل ===== */
function fld(f,i){
  const v=esc(f.v??"");
  if(f.type==="area")return `<label>${f.l}<textarea data-i="${i}">${v}</textarea></label>`;
  if(f.type==="sel")return `<label>${f.l}<select data-i="${i}">${f.o.map(o=>`<option ${o==f.v?"selected":""}>${o}</option>`).join("")}</select></label>`;
  if(f.type==="img")return `<label>${f.l}</label><div class="im"><img id="pv${i}" src="${v}" alt=""><input type="file" accept="image/*" data-up="${i}"></div><input type="hidden" data-i="${i}" value="${v}">`;
  if(f.type==="file")return `<label>${f.l}</label><div class="im"><input type="file" accept="application/pdf" data-upf="${i}"><span id="fn${i}" style="font-size:13px;color:var(--mut)">${v?"تم رفع ملف سابقًا":""}</span></div><input type="hidden" data-i="${i}" value="${v}">`;
  return `<label>${f.l}<input data-i="${i}" type="${f.type||"text"}" value="${v}" ${f.dir?`dir="${f.dir}"`:""}></label>`;
}
async function upl(file){
  const bm=await createImageBitmap(file),sc=Math.min(1,1000/Math.max(bm.width,bm.height));
  const cv=document.createElement("canvas");cv.width=Math.round(bm.width*sc);cv.height=Math.round(bm.height*sc);
  cv.getContext("2d").drawImage(bm,0,0,cv.width,cv.height);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.82));
  const path=`${CID()}/${Date.now()}.jpg`;
  const {error}=await sb.storage.from("media").upload(path,blob,{contentType:"image/jpeg"});
  if(error)throw error;
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
}
async function uplDoc(file){
  const path=`${CID()}/${Date.now()}.pdf`;
  const {error}=await sb.storage.from("docs").upload(path,file,{contentType:"application/pdf"});
  if(error)throw error;return path;
}
async function openFile(p){
  const w=window.open("","_blank");
  const {data,error}=await sb.storage.from("docs").createSignedUrl(p,3600);
  if(error||!data){if(w)w.close();return toast("تعذر فتح الملف")}
  if(w)w.location.href=data.signedUrl;else location.href=data.signedUrl;
}
function filesBlock(sec){
  const F=((P.data.files=P.data.files||{})[sec]=P.data.files[sec]||[]);
  if(!F.length&&!EDIT())return"";
  return `<h2>الملفات</h2>`+F.map((f,k)=>`<div class="card fl"><a class="fb" href="#" onclick="openFile('${f.path}');return false"><b>PDF</b><span>${esc(f.n)}</span></a>${ed(`editFile('${sec}',${k})`)}</div>`).join("")+addb(`editFile('${sec}',-1)`,"إضافة ملف PDF");
}
function editFile(sec,k){
  const F=P.data.files[sec],e=k<0?{n:"",path:""}:F[k];
  modal(k<0?"إضافة ملف PDF":"تعديل الملف",[{k:"n",l:"اسم الملف (يظهر للعميل)",v:e.n},{k:"path",l:"ملف PDF",type:"file",v:e.path}],
    async v=>{if(!v.n.trim()){toast("اكتب اسم الملف");return false}if(!v.path){toast("ارفع الملف أولاً");return false}
      const o={n:v.n.trim(),path:v.path};if(k<0)F.push(o);else F[k]=o;return savePD()},
    k<0?null:async()=>{await sb.storage.from("docs").remove([e.path]);F.splice(k,1);await savePD()});
}
function blocksBlock(sec){
  const B=((P.data.blocks=P.data.blocks||{})[sec]=P.data.blocks[sec]||[]);
  if(!B.length&&!EDIT())return"";
  return B.map((b,k)=>`<div class="card bk"><div class="lbl" style="color:var(--or)">${esc(b.t)}</div><div class="bt">${esc(b.b).replace(/\n/g,"<br>")}</div>${ed(`editBlock('${sec}',${k})`)}</div>`).join("")+addb(`editBlock('${sec}',-1)`,"إضافة ملاحظة / تعليمات");
}
function editBlock(sec,k){
  const B=P.data.blocks[sec],e=k<0?{t:"",b:""}:B[k];
  modal(k<0?"إضافة ملاحظة / تعليمات":"تعديل الملاحظة",[{k:"t",l:"العنوان",v:e.t},{k:"b",l:"النص",type:"area",v:e.b}],
    async v=>{if(!v.t.trim()&&!v.b.trim()){toast("اكتب شيئًا");return false}const o={t:v.t.trim(),b:v.b.trim()};if(k<0)B.push(o);else B[k]=o;return savePD()},
    k<0?null:async()=>{B.splice(k,1);await savePD()});
}
const REF=`<div class="card"><div class="lbl" style="color:var(--or)">مرجع · البروتين (جم / كجم / يوم)</div>${[["عادي (RDA)","٠.٨ – ١.٠"],["تحت ضغط متوسط","١.٠ – ٢.٠"],["تحت ضغط شديد","٢.٠ – ٣.٠"]].map(x=>`<div class="act"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("")}</div><div class="card"><div class="lbl" style="color:var(--or)">مرجع · الماء (مل / كجم من وزن الجسم / يوم)</div>${[["١٦ – ٣٠ سنة، نشاط عالٍ","٤٠"],["٢٠ – ٥٥ سنة","٣٥"],["٥٥ – ٧٥ سنة","٣٠"],["أكبر من ٧٥ سنة","٢٥"]].map(x=>`<div class="act"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("")}</div>`;
function importProg(){
  modal("استيراد برنامج من ملف PDF",[{k:"d",l:"تاريخ بداية البرنامج",type:"date",v:TODAY},{k:"t",l:"عنوان البرنامج (اختياري)",v:""},{k:"path",l:"ملف PDF للبرنامج",type:"file",v:""}],async v=>{
    if(!v.path){toast("ارفع ملف الـ PDF أولاً");return false}
    toast("جاري قراءة الملف… قد يستغرق حتى دقيقة");
    try{
      const {data:{session}}=await sb.auth.getSession();
      const r=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({path:v.path})});
      const j=await r.json().catch(()=>({}));
      if(!r.ok||!j.data)throw new Error(j.error||("خطأ "+r.status));
      const {data,error}=await sb.from("programs").insert({client_id:CID(),title:v.t.trim()||j.data.brand||("برنامج "+v.d),month_start:v.d,data:j.data}).select().single();
      if(error)throw error;
      PROGS.unshift(data);PROGS.sort((a,b)=>b.month_start.localeCompare(a.month_start));PI=PROGS.findIndex(p=>p.id===data.id);P=PROGS[PI];
      toast("تم الاستيراد. راجع البيانات وعدّل لو لزم");location.hash="home";route();
    }catch(e){toast("تعذر الاستيراد: "+(e.message||""));return false}
  });
}
function pubCard(){
  return `<div class="card" style="border:2px solid ${P.published?"#3fb37f":"var(--or)"}"><b>${P.published?"✓ منشور: العميل يرى هذا البرنامج":"مسودة: العميل لا يرى هذا البرنامج بعد"}</b><button class="btn ${P.published?"o":""}" style="margin-top:10px" onclick="togglePub()">${P.published?"إلغاء النشر":"نشر البرنامج للعميل"}</button></div>`;
}
async function togglePub(){
  const v=!P.published;
  const {error}=await sb.from("programs").update({published:v}).eq("id",P.id);
  if(error)return toast("تعذر التحديث");
  P.published=v;toast(v?"تم النشر. العميل يراه الآن":"تم إلغاء النشر");route();
}
function editMeal(key){
  const M=P.data.meals,e=key?M[key]:{t:"",note:"",opts:[]};
  modal(key?"تعديل الوجبة":"إضافة وجبة",[{k:"t",l:"اسم الوجبة",v:e.t}],async v=>{
    if(!v.t.trim()){toast("اكتب الاسم");return false}
    if(key)e.t=v.t.trim();else{const k="m"+Date.now().toString(36);M[k]={t:v.t.trim(),note:"",opts:[]};ft=k}
    return savePD();
  },key&&Object.keys(M).length>1?async()=>{delete M[key];ft=Object.keys(M)[0];await savePD()}:null);
}
function modal(title,fields,onSave,onDel){
  const m=document.createElement("div");m.className="md";
  m.innerHTML=`<div class="sh"><h3>${title}</h3>${fields.map(fld).join("")}<button class="btn" id="mk">حفظ</button>${onDel?'<button class="btn o dl" id="mx">حذف</button>':""}<button class="btn o" id="mc">إلغاء</button></div>`;
  document.body.appendChild(m);
  const close=()=>m.remove(),get=()=>{const o={};fields.forEach((f,i)=>o[f.k]=m.querySelector(`[data-i="${i}"]`).value);return o};
  m.onclick=e=>{if(e.target===m)close()};
  m.querySelectorAll("[data-up]").forEach(inp=>inp.onchange=async()=>{
    const i=inp.dataset.up,f=inp.files[0];if(!f)return;
    toast("جاري رفع الصورة...");
    try{const u=await upl(f);m.querySelector(`[data-i="${i}"]`).value=u;m.querySelector("#pv"+i).src=u;toast("تم رفع الصورة")}catch(e){toast("تعذر رفع الصورة")}
  });
  m.querySelectorAll("[data-upf]").forEach(inp=>inp.onchange=async()=>{
    const i=inp.dataset.upf,f=inp.files[0];if(!f)return;
    toast("جاري رفع الملف...");
    try{const p=await uplDoc(f);m.querySelector(`[data-i="${i}"]`).value=p;m.querySelector("#fn"+i).textContent=f.name;toast("تم رفع الملف")}catch(e){toast("تعذر رفع الملف")}
  });
  m.querySelector("#mc").onclick=close;
  m.querySelector("#mk").onclick=async()=>{const b=m.querySelector("#mk");b.disabled=true;b.textContent="جاري المعالجة...";const ok=await onSave(get());b.disabled=false;b.textContent="حفظ";if(ok!==false)close()};
  if(onDel)m.querySelector("#mx").onclick=async()=>{if(confirm("متأكد من الحذف؟")){await onDel();close()}};
}
async function savePD(){
  const {error}=await sb.from("programs").update({data:P.data}).eq("id",P.id);
  if(error){toast("تعذر الحفظ");return false}
  toast("تم الحفظ");route();return true;
}
const TAGS={"جهاز":"t1","دامبل":"t2","بار":"t3","وزن حر":"t4","كابل":"t5","بدون أدوات":"t4"};
function editEx(i,j){
  const s=P.data.sessions[i],e=j<0?{n:"",tag:"جهاز",url:"",img:""}:s.ex[j];
  modal(j<0?"إضافة تمرين":"تعديل التمرين",[{k:"n",l:"اسم التمرين",v:e.n},{k:"tag",l:"الأداة",type:"sel",o:Object.keys(TAGS),v:e.tag},{k:"url",l:"لينك فيديو يوتيوب",v:e.url,dir:"ltr"},{k:"img",l:"صورة (اختياري، وإلا تظهر صورة الفيديو)",type:"img",v:e.img}],
    async v=>{if(!v.n.trim()){toast("اكتب اسم التمرين");return false}
      const o={n:v.n.trim(),tag:v.tag,cls:TAGS[v.tag]||"t4",url:v.url.trim(),img:v.img};
      if(j<0)s.ex.push(o);else s.ex[j]=o;return savePD()},
    j<0?null:async()=>{s.ex.splice(j,1);await savePD()});
}
function editCardio(i){
  const s=P.data.sessions[i];
  modal("تعديل الكارديو",[{k:"c",l:"الجهاز والمستوى",v:s.c},{k:"cm",l:"مدة الكارديو (دقائق)",type:"number",v:s.cm||15},{k:"cw",l:"التوقيت (قبل / بعد التمرين)",v:s.cw},{k:"cu",l:"لينك الفيديو",v:s.cu,dir:"ltr"},{k:"ci",l:"صورة",type:"img",v:s.ci}],
    async v=>{Object.assign(s,{c:v.c.trim(),cm:+v.cm||15,cw:v.cw.trim(),cu:v.cu.trim(),ci:v.ci});return savePD()});
}
function editSess(i){
  const s=i<0?{t:"",s:""}:P.data.sessions[i];
  modal(i<0?"إضافة جلسة":"تعديل الجلسة",[{k:"t",l:"عنوان الجلسة",v:s.t},{k:"s",l:"العضلات المستهدفة",v:s.s}],
    async v=>{if(!v.t.trim()){toast("اكتب العنوان");return false}
      if(i<0)P.data.sessions.push({t:v.t.trim(),s:v.s.trim(),c:"",cw:"بعد التمرين",cu:"",ci:"",ex:[],ab:null});else Object.assign(s,{t:v.t.trim(),s:v.s.trim()});
      return savePD()},
    i<0?null:async()=>{P.data.sessions.splice(i,1);location.hash="train";await savePD()});
}
function editAb(i){
  const s=P.data.sessions[i],a=s.ab||{t:"",vids:[]};
  modal("عنوان تمارين البطن",[{k:"t",l:"مثال: ٣ جولات حتى ١٥ تكرار",v:a.t}],async v=>{s.ab={t:v.t.trim(),vids:a.vids};return savePD()},s.ab?async()=>{s.ab=null;await savePD()}:null);
}
function editAbv(i,x){
  const s=P.data.sessions[i];s.ab=s.ab||{t:"البطن",vids:[]};
  const e=x<0?{url:"",img:""}:s.ab.vids[x];
  modal(x<0?"إضافة فيديو بطن":"تعديل فيديو البطن",[{k:"url",l:"لينك الفيديو",v:e.url,dir:"ltr"},{k:"img",l:"صورة (اختياري)",type:"img",v:e.img}],
    async v=>{const o={url:v.url.trim(),img:v.img};if(x<0)s.ab.vids.push(o);else s.ab.vids[x]=o;return savePD()},
    x<0?null:async()=>{s.ab.vids.splice(x,1);await savePD()});
}
function editOpt(m,k){
  const M=P.data.meals[m],cur=k<0?"":M.opts[k];
  modal(k<0?"إضافة خيار":"تعديل الخيار",[{k:"o",l:"مكونات الخيار (افصل بين المكونات بعلامة +)",type:"area",v:cur}],
    async v=>{if(!v.o.trim()){toast("اكتب الخيار");return false}if(k<0)M.opts.push(v.o.trim());else M.opts[k]=v.o.trim();return savePD()},
    k<0?null:async()=>{M.opts.splice(k,1);await savePD()});
}
function editNote(m){const M=P.data.meals[m];modal("ملاحظة الوجبة",[{k:"n",l:"الملاحظة (اتركها فاضية لإخفائها)",type:"area",v:M.note}],async v=>{M.note=v.n.trim();return savePD()})}
function editSup(i){
  const e=i<0?{n:"",en:"",how:"",warn:"",link:"",img:""}:P.data.supp[i];
  modal(i<0?"إضافة مكمل / توصية":"تعديل المكمل",[{k:"n",l:"الاسم",v:e.n},{k:"en",l:"الاسم بالإنجليزي (اختياري)",v:e.en,dir:"ltr"},{k:"how",l:"طريقة الاستخدام",type:"area",v:e.how},{k:"warn",l:"تنبيه (اختياري)",v:e.warn},{k:"link",l:"لينك الشراء أو الفيديو (اختياري)",v:e.link,dir:"ltr"},{k:"ll",l:"نص زرار اللينك (مثال: عرض على iHerb)",v:e.ll||""},{k:"badge",l:"شارة (مثال: حتى النفاذ، اختياري)",v:e.badge||""},{k:"img",l:"صورة المنتج",type:"img",v:e.img}],
    async v=>{if(!v.n.trim()){toast("اكتب الاسم");return false}
      const o={n:v.n.trim(),en:v.en.trim(),how:v.how.trim(),warn:v.warn.trim(),link:v.link.trim(),ll:v.ll.trim(),badge:v.badge.trim(),img:v.img};
      if(i<0)P.data.supp.push(o);else P.data.supp[i]=o;return savePD()},
    i<0?null:async()=>{P.data.supp.splice(i,1);await savePD()});
}
function editInfo(){
  const d=P.data,f=d.info,e=d.energy;
  const wk=(d.weeks||[]).map(r=>r.join("-")).join("\n"),ex=(e.exch||[]).map(x=>x[0]+" "+x[1]).join(" | ");
  const T=(k,l,v,o)=>Object.assign({k,l,v:v??""},o||{});
  modal("بيانات العميل والبرنامج",[T("brand","اسم البرنامج (يظهر كبيرًا)",d.brand),T("sub","وصف البرنامج",d.sub),T("sex","النوع",f.sex),T("age","العمر",f.age),T("weight","الوزن",f.weight),T("height","الطول",f.height),T("start","تاريخ البداية",f.start),T("end","تاريخ النهاية",f.end),T("days","مدة البرنامج (أيام)",f.days,{type:"number"}),T("minutes","التمرين أسبوعيًا",f.minutes),T("so2","الأكسجين",f.so2),T("rs","التنفس",f.rs),T("pulse","النبض",f.pulse),T("bp","الضغط",f.bp),T("bmr","معدل الحرق الأساسي",e.bmr),T("act","معامل النشاط",e.act),T("tdee","إجمالي الطاقة",e.tdee),T("plan","سعرات الخطة",e.plan),T("water","الماء",e.water),T("ptn","البروتين",e.ptn),T("cho","الكربوهيدرات",e.cho),T("exch","التبادلات الغذائية (افصل بـ | مثال: 9 بروتين | 4 نشويات)",ex,{type:"area"}),T("rest","الراحة بين المجموعات (ثانية)",d.rest,{type:"number"}),T("wk","تدرّج التكرارات: سطر لكل أسبوع مثل 10-10-10 (فاضي = تكرارات ثابتة)",wk,{type:"area"}),T("reps","التكرارات الثابتة مثل 12-10-10",(d.reps||[]).join("-"))],
    async v=>{
      const lat=t=>String(t).replace(/[٠-٩]/g,c=>"٠١٢٣٤٥٦٧٨٩".indexOf(c)),nums=t=>lat(t).split(/[^0-9]+/).filter(Boolean).map(Number);
      d.brand=v.brand.trim();d.sub=v.sub.trim();
      ["sex","age","weight","height","start","end","minutes","so2","rs","pulse","bp"].forEach(k=>f[k]=ar(v[k].trim()));
      f.days=+v.days||30;
      ["bmr","act","tdee","plan","water","ptn","cho"].forEach(k=>e[k]=ar(v[k].trim()));
      e.exch=v.exch.split("|").map(x=>x.trim()).filter(Boolean).map(x=>{const m=/^(\S+)\s+(.+)$/.exec(x);return m?[ar(m[1]),m[2]]:["",x]});
      d.rest=+v.rest||null;
      const w=v.wk.split("\n").map(nums).filter(a=>a.length);if(w.length)d.weeks=w;else delete d.weeks;
      const r=nums(v.reps);if(r.length)d.reps=r;
      return savePD();
    });
}
function newMonth(){
  const nx=new Date(D.getFullYear(),D.getMonth()+1,1);
  modal("برنامج شهر جديد (نسخة من البرنامج الحالي)",[{k:"d",l:"تاريخ البداية",type:"date",v:iso(nx)},{k:"t",l:"عنوان البرنامج",v:""}],async v=>{
    if(!v.d)return false;
    const {data,error}=await sb.from("programs").insert({client_id:CID(),title:v.t.trim()||("برنامج "+v.d),month_start:v.d,data:Object.assign(JSON.parse(JSON.stringify(P.data)),{files:{}})}).select().single();
    if(error){toast("تعذر الإنشاء");return false}
    PROGS.unshift(data);PROGS.sort((a,b)=>b.month_start.localeCompare(a.month_start));PI=PROGS.findIndex(p=>p.id===data.id);P=PROGS[PI];toast("تم إنشاء البرنامج، عدّل عليه");route();
  });
}
function newProgram(){
  const base={info:{age:"",weight:"",height:"",start:"",end:"",days:30,minutes:""},reps:[12,10,10],energy:{bmr:"",act:"",tdee:"",plan:"",water:"",exch:[]},sessions:[],meals:{b:{t:"الفطار",note:"",opts:[]},l:{t:"الغداء",note:"",opts:[]},d:{t:"العشاء",note:"",opts:[]}},supp:[]};
  modal("إنشاء أول برنامج للعميل",[{k:"d",l:"تاريخ البداية",type:"date",v:TODAY},{k:"t",l:"عنوان البرنامج",v:""}],async v=>{
    const {data,error}=await sb.from("programs").insert({client_id:CID(),title:v.t.trim()||("برنامج "+v.d),month_start:v.d,data:base}).select().single();
    if(error){toast("تعذر الإنشاء");return false}
    PROGS=[data];PI=0;P=data;route();
  });
}

/* ===== صفحات العميل ===== */
function empty(){
  hd("برنامجك","Training Nutrition Hub");
  $("#app").innerHTML=EDIT()?`<div class="card" style="text-align:center"><b>لا يوجد برنامج لهذا العميل</b></div>${addb("importProg()","استيراد برنامج من ملف PDF")}${addb("newProgram()","إنشاء برنامج فارغ")}`:`<div class="card" style="text-align:center"><b>لسه مفيش برنامج متاح لحسابك</b><p style="color:var(--mut)">هيظهر هنا فور ما الدكتور يضيفه.</p></div><button class="btn o" onclick="out()">تسجيل الخروج</button>`;
}
function home(){
  const dt=P.data,inf=dt.info,n=dt.sessions.reduce((a,s)=>a+s.ex.length,0);
  hd("الرئيسية","Training Nutrition Hub");
  let h=`<div class="card brand"><img src="img/logo.png" alt=""><small>مدربك وأخصائي التغذية</small><h1>الدكتور محمود جمال قطب</h1><div class="en">DR. MAHMOUD GAMAL</div><div class="tg">تخلّص من أمراضك</div></div>`;
  if(EDIT())h+=pubCard();
  const dn=dayNo(),T=inf.days||30;
  h+=`<div class="card"><div class="hi"><b>أهلاً ${esc(NAME())}</b><span style="color:var(--mut);font-size:13px">${esc(P.title||"")}</span></div><div style="margin-top:8px;font-weight:700">${dn?`اليوم ${ar(dn)} من ${ar(T)}`:"البرنامج لسه ما بدأش"}</div><div class="bar"><i style="width:${dn/T*100}%"></i></div></div>`;
  if(PROGS.length>1)h+=`<select onchange="setProg(this.value)">${PROGS.map((p,i)=>`<option value="${i}" ${i==PI?"selected":""}>${esc(p.title||p.month_start)}${EDIT()&&!p.published?" (مسودة)":""}</option>`).join("")}</select>`;
  h+=`<a class="card sec" href="#train"><div class="no">٠١</div><div><h3>التدريب</h3><p>${ar(dt.sessions.length)} جلسات · ${ar(n)} تمرين بفيديوهات الشرح</p></div><div class="go">‹</div></a>`;
  h+=`<a class="card sec" href="#food"><div class="no">٠٢</div><div><h3>التغذية</h3><p>خطة الوجبات والتبادلات الغذائية</p></div><div class="go">‹</div></a>`;
  h+=`<a class="card sec" href="#supp"><div class="no">٠٣</div><div><h3>التوصيات والمكملات الغذائية</h3><p>${ar(dt.supp.length)} توصيات</p></div><div class="go">‹</div></a>`;
  h+=`<div class="card pg"><div class="sub">${esc(dt.sub||"")}</div><div class="big">${esc(dt.brand||P.title||"")}</div><div class="mem">${[["الاسم",NAME()||"—"],["العمر",inf.age],["الوزن",inf.weight],["الطول",inf.height],["البداية",inf.start],["النهاية",inf.end],["المدة",inf.days?ar(inf.days)+" يومًا":""],["التمرين",inf.minutes]].map(x=>`<div><span>${x[0]}</span><b>${esc(x[1])||"—"}</b></div>`).join("")}</div>${ed("editInfo()","تعديل بيانات العميل والبرنامج")}</div>`;
  if(EDIT()){
    const days=Object.keys(LOGS).sort().reverse().slice(0,7);
    h+=`<div class="card"><b>نشاط العميل (آخر ٧ أيام)</b>${days.length?days.map(d=>{const g=LOGS[d];return `<div class="act"><span>${ar(d.slice(5).replace("-","/"))}</span><span>${ar(Object.keys(g.d||{}).length)} تمارين · ${ar(Object.keys(g.m||{}).length)} وجبات · ${ar(Object.keys(g.s||{}).length)} مكملات</span></div>`}).join(""):'<p style="color:var(--mut);margin:6px 0 0">لا يوجد نشاط مسجل بعد</p>'}</div>${addb("newMonth()","برنامج شهر جديد (نسخ من الحالي)")}${addb("importProg()","استيراد برنامج من ملف PDF")}<button class="btn o" onclick="sendNote('${VIEW.id}')">✉ إرسال إشعار للعميل</button>`;
  }
  h+=`<div class="card" style="background:linear-gradient(180deg,#10261a,#0b0f0b);color:#fff;border:0;margin-top:12px"><div class="lbl">المؤهلات</div>${["أخصائي الإعداد البدني قبل وبعد جراحة الإصابات وعلاج الانحرافات القوامية","أخصائي تغذية عام","دبلومة الطب الرياضي","دبلومة وماجستير ودكتوراه التغذية العلاجية"].map(x=>`<div class="q" style="background:rgba(255,255,255,.07)">${x}</div>`).join("")}<div class="lbl" style="margin-top:12px">في تغذية</div><div class="cp">${["مرضى السمنة والنحافة","مرضى الجهاز الهضمي","التهابات وحساسية المرارة","مرضى الكلى","الضغط","السكر","الأورام","الأطفال","فترة الحمل والرضاعة","مرضى الإسهال","تقرحات والتهابات القولون المناعية المزمنة","مرضى الغدة الدرقية","الرياضيين"].map(x=>`<i style="color:#cfd8c8;border-color:rgba(255,255,255,.2)">${x}</i>`).join("")}</div><div class="qr"><a href="https://wa.me/201006130790" target="_blank" rel="noopener"><img src="img/qr-wa.png" alt=""></a><div><div class="lbl" style="color:var(--or)">التواصل</div><b>تواصل معي على واتساب</b><br><a class="ih" style="border:1px solid rgba(255,255,255,.3);margin:6px 0 0" href="https://wa.me/201006130790" target="_blank" rel="noopener">فتح واتساب ↗</a></div></div><div class="qr"><a href="https://docs.google.com/forms/d/e/1FAIpQLScabXfmxUsT3gaL7NJZjdyBedf0UIx-x2YAtlo8A_rJnBEIuA/viewform" target="_blank" rel="noopener"><img src="img/qr-form.png" alt=""></a><div><div class="lbl" style="color:var(--or)">المتابعة</div><b>استمارة المتابعة</b><br><a class="ih" style="border:1px solid rgba(255,255,255,.3);margin:6px 0 0" href="https://docs.google.com/forms/d/e/1FAIpQLScabXfmxUsT3gaL7NJZjdyBedf0UIx-x2YAtlo8A_rJnBEIuA/viewform" target="_blank" rel="noopener">فتح الاستمارة ↗</a></div></div></div>`;
  h+=`<button class="btn o" onclick="out()">تسجيل الخروج</button>`;
  $("#app").innerHTML=h;
}
function train(){
  const dt=P.data;hd("التدريب","القسم الأول");
  let h=`<p style="margin:0 2px 10px;color:var(--mut);font-size:14px">اختر الجلسة لعرض التمارين وفيديوهات الشرح.</p>`;
  dt.sessions.forEach((s,i)=>{h+=`<a class="card ses" href="#s${i+1}"><div class="no">${ar(i+1)}</div><div><h3>${esc(s.t)}</h3><p>${esc(s.s)}</p><p style="color:var(--or);font-weight:700">كارديو ${ar(s.cm||15)} د · ${esc(s.c)||"—"}</p><p>اليوم: ${ar(doneCount(i))} / ${ar(s.ex.length)} تمارين</p></div><div class="go">‹</div></a>`});
  h+=addb("editSess(-1)","إضافة جلسة");
  h+=blocksBlock("train");
  h+=filesBlock("train");
  h+=repsCard();
  h+=`<div class="card"><div class="lbl" style="color:var(--or)">طريقة الاستخدام</div><ul class="how"><li>الضغط على صورة أي <b>فيديو</b> يفتح شرح التمرين.</li><li>كتابة الوزن المرفوع (كجم) في كل مجموعة، ويتم حفظه تلقائيًا.</li><li>زرار «تم» بعد كل تمرين لمتابعة التقدم.</li><li>الكارديو: ١٥ دقيقة بالمستوى المذكور.</li></ul></div>`;
  $("#app").innerHTML=h;
}
function session(i){
  const s=P.data.sessions[i];if(!s)return train();
  hd(esc(s.t),`الجلسة ${ar(i+1)} / ${ar(P.data.sessions.length)} · ${esc(s.s)}`,true);
  let h=`<div class="card cardio"><div>${vid(s.cu,s.c,"sm",s.ci)}</div><div><div class="lbl" style="color:var(--or)">تسخين / كارديو · ${ar(s.cm||15)} دقيقة</div><h3>${esc(s.c)||"—"}</h3><p>${esc(s.cw)}</p>${ed(`editCardio(${i})`)}</div></div>${EDIT()?ed(`editSess(${i})`,"تعديل عنوان الجلسة / حذفها"):""}`;
  const R=REPS();
  h+='<div style="height:12px"></div>'+repsCard();
  const lg=L();
  s.ex.forEach((e,j)=>{
    const k=`s${i}e${j}`,w=lg.w[k]||[];
    h+=`<div class="card ex ${lg.d[k]?"done":""}" id="c-${k}">${vid(e.url,e.n,"",e.img)}<div class="top"><div class="n">${ar(j+1)}</div><h3>${esc(e.n)}</h3><span class="pill ${e.cls||"t1"}">${esc(e.tag)}</span></div>${ed(`editEx(${i},${j})`)}${P.data.rest?`<div class="rest">راحة <b>${ar(P.data.rest)}</b> ثانية</div>`:""}<div class="cap">${WK()?`التكرارات · الأسبوع ${ar(WK())} · `:""}الوزن (كجم)</div><div class="sets">${R.map((r,x)=>`<div><div class="rp">${ar(r)}</div><input type="text" inputmode="decimal" value="${esc(w[x]||"")}" placeholder="${lastW(k,x)?ar(lastW(k,x)):""}" onchange="setW('${k}',${x},this.value)"></div>`).join("")}</div><button class="chk" onclick="tgl('${k}')">${lg.d[k]?"✓ تم":"تم التمرين"}</button></div>`;
  });
  h+=addb(`editEx(${i},-1)`,"إضافة تمرين");
  if(s.ab){h+=`<div class="card dk"><div class="lbl" style="color:var(--or)">البطن · كور</div><b style="font-size:17px">${esc(s.ab.t)}</b>${ed(`editAb(${i})`)}</div><div style="display:grid;gap:10px;margin-bottom:12px">${s.ab.vids.map((v,x)=>`<div>${vid(v.url,"تمرين بطن "+(x+1),"",v.img)}${ed(`editAbv(${i},${x})`)}</div>`).join("")}</div>`}
  h+=`<div class="card"><div class="lbl" style="color:var(--or)">ملاحظات وتقدم</div><textarea class="nb" onchange="setNote(${i},this.value)" placeholder="اكتب ملاحظاتك هنا">${esc((lg.n||{})[i]||"")}</textarea></div>`;
  h+=EDIT()?(s.ab?"":addb(`editAb(${i})`,"إضافة قسم البطن"))+addb(`editAbv(${i},-1)`,"إضافة فيديو بطن"):"";
  $("#app").innerHTML=h;
}
function setW(k,x,v){const l=L();l.w[k]=l.w[k]||["","",""];l.w[k][x]=v.trim();save()}
function setNote(i,v){const l=L();l.n=l.n||{};l.n[i]=v.trim();save()}
function tgl(k){const l=L(),c=$("#c-"+k);if(l.d[k]){delete l.d[k];c.classList.remove("done");c.querySelector(".chk").textContent="تم التمرين"}else{l.d[k]=1;c.classList.add("done");c.querySelector(".chk").textContent="✓ تم"}save()}
function food(){
  const dt=P.data,E=dt.energy;hd("التغذية","القسم الثاني");
  let h=`<div class="en"><div><span>معدل الحرق الأساسي</span><b>${esc(E.bmr)||"—"}</b><span>سعرة</span></div><div><span>مستوى النشاط</span><b>${esc(E.act)||"—"}</b><span>معامل</span></div><div><span>إجمالي الطاقة</span><b>${esc(E.tdee)||"—"}</b><span>سعرة</span></div><div class="p"><span>سعرات الخطة</span><b>${esc(E.plan)||"—"}</b><span>سعرة / يوم</span></div></div>`;
  const fi=dt.info,vit=[["النوع",fi.sex],["الأكسجين",fi.so2],["التنفس",fi.rs],["النبض",fi.pulse],["الضغط",fi.bp]].filter(x=>x[1]);
  if(vit.length)h+=`<div class="card"><div class="mini" style="grid-template-columns:repeat(${Math.min(vit.length,5)},1fr)">${vit.map(x=>`<div><span>${x[0]}</span><b>${esc(x[1])}</b></div>`).join("")}</div></div>`;
  h+=`<div class="card" style="display:flex;justify-content:space-around;text-align:center;flex-wrap:wrap;gap:8px"><div><div class="lbl">الماء</div><b>${esc(E.water)||"—"}</b></div><div><div class="lbl">التمرين</div><b>${esc(dt.info.minutes)||"—"}</b></div>${E.ptn?`<div><div class="lbl">البروتين</div><b>${esc(E.ptn)}</b></div>`:""}${E.cho?`<div><div class="lbl">الكربوهيدرات</div><b>${esc(E.cho)}</b></div>`:""}</div>${ed("editInfo()","تعديل الطاقة والماء")}`;
  if(E.exch&&E.exch.length)h+=`<h2>التبادلات الغذائية اليومية</h2><div class="ex6">${E.exch.map(x=>`<div><b>${ar(x[0])}</b><span>${x[1]}</span></div>`).join("")}</div>`;
  const keys=Object.keys(dt.meals);if(!dt.meals[ft])ft=keys[0];
  h+=`<h2>الوجبات · اختر خيارًا واحدًا${E.plan?" · "+E.plan+" سعرة / يوم":""}</h2><div class="pills">${keys.map(m=>`<button class="${m==ft?"on":""}" onclick="ft='${m}';food()">${esc(dt.meals[m].t)}</button>`).join("")}</div>`;
  h+=ed(`editMeal('${ft}')`,"تعديل اسم الوجبة / حذفها")+addb("editMeal('')","إضافة وجبة");
  const M=dt.meals[ft],sel=L().m[ft];
  if(M.note)h+=`<div class="note">${esc(M.note)}</div>`;
  h+=ed(`editNote('${ft}')`,"تعديل الملاحظة");
  h+=`<p style="color:var(--mut);font-size:13px;margin:6px 2px 8px">اضغط على الخيار الذي تناولته اليوم لتعليمه.</p>`;
  M.opts.forEach((o,i)=>{h+=`<div class="card opt ${sel===i?"sel":""}" onclick="pick(${i})"><div class="n">${sel===i?"✓":ar(i+1)}</div><div style="flex:1"><div class="chips">${o.split(" + ").map(x=>`<i>${esc(x)}</i>`).join("<b>+</b>")}</div>${ed(`editOpt('${ft}',${i})`)}</div></div>`});
  h+=addb(`editOpt('${ft}',-1)`,"إضافة خيار");
  h+=blocksBlock("food");
  h+=REF;
  h+=filesBlock("food");
  $("#app").innerHTML=h;
}
function pick(i){const l=L();if(l.m[ft]===i)delete l.m[ft];else l.m[ft]=i;save();food()}
function supp(){
  hd("التوصيات والمكملات","القسم الثالث");const l=L();
  $("#app").innerHTML=P.data.supp.map((s,i)=>`<div class="card sup ${l.s[i]?"done":""}" id="p${i}"><div class="si">${s.img?`<img src="${s.img}" alt="">`:'<div class="ph">صورة</div>'}</div><div style="flex:1"><div class="lbl" style="color:var(--or)">توصية</div><h3>${esc(s.n)}</h3><div class="e" dir="ltr" style="text-align:start">${esc(s.en)}</div><div class="how">${esc(s.how)}</div>${s.badge?`<span class="pill t1" style="margin-bottom:8px">${esc(s.badge)}</span>`:""}${s.warn?`<div class="warn">${esc(s.warn)}</div>`:""}${s.link?`<a class="ih" href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.ll)||"فتح اللينك"} ↗</a>`:""}<button class="chk" onclick="tsp(${i})">${l.s[i]?"✓ تم اليوم":"تم اليوم"}</button>${ed(`editSup(${i})`)}</div></div>`).join("")+addb("editSup(-1)","إضافة مكمل / توصية")+blocksBlock("supp")+filesBlock("supp");
}
function tsp(i){const l=L(),c=$("#p"+i);if(l.s[i]){delete l.s[i];c.classList.remove("done");c.querySelector(".chk").textContent="تم اليوم"}else{l.s[i]=1;c.classList.add("done");c.querySelector(".chk").textContent="✓ تم اليوم"}save()}
function notes(){
  hd("الإشعارات","رسائل من الدكتور");
  $("#app").innerHTML=(NOTIFS.length?NOTIFS.map(n=>`<div class="card nt ${n.read?"":"un"}"><h3>${esc(n.title)}</h3><p style="margin:4px 0">${esc(n.body)}</p><small>${ar(new Date(n.created_at).toLocaleDateString("en-GB"))}</small></div>`).join(""):`<div class="card" style="text-align:center;color:var(--mut)">لا توجد إشعارات حتى الآن</div>`)+(EDIT()?`<button class="btn o" onclick="sendNote('${VIEW.id}')">✉ إرسال إشعار</button>`:"");
  if(!ADMIN&&NOTIFS.some(n=>!n.read)){
    sb.from("notifications").update({read:true}).eq("client_id",ME.id).eq("read",false).then(()=>{NOTIFS.forEach(n=>n.read=true);badge()});
  }
}
function route(){
  if(!ME||(ADMIN&&!VIEW))return;
  const r=location.hash.slice(1)||"home",m=/^s([1-9]\d?)$/.exec(r);
  if(!P){empty();return}
  if(m)session(+m[1]-1);else if(r=="train")train();else if(r=="food")food();else if(r=="supp")supp();else if(r=="notes")notes();else home();
  const cur=m?"train":(["train","food","supp","notes"].includes(r)?r:"home");
  ["home","train","food","supp","notes"].forEach(x=>$("#n-"+x).classList.toggle("on",x==cur));
  window.scrollTo(0,0);
}
addEventListener("hashchange",route);
(async()=>{
  if(CONFIG.SUPABASE_URL.includes("YOUR-PROJECT")){$("#app").innerHTML='<div class="card"><b>لازم تضيف بيانات سوبابيز في ملف config.js</b></div>';return}
  const {data:{session}}=await sb.auth.getSession();
  session?load():login();
})();
