/* ===== Bản 1.9: phân hệ Văn phòng: điểm danh, đề xuất, bảng công, nhân sự (dữ liệu qua /api/vp, không nạp chung với dữ liệu dự án) ===== */
const VP = {st:null, emps:[], depts:[], loading:false, att:{}, ts:{}, reqs:{}, set:null, err:''};
async function vpLoad(force){
  if(VP.loading || (VP.st && !force)) return; VP.loading=true;
  try{
    const [st, emps, depts] = await Promise.all([api('GET','/api/vp/state'), api('GET','/api/vp/employees'), api('GET','/api/vp/departments')]);
    VP.st=st; VP.emps=emps||[]; VP.depts=depts||[]; VP.err='';
  }catch(e){ VP.err=errText(e); }
  VP.loading=false; onData();
}
function vpReset(){ VP.st=null; VP.att={}; VP.ts={}; VP.reqs={}; VP.set=null; VP.ew={}; VP.mt={}; VP.nt=null; VP.ib=null; }
const vpEmp = id => VP.emps.find(e=>e.id===id);
const vpDept = id => VP.depts.find(d=>d.id===id);
const vpDeptName = id => (vpDept(id)||{}).name || '';
const vpMonth = () => S.f.vpm || TODAY.slice(0,7);
const vpHM = s => { if(!s) return '—'; const d=parseTs(s); return pad(d.getHours())+':'+pad(d.getMinutes()); };
const vpWho = id => { const e=vpEmp(id); return e? esc(e.name) : '<span class="muted">—</span>'; };
const vpCanAttAll = () => VP.st && (VP.st.perms.att || (VP.st.perms.managed||[]).length>0);
const vpCanApprove = () => VP.st && VP.st.perms.approve;
const vpPlacePill = p => !p? '' : pill(p, p==='Trong công ty'?'ok':p==='Ngoài công ty'?'warn':'info');
const vpWait = () => VP.err? emptyBox('Không tải được dữ liệu văn phòng: '+esc(VP.err)+` <button class="btn sm" data-act="vp-reload">Thử lại</button>`) : `<div class="empty">Đang tải…</div>`;
ACT['vp-reload']=()=>{ vpReset(); vpLoad(true); };
/* tải một lần dữ liệu theo khóa (tháng, phạm vi), xong thì vẽ lại */
function vpFetch(bag, key, url){
  if(bag[key]!==undefined) return bag[key];
  bag[key]=null; api('GET',url).then(r=>{ bag[key]=r; onData(); }).catch(e=>{ bag[key]={error:errText(e)}; onData(); });
  return null;
}

/* Quyền xem các màn hình: điểm danh của tôi cho mọi tài khoản; bảng công, duyệt đề xuất cho người có quyền hoặc trưởng phòng */
const VP_ROUTES = ['van-phong','de-xuat','diem-danh','nhan-su'];
EXTRA_ROUTES.push('van-phong');

