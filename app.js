const $=s=>document.querySelector(s);
const ar=n=>String(n).replace(/\d/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const D=new Date(),TODAY=iso(D);
const sb=window.supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_ANON_KEY);
let ME,PROF={},ADMIN=false,VIEW=null,PROGS=[],PI=0,P,LOGS={},NOTIFS=[],ft="b";
const SV={get(){try{return JSON.parse(sessionStorage.getItem("tnh_view")||"null")}catch(e){return null}},set(v){try{sessionStorage.setItem("tnh_view",JSON.stringify(v))}catch(e){}},clr(){try{sessionStorage.removeItem("tnh_view")}catch(e){}}};
const CID=()=>VIEW?VIEW.id:ME.id;
const EDIT=()=>ADMIN&&VIEW;
const NAME=()=>VIEW?VIEW.name:(PROF.full_name||"");

function toast(m){
  const sh=document.querySelector(".md .sh");
  if(sh){let e=sh.querySelector(".merr");if(!e){e=document.createElement("div");e.className="merr";sh.insertBefore(e,sh.querySelector("#mk"))}e.textContent=m;return}
  const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2800)}
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
  $("#hd").innerHTML=`<div class="hd">${back?'<button class="back" onclick="location.hash=\''+(back===true?'train':back)+'\'">›</button>':''}<div><small>${sub}</small><h1>${t}</h1></div><img class="lgo" src="img/logo.png" alt=""></div>`+(VIEW?`<div class="vb"><span>حساب: ${esc(VIEW.name)} · وضع التعديل</span><button onclick="closeClient()">العملاء ›</button></div>`:"");
};
const dayNo=()=>{const s=new Date(P.month_start+"T00:00:00"),t=new Date(D.getFullYear(),D.getMonth(),D.getDate());const T=P.data.info.days||30;return Math.min(T,Math.max(0,Math.floor((t-s)/864e5)+1))};
let VW=0;const setVW=n=>{VW=VW===n?0:n;route()};
const WK=()=>{const w=P.data.weeks;if(!w||!w.length)return null;if(EDIT()&&VW)return Math.min(w.length,VW);return Math.min(w.length,Math.max(1,Math.ceil((dayNo()||1)/7)))};
/* ===== أوزان التدرّج: المتخصص يكتب أوزان الأسبوع الأول، والباقي بيتحسب ===== */
const numsD=t=>String(t||"").replace(/[٠-٩]/g,c=>"٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/٫/g,".").split(/[^0-9.]+/).filter(x=>x&&x!==".").map(Number);
const fmtW=n=>ar(String(n).replace(".","٫"));
function planW(e,wk){
  /* الوزن مربوط بعدد التكرارات (منحنى عدات ↔ وزن) من أوزان الأسبوع الأول:
     • نفس العدات = نفس الوزن في كل الأسابيع
     • أقل من أقل عدات في الأسبوع الأول ← أثقل وزن عندها +5٪
     • أكتر من أكتر عدات في الأسبوع الأول ← أخف وزن عندها −5٪
     • عدات بين رقمين ← استيفاء بينهم، والكل بيتقرّب لأقرب 0.5 كجم */
  const D=P.data,w1=(e.w1||[]).map(Number),ov=wk>1&&e.wo&&e.wo[wk]?e.wo[wk].map(Number):null;
  const W=D.weeks&&D.weeks.length?D.weeks:null;
  const R1=(W?W[0]:D.reps)||[],Rw=(W?W[Math.min(wk,W.length)-1]:D.reps)||[];
  if(!w1.some(x=>x>0)&&!(ov&&ov.some(x=>x>0)))return null;
  if(wk<=1)return w1.map(x=>x>0?x:0);
  const pct=(D.wpct??5)/100,st=D.wsnap??0.5;
  const snap=v=>Number((st>0?Math.round(v/st)*st:v).toFixed(2));
  const move=(base,dir)=>{const v=snap(base*(1+dir*pct));return st>0&&v===base?Math.max(st,Number((base+dir*st).toFixed(2))):v};
  const by={};R1.forEach((r,x)=>{if(w1[x]>0)(by[r]=by[r]||[]).push(w1[x])});
  const keys=Object.keys(by).map(Number).sort((a,b)=>a-b);
  const seen={},out=[];
  Rw.forEach((r,x)=>{
    const occ=seen[r]||0;seen[r]=occ+1;
    if(ov&&ov[x]>0){out.push(ov[x]);return}
    if(!keys.length){out.push(0);return}
    let v;
    if(by[r])v=by[r][Math.min(occ,by[r].length-1)];
    else if(r<keys[0])v=move(Math.max(...by[keys[0]]),1);
    else if(r>keys[keys.length-1])v=move(Math.min(...by[keys[keys.length-1]]),-1);
    else{const lo=keys.filter(k=>k<r).pop(),hi=keys.find(k=>k>r);v=snap(by[hi][0]+(by[lo][by[lo].length-1]-by[hi][0])*(hi-r)/(hi-lo))}
    out.push(v);
  });
  return out;
}
const REPS=()=>{const w=WK();return w?P.data.weeks[w-1]:P.data.reps};
function repsCard(){
  const dt=P.data;
  if(dt.weeks&&dt.weeks.length){const w=WK();return `<div class="card dk"><div class="lbl">تدرّج التكرارات حسب الأسبوع · المجموعات ١ · ٢ · ٣</div><div class="rt4">${dt.weeks.map((r,i)=>`<div class="${i+1==w?"cur":""}" ${EDIT()?`onclick="setVW(${i+1})"`:""}><span>الأسبوع ${ar(i+1)}</span><b>${r.map(ar).join("·")}</b></div>`).join("")}</div>${EDIT()?`<div style="margin-top:8px;font-size:11.5px;opacity:.7">اضغط على أي أسبوع لمعاينة تكراراته وأوزانه المحسوبة</div>`:""}${dt.rest?`<div style="margin-top:8px;font-size:12px;opacity:.75">الراحة بين المجموعات: ${ar(dt.rest)} ثانية</div>`:""}</div>`}
  return `<div class="card dk"><div class="lbl">التكرارات في كل مجموعة</div><div class="rt">${dt.reps.map((x,i)=>`<div><span>المجموعة ${ar(i+1)}</span><b>${ar(x)}</b></div>`).join("")}</div></div>`;
}
const doneCount=i=>Object.keys(L().d).filter(k=>k.startsWith("s"+i+"e")).length;

/* ===== بطاقة الدكتور (صفحة الدخول) ===== */
function docCard(){
  const FORM="https://docs.google.com/forms/d/e/1FAIpQLScabXfmxUsT3gaL7NJZjdyBedf0UIx-x2YAtlo8A_rJnBEIuA/viewform";
  const quals=["أخصائي الإعداد البدني قبل وبعد جراحة الإصابات وعلاج الانحرافات القوامية","أخصائي تغذية عام","دبلومة الطب الرياضي","دبلومة وماجستير ودكتوراه التغذية العلاجية"];
  const chips=["مرضى السمنة والنحافة","مرضى الجهاز الهضمي","التهابات وحساسية المرارة","مرضى الكلى","الضغط","السكر","الأورام","الأطفال","فترة الحمل والرضاعة","مرضى الإسهال","تقرحات والتهابات القولون المناعية المزمنة","مرضى الغدة الدرقية","الرياضيين"];
  return `<div class="card dc"><h2>الدكتور محمود جمال قطب</h2><div class="en">DR. MAHMOUD GAMAL</div>${quals.map(x=>`<div class="q">${x}</div>`).join("")}<div class="lbl" style="margin-top:12px">في تغذية</div><div class="cp">${chips.map(x=>`<i>${x}</i>`).join("")}</div><div class="qr"><a href="${FORM}" target="_blank" rel="noopener"><img src="img/qr-form.png" alt="QR"></a><div><div class="lbl">SCAN</div><b>امسح الكود</b></div></div></div>`;
}

/* ===== الدخول ===== */
function login(msg){
  $("#hd").innerHTML="";$("nav").style.display="none";document.body.classList.remove("av");
  $("#app").innerHTML=`<div class="login"><img src="img/logo.png" alt=""><h1>Training <b>Nutrition</b> Hub</h1><p>تسجيل الدخول لمتابعة برنامجك</p><input id="em" type="email" autocomplete="username" placeholder="الإيميل" dir="ltr"><input id="pw" type="password" autocomplete="current-password" placeholder="كلمة المرور" dir="ltr"><button id="go">دخول</button><div id="er">${msg||""}</div>${docCard()}</div>`;
  const go=async()=>{
    $("#er").textContent="";$("#go").disabled=true;
    const {error}=await sb.auth.signInWithPassword({email:$("#em").value.trim(),password:$("#pw").value});
    $("#go").disabled=false;
    if(error)$("#er").textContent="الإيميل أو كلمة المرور غير صحيحة";else load();
  };
  $("#go").onclick=go;$("#pw").onkeydown=e=>{if(e.key==="Enter")go()};
}
async function out(){SV.clr();rtStop();await Promise.race([pushOff(),new Promise(r=>setTimeout(r,2500))]);await sb.auth.signOut();LOGS={};PROGS=[];P=null;VIEW=null;location.hash="";login()}

/* ===== تحميل ===== */
async function loadData(cid){
  const [b,c,d]=await Promise.all([
    sb.from("programs").select("*").eq("client_id",cid).order("month_start",{ascending:false}),
    sb.from("logs").select("log_date,data").eq("client_id",cid),
    sb.from("notifications").select("*").eq("client_id",cid).order("created_at",{ascending:false}).limit(30),loadMeas(cid)]);
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
    PROF=a.data||{};ADMIN=PROF.role==="admin";VIEW=null;pushSync();
    if(ADMIN){const dl=deepClient();if(dl)return openClient(dl.id,dl.name);const sv=SV.get();if(sv&&sv.id)return openClient(sv.id,sv.name,true);document.body.classList.remove("av");$("nav").style.display="none";return clients()}
    await loadData(user.id);$("nav").style.display="flex";badge();route();
  }catch(e){
    $("#app").innerHTML=`<div class="card" style="text-align:center"><b>تعذر تحميل البيانات</b><p style="color:var(--mut)">تأكد من الإنترنت وحاول مرة أخرى.</p><button class="btn" onclick="load()">إعادة المحاولة</button></div>`;
  }
}
function badge(){const n=NOTIFS.filter(x=>!x.read).length,b=$("#nb");b.hidden=!n||!!EDIT();b.textContent=ar(n)}
function setProg(i){PI=+i;P=PROGS[PI];route()}

