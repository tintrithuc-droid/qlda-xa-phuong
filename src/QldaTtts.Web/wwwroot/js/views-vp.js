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
function vpReset(){ VP.tk=null; VP.td={}; VP.st=null; VP.att={}; VP.ts={}; VP.reqs={}; VP.set=null; VP.ew={}; VP.mt={}; VP.nt=null; VP.ib=null; }
const vpEmp = id => VP.emps.find(e=>e.id===id);
const vpDept = id => VP.depts.find(d=>d.id===id);
const vpDeptName = id => (vpDept(id)||{}).name || '';
const vpMonth = () => S.f.vpm || TODAY.slice(0,7);
const vpHM = s => { if(!s) return '—'; const d=parseTs(s); return pad(d.getHours())+':'+pad(d.getMinutes()); };
const vpWho = id => { const e=vpEmp(id); return e? esc(e.name) : '<span class="muted">—</span>'; };
const vpCanAttAll = () => VP.st && (VP.st.perms.att || (VP.st.perms.managed||[]).length>0);
const vpCanApprove = () => VP.st && VP.st.perms.approve;
const vpPlacePill = p => !p? '' : pill(p==='Trong công ty'&&vpSimple()?'Ở công ty':p, p==='Trong công ty'?'ok':p==='Ngoài công ty'?'warn':'info');
/* Bản 1.10.16: "Nhận nhiệm vụ" (một lượt mỗi ngày, tự chọn nơi làm, không định vị) bật theo thiết lập đơn vị; chữ hiển thị lấy từ thiết lập */
const vpSimple = () => !!(VP.st && VP.st.settings && VP.st.settings.inOnly);
function vpW(){ const w=VP.st&&VP.st.settings&&VP.st.settings.word; if(w){ try{ localStorage.setItem('vpWord',w); }catch(e){} return w; } try{ return localStorage.getItem('vpWord')||'Điểm danh'; }catch(e){ return 'Điểm danh'; } }
const vpPlaces = () => vpSimple()? ['Trong công ty','Làm việc online','Công tác','Khác'] : ['Trong công ty','Ngoài công ty','Làm việc online','Công tác'];
const vpPlaceOpts = () => vpPlaces().map(p=>[p, p==='Trong công ty'&&vpSimple()?'Ở công ty':p]);
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
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>${esc(vpW())}</h1></div></div>`+vpWait(); }
  const st=VP.st, me=st.me, a=st.attendance, W=vpW(), w=W.toLowerCase(), simple=vpSimple();
  const m=vpMonth(); const mine=me? vpFetch(VP.att, 'me|'+m, `/api/vp/attendance?month=${m}&employeeId=${encodeURIComponent(me.id)}`) : [];
  const reqs=vpFetch(VP.reqs, 'mine', '/api/vp/requests?scope=mine');
  const now=new Date(); const hhmm=pad(now.getHours())+':'+pad(now.getMinutes());
  let box;
  if(!me) box=`<div class="alert">Tài khoản của bạn chưa gắn với hồ sơ nhân sự nên chưa ${w} được. Liên hệ người quản lý nhân sự để được gắn.</div>`;
  else if(!me.attendance) box=`<div class="alert info">Hồ sơ của bạn được thiết lập không cần ${w}.</div>`;
  else if(st.day && st.day.canCheck===false) box=vpGreet(st)+`<div class="vp-clock"><div class="vp-time" id="vp_clock">${hhmm}</div><div class="muted">${['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][now.getDay()]}, ${fmtDate(st.today)}</div></div><div class="toolbar" style="justify-content:center"><button class="btn" data-act="vp-req-new">Lập phiếu xác nhận tăng ca</button></div>`;
  else if(simple) box=vpGreet(st)+`<div class="vp-clock"><div class="vp-time" id="vp_clock">${hhmm}</div><div class="muted">${['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][now.getDay()]}, ${fmtDate(st.today)}</div></div>
    ${a&&a.inAt? `<div class="alert ok vp-done"><b>Đã ${esc(w)} lúc ${vpHM(a.inAt)}</b> ${vpPlacePill(a.inPlace)}${a.lateMinutes>0?' '+pill('Muộn '+a.lateMinutes+' phút','bad'):''}${a.note?`<div class="small">${esc(a.note)}</div>`:''}${a.taskNames?`<div class="small" style="margin-top:4px"><b>Việc hôm nay:</b><ul style="margin:2px 0 0 18px;padding:0">${a.taskNames.split('\n').map(n=>`<li>${esc(n)}</li>`).join('')}</ul></div>`:''}</div>
    <div class="fld" style="margin-top:8px"><label for="vp_result">Kết quả hôm nay (không bắt buộc)</label><textarea id="vp_result" rows="2" maxlength="1000" style="width:100%" placeholder="Ví dụ: xong dự toán hạng mục cấp nước, gửi chủ đầu tư">${esc(S.f.vpres!=null?S.f.vpres:(a.result||''))}</textarea></div>
    <div class="toolbar"><button class="btn sm" data-act="vp-result">${a.result?'Cập nhật kết quả':'Lưu kết quả'}</button>${a.resultAt?`<span class="small muted">Đã lưu lúc ${vpHM(a.resultAt)}</span>`:''}</div>`
    : `<div class="vp-mode" role="radiogroup" aria-label="Hôm nay làm việc ở đâu">${[['office','Ở công ty'],['online','Làm việc online'],['congtac','Đi công tác'],['khac','Khác']].map(([k,l])=>`<label><input type="radio" name="vp_mode" value="${k}" ${(S.f.vpmode||'office')===k?'checked':''}> ${l}</label>`).join('')}</div>
    <div class="fld" id="vp_note_box" style="margin:8px 0;${(S.f.vpmode||'office')==='khac'?'':'display:none'}"><label for="vp_note">Nội dung công việc hôm nay</label><textarea id="vp_note" rows="2" maxlength="500" style="width:100%" placeholder="Ví dụ: họp với chủ đầu tư tại UBND xã…">${esc(S.f.vpnote||'')}</textarea></div>
    ${vpTaskPick()}
    <div class="vp-btns"><button class="btn primary vp-big" data-act="vp-check" data-id="in">${esc(W)}</button></div>`}
    ${'Notification' in window && Notification.permission==='default' && !(a&&a.inAt)? `<div class="small" style="margin-top:6px"><a href="#" data-act="vp-notify-on">Bật nhắc trên thiết bị này</a></div>`:''}
    <p class="small muted" style="margin:8px 0 0">Mỗi ngày làm việc bấm một lần, trước ${esc(st.settings.checkIn)} để không bị tính đi muộn. Ngày làm việc không ${esc(w)} và không có phiếu nghỉ phép được duyệt tính là nghỉ không phép.</p>`;
  else box=vpGreet(st)+`<div class="vp-clock"><div class="vp-time" id="vp_clock">${hhmm}</div><div class="muted">${['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][now.getDay()]}, ${fmtDate(st.today)}</div></div>
    <div class="vp-state">
      <div><span class="eyebrow">Giờ vào</span><b>${a&&a.inAt? vpHM(a.inAt) : '—'}</b>${a&&a.inAt? vpPlacePill(a.inPlace)+(a.lateMinutes>0?' '+pill('Muộn '+a.lateMinutes+' phút','bad'):''):''}${a&&a.site?`<div class="small muted">${esc(a.site)}</div>`:''}</div>
      <div><span class="eyebrow">Giờ ra</span><b>${a&&a.outAt? vpHM(a.outAt) : '—'}</b>${a&&a.outAt? vpPlacePill(a.outPlace)+(a.earlyMinutes>0?' '+pill('Sớm '+a.earlyMinutes+' phút','warn'):''):''}</div>
    </div>
    <div class="vp-mode" role="radiogroup" aria-label="Hình thức làm việc">${[['office','Tại công ty, công trình'],['online','Làm việc online'],['congtac','Đi công tác']].map(([k,l])=>`<label><input type="radio" name="vp_mode" value="${k}" ${(S.f.vpmode||'office')===k?'checked':''}> ${l}</label>`).join('')}</div>
    <div class="vp-btns">${!(a&&a.inAt)?`<button class="btn primary vp-big" data-act="vp-check" data-id="in">Điểm danh vào</button>`:''}<button class="btn ${a&&a.inAt?'primary':''} vp-big" data-act="vp-check" data-id="out">${a&&a.outAt?'Điểm danh ra lại':'Điểm danh ra'}</button></div>
    <p class="small muted" style="margin:8px 0 0">Giờ vào quy định ${esc(st.settings.checkIn)}, giờ ra ${esc(st.settings.checkOut)}. Bật định vị trên điện thoại để hệ thống xác nhận bạn đang ở công ty (trong bán kính ${esc(String((st.settings.places[0]||{}).radius||500))} m) hoặc dùng mạng của công ty.</p>`;
  const rows=Array.isArray(mine)? mine.slice().sort((x,y)=>String(y.date).localeCompare(String(x.date))) : [];
  const late=rows.filter(x=>x.lateMinutes>0);
  return `<div class="head"><div class="grow"><h1>${esc(W)}</h1><p>${me? esc(me.name)+(me.departmentId?' · '+esc(vpDeptName(me.departmentId)):'') : esc(S.user.name)}</p></div>
    <div class="toolbar"><button class="btn" data-act="vp-req-new">+ Tạo đề xuất</button></div></div>
  ${vpPayAlert(st)}<div class="grid g2 vp-top"><div class="card">${box}</div>
    <div class="card"><h2 style="margin-top:0">Tháng ${m.slice(5)}/${m.slice(0,4)}</h2>
      <div class="grid g3 kpis"><div class="kpi"><div class="eyebrow">Ngày có ${esc(w)}</div><div class="v">${rows.length}</div></div>
      <div class="kpi ${late.length?'warn':''}"><div class="eyebrow">Đi muộn</div><div class="v">${late.length}</div><div class="s">${late.reduce((s,x)=>s+x.lateMinutes,0)} phút</div></div>
      <div class="kpi"><div class="eyebrow">Phép năm ${st.leave.year} còn</div><div class="v">${fmtN(st.leave.left,1)}</div><div class="s">đã nghỉ ${fmtN(st.leave.used,1)}/${fmtN(st.leave.total)} ngày</div></div></div>
      ${vpReqMini(reqs)}</div></div>
  <div class="card" style="margin-top:12px"><div class="toolbar" style="justify-content:space-between"><h2 style="margin:0">Lịch sử ${esc(w)}</h2><input type="month" data-f="vpm" value="${esc(m)}" aria-label="Tháng"></div>
    ${mine===null? '<div class="empty">Đang tải…</div>' : table([
      {h:'Ngày', f:x=>`${['CN','T2','T3','T4','T5','T6','T7'][new Date(x.date).getDay()]} ${fmtDate(x.date)}`},
      {h:'Giờ vào', f:x=>vpHM(x.inAt)+(x.lateMinutes>0?` <span class="small" style="color:var(--red)">+${x.lateMinutes}′</span>`:'')},
      ...(simple?[]:[{h:'Giờ ra', f:x=>vpHM(x.outAt)+(x.earlyMinutes>0?` <span class="small" style="color:var(--amber)">−${x.earlyMinutes}′</span>`:'')}]),
      {h:simple?'Nơi làm việc':'Nơi điểm danh', f:x=>vpPlacePill(x.inPlace)+(x.site?`<div class="small muted">${esc(x.site)}</div>`:'')},
      {h:'Ghi chú', f:x=>esc(x.note||'')+(x.source==='e-work'?' <span class="small muted">(e-work)</span>':'')}], rows, {empty:'Chưa có '+esc(w)+' trong tháng.', pk:'vpme'})}</div>`;
};
/* Bản 1.10.4: lời chúc theo lịch làm việc, nhắc xác nhận lương trong hạn */
function vpGreet(st){
  const d=st.day||{}; const off=!(d.value>0);
  let h=`<div class="alert ${off?'info':'ok'} vp-greet" style="margin-bottom:10px"><b>${esc(d.greeting||'')}</b>${off?'<div class="small">Hôm nay không ${esc(vpW().toLowerCase())}. Có làm thêm giờ thì sau khi làm xong lập phiếu xác nhận tăng ca để người phụ trách duyệt.</div>':d.kind==='half'?`<div class="small">Hôm nay làm nửa ngày${d.name?' ('+esc(d.name)+')':''}.</div>`:d.name?`<div class="small">${esc(d.name)}</div>`:''}</div>`;
  return h;
}
function vpPayAlert(st){
  const p=st.payConfirm; let h='';
  if(p) h+=`<div class="alert warn" style="margin-top:12px">Bảng lương tháng ${esc(p.month.slice(5))}/${esc(p.month.slice(0,4))} đã có. Anh chị xem và <b>xác nhận trước hết ngày ${fmtDate(p.to)}</b>${p.feedbackStatus==='Đã trả lời'?' (kiến nghị đã được trả lời)':p.feedbackStatus==='Chờ xử lý'?' (kiến nghị đang chờ trả lời)':''}. <a href="#luong" data-act="pay-goto" data-id="${esc(p.month)}">Xem và xác nhận</a></div>`;
  if(st.payFeedback>0) h+=`<div class="alert warn" style="margin-top:12px">Có <b>${st.payFeedback}</b> kiến nghị lương chờ trả lời. <a href="#luong">Mở bảng lương</a></div>`;
  return h;
}
function vpReqMini(reqs){
  if(reqs===null) return '';
  const list=(Array.isArray(reqs)?reqs:[]).slice(0,5);
  return `<h3 style="margin:14px 0 6px">Đề xuất gần đây <a class="small" href="#de-xuat" style="font-weight:400">Xem tất cả</a></h3>${list.length? `<div class="alertList">${list.map(r=>`<div class="alr"><span class="alr-d">${vpStatus(r.status)}</span><span>${esc(r.type)}${r.fromAt?' · '+vpRange(r):''}</span></div>`).join('')}</div>` : '<p class="small muted">Chưa có đề xuất.</p>'}`;
}
document.addEventListener('change', e=>{ if(e.target.name!=='vp_mode') return; S.f.vpmode=e.target.value; const b=document.getElementById('vp_note_box'); if(b) b.style.display=e.target.value==='khac'?'':'none'; });
/* Bản 1.10.16: chọn việc được giao làm hôm nay (không bắt buộc) */
function vpTaskPick(){
  if(VP.tk===undefined||VP.tk===null){ if(VP.tk!==null){ VP.tk=null; api('GET','/api/vp/my-tasks').then(r=>{ VP.tk=r||[]; onData(); }).catch(()=>{ VP.tk=[]; onData(); }); } return '<div class="small muted" style="margin:6px 0">Đang tải việc được giao…</div>'; }
  if(!VP.tk.length) return `<p class="small muted" style="margin:6px 0">Bạn chưa có việc đang mở được giao trong mục <a href="#cong-viec">Công việc</a>.</p>`;
  return `<div class="vp-tasks" style="margin:8px 0"><div class="eyebrow" style="margin-bottom:4px">Việc làm hôm nay (chọn một hoặc nhiều)</div>${VP.tk.slice(0,15).map(t=>`<label style="display:flex;gap:8px;align-items:flex-start;padding:4px 0"><input type="checkbox" name="vp_task" value="${esc(t.id)}" ${(S.f.vptasks||[]).includes(t.id)?'checked':''}><span>${esc(t.name)}${t.projectName?` <span class="small muted">· ${esc(t.projectName)}</span>`:''}${t.overdue?' '+pill('Quá hạn','bad'):''}</span></label>`).join('')}${VP.tk.length>15?`<div class="small muted">Còn ${VP.tk.length-15} việc khác trong mục <a href="#cong-viec">Công việc</a>.</div>`:''}</div>`;
}
/* giữ nội dung đang gõ khi trang vẽ lại (dữ liệu tải xong, nhắc việc cập nhật) */
document.addEventListener('input', e=>{ const id=e.target.id; if(id==='vp_result') S.f.vpres=e.target.value; else if(id==='vp_note') S.f.vpnote=e.target.value; });
document.addEventListener('change', e=>{ if(e.target.name==='vp_task') S.f.vptasks=[...document.querySelectorAll('input[name="vp_task"]:checked')].map(x=>x.value); });
ACT['vp-result']=async(id,el)=>{ const v=(($('#vp_result')||{}).value||'').trim(); el.disabled=true;
  try{ const a=await api('POST','/api/vp/check/today',{result:v}); VP.st.attendance=a; S.f.vpres=null; toast(v?'Đã lưu kết quả hôm nay':'Đã xóa kết quả'); render(); }catch(e){ toast(errText(e),'err'); el.disabled=false; } };
ACT['vp-check']=async(kind,el)=>{
  const mode=(document.querySelector('input[name="vp_mode"]:checked')||{}).value||'office'; S.f.vpmode=mode;
  if(vpSimple()){
    const note=(($('#vp_note')||{}).value||'').trim();
    if(mode==='khac' && !note){ toast('Chọn "Khác" thì ghi nội dung công việc hôm nay.','err'); const n=$('#vp_note'); if(n) n.focus(); return; }
    el.disabled=true; const lb0=el.textContent; el.textContent='Đang ghi…';
    try{
      const taskIds=[...document.querySelectorAll('input[name="vp_task"]:checked')].map(x=>x.value);
      const a=await api('POST','/api/vp/check',{kind:'in', mode, note: note||null, taskIds});
      VP.st.attendance=a; delete VP.att['me|'+vpMonth()]; S.f.vpnote=''; S.f.vptasks=[];
      toast(`Đã ${vpW().toLowerCase()} lúc ${vpHM(a.inAt)}`+(a.lateMinutes>0?` · muộn ${a.lateMinutes} phút`:''));
      render();
    }catch(e){ toast(errText(e),'err'); el.disabled=false; el.textContent=lb0; }
    return;
  }
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
  'Nghỉ phép':['range','days','reason'], 'Nghỉ việc riêng có lương':['range','days','reason'], 'Nghỉ không lương':['range','days','reason'], 'Nghỉ ốm, thai sản (BHXH)':['range','days','reason'], 'Làm việc online':['range','days','reason'], 'Công tác':['range','days','place','reason'],
  'Tăng ca':['otkind','day','times','hours','reason'], 'Đi muộn, về sớm':['day','times','reason'], 'Quên điểm danh':['day','times','reason'],
  'Xăng xe':['day','place','km','reason'], 'Tạm ứng':['title','amount','reason'], 'Ứng lương':['amount','reason'], 'Thanh toán':['title','amount','reason'],
  'Giải chi':['title','amount','reason'], 'Kiểm tra thanh toán':['title','amount','reason'], 'Gia hạn công việc':['title','due','reason'],
  'Mở lại công việc':['title','reason'], 'Làm việc':['title','range','reason'], 'Khác':['title','range','reason']};
const VP_KM = 2000;
const VP_OT_KINDS = ['Tăng ca đảm bảo tiến độ dự án (bình thường)', 'Tăng ca theo yêu cầu (gấp)'];
function vpStatus(s){ return pill(s||'', s==='Đã duyệt'?'ok':s==='Từ chối'?'bad':s==='Đã hủy'?'':'warn'); }
function vpRange(r){ const f=r.fromAt?parseTs(r.fromAt):null, t=r.toAt?parseTs(r.toAt):null; if(!f) return '';
  const d=x=>pad(x.getDate())+'/'+pad(x.getMonth()+1), h=x=>pad(x.getHours())+':'+pad(x.getMinutes());
  if(!t) return d(f)+' '+h(f); if(isoLocal(f)===isoLocal(t)) return d(f)+' '+h(f)+'–'+h(t); return d(f)+' '+h(f)+' → '+d(t)+' '+h(t); }
const vpIso = (date, time) => date ? `${date}T${(time||'00:00').padStart(5,'0')}:00+07:00` : null;
const vpSplit = s => { if(!s) return ['','']; const d=parseTs(s); return [isoLocal(d), pad(d.getHours())+':'+pad(d.getMinutes())]; };
/* Số ngày làm việc giữa hai mốc (bỏ Chủ nhật; thứ Bảy theo thiết lập), làm tròn nửa ngày */
/* Bản 1.10.4: công của một ngày thứ Bảy theo thiết lập (cach-tuan: tuần làm cả ngày, tuần nghỉ, tính từ mốc thứ Bảy đi làm) */
function vpSatValue(st, day){ if(st.saturday==='ca-ngay') return 1; if(st.saturday==='sang') return .5;
  if(st.saturday==='cach-tuan'){ const a=Date.parse((st.saturdayAnchor||'2026-10-10')+'T00:00:00Z'), w=Math.floor((Date.parse(day+'T00:00:00Z')-a)/(7*864e5)); return ((w%2)+2)%2===0?1:0; } return 0; }
function vpWorkDays(f, t){ if(!f||!t) return null; const st=VP.st.settings, am=st.morningEnd||'12:30';
  /* f, t dạng 2026-12-01T08:00:00+07:00 (giờ Việt Nam): đọc thẳng ngày, giờ để không lệch theo múi giờ của máy */
  const fd=f.slice(0,10), ft=f.slice(11,16), td=t.slice(0,10), tt=t.slice(11,16); let n=0;
  for(let x=new Date(fd+'T00:00:00Z'); x.toISOString().slice(0,10)<=td; x.setUTCDate(x.getUTCDate()+1)){
    const day=x.toISOString().slice(0,10), dow=x.getUTCDay(); let v=dow===0?0:dow===6?vpSatValue(st, day):1;
    const wk=(st.workdays||[]).find(h=>h.startsWith(day)), hol=(st.holidays||[]).find(h=>h.startsWith(day));
    if(wk) v=/^.{10}:s/.test(wk)?.5:1; else if(hol) v=/^.{10}:[sc]/.test(hol)?Math.max(0,v-.5):0; if(!v) continue;
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
  if(fs.includes('otkind')){ F.push({key:'title',label:'Loại tăng ca',type:'select',req:true,full:true,def:VP_OT_KINDS[0],options:VP_OT_KINDS});
    F.unshift({key:'_i',type:'html',html:`<div class="fld full small muted">Phiếu xác nhận tăng ca lập <b>sau khi đã làm</b>, mỗi phiếu một ngày: bình thường tối đa ${fmtN(VP.st.otMax?.normal??3,1)} giờ, theo yêu cầu gấp tối đa ${fmtN(VP.st.otMax?.urgent??4,1)} giờ. Trưởng bộ phận hoặc Giám đốc duyệt; duyệt trong tháng nào tính vào lương tháng đó (ngày thường 150%, ngày nghỉ 200%, ngày lễ 300%).</div>`}); }
  if(fs.includes('day')) F.push({key:'fd',label: type==='Tăng ca'?'Ngày đã tăng ca':'Ngày',type:'date',req:true,def:TODAY});
  if(fs.includes('times')) F.push({key:'ft',label:'Từ giờ',ph:'17:30'},{key:'tt',label:'Đến giờ',ph:'20:00'});
  if(fs.includes('due')) F.push({key:'td',label:'Hạn mới',type:'date',req:true});
  if(fs.includes('days')) F.push({key:'days',label:'Số ngày (để trống: tự tính theo ngày làm việc)',type:'number'});
  if(fs.includes('hours')) F.push({key:'hours',label: type==='Tăng ca'?'Số giờ đã làm thêm':'Số giờ (để trống: tự tính)',type:'number',req:type==='Tăng ca'});
  if(fs.includes('km')) F.push({key:'hours',label:`Số km (${fmtN(VP_KM)} đ/km)`,type:'number',req:true});
  if(fs.includes('place')) F.push({key:'place',label: type==='Xăng xe'?'Lộ trình':'Nơi công tác',req:true,full:true});
  if(fs.includes('amount')) F.push({key:'amount',label:'Số tiền (đồng)',type:'money',req:true});
  F.push({key:'reason',label:'Lý do',type:'textarea',req:fs.includes('reason'),full:true});
  if(type==='Nghỉ phép') F.unshift({key:'_i',type:'html',html:`<div class="fld full small muted">Phép năm ${VP.st.leave.year} còn <b>${fmtN(VP.st.leave.left,1)}</b> ngày.</div>`});
  if(type==='Nghỉ việc riêng có lương') F.unshift({key:'_i',type:'html',html:`<div class="fld full small muted">Theo Điều 115 Bộ luật Lao động: bản thân kết hôn 3 ngày; con đẻ, con nuôi kết hôn 1 ngày; cha, mẹ (cả bên vợ/chồng), vợ hoặc chồng, con chết 3 ngày. Hưởng nguyên lương, không trừ phép năm.</div>`});
  if(type==='Nghỉ ốm, thai sản (BHXH)') F.unshift({key:'_i',type:'html',html:`<div class="fld full small muted">Những ngày này cơ quan BHXH trả trợ cấp theo hồ sơ, công ty không trả lương; không trừ phép năm, không tính vắng không lý do.</div>`});
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
    (typeof vptCount==='function'&&!VPT.cnt['vp-de-xuat']&&setTimeout(()=>vptCount('vp-de-xuat'),0), rows), {empty: t==='approve'?'Không có đề xuất nào chờ bạn duyệt.':'Chưa có đề xuất.', pk:'dx'+t, actions:r=>{
      let h=''; const nf=(typeof VPT!=='undefined'&&VPT.cnt['vp-de-xuat']||{})[r.id]; if(nf) h+=`<button class="btn sm ghost" data-act="vpt-req" data-id="${esc(r.id)}">${AICO.clip} ${nf} tệp</button>`;
      if(t==='approve' && r.status==='Chờ duyệt') h+=`<button class="btn sm primary" data-act="vp-req-decide" data-a="approve" data-id="${esc(r.id)}">Duyệt</button><button class="btn sm ghost danger" data-act="vp-req-decide" data-a="reject" data-id="${esc(r.id)}">Không duyệt</button>`;
      if(r.employeeId===myId && r.status==='Chờ duyệt') h+=`<button class="btn sm ghost" data-act="vp-req-edit" data-id="${esc(r.id)}">Sửa</button><button class="btn sm ghost danger" data-act="vp-req-decide" data-a="cancel" data-id="${esc(r.id)}">Hủy</button>`;
      return h; }})}`;
};

/* ---------------------------------------------------------------- Bảng công, chấm công */
VIEWS['diem-danh']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>Bảng công</h1></div></div>`+vpWait(); }
  const W=vpW(), w=W.toLowerCase(), simple=vpSimple();
  if(!vpCanAttAll()) return `<div class="head"><div class="grow"><h1>Bảng công</h1></div></div>`+emptyBox(`Bạn xem ${esc(w)} của mình ở mục <a href="#van-phong">${esc(W)}</a>.`);
  const tabs=[...(simple?[['hom-nay','Hôm nay ai ở đâu']]:[]),['bang',simple?'Tổng hợp tháng':'Bảng công tháng'],['ngay','Chi tiết '+w]]; if(VP.st.perms.attEdit) tabs.push(['thiet-lap','Thiết lập']);
  const t=tabs.some(x=>x[0]===S.tab.dd)? S.tab.dd : tabs[0][0]; const m=vpMonth();
  let body='';
  if(t==='hom-nay') body=vpTodayBoard();
  else if(t==='bang'){
    const ts=vpFetch(VP.ts, m, '/api/vp/timesheet?month='+m); const dep=S.f.ddp||'';
    const rows=ts&&ts.rows? ts.rows.filter(r=>!dep||r.departmentId===dep) : [];
    body= !ts? '<div class="empty">Đang tải…</div>' : ts.error? emptyBox(esc(ts.error)) : simple? `<p class="small muted">Công chuẩn tháng ${m.slice(5)}/${m.slice(0,4)}: <b>${fmtN(ts.standard,1)}</b> ngày. Nghỉ không phép: ngày làm việc đã qua không ${esc(w)} và không có phiếu nghỉ phép được duyệt (trừ lương, trừ chuyên cần). Đi muộn tính từ ${esc(VP.st.settings.checkIn)}.</p>`+table([
      {h:'Họ tên', f:r=>`<a href="#" data-act="vp-ts-emp" data-id="${esc(r.employeeId)}">${esc(r.name)}</a><div class="small muted">${esc(vpDeptName(r.departmentId))}</div>`},
      {h:'Ngày công', r:1, f:r=>`<b>${fmtN(r.worked,1)}</b>/${fmtN(r.standard,1)}`},
      {h:'Ở công ty', r:1, f:r=>r.office||'—'}, {h:'Online', r:1, f:r=>r.online||'—'}, {h:'Công tác', r:1, f:r=>r.tripDays||'—'}, {h:'Khác', r:1, f:r=>r.other||'—'},
      {h:'Đi muộn', r:1, f:r=>r.late? `${r.late} lần<div class="small muted">${r.lateMinutes} phút</div>`:'—'},
      {h:'Nghỉ phép', r:1, f:r=>r.leave? fmtN(r.leave,1):'—'}, {h:'Tăng ca (giờ)', r:1, f:r=>r.overtime? fmtN(r.overtime,1):'—'},
      {h:'Nghỉ không phép', r:1, f:r=>r.absent? `<b style="color:var(--red)">${fmtN(r.absent,1)}</b>`:'—'}], rows, {empty:'Chưa có nhân sự.', pk:'ddts'}) : `<p class="small muted">Công chuẩn tháng ${m.slice(5)}/${m.slice(0,4)}: <b>${fmtN(ts.standard,1)}</b> ngày (đã trừ Chủ nhật${VP.st.settings.saturday==='khong'?', thứ Bảy':VP.st.settings.saturday==='cach-tuan'?', thứ Bảy nghỉ (cách tuần)':''} và ngày nghỉ lễ). Nghỉ không lý do: ngày làm việc đã qua không có điểm danh và không có đề xuất nghỉ phép, công tác, làm việc online được duyệt.</p>`+table([
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
    body=`<div class="toolbar" style="margin:10px 0"><input type="month" data-f="vpm" value="${esc(m)}" aria-label="Tháng"><input type="date" data-f="ddd" value="${esc(d)}" aria-label="Ngày"><select data-f="dde" aria-label="Nhân sự">${opts(VP.emps.map(x=>[x.id,x.name]), e, 'Tất cả nhân sự')}</select><select data-f="ddl" aria-label="Nơi làm việc">${opts(vpPlaceOpts(), pl, 'Mọi nơi')}</select>${VP.st.perms.attEdit?`<button class="btn sm" data-act="vp-fix" data-id="">+ Bổ sung ${esc(w)}</button>`:''}</div>`
    + (list===null? '<div class="empty">Đang tải…</div>' : table([
      {h:'Ngày', f:x=>fmtDate(x.date)}, {h:'Họ tên', f:x=>vpWho(x.employeeId)},
      {h:'Giờ vào', f:x=>vpHM(x.inAt)+(x.lateMinutes>0?` <span class="small" style="color:var(--red)">muộn ${x.lateMinutes}′</span>`:'')},
      ...(simple?[]:[{h:'Giờ ra', f:x=>vpHM(x.outAt)+(x.earlyMinutes>0?` <span class="small" style="color:var(--amber)">sớm ${x.earlyMinutes}′</span>`:'')}]),
      {h:'Nơi', f:x=>vpPlacePill(x.inPlace)+(x.site?`<div class="small muted">${esc(x.site)}</div>`:'')+(x.inLat?`<div class="small"><a href="https://www.google.com/maps?q=${x.inLat},${x.inLng}" target="_blank" rel="noopener">Xem bản đồ</a></div>`:'')},
      {h:'IP', f:x=>`<span class="small">${esc(x.inIp||'')}</span>`}, {h:'Ghi chú', f:x=>esc(x.note||'')+(x.source==='e-work'?' <span class="small muted">(e-work)</span>':'')}],
      rows, {empty:'Không có '+esc(w)+' phù hợp.', pk:'ddng', actions: VP.st.perms.attEdit? x=>`<button class="btn sm ghost" data-act="vp-fix" data-id="${esc(x.id)}">Điều chỉnh</button>` : null}));
  } else body=vpSettingsHTML();
  return `<div class="head"><div class="grow"><h1>Bảng công, chấm công</h1><p>${VP.st.perms.att?'Toàn công ty':'Phòng do bạn phụ trách'}</p></div></div>
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="dd" data-id="${k}">${l}</button>`).join('')}</div>${body}`;
};
/* Bản 1.10.16: hôm nay ai ở đâu (Giám đốc, Trưởng phòng) */
function vpTodayBoard(){
  const d=S.f.tdd||TODAY, W=vpW(), w=W.toLowerCase(); VP.td=VP.td||{};
  const b=vpFetch(VP.td, d, '/api/vp/today?date='+d);
  const bar=`<div class="toolbar" style="margin:10px 0"><input type="date" data-f="tdd" value="${esc(d)}" aria-label="Ngày"><button class="btn sm ghost" data-act="vp-td-reload">Làm mới</button></div>`;
  if(!b) return bar+'<div class="empty">Đang tải…</div>'; if(b.error) return bar+emptyBox(esc(b.error));
  const rows=b.rows||[], has=rows.filter(r=>r.inAt), no=rows.filter(r=>!r.inAt);
  const cnt=p=>has.filter(r=>r.place===p).length, lv=no.filter(r=>r.requests.length), miss=no.filter(r=>!r.requests.length);
  const k=(l,v,c)=>`<div class="kpi ${c||''}"><div class="eyebrow">${l}</div><div class="v">${v}</div></div>`;
  const reqTxt=r=>r.requests.map(q=>`${esc(q.type)}${q.status==='Chờ duyệt'?' (chờ duyệt)':''}`).join(', ');
  return bar+(!b.workday?`<div class="alert info">${fmtDate(d)} là ngày nghỉ${b.dayName?' ('+esc(b.dayName)+')':''}.</div>`:'')
    +`<div class="grid g4 kpis">${k('Ở công ty',cnt('Trong công ty'))}${k('Online',cnt('Làm việc online'))}${k('Công tác',cnt('Công tác'))}${k('Khác',cnt('Khác'))}${k('Có phiếu nghỉ, vắng',lv.length)}${k('Chưa '+w,miss.length,miss.length&&b.workday?'bad':'')}${k('Đi muộn',has.filter(r=>r.late>0).length,has.some(r=>r.late>0)?'warn':'')}${k('Tổng số người',rows.length)}</div>`
    +table([
      {h:'Họ tên', f:r=>`<b style="font-weight:600">${esc(r.name)}</b><div class="small muted">${esc(vpDeptName(r.departmentId))}</div>`},
      {h:'Nơi làm việc', f:r=>r.inAt? vpPlacePill(r.place)+`<div class="small muted">${vpHM(r.inAt)}${r.late>0?` · <span style="color:var(--red)">muộn ${r.late}′</span>`:''}</div>` : r.requests.length? pill(reqTxt(r),'info') : pill('Chưa '+w, b.workday?'bad':'')},
      {h:'Việc hôm nay', f:r=>(r.tasks.length?`<ul style="margin:0 0 0 16px;padding:0">${r.tasks.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:'')+(r.note?`<div class="small">${esc(r.note)}</div>`:'')||'<span class="muted">—</span>'},
      {h:'Kết quả', f:r=>r.result?esc(r.result):'<span class="muted">—</span>'}],
      [...has, ...lv, ...miss], {empty:'Chưa có nhân sự.', pk:'tdb'});
}
ACT['vp-td-reload']=()=>{ VP.td={}; render(); };
ACT['vp-ts-emp']=id=>{ S.tab.dd='ngay'; S.f.dde=id; render(); };
ACT['vp-ts-xlsx']=()=>{ const m=vpMonth(), ts=VP.ts[m]; if(!ts||!ts.rows) return;
  if(vpSimple()){ const dep=S.f.ddp||''; const rs=ts.rows.filter(r=>!dep||r.departmentId===dep);
    const hd=['STT','Họ tên','Phòng ban','Ngày công','Công chuẩn','Ở công ty','Làm việc online','Đi công tác','Khác','Đi muộn (lần)','Đi muộn (phút)','Nghỉ phép','Tăng ca (giờ)','Nghỉ không phép'];
    const data=rs.map((r,i)=>[i+1, r.name, vpDeptName(r.departmentId), r.worked, r.standard, r.office||0, r.online||0, r.tripDays||0, r.other||0, r.late||0, r.lateMinutes||0, r.leave||0, r.overtime||0, r.absent||0]);
    const ws=XLSX.utils.aoa_to_sheet([['TỔNG HỢP '+vpW().toUpperCase()+' THÁNG '+m.slice(5)+'/'+m.slice(0,4)],['Công chuẩn: '+ts.standard+' ngày. Đi muộn tính từ '+VP.st.settings.checkIn+'.'],[],hd,...data]);
    ws['!cols']=[{wch:5},{wch:26},{wch:22},...hd.slice(3).map(()=>({wch:11}))];
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Tong hop'); XLSX.writeFile(wb, `Tong_hop_${m}.xlsx`); return; }
  const head=['Họ tên','Phòng ban','Ngày công','Công chuẩn','Đi muộn (lần)','Đi muộn (phút)','Về sớm','Quên điểm danh ra','Ngoài công ty','Online','Nghỉ phép','Công tác','Tăng ca (giờ)','Nghỉ không lý do'];
  const rows=ts.rows.map(r=>[r.name, vpDeptName(r.departmentId), r.worked, r.standard, r.late, r.lateMinutes, r.early, r.noOut, r.outside, r.online, r.leave, r.trip, r.overtime, r.absent]);
  const ws=XLSX.utils.aoa_to_sheet([['BẢNG CÔNG THÁNG '+m.slice(5)+'/'+m.slice(0,4)],[],head,...rows]); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Bang cong');
  XLSX.writeFile(wb, `Bang_cong_${m}.xlsx`); };
ACT['vp-fix']=id=>{
  const all=VP.att['all|'+vpMonth()]; const x=(Array.isArray(all)?all:[]).find(a=>a.id===id) || {};
  const w=vpW().toLowerCase(), simple=vpSimple();
  openForm({title: (id?'Điều chỉnh ':'Bổ sung ')+w, narrow:true, value:{employeeId:x.employeeId, date:x.date||TODAY, in:x.inAt?vpHM(x.inAt):'', out:x.outAt?vpHM(x.outAt):'', inPlace:x.inPlace||'Trong công ty'},
    fields:[{key:'employeeId',label:'Nhân sự',type:'select',req:true,options:()=>VP.emps.map(e=>[e.id,e.name])},{key:'date',label:'Ngày',type:'date',req:true},
      {key:'in',label:simple?'Giờ '+w+' (để trống giữ giờ cũ)':'Giờ vào (để trống giữ giờ cũ)',ph:'08:00'},...(simple?[]:[{key:'out',label:'Giờ ra (để trống giữ giờ cũ, "-" để xóa)',ph:'17:30'}]),{key:'inPlace',label:'Nơi',type:'select',req:true,options:vpPlaceOpts()},
      {key:'note',label:'Lý do điều chỉnh',type:'textarea',req:true}],
    onSave:async v=>{ const r=await api('POST','/api/vp/attendance/fix',v); VP.att={}; VP.ts={}; return r; }});
};
function vpSettingsHTML(){
  if(!VP.set){ api('GET','/api/vp/settings').then(s=>{ VP.set=s; onData(); }).catch(e=>toast(errText(e),'err')); return '<div class="empty">Đang tải…</div>'; }
  const s=VP.set;
  return `<div class="grid g2" style="margin-top:12px"><div class="card"><h2 style="margin-top:0">Giờ làm việc</h2>
    <div class="fgrid">${[['checkIn','Giờ vào (đi muộn tính từ giờ này)'],['checkOut','Giờ ra (về sớm tính trước giờ này)'],['morningStart','Ca sáng từ'],['morningEnd','Ca sáng đến'],['afternoonStart','Ca chiều từ'],['afternoonEnd','Ca chiều đến']].map(([k,l])=>`<div class="fld"><label for="vs_${k}">${l}</label><input id="vs_${k}" value="${esc(s[k]||'')}" placeholder="08:00"></div>`).join('')}
    <div class="fld"><label for="vs_saturday">Thứ Bảy</label><select id="vs_saturday">${opts([['khong','Nghỉ'],['sang','Làm buổi sáng'],['ca-ngay','Làm cả ngày'],['cach-tuan','Làm cả ngày, cách tuần (tuần làm, tuần nghỉ)']], s.saturday)}</select></div>
    <div class="fld"><label for="vs_saturdayAnchor">Một thứ Bảy có đi làm (mốc cách tuần)</label><input id="vs_saturdayAnchor" type="date" value="${esc(s.saturdayAnchor||'')}"></div>
    <div class="fld"><label for="vs_leavePerYear">Ngày phép năm</label><input id="vs_leavePerYear" type="number" value="${esc(s.leavePerYear)}"></div>
    <div class="fld full"><label><input type="checkbox" id="vs_inOnly" ${s.inOnly?'checked':''}> Nhận nhiệm vụ: mỗi ngày bấm một lần, tự chọn Ở công ty / Online / Công tác / Khác, không định vị, không bấm ra</label></div>
    <div class="fld"><label for="vs_word">Tên nút, tên mục</label><input id="vs_word" value="${esc(s.word||'Điểm danh')}" placeholder="Điểm danh"></div>
    <div class="fld full"><label><input type="checkbox" id="vs_leaveBonus" ${s.leaveSeniorityBonus!==false?'checked':''}> Cộng 1 ngày phép cho mỗi 5 năm thâm niên (Điều 114 BLLĐ)</label></div>
    <div class="fld full"><label><input type="checkbox" id="vs_allowOutside" ${s.allowOutside?'checked':''}> Cho điểm danh khi ở ngoài công ty (ghi rõ "Ngoài công ty" để trưởng phòng xem)</label></div></div>
    <p class="small muted">Giờ vào riêng từng phòng thiết lập ở Nhân sự → Phòng ban.</p></div>
  <div class="card"><h2 style="margin-top:0">Nơi điểm danh</h2><p class="small muted" style="margin-top:0">Văn phòng, công trình đang triển khai… mỗi dòng: tên; vĩ độ; kinh độ; bán kính (m). Lấy tọa độ: mở Google Maps, nhấn giữ vào vị trí, chép hai số hiện ra.</p>
    <textarea id="vs_places" rows="5" style="width:100%">${esc((s.places||[]).map(p=>[p.name,p.lat,p.lng,p.radius].join('; ')).join('\n'))}</textarea>
    <h3>Địa chỉ IP mạng công ty</h3><p class="small muted" style="margin-top:0">Mỗi dòng một IP. Điểm danh từ mạng này tính là trong công ty. IP của bạn lúc này: <b>${esc(VP.st.ip||'')}</b></p>
    <textarea id="vs_ips" rows="4" style="width:100%">${esc((s.ips||[]).join('\n'))}</textarea></div>
  <div class="card"><h2 style="margin-top:0">Lịch nghỉ, lịch làm việc</h2>
    ${vpDaysHTML(s)}
    <h3 style="margin:12px 0 4px">Lời chúc trên màn hình điểm danh</h3>
    <div class="fgrid"><div class="fld full"><label for="vs_greetWork">Ngày làm việc</label><input id="vs_greetWork" value="${esc(s.greetWork||'')}"></div>
    <div class="fld full"><label for="vs_greetOff">Ngày nghỉ (ngày lễ tự thêm tên lễ ở đầu)</label><input id="vs_greetOff" value="${esc(s.greetOff||'')}"></div></div></div>
  <div class="card"><h2 style="margin-top:0">Chuyển tiếp với e-work</h2>
    ${VP.st.perms.admin?`<p class="small">1. Chuyển dữ liệu: chạy <b>xuat-ework.ps1</b> trên máy chủ e-work, rồi chọn tệp <b>ework_xuat.json</b> tại đây (chạy lại được, không sinh trùng).</p>
    <div class="toolbar"><input type="file" id="vs_ew" accept=".json"><button class="btn sm" data-act="vp-ew-import">Chuyển dữ liệu từ e-work</button><a class="btn sm" href="#ework-cu">Tra cứu dữ liệu e-work cũ</a></div>
    <p class="small" style="margin-top:12px">2. Chép chấm công sang e-work để tính lương trong thời gian chuyển tiếp: ${s.syncKeyHash?pill('Đang bật','ok')+` từ ngày ${fmtDate(s.syncFrom)}`:pill('Chưa bật')}</p>
    <div class="toolbar"><button class="btn sm" data-act="vp-sync-key">${s.syncKeyHash?'Tạo lại khóa':'Tạo khóa chép chấm công'}</button></div>`:'<p class="small muted">Dành cho quản trị hệ thống.</p>'}</div></div>
  <div class="toolbar" style="margin-top:12px"><button class="btn primary" data-act="vp-set-save">Lưu thiết lập</button></div>`;
}
/* Bản 1.10.7: lịch nghỉ. Ngày lễ theo luật tự áp dụng; ngày phát sinh chọn ngày, chọn loại, chọn nội dung. Lưu về Holidays/Workdays như cũ. */
const VP_WEEKEND=/^$|thứ\s*(7|bảy)|cuối\s*tuần|phiên|chủ\s*nhật/i;
const VP_DAY_KINDS=[['off','Nghỉ cả ngày'],['off-s','Nghỉ buổi sáng'],['off-c','Nghỉ buổi chiều'],['work','Đi làm cả ngày'],['work-s','Đi làm buổi sáng']];
const VP_DAY_TEXT={off:['Nghỉ theo lịch công ty','Nghỉ thư giãn','Nghỉ bù ngày lễ','Nghỉ hoán đổi theo thông báo của Chính phủ','Du lịch, nghỉ mát công ty','Nghỉ Tết (thêm ngoài quy định)','Nghỉ thứ Bảy luân phiên'],
  half:['Tất niên','Liên hoan, sinh hoạt công ty','Họp tổng kết','Nghỉ theo lịch công ty'],
  work:['Đi làm bù','Đi làm hoán đổi theo thông báo của Chính phủ','Thứ Bảy đi làm','Trực, làm việc theo kế hoạch công ty']};
const vpDayText=k=>VP_DAY_TEXT[k.startsWith('work')?'work':k==='off'?'off':'half'];
function vpDaysFrom(s){ const p=(x,w)=>{ const m=String(x).match(/^(\d{4}-\d{2}-\d{2})(?::([sc]))?\s*(.*)$/); if(!m) return null;
    return {date:m[1], kind:w?(m[2]==='s'?'work-s':'work'):(m[2]==='s'?'off-s':m[2]==='c'?'off-c':'off'), name:m[3]||''}; };
  return [...(s.holidays||[]).map(x=>p(x,false)),...(s.workdays||[]).map(x=>p(x,true))].filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date)); }
