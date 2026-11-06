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
  shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  cam:'<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  wallet:'<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-4 2 4M16 13.5h2"/>',
  stamp:'<path d="M9 3h6l-1 7h4l1 4H5l1-4h4zM5 18h14M7 21h10"/>',
  seal:'<circle cx="12" cy="9" r="6"/><path d="m9 9 2 2 4-4M8.5 14 7 22l5-3 5 3-1.5-8"/>',
  map:'<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  auto:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>',
  palette:'<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15.5" cy="7.5" r="1"/>'
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
  {key:'von', label:'Kế hoạch vốn, giải ngân', icon:'wallet', grp:'Điều hành'},
  {key:'gpmb', label:'Giải phóng mặt bằng', icon:'map', grp:'Nghiệp vụ'},
  {key:'mo-hinh', label:'Mô hình hóa công trình', icon:'cube', grp:'Nghiệp vụ'},
  {key:'goi-thau', label:'Gói thầu và hợp đồng', icon:'doc', grp:'Nghiệp vụ'},
  {key:'tien-do', label:'Quản lý tiến độ', icon:'gantt', grp:'Nghiệp vụ'},
  {key:'nhat-ky', label:'Nhật ký thi công', icon:'book', grp:'Nghiệp vụ'},
  {key:'khoi-luong', label:'Quản lý khối lượng', icon:'ruler', grp:'Nghiệp vụ'},
  {key:'nghiem-thu', label:'Nghiệm thu, bàn giao, bảo hành', icon:'stamp', grp:'Nghiệp vụ'},
  {key:'thanh-toan', label:'Quản lý thanh toán', icon:'coin', grp:'Nghiệp vụ'},
  {key:'quyet-toan', label:'Quyết toán dự án', icon:'seal', grp:'Nghiệp vụ'},
  {key:'bao-cao', label:'Báo cáo, thống kê', icon:'chart', grp:'Khai thác'},
  {key:'quan-tri', label:'Quản trị hệ thống', icon:'gear', grp:'Khai thác'}
];
const EXTRA_ROUTES = ['hien-truong','doi-chieu','huong-dan','trinh-duyet'];
const APP_VERSION = '1.7';
/* Thông tin đơn vị và nhận diện giao diện: quản trị hệ thống cập nhật tại Quản trị hệ thống → Thông tin đơn vị, giao diện */
const BR_DEF = {appName:'Quản lý dự án, nhiệm vụ', orgShort:'Ban QLDA xã/phường …', orgName:'Ủy ban nhân dân xã/phường …', unitName:'Ban Quản lý dự án đầu tư xây dựng',
  bannerTitle:'Phần mềm quản lý dự án đầu tư xây dựng', bannerText:'Theo dõi dự án, gói thầu, hợp đồng, tiến độ, khối lượng và thanh toán trên một hệ thống thống nhất.',
  address:'Địa chỉ: …', footer:'© {năm} Ban Quản lý dự án đầu tư xây dựng xã/phường …',
  reportOrg:'Ban QLDA đầu tư xây dựng xã/phường …', ownerDefault:'UBND xã/phường …', support:'Hỗ trợ: quản trị hệ thống của đơn vị', logo:null};
let BR = {...BR_DEF};
function setBrand(b){ BR={...BR_DEF, ...(b||{})}; document.title=BR.appName+' – '+BR.orgShort; }
const brandMark = () => BR.logo ? `<img src="${esc(BR.logo)}" alt="Logo ${esc(BR.orgShort)}">` : drumSVG();
const brandFoot = () => esc(BR.footer.replace(/\{năm\}/g, new Date().getFullYear()));
const COLS = ['projects','tasks','legal','items','models','packages','contracts','addenda','schedule','diaries','boq','volumes','vbatches','payplans','payments','capitals','acceptances','settlements','clearances','users','groups','catalogs','logs','attachments','guides','approvals'];
const COL_LABEL = {approvals:'Lịch sử trình duyệt',guides:'Hướng dẫn sử dụng',projects:'Dự án',tasks:'Công việc',legal:'Hồ sơ pháp lý',items:'Hạng mục công trình',models:'Tệp mô hình',packages:'Gói thầu',contracts:'Hợp đồng',addenda:'Phụ lục hợp đồng',schedule:'Tiến độ',diaries:'Nhật ký thi công',boq:'Khối lượng hợp đồng',volumes:'Khối lượng thực hiện',vbatches:'Đợt nghiệm thu khối lượng',payplans:'Kế hoạch thanh toán',payments:'Hồ sơ thanh toán',capitals:'Kế hoạch vốn',acceptances:'Nghiệm thu, bàn giao',settlements:'Quyết toán dự án',clearances:'Giải phóng mặt bằng',users:'Người dùng',groups:'Nhóm người dùng',catalogs:'Danh mục',logs:'Nhật ký hệ thống',attachments:'Tệp đính kèm'};

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