/* ===== الأدمن: العملاء ===== */
async function clients(){
  SV.clr();VIEW=null;P=null;rtSync();document.body.classList.remove("av");$("nav").style.display="none";
  $("#hd").innerHTML=`<div class="hd"><div><small>لوحة المدرب</small><h1>عملائي</h1></div><img class="lgo" src="img/logo.png" alt=""></div>`;
  $("#app").innerHTML='<p class="ld">جاري التحميل...</p>';
  const since=new Date(D.getTime()-14*864e5);
  const [a,b,c,mq,ml]=await Promise.all([
    sb.from("profiles").select("id,full_name,phone").eq("role","client").order("full_name"),
    sb.from("logs").select("client_id,log_date,data").gte("log_date",iso(since)),
    sb.from("programs").select("client_id,title,month_start,data").order("month_start",{ascending:false}),
    sb.from("measure_requests").select("client_id,kind").eq("status","pending"),
    sb.from("measurements").select("client_id,taken_on,weight,created_at").order("created_at",{ascending:false}).limit(300)]);
  const cl=a.data||[],lg=b.data||[],pr=c.data||[];
  let h=pushCard()+`<div class="card" style="text-align:center"><b>${ar(cl.length)} عميل</b><p style="margin:2px 0 0;color:var(--mut);font-size:13px">اضغط على العميل لعرض حسابه وتعديل برنامجه</p></div><button class="btn" style="margin-bottom:12px" onclick="addClient()">+ إضافة عميل جديد</button>`;
  cl.forEach(x=>{
    const mine=lg.filter(l=>l.client_id===x.id).sort((p,q)=>q.log_date.localeCompare(p.log_date));
    const last=mine[0],t=mine.find(l=>l.log_date===TODAY);
    const cnt=t?Object.keys(t.data.d||{}).length:0,sup=t?Object.keys(t.data.s||{}).length:0,mel=t?Object.keys(t.data.m||{}).length:0;
    const days=last?Math.round((new Date(TODAY)-new Date(last.log_date))/864e5):null;
    const act=last?(days===0?"نشط اليوم":days===1?"آخر نشاط أمس":`غائب منذ ${ar(days)} أيام`):"لم يبدأ بعد";
    const bad=days===null||days>=3;
    const p=pr.find(z=>z.client_id===x.id);
    const left=p?Math.round((new Date(p.month_start)-new Date(TODAY))/864e5)+((p.data&&p.data.info&&p.data.info.days)||30)-1:null;
    const pq=(mq.data||[]).filter(z=>z.client_id===x.id),lm=(ml.data||[]).find(z=>z.client_id===x.id);
    h+=`<div class="card cl"><div style="flex:1;cursor:pointer" onclick="openClient('${x.id}','${esc(x.full_name||"عميل").replace(/'/g,"")}')"><h3>${esc(x.full_name||"بدون اسم")}</h3><p class="${bad?"no2":"ok"}">${act}</p><p>اليوم: ${ar(cnt)} تمارين · ${ar(mel)} وجبات · ${ar(sup)} مكملات</p>${left!==null?`<p>${left>=0?`باقي ${ar(left)} يوم على نهاية البرنامج`:"البرنامج انتهى"}</p>`:'<p>لا يوجد برنامج</p>'}${pq.length?`<p style="color:#d23b5f;font-weight:700">⏳ مطلوب منه: ${pq.map(z=>MK(z.kind)).join(" + ")}</p>`:""}${lm?`<p>آخر قياس: ${dmy(lm.taken_on)}${lm.weight!=null?" · "+fmtW(lm.weight)+" كجم":""}</p>`:""}</div><div style="display:grid;gap:6px"><button class="ed" style="display:inline-block;margin:0" onclick="sendNote('${x.id}')">✉ إشعار</button><button class="ed" style="display:inline-block;margin:0" onclick="setPass('${x.id}')">كلمة المرور</button></div></div>`;
  });
  h+=`<button class="btn o" onclick="remindNow()">🔔 التذكيرات التلقائية (معاينة / إرسال)</button><button class="btn o" onclick="out()">تسجيل الخروج</button>`;
  $("#app").innerHTML=h;
}
async function openClient(id,name,keep){
  VIEW={id,name};SV.set({id,name});$("#app").innerHTML='<p class="ld">جاري التحميل...</p>';
  try{await loadData(id)}catch(e){toast("تعذر التحميل");return clients()}
  document.body.classList.add("av");$("nav").style.display="flex";badge();
  if(keep||location.hash==="#home"||location.hash==="")route();else location.hash="home";
}
function closeClient(){location.hash="";clients()}
function sendNote(cid){
  modal("إرسال إشعار للعميل",[{k:"t",l:"العنوان",v:""},{k:"b",l:"الرسالة",v:"",type:"area"}],async v=>{
    if(!v.t.trim()){toast("اكتب العنوان");return false}
    const {error}=await sb.from("notifications").insert({client_id:cid,title:v.t.trim(),body:v.b.trim()});
    if(!error)pushTo(cid,v.t.trim(),v.b.trim());toast(error?"تعذر الإرسال":"تم إرسال الإشعار");return !error;
  });
}