function vpDaysTo(days){ const f=d=>d.date+({'off-s':':s','off-c':':c','work-s':':s'}[d.kind]||'')+(d.name?' '+d.name:'');
  return {holidays:days.filter(d=>d.kind.startsWith('off')).map(f), workdays:days.filter(d=>d.kind.startsWith('work')).map(f)}; }
function vpDaysHTML(s){
  if(VP.daysOf!==s){ VP.daysOf=s; VP.days=vpDaysFrom(s); VP.dayYear=VP.dayYear||String(new Date().getFullYear()); }
  const y=VP.dayYear, years=[...new Set([new Date().getFullYear()-1,new Date().getFullYear(),new Date().getFullYear()+1,...VP.days.map(d=>+d.date.slice(0,4))])].sort();
  VP.legal=VP.legal||{}; if(!VP.legal[y]){ VP.legal[y]='…'; api('GET','/api/vp/holidays/legal?year='+y).then(l=>{ VP.legal[y]=l; onData(); }).catch(()=>{ VP.legal[y]=[]; }); }
  const legal=Array.isArray(VP.legal[y])?VP.legal[y]:[], mine=VP.days.filter(d=>d.date.startsWith(y)), has=new Set(mine.map(d=>d.date));
  const dow=d=>['CN','T2','T3','T4','T5','T6','T7'][new Date(d+'T00:00:00Z').getUTCDay()];
  const kindName=k=>(VP_DAY_KINDS.find(x=>x[0]===k)||[,k])[1];
  const sat=mine.filter(d=>d.kind==='off'&&(dow(d.date)==='CN'||(dow(d.date)==='T7'&&VP_WEEKEND.test(d.name.trim()))));
  const rows=[...(s.autoLegal!==false?legal.filter(l=>!has.has(l.date)).map(l=>({date:l.date,kind:'off',name:l.name,legal:true})):[]),...mine.filter(d=>!sat.includes(d))].sort((a,b)=>a.date.localeCompare(b.date));
  const kinds=opts(VP_DAY_KINDS,'off'), texts=opts([...vpDayText('off'),['__khac','Khác (ghi rõ)']]);
  return `<h3 style="margin:0 0 4px">Ngày nghỉ lễ, tết theo luật</h3>
    <label class="small"><input type="checkbox" id="vs_autoLegal" ${s.autoLegal!==false?'checked':''}> Tự áp dụng các ngày nghỉ lễ, tết theo Bộ luật Lao động 2019 (Điều 112) và Ngày Văn hóa Việt Nam 24/11, kèm ngày nghỉ bù khi lễ trùng ngày nghỉ hằng tuần. Không cần nhập, sang năm mới tự có.</label>
    <h3 style="margin:12px 0 4px">Ngày nghỉ, ngày đi làm phát sinh</h3>
    <p class="small muted" style="margin-top:0">Chọn ngày, chọn loại, chọn nội dung rồi bấm Thêm. Năm Chính phủ hoán đổi ngày nghỉ: thêm ngày nghỉ thay và ngày "Đi làm cả ngày" tương ứng.</p>
    <div class="fgrid"><div class="fld"><label for="vd_date">Ngày</label><input id="vd_date" type="date" value="${esc(TODAY)}"></div>
      <div class="fld"><label for="vd_kind">Loại</label><select id="vd_kind">${kinds}</select></div>
      <div class="fld"><label for="vd_text">Nội dung</label><select id="vd_text">${texts}</select></div>
      <div class="fld" id="vd_otherBox" hidden><label for="vd_other">Ghi rõ nội dung</label><input id="vd_other" maxlength="120"></div></div>
    <div class="toolbar"><button class="btn sm primary" data-act="vp-day-add">Thêm và lưu</button></div>
    <div class="toolbar" style="margin-top:10px"><label for="vs_dayYear" class="small">Năm</label><select id="vs_dayYear" data-act-change="vp-day-year">${years.map(v=>`<option ${String(v)===y?'selected':''}>${v}</option>`).join('')}</select>
      <span class="small muted">${VP.legal[y]==='…'?'Đang tải ngày lễ…':''}</span></div>
    ${rows.length?`<table class="tbl"><thead><tr><th>Ngày</th><th>Loại</th><th>Nội dung</th><th></th></tr></thead><tbody>${rows.map(d=>`<tr><td>${dow(d.date)}, ${fmtDate(d.date)}</td><td>${esc(kindName(d.kind))}</td><td>${esc(d.name)} ${d.legal?pill('Theo luật','ok'):''}</td>
      <td>${d.legal?'':`<button class="btn sm" data-act="vp-day-del" data-id="${esc(d.date+'|'+d.kind)}" aria-label="Xóa">Xóa</button>`}</td></tr>`).join('')}</tbody></table>`:'<p class="small muted">Chưa có ngày nào trong năm này.</p>'}
    ${sat.length?`<p class="small muted">Có thêm ${sat.length} ngày Chủ nhật, thứ Bảy nghỉ luân phiên chép từ e-work. Phần mềm đã tự tính các ngày này theo mục Thứ Bảy, không cần giữ. <button class="btn sm" data-act="vp-day-sat-clear" data-id="${esc(y)}">Bỏ các ngày này</button></p>`:''}`;
}
document.addEventListener('change', e=>{ const t=e.target;
  if(t.id==='vd_kind'){ $('#vd_text').innerHTML=opts([...vpDayText(t.value),['__khac','Khác (ghi rõ)']]); $('#vd_otherBox').hidden=true; }
  else if(t.id==='vd_text'){ $('#vd_otherBox').hidden=t.value!=='__khac'; if(t.value==='__khac') $('#vd_other').focus(); }
  else if(t.id==='vs_dayYear'){ VP.dayYear=t.value; onData(); } });