/* --- lưu trữ: máy chủ ứng dụng ASP.NET Core + CSDL (PostgreSQL / SQL Server / SQLite), giao tiếp qua API --- */
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
  meta:{ownerId:'', wfCheck:[]},
  mode:'loading', initialized:false, sampleUsers:false, setupToken:false, error:'',
  data:Object.fromEntries(COLS.map(c=>[c,[]])),
  _timer:0,
  async init(){
    try{
      const [s,b]=await Promise.all([api('GET','/api/auth/state'), api('GET','/api/branding',undefined,{auth:true}).catch(()=>null)]);
      setBrand(b);
      this.initialized=s.initialized; this.sampleUsers=s.sampleUsers; this.setupToken=!!s.setupToken; S.user=s.user||null; S.mfa=s.mfa||null;
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
    this.meta={ownerId:d.ownerId||'', wfCheck:Array.isArray(d.wfCheck)?d.wfCheck:[]};
    const me=S.user && this.data.users.find(u=>u.id===S.user.id); if(me) S.user={...S.user,...me};
    if(S.user) UI.load(S.user);
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
    this.data[col]=this.data[col].filter(x=>x.id!==id);
    this.data.attachments=this.data.attachments.filter(a=>!(a.collection===col && a.recordId===id)); /* tệp của bản ghi đã chuyển vào thùng rác */
    onData(); this.soon();
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
  if(mod==='hien-truong'||mod==='doi-chieu'||mod==='huong-dan'||mod==='trinh-duyet') return !!S.user;
  const g=myGroup(); if(!g) return false; if(g.admin) return true;
  if(lvl==='approve') return (g.perms||{})[mod+':duyet']==='1';
  if(lvl==='check') return (g.perms||{})[mod+':kiemtra']==='1';
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
/* Phụ lục hợp đồng: chỉ phụ lục đã duyệt mới cộng vào giá trị, thời hạn hợp đồng (phụ lục nhập trước bản 1.2 không có trạng thái, coi là đã duyệt) */
const ADD_STATUS = ['Soạn thảo','Chờ duyệt','Đã duyệt','Từ chối'];
const addApproved = a => !a.status || a.status==='Đã duyệt';
const addPending = a => a.status==='Soạn thảo' || a.status==='Chờ duyệt';
function contractValue(c){ return N(c.value) + sum(D('addenda').filter(a=>a.contractId===c.id && addApproved(a)),'valueChange'); }
function contractEnd(c){ const d=sum(D('addenda').filter(a=>a.contractId===c.id && addApproved(a)),'daysChange'); return c.end? addDays(c.end,d) : ''; }
/** Phụ lục đang soạn thảo, chờ duyệt của hợp đồng: chưa tính vào hợp đồng, chỉ để nhắc. */
function contractPending(c){ const xs=D('addenda').filter(a=>a.contractId===c.id && addPending(a)); return {n:xs.length, value:sum(xs,'valueChange'), days:sum(xs,'daysChange')}; }
/* Bản 1.7: đợt nghiệm thu khối lượng. Dòng không thuộc đợt nào là dữ liệu trước bản 1.7, coi như đã nghiệm thu.
   Khối lượng thực hiện tính mọi đợt (trừ đợt bị từ chối); khối lượng nghiệm thu chỉ tính đợt đã duyệt. */
const VB_DISP = {'Soạn thảo':'Dự thảo','Chờ kiểm tra':'Chờ TVGS xác nhận','Chờ duyệt':'Chờ duyệt nghiệm thu','Đã duyệt':'Đã nghiệm thu','Từ chối':'Không nghiệm thu'};
const batchOf = v => v.batchId ? get('vbatches', v.batchId) : null;
function volAccOk(v){ const b=batchOf(v); return !b || !b.status || b.status==='Đã duyệt'; }
function volLive(v){ const b=batchOf(v); return !b || b.status!=='Từ chối'; }
function volAccPend(v){ const b=batchOf(v); return !!b && (b.status==='Chờ kiểm tra' || b.status==='Chờ duyệt'); }
function boqDone(b, upto){ return sum(D('volumes').filter(v=>v.boqId===b.id && volLive(v) && (!upto||v.date<=upto)),'doneQty'); }
function boqAcc(b, upto){ return sum(D('volumes').filter(v=>v.boqId===b.id && volAccOk(v) && (!upto||v.date<=upto)),'acceptedQty'); }
/** Lũy kế khối lượng nghiệm thu đã ghi (mọi đợt chưa bị từ chối), dùng để kiểm tra theo lũy kế (mục 29). */
function boqAccAll(b){ return sum(D('volumes').filter(v=>v.boqId===b.id && volLive(v)),'acceptedQty'); }
/** Giá trị nghiệm thu đang chờ xác nhận, chờ duyệt của hợp đồng. */
function contractAccPend(cid){ return sum(D('volumes').filter(v=>v.contractId===cid && volAccPend(v)), v=>N(v.acceptedQty)*N((get('boq',v.boqId)||{}).price)); }
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
/** Kế hoạch tiến độ đã duyệt (bản 1.5): chỉ những kế hoạch này được tính tiến độ, đường cong S, cảnh báo và được cập nhật thực tế.
 *  Kế hoạch chưa có trạng thái (dữ liệu trước bản 1.5) coi là đã duyệt. */
function schedOk(s){ return !s.status || s.status==='Đã duyệt'; }
const SCHED = () => D('schedule').filter(schedOk);
/** Bình quân theo trọng số: chỉ dùng cho các đầu việc trong CÙNG một gói thầu (trọng số do cán bộ phụ trách gói đặt). */
function wavg(items, f){ const w=sum(items, s=>N(s.weight)||1); return w? sum(items, s=>(N(s.weight)||1)*f(s))/w : 0; }
/** Giá trị của gói thầu dùng để quy đổi tiến độ: giá trị hợp đồng sau điều chỉnh (phụ lục đã duyệt), chưa có hợp đồng thì lấy giá gói thầu. */
function pkgValue(kid){ const c=contractOfPkg(kid); const v=c? contractValue(c) : 0; return v>0? v : N((pkgOf(kid)||{}).estimate); }
/** Tiến độ gộp nhiều gói thầu (dự án, hạng mục): trọng số của đầu việc chỉ so được trong gói, nên quy ra giá trị
 *  = giá trị gói × trọng số ÷ tổng trọng số các đầu việc của gói, rồi bình quân theo giá trị. Gói chưa có giá trị
 *  lấy bằng bình quân các gói đã có giá trị; nếu không gói nào có giá trị thì bình quân theo trọng số như cũ. */
function vavg(items, f){
  if(!items.length) return 0;
  const keys=[...new Set(items.map(s=>s.packageId||''))];
  const pv={}; keys.forEach(k=>pv[k]=k?pkgValue(k):0);
  const known=keys.filter(k=>pv[k]>0); if(!known.length) return wavg(items,f);
  const avg=sum(known,k=>pv[k])/known.length;
  const tw={}; keys.forEach(k=>tw[k]=sum(SCHED().filter(s=>(s.packageId||'')===k && (k || s.projectId===items[0].projectId)), s=>N(s.weight)||1)||1);
  const val=s=>{ const k=s.packageId||''; return (pv[k]>0?pv[k]:avg)*(N(s.weight)||1)/tw[k]; };
  const w=sum(items,val); return w? sum(items, s=>val(s)*f(s))/w : 0;
}
function projProgress(pid){ const p=projOf(pid); if(p && /hoàn thành|quyết toán/i.test(p.status||'') && !SCHED().some(s=>s.projectId===pid)) return 100; return vavg(SCHED().filter(s=>s.projectId===pid), s=>N(s.progress)); }
function projExpected(pid){ return vavg(SCHED().filter(s=>s.projectId===pid), s=>expectedPct(s)); }
function pkgProgress(kid){ return wavg(SCHED().filter(s=>s.packageId===kid), s=>N(s.progress)); }
function pkgExpected(kid){ return wavg(SCHED().filter(s=>s.packageId===kid), s=>expectedPct(s)); }
function itemProgress(it){ const ss=SCHED().filter(s=>s.itemId===it.id); return ss.length? vavg(ss,s=>N(s.progress)) : N(it.progress); }
/* --- vốn đầu tư công, giải ngân (phân hệ Kế hoạch vốn) --- */
const CAP_MINUS = 'Điều chỉnh giảm kế hoạch năm';
const isAnnualCap = c => c.kind && !/trung hạn/i.test(c.kind);
/** Kế hoạch vốn năm của dự án (vốn năm + bổ sung − điều chỉnh giảm). */
function capPlan(pid, year){ return sum(D('capitals').filter(c=>c.projectId===pid && N(c.year)===N(year) && isAnnualCap(c)), c=>c.kind===CAP_MINUS? -N(c.amount) : N(c.amount)); }
function capMidTerm(pid){ return sum(D('capitals').filter(c=>c.projectId===pid && /trung hạn/i.test(c.kind||'')),'amount'); }
/** Ngày Kho bạc chi (giải ngân) của hồ sơ thanh toán. */
const payDay = p => p.paidDate || p.date || '';
/** Giá trị giải ngân trong năm của dự án đến ngày upto (hồ sơ đã thanh toán, không tính thu hồi tạm ứng). */
function disbursed(pid, year, upto){ const y=String(year); return sum(D('payments').filter(p=>p.status==='Đã thanh toán' && p.kind!=='Thu hồi tạm ứng' && payDay(p).startsWith(y) && (!upto||payDay(p)<=upto) && contractPid(get('contracts',p.contractId)||{})===pid),'amount'); }
/** Kịch bản giải ngân lũy kế (%) đến hết quý q (1–4) của dự án trong năm; mặc định 20/45/70/100. */
function capTarget(pid, year, q){ if(q>=4) return 100; const c=D('capitals').find(x=>x.projectId===pid && N(x.year)===N(year) && x.kind==='Kế hoạch vốn năm'); const d=[20,45,70][q-1]; const v=c&&c['targetQ'+q]; return v==null||v===''? d : N(v); }
/** Kịch bản giải ngân đến ngày date: nội suy tuyến tính trong quý. */
function capTargetAt(pid, year, date=TODAY){ const y=N(year); if(N(date.slice(0,4))<y) return 0; if(N(date.slice(0,4))>y) return 100;
  const m=N(date.slice(5,7)), q=Math.floor((m-1)/3)+1; const qs=y+'-'+pad((q-1)*3+1)+'-01', qe=q<4? y+'-'+pad(q*3+1)+'-01' : (y+1)+'-01-01';
  const a=q>1? capTarget(pid,y,q-1) : 0, b=capTarget(pid,y,q); return a+(b-a)*Math.min(1,days(qs,date)/Math.max(1,days(qs,qe))); }
/* --- kế hoạch thanh toán: tình trạng từng đợt (dùng chung cho bảng, cảnh báo, báo cáo) --- */
/** Số đã thanh toán của đợt kế hoạch: các hồ sơ thanh toán gắn với đợt ở trạng thái Đã thanh toán. */
function planPaid(p){ return sum(D('payments').filter(x=>x.payPlanId===p.id && x.status==='Đã thanh toán'),'amount'); }
/** Tình trạng đợt: Đã thực hiện (có hồ sơ gắn đợt đã được chi) · Đang trình thanh toán · Quá hạn N ngày · Sắp đến hạn (15 ngày) · Chưa đến hạn. */
function planState(p){
  const ps=D('payments').filter(x=>x.payPlanId===p.id), paid=planPaid(p);
  if(ps.some(x=>x.status==='Đã thanh toán')) return {k:'ok', t:'Đã thực hiện', paid};
  const proc=ps.some(payInProc);
  const left=p.planDate? days(TODAY,p.planDate) : null;
  if(left!==null && left<0) return {k:'bad', t:'Quá hạn '+(-left)+' ngày'+(proc?', đang trình':''), paid, late:-left, proc};
  if(proc) return {k:'info', t:'Đang trình thanh toán', paid};
  if(left!==null && left<=15) return {k:'warn', t:left? 'Còn '+left+' ngày đến hạn' : 'Đến hạn hôm nay', paid};
  return {k:'', t:'Chưa đến hạn', paid};
}
/* --- nghiệm thu, quyết toán, GPMB --- */
function warrantyEnd(a){ return a.warrantyUntil || (a.date && N(a.warrantyMonths)? isoLocal(new Date(new Date(a.date).setMonth(new Date(a.date).getMonth()+N(a.warrantyMonths)))) : ''); }
function settleState(x){
  if(x.closedDate) return {k:'ok', t:'Đã tất toán'};
  if(x.approvalDate) return {k:'acc', t:'Chờ tất toán'};
  if(x.submittedDate) return {k:'info', t:'Đã trình thẩm tra'};
  if(x.deadline && x.deadline<TODAY) return {k:'bad', t:'Quá hạn '+days(x.deadline,TODAY)+' ngày'};
  if(x.deadline && days(TODAY,x.deadline)<=30) return {k:'warn', t:'Còn '+days(TODAY,x.deadline)+' ngày đến hạn'};
  return {k:'', t:'Đang lập hồ sơ'};
}
function clearPct(c){ return N(c.area)? pct(N(c.handedArea),N(c.area)) : N(c.households)? pct(N(c.householdsPaid),N(c.households)) : 0; }
function catalog(type){ return D('catalogs').filter(c=>c.type===type).sort(by('order')).map(c=>c.value); }

/* --- cảnh báo (UC19, UC37) --- */
function alerts(){
  const out=[];
  SCHED().filter(s=>inFilter(s.projectId)).forEach(s=>{
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
  /* Bảo lãnh hợp đồng, giấy phép… sắp hết hiệu lực (trước 30 ngày) hoặc đã hết hiệu lực */
  /* keep=true: nhắc mãi đến khi được cập nhật (bảo lãnh HĐ, giấy phép); bảo hành hết hạn là bình thường nên chỉ nhắc 90 ngày */
  const expiry=(until, label, mod, keep=true)=>{ if(!until) return; const left=days(TODAY,until);
    if(left<0 && (keep || left>=-90)) out.push({lvl:'bad', mod, text:`${label} đã hết hiệu lực từ ${fmtDate(until)} (${-left} ngày).`});
    else if(left>=0 && left<=30) out.push({lvl:'warn', mod, text:`${label} sắp hết hiệu lực: còn ${left} ngày (đến ${fmtDate(until)}).`}); };
  D('contracts').filter(c=>inFilter(contractPid(c))).forEach(c=>{ const k=pkgOf(c.packageId); if(k && /thanh lý/i.test(k.status||'')) return;
    expiry(c.guaranteeUntil, `Bảo lãnh thực hiện HĐ <b>${esc(c.number)}</b>`, 'goi-thau');
    if(pct(contractPaid(c.id),contractValue(c))<100) expiry(c.advanceGuaranteeUntil, `Bảo lãnh tạm ứng HĐ <b>${esc(c.number)}</b>`, 'goi-thau'); });
  D('legal').filter(l=>l.validUntil && inFilter(l.projectId)).forEach(l=>{ const p=projOf(l.projectId); if(p && /hoàn thành|quyết toán/i.test(p.status||'')) return;
    const k=l.packageId&&pkgOf(l.packageId); expiry(l.validUntil, `${esc(l.type)} <b>${esc(l.number)}</b> (${esc(k?k.code:(p?p.code:''))})`, k?'goi-thau':'du-an'); });
  /* Đợt thanh toán quá hạn: nhắc cho đến khi đợt được thực hiện (không còn tự mất sau 60 ngày); nhiều đợt thì gom một dòng */
  const lates=D('payplans').map(p=>({p, c:get('contracts',p.contractId), st:planState(p)})).filter(x=>x.c && inFilter(contractPid(x.c)) && x.st.late && pct(contractPaid(x.c.id),contractValue(x.c))<100).sort((a,b)=>b.st.late-a.st.late);
  if(lates.length>3) out.push({lvl:lates.some(x=>x.st.late>30)?'bad':'warn', mod:'thanh-toan', text:`<b>${lates.length} đợt kế hoạch thanh toán quá hạn</b> chưa thực hiện, tổng ${fmtTy(sum(lates,x=>N(x.p.amount)))}; lâu nhất ${lates[0].st.late} ngày (đợt ${esc(lates[0].p.phase)} HĐ ${esc(lates[0].c.number)}).`});
  else lates.forEach(({p,c,st})=>out.push({lvl:st.late>30?'bad':'warn', mod:'thanh-toan', text:`Kế hoạch thanh toán <b>${esc(p.phase)}</b> HĐ ${esc(c.number)} (${fmtTy(p.amount)}) đến hạn ${fmtDate(p.planDate)}, quá hạn ${st.late} ngày chưa thực hiện${st.proc?' (hồ sơ đang trình)':''}.`}));
  /* Hồ sơ chờ người dùng duyệt (phụ lục, thanh toán, nghiệm thu) */
  if(typeof WF!=='undefined'){ const mine=wfMine().filter(x=>inFilter(WF[x.col].pid(x.r))); if(mine.length) out.unshift({lvl:'warn', mod:'trinh-duyet', text:`Có <b>${mine.length} hồ sơ chờ bạn duyệt</b>: ${esc([...new Set(mine.map(x=>WF[x.col].name.toLowerCase()))].join(', '))}.`}); }
  /* Giải ngân năm hiện tại thấp hơn kịch bản */
  const Y=TODAY.slice(0,4);
  projects().filter(p=>inFilter(p.id)).forEach(p=>{ const plan=capPlan(p.id,Y); if(!plan) return;
    const done=pct(disbursed(p.id,Y),plan), tg=capTargetAt(p.id,Y);
    if(tg-done>10) out.push({lvl:tg-done>25?'bad':'warn', mod:'von', text:`Dự án <b>${esc(p.code)}</b> giải ngân năm ${Y} mới đạt ${fmtP(done)} kế hoạch vốn (kịch bản đến nay ${fmtP(tg)}).`}); });
  /* Bảo hành, bảo lãnh bảo hành sắp hết hoặc đã hết */
  D('acceptances').filter(a=>inFilter(a.projectId)).forEach(a=>{ const p=projOf(a.projectId)||{}; const k=a.packageId&&pkgOf(a.packageId);
    const w=warrantyEnd(a); if(w) expiry(w, `Thời hạn bảo hành ${esc(k?k.code:p.code||'')} (${esc(a.number||a.kind||'')})`, 'nghiem-thu', false);
    expiry(a.warrantyGuaranteeUntil, `Bảo lãnh bảo hành ${esc(k?k.code:p.code||'')}`, 'nghiem-thu', false); });
  /* Quyết toán quá hạn, đã phê duyệt mà chưa tất toán */
  D('settlements').filter(x=>inFilter(x.projectId)).forEach(x=>{ const p=projOf(x.projectId)||{}; const st=settleState(x);
    if(st.k==='bad'||st.k==='warn') out.push({lvl:st.k, mod:'quyet-toan', text:`Quyết toán dự án <b>${esc(p.code||'')}</b>: ${st.t.toLowerCase()} (hạn ${fmtDate(x.deadline)}).`});
    else if(st.k==='acc' && days(x.approvalDate,TODAY)>60) out.push({lvl:'warn', mod:'quyet-toan', text:`Dự án <b>${esc(p.code||'')}</b> đã phê duyệt quyết toán ${days(x.approvalDate,TODAY)} ngày nhưng chưa tất toán tài khoản.`}); });
  /* Mặt bằng chưa bàn giao đúng hạn */
  D('clearances').filter(c=>inFilter(c.projectId) && !c.handoverDate && c.handoverDue && c.handoverDue<TODAY).forEach(c=>{ const p=projOf(c.projectId)||{};
    out.push({lvl:'bad', mod:'gpmb', text:`Mặt bằng <b>${esc(c.name)}</b> (${esc(p.code||'')}) chậm bàn giao ${days(c.handoverDue,TODAY)} ngày, đạt ${fmtP(clearPct(c))}.`}); });
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
/* Phân trang dùng chung cho mọi bảng: mặc định 20 dòng/trang, chọn 20/50/100/tất cả (nhớ theo máy); dòng tổng do nơi gọi tính trên toàn bộ dữ liệu */
const PG_SIZES=[20,50,100,0];
function pgSize(){ try{ const r=localStorage.getItem('qlda-pgsize'); const v=r==null? 20 : +r; return PG_SIZES.includes(v)? v : 20; }catch{ return 20; } }
function pager(key, total, page, size){
  const pages=Math.max(1,Math.ceil(total/size)); const b=(p,l,dis,t)=>`<button type="button" class="btn sm ghost" data-act="pg" data-id="${esc(key)}" data-p="${p}" ${dis?'disabled':''} title="${t}" aria-label="${t}">${l}</button>`;
  return `<div class="pager"><span class="small muted">${(page-1)*size+1}–${Math.min(total,page*size)} / ${total} dòng</span><span class="sp"></span>
    ${b(1,'«',page<=1,'Trang đầu')}${b(page-1,'‹',page<=1,'Trang trước')}<span class="small">Trang <b>${page}</b>/${pages}</span>${b(page+1,'›',page>=pages,'Trang sau')}${b(pages,'»',page>=pages,'Trang cuối')}
    <select class="pg-size" aria-label="Số dòng mỗi trang">${PG_SIZES.map(n=>`<option value="${n}" ${n===size?'selected':''}>${n?n+' dòng/trang':'Tất cả'}</option>`).join('')}</select></div>`;
}
function table(cols, rows, o={}){
  if(!rows.length) return emptyBox(o.empty||'Chưa có dữ liệu.');
  const size=o.nopage? 0 : pgSize(); let pg='';
  if(size && rows.length>size){
    const key=(S.route||'')+':'+(o.pk||cols.map(c=>c.h).join('|'));
    const pages=Math.ceil(rows.length/size); const page=Math.min(Math.max(1,(S.pg||{})[key]||1),pages);
    pg=pager(key, rows.length, page, size); rows=rows.slice((page-1)*size, page*size);
  }
  const head = cols.map(c=>`<th class="${c.r?'r':''}">${esc(c.h)}</th>`).join('') + (o.actions?'<th></th>':'');
  const body = rows.map(r=>`<tr class="${o.rowAct?'click':''}" ${o.rowAct?`data-act="${o.rowAct}" data-id="${esc(r.id)}"`:''}>${cols.map(c=>`<td class="${c.r?'r':''}" data-label="${esc(c.h)}">${c.f?c.f(r):esc(r[c.k])}</td>`).join('')}${o.actions?`<td class="acts">${o.actions(r)}</td>`:''}</tr>`).join('');
  /* dòng tổng cũng gắn nhãn cột: trên điện thoại bảng thành thẻ, thiếu nhãn thì chỉ thấy một cột số (góp ý Triển khai, mục 14) */
  const foot = o.foot? `<tfoot><tr>${o.foot.map((f,i)=>`<td class="${cols[i]&&cols[i].r?'r':''}"${i&&cols[i]?` data-label="${esc(cols[i].h)}"`:''}>${f??''}</td>`).join('')}${o.actions?'<td></td>':''}</tr></tfoot>`:'';
  return `<div class="tw rt"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${foot}</table></div>${pg}`;
}
const editBtns = (mod, col, id, extra='') => can(mod,'edit') ? `${extra}<button class="btn sm ghost" data-act="edit-${col}" data-id="${esc(id)}">Sửa</button><button class="btn sm ghost danger" data-act="del" data-col="${col}" data-id="${esc(id)}">Xóa</button>` : extra;

/* Hộp thoại biểu mẫu */
function fieldHTML(f, v, rec={}){
  const id='f_'+f.key, req=f.req?' <span class="req">*</span>':'';
  const cls='fld'+(f.full||f.type==='textarea'||f.type==='works'||f.type==='checks'||f.type==='files'||f.type==='attach'?' full':'');
  let input='';
  const val = v ?? f.def ?? '';
  switch(f.type){
    case 'textarea': input=`<textarea id="${id}" rows="${f.rows||3}" placeholder="${esc(f.ph||'')}">${esc(val)}</textarea>`; break;
    case 'works': input=worksHTML(id, val, f); break;
    case 'select': { const list=typeof f.options==='function'?f.options(f.dep? rec[f.dep] : undefined):f.options; input=`<select id="${id}">${opts(list,val, f.req?null:'— Chọn —')}</select>`; break; }
    case 'money': input=`<input id="${id}" type="number" step="1" min="0" value="${esc(val)}" data-money><span class="hint" id="${id}_h">${val!==''?fmtVND(val)+' đồng':''}</span>`; break;
    case 'number': case 'percent': input=`<input id="${id}" type="number" step="any" ${f.type==='percent'?'min="0" max="100"':''} value="${esc(val)}">`; break;
    case 'date': input=`<input id="${id}" type="date" value="${esc(val)}">`; break;
    case 'password': input=`<input id="${id}" type="password" autocomplete="new-password" value="">`; break;
    case 'checks': { const list=typeof f.options==='function'?f.options():f.options; const cur=Array.isArray(val)?val:[]; input=`<div class="checks" id="${id}">${list.map(o=>{const [ov,ol]=Array.isArray(o)?o:[o,o]; return `<label><input type="checkbox" value="${esc(ov)}" ${cur.includes(ov)?'checked':''}> ${esc(ol)}</label>`;}).join('')}</div>`; break; }
    case 'files': input=`<input id="${id}" type="file" ${f.multiple?'multiple':''} accept="${esc(f.accept||'')}">${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}`; break;
    case 'attach': input=attachHTML(f, rec); break;
    case 'html': input=f.html; break;
    default: input=`<input id="${id}" type="text" value="${esc(val)}" placeholder="${esc(f.ph||'')}">`;
  }
  return `<div class="${cls}"><label for="${id}">${esc(f.label)}${req}</label>${input}</div>`;
}
function openModal(html, narrow){
  const ov=$('#ov'); ov.innerHTML=html; ov.hidden=false;
  fitTables(ov);
  const first=ov.querySelector('input:not([type=checkbox]):not([type=file]),select,textarea'); if(first) setTimeout(()=>first.focus(),30);
  return ov;
}
function closeModal(){ const ov=$('#ov'); ov.hidden=true; ov.innerHTML=''; if(S.dirty){ S.dirty=false; render(); } }
function openForm({title, fields, value={}, onSave, narrow, wide, submit='Lưu'}){
  const ov=openModal(`<form class="mform ${narrow?'narrow':''} ${wide?'wide':''}" id="mform" novalidate><header><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div class="fgrid">${fields.map(f=>fieldHTML(f, value[f.key], value)).join('')}</div><footer><span class="small muted" id="mform_err" style="flex:1;color:var(--red)"></span><button type="button" class="btn ghost" data-close>Hủy</button><button class="btn primary" type="submit">${esc(submit)}</button></footer></form>`);
  ov.querySelectorAll('[data-money]').forEach(inp=>inp.addEventListener('input',()=>{ const h=$('#'+inp.id+'_h'); if(h) h.textContent=inp.value?fmtVND(inp.value)+' đồng':''; }));
  const form=$('#mform');
  fields.filter(f=>f.type==='attach').forEach(f=>attachWire($('#f_'+f.key)));
  /* Ô chọn phụ thuộc ô khác (dep): đổi ô gốc thì nạp lại danh sách */
  fields.filter(f=>f.dep && f.type==='select').forEach(f=>{ const src=$('#f_'+f.dep), el=$('#f_'+f.key); if(!src||!el) return;
    const fill=()=>{ const cur=el.value; el.innerHTML=opts(f.options(src.value), cur, f.req?null:'— Chọn —'); };
    fill(); src.addEventListener('change', fill); });
  form.onsubmit=async e=>{
    e.preventDefault();
    const v={...value}; const err=$('#mform_err'); err.textContent='';
    for(const f of fields){
      if(f.type==='html') continue;
      const el=$('#f_'+f.key);
      if(f.type==='attach'){ const n=el._keep()+el._files.length; if(f.req && !n){ err.textContent='Vui lòng đính kèm "'+f.label+'".'; return; } continue; }
      if(f.type==='checks') v[f.key]=$$('input:checked',el).map(i=>i.value);
      else if(f.type==='files') v[f.key]=[...el.files];
      else if(f.type==='password') v[f.key]=el.value;
      else if(f.type==='works'){ const r=worksRead(el); if(r.err){ err.textContent=r.err; return; } v[f.key]=r.text; }
      else if(['money','number','percent'].includes(f.type)) v[f.key]= el.value===''? null : Number(el.value);
      else v[f.key]=el.value.trim();
      if(f.req && (v[f.key]==null || v[f.key]==='' || (Array.isArray(v[f.key])&&!v[f.key].length))){ err.textContent='Vui lòng nhập "'+f.label+'".'; el.focus&&el.focus(); return; }
      if(f.type==='percent' && v[f.key]!=null && (v[f.key]<0||v[f.key]>100)){ err.textContent='"'+f.label+'" phải từ 0 đến 100.'; return; }
    }
    const btn=form.querySelector('[type=submit]'); btn.disabled=true; btn.textContent='Đang lưu…';
    try{ const r=await onSave(v); if(r===false){ btn.disabled=false; btn.textContent=submit; return; }
      const atf=fields.filter(f=>f.type==='attach');
      if(atf.length){ const failed=await attachApply(atf, r, v, btn); if(failed){ closeModal(); toast('Đã lưu dữ liệu nhưng '+failed,'err'); return; } }
      closeModal(); toast('Đã lưu'); }
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

/* ===== Tệp đính kèm dùng chung cho mọi màn hình nhập liệu =====
   Trường biểu mẫu {type:'attach', col, kind?, ref?/refFrom?, rid?, photo?, accept?}:
   - col: loại bản ghi nhận tệp (mặc định là bản ghi của biểu mẫu); rid(r,v): mã bản ghi nhận tệp sau khi lưu
   - kind: loại tài liệu; ref / refFrom: tham chiếu phụ (đợt nghiệm thu, ngày cập nhật…)
   - Tệp mới được tải lên sau khi lưu bản ghi; tệp gỡ ra chuyển vào thùng rác (quản trị khôi phục được 30 ngày) */
const ATT_ACCEPT = '.pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.dwg,.zip,.rar,.7z,.mpp,.xml,.txt';
const VIDEO_ACCEPT = 'video/*,.mp4,.webm,.mov';
function atts(col, id, kind, ref){ if(!id) return []; return D('attachments').filter(a=>a.collection===col && a.recordId===id && (kind==null||a.kind===kind) && (ref==null||(a.ref||'')===ref)).sort(by('uploadedAt')); }
const attUrl = a => '/api/files/'+encodeURIComponent(a.fileId);
const AICO={"clip": "<svg class=\"aico\" viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9\"/></svg>", "img": "<svg class=\"aico\" viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><circle cx=\"9\" cy=\"10\" r=\"2\"/><path d=\"M21 16l-5-5-9 9\"/></svg>", "doc": "<svg class=\"aico\" viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z\"/><path d=\"M14 3v6h6\"/></svg>", "cam": "<svg class=\"aico\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 8h3l2-3h6l2 3h3v11H4z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/></svg>"};
const attIcon = a => /^image\//.test(a.contentType)?AICO.img:/pdf|word|sheet|excel|text/.test(a.contentType)?AICO.doc:AICO.clip;
function attMeta(a){ return `${fmtSize(a.size)} · ${esc(a.uploadedBy||'')} · ${fmtDT(a.uploadedAt)}`; }
/* Danh sách tệp gọn để hiển thị trong trang (bấm để xem; ảnh mở khung xem nhanh) */
function attLinks(list, opt={}){
  if(!list.length) return opt.empty ?? '<span class="muted small">Chưa đính kèm</span>';
  const max=opt.max||99; const shown=list.slice(0,max);
  return `<span class="attl">${shown.map(a=>`<a href="${attUrl(a)}" target="_blank" rel="noopener" ${/^image\//.test(a.contentType)?`data-act="att-view" data-id="${esc(a.id)}"`:isPdf(a)?pdfAttr(attUrl(a),a.fileName):''} title="${esc(a.fileName)} · ${attMeta(a)}">${attIcon(a)} ${esc(a.fileName)}</a>`).join('')}${list.length>max?`<button class="btn sm ghost" data-act="att-all" data-id="${esc(list.map(a=>a.id).join(','))}">+${list.length-max} tệp</button>`:''}</span>`;
}
/* Ô "Tệp" trong bảng: 1 tệp hiện tên, nhiều tệp hiện số lượng (bấm xem danh sách) */
function attCell(list, btnOnly){ if(!list.length) return '<span class="muted small">—</span>'; if(list.length===1 && !btnOnly) return attLinks(list); return `<button class="btn sm ghost" data-act="att-all" data-id="${esc(list.map(a=>a.id).join(','))}">${AICO.clip} ${list.length} tệp</button>`; }
function attachHTML(f, rec){
  const rid=f.cur!==undefined? f.cur : rec.id;
  const ref=f.ref!=null? f.ref : (f.refFrom? (rec[f.refFrom]||'') : null);
  const cur=rid? atts(f.col, rid, f.kind, ref) : [];
  return `<div class="attbox" id="f_${f.key}"><ul class="attlist">${cur.map(a=>`<li data-aid="${esc(a.id)}"><a href="${attUrl(a)}" target="_blank" rel="noopener" ${isPdf(a)?pdfAttr(attUrl(a),a.fileName):''}>${attIcon(a)} ${esc(a.fileName)}</a><span class="small muted">${attMeta(a)}</span><button type="button" class="btn sm ghost" data-attdel title="Gỡ tệp này">Gỡ</button></li>`).join('')}</ul>
    <label class="attdrop"><input type="file" multiple accept="${esc(f.accept||ATT_ACCEPT)}"><span>${f.photo?AICO.cam+' Chụp ảnh / chọn ảnh':AICO.clip+' Chọn tệp'} hoặc kéo thả vào đây</span></label><ul class="attlist attnew"></ul>${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}</div>`;
}
function attachWire(box){
  box._files=[]; box._del=new Set();
  box._keep=()=>$$('li[data-aid]',box).filter(li=>!box._del.has(li.dataset.aid)).length;
  const inp=$('input[type=file]',box), lst=$('.attnew',box);
  const draw=()=>{ lst.innerHTML=box._files.map((f,i)=>`<li><span>${/^image\//.test(f.type)?AICO.img:AICO.clip} ${esc(f.name)}</span><span class="small muted">${fmtSize(f.size)} · sẽ tải lên khi lưu</span><button type="button" class="btn sm ghost" data-i="${i}">Bỏ</button></li>`).join(''); };
  const add=fl=>{ for(const f of fl){ if(f.size>500*1024*1024){ toast('Tệp '+f.name+' vượt quá 500 MB.','err'); continue; } box._files.push(f); } draw(); };
  inp.onchange=()=>{ add([...inp.files]); inp.value=''; };
  const drop=$('.attdrop',box);
  drop.addEventListener('dragover',e=>{ e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave',()=>drop.classList.remove('over'));
  drop.addEventListener('drop',e=>{ e.preventDefault(); drop.classList.remove('over'); add([...e.dataTransfer.files]); });
  box.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.i!=null){ box._files.splice(+b.dataset.i,1); draw(); }
    else if(b.hasAttribute('data-attdel')){ const li=b.closest('li'); const id=li.dataset.aid;
      if(box._del.has(id)){ box._del.delete(id); li.classList.remove('del'); b.textContent='Gỡ'; } else { box._del.add(id); li.classList.add('del'); b.textContent='Hoàn tác'; } }
  });
}
async function uploadAttachment(file, col, rid, kind, ref, photo){
  let f=file; if(photo){ try{ if(/^image\/(jpeg|png|webp)/.test(file.type)) f=await downscale(file); }catch{} }
  const fd=new FormData(); fd.append('file',f, photo&&f!==file? f.name : file.name); fd.append('collection',col); fd.append('recordId',rid); if(kind) fd.append('kind',kind); if(ref) fd.append('ref',ref);
  const a=await api('POST','/api/attachments',fd); Store.data.attachments.push(a); return a;
}
/* Sau khi lưu bản ghi: gỡ tệp đánh dấu và tải tệp mới. Trả về thông báo lỗi (nếu có) */
async function attachApply(fields, r, v, btn){
  const errs=[]; let total=0, done=0;
  fields.forEach(f=>{ total+=$('#f_'+f.key)._files.length; });
  for(const f of fields){
    const box=$('#f_'+f.key);
    for(const id of box._del){ try{ await api('DELETE','/api/attachments/'+encodeURIComponent(id)); Store.data.attachments=Store.data.attachments.filter(a=>a.id!==id); }catch(ex){ errs.push(errText(ex)); } }
    if(!box._files.length) continue;
    const rid=typeof f.rid==='function'? f.rid(r,v) : (f.rid || (r&&r.id) || v.id);
    if(!rid){ errs.push('chưa xác định được bản ghi để đính kèm tệp'); continue; }
    const ref=f.ref!=null? f.ref : (f.refFrom? (v[f.refFrom]||'') : '');
    for(const file of box._files){
      if(btn) btn.textContent=`Đang tải tệp ${++done}/${total}…`;
      try{ await uploadAttachment(file, f.col, rid, f.kind, ref, f.photo); }catch(ex){ errs.push(file.name+': '+errText(ex)); }
    }
  }
  onData(); Store.soon();
  return errs.length? 'có '+errs.length+' tệp lỗi ('+errs[0]+')' : '';
}
/* Biểu mẫu nhỏ chỉ để đính kèm tệp vào một bản ghi có sẵn */
function attachForm(title, col, rid, kind, opt={}){
  openForm({title, narrow:true, value:{id:rid}, fields:[{key:'att',label:opt.label||'Tệp đính kèm',type:'attach',col,kind,ref:opt.ref,photo:opt.photo,accept:opt.accept,full:true,rid}], onSave:()=>({id:rid})});
}

/* Xuất tệp (Excel/JSON) */
async function saveFile(filename, data){
  try{ const blob=data instanceof Blob?data:new Blob([data]); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); toast('Đã tạo tệp '+filename); }
  catch(e){ toast('Trình duyệt không cho phép tải tệp.','err'); }
}
/* Bản 1.7: tệp Excel có định dạng (ExcelJS, giấy phép MIT, đóng gói kèm phần mềm, chỉ tải khi cần).
   sheets: [{name, title, sub, head, rows, money:[chỉ số cột tiền], total:true nếu dòng cuối là dòng tổng}] */
const LIBS={};
function loadLib(src, test){
  if(test()) return Promise.resolve();
  return LIBS[src] || (LIBS[src]=new Promise((ok,no)=>{ const el=document.createElement('script'); el.src=src; el.onload=()=>test()?ok():no(new Error('lib')); el.onerror=()=>{ delete LIBS[src]; no(new Error('Không tải được thư viện '+src)); }; document.head.appendChild(el); }));
}
const loadExcel = () => loadLib('/lib/exceljs.min.js', ()=>!!window.ExcelJS);
const XL = {font:'Times New Roman', head:'FF1F4E79', headInk:'FFFFFFFF', band:'FFF3F6FA', line:'FFB7C3D0', money:'#,##0', num:'#,##0.##'};
function xlBorder(c, strong){ const t={style:'thin', color:{argb:XL.line}}; c.border={top:t,left:t,bottom:strong?{style:'double',color:{argb:'FF333333'}}:t,right:t}; }
/** Một trang tính chuẩn văn phòng: tên đơn vị, tên báo cáo gộp ô, dòng tiêu đề tô màu, kẻ khung, số có phân cách hàng nghìn, dòng tổng in đậm. */
function xlSheet(wb, s){
  const ws=wb.addWorksheet(String(s.name||'Trang 1').slice(0,31), {views:[{state:'frozen', ySplit:5}], pageSetup:{paperSize:9, orientation:s.head.length>7?'landscape':'portrait', fitToPage:true, fitToWidth:1, fitToHeight:0}});
  const n=s.head.length, money=s.money||[];
  ws.mergeCells(1,1,1,n); const o=ws.getCell(1,1); o.value=(BR.reportOrg||BR.orgShort||'').toUpperCase(); o.font={name:XL.font, size:11, bold:true};
  ws.mergeCells(2,1,2,n); const t=ws.getCell(2,1); t.value=s.title; t.font={name:XL.font, size:14, bold:true}; t.alignment={horizontal:'center'};
  ws.mergeCells(3,1,3,n); const u=ws.getCell(3,1); u.value=s.sub||''; u.font={name:XL.font, size:11, italic:true}; u.alignment={horizontal:'center'};
  const hr=ws.getRow(5); s.head.forEach((h,i)=>{ const c=hr.getCell(i+1); c.value=h; c.font={name:XL.font, bold:true, color:{argb:XL.headInk}}; c.fill={type:'pattern', pattern:'solid', fgColor:{argb:XL.head}}; c.alignment={horizontal:'center', vertical:'middle', wrapText:true}; xlBorder(c); });
  hr.height=32;
  s.rows.forEach((r,ri)=>{ const row=ws.getRow(6+ri); const last=s.total && ri===s.rows.length-1;
    r.forEach((v,i)=>{ const c=row.getCell(i+1); c.value=(v===''||v==null)?null:v; c.font={name:XL.font, bold:last}; c.alignment={vertical:'top', wrapText:typeof v==='string' && v.length>30};
      if(typeof v==='number') c.numFmt=money.includes(i)?XL.money:XL.num;
      if(!last && ri%2===1) c.fill={type:'pattern', pattern:'solid', fgColor:{argb:XL.band}};
      xlBorder(c, last); }); });
  s.head.forEach((h,i)=>{ const w=Math.max(String(h).length*0.9, ...s.rows.slice(0,300).map(r=>{ const v=r[i]; return typeof v==='number'? (money.includes(i)?fmtVND(v).length+2:String(v).length+1) : String(v??'').length; })); ws.getColumn(i+1).width=Math.max(9, Math.min(48, w+2)); });
  if(s.foot){ const fr=ws.getRow(7+s.rows.length); ws.mergeCells(fr.number,1,fr.number,n); fr.getCell(1).value=s.foot; fr.getCell(1).font={name:XL.font, italic:true, size:10}; }
  return ws;
}
async function exportXlsx(filename, sheets){
  try{ await loadExcel(); }catch(e){ toast('Không tải được thư viện Excel, thử lại sau.','err'); return; }
  const wb=new ExcelJS.Workbook(); wb.creator=BR.appName||'QLDA'; wb.created=new Date();
  sheets.forEach(s=>xlSheet(wb, s));
  const out=await wb.xlsx.writeBuffer();
  saveFile(filename, new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
}
/** Xuất JSON (báo cáo kinh tế kỹ thuật, trang 78): mỗi dòng là một đối tượng theo tên cột. */
function exportJson(filename, s){
  const rows=s.rows.map(r=>Object.fromEntries(s.head.map((h,i)=>[h, r[i]===undefined?null:r[i]])));
  saveFile(filename, new Blob([JSON.stringify({tieuDe:s.title, ghiChu:s.sub||'', ngayXuat:TODAY, soDong:rows.length, duLieu:rows}, null, 2)],{type:'application/json'}));
}

/* Bản 1.7: xem trước tệp PDF ngay trên phần mềm (Mozilla PDF.js, giấy phép Apache 2.0, đóng gói kèm phần mềm nên chạy được trong mạng nội bộ) */
const isPdf = a => /pdf/i.test(a.contentType||'') || /\.pdf$/i.test(a.fileName||a.name||'');
const pdfAttr = (url, name) => `data-act="att-pdf" data-id="${esc(url+'|'+(name||''))}"`;
async function pdfView(key){
  const i=key.indexOf('|'), url=key.slice(0,i), name=key.slice(i+1)||'Tệp PDF';
  const ov=openModal(`<div class="mform pdfv"><header><h3 title="${esc(name)}">${esc(name)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header>
    <div class="pdfbar"><button type="button" class="btn sm ghost" data-pdf="prev" aria-label="Trang trước">‹</button><span class="small num" id="pdf_pg">…</span><button type="button" class="btn sm ghost" data-pdf="next" aria-label="Trang sau">›</button>
      <span style="flex:1"></span><button type="button" class="btn sm ghost" data-pdf="out" aria-label="Thu nhỏ">−</button><span class="small num" id="pdf_z">100%</span><button type="button" class="btn sm ghost" data-pdf="in" aria-label="Phóng to">+</button><button type="button" class="btn sm ghost" data-pdf="fit">Vừa khung</button>
      <a class="btn sm" href="${esc(url)}?download=true">Tải về</a><button type="button" class="btn sm" data-pdf="print">In</button></div>
    <div class="pdfpages" id="pdf_box"><p class="muted" style="padding:20px">Đang mở tệp…</p></div></div>`);
  let doc, zoom=0, page=1; const box=$('#pdf_box',ov);
  try{ await loadLib('/lib/pdfjs/pdf.min.js', ()=>!!window.pdfjsLib); pdfjsLib.GlobalWorkerOptions.workerSrc='/lib/pdfjs/pdf.worker.min.js';
    doc=await pdfjsLib.getDocument({url, withCredentials:true}).promise; }
  catch(e){ box.innerHTML=`<div class="alert bad" style="margin:16px">Không xem trước được tệp này. Bấm <b>Tải về</b> để mở bằng phần mềm trên máy.</div>`; return; }
  const draw=async()=>{ const first=await doc.getPage(1); const w0=first.getViewport({scale:1}).width; const fit=Math.max(.3,(box.clientWidth-24)/w0); const sc=zoom||fit;
    $('#pdf_z',ov).textContent=Math.round(sc*100)+'%'; box.innerHTML='';
    for(let n=1;n<=doc.numPages;n++){ const pg=await doc.getPage(n); const vp=pg.getViewport({scale:sc*(window.devicePixelRatio||1)});
      const c=document.createElement('canvas'); c.width=vp.width; c.height=vp.height; c.style.width=(vp.width/(window.devicePixelRatio||1))+'px'; c.dataset.pg=n; box.appendChild(c);
      await pg.render({canvasContext:c.getContext('2d'), viewport:vp}).promise; if(!ov.contains(box)) return; }
    upd(); };
  const upd=()=>{ $('#pdf_pg',ov).textContent=`Trang ${page} / ${doc.numPages}`; };
  box.addEventListener('scroll',()=>{ const cs=[...box.querySelectorAll('canvas')]; const top=box.scrollTop+40; const hit=cs.filter(c=>c.offsetTop<=top).pop(); if(hit){ page=+hit.dataset.pg; upd(); } });
  const go=n=>{ page=Math.max(1,Math.min(doc.numPages,n)); const c=box.querySelector(`canvas[data-pg="${page}"]`); if(c) box.scrollTop=c.offsetTop-8; upd(); };
  ov.querySelector('.pdfbar').addEventListener('click',e=>{ const b=e.target.closest('[data-pdf]'); if(!b) return; const a=b.dataset.pdf; const cur=zoom||parseInt($('#pdf_z',ov).textContent)/100;
    if(a==='prev') go(page-1); else if(a==='next') go(page+1);
    else if(a==='in'){ zoom=Math.min(4,cur*1.25); draw(); } else if(a==='out'){ zoom=Math.max(.3,cur/1.25); draw(); } else if(a==='fit'){ zoom=0; draw(); }
    else if(a==='print'){ const w=window.open(url,'_blank'); if(w) w.addEventListener('load',()=>{ try{ w.print(); }catch{} }); } });
  draw();
};

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


/* ===== Bản 1.2: ô ngày dd/mm/yyyy, bảng nhập công việc, giao diện sáng/tối ===== */
/** Đọc ngày người dùng gõ theo kiểu Việt Nam: 03/11/2026, 3/11 (năm nay), 3-11-26, 03112026. Trả về yyyy-mm-dd, '' nếu bỏ trống, null nếu sai. */
function parseVNDate(t){
  t=String(t||'').trim(); if(!t) return '';
  let d,m,y;
  if(/^\d+$/.test(t)){
    if(t.length===8){ d=t.slice(0,2); m=t.slice(2,4); y=t.slice(4); }
    else if(t.length===6){ d=t.slice(0,2); m=t.slice(2,4); y='20'+t.slice(4); }
    else if(t.length===4){ d=t.slice(0,2); m=t.slice(2,4); y=TODAY.slice(0,4); }
    else return null;
  } else {
    const p=t.split(/[\/\-.\s]+/).filter(Boolean); if(p.length<2||p.length>3||p.some(x=>!/^\d+$/.test(x))) return null;
    [d,m,y]=p; if(!y) y=TODAY.slice(0,4); if(y.length===2) y='20'+y;
  }
  d=+d; m=+m; y=+y;
  if(!(y>=1900 && y<=2100 && m>=1 && m<=12 && d>=1 && d<=31)) return null;
  const dt=new Date(y,m-1,d); if(dt.getMonth()!==m-1) return null;
  return y+'-'+pad(m)+'-'+pad(d);
}
/** Ô ngày của trình duyệt hiển thị theo ngôn ngữ máy (máy tiếng Anh ra mm/dd/yyyy). Mọi ô type="date" được thay bằng ô chữ
 *  luôn hiển thị dd/mm/yyyy kèm nút lịch; ô gốc vẫn giữ giá trị yyyy-mm-dd nên các biểu mẫu, bộ lọc đọc dữ liệu như cũ. */
function enhanceDate(inp){
  if(inp.dataset.dx) return; inp.dataset.dx='1';
  const w=document.createElement('span'); w.className='dx';
  const t=document.createElement('input'); t.type='text'; t.inputMode='numeric'; t.placeholder='dd/mm/yyyy'; t.autocomplete='off'; t.className='dx-t'; t.maxLength=10;
  if(inp.id){ t.id=inp.id+'_t'; const lb=document.querySelector(`label[for="${inp.id}"]`); if(lb) lb.htmlFor=t.id; }
  const al=inp.getAttribute('aria-label') || (inp.closest('label')&&inp.closest('label').textContent.trim()); if(al) t.setAttribute('aria-label', al);
  const b=document.createElement('button'); b.type='button'; b.className='dx-b'; b.tabIndex=-1; b.title='Chọn ngày trên lịch'; b.setAttribute('aria-label','Chọn ngày trên lịch');
  b.innerHTML=ic('cal').replace('<svg','<svg width="16" height="16"');
  inp.parentNode.insertBefore(w,inp); w.append(t,b,inp); inp.classList.add('dx-n'); inp.tabIndex=-1; inp.setAttribute('aria-hidden','true');
  const show=()=>{ t.value=inp.value? fmtDate(inp.value) : ''; t.classList.remove('bad'); t.removeAttribute('title'); };
  const fire=()=>{ inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true})); };
  const commit=()=>{ const iso=parseVNDate(t.value);
    if(iso===null){ t.classList.add('bad'); t.title='Ngày không hợp lệ. Nhập theo dạng ngày/tháng/năm, ví dụ 03/11/2026'; if(inp.value){ inp.value=''; fire(); } return; }
    if(inp.value!==iso){ inp.value=iso; fire(); } show(); };
  show();
  t.addEventListener('input', e=>{ if(e.inputType==='insertText' && /^\d{2}$|^\d{1,2}\/\d{2}$/.test(t.value)) t.value+='/'; });
  t.addEventListener('change', commit);
  t.addEventListener('keydown', e=>{ if(e.key==='Enter') commit(); });
  b.addEventListener('click', ()=>{ try{ inp.showPicker(); }catch{ t.focus(); } });
  inp.addEventListener('change', ()=>{ if(document.activeElement!==t) show(); });
}
new MutationObserver(()=>document.querySelectorAll('input[type=date]:not([data-dx])').forEach(enhanceDate)).observe(document.documentElement,{childList:true,subtree:true});

/** Bảng nhập "Công việc thực hiện" của nhật ký: mỗi dòng Công việc · Khối lượng · Đơn vị, có thêm/xóa dòng.
 *  Vẫn lưu dạng văn bản "Nội dung | Khối lượng | Đơn vị" mỗi dòng như bản trước nên nhật ký cũ đọc được ngay. */
function worksParse(t){ return String(t||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{ const [name,qty,unit]=l.split('|').map(x=>(x||'').trim()); return {name,qty,unit}; }); }
function worksRow(r={}){ const q=r.qty==null?'':String(r.qty).replace(',','.');
  return `<div class="wk-row"><input class="wk-n" placeholder="Công việc, vị trí thi công" value="${esc(r.name||'')}" aria-label="Công việc">
    <input class="wk-q" inputmode="decimal" placeholder="Khối lượng" value="${esc(q)}" aria-label="Khối lượng"><input class="wk-u" placeholder="Đơn vị" value="${esc(r.unit||'')}" list="wk_units" aria-label="Đơn vị">
    <button type="button" class="btn sm ghost danger wk-del" title="Xóa dòng" aria-label="Xóa dòng">×</button></div>`; }
function worksHTML(id, val, f){
  const rows=worksParse(val); if(!rows.length) rows.push({});
  const units=[...new Set(['m','m2','m3','tấn','kg','cái','bộ','công','ca',...D('boq').map(b=>b.unit).filter(Boolean)])];
  return `<div class="wk" id="${id}"><div class="wk-h"><span>Công việc</span><span>Khối lượng</span><span>Đơn vị</span><span></span></div><div class="wk-body">${rows.map(worksRow).join('')}</div>
    <button type="button" class="btn sm wk-add">+ Thêm dòng</button><datalist id="wk_units">${units.map(u=>`<option value="${esc(u)}">`).join('')}</datalist></div>`;
}
function worksRead(el){
  const rows=[...el.querySelectorAll('.wk-row')].map(r=>({name:r.querySelector('.wk-n').value.trim(), qty:r.querySelector('.wk-q').value.trim().replace(',','.'), unit:r.querySelector('.wk-u').value.trim()})).filter(r=>r.name||r.qty||r.unit);
  const clean=x=>x.replace(/\|/g,'/').replace(/\s+/g,' ');
  for(const r of rows){ if(!r.name) return {err:'Dòng công việc có khối lượng "'+r.qty+'" chưa nhập tên công việc.'}; if(r.qty && !(Number(r.qty)>=0)) return {err:'Khối lượng của "'+r.name+'" phải là số (ví dụ 12.5).'}; }
  return {text: rows.map(r=>[clean(r.name), r.qty, clean(r.unit)].join(' | ').replace(/( \| )+$/,'')).join('\n')};
}
document.addEventListener('click', e=>{
  const a=e.target.closest('.wk-add'); if(a){ const body=a.parentNode.querySelector('.wk-body'); body.insertAdjacentHTML('beforeend', worksRow()); body.lastElementChild.querySelector('.wk-n').focus(); return; }
  const d=e.target.closest('.wk-del'); if(d){ const body=d.closest('.wk-body'); d.closest('.wk-row').remove(); if(!body.children.length) body.insertAdjacentHTML('beforeend', worksRow()); }
});

/* ===== Bản 1.3: tùy chọn giao diện theo từng người dùng =====
   Chế độ sáng/tối, tông màu, kiểu thanh bên, cỡ chữ, mật độ hiển thị. Lưu trên máy chủ theo tài khoản (đăng nhập máy khác vẫn giữ),
   kèm bản sao trên máy để mở ứng dụng là áp dụng ngay, không bị nháy màu. */
const UI_OPTS = {
  mode:   {label:'Chế độ hiển thị', def:'auto', list:[['auto','Tự động theo máy'],['light','Sáng'],['dark','Tối']]},
  color:  {label:'Tông màu chủ đạo', def:'navy', list:[['navy','Xanh hành chính','#1f5fbf','#0d2a57'],['teal','Xanh ngọc','#0b7a72','#0a3431'],['indigo','Tím than','#4338ca','#1e1b4b'],['green','Xanh lá','#15803d','#0f2f1c'],['earth','Cam đất','#b4490c','#2e1608'],['slate','Than chì','#334155','#111827']]},
  side:   {label:'Thanh điều hướng', def:'dark', list:[['dark','Nền đậm theo tông màu'],['light','Nền sáng']]},
  size:   {label:'Cỡ chữ', def:'md', list:[['sm','Nhỏ'],['md','Vừa'],['lg','Lớn'],['xl','Rất lớn']]},
  density:{label:'Mật độ hiển thị', def:'comfy', list:[['comfy','Thoáng'],['compact','Gọn (nhiều dòng hơn)']]}
};
const THEMES=UI_OPTS.mode.list;
const UI = {
  p:{}, _uid:null,
  clean(o){ const r={}; for(const [k,d] of Object.entries(UI_OPTS)){ const v=o&&o[k]; r[k]=d.list.some(x=>x[0]===v)? v : d.def; } return r; },
  apply(p){
    this.p=this.clean(p); const r=document.documentElement, dark=this.p.mode==='dark' || (this.p.mode==='auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    r.dataset.mode=dark?'dark':'light'; r.dataset.color=this.p.color; r.dataset.side=this.p.side; r.dataset.size=this.p.size; r.dataset.density=this.p.density;
    if(this.p.mode==='auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme',this.p.mode);
    const mc=document.querySelector('meta[name=theme-color]'); if(mc) setTimeout(()=>{ mc.content=getComputedStyle(r).getPropertyValue('--brand').trim()||'#0d2a57'; },0);
  },
  /* Đọc tùy chọn của người dùng vừa đăng nhập (máy chủ), dùng bản trên máy nếu máy chủ chưa có. */
  async load(user){
    if(!user || this._uid===user.id) return; this._uid=user.id;
    const k='qlda-ui:'+user.id; let p=null; try{ p=JSON.parse(lsGet(k)||'null'); }catch{}
    if(p) this.apply(p);
    try{ const r=await api('GET','/api/auth/ui',undefined,{auth:true}); if(r && r.value){ p=JSON.parse(r.value); this.apply(p); lsSet(k,JSON.stringify(this.p)); lsSet('qlda-ui',JSON.stringify(this.p)); onData(); } }catch{}
  },
  async set(k,v){
    this.apply({...this.p,[k]:v}); const js=JSON.stringify(this.p); lsSet('qlda-ui',js);
    if(S.user){ lsSet('qlda-ui:'+S.user.id,js); try{ await api('PUT','/api/auth/ui',{value:js}); }catch(e){ toast('Chưa lưu được tùy chọn lên máy chủ: '+errText(e),'err'); } }
  },
  reset(){ this._uid=null; }
};
/* Bản 1.2 trở về trước chỉ lưu sáng/tối trên máy: chuyển sang tùy chọn mới */
(()=>{ let p=null; try{ p=JSON.parse(lsGet('qlda-ui')||'null'); }catch{} if(!p){ const t=lsGet('qlda-theme'); p={mode:t||'auto'}; } UI.apply(p); })();
try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{ if(UI.p.mode==='auto'){ UI.apply(UI.p); } }); }catch{}
function themeGet(){ return UI.p.mode; }
function themeApply(m){ UI.apply({...UI.p, mode:m}); }
function themeBtn(){ const m=themeGet(), next=THEMES[(THEMES.findIndex(x=>x[0]===m)+1)%3];
  return `<button class="btn ghost sm theme-btn" data-act="theme" title="Đang dùng: ${esc(THEMES.find(x=>x[0]===m)[1].toLowerCase())} · bấm để chuyển sang ${esc(next[1].toLowerCase())}" aria-label="Đổi chế độ sáng/tối">${ic(m==='auto'?'auto':m==='light'?'sun':'moon').replace('<svg','<svg width="18" height="18"')}</button>`
    + `<button class="btn ghost sm theme-btn ap-btn" data-act="appearance" title="Giao diện: tông màu, cỡ chữ, mật độ" aria-label="Tùy chỉnh giao diện">${ic('palette').replace('<svg','<svg width="18" height="18"')}</button>`; }
/** Hộp thoại Giao diện: chọn là áp dụng ngay, tự lưu theo tài khoản. */
function appearanceHTML(){
  const p=UI.p;
  const seg=(k)=>`<fieldset class="ap-group"><legend>${esc(UI_OPTS[k].label)}</legend><div class="seg" role="radiogroup">${UI_OPTS[k].list.map(([v,l])=>`<label class="${p[k]===v?'on':''}"><input type="radio" name="ap_${k}" value="${v}" data-ap="${k}" ${p[k]===v?'checked':''}><span>${esc(l)}</span></label>`).join('')}</div></fieldset>`;
  const sw=`<fieldset class="ap-group"><legend>${esc(UI_OPTS.color.label)}</legend><div class="swatches" role="radiogroup">${UI_OPTS.color.list.map(([v,l,a,b])=>`<label class="sw ${p.color===v?'on':''}"><input type="radio" name="ap_color" value="${v}" data-ap="color" ${p.color===v?'checked':''}><span class="chip" style="--a:${a};--b:${b}" aria-hidden="true"><i></i></span><span>${esc(l)}</span></label>`).join('')}</div></fieldset>`;
  return `<div class="mform narrow ap" role="dialog" aria-modal="true" aria-labelledby="ap_t"><header><h3 id="ap_t">Giao diện</h3><button class="icon-btn" data-close aria-label="Đóng">×</button></header>
    <div class="ap-body">${seg('mode')}${sw}${seg('side')}${seg('size')}${seg('density')}
    <p class="small muted" style="margin:0">Chọn là áp dụng ngay. Tùy chọn được lưu theo tài khoản của bạn, đăng nhập trên máy khác vẫn giữ nguyên.</p></div>
    <footer><button class="btn ghost" data-act="ap-reset">Khôi phục mặc định</button><button class="btn primary" data-close>Xong</button></footer></div>`;
}


/* ===== Bản 1.2: quy trình trình duyệt hồ sơ (phụ lục HĐ, hồ sơ thanh toán, nghiệm thu) =====
   Soạn thảo → Trình duyệt → Đã duyệt / Trả lại (ghi ý kiến, về soạn thảo) / Từ chối; người duyệt thu hồi được hồ sơ đã duyệt.
   Máy chủ kiểm tra quyền và trạng thái ở /api/approvals; hồ sơ chờ duyệt, đã duyệt bị khóa sửa với người không có quyền duyệt. */
const WF = {
  addenda:{mod:'goi-thau', name:'Phụ lục hợp đồng', draft:'Soạn thảo', wait:'Chờ duyệt', ok:'Đã duyệt', no:'Từ chối', locked:['Đã duyệt','Từ chối'],
    label:r=>{ const c=get('contracts',r.contractId)||{}; return `Phụ lục ${r.number||''} HĐ ${c.number||''}`; }, pid:r=>contractPid(get('contracts',r.contractId)||{}),
    info:r=>`${N(r.valueChange)>0?'+':''}${fmtVND(r.valueChange)} đ${N(r.daysChange)?', gia hạn '+N(r.daysChange)+' ngày':''} · ${r.content||''}`},
  payments:{mod:'thanh-toan', name:'Hồ sơ thanh toán', draft:'Đề nghị', wait:'Chờ duyệt', ok:'Đang trình KBNN', no:'Từ chối', locked:['Đang trình KBNN','Đã thanh toán','Từ chối'],
    label:r=>{ const c=get('contracts',r.contractId)||{}; return `Hồ sơ thanh toán ${r.number||''} HĐ ${c.number||''}`; }, pid:r=>contractPid(get('contracts',r.contractId)||{}),
    info:r=>`${r.kind||''} · ${fmtVND(r.amount)} đ${r.payPlanId&&get('payplans',r.payPlanId)?' · '+(/^đợt/i.test(get('payplans',r.payPlanId).phase||'')?'':'đợt ')+get('payplans',r.payPlanId).phase:''}`},
  schedule:{mod:'tien-do', name:'Kế hoạch tiến độ', draft:'Soạn thảo', wait:'Chờ duyệt', ok:'Đã duyệt', no:'Từ chối', locked:['Đã duyệt','Từ chối'],
    label:r=>`Kế hoạch ${r.name||''} (${(pkgOf(r.packageId)||{}).code||''})`, pid:r=>r.projectId,
    info:r=>`${fmtDate(r.planStart)} – ${fmtDate(r.planEnd)}, trọng số ${N(r.weight)||1}`},
  vbatches:{mod:'khoi-luong', name:'Đợt nghiệm thu khối lượng', draft:'Soạn thảo', wait:'Chờ duyệt', ok:'Đã duyệt', no:'Từ chối', locked:['Đã duyệt','Từ chối'], disp:VB_DISP,
    checkLabel:'Chờ TVGS xác nhận', checkBtn:'Xác nhận khối lượng',
    label:r=>{ const c=get('contracts',r.contractId)||{}; return `Nghiệm thu ${r.name||''} HĐ ${c.number||''}`; }, pid:r=>contractPid(get('contracts',r.contractId)||{}),
    info:r=>{ const vs=D('volumes').filter(v=>v.batchId===r.id); return `${r.number?'Biên bản '+r.number+', ':''}${fmtDate(r.date)}, ${vs.length} công việc, giá trị nghiệm thu ${fmtVND(sum(vs,v=>N(v.acceptedQty)*N((get('boq',v.boqId)||{}).price)))} đ`; }},
  acceptances:{mod:'nghiem-thu', name:'Nghiệm thu, bàn giao', draft:'Soạn thảo', wait:'Chờ duyệt', ok:'Đã duyệt', no:'Từ chối', locked:['Đã duyệt','Từ chối'],
    label:r=>`${r.kind||'Biên bản'} ${r.number||''}`, pid:r=>r.projectId, info:r=>`${fmtDate(r.date)} · ${r.content||''}${r.result?' · '+r.result:''}`}
};
/** Trạng thái quy trình của hồ sơ (dữ liệu trước bản 1.2 không có trạng thái: coi là đã duyệt). */
function wfStatus(col, r){ return r.status || WF[col].ok; }
const wfLocked = (col, r) => WF[col].locked.includes(wfStatus(col,r));
/** Bước kiểm tra (bản 1.7): hồ sơ trình lên qua "Chờ kiểm tra" rồi mới tới "Chờ duyệt" nếu quản trị bật cho loại hồ sơ này. */
const WF_CHECK = 'Chờ kiểm tra';
const wfHasCheck = col => (Store.meta.wfCheck||[]).includes(col);
const wfWaiting = (col, r) => { const s=wfStatus(col,r); return s===WF[col].wait || s===WF_CHECK; };
const wfDisp = (col, s) => s===WF_CHECK ? (WF[col].checkLabel||'Chờ kiểm tra') : (WF[col].disp&&WF[col].disp[s]) || s;
/** Người dùng sửa được hồ sơ không (người duyệt luôn sửa được; người khác chỉ sửa khi đang soạn thảo). */
const wfEditable = (col, r) => can(WF[col].mod,'approve') || (can(WF[col].mod,'edit') && !wfLocked(col,r) && !wfWaiting(col,r));
/** Hồ sơ bị người duyệt trả lại và chưa trình lại (lần thao tác gần nhất là Trả lại): trả về dòng lịch sử đó. */
function wfReturned(col, r){ if(!WF[col] || wfStatus(col,r)!==WF[col].draft) return null;
  const h=D('approvals').filter(a=>a.collection===col && a.recordId===r.id).sort(by('at',-1))[0]; return h && h.action==='Trả lại' ? h : null; }
/** Hồ sơ thanh toán đang đề nghị (mới lập, chờ duyệt, đang trình Kho bạc); hồ sơ bị trả lại không tính. */
function payInProc(p){ return ['Đề nghị',WF_CHECK,'Chờ duyệt','Đang trình KBNN'].includes(p.status) && !wfReturned('payments',p); }
/** Thanh toán khối lượng hoàn thành (không gồm tạm ứng, thu hồi tạm ứng). */
const payIsVol = p => /khối lượng/i.test(p.kind||'') && !/tạm ứng/i.test(p.kind||'');
function wfPill(col, r){ const w=WF[col], s=wfStatus(col,r), rt=wfReturned(col,r);
  if(rt) return `<span class="pill bad" title="${esc('Trả lại: '+(rt.note||''))}">Bị trả lại</span>${rt.note?`<div class="small muted">${esc(rt.note)}</div>`:''}`;
  return pill(wfDisp(col,s), s===w.draft?'':s===w.wait||s===WF_CHECK?'warn':s===w.no?'bad':s==='Đã thanh toán'||s===w.ok?'ok':'info'); }
/** Các nút quy trình của một hồ sơ, theo trạng thái và quyền của người dùng. */
function wfBtns(col, r){ const w=WF[col], s=wfStatus(col,r), ap=can(w.mod,'approve'), ed=can(w.mod,'edit')||ap; const b=(a,l,cls='')=>`<button class="btn sm ${cls||'ghost'}" data-act="wf" data-id="${esc(col+'|'+r.id+'|'+a)}">${l}</button>`;
  let h='';
  if(s===w.draft && ed) h+=b('submit','Trình duyệt');
  if(s===WF_CHECK){ if(can(w.mod,'check')) h+=b('check',w.checkBtn||'Kiểm tra, xác nhận','primary')+b('return','Trả lại'); else if(ap) h+=b('return','Trả lại'); else if(ed) h+=b('withdraw','Rút lại'); }
  if(s===w.wait && ap) h+=b('approve','Duyệt','primary')+b('return','Trả lại')+b('reject','Từ chối','ghost danger');
  else if(s===w.wait && ed) h+=b('withdraw','Rút lại');
  if(ap && w.locked.includes(s) && s!=='Đã thanh toán') h+=b('recall','Thu hồi');
  if(D('approvals').some(a=>a.collection===col && a.recordId===r.id)) h+=b('history','Lịch sử');
  return h; }
/** Nút Sửa/Xóa có xét khóa của quy trình. */
const wfEditBtns = (col, r, extra='') => wfEditable(col,r) ? editBtns(WF[col].mod, col, r.id, extra) : extra;
/** Hồ sơ đang chờ người dùng này duyệt. */
function wfMine(){ return Object.keys(WF).flatMap(col=>{ const ap=can(WF[col].mod,'approve'), ck=can(WF[col].mod,'check');
  return D(col).filter(r=>{ const s=wfStatus(col,r); return pidOk(WF[col].pid(r)) && ((ap && s===WF[col].wait) || (ck && s===WF_CHECK)); }).map(r=>({col,r})); }); }

/* ===== Bản 1.3: tự căn độ rộng cột của mọi bảng =====
   Cột chữ ngắn (mã, trạng thái, ngày, số) không xuống dòng; cột chữ dài (tên dự án, nội dung…) được độ rộng tối thiểu dễ đọc,
   bảng rộng hơn khung thì cuộn ngang và giữ cố định cột đầu. Trên điện thoại bảng đã chuyển thành thẻ nên không áp dụng. */
function fitTables(root){
  const mob=matchMedia('(max-width:820px)').matches;
  (root||document).querySelectorAll(mob? '.tw:not(.rt) > table:not(.perm)' : '.tw > table:not(.perm)').forEach(t=>{
    const head=t.tHead && t.tHead.rows[0]; if(!head) return;
    const rows=[...t.tBodies].flatMap(b=>[...b.rows]).slice(0,60);
    const longCols=[];
    [...head.cells].forEach((th,i)=>{
      let line=0, ctl=false, chips=false;
      for(const r of rows){ const c=r.cells[i]; if(!c) continue;
        if(c.querySelectorAll('.pill').length>=3){ chips=true; continue; }
        if(c.classList.contains('acts') || c.querySelector('button,select,input,.bar,.thumbs')){ ctl=true; continue; }
        for(const ln of (c.innerText||'').split('\n')){ const n=ln.trim().length; if(n>line) line=n; } }
      const hl=th.textContent.trim().length;
      const cells=rows.map(r=>r.cells[i]).filter(Boolean);
      th.classList.toggle('wrap', hl>22); th.style.removeProperty('--mw'); cells.forEach(c=>c.classList.remove('nw'));
      if(chips){ th.style.setProperty('--mw','400px'); return; }
      if(ctl) return;
      if(line<=24) cells.forEach(c=>c.classList.add('nw'));
      else { const mw=Math.min(360, Math.max(190, Math.round(Math.sqrt(line)*28))); th.style.setProperty('--mw', mw+'px'); longCols.push([th,mw]); }
    });
    const tw=t.parentElement;
    /* bảng vượt khung: thu hẹp dần các cột chữ dài (không dưới 210px để vẫn dễ đọc) trước khi phải cuộn ngang */
    let over=t.scrollWidth-tw.clientWidth;
    if(over>0 && longCols.length){ const room=longCols.reduce((a,[,m])=>a+m-210,0);
      if(room>0){ const k=Math.min(1, over/room); longCols.forEach(([th,m])=>th.style.setProperty('--mw', Math.round(m-(m-210)*k)+'px')); }
      over=t.scrollWidth-tw.clientWidth; }
    tw.classList.toggle('wide', over>2);
  });
}
addEventListener('resize', ()=>{ clearTimeout(fitTables._t); fitTables._t=setTimeout(()=>fitTables(), 150); });