/* ===== النوافذ والتعديل ===== */
function fld(f,i){
  const v=esc(f.v??"");
  if(f.type==="area")return `<label>${f.l}<textarea data-i="${i}" class="${f.big?"big":""}">${v}</textarea></label>`;
  if(f.type==="sel")return `<label>${f.l}<select data-i="${i}">${f.o.map(o=>`<option ${o==f.v?"selected":""}>${o}</option>`).join("")}</select></label>`;
  if(f.type==="img")return `<label>${f.l}</label><div class="im"><img id="pv${i}" src="${v}" alt=""><input type="file" accept="image/*" data-up="${i}"></div><input type="hidden" data-i="${i}" value="${v}">`;
  if(f.type==="mf")return `<label>${f.l}</label><div class="im"><input type="file" accept="image/*,application/pdf" data-upm="${i}"><span id="fm${i}" style="font-size:13px;color:var(--mut)">${v?"تم رفع ملف سابقًا":""}</span></div><input type="hidden" data-i="${i}" value="${v}">`;
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
async function fetchProductImg(link){
  const y=yt(link);if(y)return y;                                   // يوتيوب: الصورة جاهزة بدون سيرفر
  const {data:{session}}=await sb.auth.getSession();
  const r=await fetch("/api/og",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+(session?session.access_token:"")},body:JSON.stringify({url:link})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok||!j.ok)throw new Error(j.error||"تعذر جلب الصورة");
  if(j.data){const b=await (await fetch(j.data)).blob();return upl(new File([b],"p.jpg",{type:b.type||"image/jpeg"}))}   // نسخة دائمة في تخزينك
  return j.image;
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
  PW=Date.now();
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
async function callClients(body){
  const {data:{session}}=await sb.auth.getSession();
  const r=await fetch("/api/clients",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||("خطأ "+r.status));
  return j;
}
function addClient(){
  modal("إضافة عميل جديد",[{k:"name",l:"الاسم",v:""},{k:"email",l:"الإيميل",v:"",type:"email",dir:"ltr"},{k:"password",l:"كلمة المرور (٦ أحرف على الأقل)",v:"",dir:"ltr"},{k:"phone",l:"رقم الموبايل (اختياري)",v:"",dir:"ltr"}],async v=>{
    try{await callClients({action:"create",name:v.name,email:v.email,password:v.password,phone:v.phone});toast("تم إنشاء الحساب. ابعت الإيميل وكلمة المرور للعميل");clients();return true}catch(e){toast(e.message);return false}
  });
}
function setPass(id){
  modal("تغيير كلمة مرور العميل",[{k:"password",l:"كلمة المرور الجديدة (٦ أحرف على الأقل)",v:"",dir:"ltr"}],async v=>{
    try{await callClients({action:"password",id,password:v.password});toast("تم تغيير كلمة المرور");return true}catch(e){toast(e.message);return false}
  });
}
function modal(title,fields,onSave,onDel,setup){
  const m=document.createElement("div");m.className="md";
  m.innerHTML=`<div class="sh"><h3>${title}</h3>${fields.map(fld).join("")}<button class="btn" id="mk">حفظ</button>${onDel?'<button class="btn o dl" id="mx">حذف</button>':""}<button class="btn o" id="mc">إلغاء</button></div>`;
  document.body.appendChild(m);if(setup)setup(m);
  const close=()=>m.remove(),get=()=>{const o={};fields.forEach((f,i)=>o[f.k]=m.querySelector(`[data-i="${i}"]`).value);return o};
  m.onclick=e=>{if(e.target===m)close()};
  m.querySelectorAll("[data-up]").forEach(inp=>inp.onchange=async()=>{
    const i=inp.dataset.up,f=inp.files[0];if(!f)return;
    toast("جاري رفع الصورة...");
    try{const u=await upl(f),hi=m.querySelector(`[data-i="${i}"]`);hi.value=u;hi.dataset.auto="";m.querySelector("#pv"+i).src=u;toast("تم رفع الصورة")}catch(e){toast("تعذر رفع الصورة")}
  });
  m.querySelectorAll("[data-upf]").forEach(inp=>inp.onchange=async()=>{
    const i=inp.dataset.upf,f=inp.files[0];if(!f)return;
    toast("جاري رفع الملف...");
    try{const p=await uplDoc(f);m.querySelector(`[data-i="${i}"]`).value=p;m.querySelector("#fn"+i).textContent=f.name;toast("تم رفع الملف")}catch(e){toast("تعذر رفع الملف")}
  });
  m.querySelectorAll("[data-upm]").forEach(inp=>inp.onchange=async()=>{
    const i=inp.dataset.upm,f=inp.files[0];if(!f)return;
    toast("جاري رفع الملف...");
    try{const p=await uplMeas(f);m.querySelector(`[data-i="${i}"]`).value=p;m.querySelector("#fm"+i).textContent=f.name;toast("تم رفع الملف")}catch(e){toast("تعذر رفع الملف")}
  });
  m.querySelector("#mc").onclick=close;
  m.querySelector("#mk").onclick=async()=>{const b=m.querySelector("#mk");b.disabled=true;b.textContent="جاري المعالجة...";const ok=await onSave(get());b.disabled=false;b.textContent="حفظ";if(ok!==false)close()};
  if(onDel)m.querySelector("#mx").onclick=async()=>{if(confirm("متأكد من الحذف؟")){await onDel();close()}};
}
async function savePD(){
  PW=Date.now();
  const {error}=await sb.from("programs").update({data:P.data}).eq("id",P.id);
  if(error){toast("تعذر الحفظ");return false}
  toast("تم الحفظ");route();return true;
}
const TAGS={"جهاز":"t1","دامبل":"t2","بار":"t3","وزن حر":"t4","كابل":"t5","بدون أدوات":"t4"};
function editEx(i,j){
  const s=P.data.sessions[i],e=j<0?{n:"",tag:"جهاز",url:"",img:""}:s.ex[j];
  modal(j<0?"إضافة تمرين":"تعديل التمرين",[{k:"n",l:"اسم التمرين",v:e.n},{k:"tag",l:"الأداة",type:"sel",o:Object.keys(TAGS),v:e.tag},{k:"url",l:"لينك فيديو يوتيوب",v:e.url,dir:"ltr"},{k:"img",l:"صورة (اختياري، وإلا تظهر صورة الفيديو)",type:"img",v:e.img},{k:"w1",l:"أوزان الأسبوع الأول (كجم) لكل مجموعة، مثل: 10 11 11 — والأسابيع الباقية بتتحسب تلقائيًا",v:(e.w1||[]).join(" "),dir:"ltr"},...[2,3,4,5].filter(n=>n<=Math.max(4,(P.data.weeks||[]).length)).map(n=>({k:"w"+n,l:`تعديل يدوي لأوزان الأسبوع ${n} (فاضي = حساب تلقائي)`,v:((e.wo||{})[n]||[]).join(" "),dir:"ltr"}))],
    async v=>{if(!v.n.trim()){toast("اكتب اسم التمرين");return false}
      const o={n:v.n.trim(),tag:v.tag,cls:TAGS[v.tag]||"t4",url:v.url.trim(),img:v.img};const w1=numsD(v.w1);if(w1.length)o.w1=w1;const wo={};[2,3,4,5].forEach(n=>{if(v["w"+n]!==undefined){const a=numsD(v["w"+n]);if(a.length)wo[n]=a}});if(Object.keys(wo).length)o.wo=wo;
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
    async v=>{const o=normOpt(v.o);if(!o){toast("اكتب الخيار");return false}if(k<0)M.opts.push(o);else M.opts[k]=o;return savePD()},
    k<0?null:async()=>{M.opts.splice(k,1);await savePD()});
}
function editNote(m){const M=P.data.meals[m];modal("ملاحظة الوجبة",[{k:"n",l:"الملاحظة (اتركها فاضية لإخفائها)",type:"area",v:M.note}],async v=>{M.note=v.n.trim();return savePD()})}
function editSup(i){
  const e=i<0?{n:"",en:"",how:"",warn:"",link:"",img:""}:P.data.supp[i];
  modal(i<0?"إضافة مكمل / توصية":"تعديل المكمل",[{k:"n",l:"الاسم",v:e.n},{k:"en",l:"الاسم بالإنجليزي (اختياري)",v:e.en,dir:"ltr"},{k:"how",l:"طريقة الاستخدام",type:"area",v:e.how},{k:"warn",l:"تنبيه (اختياري)",v:e.warn},{k:"link",l:"لينك الشراء أو الفيديو (اختياري)",v:e.link,dir:"ltr"},{k:"ll",l:"نص زرار اللينك (مثال: عرض على iHerb)",v:e.ll||""},{k:"badge",l:"شارة (مثال: حتى النفاذ، اختياري)",v:e.badge||""},{k:"img",l:"صورة المنتج",type:"img",v:e.img}],
    async v=>{if(!v.n.trim()){toast("اكتب الاسم");return false}
      const M=document.querySelector(".md");if(M&&M._pend){await M._pend;v.img=M.querySelector('[data-i="7"]').value}   // لو الجلب شغال دلوقتي نستناه بدل ما نكرره
      if(!v.img&&v.link.trim()){try{v.img=await fetchProductImg(v.link.trim())}catch(e){toast("اتحفظ من غير صورة: "+(e.message||"تعذر جلبها"))}}
      const o={n:v.n.trim(),en:v.en.trim(),how:v.how.trim(),warn:v.warn.trim(),link:v.link.trim(),ll:v.ll.trim(),badge:v.badge.trim(),img:v.img};
      if(i<0)P.data.supp.push(o);else P.data.supp[i]=o;return savePD()},
    i<0?null:async()=>{P.data.supp.splice(i,1);await savePD()},
    m=>{
      const L=m.querySelector('[data-i="4"]'),IM=m.querySelector('[data-i="7"]'),pv=m.querySelector("#pv7");
      const st=document.createElement("div");st.className="sn";L.closest("label").after(st);
      let last="";const clr=()=>{if(IM.dataset.auto==="1"){IM.value="";IM.dataset.auto="";pv.removeAttribute("src")}};
      L.addEventListener("change",()=>{
        const u=L.value.trim();
        if(IM.value&&IM.dataset.auto!=="1")return;               // في صورة مرفوعة يدويًا: ما نكتبش فوقها
        if(!u){last="";clr();st.textContent="";return}
        if(u===last)return;                                       // نفس اللينك اتجلبت صورته خلاص
        last=u;st.textContent="جاري جلب صورة المنتج من اللينك...";
        m._pend=(async()=>{
          try{const r=await fetchProductImg(u);if(L.value.trim()!==u)return;IM.value=r;IM.dataset.auto="1";pv.src=r;st.textContent="✓ تم جلب صورة المنتج تلقائيًا"}
          catch(e){last="";clr();st.textContent="تعذر جلب الصورة تلقائيًا ("+(e.message||"")+"). ارفعها يدويًا من الأسفل."}
        })();
      });
    });
}
function editInfo(){
  const d=P.data,f=d.info,e=d.energy;
  const wk=(d.weeks||[]).map(r=>r.join("-")).join("\n"),ex=(e.exch||[]).map(x=>x[0]+" "+x[1]).join(" | ");
  const T=(k,l,v,o)=>Object.assign({k,l,v:v??""},o||{});
  modal("بيانات العميل والبرنامج",[T("brand","اسم البرنامج (يظهر كبيرًا)",d.brand),T("sub","وصف البرنامج",d.sub),T("sex","النوع",f.sex),T("age","العمر",f.age),T("weight","الوزن",f.weight),T("height","الطول",f.height),T("start","تاريخ البداية",f.start),T("end","تاريخ النهاية",f.end),T("days","مدة البرنامج (أيام)",f.days,{type:"number"}),T("minutes","التمرين أسبوعيًا",f.minutes),T("so2","الأكسجين",f.so2),T("rs","التنفس",f.rs),T("pulse","النبض",f.pulse),T("bp","الضغط",f.bp),T("bmr","معدل الحرق الأساسي",e.bmr),T("act","معامل النشاط",e.act),T("tdee","إجمالي الطاقة",e.tdee),T("plan","سعرات الخطة",e.plan),T("water","الماء",e.water),T("ptn","البروتين",e.ptn),T("cho","الكربوهيدرات",e.cho),T("exch","التبادلات الغذائية (افصل بـ | مثال: 9 بروتين | 4 نشويات)",ex,{type:"area"}),T("rest","الراحة بين المجموعات (ثانية)",d.rest,{type:"number"}),T("wk","تدرّج التكرارات: سطر لكل أسبوع مثل 10-10-10 (فاضي = تكرارات ثابتة)",wk,{type:"area"}),T("reps","التكرارات الثابتة مثل 12-10-10",(d.reps||[]).join("-")),T("wpct","زيادة الوزن (٪) كل ما تقل التكرارات عن الأسبوع السابق",d.wpct??5,{type:"number"}),T("wsnap","تقريب الأوزان لأقرب (كجم) — الافتراضي 0.5، و0 = حساب دقيق",d.wsnap??0.5,{type:"number"})],
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
      d.wpct=v.wpct===""||isNaN(+v.wpct)?5:+v.wpct;delete d.wstep;delete d.wround;d.wsnap=v.wsnap===""||isNaN(+v.wsnap)?0.5:Math.max(0,+v.wsnap);
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
  const base=BASE();
  modal("إنشاء أول برنامج للعميل",[{k:"d",l:"تاريخ البداية",type:"date",v:TODAY},{k:"t",l:"عنوان البرنامج",v:""}],async v=>{
    const {data,error}=await sb.from("programs").insert({client_id:CID(),title:v.t.trim()||("برنامج "+v.d),month_start:v.d,data:base}).select().single();
    if(error){toast("تعذر الإنشاء");return false}
    PROGS=[data];PI=0;P=data;route();
  });
}


/* ===== نسخ وتصدير الأقسام بين العملاء ===== */
const clone=x=>JSON.parse(JSON.stringify(x));
const BASE=()=>({info:{age:"",weight:"",height:"",start:"",end:"",days:30,minutes:""},reps:[12,10,10],energy:{bmr:"",act:"",tdee:"",plan:"",water:"",exch:[]},sessions:[],meals:{b:{t:"الفطار",note:"",opts:[]},l:{t:"الغداء",note:"",opts:[]},d:{t:"العشاء",note:"",opts:[]}},supp:[]});
const putBlocks=(s,d,sec)=>{d.blocks=d.blocks||{};const b=(s.blocks||{})[sec];if(b&&b.length)d.blocks[sec]=clone(b);else delete d.blocks[sec]};
const SEC={
  train:{l:"التدريب: الجلسات والتمارين وتدرّج التكرارات",cp(s,d){d.sessions=clone(s.sessions||[]);["reps","weeks","rest"].forEach(k=>{if(s[k]!==undefined&&s[k]!==null)d[k]=clone(s[k]);else delete d[k]});if(!d.weeks&&!d.reps)d.reps=[12,10,10];putBlocks(s,d,"train")}},
  food:{l:"التغذية: الوجبات والخيارات",cp(s,d){d.meals=clone(s.meals||{});putBlocks(s,d,"food")}},
  energy:{l:"السعرات والتبادلات الغذائية (بدون بيانات العميل الشخصية)",cp(s,d){d.energy=d.energy||{};const e=s.energy||{};["plan","ptn","cho"].forEach(k=>d.energy[k]=e[k]??"");d.energy.exch=clone(e.exch||[])}},
  supp:{l:"المكملات والتوصيات",cp(s,d){d.supp=clone(s.supp||[]);putBlocks(s,d,"supp")}}
};
const ITEM={
  sess:(it,d)=>{d.sessions=d.sessions||[];d.sessions.push(clone(it))},
  meal:(it,d)=>{d.meals=d.meals||{};let k=Object.keys(d.meals).find(x=>d.meals[x].t===it.t);if(!k)k="m"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);d.meals[k]=clone(it)},
  supp:(it,d)=>{d.supp=d.supp||[];d.supp.push(clone(it))}
};
async function targetProg(cid){
  const {data,error}=await sb.from("programs").select("*").eq("client_id",cid).order("month_start",{ascending:false});
  if(error)throw error;const a=data||[];return a.find(p=>p.month_start<=TODAY)||a[0]||null;
}
async function pushTo(ids,fn,title,onProg){
  let ok=0,created=0,fail=0;
  for(let i=0;i<ids.length;i++){
    onProg(i+1,ids.length);
    try{
      const t=await targetProg(ids[i]);
      if(t){const d=clone(t.data);fn(d);const {error}=await sb.from("programs").update({data:d}).eq("id",t.id);if(error)throw error}
      else{const d=BASE();fn(d);const {error}=await sb.from("programs").insert({client_id:ids[i],title:title||("برنامج "+TODAY),month_start:TODAY,data:d});if(error)throw error;created++}
      ok++;
    }catch(e){fail++}
  }
  return {ok,created,fail};
}
async function clientDlg(o){
  let list=[];
  try{const {data,error}=await sb.from("profiles").select("id,full_name").eq("role","client").order("full_name");if(error)throw error;list=(data||[]).filter(x=>x.id!==CID())}catch(e){return toast("تعذر تحميل العملاء")}
  if(!list.length)return toast("لا يوجد عملاء آخرين");
  const pull=o.mode==="pull",src=pull||!P?null:clone(P.data),ttl=P?P.title:"";
  const m=document.createElement("div");m.className="md";
  const secH=o.item?"":`<div class="lbl">${pull?"ماذا تسحب؟ (يحل محل نفس القسم عندك)":"ماذا تنسخ؟ (يحل محل نفس القسم عند العميل)"}</div>`+Object.keys(SEC).map(k=>`<label class="ck"><input type="checkbox" data-s="${k}" ${(o.on||[]).includes(k)?"checked":""}><span>${SEC[k].l}</span></label>`).join("");
  const note=pull?"البيانات الشخصية للعميل (العمر والوزن والسعرات) ما بتتغيرش.":o.item?"هيتضاف للعميل داخل برنامجه الحالي.":"القسم بيحل محل نفس القسم في برنامج العميل الحالي، وبيانات العميل الشخصية ما بتتغيرش. لو العميل ملوش برنامج هيتعمله برنامج مسودة.";
  m.innerHTML=`<div class="sh"><h3>${o.title}</h3>${secH}<div class="lbl" style="margin-top:14px">${pull?"من أي عميل؟":"إلى أي عملاء؟"}</div><input id="cq" placeholder="بحث بالاسم"><div class="ckl">${list.map(c=>`<label class="ck" data-n="${esc(c.full_name||"")}"><input type="${pull?"radio":"checkbox"}" name="cs" data-c="${c.id}"><span>${esc(c.full_name||"بدون اسم")}</span></label>`).join("")}</div>${pull?"":'<button class="btn o" id="ca">تحديد الكل / إلغاء التحديد</button>'}<p class="sn">${note}</p><button class="btn" id="mk">${pull?"سحب":"نسخ"}</button><button class="btn o" id="mc">إلغاء</button></div>`;
  document.body.appendChild(m);
  const q=s=>[...m.querySelectorAll(s)];
  m.querySelector("#cq").oninput=e=>{const v=e.target.value.trim();q(".ckl .ck").forEach(l=>l.style.display=l.dataset.n.includes(v)?"":"none")};
  const ca=m.querySelector("#ca");if(ca)ca.onclick=()=>{const vis=q(".ckl .ck").filter(l=>l.style.display!=="none").map(l=>l.querySelector("input"));const all=vis.every(i=>i.checked);vis.forEach(i=>i.checked=!all)};
  m.querySelector("#mc").onclick=()=>m.remove();
  m.onclick=e=>{if(e.target===m)m.remove()};
  m.querySelector("#mk").onclick=async()=>{
    const ids=q("[data-c]:checked").map(i=>i.dataset.c),ks=q("[data-s]:checked").map(i=>i.dataset.s),b=m.querySelector("#mk"),lab=b.textContent;
    if(!ids.length)return toast(pull?"اختر العميل":"اختر عميل واحد على الأقل");
    if(!o.item&&!ks.length)return toast("اختر قسم واحد على الأقل");
    b.disabled=true;
    try{
      if(pull){
        const t=await targetProg(ids[0]);
        if(!t){toast("العميل ده ملوش برنامج");b.disabled=false;return}
        if(!P){const {data,error}=await sb.from("programs").insert({client_id:CID(),title:t.title||("برنامج "+TODAY),month_start:TODAY,data:BASE()}).select().single();if(error)throw error;PROGS=[data];PI=0;P=data}
        ks.forEach(k=>SEC[k].cp(t.data,P.data));m.remove();await savePD();return;
      }
      const fn=o.item?(d=>ITEM[o.item.type](clone(o.item.obj),d)):(d=>ks.forEach(k=>SEC[k].cp(src,d)));
      const r=await pushTo(ids,fn,ttl,(i,n)=>b.textContent=`جاري النسخ ${ar(i)} / ${ar(n)}...`);
      m.remove();
      toast(`تم النسخ لـ ${ar(r.ok)} عميل${r.created?` (منهم ${ar(r.created)} برنامج جديد كمسودة)`:""}${r.fail?` · فشل ${ar(r.fail)}`:""}`);
    }catch(e){b.disabled=false;b.textContent=lab;toast("تعذر التنفيذ: "+(e.message||""))}
  };
}
const shareSec=(...on)=>clientDlg({title:"نسخ لعملاء آخرين",on,mode:"push"});
const pullProg=()=>clientDlg({title:"سحب برنامج من عميل آخر",on:["train","food","supp"],mode:"pull"});
const shareSess=i=>clientDlg({title:"نسخ هذه الجلسة لعملاء آخرين",item:{type:"sess",obj:P.data.sessions[i]},mode:"push"});
const shareMeal=k=>clientDlg({title:"نسخ هذه الوجبة لعملاء آخرين",item:{type:"meal",obj:P.data.meals[k]},mode:"push"});
const shareSupp=i=>clientDlg({title:"نسخ هذا المكمل لعملاء آخرين",item:{type:"supp",obj:P.data.supp[i]},mode:"push"});

/* ===== إدخال الوجبات بسرعة (لصق كل الخيارات مرة واحدة) ===== */
const normOpt=t=>String(t).split(/\s*[+＋]\s*/).map(x=>x.trim()).filter(Boolean).join(" + ");
function parseOpts(t){
  const out=[];let cur="";
  String(t).replace(/\r/g,"").split("\n").map(x=>x.trim()).forEach(l=>{
    if(!l){if(cur)out.push(cur);cur="";return}
    if(cur&&(/[+＋]$/.test(cur)||/^[+＋]/.test(l)))cur+=" "+l;else{if(cur)out.push(cur);cur=l}
  });
  if(cur)out.push(cur);
  return out.map(normOpt).filter(Boolean);
}
function editOpts(m){
  const M=P.data.meals[m];
  modal("كل خيارات "+M.t+" مرة واحدة",[{k:"o",l:"اكتب كل خيار في سطر، وافصل بين مكونات الخيار بعلامة +  (تقدر تلصق كل الخيارات مرة واحدة، وتعدّل أو تمسح أي سطر)",type:"area",big:true,v:M.opts.join("\n")}],
    async v=>{M.opts=parseOpts(v.o);return savePD()});
}
function editAllMeals(){
  const M=P.data.meals,txt=Object.keys(M).map(k=>"# "+M[k].t+"\n"+(M[k].note?"ملاحظة: "+M[k].note+"\n":"")+M[k].opts.join("\n")).join("\n\n");
  modal("كل الوجبات في نص واحد",[{k:"t",l:"السطر اللي يبدأ بـ # هو اسم الوجبة. السطر اللي يبدأ بـ «ملاحظة:» هو ملاحظة الوجبة. وتحته كل خيار في سطر ومكوناته بينها +",type:"area",big:true,v:txt}],async v=>{
    const out={},old=Object.keys(M),used=new Set();let cur=null,buf=[],n=0;
    const flush=()=>{if(cur)cur.opts=parseOpts(buf.join("\n"));buf=[]};
    v.t.replace(/\r/g,"").split("\n").forEach(raw=>{
      const l=raw.trim();
      if(/^#/.test(l)){flush();const t=l.replace(/^#+/,"").trim()||"وجبة";let k=old.find(x=>!used.has(x)&&M[x].t===t);if(!k)k="m"+Date.now().toString(36)+(n++);used.add(k);cur={t,note:"",opts:[]};out[k]=cur}
      else if(cur&&/^(ملاحظة|note)\s*[:：]/i.test(l))cur.note=l.replace(/^[^:：]*[:：]/,"").trim();
      else if(cur)buf.push(raw);
    });
    flush();
    if(!Object.keys(out).length){toast("ابدأ كل وجبة بسطر فيه # واسم الوجبة");return false}
    P.data.meals=out;ft=Object.keys(out)[0];return savePD();
  });
}

/* ===== صفحات العميل ===== */
function empty(){
  hd("برنامجك","Training Nutrition Hub");
  $("#app").innerHTML=EDIT()?`<div class="card" style="text-align:center"><b>لا يوجد برنامج لهذا العميل</b></div>${addb("importProg()","استيراد برنامج من ملف PDF")}${addb("pullProg()","سحب برنامج من عميل آخر")}${addb("newProgram()","إنشاء برنامج فارغ")}`:`<div class="card" style="text-align:center"><b>لسه مفيش برنامج متاح لحسابك</b><p style="color:var(--mut)">هيظهر هنا فور ما الدكتور يضيفه.</p></div><button class="btn o" onclick="out()">تسجيل الخروج</button>`;
}
function home(){
  const dt=P.data,inf=dt.info,n=dt.sessions.reduce((a,s)=>a+s.ex.length,0);
  hd("الرئيسية","Training Nutrition Hub");
  let h=`<div class="card brand"><img src="img/logo.png" alt=""><small>مدربك وأخصائي التغذية</small><h1>الدكتور محمود جمال قطب</h1><div class="en">DR. MAHMOUD GAMAL</div><div class="tg">تخلّص من أمراضك</div></div>`;
  if(EDIT())h+=pubCard();
  h+=pendBanner();
  h+=pushCard();
  const dn=dayNo(),T=inf.days||30;
  h+=`<div class="card"><div class="hi"><b>أهلاً ${esc(NAME())}</b><span style="color:var(--mut);font-size:13px">${esc(P.title||"")}</span></div><div style="margin-top:8px;font-weight:700">${dn?`اليوم ${ar(dn)} من ${ar(T)}`:"البرنامج لسه ما بدأش"}</div><div class="bar"><i style="width:${dn/T*100}%"></i></div></div>`;
  if(PROGS.length>1)h+=`<select onchange="setProg(this.value)">${PROGS.map((p,i)=>`<option value="${i}" ${i==PI?"selected":""}>${esc(p.title||p.month_start)}${EDIT()&&!p.published?" (مسودة)":""}</option>`).join("")}</select>`;
  h+=`<a class="card sec" href="#train"><div class="no">٠١</div><div><h3>التدريب</h3><p>${ar(dt.sessions.length)} جلسات · ${ar(n)} تمرين بفيديوهات الشرح</p></div><div class="go">‹</div></a>`;
  h+=`<a class="card sec" href="#food"><div class="no">٠٢</div><div><h3>التغذية</h3><p>خطة الوجبات والتبادلات الغذائية</p></div><div class="go">‹</div></a>`;
  h+=`<a class="card sec" href="#supp"><div class="no">٠٣</div><div><h3>التوصيات والمكملات الغذائية</h3><p>${ar(dt.supp.length)} توصيات</p></div><div class="go">‹</div></a>`;
  h+=measCard();
  h+=`<div class="card pg"><div class="sub">${esc(dt.sub||"")}</div><div class="big">${esc(dt.brand||P.title||"")}</div><div class="mem">${[["الاسم",NAME()||"—"],["العمر",inf.age],["الوزن",inf.weight],["الطول",inf.height],["البداية",inf.start],["النهاية",inf.end],["المدة",inf.days?ar(inf.days)+" يومًا":""],["التمرين",inf.minutes]].map(x=>`<div><span>${x[0]}</span><b>${esc(x[1])||"—"}</b></div>`).join("")}</div>${ed("editInfo()","تعديل بيانات العميل والبرنامج")}</div>`;
  if(EDIT()){
    h+=cheerCard();
    const days=Object.keys(LOGS).sort().reverse().slice(0,7);
    h+=`<div class="card"><b>نشاط العميل (آخر ٧ أيام)</b>${days.length?days.map(d=>{const g=LOGS[d];return `<div class="act"><span>${ar(d.slice(5).replace("-","/"))}</span><span>${ar(Object.keys(g.d||{}).length)} تمارين · ${ar(Object.keys(g.m||{}).length)} وجبات · ${ar(Object.keys(g.s||{}).length)} مكملات</span></div>`}).join(""):'<p style="color:var(--mut);margin:6px 0 0">لا يوجد نشاط مسجل بعد</p>'}</div>${addb("newMonth()","برنامج شهر جديد (نسخ من الحالي)")}${addb("shareSec('train','food','supp')","نسخ هذا البرنامج لعملاء آخرين")}${addb("pullProg()","سحب برنامج من عميل آخر")}${addb("importProg()","استيراد برنامج من ملف PDF")}<button class="btn o" onclick="sendNote('${VIEW.id}')">✉ إرسال إشعار للعميل</button>`;
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
  h+=addb("shareSec('train')","نسخ التدريب كله لعملاء آخرين");
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
    const k=`s${i}e${j}`,w=lg.w[k]||[],PW=planW(e,WK()||1),PV=PW&&(WK()||1)>1?planW(e,(WK()||1)-1):null;
    h+=`<div class="card ex ${lg.d[k]?"done":""}" id="c-${k}">${vid(e.url,e.n,"",e.img)}<div class="top"><div class="n">${ar(j+1)}</div><h3>${esc(e.n)}</h3><span class="pill ${e.cls||"t1"}">${esc(e.tag)}</span></div>${ed(`editEx(${i},${j})`)}${P.data.rest?`<div class="rest">راحة <b>${ar(P.data.rest)}</b> ثانية</div>`:""}<div class="cap">${WK()?`التكرارات · الأسبوع ${ar(WK())} · `:""}الوزن (كجم)${PW?" · المستهدف بالأخضر وسجّل وزنك الفعلي تحته":""}</div><div class="sets">${R.map((r,x)=>`<div><div class="rp">${ar(r)}</div>${PW?(PW[x]?`<div class="tw">${fmtW(PW[x])}<small>كجم</small>${PV&&PW[x]>PV[x]?"<em>▲</em>":""}</div>`:`<div class="tw em">—</div>`):""}<input type="text" inputmode="decimal" value="${esc(w[x]||"")}" placeholder="${PW&&PW[x]?"الفعلي":(lastW(k,x)?ar(lastW(k,x)):"")}" onchange="setW('${k}',${x},this.value)"></div>`).join("")}</div><button class="chk" onclick="tgl('${k}')">${lg.d[k]?"✓ تم":"تم التمرين"}</button></div>`;
  });
  h+=addb(`editEx(${i},-1)`,"إضافة تمرين");
  if(s.ab){h+=`<div class="card dk"><div class="lbl" style="color:var(--or)">البطن · كور</div><b style="font-size:17px">${esc(s.ab.t)}</b>${ed(`editAb(${i})`)}</div><div style="display:grid;gap:10px;margin-bottom:12px">${s.ab.vids.map((v,x)=>`<div>${vid(v.url,"تمرين بطن "+(x+1),"",v.img)}${ed(`editAbv(${i},${x})`)}</div>`).join("")}</div>`}
  h+=`<div class="card"><div class="lbl" style="color:var(--or)">ملاحظات وتقدم</div><textarea class="nb" onchange="setNote(${i},this.value)" placeholder="اكتب ملاحظاتك هنا">${esc((lg.n||{})[i]||"")}</textarea></div>`;
  h+=EDIT()?(s.ab?"":addb(`editAb(${i})`,"إضافة قسم البطن"))+addb(`editAbv(${i},-1)`,"إضافة فيديو بطن")+addb(`shareSess(${i})`,"نسخ هذه الجلسة لعملاء آخرين"):"";
  $("#app").innerHTML=h;
}
function setW(k,x,v){const l=L();l.w[k]=l.w[k]||["","",""];l.w[k][x]=v.trim();save()}
function setNote(i,v){const l=L();l.n=l.n||{};l.n[i]=v.trim();save()}
function tgl(k){const l=L(),c=$("#c-"+k);if(l.d[k]){delete l.d[k];c.classList.remove("done");c.querySelector(".chk").textContent="تم التمرين"}else{l.d[k]=1;c.classList.add("done");c.querySelector(".chk").textContent="✓ تم"}save();pushTick(k)}
function food(){
  const dt=P.data,E=dt.energy||{},fi=dt.info||{};hd("التغذية","القسم الثاني");
  const IC=(l,v)=>`<div class="ic"><span>${l}</span><b class="${v?"":"em"}">${esc(v)||"—"}</b></div>`;
  const sx=(n,t)=>`<div class="sx"><b>${n}</b><span>${t}</span><i></i></div>`;
  const vit=[["الاسم",NAME()],["التاريخ",fi.start],["النوع",fi.sex],["العمر",fi.age],["الطول",fi.height],["الوزن",fi.weight],["الأكسجين",fi.so2],["التنفس",fi.rs],["النبض",fi.pulse],["الضغط",fi.bp]];
  let h=`<div class="icg">${(EDIT()?vit:vit.filter(x=>x[1])).map(x=>IC(x[0],x[1])).join("")}</div>`;
  h+=sx("٠١","الطاقة اليومية");
  h+=`<div class="egy"><div><span>معدل الحرق</span><b>${esc(E.bmr)||"—"}</b><em>سعرة</em></div><u>×</u><div><span>النشاط</span><b>${esc(E.act)||"—"}</b><em>معامل</em></div><u>=</u><div><span>الإجمالي</span><b>${esc(E.tdee)||"—"}</b><em>سعرة</em></div><u>←</u><div class="p"><span>سعرات الخطة</span><b>${esc(E.plan)||"—"}</b><em>سعرة / يوم</em></div></div>`;
  h+=`<div class="icg c2">${IC("الماء",E.water)}${IC("التمرين",fi.minutes)}${E.ptn||EDIT()?IC("البروتين",E.ptn):""}${E.cho||EDIT()?IC("الكربوهيدرات",E.cho):""}</div>${ed("editInfo()","تعديل الطاقة والماء")}`;
  if(E.exch&&E.exch.length)h+=sx("٠٢","التبادلات الغذائية اليومية")+`<div class="ex6">${E.exch.map(x=>`<div><b>${ar(x[0])}</b><span>${x[1]}</span></div>`).join("")}</div>`;
  const keys=Object.keys(dt.meals);if(!dt.meals[ft])ft=keys[0];
  h+=sx("٠٣","الوجبات")+`<div class="pills">${keys.map(m=>`<button class="${m==ft?"on":""}" onclick="ft='${m}';food()">${esc(dt.meals[m].t)}</button>`).join("")}</div>`;
  const M=dt.meals[ft],sel=L().m[ft];
  h+=`<div class="mh"><b>يمكنك اختيار ما يناسبك أدناه</b>${E.plan?`<small>${esc(E.plan)} سعرة / يوم</small>`:""}</div>`;
  if(M.note)h+=`<div class="note"><span class="lbl">ملاحظة</span> ${esc(M.note)}</div>`;
  M.opts.forEach((o,i)=>{h+=`<div class="mo ${sel===i?"sel":""}" onclick="pick(${i})"><div class="mn">${sel===i?"✓":ar(i+1)}</div><div class="mx"><div class="mc">${o.split(/\s*\+\s*/).filter(Boolean).map(x=>`<i>${esc(x)}</i>`).join("<b>+</b>")}</div>${ed(`editOpt('${ft}',${i})`)}</div></div>`});
  if(!M.opts.length&&!EDIT())h+=`<div class="card" style="text-align:center;color:var(--mut)">لسه مفيش خيارات لهذه الوجبة</div>`;
  h+=addb(`editOpt('${ft}',-1)`,"إضافة خيار")+addb(`editOpts('${ft}')`,"كل خيارات هذه الوجبة مرة واحدة (لصق / تعديل)")+addb("editAllMeals()","كل الوجبات في نص واحد (لصق / تعديل)");
  h+=ed(`editMeal('${ft}')`,"تعديل اسم الوجبة / حذفها")+ed(`editNote('${ft}')`,"تعديل الملاحظة")+ed(`shareMeal('${ft}')`,"نسخ هذه الوجبة لعملاء")+addb("editMeal('')","إضافة وجبة");
  h+=addb("shareSec('food','energy')","نسخ التغذية كلها لعملاء آخرين");
  h+=blocksBlock("food");
  h+=sx("٠٤","المرجع")+REF;
  h+=filesBlock("food");
  $("#app").innerHTML=h;
}
function pick(i){const l=L();if(l.m[ft]===i)delete l.m[ft];else l.m[ft]=i;save();food()}
function supp(){
  hd("التوصيات والمكملات","القسم الثالث");const l=L();
  $("#app").innerHTML=P.data.supp.map((s,i)=>`<div class="card sp ${l.s[i]?"done":""}" id="p${i}"><div class="spi">${s.img||yt(s.link)?`<img src="${esc(s.img||yt(s.link))}" alt="" referrerpolicy="no-referrer">`:'<div class="ph">صورة</div>'}</div><div class="spb"><div class="lbl or">SUPPLEMENT · توصية</div><h3>${esc(s.n)}</h3>${s.en?`<div class="e" dir="ltr">${esc(s.en)}</div>`:""}${s.how?`<div class="how">${esc(s.how).replace(/\n/g,"<br>")}</div>`:""}${s.badge?`<span class="bdg">${esc(s.badge)}</span>`:""}${s.warn?`<div class="warn">${esc(s.warn)}</div>`:""}${s.link?`<a class="ih" href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.ll)||"فتح اللينك"} ↗</a>`:""}<button class="chk" onclick="tsp(${i})">${l.s[i]?"✓ تم اليوم":"تم اليوم"}</button>${ed(`editSup(${i})`)} ${ed(`shareSupp(${i})`,"نسخ لعملاء")}</div></div>`).join("")+addb("editSup(-1)","إضافة مكمل / توصية")+addb("shareSec('supp')","نسخ المكملات كلها لعملاء آخرين")+blocksBlock("supp")+filesBlock("supp");
}
function tsp(i){const l=L(),c=$("#p"+i);if(l.s[i]){delete l.s[i];c.classList.remove("done");c.querySelector(".chk").textContent="تم اليوم"}else{l.s[i]=1;c.classList.add("done");c.querySelector(".chk").textContent="✓ تم اليوم"}save()}
function notes(){
  hd("الإشعارات","رسائل من الدكتور");
  $("#app").innerHTML=pushCard()+(NOTIFS.length?NOTIFS.map(n=>`<div class="card nt ${n.read?"":"un"}"><h3>${esc(n.title)}</h3><p style="margin:4px 0">${esc(n.body)}</p><small>${ar(new Date(n.created_at).toLocaleDateString("en-GB"))}</small></div>`).join(""):`<div class="card" style="text-align:center;color:var(--mut)">لا توجد إشعارات حتى الآن</div>`)+(EDIT()?`<button class="btn o" onclick="sendNote('${VIEW.id}')">✉ إرسال إشعار</button>`:"");
  if(!ADMIN&&NOTIFS.some(n=>!n.read)){
    sb.from("notifications").update({read:true}).eq("client_id",ME.id).eq("read",false).then(()=>{NOTIFS.forEach(n=>n.read=true);badge()});
  }
}
/* ===== القياسات و InBody (وزن · نتيجة InBody · طلب قياس من المدرب) ===== */
let MEAS=[],REQS=[],MOK=true,MURL={};
async function loadMeas(cid){
  try{
    const [a,b]=await Promise.all([
      sb.from("measurements").select("*").eq("client_id",cid).order("taken_on",{ascending:false}).order("created_at",{ascending:false}),
      sb.from("measure_requests").select("*").eq("client_id",cid).order("created_at",{ascending:false}).limit(30)]);
    MOK=!a.error&&!b.error;MEAS=MOK?(a.data||[]):[];REQS=MOK?(b.data||[]):[];
  }catch(e){MOK=false;MEAS=[];REQS=[]}
  MURL={};
}
const MK=k=>k==="inbody"?"InBody":"وزن";
const dmy=d=>ar(String(d||"").split("-").reverse().join("/"));
const dlt=(c,p,good)=>{if(c==null||p==null)return"";const d=Math.round((c-p)*10)/10;if(!d)return'<small class="nt">—</small>';const cls=good==null?"nt":((d>0)===(good==="up")?"up":"dn");return`<small class="${cls}">${d>0?"▲":"▼"} ${fmtW(Math.abs(d))}</small>`};
function mchart(pts,unit,title){
  pts=pts.slice(-12);if(pts.length<2)return"";
  const W=300,H=120,p=16,mn=Math.min(...pts.map(x=>x.v)),mx=Math.max(...pts.map(x=>x.v)),r=(mx-mn)||1;
  const X=i=>p+i*(W-2*p)/(pts.length-1),Y=v=>H-p-8-(v-mn)/r*(H-2*p-24);
  const path=pts.map((x,i)=>(i?"L":"M")+X(i).toFixed(1)+" "+Y(x.v).toFixed(1)).join(" ");
  const all=pts.length<=7;
  const dots=pts.map((x,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(x.v).toFixed(1)}" r="3.5" style="fill:var(--pk)"/>${all||i===0||i===pts.length-1?`<text x="${X(i).toFixed(1)}" y="${(Y(x.v)-8).toFixed(1)}" text-anchor="middle" font-size="10" style="fill:var(--ink)">${fmtW(x.v)}</text>`:""}`).join("");
  const dl2=`<text x="${p}" y="${H-2}" font-size="9" style="fill:var(--mut)">${dmy(pts[0].d)}</text><text x="${W-p}" y="${H-2}" text-anchor="end" font-size="9" style="fill:var(--mut)">${dmy(pts[pts.length-1].d)}</text>`;
  return`<div class="card"><div class="lbl">${title} (${unit})</div><svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block;direction:ltr"><path d="${path}" fill="none" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--pk)"/>${dots}${dl2}</svg></div>`;
}
async function signMeas(){
  const ps=[...new Set(MEAS.map(m=>m.file_path).filter(p=>p&&!/\.pdf$/i.test(p)&&!MURL[p]))];
  if(!ps.length)return false;
  try{const {data}=await sb.storage.from("inbody").createSignedUrls(ps,3600);let n=0;(data||[]).forEach(x=>{if(x&&x.signedUrl&&x.path){MURL[x.path]=x.signedUrl;n++}});return n>0}catch(e){return false}
}
async function openMeas(p){
  const w=window.open("","_blank");
  const {data,error}=await sb.storage.from("inbody").createSignedUrl(p,3600);
  if(error||!data){if(w)w.close();return toast("تعذر فتح الملف")}
  if(w)w.location.href=data.signedUrl;else location.href=data.signedUrl;
}
async function uplMeas(file){
  let blob=file,ext="pdf",ct="application/pdf";
  if(file.type!=="application/pdf"){
    const bm=await createImageBitmap(file),sc=Math.min(1,1800/Math.max(bm.width,bm.height));
    const cv=document.createElement("canvas");cv.width=Math.round(bm.width*sc);cv.height=Math.round(bm.height*sc);
    cv.getContext("2d").drawImage(bm,0,0,cv.width,cv.height);
    blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.86));ext="jpg";ct="image/jpeg";
  }
  const path=`${CID()}/${Date.now()}.${ext}`;
  const {error}=await sb.storage.from("inbody").upload(path,blob,{contentType:ct});
  if(error)throw error;return path;
}
function pendBanner(){
  if(EDIT()||!MOK)return"";
  return REQS.filter(r=>r.status==="pending").map(r=>`<div class="card rq"><b>📏 مطلوب منك: ${r.kind==="inbody"?"قياس InBody":"قياس الوزن"}</b>${r.note?`<p>${esc(r.note)}</p>`:'<p>الدكتور بانتظار القياس عشان يتابع تطورك.</p>'}<button class="btn" onclick="editMeas('${r.kind}',null,'${r.id}')">سجّل الآن</button></div>`).join("");
}
function measCard(){
  if(!MOK&&!EDIT())return"";
  const last=MEAS[0],pend=REQS.filter(r=>r.status==="pending").length;
  const sub=!MOK?"محتاجة تفعيل (ملف inbody.sql)":last?`آخر قياس ${dmy(last.taken_on)}${last.weight!=null?" · "+fmtW(last.weight)+" كجم":""}${EDIT()&&pend?" · ⏳ طلب منتظر":""}`:"سجّل وزنك ونتيجة InBody وتابع تطورك";
  return`<a class="card sec" href="#body"><div class="no">⚖</div><div><h3>القياسات و InBody</h3><p>${sub}</p></div><div class="go">‹</div></a>`;
}
function measPage(){
  hd("القياسات و InBody",EDIT()?"متابعة تطور العميل":"تابع تطورك","home");
  measRender();
  signMeas().then(ok=>{if(ok&&location.hash==="#body")measRender()});
}
function measRender(){
  const A=$("#app");
  if(!MOK){A.innerHTML=`<div class="card" style="text-align:center"><b>الميزة محتاجة تفعيل</b><p style="color:var(--mut)">${EDIT()?"شغّل ملف supabase/inbody.sql مرة واحدة في Supabase ← SQL Editor، ثم أعد تحميل الصفحة.":"هتتفعل قريبًا."}</p></div>`;return}
  const pend=REQS.filter(r=>r.status==="pending");
  let h=pendBanner();
  if(EDIT()){
    h+=`<div class="card"><b>طلب قياس من العميل</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button class="btn" onclick="askMeas('weight')">⚖ اطلب وزن</button><button class="btn" onclick="askMeas('inbody')">📊 اطلب InBody</button></div>${pend.map(r=>`<div class="act"><span>⏳ ${MK(r.kind)} · ${dmy(String(r.created_at).slice(0,10))}</span><button class="mb" onclick="cancelReq('${r.id}')">إلغاء الطلب</button></div>`).join("")}</div>`;
  }
  const wl=MEAS.filter(m=>m.weight!=null);
  if(MEAS.length){
    const m0=MEAS[0],o=MEAS.slice(1);
    const pw=o.find(x=>x.weight!=null),pf=o.find(x=>x.fat!=null),pm=o.find(x=>x.muscle!=null);
    const days=Math.round((new Date(TODAY)-new Date(m0.taken_on))/864e5);
    const cell=(l,v,u,d)=>v==null?"":`<div><span>${l}</span><b>${fmtW(v)}<small style="font-size:11px;color:var(--mut)"> ${u}</small></b>${d}</div>`;
    let tot="";
    if(wl.length>1){const f=wl[wl.length-1],l=wl[0],wk=Math.max(1,Math.round((new Date(l.taken_on)-new Date(f.taken_on))/6048e5)),d=Math.round((l.weight-f.weight)*10)/10;tot=`<p style="margin:10px 0 0;font-size:13.5px;color:var(--mut)">منذ أول قياس (${ar(wk)} أسبوع): <b style="color:var(--ink)">${d>0?"▲":d<0?"▼":""} ${fmtW(Math.abs(d))} كجم</b></p>`}
    h+=`<div class="card"><div class="lbl">آخر قياس · ${dmy(m0.taken_on)}</div><div class="g3">${cell("الوزن",m0.weight,"كجم",dlt(m0.weight,pw&&pw.weight,null))}${cell("نسبة الدهون",m0.fat,"٪",dlt(m0.fat,pf&&pf.fat,"down"))}${cell("الكتلة العضلية",m0.muscle,"كجم",dlt(m0.muscle,pm&&pm.muscle,"up"))}</div>${tot}<p style="margin:6px 0 0;font-size:12.5px;color:${days>=8?"#d23b5f":"var(--mut)"}">${days<=0?"قياس اليوم":`مرّ ${ar(days)} يوم على آخر قياس`}</p></div>`;
    h+=mchart(wl.slice().reverse().map(x=>({d:x.taken_on,v:x.weight})),"كجم","تطور الوزن");
    h+=mchart(MEAS.filter(x=>x.fat!=null).reverse().map(x=>({d:x.taken_on,v:x.fat})),"٪","تطور نسبة الدهون");
    h+=mchart(MEAS.filter(x=>x.muscle!=null).reverse().map(x=>({d:x.taken_on,v:x.muscle})),"كجم","تطور الكتلة العضلية");
  }else h+=`<div class="card" style="text-align:center;color:var(--mut)">لسه مفيش قياسات مسجلة</div>`;
  h+=`<button class="btn" onclick="editMeas('inbody')">+ ${EDIT()?"تسجيل InBody للعميل":"رفع نتيجة InBody"}</button><button class="btn o" onclick="editMeas('weight')">+ ${EDIT()?"تسجيل وزن للعميل":"تسجيل وزني"}</button>`;
  if(MEAS.length){
    h+=`<h2>السجل</h2><div class="card" style="padding:4px 14px">`+MEAS.map((m,i)=>{
      const o=MEAS.slice(i+1),pw=o.find(x=>x.weight!=null),pf=o.find(x=>x.fat!=null),pm=o.find(x=>x.muscle!=null);
      const pdf=m.file_path&&/\.pdf$/i.test(m.file_path),u=m.file_path&&MURL[m.file_path];
      const th=m.file_path?`<a class="mth" href="#" onclick="openMeas('${m.file_path}');return false">${pdf?"<span>PDF</span>":(u?`<img src="${esc(u)}" alt="">`:"<span>صورة</span>")}</a>`:"";
      const vals=[m.weight!=null?`الوزن <b>${fmtW(m.weight)}</b> كجم ${dlt(m.weight,pw&&pw.weight,null)}`:"",m.fat!=null?`دهون <b>${fmtW(m.fat)}</b>٪ ${dlt(m.fat,pf&&pf.fat,"down")}`:"",m.muscle!=null?`عضل <b>${fmtW(m.muscle)}</b> كجم ${dlt(m.muscle,pm&&pm.muscle,"up")}`:""].filter(Boolean);
      return`<div class="mrow">${th}<div style="flex:1;min-width:0"><div><b>${dmy(m.taken_on)}</b> <span class="mk">${MK(m.kind)}</span></div>${vals.length?`<div class="mv">${vals.join(" · ")}</div>`:""}${m.note?`<div class="mn2">${esc(m.note)}</div>`:""}</div><button class="mb" onclick="editMeas('${m.kind}','${m.id}')">تعديل</button></div>`;
    }).join("")+`</div>`;
  }
  A.innerHTML=h;
}
function editMeas(kind,id,reqId){
  const e=id?MEAS.find(x=>x.id===id):null;if(id&&!e)return;
  if(e)kind=e.kind;
  const isIn=kind==="inbody",T=(k,l,v,o)=>Object.assign({k,l,v:v??""},o||{});
  const f=[T("d","التاريخ",e?e.taken_on:TODAY,{type:"date"}),T("w","الوزن (كجم)"+(isIn?" — اختياري لو الصورة واضحة":""),e&&e.weight!=null?e.weight:"",{dir:"ltr"})];
  if(isIn)f.push(T("f","نسبة الدهون ٪ (اختياري)",e&&e.fat!=null?e.fat:"",{dir:"ltr"}),T("m","الكتلة العضلية كجم (اختياري)",e&&e.muscle!=null?e.muscle:"",{dir:"ltr"}));
  f.push(T("n","ملاحظة (اختياري)",e?e.note||"":""),T("file",isIn?"صورة أو PDF نتيجة InBody":"صورة الميزان (اختياري)",e?e.file_path||"":"",{type:"mf"}));
  modal(e?"تعديل القياس":(isIn?"رفع نتيجة InBody":"تسجيل الوزن"),f,
    async v=>{
      const w=numsD(v.w)[0],fa=numsD(v.f)[0],mu=numsD(v.m)[0];
      if(!/^\d{4}-\d{2}-\d{2}$/.test(v.d||"")){toast("اختر التاريخ");return false}
      if(isIn){if(w==null&&!v.file){toast("ارفع صورة النتيجة أو اكتب الوزن");return false}}else if(w==null){toast("اكتب الوزن");return false}
      if(w!=null&&(w<20||w>400)){toast("الوزن غير منطقي، راجع الرقم");return false}
      if(fa!=null&&(fa<1||fa>80)){toast("نسبة الدهون غير منطقية");return false}
      if(mu!=null&&(mu<5||mu>150)){toast("الكتلة العضلية غير منطقية");return false}
      const row={taken_on:v.d,weight:w??null,fat:fa??null,muscle:mu??null,note:(v.n||"").trim()||null,file_path:v.file||null};
      if(e){
        const {error}=await sb.from("measurements").update(row).eq("id",e.id);
        if(error){toast("تعذر الحفظ");return false}
        if(e.file_path&&e.file_path!==row.file_path)sb.storage.from("inbody").remove([e.file_path]);
      }else{
        const {data,error}=await sb.from("measurements").insert({client_id:CID(),kind,...row}).select("id").single();
        if(error||!data){toast("تعذر الحفظ");return false}
        const ids=REQS.filter(r=>r.status==="pending"&&(r.id===reqId||r.kind===kind||(isIn&&w!=null&&r.kind==="weight"))).map(r=>r.id);
        if(ids.length)await sb.from("measure_requests").update({status:"done",done_at:new Date().toISOString(),measurement_id:data.id}).in("id",ids);
        if(!ADMIN)pushAdmin("meas",kind);
      }
      await loadMeas(CID());route();setTimeout(()=>toast("تم حفظ القياس"),60);return true;
    },
    e?async()=>{
      const {error}=await sb.from("measurements").delete().eq("id",e.id);
      if(error){toast("تعذر الحذف");return}
      if(e.file_path)sb.storage.from("inbody").remove([e.file_path]);
      await loadMeas(CID());route();
    }:null);
}
function askMeas(kind){
  if(!EDIT())return;
  if(REQS.some(r=>r.status==="pending"&&r.kind===kind)){toast("فيه طلب "+MK(kind)+" لسه منتظر من العميل");return}
  modal("طلب "+(kind==="inbody"?"قياس InBody":"قياس الوزن")+" من العميل",[{k:"n",l:"رسالة للعميل (اختياري)",type:"area",v:""}],async v=>{
    const note=(v.n||"").trim();
    const {error}=await sb.from("measure_requests").insert({client_id:VIEW.id,kind,note:note||null});
    if(error){toast("تعذر إرسال الطلب");return false}
    const nt={client_id:VIEW.id,title:kind==="inbody"?"مطلوب منك: قياس InBody":"مطلوب منك: قياس الوزن",body:note||(kind==="inbody"?"ارفع نتيجة الـ InBody من صفحة «القياسات و InBody» في التطبيق.":"سجّل وزنك الحالي من صفحة «القياسات و InBody» في التطبيق.")};
    await sb.from("notifications").insert(nt);pushTo(VIEW.id,nt.title,nt.body,"./#body");
    await loadMeas(VIEW.id);route();setTimeout(()=>toast("تم إرسال الطلب للعميل"),60);return true;
  });
}
async function cancelReq(id){
  if(!confirm("إلغاء هذا الطلب؟"))return;
  const {error}=await sb.from("measure_requests").update({status:"cancelled"}).eq("id",id);
  if(error)return toast("تعذر الإلغاء");
  await loadMeas(CID());route();
}
/* ===== إشعارات الموبايل (Web Push) ===== */
const PUSH_OK=()=>"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
const STANDALONE=()=>window.navigator.standalone===true||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches);
const IOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const b64u=s=>{const p="=".repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from(r,c=>c.charCodeAt(0))};
const once=k=>{try{const key="tnh_p_"+TODAY+"_"+k;if(localStorage.getItem(key))return false;localStorage.setItem(key,"1");return true}catch(e){return false}};
async function pApi(body,path){
  const {data:{session}}=await sb.auth.getSession();
  if(!session)throw new Error("no session");
  const r=await fetch(path||"/api/push",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify(body)});
  return r.json().catch(()=>({}));
}
async function pushSub(ask){
  if(!PUSH_OK()||!CONFIG.VAPID_PUBLIC||Notification.permission==="denied")return false;
  if(Notification.permission!=="granted"){if(!ask)return false;if(await Notification.requestPermission()!=="granted")return false}
  const reg=await navigator.serviceWorker.ready;
  let s=await reg.pushManager.getSubscription();
  if(!s)s=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(CONFIG.VAPID_PUBLIC)});
  const j=s.toJSON(),r=await pApi({action:"subscribe",sub:{endpoint:j.endpoint,keys:j.keys}});
  return !!r.ok;
}
function pushSync(){try{if(PUSH_OK()&&CONFIG.VAPID_PUBLIC&&Notification.permission==="granted")pushSub(false).catch(()=>{})}catch(e){}}
async function pushOn(){
  try{
    const ok=await pushSub(true);
    if(ok){const c=$("#pcard");if(c)c.remove();toast("تم تفعيل الإشعارات ✓")}
    else toast(Notification.permission==="denied"?"الإشعارات محظورة، فعّلها من إعدادات الموبايل":"تعذر التفعيل، حاول مرة أخرى");
  }catch(e){toast("تعذر تفعيل الإشعارات")}
}
async function pushOff(){
  try{
    if(!PUSH_OK())return;
    const reg=await navigator.serviceWorker.getRegistration(),s=reg&&await reg.pushManager.getSubscription();
    if(!s)return;
    await pApi({action:"unsubscribe",endpoint:s.endpoint});await s.unsubscribe();
  }catch(e){}
}
function pushCard(){
  if(EDIT()||!CONFIG.VAPID_PUBLIC)return"";
  if(!PUSH_OK()){
    return IOS()&&!STANDALONE()?`<div class="card pc" id="pcard"><b>🔔 فعّل التنبيهات على الآيفون</b><p>افتح الموقع في Safari ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية»، ثم افتح التطبيق من الأيقونة وفعّل التنبيهات من هنا.</p></div>`:"";
  }
  if(Notification.permission==="granted")return"";
  if(Notification.permission==="denied")return`<div class="card pc" id="pcard"><b>🔔 التنبيهات متوقفة</b><p>فعّلها من إعدادات الموبايل ← الإشعارات ← هذا التطبيق.</p></div>`;
  return`<div class="card pc" id="pcard"><b>🔔 فعّل تنبيهات المتابعة</b><p>${ADMIN?"عشان توصلك إشعارات لحظة ما العميل يبدأ تمرينه أو يخلّصه.":"عشان توصلك رسائل ومتابعة الدكتور على الموبايل حتى والتطبيق مقفول."}</p><button class="btn" onclick="pushOn()">تفعيل التنبيهات</button></div>`;
}
function pushTo(cid,title,body,url){pApi({action:"send",to:"client",client_id:cid,title,body,url:url||"./#notes",tag:"n"+Date.now()}).catch(()=>{})}
function pushAdmin(kind,label){pApi({action:"send",to:"admin",kind,label:label||""}).catch(()=>{})}
function pushTick(k){
  try{
    if(ADMIN||!L().d[k])return;
    if(once("start"))pushAdmin("start");
    const m=/^s(\d+)e/.exec(k);if(!m)return;
    const i=+m[1],s=P.data.sessions[i];
    if(s&&s.ex.length&&doneCount(i)>=s.ex.length&&once("done"+i))pushAdmin("done",s.t);
  }catch(e){}
}
function deepClient(){
  try{
    const u=new URLSearchParams(location.search),c=u.get("c");
    if(!c||!/^[0-9a-f-]{36}$/i.test(c))return null;
    history.replaceState(null,"",location.pathname+location.hash);
    return{id:c,name:(u.get("n")||"عميل").slice(0,60)};
  }catch(e){return null}
}
const CHEERS=["برافو يا بطل 👏 كمّل كده","ركّز على الأداء الصح مش على الوزن 🎯","متنساش الميّه والوجبات حسب الخطة 💧","فينك؟ مستنيك النهارده في التمرين 💪"];
function cheerCard(){return`<div class="card"><b>رسالة سريعة للعميل (بتوصله كإشعار)</b><div class="chips">${CHEERS.map((c,i)=>`<button class="chip2" onclick="cheer(${i})">${c}</button>`).join("")}</div></div>`}
async function cheer(i){
  if(!EDIT())return;
  const t="رسالة من الدكتور",b=CHEERS[i];
  const {error}=await sb.from("notifications").insert({client_id:VIEW.id,title:t,body:b});
  if(error)return toast("تعذر الإرسال");
  pushTo(VIEW.id,t,b,"./#notes");toast("تم إرسال الرسالة ✓");
}
async function remindNow(){
  if(!ADMIN)return;
  toast("جاري فحص العملاء...");
  let r;try{r=await pApi({preview:true},"/api/reminders")}catch(e){return toast("تعذر الاتصال")}
  if(!r||!r.ok)return toast((r&&r.error)||"تعذر الفحص");
  if(!r.items.length&&!r.digest)return toast("مفيش حد محتاج تذكير دلوقتي");
  const KN={req:"طلب قياس منتظر",abs:"غياب عن التمرين",start:"لم يبدأ بعد",wt:"وزن أسبوعي"};
  const txt=(r.items.length?"تذكيرات هتتبعت للعملاء:\n"+r.items.map(x=>"• "+x.name+" — "+(KN[x.kind]||x.kind)).join("\n"):"مفيش تذكيرات للعملاء النهارده")+(r.digest?"\n\nملخص ليك: "+r.digest.n+" عميل غايبين ٣ أيام أو أكتر":"")+"\n\nتبعتهم دلوقتي؟\n(بتتبعت تلقائيًا كل يوم الساعة ٥ مساءً)";
  if(!confirm(txt))return;
  try{const s=await pApi({send:true},"/api/reminders");toast(s&&s.ok?"تم الإرسال ✓":((s&&s.error)||"تعذر الإرسال"))}catch(e){toast("تعذر الإرسال")}
}
/* ===== تحديث لحظي: أي حاجة تحصل (إشعار، تمرين، وزن، ملاحظة، طلب قياس، تعديل برنامج) تظهر فورًا في التطبيق المفتوح عند الطرفين ===== */
let LIVE_T=0,LIVE_BUSY=false,LIVE_AGAIN=false,LIVE_DIRTY=false;
// true لو العميل/الأدمن بيكتب دلوقتي أو في نافذة مفتوحة: منعيد رسم الشاشة تحت إيده
const busyUI=()=>{const a=document.activeElement;return !!document.querySelector(".md")||!!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))};
function liveRender(){
  const y=window.scrollY,r=location.hash.slice(1)||"home",m=/^s([1-9]\d?)$/.exec(r);
  if(r==="body"){measRender();signMeas().then(ok=>{if(ok&&location.hash==="#body")measRender()});return}
  if(!P){route();return}
  if(m)session(+m[1]-1);else if(r==="train")train();else if(r==="food")food();else if(r==="supp")supp();else if(r==="notes")notes();else home();
  window.scrollTo(0,y);
}
let PW=0; // آخر وقت كتبنا فيه تعديل على البرنامج (حفظ/نشر): أي جلب أقدم منه يتجاهل
async function liveRefresh(force){
  if(!ME||document.hidden)return;
  if(ADMIN&&!VIEW)return listRefresh();
  if(LIVE_BUSY){LIVE_AGAIN=true;return}
  const t=Date.now();if(!force&&t-LIVE_T<8000)return;
  // لو في نافذة تعديل مفتوحة أو حد بيكتب: متلمسش أي بيانات (دوال التعديل ماسكة نسخة من P). نأجّل ونحاول بعد ما يخلّص.
  if(busyUI()){LIVE_DIRTY=true;return}
  LIVE_T=t;LIVE_BUSY=true;
  try{
    const cid=CID(),adm=EDIT(),t0=Date.now();
    const sig=()=>JSON.stringify([NOTIFS.map(x=>x.id+(x.read?1:0)),REQS.map(x=>x.id+x.status),MEAS.map(x=>x.id),PROGS,adm?LOGS:0]);
    const before=sig(),known=new Set(NOTIFS.map(x=>x.id));
    const m0=MEAS,r0=REQS,ok0=MOK;
    const q=[
      sb.from("notifications").select("*").eq("client_id",cid).order("created_at",{ascending:false}).limit(30),
      loadMeas(cid),
      sb.from("programs").select("*").eq("client_id",cid).order("month_start",{ascending:false})];
    // سجلات التمرين: الأدمن يحتاجها (يشوف وزن وملاحظات العميل). العميل هو اللي بيكتبها فمش بنعمل لها refetch عشان منكتبش فوق شغله.
    if(adm)q.push(sb.from("logs").select("log_date,data").eq("client_id",cid));
    const [n,,pg,lg]=await Promise.all(q);
    // أثناء الجلب: ممكن النافذة تتفتح أو يتحفظ تعديل. لو حصل كده نرجّع القديم ونتجاهل النتيجة (البيانات الأحدث موجودة عندنا).
    if(busyUI()||PW>=t0||cid!==CID()){MEAS=m0;REQS=r0;MOK=ok0;LIVE_DIRTY=true;return}
    if(n&&!n.error&&n.data)NOTIFS=n.data;
    if(pg&&!pg.error&&pg.data){
      // نستبدل بيانات البرنامج بس لو اتغيرت فعلًا على السيرفر (عشان منبدّلش الكائنات من غير داعي)
      if(JSON.stringify(pg.data)!==JSON.stringify(PROGS)){
        const cur=P&&P.id;PROGS=pg.data;
        let i=PROGS.findIndex(x=>x.id===cur);
        if(i<0){i=PROGS.findIndex(x=>x.month_start<=TODAY);if(i<0)i=PROGS.length-1}
        PI=i;P=PROGS[PI];
      }
    }
    if(lg&&!lg.error&&lg.data){const nl={};lg.data.forEach(r=>nl[r.log_date]=r.data);if(JSON.stringify(nl)!==JSON.stringify(LOGS))LOGS=nl}
    badge();
    if(sig()!==before){
      liveRender();
      const nw=NOTIFS.find(x=>!x.read&&!known.has(x.id));
      if(nw&&!EDIT())toast("📩 "+nw.title);
    }
  }catch(e){}finally{
    LIVE_BUSY=false;
    if(LIVE_AGAIN){LIVE_AGAIN=false;setTimeout(()=>liveRefresh(true),300)}
  }
}