ACT['vp-day-add']=async()=>{
  const date=$('#vd_date').value, kind=$('#vd_kind').value, name=($('#vd_text').value==='__khac'?$('#vd_other').value:$('#vd_text').value).trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){ toast('Chọn ngày.','err'); return; } if(!name){ toast('Ghi rõ nội dung.','err'); return; }
  const isWork=kind.startsWith('work'); VP.days=VP.days.filter(d=>!(d.date===date && d.kind.startsWith('work')===isWork)); VP.days.push({date,kind,name});
  VP.days.sort((a,b)=>a.date.localeCompare(b.date)); VP.dayYear=date.slice(0,4); await ACT['vp-set-save']();
};
ACT['vp-day-del']=async id=>{ const [date,kind]=id.split('|'); VP.days=VP.days.filter(d=>!(d.date===date&&d.kind===kind)); await ACT['vp-set-save'](); };
ACT['vp-day-sat-clear']=async y=>{ VP.days=VP.days.filter(d=>!(d.date.startsWith(y)&&d.kind==='off'&&(new Date(d.date+'T00:00:00Z').getUTCDay()===0||(new Date(d.date+'T00:00:00Z').getUTCDay()===6&&VP_WEEKEND.test(d.name.trim()))))); await ACT['vp-set-save'](); };
ACT['vp-set-save']=async()=>{
  const s={...VP.set}; ['checkIn','checkOut','morningStart','morningEnd','afternoonStart','afternoonEnd','saturday','saturdayAnchor'].forEach(k=>s[k]=$('#vs_'+k).value.trim());
  for(const k of ['checkIn','checkOut','morningStart','morningEnd','afternoonStart','afternoonEnd']) if(!/^\d{2}:\d{2}$/.test(s[k])){ toast('Giờ ghi dạng 08:00 (hai chữ số).','err'); return; }
  s.leavePerYear=N($('#vs_leavePerYear').value); s.allowOutside=$('#vs_allowOutside').checked;
  s.inOnly=$('#vs_inOnly').checked; s.word=$('#vs_word').value.trim()||'Điểm danh'; s.leaveSeniorityBonus=$('#vs_leaveBonus').checked;
  const bad=[]; s.places=$('#vs_places').value.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{ const p=l.split(';').map(x=>x.trim()); const o={name:p[0], lat:parseFloat(p[1]), lng:parseFloat(p[2]), radius:parseInt(p[3])||500}; if(!o.name||isNaN(o.lat)||isNaN(o.lng)) bad.push(l); return o; });
  if(bad.length){ toast('Dòng nơi điểm danh chưa đúng: '+bad[0],'err'); return; }
  s.ips=$('#vs_ips').value.split(/[\n,;]/).map(x=>x.trim()).filter(Boolean);
  Object.assign(s, vpDaysTo(VP.days||vpDaysFrom(s))); s.autoLegal=$('#vs_autoLegal')?$('#vs_autoLegal').checked:true; s.greetWork=$('#vs_greetWork').value.trim(); s.greetOff=$('#vs_greetOff').value.trim();
  delete s.syncKeyHash;
  await api('PUT','/api/vp/settings', s); VP.set=null; VP.ts={}; VP.legal={}; vpLoad(true); toast('Đã lưu thiết lập');
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
      {h:'Tài khoản', f:e=>acc(e.userId)}, {h:'Chấm công', f:e=>e.attendance?'Có':pill('Không chấm công','info')}, {h:'Trạng thái', f:e=>pill(e.status, e.status==='Đang làm việc'?'ok':'')},
      {h:'Bằng cấp, giấy tờ', f:e=>{ const x=(HS.sum||{})[e.id]; return !HS.sum? '…' : !x||!x.muc? '<span class="muted small">Chưa có</span>' : `${x.bangCap?x.bangCap+' bằng cấp':''}${x.bangCap&&x.muc>x.bangCap?' · ':''}${x.muc>x.bangCap?(x.muc-x.bangCap)+' mục khác':''}<div class="small ${x.tep?'muted':'warn'}">${x.tep?x.tep+' tệp đính kèm':'chưa có tệp'}</div>`; }}],
      rows, {empty:'Chưa có hồ sơ nhân sự.', pk:'ns', rowAct: ed||VP.st.perms.hr? 'vp-prof' : null, actions: ed||VP.st.perms.hr? e=>`<button class="btn sm" data-act="vp-prof" data-id="${esc(e.id)}">Xem hồ sơ</button>` : null});
    if(!HS.sum) setTimeout(()=>hsSumLoad(),0);
  } else {
    body=`<div class="toolbar" style="margin:10px 0">${ed?`<button class="btn primary" data-act="vp-dept" data-id="">+ Thêm phòng ban</button>`:''}</div>`+table([
      {h:'Mã', k:'code'}, {h:'Phòng ban', f:d=>`<b style="font-weight:600">${esc(d.name)}</b>`},
      {h:'Trưởng phòng (duyệt đề xuất)', f:d=>{ const u=D('users').find(x=>x.id===d.managerUserId); return u? esc(u.name) : '<span class="muted">Chưa chọn</span>'; }},
      {h:'Giờ vào', f:d=>esc(d.checkinTime||VP.st.settings.checkIn)}, {h:'Số người', r:1, f:d=>VP.emps.filter(e=>e.departmentId===d.id && e.status!=='Nghỉ việc').length}],
      VP.depts, {empty:'Chưa có phòng ban.', pk:'pb', actions: ed? d=>`<button class="btn sm ghost" data-act="vp-dept" data-id="${esc(d.id)}">Sửa</button><button class="btn sm ghost danger" data-act="vp-dept-del" data-id="${esc(d.id)}">Xóa</button>` : null});
  }
  return `<div class="head"><div class="grow"><h1>Nhân sự</h1><p>${VP.emps.filter(e=>e.status!=='Nghỉ việc').length} người đang làm việc, ${VP.depts.length} phòng ban. Bấm <b>Xem hồ sơ</b> để xem, thêm bằng cấp, hợp đồng, giấy tờ và tệp đính kèm.</p></div>${VP.st.me?`<div><button class="btn" data-act="hs-me">Hồ sơ của tôi</button></div>`:''}</div>
  <div class="tabs">${[['ns','Hồ sơ nhân sự'],['pb','Phòng ban']].map(([k,l])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="ns" data-id="${k}">${l}</button>`).join('')}</div>${body}`;
};
ACT['vp-emp']=id=>{
  const e=vpEmp(id)||{status:'Đang làm việc', attendance:true}; const ed=VP.st.perms.hrEdit;
  const used=new Set(VP.emps.filter(x=>x.id!==id && x.userId).map(x=>x.userId));
  const F=[{key:'name',label:'Họ tên',req:true},{key:'code',label:'Mã nhân viên'},{key:'departmentId',label:'Phòng ban',type:'select',options:()=>VP.depts.map(d=>[d.id,d.name])},
    {key:'position',label:'Chức vụ, vị trí',suggest:()=>VP.emps.map(x=>x.position)},{key:'userId',label:'Tài khoản đăng nhập',type:'select',options:()=>D('users').filter(u=>!used.has(u.id)).map(u=>[u.id,u.name+' ('+u.username+')'])},
    {key:'status',label:'Trạng thái',type:'select',req:true,options:['Đang làm việc','Thử việc','Tạm nghỉ','Nghỉ việc']},{key:'attendance',label:'Chấm công',type:'select',req:true,options:[['true','Có điểm danh, lương theo ngày công'],['false','Không chấm công: hưởng nguyên lương chính, không cần xác nhận lương']]},
    {key:'phone',label:'Điện thoại'},{key:'email',label:'Thư điện tử'},{key:'birthday',label:'Ngày sinh',type:'date'},{key:'gender',label:'Giới tính',type:'select',options:['Nam','Nữ']},
    {key:'startDate',label:'Ngày vào làm',type:'date'},{key:'endDate',label:'Ngày nghỉ việc',type:'date'},
    {key:'education',label:'Trình độ',suggest:['Trung cấp','Cao đẳng','Đại học','Thạc sĩ','Tiến sĩ']},{key:'major',label:'Chuyên ngành đào tạo'},
    {key:'ethnicity',label:'Dân tộc',suggest:['Kinh']},{key:'nationality',label:'Quốc tịch',suggest:['Việt Nam']},{key:'marital',label:'Tình trạng hôn nhân',type:'select',options:['Độc thân','Đã kết hôn','Khác']},
    {key:'hometown',label:'Quê quán'},{key:'address',label:'Địa chỉ thường trú',full:true},{key:'currentAddress',label:'Chỗ ở hiện nay',full:true},
    {key:'_h0',type:'html',html:'<div class="fld full"><h3 style="margin:8px 0 0">Liên hệ khi khẩn cấp</h3></div>'},
    {key:'emergencyName',label:'Họ tên người thân'},{key:'emergencyRelation',label:'Quan hệ',suggest:['Vợ','Chồng','Bố','Mẹ','Anh','Chị','Em','Con']},{key:'emergencyPhone',label:'Điện thoại'},
    {key:'_h',type:'html',html:'<div class="fld full"><h3 style="margin:8px 0 0">Thông tin riêng</h3><span class="small muted">Chỉ người quản lý nhân sự và chính người đó xem được.</span></div>'},
    {key:'idNumber',label:'Số CCCD'},{key:'idDate',label:'Ngày cấp',type:'date'},{key:'idPlace',label:'Nơi cấp'},{key:'taxCode',label:'Mã số thuế cá nhân'},{key:'insuranceNo',label:'Số sổ BHXH'},
    {key:'dependents',label:'Số người phụ thuộc',type:'number'},{key:'bankAccount',label:'Số tài khoản ngân hàng'},{key:'bankName',label:'Ngân hàng'},
    {key:'contractType',label:'Loại hợp đồng lao động',suggest:['Thử việc','Xác định thời hạn 12 tháng','Xác định thời hạn 36 tháng','Không xác định thời hạn','Cộng tác viên']},{key:'contractNo',label:'Số hợp đồng'},
    {key:'contractStart',label:'Hợp đồng từ ngày',type:'date'},{key:'contractEnd',label:'Hợp đồng đến ngày',type:'date'},{key:'note',label:'Ghi chú',type:'textarea'}];
  if(!ed){ openModal(`<div class="mform wide"><header><h3>${esc(e.name)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div class="fgrid" style="padding:16px">${F.filter(f=>f.type!=='html'&&e[f.key]!=null&&e[f.key]!=='').map(f=>`<div class="fld"><label>${esc(f.label)}</label><div>${esc(f.key==='departmentId'?vpDeptName(e[f.key]):f.key==='userId'?((D('users').find(u=>u.id===e.userId)||{}).username||''):f.type==='date'?fmtDate(e[f.key]):String(e[f.key]))}</div></div>`).join('')}</div></div>`); return; }
  openForm({title: id?'Hồ sơ nhân sự':'Thêm nhân sự', wide:true, fields:F, value:{...e, attendance:String(e.attendance!==false)},
    onSave:async v=>{ const o={...e, ...v, attendance: v.attendance==='true', dependents: N(v.dependents)}; delete o._h; delete o._h0; ['birthday','idDate','startDate','endDate','contractStart','contractEnd'].forEach(k=>{ if(!o[k]) o[k]=null; }); if(!o.userId) o.userId=null; if(!o.departmentId) o.departmentId=null;
      const r=await api('PUT','/api/vp/employees/'+encodeURIComponent(id||uid('ns')), o); await vpLoad(true); return r; }});
};
/* Bản 1.10.4: hồ sơ nhân sự đầy đủ: lý lịch, bằng cấp, khen thưởng, kỷ luật, quá trình công tác, hợp đồng, giấy tờ (mỗi mục đính được tệp) */
const VP_REC = [['bang-cap','Bằng cấp, chứng chỉ','Tên văn bằng, chứng chỉ','Nơi cấp','Số hiệu','Ngày cấp'],['hop-dong','Hợp đồng lao động','Loại hợp đồng','Bên ký','Số hợp đồng','Từ ngày'],
  ['cong-tac','Quá trình công tác','Nội dung (bổ nhiệm, điều chuyển, tăng lương…)','Phòng ban, đơn vị','Số quyết định','Từ ngày'],['khen-thuong','Khen thưởng','Nội dung khen thưởng','Hình thức','Số quyết định','Ngày'],
  ['ky-luat','Kỷ luật','Nội dung vi phạm','Hình thức kỷ luật','Số quyết định','Ngày'],['giay-to','Giấy tờ khác (CCCD, sơ yếu lý lịch, giấy khám sức khỏe…)','Tên giấy tờ','Nơi cấp','Số','Ngày cấp']];
const vpUser = id => D('users').find(u=>u.id===id);
/* Bản 1.10.12: hồ sơ (vp-prof) là trang riêng, xem views-hs.js */
ACT['vp-dept']=id=>{ const d=vpDept(id)||{order:VP.depts.length+1};
  openForm({title: id?'Sửa phòng ban':'Thêm phòng ban', narrow:true, value:d, fields:[{key:'name',label:'Tên phòng ban',req:true},{key:'code',label:'Mã'},
    {key:'managerUserId',label:'Trưởng phòng (duyệt đề xuất, xem bảng công của phòng)',type:'select',options:()=>D('users').filter(u=>u.active!==false).map(u=>[u.id,u.name+' ('+u.username+')'])},
    {key:'checkinTime',label:'Giờ vào riêng của phòng (để trống: theo giờ chung)',ph:'07:45'},{key:'order',label:'Thứ tự',type:'number'}],
    onSave:async v=>{ if(v.checkinTime && !/^\d{2}:\d{2}$/.test(v.checkinTime)) throw new Error('Giờ ghi dạng 07:45.'); const r=await api('PUT','/api/vp/departments/'+encodeURIComponent(id||uid('pb')), {...d, ...v, managerUserId:v.managerUserId||null, order:N(v.order)}); await vpLoad(true); return r; }}); };
ACT['vp-dept-del']=async id=>{ const d=vpDept(id); if(!d||!await confirmBox(`Xóa phòng ban <b>${esc(d.name)}</b>?`)) return; await api('DELETE','/api/vp/departments/'+encodeURIComponent(id)); await vpLoad(true); toast('Đã xóa'); };