/* ---------------------------------------------------------------- Điểm danh của tôi */
VIEWS['van-phong']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>Điểm danh</h1></div></div>`+vpWait(); }
  const st=VP.st, me=st.me, a=st.attendance;
  const m=vpMonth(); const mine=me? vpFetch(VP.att, 'me|'+m, `/api/vp/attendance?month=${m}&employeeId=${encodeURIComponent(me.id)}`) : [];
  const reqs=vpFetch(VP.reqs, 'mine', '/api/vp/requests?scope=mine');
  const now=new Date(); const hhmm=pad(now.getHours())+':'+pad(now.getMinutes());
  let box;
  if(!me) box=`<div class="alert">Tài khoản của bạn chưa gắn với hồ sơ nhân sự nên chưa điểm danh được. Liên hệ người quản lý nhân sự để được gắn.</div>`;
  else if(!me.attendance) box=`<div class="alert info">Hồ sơ của bạn được thiết lập không cần điểm danh.</div>`;
  else box=`<div class="vp-clock"><div class="vp-time" id="vp_clock">${hhmm}</div><div class="muted">${['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][now.getDay()]}, ${fmtDate(st.today)}</div></div>
    <div class="vp-state">
      <div><span class="eyebrow">Giờ vào</span><b>${a&&a.inAt? vpHM(a.inAt) : '—'}</b>${a&&a.inAt? vpPlacePill(a.inPlace)+(a.lateMinutes>0?' '+pill('Muộn '+a.lateMinutes+' phút','bad'):''):''}${a&&a.site?`<div class="small muted">${esc(a.site)}</div>`:''}</div>
      <div><span class="eyebrow">Giờ ra</span><b>${a&&a.outAt? vpHM(a.outAt) : '—'}</b>${a&&a.outAt? vpPlacePill(a.outPlace)+(a.earlyMinutes>0?' '+pill('Sớm '+a.earlyMinutes+' phút','warn'):''):''}</div>
    </div>
    <div class="vp-mode" role="radiogroup" aria-label="Hình thức làm việc">${[['office','Tại công ty, công trình'],['online','Làm việc online'],['congtac','Đi công tác']].map(([k,l])=>`<label><input type="radio" name="vp_mode" value="${k}" ${(S.f.vpmode||'office')===k?'checked':''}> ${l}</label>`).join('')}</div>
    <div class="vp-btns">${!(a&&a.inAt)?`<button class="btn primary vp-big" data-act="vp-check" data-id="in">Điểm danh vào</button>`:''}<button class="btn ${a&&a.inAt?'primary':''} vp-big" data-act="vp-check" data-id="out">${a&&a.outAt?'Điểm danh ra lại':'Điểm danh ra'}</button></div>
    <p class="small muted" style="margin:8px 0 0">Giờ vào quy định ${esc(st.settings.checkIn)}, giờ ra ${esc(st.settings.checkOut)}. Bật định vị trên điện thoại để hệ thống xác nhận bạn đang ở công ty (trong bán kính ${esc(String((st.settings.places[0]||{}).radius||500))} m) hoặc dùng mạng của công ty.</p>`;
  const rows=Array.isArray(mine)? mine.slice().sort((x,y)=>String(y.date).localeCompare(String(x.date))) : [];
  const late=rows.filter(x=>x.lateMinutes>0);
  return `<div class="head"><div class="grow"><h1>Điểm danh</h1><p>${me? esc(me.name)+(me.departmentId?' · '+esc(vpDeptName(me.departmentId)):'') : esc(S.user.name)}</p></div>
    <div class="toolbar"><button class="btn" data-act="vp-req-new">+ Tạo đề xuất</button></div></div>
  <div class="grid g2 vp-top"><div class="card">${box}</div>
    <div class="card"><h2 style="margin-top:0">Tháng ${m.slice(5)}/${m.slice(0,4)}</h2>
      <div class="grid g3 kpis"><div class="kpi"><div class="eyebrow">Ngày có điểm danh</div><div class="v">${rows.length}</div></div>
      <div class="kpi ${late.length?'warn':''}"><div class="eyebrow">Đi muộn</div><div class="v">${late.length}</div><div class="s">${late.reduce((s,x)=>s+x.lateMinutes,0)} phút</div></div>
      <div class="kpi"><div class="eyebrow">Phép năm ${st.leave.year} còn</div><div class="v">${fmtN(st.leave.left,1)}</div><div class="s">đã nghỉ ${fmtN(st.leave.used,1)}/${fmtN(st.leave.total)} ngày</div></div></div>
      ${vpReqMini(reqs)}</div></div>
  <div class="card" style="margin-top:12px"><div class="toolbar" style="justify-content:space-between"><h2 style="margin:0">Lịch sử điểm danh</h2><input type="month" data-f="vpm" value="${esc(m)}" aria-label="Tháng"></div>
    ${mine===null? '<div class="empty">Đang tải…</div>' : table([
      {h:'Ngày', f:x=>`${['CN','T2','T3','T4','T5','T6','T7'][new Date(x.date).getDay()]} ${fmtDate(x.date)}`},
      {h:'Giờ vào', f:x=>vpHM(x.inAt)+(x.lateMinutes>0?` <span class="small" style="color:var(--red)">+${x.lateMinutes}′</span>`:'')},
      {h:'Giờ ra', f:x=>vpHM(x.outAt)+(x.earlyMinutes>0?` <span class="small" style="color:var(--amber)">−${x.earlyMinutes}′</span>`:'')},
      {h:'Nơi điểm danh', f:x=>vpPlacePill(x.inPlace)+(x.site?`<div class="small muted">${esc(x.site)}</div>`:'')},
      {h:'Ghi chú', f:x=>esc(x.note||'')+(x.source==='e-work'?' <span class="small muted">(e-work)</span>':'')}], rows, {empty:'Chưa có điểm danh trong tháng.', pk:'vpme'})}</div>`;
};
function vpReqMini(reqs){
  if(reqs===null) return '';
  const list=(Array.isArray(reqs)?reqs:[]).slice(0,5);
  return `<h3 style="margin:14px 0 6px">Đề xuất gần đây <a class="small" href="#de-xuat" style="font-weight:400">Xem tất cả</a></h3>${list.length? `<div class="alertList">${list.map(r=>`<div class="alr"><span class="alr-d">${vpStatus(r.status)}</span><span>${esc(r.type)}${r.fromAt?' · '+vpRange(r):''}</span></div>`).join('')}</div>` : '<p class="small muted">Chưa có đề xuất.</p>'}`;
}
ACT['vp-check']=async(kind,el)=>{
  const mode=(document.querySelector('input[name="vp_mode"]:checked')||{}).value||'office'; S.f.vpmode=mode;
  el.disabled=true; const lb=el.textContent; el.textContent='Đang lấy vị trí…';
  const pos=await new Promise(res=>{ if(!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(p=>res(p.coords), ()=>res(null), {enableHighAccuracy:true, timeout:12000, maximumAge:30000}); });
  el.textContent='Đang ghi…';
  try{
    const a=await api('POST','/api/vp/check',{kind, lat:pos?pos.latitude:null, lng:pos?pos.longitude:null, accuracy:pos?pos.accuracy:null, mode});
    VP.st.attendance=a; delete VP.att['me|'+vpMonth()];
    toast(`${kind==='in'?'Đã điểm danh vào':'Đã điểm danh ra'} lúc ${vpHM(kind==='in'?a.inAt:a.outAt)} · ${(kind==='in'?a.inPlace:a.outPlace)||''}`, (kind==='in'?a.inPlace:a.outPlace)==='Ngoài công ty'?'err':undefined);
    if(!pos && mode==='office') setTimeout(()=>toast('Không lấy được vị trí: hãy cho phép trình duyệt dùng định vị để lần sau xác nhận đúng nơi làm việc.','err'),2600);
    render();
  }catch(e){ toast(errText(e),'err'); el.disabled=false; el.textContent=lb; }
};
setInterval(()=>{ const c=document.getElementById('vp_clock'); if(c){ const n=new Date(); c.textContent=pad(n.getHours())+':'+pad(n.getMinutes()); } }, 15000);

/* ---------------------------------------------------------------- Đề xuất */
const VP_REQ_FIELDS = {
  'Nghỉ phép':['range','days','reason'], 'Làm việc online':['range','days','reason'], 'Công tác':['range','days','place','reason'],
  'Tăng ca':['day','times','hours','reason'], 'Đi muộn, về sớm':['day','times','reason'], 'Quên điểm danh':['day','times','reason'],
  'Xăng xe':['day','place','km','reason'], 'Tạm ứng':['title','amount','reason'], 'Ứng lương':['amount','reason'], 'Thanh toán':['title','amount','reason'],
  'Giải chi':['title','amount','reason'], 'Kiểm tra thanh toán':['title','amount','reason'], 'Gia hạn công việc':['title','due','reason'],
  'Mở lại công việc':['title','reason'], 'Làm việc':['title','range','reason'], 'Khác':['title','range','reason']};
const VP_KM = 2000;
function vpStatus(s){ return pill(s||'', s==='Đã duyệt'?'ok':s==='Từ chối'?'bad':s==='Đã hủy'?'':'warn'); }
function vpRange(r){ const f=r.fromAt?parseTs(r.fromAt):null, t=r.toAt?parseTs(r.toAt):null; if(!f) return '';
  const d=x=>pad(x.getDate())+'/'+pad(x.getMonth()+1), h=x=>pad(x.getHours())+':'+pad(x.getMinutes());
  if(!t) return d(f)+' '+h(f); if(isoLocal(f)===isoLocal(t)) return d(f)+' '+h(f)+'–'+h(t); return d(f)+' '+h(f)+' → '+d(t)+' '+h(t); }
const vpIso = (date, time) => date ? `${date}T${(time||'00:00').padStart(5,'0')}:00+07:00` : null;
const vpSplit = s => { if(!s) return ['','']; const d=parseTs(s); return [isoLocal(d), pad(d.getHours())+':'+pad(d.getMinutes())]; };
/* Số ngày làm việc giữa hai mốc (bỏ Chủ nhật; thứ Bảy theo thiết lập), làm tròn nửa ngày */
function vpWorkDays(f, t){ if(!f||!t) return null; const st=VP.st.settings, am=st.morningEnd||'12:30';
  /* f, t dạng 2026-12-01T08:00:00+07:00 (giờ Việt Nam): đọc thẳng ngày, giờ để không lệch theo múi giờ của máy */
  const fd=f.slice(0,10), ft=f.slice(11,16), td=t.slice(0,10), tt=t.slice(11,16); let n=0;
  for(let x=new Date(fd+'T00:00:00Z'); x.toISOString().slice(0,10)<=td; x.setUTCDate(x.getUTCDate()+1)){
    const day=x.toISOString().slice(0,10), dow=x.getUTCDay(); let v=dow===0?0:dow===6?(st.saturday==='ca-ngay'?1:st.saturday==='sang'?.5:0):1;
    if((st.holidays||[]).some(h=>h.startsWith(day))) v=0; if(!v) continue;
    if(day===fd && ft>=am) v=Math.min(v,.5);
    if(day===td && tt<=am) v=Math.min(v,.5);
    n+=v; }
  return n; }
ACT['vp-req-new']=()=>{
  if(!VP.st){ vpLoad(); return; }
  if(!VP.st.me){ toast('Tài khoản chưa gắn với hồ sơ nhân sự nên chưa gửi được đề xuất.','err'); return; }
  openModal(`<div class="mform"><header><h3>Tạo đề xuất</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header>
    <div style="padding:16px"><p class="small muted" style="margin-top:0">Chọn loại đề xuất:</p><div class="vp-types">${VP.st.types.map(t=>`<button class="btn" data-act="vp-req-form" data-id="${esc(t)}">${esc(t)}</button>`).join('')}</div></div></div>`);
};
ACT['vp-req-form']=(type, el, ev, rec)=>{
  const r=rec||{type}; const fs=VP_REQ_FIELDS[type]||['title','range','reason']; const st=VP.st.settings;
  const [fd,ft]=vpSplit(r.fromAt), [td,tt]=vpSplit(r.toAt);
  const F=[];
  if(fs.includes('title')) F.push({key:'title', label: type==='Gia hạn công việc'||type==='Mở lại công việc'?'Công việc':'Nội dung', req:true, full:true});
  if(fs.includes('range')) F.push({key:'fd',label:'Từ ngày',type:'date',req:true},{key:'ft',label:'Từ giờ',ph:st.morningStart||'08:00',def:st.morningStart||'08:00'},{key:'td',label:'Đến ngày',type:'date',req:true},{key:'tt',label:'Đến giờ',ph:st.afternoonEnd||'17:30',def:st.afternoonEnd||'17:30'});
  if(fs.includes('day')) F.push({key:'fd',label:'Ngày',type:'date',req:true,def:TODAY});
  if(fs.includes('times')) F.push({key:'ft',label:'Từ giờ',ph:'17:30'},{key:'tt',label:'Đến giờ',ph:'20:00'});
  if(fs.includes('due')) F.push({key:'td',label:'Hạn mới',type:'date',req:true});
  if(fs.includes('days')) F.push({key:'days',label:'Số ngày (để trống: tự tính theo ngày làm việc)',type:'number'});
  if(fs.includes('hours')) F.push({key:'hours',label:'Số giờ (để trống: tự tính)',type:'number'});
  if(fs.includes('km')) F.push({key:'hours',label:`Số km (${fmtN(VP_KM)} đ/km)`,type:'number',req:true});
  if(fs.includes('place')) F.push({key:'place',label: type==='Xăng xe'?'Lộ trình':'Nơi công tác',req:true,full:true});
  if(fs.includes('amount')) F.push({key:'amount',label:'Số tiền (đồng)',type:'money',req:true});
  F.push({key:'reason',label:'Lý do',type:'textarea',req:fs.includes('reason'),full:true});
  if(type==='Nghỉ phép') F.unshift({key:'_i',type:'html',html:`<div class="fld full small muted">Phép năm ${VP.st.leave.year} còn <b>${fmtN(VP.st.leave.left,1)}</b> ngày.</div>`});
  openForm({title:(r.id?'Sửa đề xuất: ':'Đề xuất ')+type.toLowerCase(), fields:F, value:{...r, fd, ft:ft||undefined, td, tt:tt||undefined}, submit: r.id?'Lưu':'Gửi đề xuất',
    onSave:async v=>{
      const tm=x=>!x||/^\d{1,2}:\d{2}$/.test(x); if(!tm(v.ft)||!tm(v.tt)){ throw new Error('Giờ ghi dạng 08:00.'); }
      const o={id:r.id||uid('dx'), type, title:v.title||null, place:v.place||null, reason:v.reason||null, amount:v.amount??null};
      if(fs.includes('range')){ o.fromAt=vpIso(v.fd,v.ft||st.morningStart); o.toAt=vpIso(v.td,v.tt||st.afternoonEnd); }
      if(fs.includes('day')){ o.fromAt=vpIso(v.fd, v.ft||'08:00'); o.toAt=v.tt? vpIso(v.fd, v.tt) : null; }
      if(fs.includes('due')) o.toAt=vpIso(v.td,'17:30');
      if(fs.includes('days')) o.days = v.days ?? vpWorkDays(o.fromAt, o.toAt);
      if(fs.includes('hours')) o.hours = v.hours ?? (o.toAt? Math.round((Date.parse(o.toAt)-Date.parse(o.fromAt))/36e5*10)/10 : null);
      if(fs.includes('km')){ o.hours=v.hours; o.amount=Math.round(N(v.hours)*VP_KM); }
      if(type==='Nghỉ phép' && N(o.days)>N(VP.st.leave.left) && !await confirmBox(`Số ngày xin nghỉ (${fmtN(o.days,1)}) nhiều hơn số phép còn lại (${fmtN(VP.st.leave.left,1)}). Phần vượt sẽ tính nghỉ không lương. Vẫn gửi?`,'Gửi')) return false;
      const saved=await api('PUT','/api/vp/requests/'+encodeURIComponent(o.id), o);
      VP.reqs={}; vpLoad(true); return saved; }});
};
ACT['vp-req-edit']=id=>{ const all=Object.values(VP.reqs).flatMap(x=>Array.isArray(x)?x:[]); const r=all.find(x=>x.id===id); if(r) ACT['vp-req-form'](r.type,null,null,r); };
ACT['vp-req-decide']=async(id,el)=>{
  const act=el.dataset.a;
  if(act==='cancel'){ if(!await confirmBox('Hủy đề xuất này?','Hủy đề xuất')) return; await api('POST',`/api/vp/requests/${encodeURIComponent(id)}/decide`,{action:'cancel'}); VP.reqs={}; vpLoad(true); toast('Đã hủy đề xuất'); return; }
  openForm({title: act==='approve'?'Duyệt đề xuất':'Không duyệt đề xuất', narrow:true, submit: act==='approve'?'Duyệt':'Không duyệt',
    fields:[{key:'note',label: act==='approve'?'Ý kiến (không bắt buộc)':'Lý do không duyệt',type:'textarea',req:act!=='approve'}],
    onSave:async v=>{ const r=await api('POST',`/api/vp/requests/${encodeURIComponent(id)}/decide`,{action:act, note:v.note||null}); VP.reqs={}; vpLoad(true); return r; }});
};
VIEWS['de-xuat']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>Đề xuất</h1></div></div>`+vpWait(); }
  const tabs=[['mine','Đề xuất của tôi']]; if(vpCanApprove()) tabs.unshift(['approve',`Chờ tôi duyệt${VP.st.pending?' ('+VP.st.pending+')':''}`]);
  if(VP.st.perms.req || vpCanApprove()) tabs.push(['all','Tất cả đề xuất']);
  const t=tabs.some(x=>x[0]===S.tab.dx)? S.tab.dx : tabs[0][0];
  const list=vpFetch(VP.reqs, t, '/api/vp/requests?scope='+t);
  const ty=S.f.dxt||'', stt=S.f.dxs||'', q=S.f.dxq||'';
  const rows=(Array.isArray(list)?list:[]).filter(r=>(!ty||r.type===ty)&&(!stt||r.status===stt)&&(!q||has({...r, ten:(vpEmp(r.employeeId)||{}).name},q)));
  const myId=(VP.st.me||{}).id;
  return `<div class="head"><div class="grow"><h1>Đề xuất</h1><p>Nghỉ phép, làm việc online, tăng ca, công tác, thanh toán, tạm ứng… Trưởng phòng hoặc người được giao duyệt.</p></div><div class="toolbar"><button class="btn primary" data-act="vp-req-new">+ Tạo đề xuất</button></div></div>
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="dx" data-id="${k}">${l}</button>`).join('')}</div>
  <div class="toolbar" style="margin:10px 0"><select data-f="dxt" aria-label="Loại đề xuất">${opts(VP.st.types, ty, 'Tất cả loại')}</select><select data-f="dxs" aria-label="Trạng thái">${opts(['Chờ duyệt','Đã duyệt','Từ chối','Đã hủy'], stt, 'Mọi trạng thái')}</select><input type="search" data-f="dxq" value="${esc(q)}" placeholder="Tìm người đề xuất, nội dung…" aria-label="Tìm đề xuất"></div>
  ${list===null? '<div class="empty">Đang tải…</div>' : list&&list.error? emptyBox(esc(list.error)) : table([
    {h:'Mã', f:r=>`<span class="num">${esc(r.code)}</span><div class="small muted">${fmtDT(r.createdAt)}</div>`},
    {h:'Người đề xuất', f:r=>vpWho(r.employeeId)+`<div class="small muted">${esc(vpDeptName((vpEmp(r.employeeId)||{}).departmentId))}</div>`},
    {h:'Loại', f:r=>`<b style="font-weight:600">${esc(r.type)}</b>${r.title?`<div class="small">${esc(r.title)}</div>`:''}`},
    {h:'Thời gian', f:r=>vpRange(r)+(r.days!=null?`<div class="small muted">${fmtN(r.days,1)} ngày</div>`:'')+(r.hours!=null?`<div class="small muted">${fmtN(r.hours,1)} ${r.type==='Xăng xe'?'km':'giờ'}</div>`:'')},
    {h:'Số tiền', r:1, f:r=>r.amount!=null? fmtN(r.amount) : ''},
    {h:'Lý do', f:r=>esc(r.reason||'')+(r.place?`<div class="small muted">${esc(r.place)}</div>`:'')},
    {h:'Trạng thái', f:r=>vpStatus(r.status)+(r.approverName?`<div class="small muted">${esc(r.approverName)}${r.decidedAt?' · '+fmtDT(r.decidedAt):''}</div>`:'')+(r.decisionNote?`<div class="small">${esc(r.decisionNote)}</div>`:'')}],
    rows, {empty: t==='approve'?'Không có đề xuất nào chờ bạn duyệt.':'Chưa có đề xuất.', pk:'dx'+t, actions:r=>{
      let h=''; if(t==='approve' && r.status==='Chờ duyệt') h+=`<button class="btn sm primary" data-act="vp-req-decide" data-a="approve" data-id="${esc(r.id)}">Duyệt</button><button class="btn sm ghost danger" data-act="vp-req-decide" data-a="reject" data-id="${esc(r.id)}">Không duyệt</button>`;
      if(r.employeeId===myId && r.status==='Chờ duyệt') h+=`<button class="btn sm ghost" data-act="vp-req-edit" data-id="${esc(r.id)}">Sửa</button><button class="btn sm ghost danger" data-act="vp-req-decide" data-a="cancel" data-id="${esc(r.id)}">Hủy</button>`;
      return h; }})}`;
};

/* ---------------------------------------------------------------- Bảng công, chấm công */
VIEWS['diem-danh']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>Bảng công</h1></div></div>`+vpWait(); }
  if(!vpCanAttAll()) return `<div class="head"><div class="grow"><h1>Bảng công</h1></div></div>`+emptyBox('Bạn xem điểm danh của mình ở mục <a href="#van-phong">Điểm danh</a>.');
  const tabs=[['bang','Bảng công tháng'],['ngay','Chi tiết điểm danh']]; if(VP.st.perms.attEdit) tabs.push(['thiet-lap','Thiết lập điểm danh']);
  const t=tabs.some(x=>x[0]===S.tab.dd)? S.tab.dd : 'bang'; const m=vpMonth();
  let body='';
  if(t==='bang'){
    const ts=vpFetch(VP.ts, m, '/api/vp/timesheet?month='+m); const dep=S.f.ddp||'';
    const rows=ts&&ts.rows? ts.rows.filter(r=>!dep||r.departmentId===dep) : [];
    body= !ts? '<div class="empty">Đang tải…</div>' : ts.error? emptyBox(esc(ts.error)) : `<p class="small muted">Công chuẩn tháng ${m.slice(5)}/${m.slice(0,4)}: <b>${fmtN(ts.standard,1)}</b> ngày (đã trừ Chủ nhật${VP.st.settings.saturday==='khong'?', thứ Bảy':''} và ngày nghỉ lễ). Nghỉ không lý do: ngày làm việc đã qua không có điểm danh và không có đề xuất nghỉ phép, công tác, làm việc online được duyệt.</p>`+table([
      {h:'Họ tên', f:r=>`<a href="#" data-act="vp-ts-emp" data-id="${esc(r.employeeId)}">${esc(r.name)}</a><div class="small muted">${esc(vpDeptName(r.departmentId))}</div>`},
      {h:'Ngày công', r:1, f:r=>`<b>${fmtN(r.worked,1)}</b>/${fmtN(r.standard,1)}`},
      {h:'Đi muộn', r:1, f:r=>r.late? `${r.late} lần<div class="small muted">${r.lateMinutes} phút</div>`:'—'},
      {h:'Về sớm', r:1, f:r=>r.early||'—'}, {h:'Quên điểm danh ra', r:1, f:r=>r.noOut||'—'},
      {h:'Ngoài công ty', r:1, f:r=>r.outside||'—'}, {h:'Online', r:1, f:r=>r.online||'—'},
      {h:'Nghỉ phép', r:1, f:r=>r.leave? fmtN(r.leave,1):'—'}, {h:'Công tác', r:1, f:r=>r.trip? fmtN(r.trip,1):'—'},
      {h:'Tăng ca (giờ)', r:1, f:r=>r.overtime? fmtN(r.overtime,1):'—'},
      {h:'Nghỉ không lý do', r:1, f:r=>r.absent? `<b style="color:var(--red)">${fmtN(r.absent,1)}</b>`:'—'}], rows, {empty:'Chưa có nhân sự điểm danh.', pk:'ddts'});
    body=`<div class="toolbar" style="margin:10px 0"><input type="month" data-f="vpm" value="${esc(m)}" aria-label="Tháng"><select data-f="ddp" aria-label="Phòng ban">${opts(VP.depts.map(d=>[d.id,d.name]), dep, 'Tất cả phòng ban')}</select><button class="btn sm ghost" data-act="vp-ts-xlsx">Xuất Excel</button></div>`+body;
  } else if(t==='ngay'){
    const list=vpFetch(VP.att, 'all|'+m, '/api/vp/attendance?month='+m); const e=S.f.dde||'', d=S.f.ddd||'', pl=S.f.ddl||'';
    const rows=(Array.isArray(list)?list:[]).filter(x=>(!e||x.employeeId===e)&&(!d||x.date===d)&&(!pl||x.inPlace===pl)).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.inAt).localeCompare(String(b.inAt)));
    body=`<div class="toolbar" style="margin:10px 0"><input type="month" data-f="vpm" value="${esc(m)}" aria-label="Tháng"><input type="date" data-f="ddd" value="${esc(d)}" aria-label="Ngày"><select data-f="dde" aria-label="Nhân sự">${opts(VP.emps.map(x=>[x.id,x.name]), e, 'Tất cả nhân sự')}</select><select data-f="ddl" aria-label="Nơi điểm danh">${opts(['Trong công ty','Ngoài công ty','Làm việc online','Công tác'], pl, 'Mọi nơi')}</select>${VP.st.perms.attEdit?`<button class="btn sm" data-act="vp-fix" data-id="">+ Bổ sung điểm danh</button>`:''}</div>`
    + (list===null? '<div class="empty">Đang tải…</div>' : table([
      {h:'Ngày', f:x=>fmtDate(x.date)}, {h:'Họ tên', f:x=>vpWho(x.employeeId)},
      {h:'Giờ vào', f:x=>vpHM(x.inAt)+(x.lateMinutes>0?` <span class="small" style="color:var(--red)">muộn ${x.lateMinutes}′</span>`:'')},
      {h:'Giờ ra', f:x=>vpHM(x.outAt)+(x.earlyMinutes>0?` <span class="small" style="color:var(--amber)">sớm ${x.earlyMinutes}′</span>`:'')},
      {h:'Nơi', f:x=>vpPlacePill(x.inPlace)+(x.site?`<div class="small muted">${esc(x.site)}</div>`:'')+(x.inLat?`<div class="small"><a href="https://www.google.com/maps?q=${x.inLat},${x.inLng}" target="_blank" rel="noopener">Xem bản đồ</a></div>`:'')},
      {h:'IP', f:x=>`<span class="small">${esc(x.inIp||'')}</span>`}, {h:'Ghi chú', f:x=>esc(x.note||'')+(x.source==='e-work'?' <span class="small muted">(e-work)</span>':'')}],
      rows, {empty:'Không có điểm danh phù hợp.', pk:'ddng', actions: VP.st.perms.attEdit? x=>`<button class="btn sm ghost" data-act="vp-fix" data-id="${esc(x.id)}">Điều chỉnh</button>` : null}));
  } else body=vpSettingsHTML();
  return `<div class="head"><div class="grow"><h1>Bảng công, chấm công</h1><p>${VP.st.perms.att?'Toàn công ty':'Phòng do bạn phụ trách'}</p></div></div>
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="dd" data-id="${k}">${l}</button>`).join('')}</div>${body}`;
};
ACT['vp-ts-emp']=id=>{ S.tab.dd='ngay'; S.f.dde=id; render(); };
ACT['vp-ts-xlsx']=()=>{ const m=vpMonth(), ts=VP.ts[m]; if(!ts||!ts.rows) return;
  const head=['Họ tên','Phòng ban','Ngày công','Công chuẩn','Đi muộn (lần)','Đi muộn (phút)','Về sớm','Quên điểm danh ra','Ngoài công ty','Online','Nghỉ phép','Công tác','Tăng ca (giờ)','Nghỉ không lý do'];
  const rows=ts.rows.map(r=>[r.name, vpDeptName(r.departmentId), r.worked, r.standard, r.late, r.lateMinutes, r.early, r.noOut, r.outside, r.online, r.leave, r.trip, r.overtime, r.absent]);
  const ws=XLSX.utils.aoa_to_sheet([['BẢNG CÔNG THÁNG '+m.slice(5)+'/'+m.slice(0,4)],[],head,...rows]); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Bang cong');
  XLSX.writeFile(wb, `Bang_cong_${m}.xlsx`); };
ACT['vp-fix']=id=>{
  const all=VP.att['all|'+vpMonth()]; const x=(Array.isArray(all)?all:[]).find(a=>a.id===id) || {};
  openForm({title: id?'Điều chỉnh điểm danh':'Bổ sung điểm danh', narrow:true, value:{employeeId:x.employeeId, date:x.date||TODAY, in:x.inAt?vpHM(x.inAt):'', out:x.outAt?vpHM(x.outAt):'', inPlace:x.inPlace||'Trong công ty'},
    fields:[{key:'employeeId',label:'Nhân sự',type:'select',req:true,options:()=>VP.emps.map(e=>[e.id,e.name])},{key:'date',label:'Ngày',type:'date',req:true},
      {key:'in',label:'Giờ vào',ph:'08:00'},{key:'out',label:'Giờ ra',ph:'17:30'},{key:'inPlace',label:'Nơi',type:'select',req:true,options:['Trong công ty','Ngoài công ty','Làm việc online','Công tác']},
      {key:'note',label:'Lý do điều chỉnh',type:'textarea',req:true}],
    onSave:async v=>{ const r=await api('POST','/api/vp/attendance/fix',v); VP.att={}; VP.ts={}; return r; }});
};
function vpSettingsHTML(){
  if(!VP.set){ api('GET','/api/vp/settings').then(s=>{ VP.set=s; onData(); }).catch(e=>toast(errText(e),'err')); return '<div class="empty">Đang tải…</div>'; }
  const s=VP.set;
  return `<div class="grid g2" style="margin-top:12px"><div class="card"><h2 style="margin-top:0">Giờ làm việc</h2>
    <div class="fgrid">${[['checkIn','Giờ vào (đi muộn tính từ giờ này)'],['checkOut','Giờ ra (về sớm tính trước giờ này)'],['morningStart','Ca sáng từ'],['morningEnd','Ca sáng đến'],['afternoonStart','Ca chiều từ'],['afternoonEnd','Ca chiều đến']].map(([k,l])=>`<div class="fld"><label for="vs_${k}">${l}</label><input id="vs_${k}" value="${esc(s[k]||'')}" placeholder="08:00"></div>`).join('')}
    <div class="fld"><label for="vs_saturday">Thứ Bảy</label><select id="vs_saturday">${opts([['khong','Nghỉ'],['sang','Làm buổi sáng'],['ca-ngay','Làm cả ngày']], s.saturday)}</select></div>
    <div class="fld"><label for="vs_leavePerYear">Ngày phép năm</label><input id="vs_leavePerYear" type="number" value="${esc(s.leavePerYear)}"></div>
    <div class="fld full"><label><input type="checkbox" id="vs_allowOutside" ${s.allowOutside?'checked':''}> Cho điểm danh khi ở ngoài công ty (ghi rõ "Ngoài công ty" để trưởng phòng xem)</label></div></div>
    <p class="small muted">Giờ vào riêng từng phòng thiết lập ở Nhân sự → Phòng ban.</p></div>
  <div class="card"><h2 style="margin-top:0">Nơi điểm danh</h2><p class="small muted" style="margin-top:0">Văn phòng, công trình đang triển khai… mỗi dòng: tên; vĩ độ; kinh độ; bán kính (m). Lấy tọa độ: mở Google Maps, nhấn giữ vào vị trí, chép hai số hiện ra.</p>
    <textarea id="vs_places" rows="5" style="width:100%">${esc((s.places||[]).map(p=>[p.name,p.lat,p.lng,p.radius].join('; ')).join('\n'))}</textarea>
    <h3>Địa chỉ IP mạng công ty</h3><p class="small muted" style="margin-top:0">Mỗi dòng một IP. Điểm danh từ mạng này tính là trong công ty. IP của bạn lúc này: <b>${esc(VP.st.ip||'')}</b></p>
    <textarea id="vs_ips" rows="4" style="width:100%">${esc((s.ips||[]).join('\n'))}</textarea></div>
  <div class="card"><h2 style="margin-top:0">Ngày nghỉ lễ, tết</h2><p class="small muted" style="margin-top:0">Mỗi dòng một ngày dạng 2026-09-02; nghỉ nửa ngày ghi thêm :s (sáng) hoặc :c (chiều).</p><textarea id="vs_holidays" rows="6" style="width:100%">${esc((s.holidays||[]).join('\n'))}</textarea></div>
  <div class="card"><h2 style="margin-top:0">Chuyển tiếp với e-work</h2>
    ${VP.st.perms.admin?`<p class="small">1. Chuyển dữ liệu: chạy <b>xuat-ework.ps1</b> trên máy chủ e-work, rồi chọn tệp <b>ework_xuat.json</b> tại đây (chạy lại được, không sinh trùng).</p>
    <div class="toolbar"><input type="file" id="vs_ew" accept=".json"><button class="btn sm" data-act="vp-ew-import">Chuyển dữ liệu từ e-work</button><a class="btn sm" href="#ework-cu">Tra cứu dữ liệu e-work cũ</a></div>
    <p class="small" style="margin-top:12px">2. Chép chấm công sang e-work để tính lương trong thời gian chuyển tiếp: ${s.syncKeyHash?pill('Đang bật','ok')+` từ ngày ${fmtDate(s.syncFrom)}`:pill('Chưa bật')}</p>
    <div class="toolbar"><button class="btn sm" data-act="vp-sync-key">${s.syncKeyHash?'Tạo lại khóa':'Tạo khóa chép chấm công'}</button></div>`:'<p class="small muted">Dành cho quản trị hệ thống.</p>'}</div></div>
  <div class="toolbar" style="margin-top:12px"><button class="btn primary" data-act="vp-set-save">Lưu thiết lập</button></div>`;
}
ACT['vp-set-save']=async()=>{
  const s={...VP.set}; ['checkIn','checkOut','morningStart','morningEnd','afternoonStart','afternoonEnd','saturday'].forEach(k=>s[k]=$('#vs_'+k).value.trim());
  for(const k of ['checkIn','checkOut','morningStart','morningEnd','afternoonStart','afternoonEnd']) if(!/^\d{2}:\d{2}$/.test(s[k])){ toast('Giờ ghi dạng 08:00 (hai chữ số).','err'); return; }
  s.leavePerYear=N($('#vs_leavePerYear').value); s.allowOutside=$('#vs_allowOutside').checked;
  const bad=[]; s.places=$('#vs_places').value.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{ const p=l.split(';').map(x=>x.trim()); const o={name:p[0], lat:parseFloat(p[1]), lng:parseFloat(p[2]), radius:parseInt(p[3])||500}; if(!o.name||isNaN(o.lat)||isNaN(o.lng)) bad.push(l); return o; });
  if(bad.length){ toast('Dòng nơi điểm danh chưa đúng: '+bad[0],'err'); return; }
  s.ips=$('#vs_ips').value.split(/[\n,;]/).map(x=>x.trim()).filter(Boolean);
  s.holidays=$('#vs_holidays').value.split('\n').map(x=>x.trim()).filter(x=>/^\d{4}-\d{2}-\d{2}(:[sc])?$/.test(x));
  delete s.syncKeyHash;
  await api('PUT','/api/vp/settings', s); VP.set=null; VP.ts={}; vpLoad(true); toast('Đã lưu thiết lập điểm danh');
};
ACT['vp-ew-import']=async(id,el)=>{
  const f=($('#vs_ew').files||[])[0]; if(!f){ toast('Chọn tệp ework_xuat.json','err'); return; }
  el.disabled=true; el.textContent='Đang chuyển…';
  try{ const fd=new FormData(); fd.append('file', f); const r=await api('POST','/api/vp/import-ework', fd);
    VP.att={}; VP.ts={}; VP.reqs={}; VP.set=null; VP.ew={}; VP.mt={}; VP.nt=null; VP.ib=null; await Store.load().catch(()=>{}); vpLoad(true);
    openModal(`<div class="mform wide"><header><h3>Đã chuyển dữ liệu từ e-work</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:16px">
      <p>Thêm mới: <b>${r.departments}</b> phòng ban, <b>${r.employees}</b> hồ sơ nhân sự, <b>${r.attendances}</b> lượt chấm công, <b>${r.requests}</b> đề xuất, <b>${r.meetings}</b> lịch họp, <b>${r.notices}</b> thông báo, <b>${r.holidays}</b> ngày nghỉ.</p>
      ${Object.keys(r.archive||{}).length?`<p>Lưu trữ để tra cứu: <b>${fmtN(Object.values(r.archive).reduce((a,b)=>a+b,0))}</b> dòng của <b>${Object.keys(r.archive).length}</b> bảng (công việc, KPI, bảng lương…). <a href="#ework-cu" data-close>Xem dữ liệu e-work cũ</a></p>`:''}
      ${r.newAccounts.length?`<h3>Tài khoản mới (${r.newAccounts.length}): mật khẩu tạm chỉ hiện một lần, người dùng phải đổi ở lần đăng nhập đầu</h3><div class="toolbar"><button class="btn sm" data-act="vp-acc-xlsx">Tải danh sách (Excel)</button></div>
      ${table([{h:'Họ tên',k:'name'},{h:'Phòng ban',k:'department'},{h:'Tên đăng nhập',k:'username'},{h:'Mật khẩu tạm',f:x=>`<code>${esc(x.password)}</code>`}], r.newAccounts, {nopage:true})}`:''}
      ${r.linkedAccounts.length?`<details><summary>Gắn với tài khoản sẵn có (${r.linkedAccounts.length})</summary><p class="small">${r.linkedAccounts.map(esc).join('<br>')}</p></details>`:''}
      ${r.warnings.length?`<div class="alert">${r.warnings.map(esc).join('<br>')}</div>`:''}</div></div>`);
    VP._acc=r.newAccounts;
  }catch(e){ toast(errText(e),'err'); } el.disabled=false; el.textContent='Chuyển dữ liệu từ e-work';
};
ACT['vp-acc-xlsx']=()=>{ const l=VP._acc||[]; const ws=XLSX.utils.aoa_to_sheet([['Họ tên','Phòng ban','Tên đăng nhập','Mật khẩu tạm'],...l.map(x=>[x.name,x.department||'',x.username,x.password])]);
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Tai khoan'); XLSX.writeFile(wb, 'Tai_khoan_moi.xlsx'); };
ACT['vp-sync-key']=async()=>{
  const from=prompt('Chép các lượt điểm danh từ ngày (yyyy-mm-dd):', TODAY); if(!from) return;
  const r=await api('POST','/api/vp/sync-key?from='+encodeURIComponent(from)); VP.set=null;
  openModal(`<div class="mform"><header><h3>Khóa chép chấm công sang e-work</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:16px">
    <p>Khóa chỉ hiện một lần. Dán vào tham số <code>-Khoa</code> khi cài tác vụ <b>chep-cham-cong-ework.ps1</b> trên máy chủ e-work:</p><p><code style="font-size:15px;user-select:all">${esc(r.key)}</code></p>
    <p class="small muted">Chép từ ngày ${fmtDate(r.syncFrom)}. Tạo lại khóa thì khóa cũ hết hiệu lực.</p></div></div>`);
};

/* ---------------------------------------------------------------- Nhân sự, phòng ban */
VIEWS['nhan-su']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>Nhân sự</h1></div></div>`+vpWait(); }
  const ed=VP.st.perms.hrEdit; const t=S.tab.ns==='pb'?'pb':'ns';
  let body;
  if(t==='ns'){
    const dep=S.f.nsd||'', stt=S.f.nss||'Đang làm việc', q=S.f.nsq||'';
    const rows=VP.emps.filter(e=>(!dep||e.departmentId===dep)&&(!stt||e.status===stt)&&has(e,q)).sort((a,b)=>vpDeptName(a.departmentId).localeCompare(vpDeptName(b.departmentId),'vi')||String(a.name).localeCompare(String(b.name),'vi'));
    const acc=id=>{ const u=D('users').find(x=>x.id===id); return u? esc(u.username) : '<span class="muted">Chưa có</span>'; };
    body=`<div class="toolbar" style="margin:10px 0"><select data-f="nsd" aria-label="Phòng ban">${opts(VP.depts.map(d=>[d.id,d.name]), dep, 'Tất cả phòng ban')}</select><select data-f="nss" aria-label="Trạng thái">${opts(['Đang làm việc','Thử việc','Tạm nghỉ','Nghỉ việc'], stt, 'Mọi trạng thái')}</select><input type="search" data-f="nsq" value="${esc(q)}" placeholder="Tìm họ tên, điện thoại…" aria-label="Tìm nhân sự">${ed?`<button class="btn primary" data-act="vp-emp" data-id="">+ Thêm nhân sự</button>`:''}</div>`
    + table([{h:'Họ tên', f:e=>`<b style="font-weight:600">${esc(e.name)}</b>${e.code?` <span class="small muted">${esc(e.code)}</span>`:''}<div class="small muted">${esc(e.position||'')}</div>`},
      {h:'Phòng ban', f:e=>esc(vpDeptName(e.departmentId))}, {h:'Liên hệ', f:e=>[e.phone,e.email].filter(Boolean).map(esc).join('<br>')},
      {h:'Tài khoản', f:e=>acc(e.userId)}, {h:'Điểm danh', f:e=>e.attendance?'Có':'Không'}, {h:'Trạng thái', f:e=>pill(e.status, e.status==='Đang làm việc'?'ok':'')}],
      rows, {empty:'Chưa có hồ sơ nhân sự.', pk:'ns', rowAct: ed||VP.st.perms.hr? 'vp-emp' : null});
  } else {
    body=`<div class="toolbar" style="margin:10px 0">${ed?`<button class="btn primary" data-act="vp-dept" data-id="">+ Thêm phòng ban</button>`:''}</div>`+table([
      {h:'Mã', k:'code'}, {h:'Phòng ban', f:d=>`<b style="font-weight:600">${esc(d.name)}</b>`},
      {h:'Trưởng phòng (duyệt đề xuất)', f:d=>{ const u=D('users').find(x=>x.id===d.managerUserId); return u? esc(u.name) : '<span class="muted">Chưa chọn</span>'; }},
      {h:'Giờ vào', f:d=>esc(d.checkinTime||VP.st.settings.checkIn)}, {h:'Số người', r:1, f:d=>VP.emps.filter(e=>e.departmentId===d.id && e.status!=='Nghỉ việc').length}],
      VP.depts, {empty:'Chưa có phòng ban.', pk:'pb', actions: ed? d=>`<button class="btn sm ghost" data-act="vp-dept" data-id="${esc(d.id)}">Sửa</button><button class="btn sm ghost danger" data-act="vp-dept-del" data-id="${esc(d.id)}">Xóa</button>` : null});
  }
  return `<div class="head"><div class="grow"><h1>Nhân sự</h1><p>${VP.emps.filter(e=>e.status!=='Nghỉ việc').length} người đang làm việc, ${VP.depts.length} phòng ban</p></div></div>
  <div class="tabs">${[['ns','Hồ sơ nhân sự'],['pb','Phòng ban']].map(([k,l])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="ns" data-id="${k}">${l}</button>`).join('')}</div>${body}`;
};
ACT['vp-emp']=id=>{
  const e=vpEmp(id)||{status:'Đang làm việc', attendance:true}; const ed=VP.st.perms.hrEdit;
  const used=new Set(VP.emps.filter(x=>x.id!==id && x.userId).map(x=>x.userId));
  const F=[{key:'name',label:'Họ tên',req:true},{key:'code',label:'Mã nhân viên'},{key:'departmentId',label:'Phòng ban',type:'select',options:()=>VP.depts.map(d=>[d.id,d.name])},
    {key:'position',label:'Chức vụ, vị trí',suggest:()=>VP.emps.map(x=>x.position)},{key:'userId',label:'Tài khoản đăng nhập',type:'select',options:()=>D('users').filter(u=>!used.has(u.id)).map(u=>[u.id,u.name+' ('+u.username+')'])},
    {key:'status',label:'Trạng thái',type:'select',req:true,options:['Đang làm việc','Thử việc','Tạm nghỉ','Nghỉ việc']},{key:'attendance',label:'Điểm danh',type:'select',req:true,options:[['true','Có điểm danh'],['false','Không điểm danh']]},
    {key:'phone',label:'Điện thoại'},{key:'email',label:'Thư điện tử'},{key:'birthday',label:'Ngày sinh',type:'date'},{key:'gender',label:'Giới tính',type:'select',options:['Nam','Nữ']},
    {key:'startDate',label:'Ngày vào làm',type:'date'},{key:'address',label:'Địa chỉ',full:true},
    {key:'_h',type:'html',html:'<div class="fld full"><h3 style="margin:8px 0 0">Thông tin riêng</h3><span class="small muted">Chỉ người quản lý nhân sự và chính người đó xem được.</span></div>'},
    {key:'idNumber',label:'Số CCCD'},{key:'idDate',label:'Ngày cấp',type:'date'},{key:'idPlace',label:'Nơi cấp'},{key:'taxCode',label:'Mã số thuế cá nhân'},{key:'insuranceNo',label:'Số sổ BHXH'},
    {key:'dependents',label:'Số người phụ thuộc',type:'number'},{key:'bankAccount',label:'Số tài khoản ngân hàng'},{key:'bankName',label:'Ngân hàng'},
    {key:'contractType',label:'Loại hợp đồng lao động',suggest:['Thử việc','Xác định thời hạn 12 tháng','Xác định thời hạn 36 tháng','Không xác định thời hạn','Cộng tác viên']},{key:'contractNo',label:'Số hợp đồng'},
    {key:'contractStart',label:'Hợp đồng từ ngày',type:'date'},{key:'contractEnd',label:'Hợp đồng đến ngày',type:'date'},{key:'note',label:'Ghi chú',type:'textarea'}];
  if(!ed){ openModal(`<div class="mform wide"><header><h3>${esc(e.name)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div class="fgrid" style="padding:16px">${F.filter(f=>f.type!=='html'&&e[f.key]!=null&&e[f.key]!=='').map(f=>`<div class="fld"><label>${esc(f.label)}</label><div>${esc(f.key==='departmentId'?vpDeptName(e[f.key]):f.key==='userId'?((D('users').find(u=>u.id===e.userId)||{}).username||''):f.type==='date'?fmtDate(e[f.key]):String(e[f.key]))}</div></div>`).join('')}</div></div>`); return; }
  openForm({title: id?'Hồ sơ nhân sự':'Thêm nhân sự', wide:true, fields:F, value:{...e, attendance:String(e.attendance!==false)},
    onSave:async v=>{ const o={...e, ...v, attendance: v.attendance==='true', dependents: N(v.dependents)}; delete o._h; ['birthday','idDate','startDate','contractStart','contractEnd'].forEach(k=>{ if(!o[k]) o[k]=null; }); if(!o.userId) o.userId=null; if(!o.departmentId) o.departmentId=null;
      const r=await api('PUT','/api/vp/employees/'+encodeURIComponent(id||uid('ns')), o); await vpLoad(true); return r; }});
};
ACT['vp-dept']=id=>{ const d=vpDept(id)||{order:VP.depts.length+1};
  openForm({title: id?'Sửa phòng ban':'Thêm phòng ban', narrow:true, value:d, fields:[{key:'name',label:'Tên phòng ban',req:true},{key:'code',label:'Mã'},
    {key:'managerUserId',label:'Trưởng phòng (duyệt đề xuất, xem bảng công của phòng)',type:'select',options:()=>D('users').filter(u=>u.active!==false).map(u=>[u.id,u.name+' ('+u.username+')'])},
    {key:'checkinTime',label:'Giờ vào riêng của phòng (để trống: theo giờ chung)',ph:'07:45'},{key:'order',label:'Thứ tự',type:'number'}],
    onSave:async v=>{ if(v.checkinTime && !/^\d{2}:\d{2}$/.test(v.checkinTime)) throw new Error('Giờ ghi dạng 07:45.'); const r=await api('PUT','/api/vp/departments/'+encodeURIComponent(id||uid('pb')), {...d, ...v, managerUserId:v.managerUserId||null, order:N(v.order)}); await vpLoad(true); return r; }}); };
ACT['vp-dept-del']=async id=>{ const d=vpDept(id); if(!d||!await confirmBox(`Xóa phòng ban <b>${esc(d.name)}</b>?`)) return; await api('DELETE','/api/vp/departments/'+encodeURIComponent(id)); await vpLoad(true); toast('Đã xóa'); };