// قائمة العملاء عند الأدمن: نعيد تحميلها بهدوء لما عميل يعمل أي حاجة
let LIST_T=0;
function listRefresh(){
  if(!ADMIN||VIEW||document.hidden||busyUI())return;
  const t=Date.now();if(t-LIST_T<5000)return;LIST_T=t;
  clients();
}
/* ===== Supabase Realtime: السيرفر نفسه بيبعت التغيير فورًا (من غير ما نعتمد على إشعار الموبايل) ===== */
let RT=null,RT_KEY="";
function rtStop(){if(RT){try{sb.removeChannel(RT)}catch(e){}RT=null}RT_KEY=""}
function rtSync(){
  if(!ME){rtStop();return}
  const key=(ADMIN&&!VIEW)?"admin-list":CID();
  if(RT_KEY===key&&RT)return;
  rtStop();RT_KEY=key;
  const ch=sb.channel("live-"+key+"-"+Date.now()),list=key==="admin-list",f=list?null:"client_id=eq."+key;
  ["notifications","logs","programs","measurements","measure_requests"].forEach(t=>{
    const o={event:"*",schema:"public",table:t};if(f)o.filter=f;
    ch.on("postgres_changes",o,()=>{list?setTimeout(listRefresh,1200):liveRefresh(true)});
  });
  ch.subscribe(st=>{if(st==="CHANNEL_ERROR"||st==="TIMED_OUT"||st==="CLOSED"){if(RT===ch){RT_KEY="";setTimeout(()=>{if(ME&&!document.hidden)rtSync()},4000)}}});
  RT=ch;
}
addEventListener("visibilitychange",()=>{if(!document.hidden){RT_KEY="";rtSync();liveRefresh(true)}});
addEventListener("focus",()=>liveRefresh());
addEventListener("pageshow",()=>{RT_KEY="";rtSync();liveRefresh(true)});
addEventListener("online",()=>{RT_KEY="";rtSync();liveRefresh(true)});
setInterval(()=>liveRefresh(),15000);
setInterval(()=>{if(LIVE_DIRTY&&!busyUI()){LIVE_DIRTY=false;liveRefresh(true)}},2000);
if("serviceWorker" in navigator)navigator.serviceWorker.addEventListener("message",e=>{if(e.data&&e.data.type==="push")setTimeout(()=>liveRefresh(true),400)});
function route(){
  rtSync();
  if(!ME||(ADMIN&&!VIEW))return;
  const r=location.hash.slice(1)||"home",m=/^s([1-9]\d?)$/.exec(r);
  if(r=="body"){measPage();["home","train","food","supp","notes"].forEach(x=>$("#n-"+x).classList.toggle("on",x=="home"));window.scrollTo(0,0);return}
  if(!P){empty();return}
  if(m)session(+m[1]-1);else if(r=="train")train();else if(r=="food")food();else if(r=="supp")supp();else if(r=="notes")notes();else home();
  const cur=m?"train":(["train","food","supp","notes"].includes(r)?r:"home");
  ["home","train","food","supp","notes"].forEach(x=>$("#n-"+x).classList.toggle("on",x==cur));
  window.scrollTo(0,0);
}
addEventListener("hashchange",route);
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
(async()=>{
  if(CONFIG.SUPABASE_URL.includes("YOUR-PROJECT")){$("#app").innerHTML='<div class="card"><b>لازم تضيف بيانات سوبابيز في ملف config.js</b></div>';return}
  const {data:{session}}=await sb.auth.getSession();
  session?load():login();
})();
