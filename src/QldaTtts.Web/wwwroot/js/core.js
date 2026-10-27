/* ===== Lõi: cấu hình phân hệ, lưu trữ, xác thực, tiện ích ===== */
const ICON = {
  dash:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  proj:'<path d="M3 7h18v13H3zM8 7V4h8v3"/>',
  cube:'<path d="M12 2 3 7v10l9 5 9-5V7zM3 7l9 5 9-5M12 12v10"/>',
  doc:'<path d="M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8"/>',
  gantt:'<path d="M3 4v16h18M7 8h7M9 12h9M7 16h5"/>',
  book:'<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM4 16a4 4 0 0 1 4-4h12"/>',
  ruler:'<path d="m3 17 14-14 4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M15 9h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9M12 6v2M12 16v2"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  phone:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
  check:'<path d="M4 12l5 5L20 6"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  out:'<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  cam:'<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'
};
const ic = (n)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]||''}</svg>`;
/* Hoa văn mặt trống đồng Đông Sơn (vẽ cách điệu): ngôi sao 14 cánh, vành tròn chấm, vành vạch, vành chim Lạc bay ngược chiều kim đồng hồ, vành răng cưa */
const drumSVG = (()=>{ let cache=null; return ()=>{ if(cache) return cache;
  const P=Math.PI, f=n=>+n.toFixed(2), C=160, out=[];
  const ring=r=>out.push(`<circle cx="${C}" cy="${C}" r="${r}"/>`);
  const at=(r,a)=>[f(C+r*Math.cos(a)), f(C+r*Math.sin(a))];
  const star=[]; for(let k=0;k<28;k++){ const r=k%2?11:34, a=-P/2+k*P/14; star.push(at(r,a).join(',')); }
  out.push(`<polygon points="${star.join(' ')}" fill="currentColor" stroke="none"/>`);
  for(let k=0;k<14;k++){ const a=-P/2+(k+.5)*P/7; const [x1,y1]=at(20,a-.12),[x2,y2]=at(31,a),[x3,y3]=at(20,a+.12); out.push(`<path d="M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}"/>`); }
  [40,44].forEach(ring);
  for(let k=0;k<36;k++){ const [x,y]=at(50,k*P/18); out.push(`<circle cx="${x}" cy="${y}" r="4.2"/><circle cx="${x}" cy="${y}" r="1.1" fill="currentColor"/>`); }
  [56,59].forEach(ring);
  for(let k=0;k<96;k++){ const a=k*P/48, [x1,y1]=at(60,a), [x2,y2]=at(67,a); out.push(`<path d="M${x1} ${y1}L${x2} ${y2}"/>`); }
  [68,71].forEach(ring);
  const bird='M-17 0C-10-3.2 3-3.4 9-.6L24-1.4 9.4 1.4C3 3.4-10 3.2-17 0ZM-3-1.6-9-13-1-2.6M3-1-1-11 5-1.8M-17 0-25-6M-17 0-25 5M8-1 12-6';
  for(let k=0;k<10;k++){ const a=k*P/5+P/10, [x,y]=at(87,a), deg=f(a*180/P-90); out.push(`<path transform="translate(${x} ${y}) rotate(${deg})" d="${bird}"/>`); }
  [104,107].forEach(ring);
  for(let k=0;k<48;k++){ const [x,y]=at(113,k*P/24); out.push(`<circle cx="${x}" cy="${y}" r="4.2"/><circle cx="${x}" cy="${y}" r="1.1" fill="currentColor"/>`); }
  [119,122].forEach(ring);
  const zz=[]; for(let k=0;k<=96;k++){ zz.push(at(k%2?131:124,k*P/48).join(',')); } out.push(`<polyline points="${zz.join(' ')}"/>`);
  [133,137,150].forEach(ring);
  for(let k=0;k<120;k++){ const a=k*P/60, [x1,y1]=at(139,a), [x2,y2]=at(148,a); out.push(`<path d="M${x1} ${y1}L${x2} ${y2}"/>`); }
  return cache=`<svg viewBox="0 0 320 320" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${out.join('')}</svg>`; }; })();

const MODULES = [
  {key:'tong-quan', label:'Tổng quan', icon:'dash', grp:'Điều hành'},
  {key:'du-an', label:'Quản lý dự án', icon:'proj', grp:'Điều hành'},
  {key:'mo-hinh', label:'Mô hình hóa công trình', icon:'cube', grp:'Nghiệp vụ'},
  {key:'goi-thau', label:'Gói thầu và hợp đồng', icon:'doc', grp:'Nghiệp vụ'},
  {key:'tien-do', label:'Quản lý tiến độ', icon:'gantt', grp:'Nghiệp vụ'},
  {key:'nhat-ky', label:'Nhật ký thi công', icon:'book', grp:'Nghiệp vụ'},
  {key:'khoi-luong', label:'Quản lý khối lượng', icon:'ruler', grp:'Nghiệp vụ'},
  {key:'thanh-toan', label:'Quản lý thanh toán', icon:'coin', grp:'Nghiệp vụ'},
  {key:'bao-cao', label:'Báo cáo, thống kê', icon:'chart', grp:'Khai thác'},
  {key:'quan-tri', label:'Quản trị hệ thống', icon:'gear', grp:'Khai thác'}
];
const EXTRA_ROUTES = ['hien-truong','doi-chieu'];
const COLS = ['projects','tasks','legal','items','models','packages','contracts','addenda','schedule','diaries','boq','volumes','payplans','payments','users','groups','catalogs','logs'];
const COL_LABEL = {projects:'Dự án',tasks:'Công việc',legal:'Hồ sơ pháp lý',items:'Hạng mục công trình',models:'Tệp mô hình',packages:'Gói thầu',contracts:'Hợp đồng',addenda:'Phụ lục hợp đồng',schedule:'Tiến độ',diaries:'Nhật ký thi công',boq:'Khối lượng hợp đồng',volumes:'Khối lượng thực hiện',payplans:'Kế hoạch thanh toán',payments:'Hồ sơ thanh toán',users:'Người dùng',groups:'Nhóm người dùng',catalogs:'Danh mục',logs:'Nhật ký hệ thống'};

/* --- tiện ích --- */
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
const isoLocal = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const TODAY = isoLocal(new Date());
const fmtDate = d => d ? String(d).slice(0,10).split('-').reverse().join('/') : '—';
const fmtDT = s => { if(!s) return '—'; const d=new Date(s); return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes()); };
const N = v => Number(v)||0;
const fmtN = (v,dg=0) => (v==null||v==='')?'—':Number(v).toLocaleString('vi-VN',{maximumFractionDigits:dg});
const fmtVND = v => (v==null||v==='')?'—':Math.round(Number(v)).toLocaleString('vi-VN');
const fmtTy = v => (N(v)/1e9).toLocaleString('vi-VN',{minimumFractionDigits:2, maximumFractionDigits:2})+' tỷ';
const fmtSize = b => !b?'—': b>1e6? (b/1e6).toLocaleString('vi-VN',{maximumFractionDigits:1})+' MB' : Math.ceil(b/1e3)+' KB';
const pct = (a,b) => b ? Math.max(0, a/b*100) : 0;
const fmtP = v => (Math.round(v*10)/10).toLocaleString('vi-VN')+'%';
const days = (a,b) => Math.round((Date.parse(b)-Date.parse(a))/864e5);
const addDays = (d,n) => isoLocal(new Date(Date.parse(d)+n*864e5));
const uid = p => p+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const by = (k,dir=1) => (a,b)=> (a[k]>b[k]?1:a[k]<b[k]?-1:0)*dir;
const sum = (arr,f) => arr.reduce((s,x)=>s+N(typeof f==='function'?f(x):x[f]),0);
const norm = s => String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d');
const has = (obj,q) => !q || norm(Object.values(obj).filter(v=>typeof v!=='object').join(' ')).includes(norm(q));
const initials = n => String(n||'?').replace(/\(.*?\)/g,'').trim().split(/\s+/).slice(-2).map(w=>w[0]).join('').toUpperCase();
function lsGet(k){ try{ return localStorage.getItem(k); }catch{ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); return true; }catch{ return false; } }
function ssGet(k){ try{ return sessionStorage.getItem(k); }catch{ return null; } }
function ssSet(k,v){ try{ v==null? sessionStorage.removeItem(k) : sessionStorage.setItem(k,v); }catch{} }

/* --- lưu trữ: máy chủ ứng dụng ASP.NET Core + SQL Server, giao tiếp qua API --- */
class ApiError extends Error{ constructor(status,message){ super(message); this.status=status; } }
async function api(method, url, body, opts={}){
  const init={method, headers:{'X-QLDA':'1'}, credentials:'same-origin'};
  if(body instanceof FormData) init.body=body;
  else if(body!==undefined){ init.headers['Content-Type']='application/json'; init.body=JSON.stringify(body); }
  let r; try{ r=await fetch(url, init); }catch(e){ throw new ApiError(0,'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.'); }
  if(r.status===401 && !opts.auth){ Store.signedOut(); throw new ApiError(401,'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); }
  const data=(r.headers.get('content-type')||'').includes('json') ? await r.json().catch(()=>null) : null;
  if(!r.ok) throw new ApiError(r.status, (data&&data.message)||('Lỗi máy chủ ('+r.status+').'));
  return data;
}
const Store = {
  mode:'loading', initialized:false, sampleUsers:false, error:'',
  data:Object.fromEntries(COLS.map(c=>[c,[]])),
  _timer:0,
  async init(){
    try{
      const s=await api('GET','/api/auth/state');
      this.initialized=s.initialized; this.sampleUsers=s.sampleUsers; S.user=s.user||null;
      if(S.user) await this.load();
      this.mode='server'; this.error='';
    }catch(e){ this.mode='offline'; this.error=e.message; setTimeout(()=>this.init(),10000); }
    onData();
    clearInterval(this._timer);
    this._timer=setInterval(()=>{ if(S.user && document.visibilityState==='visible') this.load().catch(()=>{}); }, 30000);
  },
  async load(){
    const d=await api('GET','/api/data');
    COLS.forEach(c=>{ this.data[c]=Array.isArray(d[c])?d[c]:[]; });
    const me=S.user && this.data.users.find(u=>u.id===S.user.id); if(me) S.user={...S.user,...me};
    onData();
  },
  clear(){ COLS.forEach(c=>{ this.data[c]=[]; }); },
  signedOut(){ if(S.user){ S.user=null; this.clear(); toast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.','err'); onData(); } },
  allReady(){ return this.mode!=='loading'; },
  setLocal(col,o){ const a=this.data[col]; const i=a.findIndex(x=>x.id===o.id); if(i>=0) a[i]=o; else a.push(o); onData(); this.soon(); return o; },
  /* đồng bộ lại toàn bộ (kể cả nhật ký hoạt động) ngay sau khi ghi */
  soon(){ clearTimeout(this._soon); this._soon=setTimeout(()=>this.load().catch(()=>{}),1200); },
  async put(col,obj){
    const o={...obj}; if(!o.id) o.id=uid(col.slice(0,3));
    const r=await api('PUT','/api/data/'+col+'/'+encodeURIComponent(o.id), o);
    return this.setLocal(col,r);
  },
  async del(col,id){
    await api('DELETE',(col==='users'?'/api/users/':'/api/data/'+col+'/')+encodeURIComponent(id));
    this.data[col]=this.data[col].filter(x=>x.id!==id); onData(); this.soon();
  }
};
const D = c => Store.data[c];
const get = (c,id) => Store.data[c].find(x=>x.id===id);

function errText(e){ return (e&&e.message)||'Không lưu được dữ liệu.'; }

/* --- ghi dữ liệu: máy chủ kiểm tra quyền và tự ghi nhật ký hoạt động --- */
async function save(col,obj){ return Store.put(col,obj); }
async function remove(col,id){ await Store.del(col,id); }
/* ghi nhật ký cho thao tác không làm thay đổi dữ liệu (xuất báo cáo…) */
function log(action,col,target){
  if(!S.user) return;
  api('POST','/api/data/logs',{action, module:COL_LABEL[col]||col, target:String(target||'').slice(0,160)}).catch(()=>{});
}

/* --- xác thực --- */
function pwOk(pw){ return pw.length>=8 && /[A-Za-z]/.test(pw) && /\d/.test(pw); }

/* --- phân quyền --- */
function myGroup(){ return S.user ? get('groups', S.user.groupId) : null; }
function can(mod, lvl='view'){
  if(mod==='hien-truong'||mod==='doi-chieu') return !!S.user;
  const g=myGroup(); if(!g) return false; if(g.admin) return true;
  const p=(g.perms||{})[mod]||'none';
  return lvl==='view' ? p!=='none' : p==='edit';
}
function scopeIds(){ const g=myGroup(); if(!g||g.admin||!Array.isArray(g.scope)||!g.scope.length) return null; return g.scope; }
function projects(){ const sc=scopeIds(); return D('projects').filter(p=>!sc||sc.includes(p.id)).sort(by('code')); }
function pidOk(pid){ const sc=scopeIds(); return !sc || sc.includes(pid); }
function inFilter(pid){ return pidOk(pid) && (!S.pid || S.pid===pid); }

/* --- tính toán nghiệp vụ --- */
const pkgOf = id => get('packages',id);
const projOf = id => get('projects',id);
const contractOfPkg = kid => D('contracts').find(c=>c.packageId===kid);
const contractPid = c => c.projectId || (pkgOf(c.packageId)||{}).projectId;
function contractValue(c){ return N(c.value) + sum(D('addenda').filter(a=>a.contractId===c.id),'valueChange'); }
function contractEnd(c){ const d=sum(D('addenda').filter(a=>a.contractId===c.id),'daysChange'); return c.end? addDays(c.end,d) : ''; }
function boqDone(b, upto){ return sum(D('volumes').filter(v=>v.boqId===b.id && (!upto||v.date<=upto)),'doneQty'); }
function boqAcc(b, upto){ return sum(D('volumes').filter(v=>v.boqId===b.id && (!upto||v.date<=upto)),'acceptedQty'); }
function contractDone(cid, upto){ return sum(D('boq').filter(b=>b.contractId===cid), b=>boqDone(b,upto)*N(b.price)); }
function contractAcc(cid, upto){ return sum(D('boq').filter(b=>b.contractId===cid), b=>boqAcc(b,upto)*N(b.price)); }
function contractPaid(cid, upto){ return sum(D('payments').filter(p=>p.contractId===cid && p.status==='Đã thanh toán' && (!upto||p.date<=upto)),'amount'); }
function expectedPct(s, date=TODAY){
  if(!s.planStart||!s.planEnd) return 0;
  if(date<=s.planStart) return 0; if(date>=s.planEnd) return 100;
  return days(s.planStart,date)/Math.max(1,days(s.planStart,s.planEnd))*100;
}
function progressAt(s, date){ const h=(s.history||[]).filter(x=>x.date<=date).sort(by('date')); return h.length? N(h[h.length-1].progress) : 0; }
function schedState(s){
  const p=N(s.progress), e=expectedPct(s);
  if(p>=100) return {k:'ok', t:'Hoàn thành'};
  if(TODAY>s.planEnd) return {k:'bad', t:'Quá hạn '+days(s.planEnd,TODAY)+' ngày'};
  if(e-p>10) return {k:'warn', t:'Chậm '+Math.round(e-p)+'%'};
  if(TODAY<s.planStart && p===0) return {k:'', t:'Chưa đến hạn'};
  return {k:'acc', t:'Đúng tiến độ'};
}
function wavg(items, f){ const w=sum(items, s=>N(s.weight)||1); return w? sum(items, s=>(N(s.weight)||1)*f(s))/w : 0; }
function projProgress(pid){ const p=projOf(pid); if(p && /hoàn thành|quyết toán/i.test(p.status||'') && !D('schedule').some(s=>s.projectId===pid)) return 100; return wavg(D('schedule').filter(s=>s.projectId===pid), s=>N(s.progress)); }
function projExpected(pid){ return wavg(D('schedule').filter(s=>s.projectId===pid), s=>expectedPct(s)); }
function pkgProgress(kid){ return wavg(D('schedule').filter(s=>s.packageId===kid), s=>N(s.progress)); }
function pkgExpected(kid){ return wavg(D('schedule').filter(s=>s.packageId===kid), s=>expectedPct(s)); }
function itemProgress(it){ const ss=D('schedule').filter(s=>s.itemId===it.id); return ss.length? wavg(ss,s=>N(s.progress)) : N(it.progress); }
function catalog(type){ return D('catalogs').filter(c=>c.type===type).sort(by('order')).map(c=>c.value); }

/* --- cảnh báo (UC19, UC37) --- */
function alerts(){
  const out=[];
  D('schedule').filter(s=>inFilter(s.projectId)).forEach(s=>{
    const st=schedState(s); const k=pkgOf(s.packageId);
    if(st.k==='bad') out.push({lvl:'bad', mod:'tien-do', text:`<b>${esc(s.name)}</b> (${esc(k?k.code:'')}) ${st.t.toLowerCase()}, mới đạt ${N(s.progress)}%.`});
    else if(st.k==='warn') out.push({lvl:'warn', mod:'tien-do', text:`<b>${esc(s.name)}</b> (${esc(k?k.code:'')}) chậm so với kế hoạch: thực tế ${N(s.progress)}%, kế hoạch ${Math.round(expectedPct(s))}%.`});
  });
  D('contracts').filter(c=>inFilter(contractPid(c))).forEach(c=>{
    const e=contractEnd(c); const k=pkgOf(c.packageId); if(!e) return;
    const done=pct(contractDone(c.id),contractValue(c));
    if(k && /thanh lý|nghiệm thu/i.test(k.status||'')) return;
    const left=days(TODAY,e);
    if(left<0 && done<100) out.push({lvl:'bad', mod:'goi-thau', text:`Hợp đồng <b>${esc(c.number)}</b> đã hết hạn ${-left} ngày, khối lượng thực hiện ${fmtP(done)}.`});
    else if(left>=0 && left<=60 && done<90) out.push({lvl:'warn', mod:'goi-thau', text:`Hợp đồng <b>${esc(c.number)}</b> còn ${left} ngày đến hạn (${fmtDate(e)}), khối lượng thực hiện ${fmtP(done)}.`});
  });
  D('payplans').forEach(p=>{
    const c=get('contracts',p.contractId); if(!c||!inFilter(contractPid(c))) return;
    if(p.planDate<TODAY && p.planDate>addDays(TODAY,-60)){
      const paid=D('payments').some(x=>x.contractId===c.id && x.date>=addDays(p.planDate,-45) && x.status==='Đã thanh toán');
      if(!paid) out.push({lvl:'warn', mod:'thanh-toan', text:`Kế hoạch thanh toán <b>${esc(p.phase)}</b> HĐ ${esc(c.number)} (${fmtTy(p.amount)}) đến hạn ${fmtDate(p.planDate)} chưa có hồ sơ đã thanh toán.`});
    }
  });
  D('tasks').filter(t=>inFilter(t.projectId) && t.status!=='Hoàn thành' && t.due && t.due<TODAY).forEach(t=>{
    out.push({lvl:'bad', mod:'du-an', text:`Công việc <b>${esc(t.name)}</b> quá hạn ${days(t.due,TODAY)} ngày (${esc(t.assignee||'')}).`});
  });
  return out.sort((a,b)=>(a.lvl==='bad'?0:1)-(b.lvl==='bad'?0:1));
}

/* --- giao diện chung --- */
function toast(msg, kind){ const t=$('#toast'); t.textContent=msg; t.className='toast'+(kind?' '+kind:''); t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true, kind==='err'?6000:2600); }
function pill(text, k){ return `<span class="pill ${k||''}">${esc(text)}</span>`; }
function statusPill(s){
  const k = /hoàn thành|đã quyết toán|đã thanh toán|đã thanh lý|đã nghiệm thu/i.test(s)?'ok': /tạm dừng|từ chối|quá hạn/i.test(s)?'bad': /chuẩn bị|lựa chọn|đề nghị|trình|chưa/i.test(s)?'info': /thi công|thực hiện|đang/i.test(s)?'acc':'';
  return pill(s||'—',k);
}
function progBar(v, k){ const w=Math.max(0,Math.min(100,N(v))); return `<div class="barl"><div class="bar ${k||''}"><i style="width:${w}%"></i></div><span>${Math.round(N(v))}%</span></div>`; }
function opts(list, cur, empty){ return (empty!=null?`<option value="">${esc(empty)}</option>`:'') + list.map(o=>{ const [v,l]=Array.isArray(o)?o:[o,o]; return `<option value="${esc(v)}" ${String(v)===String(cur??'')?'selected':''}>${esc(l)}</option>`; }).join(''); }
const projOpts = () => projects().map(p=>[p.id, p.code+' – '+p.name]);
const pkgOpts = (pid) => D('packages').filter(k=>pidOk(k.projectId) && (!pid||k.projectId===pid)).sort(by('code')).map(k=>[k.id, k.code+' – '+k.name]);
const contractOpts = (pid) => D('contracts').filter(c=>pidOk(contractPid(c)) && (!pid||contractPid(c)===pid)).sort(by('number')).map(c=>[c.id, c.number+' – '+((pkgOf(c.packageId)||{}).code||'')]);
function emptyBox(text, btn){ return `<div class="empty">${text}${btn?`<div style="margin-top:10px">${btn}</div>`:''}</div>`; }

/* Bảng dữ liệu chung */
function table(cols, rows, o={}){
  if(!rows.length) return emptyBox(o.empty||'Chưa có dữ liệu.');
  const head = cols.map(c=>`<th class="${c.r?'r':''}">${esc(c.h)}</th>`).join('') + (o.actions?'<th></th>':'');
  const body = rows.map(r=>`<tr class="${o.rowAct?'click':''}" ${o.rowAct?`data-act="${o.rowAct}" data-id="${esc(r.id)}"`:''}>${cols.map(c=>`<td class="${c.r?'r':''}" data-label="${esc(c.h)}">${c.f?c.f(r):esc(r[c.k])}</td>`).join('')}${o.actions?`<td class="acts">${o.actions(r)}</td>`:''}</tr>`).join('');
  const foot = o.foot? `<tfoot><tr>${o.foot.map((f,i)=>`<td class="${cols[i]&&cols[i].r?'r':''}">${f??''}</td>`).join('')}${o.actions?'<td></td>':''}</tr></tfoot>`:'';
  return `<div class="tw rt"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${foot}</table></div>`;
}
const editBtns = (mod, col, id, extra='') => can(mod,'edit') ? `${extra}<button class="btn sm ghost" data-act="edit-${col}" data-id="${esc(id)}">Sửa</button><button class="btn sm ghost danger" data-act="del" data-col="${col}" data-id="${esc(id)}">Xóa</button>` : extra;

/* Hộp thoại biểu mẫu */
function fieldHTML(f, v){
  const id='f_'+f.key, req=f.req?' <span class="req">*</span>':'';
  const cls='fld'+(f.full||f.type==='textarea'||f.type==='checks'||f.type==='files'?' full':'');
  let input='';
  const val = v ?? f.def ?? '';
  switch(f.type){
    case 'textarea': input=`<textarea id="${id}" rows="${f.rows||3}" placeholder="${esc(f.ph||'')}">${esc(val)}</textarea>`; break;
    case 'select': { const list=typeof f.options==='function'?f.options():f.options; input=`<select id="${id}">${opts(list,val, f.req?null:'— Chọn —')}</select>`; break; }
    case 'money': input=`<input id="${id}" type="number" step="1" min="0" value="${esc(val)}" data-money><span class="hint" id="${id}_h">${val!==''?fmtVND(val)+' đồng':''}</span>`; break;
    case 'number': case 'percent': input=`<input id="${id}" type="number" step="any" ${f.type==='percent'?'min="0" max="100"':''} value="${esc(val)}">`; break;
    case 'date': input=`<input id="${id}" type="date" value="${esc(val)}">`; break;
    case 'password': input=`<input id="${id}" type="password" autocomplete="new-password" value="">`; break;
    case 'checks': { const list=typeof f.options==='function'?f.options():f.options; const cur=Array.isArray(val)?val:[]; input=`<div class="checks" id="${id}">${list.map(o=>{const [ov,ol]=Array.isArray(o)?o:[o,o]; return `<label><input type="checkbox" value="${esc(ov)}" ${cur.includes(ov)?'checked':''}> ${esc(ol)}</label>`;}).join('')}</div>`; break; }
    case 'files': input=`<input id="${id}" type="file" ${f.multiple?'multiple':''} accept="${esc(f.accept||'')}">${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}`; break;
    case 'html': input=f.html; break;
    default: input=`<input id="${id}" type="text" value="${esc(val)}" placeholder="${esc(f.ph||'')}">`;
  }
  return `<div class="${cls}"><label for="${id}">${esc(f.label)}${req}</label>${input}</div>`;
}
function openModal(html, narrow){
  const ov=$('#ov'); ov.innerHTML=html; ov.hidden=false;
  const first=ov.querySelector('input:not([type=checkbox]):not([type=file]),select,textarea'); if(first) setTimeout(()=>first.focus(),30);
  return ov;
}
function closeModal(){ const ov=$('#ov'); ov.hidden=true; ov.innerHTML=''; if(S.dirty){ S.dirty=false; render(); } }
function openForm({title, fields, value={}, onSave, narrow, submit='Lưu'}){
  const ov=openModal(`<form class="mform ${narrow?'narrow':''}" id="mform" novalidate><header><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div class="fgrid">${fields.map(f=>fieldHTML(f, value[f.key])).join('')}</div><footer><span class="small muted" id="mform_err" style="flex:1;color:var(--red)"></span><button type="button" class="btn ghost" data-close>Hủy</button><button class="btn primary" type="submit">${esc(submit)}</button></footer></form>`);
  ov.querySelectorAll('[data-money]').forEach(inp=>inp.addEventListener('input',()=>{ const h=$('#'+inp.id+'_h'); if(h) h.textContent=inp.value?fmtVND(inp.value)+' đồng':''; }));
  const form=$('#mform');
  form.onsubmit=async e=>{
    e.preventDefault();
    const v={...value}; const err=$('#mform_err'); err.textContent='';
    for(const f of fields){
      if(f.type==='html') continue;
      const el=$('#f_'+f.key);
      if(f.type==='checks') v[f.key]=$$('input:checked',el).map(i=>i.value);
      else if(f.type==='files') v[f.key]=[...el.files];
      else if(f.type==='password') v[f.key]=el.value;
      else if(['money','number','percent'].includes(f.type)) v[f.key]= el.value===''? null : Number(el.value);
      else v[f.key]=el.value.trim();
      if(f.req && (v[f.key]==null || v[f.key]==='' || (Array.isArray(v[f.key])&&!v[f.key].length))){ err.textContent='Vui lòng nhập "'+f.label+'".'; el.focus&&el.focus(); return; }
      if(f.type==='percent' && v[f.key]!=null && (v[f.key]<0||v[f.key]>100)){ err.textContent='"'+f.label+'" phải từ 0 đến 100.'; return; }
    }
    const btn=form.querySelector('[type=submit]'); btn.disabled=true; btn.textContent='Đang lưu…';
    try{ const r=await onSave(v); if(r===false){ btn.disabled=false; btn.textContent=submit; return; } closeModal(); toast('Đã lưu'); }
    catch(ex){ console.error(ex); err.textContent=errText(ex); btn.disabled=false; btn.textContent=submit; }
  };
}
function confirmBox(msg, okText='Xóa'){
  return new Promise(res=>{
    openModal(`<div class="mform narrow"><header><h3>Xác nhận</h3></header><div style="padding:16px">${msg}</div><footer><button class="btn ghost" id="cf_no">Hủy</button><button class="btn primary" id="cf_ok" style="background:var(--red);border-color:var(--red);color:#fff">${esc(okText)}</button></footer></div>`);
    $('#cf_no').onclick=()=>{closeModal();res(false)}; $('#cf_ok').onclick=()=>{closeModal();res(true)};
  });
}

/* Ảnh và tệp: lưu vào kho tệp trên máy chủ (App_Data/files), tối đa 500 MB mỗi tệp */
function downscale(file, max=1920, q=.82){
  return new Promise((res,rej)=>{ const url=URL.createObjectURL(file); const img=new Image(); img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('Không đọc được ảnh'));}; img.onload=()=>{ URL.revokeObjectURL(url); const k=Math.min(1,max/Math.max(img.width,img.height)); if(k===1 && file.size<1.5e6) return res(file); const c=document.createElement('canvas'); c.width=Math.round(img.width*k); c.height=Math.round(img.height*k); c.getContext('2d').drawImage(img,0,0,c.width,c.height); c.toBlob(b=>res(b? new File([b], file.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'}) : file),'image/jpeg',q); }; img.src=url; });
}
async function uploadFile(file){ const fd=new FormData(); fd.append('file',file); return api('POST','/api/files',fd); }
async function storePhoto(file){
  let f=file; try{ if(/^image\/(jpeg|png|webp)/.test(file.type)) f=await downscale(file); }catch{}
  const r=await uploadFile(f); return {assetId:r.id, url:r.url, name:file.name};
}
async function storeFile(file){ const r=await uploadFile(file); return {assetId:r.id, url:r.url}; }
const fileUrl = o => o.url || (o.assetId? '/api/files/'+o.assetId : '');

/* Xuất tệp (Excel/JSON) */
async function saveFile(filename, data){
  try{ const blob=data instanceof Blob?data:new Blob([data]); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); toast('Đã tạo tệp '+filename); }
  catch(e){ toast('Trình duyệt không cho phép tải tệp.','err'); }
}
function exportXlsx(filename, sheets){
  if(!window.XLSX){ toast('Thư viện Excel chưa tải xong, thử lại sau.','err'); return; }
  const wb=XLSX.utils.book_new();
  sheets.forEach(s=>{ const ws=XLSX.utils.aoa_to_sheet([[s.title],[s.sub||''],[],s.head,...s.rows]); ws['!cols']=s.head.map((h,i)=>({wch:Math.max(10,Math.min(60, Math.max(String(h).length, ...s.rows.map(r=>String(r[i]??'').length))+2))})); XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0,31)); });
  const out=XLSX.write(wb,{bookType:'xlsx',type:'array'});
  saveFile(filename, new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
}

/* --- Biểu đồ SVG --- */
function niceMax(v){ if(v<=0) return 1; const p=Math.pow(10,Math.floor(Math.log10(v))); const n=v/p; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p; }
function barChart({labels, series, h=240, fmt=v=>fmtN(v), max}){
  const W=640, L=58, R=10, T=12, B=48; const ih=h-T-B, iw=W-L-R;
  const mx=max||niceMax(Math.max(1,...series.flatMap(s=>s.values)));
  const gw=iw/Math.max(1,labels.length), bw=Math.min(28,(gw*.72)/series.length);
  let g='';
  for(let i=0;i<=4;i++){ const y=T+ih-ih*i/4; g+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${y+4}" text-anchor="end">${esc(fmt(mx*i/4))}</text>`; }
  labels.forEach((lb,i)=>{
    const x0=L+gw*i+(gw-bw*series.length)/2;
    series.forEach((s,j)=>{ const v=N(s.values[i]); const bh=ih*Math.min(1,v/mx); g+=`<rect x="${x0+j*bw}" y="${T+ih-bh}" width="${bw-2}" height="${Math.max(0,bh)}" rx="2" fill="${s.color}"><title>${esc(s.name)}: ${esc(fmt(v))}</title></rect>`; });
    const t=String(lb); g+=`<text x="${L+gw*i+gw/2}" y="${T+ih+16}" text-anchor="middle">${esc(t.length>14?t.slice(0,13)+'…':t)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">${g}</svg>${legend(series)}`;
}
function legend(series){ return `<div class="legend">${series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`; }
function lineChart({labels, series, h=240, max=100, fmt=v=>v+'%'}){
  const W=640, L=44, R=26, T=12, B=40; const ih=h-T-B, iw=W-L-R;
  const x=i=>L+(labels.length<=1?0:iw*i/(labels.length-1)), y=v=>T+ih-ih*Math.min(1,v/max);
  let g='';
  for(let i=0;i<=4;i++){ const yy=T+ih-ih*i/4; g+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${L-6}" y="${yy+4}" text-anchor="end">${esc(fmt(max*i/4))}</text>`; }
  const step=Math.ceil(labels.length/8);
  labels.forEach((lb,i)=>{ if(i%step===0||i===labels.length-1) g+=`<text x="${x(i)}" y="${T+ih+16}" text-anchor="middle">${esc(lb)}</text>`; });
  series.forEach(s=>{
    const pts=s.values.map((v,i)=>v==null?null:[x(i),y(v)]).filter(Boolean); if(!pts.length) return;
    if(s.area) g+=`<path d="M${pts[0][0]},${T+ih} ${pts.map(p=>'L'+p[0]+','+p[1]).join(' ')} L${pts[pts.length-1][0]},${T+ih}Z" fill="${s.color}" opacity=".12"/>`;
    g+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.2" ${s.dash?'stroke-dasharray="6 4"':''}/>`;
    const l=pts[pts.length-1]; g+=`<circle cx="${l[0]}" cy="${l[1]}" r="4" fill="${s.color}"/>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">${g}</svg>${legend(series)}`;
}
function donut(items, center){
  const tot=sum(items,'value'); const R=70, r=46, cx=90, cy=90; let a=-Math.PI/2, g='';
  if(!tot) g=`<circle cx="${cx}" cy="${cy}" r="${(R+r)/2}" fill="none" stroke="var(--line)" stroke-width="${R-r}"/>`;
  items.filter(i=>i.value>0).forEach(it=>{
    const da=it.value/tot*Math.PI*2; const a2=a+da-(items.filter(i=>i.value>0).length>1?0.02:0.0001);
    const p=(ang,rad)=>[cx+rad*Math.cos(ang), cy+rad*Math.sin(ang)]; const lg=da>Math.PI?1:0;
    const [x1,y1]=p(a,R),[x2,y2]=p(a2,R),[x3,y3]=p(a2,r),[x4,y4]=p(a,r);
    g+=`<path d="M${x1},${y1} A${R},${R} 0 ${lg} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${lg} 0 ${x4},${y4}Z" fill="${it.color}"><title>${esc(it.label)}: ${it.value}</title></path>`; a+=da;
  });
  g+=`<text x="${cx}" y="${cy-2}" text-anchor="middle" style="font-size:24px;fill:var(--ink);font-family:var(--f-num)">${esc(center??tot)}</text><text x="${cx}" y="${cy+16}" text-anchor="middle">dự án</text>`;
  return `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 180 180" style="width:170px;max-width:100%">${g}</svg><div class="list small">${items.map(i=>`<div><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${i.color};margin-right:6px"></i>${esc(i.label)} <b class="num">${i.value}</b></div>`).join('')}</div></div>`;
}
/* Đường cong S kế hoạch – thực tế theo tháng */
function sCurve(scheds){
  if(!scheds.length) return null;
  const st=scheds.map(s=>s.planStart).sort()[0], en=scheds.map(s=>s.planEnd).sort().slice(-1)[0];
  const months=[]; let d=new Date(st.slice(0,7)+'-01');
  while(isoLocal(d)<=en){ months.push(isoLocal(new Date(d.getFullYear(), d.getMonth()+1, 0))); d=new Date(d.getFullYear(), d.getMonth()+1, 1); if(months.length>60) break; }
  const plan=months.map(m=>wavg(scheds, s=>expectedPct(s,m)));
  const act=months.map(m=>m<=addDays(TODAY,31)? wavg(scheds, s=>progressAt(s, m>TODAY?TODAY:m)) : null);
  return {labels:months.map(m=>m.slice(5,7)+'/'+m.slice(2,4)), plan, act};
}
