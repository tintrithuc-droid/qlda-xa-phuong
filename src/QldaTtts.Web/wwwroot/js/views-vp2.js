/* ===== Bản 1.10: lịch công tác, lịch họp và thông báo nội bộ (dữ liệu qua /api/vp) ===== */
VP.mt={}; VP.nt=null; VP.ib=null; VP.ibAt=0;
EXTRA_ROUTES.push('lich-hop','thong-bao');
const VP_DOW=['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
const isoD = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const dOf = s => { const [y,m,d]=String(s).slice(0,10).split('-').map(Number); return new Date(y,m-1,d); };
const addD = (s,n) => { const d=dOf(s); d.setDate(d.getDate()+n); return isoD(d); };
const monday = s => { const d=dOf(s); const k=(d.getDay()+6)%7; d.setDate(d.getDate()-k); return isoD(d); };
/* Giờ trên máy chủ lưu theo UTC; hiện, nhập theo giờ máy người dùng (Việt Nam) */
const mtLocal = s => parseTs(s);
const mtDay = s => isoD(mtLocal(s));
const mtHM = s => { if(!s) return ''; const d=mtLocal(s); return pad(d.getHours())+':'+pad(d.getMinutes()); };
const mtTime = m => mtHM(m.startAt)+(m.endAt?' – '+mtHM(m.endAt):'');
const mtIds = m => String(m.attendeeIds||'').split(',').filter(Boolean);
const mtMine = m => (VP.st&&VP.st.me&&mtIds(m).includes(VP.st.me.id)) || m.createdByUserId===S.user.id;
const mtCanEdit = m => !m || !m.id || m.createdByUserId===S.user.id || can('lich-hop','edit');
const mtStatusPill = m => m.status==='Đã hủy'? pill('Đã hủy','bad') : m.status==='Đã hoãn'? pill('Đã hoãn','warn') : '';

/* Bản 1.10.16 (anh Trí 25/11): ngày 1-10 mỗi tháng, mỗi người thấy tổng kết tháng trước của chính mình, đọc xong thì ẩn */
function vpMonthlyCard(mo){
  if(!mo||!mo.row) return ''; let hid=false; try{ hid=localStorage.getItem('vpMonthly')===mo.month; }catch(e){}
  if(hid) return ''; const r=mo.row, w=vpW().toLowerCase(), mm=mo.month.slice(5)+'/'+mo.month.slice(0,4);
  const good=!r.absent && !r.late;
  const k=(l,v,c)=>`<div class="kpi ${c||''}"><div class="eyebrow">${l}</div><div class="v">${v}</div></div>`;
  return `<div class="card vp-monthly" style="margin-bottom:12px;border-left:4px solid var(--${good?'green':'amber'})"><div class="toolbar" style="justify-content:space-between"><h2 style="margin:0">Tổng kết tháng ${mm} của bạn</h2><button class="btn sm ghost" data-act="vp-monthly-ok" data-id="${esc(mo.month)}">Đã xem</button></div>
    <div class="grid g4 kpis" style="margin-top:8px">${k('Ngày công',fmtN(r.worked,1)+'/'+fmtN(r.standard,1))}${k('Ở công ty',r.office||0)}${k('Online',r.online||0)}${k('Công tác',r.tripDays||0)}${k('Khác',r.other||0)}${k('Đi muộn',(r.late||0)+' lần',r.late?'warn':'')}${k('Nghỉ phép',fmtN(r.leave||0,1))}${k('Nghỉ không phép',fmtN(r.absent||0,1),r.absent?'bad':'')}</div>
    <p style="margin:10px 0 0">${good?`Cảm ơn bạn đã ${esc(w)} đầy đủ và đúng giờ trong tháng ${mm}. Chúc bạn tháng mới làm việc hiệu quả!`:`Tháng mới, mời bạn ${esc(w)} đều mỗi ngày làm việc, trước ${esc(VP.st.settings.checkIn)}. Ngày nghỉ nhớ lập phiếu nghỉ phép để không bị tính nghỉ không phép.`}</p></div>`;
}
ACT['vp-monthly-ok']=m=>{ try{ localStorage.setItem('vpMonthly',m); }catch(e){} render(); };
/* Nhắc người chưa nhận nhiệm vụ: khung nhắc trên trang; nếu đã cho phép thông báo của trình duyệt thì hiện thêm thông báo (mỗi ngày một lần, khi ứng dụng đang mở) */
function vpRemindNotify(ib){
  if(!ib||!ib.remind||!('Notification' in window)||Notification.permission!=='granted') return;
  let last=''; try{ last=localStorage.getItem('vpRemindDay')||''; }catch(e){} if(last===TODAY) return;
  try{ localStorage.setItem('vpRemindDay',TODAY); new Notification(vpW(), {body: ib.remind, icon:'/icons/icon.svg'}); }catch(e){}
}
ACT['vp-notify-on']=async()=>{ if(!('Notification' in window)){ toast('Trình duyệt này không hỗ trợ thông báo.','err'); return; }
  const p=await Notification.requestPermission(); toast(p==='granted'?'Đã bật nhắc. Khi ứng dụng đang mở, quá giờ chưa '+vpW().toLowerCase()+' sẽ có thông báo.':'Chưa được phép hiện thông báo.', p==='granted'?undefined:'err'); render(); };
/* Hộp thư: số thông báo chưa xem, thông báo quan trọng, lịch của tôi trong 7 ngày */
function vpInbox(force){
  if(!S.user || VP.ibLoading || (!force && VP.ib && Date.now()-VP.ibAt<120000)) return;
  VP.ibLoading=true;
  api('GET','/api/vp/inbox').then(r=>{ VP.ib=r; VP.ibAt=Date.now(); vpRemindNotify(r); }).catch(()=>{}).finally(()=>{ VP.ibLoading=false; onData(); });
}
setInterval(()=>{ if(S.user && document.visibilityState==='visible') vpInbox(true); }, 120000);

/* Trang Điểm danh: thông báo quan trọng chưa xem và lịch của tôi hiện ngay trên đầu (không phải mở thêm trang) */
const _vpHome=VIEWS['van-phong'];
VIEWS['van-phong']=()=>{
  const html=_vpHome(); if(!VP.st) return html; vpInbox();
  const ib=VP.ib; if(!ib) return html;
  let top='', mid='';
  /* Bản 1.10.17: bỏ băng nhắc chưa nhận nhiệm vụ trên trang (nút chính đã đủ rõ); nhắc trên thiết bị vẫn giữ */
  top+=vpMonthlyCard(ib.monthly);
  if(ib.important.length) top+=`<div class="alert bad" style="margin-bottom:10px"><b>Thông báo quan trọng chưa xem:</b> ${ib.important.map(n=>`<a href="#" data-act="nt-open" data-id="${esc(n.id)}">${esc(n.title)}</a>`).join(' · ')}</div>`;
  const ms=ib.meetings.filter(m=>m.status!=='Đã hủy');
  if(ms.length) mid+=`<div class="card" style="margin-top:12px"><div class="toolbar" style="justify-content:space-between"><h2 style="margin:0">Lịch của tôi 7 ngày tới</h2><a class="small" href="#lich-hop">Lịch công tác tuần</a></div>
    <div class="alertList">${ms.map(m=>`<div class="alr click" data-act="mt-view" data-id="${esc(m.id)}"><span class="alr-d"><b>${['CN','T2','T3','T4','T5','T6','T7'][mtLocal(m.startAt).getDay()]} ${fmtDate(mtDay(m.startAt)).slice(0,5)}</b> ${mtTime(m)}</span><span>${esc(m.title)}${m.place?` <span class="muted">· ${esc(m.place)}</span>`:''} ${mtStatusPill(m)}</span></div>`).join('')}</div></div>`;
  /* Thông báo quan trọng trên cùng; lịch của tôi ngay dưới khối điểm danh (điểm danh vẫn là việc chính của trang) */
  const i=html.indexOf('<div class="grid g2 vp-top">'), j=html.indexOf('<div class="card" style="margin-top:12px"><div class="toolbar" style="justify-content:space-between"><h2 style="margin:0">Lịch sử ');
  if(i<0) return html;
  return j>i? html.slice(0,i)+top+html.slice(i,j)+mid+html.slice(j) : html.slice(0,i)+top+html.slice(i)+mid;
};

/* ---------------------------------------------------------------- Lịch công tác tuần */
const mtWeek = () => monday(S.f.lhw || TODAY);
function mtLoad(w){ return vpFetch(VP.mt, w, `/api/vp/meetings?from=${w}&to=${addD(w,6)}`); }
function mtRows(w){
  const list=mtLoad(w); if(!Array.isArray(list)) return list;
  const mine=S.f.lhm==='1', kind=S.f.lhk||'';
  return list.filter(m=>(!mine||mtMine(m))&&(!kind||m.kind===kind)).sort((a,b)=>String(a.startAt).localeCompare(String(b.startAt)));
}
VIEWS['lich-hop']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>Lịch công tác</h1></div></div>`+vpWait(); }
  const w=mtWeek(), e=addD(w,6), rows=mtRows(w);
  const dayHead=d=>`${VP_DOW[dOf(d).getDay()]}, ${fmtDate(d)}${d===TODAY?' · hôm nay':''}`;
  const body= rows===null? '<div class="empty">Đang tải…</div>' : rows&&rows.error? emptyBox(esc(rows.error)) : table([
      {h:'Thời gian', f:m=>`<b>${mtTime(m)}</b>`},
      {h:'Nội dung', f:m=>`${m.kind!=='Họp'?`<span class="small muted">${esc(m.kind)}:</span> `:''}<b style="font-weight:600">${esc(m.title)}</b> ${mtStatusPill(m)}${m.preparer?`<div class="small muted">Chuẩn bị: ${esc(m.preparer)}</div>`:''}`},
      {h:'Chủ trì', f:m=>esc(m.chair||'')},
      {h:'Thành phần', f:m=>esc(m.participants||'')+(mtIds(m).length?`<div class="small muted">${mtIds(m).length} người được mời</div>`:'')},
      {h:'Địa điểm', f:m=>esc(m.place||'')+(m.onlineLink?`<div class="small"><a href="${esc(m.onlineLink)}" target="_blank" rel="noopener">Vào họp trực tuyến</a></div>`:'')}],
    rows, {empty:'Tuần này chưa có lịch.', nopage:true, rowAct:'mt-view', group:m=>dayHead(mtDay(m.startAt))});
  return `<div class="head"><div class="grow"><h1>Lịch công tác tuần</h1><p>Từ ${fmtDate(w)} đến ${fmtDate(e)}</p></div>
    <div class="toolbar"><button class="btn primary" data-act="mt-edit" data-id="">+ Thêm lịch</button></div></div>
  <div class="toolbar" style="margin:4px 0 10px"><button class="btn sm" data-act="mt-wk" data-id="-7" aria-label="Tuần trước">‹ Tuần trước</button><button class="btn sm ${w===monday(TODAY)?'primary':''}" data-act="mt-wk" data-id="0">Tuần này</button><button class="btn sm" data-act="mt-wk" data-id="7" aria-label="Tuần sau">Tuần sau ›</button>
    <input type="date" data-f="lhw" value="${esc(w)}" aria-label="Chọn tuần">
    <select data-f="lhk" aria-label="Loại">${opts(['Họp','Làm việc','Công tác','Sự kiện'], S.f.lhk||'', 'Mọi loại')}</select>
    <label class="small"><input type="checkbox" data-act="mt-mine" ${S.f.lhm==='1'?'checked':''}> Chỉ lịch của tôi</label>
    <span style="flex:1"></span>${exportMenu([['mt-pdf','','Lịch tuần (PDF)'],['mt-xlsx','','Lịch tuần (Excel)']])}</div>${body}`;
};
ACT['mt-wk']=n=>{ S.f.lhw= +n===0? monday(TODAY) : addD(mtWeek(), +n); render(); };
ACT['mt-mine']=()=>{ S.f.lhm= S.f.lhm==='1'? '' : '1'; render(); };
const mtFind = id => { for(const k in VP.mt){ const l=VP.mt[k]; if(Array.isArray(l)){ const m=l.find(x=>x.id===id); if(m) return m; } } return (VP.ib&&VP.ib.meetings||[]).find(x=>x.id===id); };
function mtReload(){ VP.mt={}; vpInbox(true); render(); }

ACT['mt-view']=id=>{
  const m=mtFind(id); if(!m) return;
  const who=mtIds(m).map(x=>vpEmp(x)).filter(Boolean).map(x=>esc(x.name)).join(', ');
  const row=(l,v)=>v?`<div class="fld"><label>${l}</label><div>${v}</div></div>`:'';
  openModal(`<div class="mform wide"><header><h3>${esc(m.title)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header>
    <div class="fgrid" style="padding:16px">${row('Thời gian', `${VP_DOW[mtLocal(m.startAt).getDay()]}, ${fmtDate(mtDay(m.startAt))} · ${mtTime(m)} ${mtStatusPill(m)}`)}${row('Loại', esc(m.kind))}
    ${row('Địa điểm', esc(m.place||'')+(m.onlineLink?` · <a href="${esc(m.onlineLink)}" target="_blank" rel="noopener">Vào họp trực tuyến</a>`:''))}${row('Chủ trì', esc(m.chair||''))}${row('Thành phần', esc(m.participants||''))}${row('Người được mời', who)}
    ${row('Chuẩn bị', esc(m.preparer||''))}<div class="fld full">${m.content?`<label>Nội dung</label><div style="white-space:pre-wrap">${esc(m.content)}</div>`:''}</div>
    ${m.conclusion?`<div class="fld full"><label>Kết luận</label><div style="white-space:pre-wrap">${esc(m.conclusion)}</div></div>`:''}</div>
    <footer><button class="btn ghost" data-act="mt-ics" data-id="${esc(m.id)}" title="Tải tệp .ics để thêm vào lịch điện thoại, Outlook, Google Calendar">Thêm vào lịch điện thoại</button><span style="flex:1"></span>
      ${mtCanEdit(m)?`<button class="btn ghost danger" data-act="mt-del" data-id="${esc(m.id)}">Xóa</button><button class="btn" data-act="mt-copy" data-id="${esc(m.id)}">Sao chép</button><button class="btn primary" data-act="mt-edit" data-id="${esc(m.id)}">Sửa, ghi kết luận</button>`:''}</footer></div>`);
};
function mtForm(src, copy){
  const m=src||{};
  const now=new Date(); const defH=pad(Math.min(16, Math.max(8, now.getHours()+1)))+':00';
  const st=m.startAt? mtLocal(m.startAt) : null;
  const v={kind:m.kind||'Họp', title:m.title||'', date: copy? addD(mtDay(m.startAt),7) : st? isoD(st) : (S.f.lhw && monday(S.f.lhw)!==monday(TODAY)? monday(S.f.lhw) : TODAY),
    start: st? mtHM(m.startAt) : defH, end: m.endAt? mtHM(m.endAt) : '', place:m.place||'', onlineLink:m.onlineLink||'', chair:m.chair||'', participants:m.participants||'',
    att: mtIds(m), preparer:m.preparer||'', content:m.content||'', conclusion: copy? '' : m.conclusion||'', status: copy? 'Đã lên lịch' : m.status||'Đã lên lịch', repeat:''};
  const past=k=>{ const all=[]; for(const x in VP.mt) if(Array.isArray(VP.mt[x])) all.push(...VP.mt[x].map(y=>y[k])); return all; };
  const edit=!!(m.id && !copy);
  const F=[{key:'kind',label:'Loại',type:'select',req:true,options:['Họp','Làm việc','Công tác','Sự kiện']},{key:'date',label:'Ngày',type:'date',req:true},
    {key:'start',label:'Từ giờ',type:'time',req:true},{key:'end',label:'Đến giờ',type:'time'},
    {key:'title',label:'Nội dung',req:true,full:true,ph:'Ví dụ: Họp giao ban tuần'},
    {key:'place',label:'Địa điểm, phòng họp',suggest:()=>['Phòng họp tầng 1','Phòng họp tầng 2',...past('place')]},{key:'chair',label:'Chủ trì',suggest:()=>['Giám đốc','Phó Giám đốc',...past('chair')]},
    {key:'participants',label:'Thành phần (in trên lịch)',full:true,suggest:()=>['Toàn thể cán bộ, nhân viên','Ban Giám đốc, trưởng các phòng',...past('participants')]},
    {key:'att',label:'Mời người tham dự (hiện ở "Lịch của tôi" của từng người)',type:'checks',options:()=>VP.emps.filter(vpWorking).sort((a,b)=>vpDeptName(a.departmentId).localeCompare(vpDeptName(b.departmentId),'vi')||String(a.name).localeCompare(String(b.name),'vi')).map(e=>[e.id, e.name+(e.departmentId?' · '+vpDeptName(e.departmentId):'')])},
    {key:'onlineLink',label:'Đường dẫn họp trực tuyến (nếu có)',ph:'https://meet.google.com/…'},{key:'preparer',label:'Đơn vị, người chuẩn bị'},
    {key:'content',label:'Nội dung chi tiết, tài liệu',type:'textarea',keepLines:true}];
  if(edit) F.push({key:'status',label:'Trạng thái',type:'select',req:true,options:['Đã lên lịch','Đã hoãn','Đã hủy']},{key:'conclusion',label:'Kết luận cuộc họp',type:'textarea',rows:4,keepLines:true});
  else F.push({key:'repeat',label:'Lặp lại hằng tuần đến ngày (để trống: không lặp)',type:'date'});
  let force=false;
  openForm({title: edit?'Sửa lịch':'Thêm lịch công tác', wide:true, fields:F, value:v, submit: edit?'Lưu':'Lưu lịch',
    onSave:async x=>{
      if(x.end && x.end<=x.start) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
      const mk=d=>{ const [y,mo,dd]=d.split('-').map(Number); const at=(t)=>{ const [h,mi]=t.split(':').map(Number); return new Date(y,mo-1,dd,h,mi).toISOString(); };
        return {kind:x.kind, title:x.title, startAt:at(x.start), endAt:x.end?at(x.end):null, place:x.place||null, onlineLink:x.onlineLink||null, chair:x.chair||null, participants:x.participants||null,
          attendeeIds:(x.att||[]).join(','), preparer:x.preparer||null, content:x.content||null, conclusion:x.conclusion||null, status:x.status||'Đã lên lịch'}; };
      const id=edit? m.id : uid('lh');
      try{ await api('PUT','/api/vp/meetings/'+encodeURIComponent(id), {m:mk(x.date), force}); }
      catch(e){ if(e.status===409 && !force){ force=true; throw new Error(e.message+' Bấm Lưu lần nữa để vẫn lưu.'); } throw e; }
      let n=0;
      if(!edit && x.repeat && x.repeat>x.date){ for(let d=addD(x.date,7); d<=x.repeat && n<60; d=addD(d,7), n++) await api('PUT','/api/vp/meetings/'+encodeURIComponent(uid('lh')), {m:mk(d), force:true}); }
      S.f.lhw=monday(x.date); mtReload(); if(n) setTimeout(()=>toast(`Đã tạo thêm ${n} lịch lặp hằng tuần`),300); return {id};
    }});
}
ACT['mt-edit']=id=>mtForm(id? mtFind(id) : null);
ACT['mt-copy']=id=>mtForm(mtFind(id), true);
ACT['mt-del']=async id=>{ const m=mtFind(id); if(!m||!await confirmBox(`Xóa lịch <b>${esc(m.title)}</b>? Nếu chỉ dời, hủy cuộc họp, hãy bấm Sửa và chọn trạng thái Đã hoãn, Đã hủy để mọi người cùng biết.`)) return;
  await api('DELETE','/api/vp/meetings/'+encodeURIComponent(id)); toast('Đã xóa'); mtReload(); };
/* Tệp lịch chuẩn iCalendar (RFC 5545): mở được bằng lịch điện thoại, Outlook, Google Calendar */
ACT['mt-ics']=id=>{ const m=mtFind(id); if(!m) return;
  const z=s=>new Date(mtLocal(s).getTime()).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
  const tx=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/([,;])/g,'\\$1');
  const end=m.endAt||new Date(mtLocal(m.startAt).getTime()+3600e3).toISOString();
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//QLDA//Lich cong tac//VI','BEGIN:VEVENT','UID:'+m.id+'@qlda','DTSTAMP:'+z(new Date().toISOString()),'DTSTART:'+z(m.startAt),'DTEND:'+z(end),
    'SUMMARY:'+tx(m.title),'LOCATION:'+tx(m.place||m.onlineLink||''),'DESCRIPTION:'+tx([m.chair?'Chủ trì: '+m.chair:'', m.participants?'Thành phần: '+m.participants:'', m.onlineLink||'', m.content||''].filter(Boolean).join('\n')),
    m.status==='Đã hủy'?'STATUS:CANCELLED':'STATUS:CONFIRMED','BEGIN:VALARM','TRIGGER:-PT15M','ACTION:DISPLAY','DESCRIPTION:'+tx(m.title),'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  saveFile('Lich_'+mtDay(m.startAt)+'.ics', new Blob([ics],{type:'text/calendar;charset=utf-8'})); };

/* Bản in, Excel theo mẫu lịch công tác tuần: tên đơn vị, quốc hiệu, tiêu đề, kỳ; bảng Thứ/ngày, thời gian, nội dung, chủ trì, thành phần, địa điểm; nơi nhận, người ký */
function mtPrintRows(w){ const l=mtLoad(w); return (Array.isArray(l)?l:[]).filter(m=>m.status!=='Đã hủy').sort((a,b)=>String(a.startAt).localeCompare(String(b.startAt))); }
ACT['mt-pdf']=()=>{
  const w=mtWeek(), e=addD(w,6), rows=mtPrintRows(w);
  const days=[]; for(let i=0;i<7;i++){ const d=addD(w,i); const l=rows.filter(m=>mtDay(m.startAt)===d); if(l.length || i<5) days.push([d,l]); }
  const tb=days.map(([d,l])=>{ const dh=`<b>${VP_DOW[dOf(d).getDay()]}</b><br>${fmtDate(d)}`;
    if(!l.length) return `<tr><td class="c">${dh}</td><td colspan="5" class="muted">&nbsp;</td></tr>`;
    return l.map((m,i)=>`<tr>${i===0?`<td class="c" rowspan="${l.length}">${dh}</td>`:''}<td class="c">${mtTime(m)}</td><td>${esc(m.title)}${m.status==='Đã hoãn'?' <i>(hoãn)</i>':''}${m.preparer?`<div class="s">Chuẩn bị: ${esc(m.preparer)}</div>`:''}</td><td>${esc(m.chair||'')}</td><td>${esc(m.participants||'')}</td><td>${esc(m.place||'')}${m.onlineLink?'<div class="s">Trực tuyến</div>':''}</td></tr>`).join(''); }).join('');
  const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Lich cong tac tuan ${fmtDate(w)}</title><style>
  @page{size:A4 landscape; margin:12mm 12mm} body{font:12.5px/1.4 "Times New Roman",Times,serif; color:#000; margin:0}
  .hd{display:grid; grid-template-columns:1fr 1.2fr; text-align:center; margin-bottom:10px} .hd b{display:block} .hd .u{display:inline-block; border-top:1px solid #000; width:40%; margin-top:2px}
  h1{font-size:16px; text-align:center; margin:8px 0 2px} .sub{text-align:center; font-style:italic; margin-bottom:10px}
  table{width:100%; border-collapse:collapse} th,td{border:1px solid #000; padding:4px 6px; vertical-align:top} th{background:#eee}
  td.c{text-align:center; white-space:nowrap} .s{font-size:11px; font-style:italic} thead{display:table-header-group} tr{page-break-inside:avoid}
  .sign{display:grid; grid-template-columns:1fr 1fr; margin-top:14px; page-break-inside:avoid} .sign>div:last-child{text-align:center} .sign i{display:block} .sp{height:64px}
  </style></head><body>${printHead()}<h1>LỊCH CÔNG TÁC TUẦN</h1><div class="sub">(Từ ngày ${fmtDate(w)} đến ngày ${fmtDate(e)})</div>
  <table><thead><tr><th style="width:11%">Thứ, ngày</th><th style="width:10%">Thời gian</th><th>Nội dung</th><th style="width:14%">Chủ trì</th><th style="width:20%">Thành phần</th><th style="width:14%">Địa điểm</th></tr></thead><tbody>${tb}</tbody></table>
  <div class="sign"><div><b><i style="display:inline">Nơi nhận:</i></b><div>- Ban Giám đốc;</div><div>- Các phòng, bộ phận;</div><div>- Lưu: VT.</div></div>
  <div><i>${printDate()}</i><b>${esc(BR.signReport)}</b><div class="sp"></div>${esc('')}</div></div></body></html>`;
  const fr=document.createElement('iframe'); fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0'; fr.title='In lịch công tác';
  document.body.appendChild(fr); const doc=fr.contentDocument; doc.open(); doc.write(html); doc.close();
  setTimeout(()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }finally{ setTimeout(()=>fr.remove(), 60000); } }, 250);
};
ACT['mt-xlsx']=()=>{ const w=mtWeek(), e=addD(w,6), rows=mtPrintRows(w);
  exportXlsx(`Lich_cong_tac_tuan_${w}.xlsx`, [{name:'Lich tuan', title:'LỊCH CÔNG TÁC TUẦN', sub:`(Từ ngày ${fmtDate(w)} đến ngày ${fmtDate(e)})`,
    head:['Thứ, ngày','Thời gian','Nội dung','Chủ trì','Thành phần','Địa điểm','Chuẩn bị','Trạng thái'],
    rows: rows.map(m=>[`${VP_DOW[mtLocal(m.startAt).getDay()]} ${fmtDate(mtDay(m.startAt))}`, mtTime(m), m.title, m.chair||'', m.participants||'', (m.place||'')+(m.onlineLink?' (trực tuyến)':''), m.preparer||'', m.status]),
    foot:`Lập ngày ${fmtDate(TODAY)}`}]); };

/* ---------------------------------------------------------------- Thông báo nội bộ */
function ntLoad(){ if(VP.nt===null){ VP.nt=undefined; api('GET','/api/vp/notices?all=true').then(r=>{ VP.nt=r; onData(); }).catch(e=>{ VP.nt={error:errText(e)}; onData(); }); } return VP.nt; }
const ntFind = id => (Array.isArray(VP.nt)?VP.nt:[]).find(n=>n.id===id);
const ntTo = n => { const d=String(n.deptIds||'').split(',').filter(Boolean); return d.length? d.map(vpDeptName).filter(Boolean).join(', ') : 'Toàn công ty'; };
VIEWS['thong-bao']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>Thông báo</h1></div></div>`+vpWait(); }
  const l=ntLoad(); const ed=can('thong-bao','edit');
  const t=S.f.ntv||'all'; const q=S.f.ntq||'';
  const rows=Array.isArray(l)? l.filter(n=>(t!=='unread'||!n.read)&&(t!=='expired'||n.expired)&&(t==='expired'||!n.expired)&&has(n,q)) : [];
  const unread=Array.isArray(l)? l.filter(n=>!n.read&&!n.expired).length : 0;
  return `<div class="head"><div class="grow"><h1>Thông báo nội bộ</h1><p>${unread? unread+' thông báo chưa xem' : 'Bạn đã xem hết thông báo'}</p></div>
    <div class="toolbar">${unread?`<button class="btn" data-act="nt-readall">Đánh dấu đã xem hết</button>`:''}${ed?`<button class="btn primary" data-act="nt-edit" data-id="">+ Đăng thông báo</button>`:''}</div></div>
  <div class="toolbar" style="margin:4px 0 10px"><div class="tabs" style="margin:0">${[['all','Tất cả'],['unread','Chưa xem'],...(ed?[['expired','Đã hết hạn']]:[])].map(([k,lb])=>`<button class="${t===k?'on':''}" data-act="nt-tab" data-id="${k}">${lb}</button>`).join('')}</div>
    <input type="search" data-f="ntq" value="${esc(q)}" placeholder="Tìm thông báo…" aria-label="Tìm thông báo"></div>
  ${l===undefined||l===null? '<div class="empty">Đang tải…</div>' : l.error? emptyBox(esc(l.error)) : !rows.length? emptyBox(t==='unread'?'Không còn thông báo chưa xem.':'Chưa có thông báo.') :
    `<div class="nt-list">${rows.map(n=>`<div class="card nt ${n.read?'':'unread'}" style="margin-bottom:8px;cursor:pointer;${n.read?'':'border-left:4px solid var(--accent,#1f4e79)'}" data-act="nt-open" data-id="${esc(n.id)}">
      <div class="toolbar" style="justify-content:space-between;align-items:flex-start"><div><b style="font-weight:${n.read?500:700}">${n.pinned?'📌 ':''}${esc(n.title)}</b> ${n.important?pill('Quan trọng','bad'):''}${n.expired?pill('Hết hạn'):''}
        <div class="small muted">${esc(n.authorName||'')} · ${fmtDate(isoD(parseTs(n.publishedAt)))} · Gửi: ${esc(ntTo(n))}${n.expireOn?' · hiệu lực đến '+fmtDate(n.expireOn):''}</div></div>
        ${n.readCount!=null?`<button class="btn sm ghost" data-act="nt-reads" data-id="${esc(n.id)}" title="Ai đã xem, ai chưa xem">Đã xem ${n.readCount}</button>`:''}</div>
      ${n.body?`<div class="small" style="margin-top:6px;white-space:pre-wrap;max-height:3.2em;overflow:hidden">${esc(n.body)}</div>`:''}</div>`).join('')}</div>`}`;
};
ACT['nt-tab']=k=>{ S.f.ntv=k; render(); };
ACT['nt-open']=async(id,el,ev)=>{
  if(ev && ev.target && ev.target.closest('[data-act="nt-reads"]')) return;
  let n=ntFind(id); if(!n){ VP.nt=null; ntLoad(); const l=await api('GET','/api/vp/notices?all=true'); VP.nt=l; n=ntFind(id); } if(!n) return;
  openModal(`<div class="mform wide"><header><h3>${esc(n.title)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:16px">
    <p class="small muted" style="margin-top:0">${esc(n.authorName||'')} · ${fmtDate(isoD(parseTs(n.publishedAt)))} · Gửi: ${esc(ntTo(n))} ${n.important?pill('Quan trọng','bad'):''}</p>
    <div style="white-space:pre-wrap;line-height:1.55">${esc(n.body||'')}</div>${n.link?`<p><a href="${esc(n.link)}" target="_blank" rel="noopener">Mở tài liệu kèm theo</a></p>`:''}</div>
    <footer><span style="flex:1"></span>${can('thong-bao','edit')?`<button class="btn ghost danger" data-act="nt-del" data-id="${esc(n.id)}">Gỡ</button><button class="btn" data-act="nt-edit" data-id="${esc(n.id)}">Sửa</button>`:''}<button class="btn primary" data-close>${n.read?'Đóng':'Đã xem'}</button></footer></div>`);
  if(!n.read){ await api('POST','/api/vp/notices/'+encodeURIComponent(id)+'/read').catch(()=>{}); n.read=true; if(n.readCount!=null) n.readCount++; vpInbox(true); }
};
ACT['nt-readall']=async()=>{ const l=(Array.isArray(VP.nt)?VP.nt:[]).filter(n=>!n.read&&!n.expired);
  for(const n of l){ await api('POST','/api/vp/notices/'+encodeURIComponent(n.id)+'/read').catch(()=>{}); n.read=true; } vpInbox(true); render(); toast('Đã đánh dấu đã xem'); };
ACT['nt-edit']=id=>{ const n=ntFind(id)||{};
  openForm({title: id?'Sửa thông báo':'Đăng thông báo', wide:true, value:{title:n.title||'', body:n.body||'', depts:String(n.deptIds||'').split(',').filter(Boolean), important:n.important?'1':'', pinned:n.pinned?'1':'', expireOn:n.expireOn||'', link:n.link||''},
    fields:[{key:'title',label:'Tiêu đề',req:true,full:true},{key:'body',label:'Nội dung',type:'textarea',rows:8,keepLines:true},
      {key:'depts',label:'Gửi đến phòng ban (không chọn: toàn công ty)',type:'checks',options:()=>VP.depts.map(d=>[d.id,d.name])},
      {key:'important',label:'Mức độ',type:'select',options:[['','Bình thường'],['1','Quan trọng: hiện nổi trên trang Điểm danh đến khi người nhận đã xem']]},
      {key:'pinned',label:'Ghim lên đầu',type:'select',options:[['','Không'],['1','Ghim']]},{key:'expireOn',label:'Hiệu lực đến ngày (để trống: không hết hạn)',type:'date'},
      {key:'link',label:'Đường dẫn tài liệu kèm theo (nếu có)',ph:'https://…'}],
    submit: id?'Lưu':'Đăng',
    onSave:async v=>{ const r=await api('PUT','/api/vp/notices/'+encodeURIComponent(id||uid('tb')), {title:v.title, body:v.body||null, deptIds:(v.depts||[]).join(','), important:v.important==='1', pinned:v.pinned==='1', expireOn:v.expireOn||null, link:v.link||null});
      VP.nt=null; vpInbox(true); return r; }}); };
ACT['nt-del']=async id=>{ const n=ntFind(id); if(!n||!await confirmBox(`Gỡ thông báo <b>${esc(n.title)}</b>?`,'Gỡ')) return; await api('DELETE','/api/vp/notices/'+encodeURIComponent(id)); VP.nt=null; vpInbox(true); toast('Đã gỡ thông báo'); render(); };
ACT['nt-reads']=async id=>{ const n=ntFind(id); const l=await api('GET','/api/vp/notices/'+encodeURIComponent(id)+'/reads'); VP._reads={n,l};
  const no=l.filter(x=>!x.readAt), yes=l.filter(x=>x.readAt);
  openModal(`<div class="mform wide"><header><h3>Đã xem ${yes.length}/${l.length}: ${esc(n?n.title:'')}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:16px">
    <h3 style="margin-top:0">Chưa xem (${no.length})</h3><p>${no.map(x=>esc(x.name)+(x.departmentId?` <span class="small muted">${esc(vpDeptName(x.departmentId))}</span>`:'')).join(', ')||'<span class="muted">Không còn ai.</span>'}</p>
    <h3>Đã xem (${yes.length})</h3>${table([{h:'Họ tên',f:x=>esc(x.name)},{h:'Phòng ban',f:x=>esc(vpDeptName(x.departmentId))},{h:'Lúc xem',f:x=>{ const d=parseTs(x.readAt); return pad(d.getHours())+':'+pad(d.getMinutes())+' '+fmtDate(isoD(d)); }}], yes, {nopage:true, empty:'Chưa có ai xem.'})}</div>
    <footer><span style="flex:1"></span><button class="btn ghost" data-act="nt-reads-xlsx">Xuất Excel</button><button class="btn primary" data-close>Đóng</button></footer></div>`); };
ACT['nt-reads-xlsx']=()=>{ const r=VP._reads; if(!r) return;
  exportXlsx('Theo_doi_xem_thong_bao.xlsx', [{name:'Da xem', title:'THEO DÕI XEM THÔNG BÁO', sub:r.n?r.n.title:'', head:['STT','Họ tên','Phòng ban','Đã xem','Lúc xem'],
    rows:r.l.map((x,i)=>[i+1, x.name, vpDeptName(x.departmentId), x.readAt?'Đã xem':'Chưa xem', x.readAt? (d=>pad(d.getHours())+':'+pad(d.getMinutes())+' '+fmtDate(isoD(d)))(parseTs(x.readAt)) : ''])}]); };

/* ---------------------------------------------------------------- KPI tháng (Bản 1.10) */
VP.kpi={};
EXTRA_ROUTES.push('kpi');
const kpiMonth = () => S.f.kpim || (()=>{ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-(new Date().getDate()<=5?1:0)); return d.getFullYear()+'-'+pad(d.getMonth()+1); })();
const kpiGradePill = g => g? pill(g, g==='A'?'ok':g==='B'?'info':g==='C'?'warn':g.length>2?'':'bad') : '';
const kpiN = v => v==null? '<span class="muted">—</span>' : fmtN(v,1);
function kpiStars(r){ const v=r.rating||0;
  if(!r.canRate) return v? '★'.repeat(v)+'<span class="muted">'+'★'.repeat(5-v)+'</span>' : '<span class="muted">Chưa chấm</span>';
  return `<span class="kpi-stars" role="radiogroup" aria-label="Đánh giá của quản lý">${[1,2,3,4,5].map(n=>`<button type="button" class="btn sm ghost" style="padding:0 2px;font-size:18px;line-height:1;color:${n<=v?'#e0a100':'#bbb'}" data-act="kpi-star" data-id="${esc(r.employeeId+'|'+n)}" aria-label="${n} sao" title="${['','Chưa đạt yêu cầu','Cần cố gắng','Đạt yêu cầu','Tốt','Xuất sắc'][n]}">★</button>`).join('')}</span>`; }
VIEWS['kpi']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>KPI</h1></div></div>`+vpWait(); }
  const m=kpiMonth(); const d=vpFetch(VP.kpi, m, '/api/vp/kpi?month='+m); const dep=S.f.kpid||'';
  let body;
  if(d===null) body='<div class="empty">Đang tải…</div>';
  else if(d.error) body=emptyBox(esc(d.error));
  else {
    const k=d.settings; const rows=d.rows.filter(r=>!dep||r.departmentId===dep);
    const locked=d.rows.length && d.rows.every(r=>r.locked);
    const need=rows.filter(r=>r.canRate && r.missing.length).length;
    const rmK=!!(k.auto && k.resultFrom && m>=k.resultFrom); /* 1.10.24: tháng theo kết quả: sản phẩm / chuyên cần / tương tác */
    body=`<div class="toolbar" style="margin:0 0 8px;gap:12px"><details class="small muted kpi-how"><summary>Cách tính</summary>${rmK?`Sản phẩm ${k.rWork}% (mốc kết quả được nghiệm thu, nhân quy mô, đúng hạn, chất lượng) + Chuyên cần ${k.rAttendance}% + Tương tác ${k.rInteract}% (số ngày làm việc có cập nhật trên phần mềm, đủ ${Math.round((k.interactTarget||0.6)*100)}% số ngày đi làm là 100 điểm; mỗi ngày tính một lần). Cả tháng không có sản phẩm nào (kể cả sản phẩm dài đang làm) thì phần sản phẩm 0 điểm.`:k.auto?`Công việc ${k.wWork}% + Chuyên cần ${k.wAttendance}%; tháng không có việc được giao thì chỉ tính chuyên cần.`:`Công việc ${k.wWork}% + Kết quả dự án ${k.wProject}% + Chuyên cần ${k.wAttendance}% + Đánh giá quản lý ${k.wManager}%.`} Xếp loại: ${k.grades.map(g=>`${esc(g.name)} từ ${fmtN(g.min)}`).join(', ')}.</details>${locked?pill('Đã chốt','ok'):need&&!k.auto?pill(need+' người chưa chấm đủ','warn'):''}</div>`
    + table([
      {h:'Họ tên', f:r=>`<b style="font-weight:600">${esc(r.name)}</b><div class="small muted">${esc(vpDeptName(r.departmentId))}</div>`},
      {h:rmK?`Sản phẩm (${k.rWork}%)`:`Công việc (${k.wWork}%)`, r:1, f:r=>`${kpiN(r.work)}${r.workOverride!=null?' <span class="small muted" title="Quản lý ghi đè">✎</span>':''}${r.workAuto?`<div class="small muted">${r.workAuto.total} việc, ${r.workAuto.onTime} đúng hạn${r.workAuto.late?', '+r.workAuto.late+' trễ':''}${r.workAuto.overdue?', '+r.workAuto.overdue+' quá hạn':''}${r.workAuto.collab?', '+r.workAuto.collab+' phối hợp':''}</div>`:''}`},
      ...(k.auto||!k.wProject?[]:[{h:`Dự án (${k.wProject}%)`, r:1, f:r=> r.canRate? `<input type="number" min="0" max="100" step="5" value="${r.project??''}" data-kpi-proj="${esc(r.employeeId)}" style="width:70px;text-align:right" aria-label="Điểm kết quả dự án của ${esc(r.name)}">` : kpiN(r.project)}]),
      ...(rmK?[{h:`Tương tác (${k.rInteract}%)`, r:1, f:r=>`${kpiN(r.interact)}${r.interact!=null?`<div class="small muted">${r.interactDays} ngày có cập nhật</div>`:''}`}]:[]),
      {h:`Chuyên cần (${rmK?k.rAttendance:k.wAttendance}%)`, r:1, f:r=>`${kpiN(r.attendance)}${r.attendance!=null?`<div class="small muted">muộn ${r.attDetail.late}${r.attDetail.absent?', '+(vpSimple()?'nghỉ không phép':'nghỉ KLD')+' '+fmtN(r.attDetail.absent,1):''}${r.attDetail.noOut?', quên ra '+r.attDetail.noOut:''}</div>`:''}`},
      ...(k.auto||!k.wManager?[]:[{h:`Quản lý (${k.wManager}%)`, f:r=>kpiStars(r)+(r.ratingNote?`<div class="small muted" title="${esc(r.ratingNote)}">${esc(r.ratingNote.slice(0,40))}</div>`:'')}]),
      {h:'Tổng', r:1, f:r=>`<b>${fmtN(r.total,1)}</b>`}, {h:'Xếp loại', f:r=>kpiGradePill(r.grade)+(r.rankLabel?`<div class="small" style="color:var(--green,#16a34a)">${esc(r.rankLabel)}${r.rankBonus?' · '+fmtVND(r.rankBonus):''}</div>`:'')+(r.employeeNote?` <span title="Có phản hồi: ${esc(r.employeeNote)}">💬</span>`:'')}],
      rows, {empty:'Chưa có nhân sự trong phạm vi bạn xem.', nopage:true, rowAct:'kpi-row'});
  }
  const ed=d&&d.canEdit, locked=d&&d.rows&&d.rows.length&&d.rows.every(r=>r.locked);
  return `<div class="head"><div class="grow"><h1>KPI tháng ${m.slice(5)}/${m.slice(0,4)}</h1><p>${VP.st.perms.admin||ed||(d&&d.rows&&d.rows.length>1&&!(VP.st.perms.managed||[]).length)?'Toàn công ty':(VP.st.perms.managed||[]).length?'Phòng do bạn phụ trách và của bạn':'Kết quả của bạn'}${locked?` · <b>Đã chốt</b>${d.rows[0].lockedBy?' ('+esc(d.rows[0].lockedBy)+')':''}`:d&&d.autoLockAt?` · tự chốt 0 giờ ngày ${fmtDate(d.autoLockAt)}`:''}</p></div>
    <div class="toolbar">${ed?`<button class="btn" data-act="kpi-set">Thiết lập</button><button class="btn ${locked?'':'primary'}" data-act="kpi-lock" data-id="${locked?'0':'1'}">${locked?'Mở chốt':'Chốt KPI tháng'}</button>`:''}</div></div>
  <div class="toolbar" style="margin:4px 0 10px">${monthSel('kpim', m)}<select data-f="kpid" aria-label="Phòng ban">${opts(VP.depts.map(x=>[x.id,x.name]), dep, 'Tất cả phòng ban')}</select>
    <span style="flex:1"></span>${exportMenu([['kpi-pdf','','Bảng KPI (PDF)'],['kpi-xlsx','','Bảng KPI (Excel)']])}</div>${body}`;
};
async function kpiSave(emp, body){ const m=kpiMonth(); await api('PUT',`/api/vp/kpi/${m}/${encodeURIComponent(emp)}`, body); delete VP.kpi[m]; render(); }
ACT['kpi-star']=async id=>{ const [emp,n]=id.split('|'); await kpiSave(emp, {rating:+n}); toast('Đã chấm '+n+' sao'); };
document.addEventListener('change', e=>{ const el=e.target.closest && e.target.closest('[data-kpi-proj]'); if(!el) return;
  const v=el.value===''? null : Number(el.value); if(v!=null && (v<0||v>100)){ toast('Điểm từ 0 đến 100','err'); return; }
  kpiSave(el.dataset.kpiProj, {projectScore:v}).then(()=>toast('Đã lưu điểm dự án')).catch(ex=>toast(errText(ex),'err')); });
const kpiRow = id => { const d=VP.kpi[kpiMonth()]; return d&&d.rows&&d.rows.find(r=>r.employeeId===id); };
ACT['kpi-row']=(id,el,ev)=>{ if(ev&&ev.target&&ev.target.closest('input,button')) return; const r=kpiRow(id); if(!r) return;
  if(r.self && !r.locked) return openForm({title:'Phản hồi KPI tháng '+kpiMonth().slice(5)+'/'+kpiMonth().slice(0,4), narrow:true, value:{note:r.employeeNote||''},
    fields:[{key:'_i',type:'html',html:`<div class="fld full small">Tổng điểm hiện tại <b>${fmtN(r.total,1)}</b> (${esc(r.grade||'')}). Công việc ${kpiN(r.work)}, dự án ${kpiN(r.project)}, chuyên cần ${kpiN(r.attendance)}, quản lý ${r.rating?r.rating+' sao':'chưa chấm'}${r.ratingNote?': '+esc(r.ratingNote):''}.</div>`},{key:'note',label:'Ý kiến, giải trình của bạn (gửi trưởng phòng trước khi chốt)',type:'textarea',keepLines:true}],
    submit:'Gửi phản hồi', onSave:async v=>{ await api('POST',`/api/vp/kpi/${kpiMonth()}/phan-hoi`,{note:v.note||''}); delete VP.kpi[kpiMonth()]; return {id:'x'}; }});
  if(!r.canRate) return;
  openForm({title:'Chấm KPI: '+r.name, narrow:true, value:{work:r.workOverride??'', project:r.project??'', rating:r.rating?String(r.rating):'', note:r.ratingNote||''},
    fields:[{key:'_i',type:'html',html:`<div class="fld full small">${r.workAuto?`Công việc theo số liệu: <b>${fmtN(r.workAuto.score,1)}</b> (${r.workAuto.total} việc, ${r.workAuto.onTime} đúng hạn, ${r.workAuto.late} trễ, ${r.workAuto.overdue} quá hạn).`:'Chưa có công việc giao trong tháng: nhập điểm công việc.'}${r.employeeNote?`<div class="alert info" style="margin-top:6px">Phản hồi của nhân viên: ${esc(r.employeeNote)}</div>`:''}</div>`},
      {key:'work',label:'Điểm công việc 0–100 (để trống: theo số liệu)',type:'number'},{key:'project',label:'Điểm kết quả dự án 0–100',type:'number'},
      {key:'rating',label:'Đánh giá của quản lý',type:'select',options:[['1','1 sao: chưa đạt yêu cầu'],['2','2 sao: cần cố gắng'],['3','3 sao: đạt yêu cầu'],['4','4 sao: tốt'],['5','5 sao: xuất sắc']]},
      {key:'note',label:'Nhận xét, lý do',type:'textarea',keepLines:true}],
    onSave:async v=>{ await api('PUT',`/api/vp/kpi/${kpiMonth()}/${encodeURIComponent(id)}`,{workScore:v.work, clearWork:v.work==null, projectScore:v.project, rating:v.rating?+v.rating:null, note:v.note||''}); delete VP.kpi[kpiMonth()]; return {id}; }});
};
ACT['kpi-lock']=async l=>{ const m=kpiMonth(); const d=VP.kpi[m];
  const miss=d&&d.rows? d.rows.filter(r=>r.missing.length).length : 0;
  if(l==='1' && !await confirmBox(`Chốt KPI tháng ${m.slice(5)}/${m.slice(0,4)}? Điểm, xếp loại được lưu cố định để tính thưởng.${miss?` <b>${miss} người chưa chấm đủ</b> (phần thiếu tính 0 điểm).`:''}`,'Chốt')) return;
  await api('POST',`/api/vp/kpi/${m}/chot`,{lock:l==='1'}); delete VP.kpi[m]; render(); toast(l==='1'?'Đã chốt KPI tháng':'Đã mở chốt'); };
ACT['kpi-set']=async()=>{ const k=await api('GET','/api/vp/kpi-settings');
  openForm({title:'Thiết lập KPI', value:{...k, grades:k.grades.map(g=>[g.name,g.min,g.bonus].join('; ')).join('\n'), rankOn:k.rankOn?'1':'0', auto:k.auto?'1':'0', rankCompany:k.rankCompany?'1':'0', public:k.public?'1':'0', rankTop:k.rankTop||0, autoLock:k.autoLock===false?'0':'1', autoLockDay:k.autoLockDay||1, rankTables:(k.rankTables||[]).map(x=>x.from+' | '+x.amounts.join('; ')).join('\n'),
      levels:(k.levels||[]).map(x=>x.name+'; '+x.weight).join('\n'), lateSteps:(k.lateSteps||[]).map(x=>x.days+'; '+x.factor).join('\n'), qualityFactors:(k.qualityFactors||[]).join('; '), resultFrom:k.resultFrom||'', rWork:k.rWork??60, rAttendance:k.rAttendance??20, rInteract:k.rInteract??20, interactTarget:k.interactTarget??0.6, trackProgress:k.trackProgress?'1':'0'},
    fields:[{key:'public',label:'Công khai điểm KPI',type:'select',options:[['1','Mọi người xem được điểm, xếp loại, hạng của nhau (tiền thưởng vẫn riêng)'],['0','Mỗi người chỉ xem của mình; trưởng phòng xem phòng mình']]},{key:'auto',label:'Cách tính',type:'select',options:[['1','Tự động hoàn toàn: chỉ công việc + chuyên cần, không ai chấm tay'],['0','Có thêm điểm dự án và đánh giá của quản lý']]},{key:'_h1',type:'html',html:'<div class="fld full"><b>Trọng số bốn nhóm (tổng 100)</b><div class="small muted">Tự động hoàn toàn: đặt Kết quả dự án và Đánh giá của quản lý bằng 0.</div></div>'},{key:'wWork',label:'Hoàn thành công việc',type:'number',req:true},{key:'wProject',label:'Kết quả dự án',type:'number',req:true},
      {key:'wAttendance',label:'Chuyên cần',type:'number',req:true},{key:'wManager',label:'Đánh giá của quản lý',type:'number',req:true},
      {key:'_h2',type:'html',html:'<div class="fld full"><b>Chuyên cần: 100 điểm, trừ mỗi lần</b></div>'},{key:'penLate',label:'Đi muộn',type:'number'},{key:'graceMinutes',label:'Phút ân hạn (muộn không quá số phút này không trừ)',type:'number'},
      {key:'penEarly',label:'Về sớm',type:'number'},{key:'penNoOut',label:'Quên điểm danh ra',type:'number'},{key:'penAbsent',label:'Mỗi ngày nghỉ không lý do',type:'number'},
      {key:'grades',label:'Xếp loại: mỗi dòng "tên; điểm từ; thưởng (đồng)"',type:'textarea',rows:4,keepLines:true},
      {key:'_h3',type:'html',html:'<div class="fld full"><b>Thưởng theo hạng trong phòng ban (như e-work)</b><div class="small muted">Mỗi phòng xếp hạng theo tổng điểm; người đạt xếp loại tối thiểu mới được xếp hạng; bằng điểm thì cùng hạng. Cộng vào lương tháng khi chốt KPI.</div></div>'},
      {key:'rankOn',label:'Thưởng theo hạng',type:'select',options:[['0','Không dùng'],['1','Có']]},{key:'rankMinGrade',label:'Xếp loại tối thiểu để được xếp hạng',type:'text'},{key:'rankCompany',label:'Xếp hạng',type:'select',options:[['1','Chung toàn công ty'],['0','Riêng từng phòng ban']]},{key:'rankTop',label:'Chỉ thưởng cho số người đứng đầu (0 = theo bảng)',type:'number'},
      {key:'rankTables',label:'Mức thưởng: mỗi dòng "tháng áp dụng | hạng 1; hạng 2; …"',type:'textarea',rows:3,keepLines:true,ph:'2026-05 | 1000000; 500000'},
      {key:'_h4',type:'html',html:'<div class="fld full"><b>Cách tính điểm công việc</b><div class="small muted">Mỗi việc: hệ số mức độ × hệ số đúng hạn × hệ số chất lượng × (1 − trừ mỗi lần mở lại − trừ mỗi lần gia hạn). Người phối hợp tính hệ số mức độ × hệ số phối hợp. Điểm = 100 × tổng đạt / tổng hệ số mức độ. Nhiệm vụ có việc con chỉ tính các việc con; việc phát sinh tính khi đã xác nhận.</div></div>'},
      {key:'_h4b',type:'html',html:'<div class="fld full"><b>Quản lý theo kết quả sản phẩm</b><div class="small muted">Giao việc phải ghi sản phẩm bàn giao; nộp sản phẩm kèm tệp hoặc đường dẫn; nghiệm thu Đạt tốt, Đạt, Chưa đạt (trả lại sửa). Từ tháng áp dụng: điểm mỗi việc = mức độ × đúng hạn × hệ số Đạt tốt hoặc Đạt (tự Đạt tính như Đạt) × (1 − trừ mỗi lần trả lại); gia hạn xin trước hạn không trừ, xin khi đã quá hạn thì trễ tính theo hạn cũ. Để trống tháng là tắt.</div></div>'},
      {key:'resultFrom',label:'Áp dụng từ tháng',type:'text',ph:'2026-12'},{key:'trackProgress',label:'Tiến độ % trên từng việc',type:'select',options:[['0','Không theo dõi'],['1','Có theo dõi']]},
      {key:'rWork',label:'Tỷ trọng Sản phẩm (%)',type:'number'},{key:'rAttendance',label:'Tỷ trọng Chuyên cần (%)',type:'number'},{key:'rInteract',label:'Tỷ trọng Tương tác (%)',type:'number'},{key:'interactTarget',label:'Tương tác đủ điểm khi tỷ lệ ngày có cập nhật đạt (0,1–1)',type:'number'},
      {key:'goodFactor',label:'Hệ số Đạt tốt (0–1,5)',type:'number'},{key:'passFactor',label:'Hệ số Đạt (0–1,5)',type:'number'},
      {key:'levels',label:'Mức độ: mỗi dòng "tên; hệ số"',type:'textarea',rows:3,keepLines:true,ph:'Bình thường; 1'},
      {key:'lateSteps',label:'Trễ hạn: mỗi dòng "trễ đến (ngày làm việc); hệ số"',type:'textarea',rows:3,keepLines:true,ph:'0; 1'},
      {key:'lateOver',label:'Hệ số khi trễ quá bậc cuối',type:'number'},
      {key:'qualityFactors',label:'Hệ số chất lượng 1; 2; 3; 4; 5 sao (chưa nghiệm thu = 1)',type:'text'},
      {key:'reopenPenalty',label:'Trừ mỗi lần mở lại (0–1)',type:'number'},{key:'extendPenalty',label:'Trừ mỗi lần gia hạn (0–1)',type:'number'},
      {key:'collabFactor',label:'Hệ số người phối hợp (0–1)',type:'number'},{key:'remindDays',label:'Nhắc việc trước hạn (ngày)',type:'number'},
      {key:'_h5',type:'html',html:'<div class="fld full"><b>Chốt KPI</b><div class="small muted">Máy tự tính KPI. Chốt là khóa kết quả tháng để tính thưởng, việc cập nhật trễ không làm đổi thưởng đã trả. Muốn sửa thì bấm Mở chốt, sửa xong bấm Chốt lại.</div></div>'},
      {key:'autoLock',label:'Tự chốt KPI tháng trước',type:'select',options:[['1','Có, lúc 0 giờ ngày dưới đây của tháng sau'],['0','Không, chốt bằng tay']]},{key:'autoLockDay',label:'Ngày tự chốt (1–28)',type:'number'}],
    onSave:async v=>{ const rankTables=String(v.rankTables||'').split('\n').map(l=>l.split('|')).filter(p=>p.length===2&&p[0].trim()).map(p=>({from:p[0].trim(), amounts:p[1].split(';').map(x=>N(x.trim().replace(/\./g,''))).filter(x=>!isNaN(x))}));
      const grades=String(v.grades||'').split('\n').map(l=>l.split(';').map(x=>x.trim())).filter(p=>p[0]).map(p=>({name:p[0], min:N(p[1]), bonus:N(String(p[2]||'0').replace(/\./g,''))}));
      if(N(v.wWork)+N(v.wProject)+N(v.wAttendance)+N(v.wManager)!==100) throw new Error('Tổng trọng số phải bằng 100.');
      if(v.auto==='1' && (N(v.wProject)>0||N(v.wManager)>0)) throw new Error('Tự động hoàn toàn: đặt Kết quả dự án và Đánh giá của quản lý bằng 0.');
      await api('PUT','/api/vp/kpi-settings',{auto:v.auto==='1', wWork:N(v.wWork), wProject:N(v.wProject), wAttendance:N(v.wAttendance), wManager:N(v.wManager), penLate:N(v.penLate), penEarly:N(v.penEarly), penNoOut:N(v.penNoOut), penAbsent:N(v.penAbsent), graceMinutes:N(v.graceMinutes), grades, rankOn:v.rankOn==='1', rankCompany:v.rankCompany==='1', public:v.public==='1', rankTop:Math.max(0,N(v.rankTop)||0), rankMinGrade:(v.rankMinGrade||'').trim(), rankTables,
        levels:String(v.levels||'').split('\n').map(l=>l.split(';').map(x=>x.trim())).filter(p=>p[0]).map(p=>({name:p[0], weight:N(String(p[1]||'1').replace(',','.'))})),
        lateSteps:String(v.lateSteps||'').split('\n').map(l=>l.split(';').map(x=>x.trim())).filter(p=>p[0]!==''&&p.length>1).map(p=>({days:Math.round(N(p[0])), factor:N(String(p[1]).replace(',','.'))})),
        lateOver:N(v.lateOver), qualityFactors:String(v.qualityFactors||'').split(';').map(x=>N(x.trim().replace(',','.'))).filter(x=>!isNaN(x)),
        resultFrom:String(v.resultFrom||'').trim()||null, trackProgress:v.trackProgress==='1', goodFactor:N(v.goodFactor), passFactor:N(v.passFactor), rWork:N(v.rWork), rAttendance:N(v.rAttendance), rInteract:N(v.rInteract), interactTarget:N(v.interactTarget), reopenPenalty:N(v.reopenPenalty), extendPenalty:N(v.extendPenalty), collabFactor:N(v.collabFactor), remindDays:Math.round(N(v.remindDays)), autoLock:v.autoLock!=='0', autoLockDay:Math.min(28,Math.max(1,Math.round(N(v.autoLockDay))||1))});
      VP.kpi={}; return {id:'kpi'}; }}); };
function kpiTable(){ const m=kpiMonth(), d=VP.kpi[m]; if(!d||!d.rows) return null; const dep=S.f.kpid||'';
  return {m, k:d.settings, rows:d.rows.filter(r=>!dep||r.departmentId===dep).slice().sort((a,b)=>vpDeptName(a.departmentId).localeCompare(vpDeptName(b.departmentId),'vi')||b.total-a.total)}; }
ACT['kpi-xlsx']=()=>{ const t=kpiTable(); if(!t) return;
  const rows=t.rows.map((r,i)=>[i+1, r.name, vpDeptName(r.departmentId), r.work??'', r.project??'', r.attendance??'', r.rating?r.rating*20:'', r.total, r.grade||'', r.rankLabel||'', (r.bonus||0)+(r.rankBonus||0), r.ratingNote||'']);
  exportXlsx(`KPI_${t.m}.xlsx`, [{name:'KPI '+t.m, title:`BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ KPI THÁNG ${t.m.slice(5)}/${t.m.slice(0,4)}`, sub:`Trọng số: công việc ${t.k.wWork}%, kết quả dự án ${t.k.wProject}%, chuyên cần ${t.k.wAttendance}%, đánh giá quản lý ${t.k.wManager}%`,
    head:['STT','Họ tên','Phòng ban','Công việc','Kết quả dự án','Chuyên cần','Đánh giá quản lý','Tổng điểm','Xếp loại','Hạng trong phòng','Thưởng (đồng)','Nhận xét'], rows, money:[10]}]); };
ACT['kpi-pdf']=()=>{ const t=kpiTable(); if(!t) return;
  const f=v=>v==null||v===''?'':fmtN(v,1);
  const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>KPI ${t.m}</title><style>
  @page{size:A4 landscape; margin:12mm} body{font:12.5px/1.4 "Times New Roman",Times,serif; color:#000; margin:0}
  .hd{display:grid; grid-template-columns:1fr 1.2fr; text-align:center; margin-bottom:10px} .hd b{display:block} .hd .u{display:inline-block; border-top:1px solid #000; width:40%; margin-top:2px}
  h1{font-size:16px; text-align:center; margin:8px 0 2px} .sub{text-align:center; font-style:italic; margin-bottom:10px}
  table{width:100%; border-collapse:collapse} th,td{border:1px solid #000; padding:3px 5px; vertical-align:top} th{background:#eee} td.r{text-align:right} td.c{text-align:center}
  thead{display:table-header-group} tr{page-break-inside:avoid} .sign{display:grid; grid-template-columns:1fr 1fr 1fr; text-align:center; margin-top:16px; page-break-inside:avoid} .sign i{display:block} .sp{height:64px}
  </style></head><body>${printHead()}<h1>BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ KPI THÁNG ${t.m.slice(5)}/${t.m.slice(0,4)}</h1>
  <div class="sub">Trọng số: công việc ${t.k.wWork}%, kết quả dự án ${t.k.wProject}%, chuyên cần ${t.k.wAttendance}%, đánh giá quản lý ${t.k.wManager}%</div>
  <table><thead><tr><th>STT</th><th>Họ tên</th><th>Phòng ban</th><th>Công việc</th><th>Kết quả dự án</th><th>Chuyên cần</th><th>Đánh giá quản lý</th><th>Tổng điểm</th><th>Xếp loại</th><th>Thưởng (đồng)</th></tr></thead>
  <tbody>${t.rows.map((r,i)=>`<tr><td class="c">${i+1}</td><td>${esc(r.name)}</td><td>${esc(vpDeptName(r.departmentId))}</td><td class="r">${f(r.work)}</td><td class="r">${f(r.project)}</td><td class="r">${f(r.attendance)}</td><td class="r">${r.rating?f(r.rating*20):''}</td><td class="r"><b>${f(r.total)}</b></td><td class="c"><b>${esc(r.grade||'')}</b></td><td class="r">${(r.bonus||0)+(r.rankBonus||0)?fmtVND((r.bonus||0)+(r.rankBonus||0)):''}${r.rankLabel?'<br><i>'+esc(r.rankLabel)+'</i>':''}</td></tr>`).join('')}</tbody></table>
  <div class="sign"><div><b>NGƯỜI LẬP</b><i>(Ký, ghi rõ họ tên)</i><div class="sp"></div>${esc(S.user&&S.user.name||'')}</div><div><b>KẾ TOÁN</b><i>(Ký, ghi rõ họ tên)</i><div class="sp"></div></div>
  <div><i>${printDate()}</i><b>${esc(BR.signReport)}</b><i>(Ký, ghi rõ họ tên, đóng dấu)</i><div class="sp"></div></div></div></body></html>`;
  const fr=document.createElement('iframe'); fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0'; fr.title='In KPI';
  document.body.appendChild(fr); const doc=fr.contentDocument; doc.open(); doc.write(html); doc.close();
  setTimeout(()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }finally{ setTimeout(()=>fr.remove(), 60000); } }, 250); };

/* ===== Bản 1.10: tra cứu dữ liệu e-work cũ (lưu trữ nguyên vẹn khi chuyển, chỉ quản trị) ===== */
const EW_NAMES={LichHops:'Lịch họp',KetQuaLichHops:'Kết quả cuộc họp',PhongHops:'Phòng họp',ThongBaos:'Thông báo',QuanLyCongViecs:'Công việc',TaskAssignments:'Giao việc',TaskCapNhats:'Cập nhật công việc',TaskGiaHans:'Gia hạn công việc',TaskMoLais:'Mở lại công việc',TaskTangCas:'Tăng ca công việc',
  BangKPIs:'Bảng KPI',DetailKPIs:'Chi tiết KPI',CauHinhThuongKPIs:'Thưởng KPI',BangLuongs:'Bảng lương',BangLuongThuongs:'Lương thưởng',BangLuongCoBans:'Hồ sơ, lương cơ bản',BCTongHopLuongs:'Tổng hợp lương',BCChamCongThangs:'Chấm công tháng',ChuyenLuongs:'Chuyển lương',
  PhuCapLuongs:'Phụ cấp lương',LuongCBKhoanPCs:'Lương cơ bản, khoán phụ cấp',BieuThueTNCNs:'Biểu thuế TNCN',BieuGiamTrus:'Biểu giảm trừ',KhenThuongKyLuats:'Khen thưởng, kỷ luật',ThuongKhacs:'Thưởng khác',ThuongNghiPhepChuaDungs:'Thưởng phép chưa dùng',
  QuanLyDeXuats:'Đề xuất',ChamCongs:'Chấm công',NgayNghis:'Ngày nghỉ',PhongBans:'Phòng ban',UserInfos:'Thông tin người dùng',QuanLyDuAns:'Dự án',DanhMucDuAns:'Danh mục dự án',QuanLyTaiLieus:'Tài liệu',VanBanDens:'Văn bản đến',VanBanDis:'Văn bản đi',
  VanBanChinhSachs:'Văn bản chính sách',SoQuyBoPhans:'Sổ quỹ bộ phận',Contacts:'Liên hệ',Mesengers:'Tin nhắn',QuanLyBinhLuans:'Bình luận',LuanChuyenHistorys:'Lịch sử luân chuyển',TestCaseIssues:'Lỗi kiểm thử',HoSoPhapLys:'Hồ sơ pháp lý',DichVuTuVans:'Dịch vụ tư vấn',BaoHanhBaoTris:'Bảo hành, bảo trì'};
const ewName=t=>EW_NAMES[t]||t;
const EW_HIDE=/^(Ten)?(ThongTin|DonViHanhChinh|CoQuanHanhChinh|PhongBanXuLy|PhongBanNhap|PhongBanGiaoViec|DonViXuLy|DonViNhap|DonViGiaoViec)|^SearchNormalized$|^(Modified|Created)By$|RefTableName/;
VP.ew=VP.ew||{};
function ewCols(rows, all){
  const ks=[]; rows.forEach(r=>Object.keys(r).forEach(k=>{ if(!ks.includes(k)) ks.push(k); }));
  return ks.filter(k=>all || (!EW_HIDE.test(k) && !(ks.includes('Ten'+k) && k!=='Id') && rows.some(r=>r[k]!==null && r[k]!=='' && r[k]!==undefined)));
}
const ewVal=v=>{ if(v===null||v===undefined) return ''; const s=String(v); if(/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0,10).split('-').reverse().join('/')+(s.slice(11,16)!=='00:00'?' '+s.slice(11,16):''); return s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); };
VIEWS['ework-cu']=()=>{
  const tabs=vpFetch(VP.ew,'_tables','/api/vp/ework-archive');
  const t=S.f.ewt||'', q=S.f.ewq||'', per=S.f.ewp||'';
  let body='';
  if(tabs===null) body='<div class="empty">Đang tải…</div>';
  else if(tabs.error) body=emptyBox(esc(tabs.error));
  else if(!tabs.length) body=emptyBox('Chưa có dữ liệu e-work lưu trữ. Chạy lại xuat-ework.ps1 bản mới rồi chuyển dữ liệu ở Bảng công → Thiết lập điểm danh.');
  else if(!t){
    const l=[...tabs].sort((a,b)=>(EW_NAMES[a.table]?0:1)-(EW_NAMES[b.table]?0:1)||ewName(a.table).localeCompare(ewName(b.table),'vi'));
    body=`<p class="small muted" style="margin:0 0 8px">${tabs.length} bảng, ${fmtN(tabs.reduce((s,x)=>s+x.rows,0))} dòng chuyển nguyên vẹn từ e-work để tra cứu (chỉ đọc).</p>`
      +table([{h:'Dữ liệu',f:x=>`<a href="javascript:void 0" data-act="ew-open" data-id="${esc(x.table)}"><b style="font-weight:600">${esc(ewName(x.table))}</b></a><div class="small muted">${esc(x.table)}</div>`},{h:'Số dòng',f:x=>fmtN(x.rows),r:true}], l, {nopage:true});
  } else {
    const key=t+'|'+q+'|'+per; const d=vpFetch(VP.ew, key, `/api/vp/ework-archive/${encodeURIComponent(t)}?take=500&q=${encodeURIComponent(q)}&period=${encodeURIComponent(per)}`);
    const head=`<div class="toolbar"><button class="btn sm" data-act="ew-open" data-id="">← Danh sách bảng</button><input type="search" placeholder="Tìm trong mọi cột" value="${esc(q)}" id="ew_q" style="min-width:200px">
      ${d&&d.periods&&d.periods.length?`<select id="ew_p"><option value="">Mọi kỳ</option>${d.periods.map(p=>`<option ${p===per?'selected':''}>${p}</option>`).join('')}</select>`:''}
      <button class="btn sm" data-act="ew-xlsx">Excel</button></div>`;
    if(d===null) body=head+'<div class="empty">Đang tải…</div>';
    else if(d.error) body=head+emptyBox(esc(d.error));
    else { const cols=ewCols(d.rows).slice(0,10); VP.ewRows=d.rows;
      body=head+`<p class="small muted">${fmtN(d.total)} dòng${d.total>d.rows.length?`, hiện ${d.rows.length} dòng đầu (lọc thêm hoặc tải Excel để xem đủ)`:''}. Bấm một dòng để xem đủ các cột.</p>`
        +table(cols.map(k=>({h:k, f:(r)=>esc(ewVal(r[k]).slice(0,120))})), d.rows.map((r,i)=>({...r,_i:i,id:i})), {rowAct:'ew-row'}); }
  }
  return `<div class="head"><div class="grow"><h1>Dữ liệu e-work cũ${t?': '+esc(ewName(t)):''}</h1><div class="sub">Tra cứu lịch sử từ e-work: công việc, KPI, bảng lương, lịch họp, thông báo…</div></div></div>`+body;
};
ACT['ew-open']=(id)=>{ S.f.ewt=id||''; S.f.ewq=''; S.f.ewp=''; render(); };
ACT['ew-q']=()=>{ S.f.ewq=$('#ew_q').value.trim(); render(); };
ACT['ew-p']=()=>{ S.f.ewp=$('#ew_p').value; render(); };
ACT['ew-row']=(i)=>{ const r=(VP.ewRows||[])[+i]; if(!r) return; delete r._i;
  openModal(`<div class="mform wide"><header><h3>${esc(ewName(S.f.ewt))}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:16px">
    ${table([{h:'Cột',k:'k'},{h:'Giá trị',f:x=>`<div style="white-space:pre-wrap">${esc(ewVal(x.v))}</div>`}], Object.keys(r).filter(k=>k!=='_i'&&k!=='id'&&r[k]!==null&&r[k]!=='').map(k=>({k,v:r[k]})), {nopage:true})}</div></div>`); };
ACT['ew-xlsx']=async()=>{ const t=S.f.ewt; try{
  const d=await api('GET',`/api/vp/ework-archive/${encodeURIComponent(t)}?take=50000&q=${encodeURIComponent(S.f.ewq||'')}&period=${encodeURIComponent(S.f.ewp||'')}`);
  const cols=ewCols(d.rows, true); const ws=XLSX.utils.aoa_to_sheet([cols,...d.rows.map(r=>cols.map(k=>ewVal(r[k])))]);
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, t.slice(0,31)); XLSX.writeFile(wb, 'ework_'+t+(S.f.ewp?'_'+S.f.ewp:'')+'.xlsx');
  }catch(e){ toast(errText(e),'err'); } };
document.addEventListener('change', e=>{ if(e.target.id==='ew_q') ACT['ew-q'](); else if(e.target.id==='ew_p') ACT['ew-p'](); });

/* ===== Bản 1.10: lương tháng (tự tính từ hồ sơ lương, bảng công, tăng ca, KPI đã chốt, ứng lương; bảo hiểm, thuế TNCN theo thiết lập) ===== */
VP.pay=VP.pay||{};
const payMonth = () => S.f.plm || (()=>{ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-(new Date().getDate()<=10?1:0)); return d.getFullYear()+'-'+pad(d.getMonth()+1); })();
const vnd = v => v? fmtVND(v) : '0';
const payRow = id => { const d=VP.pay[payMonth()]; return d&&d.rows&&d.rows.find(r=>r.employeeId===id); };
VIEWS['luong']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>Lương</h1></div></div>`+vpWait(); }
  const m=payMonth(); const d=vpFetch(VP.pay, m, '/api/vp/luong?month='+m); const dep=S.f.pld||'';
  /* Bản 1.10.17: người lao động mở trang mà tháng mặc định chưa có phiếu thì lùi về tháng trước (một lần) */
  if(d && !d.error && !d.all && !d.rows.length && !S.f.plm && !S._payBack){ S._payBack=1; const x=new Date(m+'-01T00:00:00'); x.setMonth(x.getMonth()-1); S.f.plm=x.getFullYear()+'-'+pad(x.getMonth()+1); setTimeout(render,0); }
  let body;
  if(d===null) body='<div class="empty">Đang tải…</div>';
  else if(d.error) body=emptyBox(esc(d.error));
  else if(!d.all) body = d.rows.length&&d.provisional? `<div class="alert warn" style="max-width:640px;margin-bottom:10px">Phiếu tạm tính theo nhận nhiệm vụ, đề xuất, tăng ca đã duyệt tới hôm nay; số còn thay đổi tới khi bảng lương tự chốt đầu tháng sau. Thưởng KPI cộng khi chốt. Thấy thiếu ngày công thì lập đề xuất ngay để kịp sửa.</div>`+paySlipHTML(d.rows[0], m)
    : d.rows.length? paySlipHTML(d.rows[0], m) + payConfirmHTML(d.rows[0], m) + `<div class="toolbar" style="margin-top:10px"><button class="btn" data-act="pay-pdf" data-id="${esc(d.rows[0].employeeId)}">In, lưu PDF phiếu lương</button></div>`
      : emptyBox(`Chưa có phiếu lương tháng ${m.slice(5)}/${m.slice(0,4)}.`);
  else {
    // Bản 1.10.21: trưởng phòng xem bảng lương của phòng; phiếu của chính mình vẫn tự xác nhận như mọi người
    const myE=d.dept && VP.st.me && d.rows.find(r=>r.employeeId===VP.st.me.id);
    body=''; if(d.dept) body = `<div class="alert info" style="margin-bottom:10px"><div>Bảng lương của phòng bạn phụ trách (chỉ xem).</div></div>` + (myE&&myE.locked? payConfirmHTML(myE, m) : '');
    // Bản 1.10.23 (anh Trí 26/11): bảng lương chỉ liệt kê người có hồ sơ lương; tài khoản quản trị, người chưa có hồ sơ lương chỉ ghi tên ở dòng nhắc
    const all=d.rows.filter(r=>!dep||r.departmentId===dep), npl=all.filter(r=>!r.hasProfile);
    const rows=all.filter(r=>r.hasProfile).map(r=>({...r,id:r.employeeId}));
    const noProf=npl.length, sum=k=>rows.reduce((s,r)=>s+(r[k]||0),0);
    body+=`<div class="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:10px">
      <div class="card" style="padding:10px 14px;margin:0"><div class="small muted">Tổng thu nhập</div><b>${vnd(sum('gross'))}</b></div>
      <div class="card" style="padding:10px 14px;margin:0"><div class="small muted">Thực lĩnh</div><b>${vnd(sum('net'))}</b></div>
      <div class="card" style="padding:10px 14px;margin:0"><div class="small muted">Bảo hiểm (NLĐ + DN)</div><b>${vnd(sum('insurance')+sum('employerIns'))}</b></div>
      <div class="card" style="padding:10px 14px;margin:0"><div class="small muted">Thuế TNCN</div><b>${vnd(sum('pit'))}</b></div>
      <div class="card" style="padding:10px 14px;margin:0"><div class="small muted">Chi phí công ty</div><b>${vnd(sum('cost'))}</b></div></div>`
    + (noProf?`<div class="alert info" style="margin-bottom:10px">Không hiện trong bảng (chưa có hồ sơ lương, không đưa vào khi chốt): ${npl.map(r=>esc(r.name)).join(', ')}.${d.canEdit?' Người cần trả lương thì bấm <b>Hồ sơ lương</b> để nhập.':''}</div>`:'')
    + table([
      {h:'Họ tên', f:r=>`<b style="font-weight:600">${esc(r.name)}</b><div class="small muted">${esc(vpDeptName(r.departmentId))}</div>${r.noAttendance?pill('Không chấm công','info'):''}`},
      {h:'Công', r:1, f:r=>`${fmtN(r.paid,1)}/${fmtN(r.standard,1)}${r.absent?`<div class="small muted">vắng ${fmtN(r.absent,1)}</div>`:''}`},
      {h:'Lương theo công', r:1, f:r=>vnd(r.timePay)}, {h:'Phụ cấp', r:1, f:r=>vnd(r.allowances-(r.allowanceCut||0))},
      {h:'Tăng ca', r:1, f:r=>r.otPay?`${vnd(r.otPay)}<div class="small muted">${fmtN(r.otHours,1)} giờ</div>`:'0'},
      {h:'Thưởng', r:1, f:r=>vnd(r.kpiBonus+r.bonus)+(r.kpiGrade?`<div class="small muted">KPI ${esc(r.kpiGrade)}</div>`:'')},
      {h:'Bảo hiểm', r:1, f:r=>vnd(r.insurance)}, {h:'Thuế TNCN', r:1, f:r=>vnd(r.pit)},
      {h:'Ứng, khấu trừ', r:1, f:r=>vnd(r.advance+r.deduction)},
      {h:'Thực lĩnh', r:1, f:r=>`<b>${vnd(r.net)}</b>`},
      {h:'Xác nhận', f:r=>payStatePill(r)}],
      rows, {empty:'Chưa có nhân sự.', nopage:true, rowAct:'pay-row'});
  }
  const ed=d&&d.canEdit, locked=d&&d.all&&d.rows.some(r=>r.locked), appr=d&&d.all&&d.rows.some(r=>r.locked&&r.approvedAt), ap=d&&d.canApprove;
  const ar=appr&&d.rows.find(r=>r.approvedAt);
  return `<div class="head"><div class="grow"><h1>${d&&!d.all?(d.provisional?'Phiếu lương tạm tính':'Phiếu lương'):(d&&d.all&&!locked&&!appr?'Lương tạm tính':'Bảng lương')} tháng ${m.slice(5)}/${m.slice(0,4)}</h1><p>${d&&d.all?(appr?pill('Đã duyệt chi','ok')+` <span class="small muted">${esc(ar.approvedBy||'')}, ${fmtDate(String(ar.approvedAt).slice(0,10))}</span>`:locked?pill('Đã chốt, chờ duyệt chi','info'):pill('Tạm tính đến hôm nay, chưa chốt','warn')+` <span class="small muted">${(d.settings||{}).autoLock!==false?`Máy tự chốt 0 giờ ngày ${esc(String((d.settings||{}).autoLockDay||1))}/${m.slice(5)==='12'?'01':String(+m.slice(5)+1).padStart(2,'0')}. `:''}Nhân viên xem được phiếu tạm tính của mình, xác nhận sau khi chốt.</span>`):d&&d.provisional?pill('Tạm tính đến hôm nay, chưa chốt','warn'):'Của bạn'}</p></div>
    <div class="toolbar">${ed?`<button class="btn" data-act="pay-profiles">Hồ sơ lương</button><button class="btn" data-act="pay-set">Thiết lập</button>${appr?'':locked?`<button class="btn" data-act="pay-lock" data-id="0">Mở chốt</button>`:payMonthEnded(m)?`<button class="btn primary" data-act="pay-lock" data-id="1">Chốt bảng lương</button>`:`<button class="btn ghost" data-act="pay-lock" data-id="1e" title="Tháng chưa kết thúc; máy tự chốt đầu tháng sau">Chốt sớm…</button>`}`:''}
      ${ap&&locked?`<button class="btn ${appr?'':'primary'}" data-act="pay-approve" data-id="${appr?'0':'1'}">${appr?'Hủy duyệt chi':'Duyệt chi lương'}</button>`:''}</div></div>
  <div class="toolbar" style="margin:4px 0 10px">${monthSel('plm', m)}${d&&d.all?`<select data-f="pld" aria-label="Phòng ban">${opts(VP.depts.map(x=>[x.id,x.name]), dep, 'Tất cả phòng ban')}</select>
    <span style="flex:1"></span>${exportMenu([['pay-pdf','','Phiếu lương từng người (PDF)'],['pay-xlsx','','Bảng lương kế toán (Excel)'],['pay-acc-pdf','','Bảng lương kế toán (PDF)']].concat(d.bank?[['pay-bank','','Danh sách chuyển khoản ngân hàng'+(appr?'':' (sau khi duyệt chi)'),!appr]]:[]))}`:''}</div>${body}`;
};
/* Bản 1.10.4: người lao động tự xác nhận lương trong hạn (mặc định ngày 1 đến 3 tháng sau), có thể gửi kiến nghị */
function payStatePill(r){ if(!r.locked||!r.confirmState) return '<span class="small muted">—</span>';
  const k={ 'Đã xác nhận':'ok', 'Có kiến nghị':'bad', 'Đã trả lời kiến nghị':'info', 'Chưa xác nhận':'warn', 'Chưa đến hạn':'', 'Quá hạn, coi như đồng ý':'', 'Không cần xác nhận (không chấm công)':'ok' }[r.confirmState];
  return pill(r.confirmState, k||'')+(r.confirmedAt?`<div class="small muted">${fmtDate(String(r.confirmedAt).slice(0,10))}</div>`:''); }
function payFeedbackHTML(r){ if(!r.feedback) return '';
  return `<div class="card" style="max-width:640px;margin-top:10px"><h3 style="margin-top:0">Kiến nghị</h3><div style="white-space:pre-wrap">${esc(r.feedback)}</div>
    ${r.reply?`<h3>Trả lời${r.repliedBy?' của '+esc(r.repliedBy):''}</h3><div style="white-space:pre-wrap">${esc(r.reply)}</div>`:'<p class="small muted">Đang chờ người quản lý lương trả lời.</p>'}</div>`; }
function payConfirmHTML(r, m){ if(!r.locked) return '';
  let h=payFeedbackHTML(r);
  if(r.confirmedAt) return h+`<div class="alert ok" style="max-width:640px;margin-top:10px">Bạn đã xác nhận lương tháng này ngày ${fmtDate(String(r.confirmedAt).slice(0,10))}.</div>`;
  if(r.confirmOpen) return h+`<div class="card" style="max-width:640px;margin-top:10px"><h3 style="margin-top:0">Xác nhận lương</h3><p class="small muted" style="margin-top:0">Hạn xác nhận: từ ${fmtDate(r.confirmFrom)} đến hết ${fmtDate(r.confirmTo)}. Quá hạn không xác nhận thì coi như đồng ý.</p>
    <div class="fld full"><label for="pc_fb">Kiến nghị (nếu có)</label><textarea id="pc_fb" rows="3" style="width:100%" placeholder="Ví dụ: ngày 12 tôi đi công tác nhưng đang tính vắng"></textarea></div>
    <div class="toolbar"><button class="btn primary" data-act="pay-confirm" data-id="1">Đồng ý, xác nhận lương</button><button class="btn" data-act="pay-confirm" data-id="0">Gửi kiến nghị</button></div></div>`;
  return h+`<p class="small muted" style="margin-top:10px">${esc(r.confirmState||'')}${r.confirmFrom?` · hạn xác nhận ${fmtDate(r.confirmFrom)} đến ${fmtDate(r.confirmTo)}`:''}</p>`; }
function payItemsHTML(r, ed){ const l=r.items||[]; if(!l.length) return '';
  return `<div class="card" style="max-width:640px;margin-top:10px"><h3 style="margin-top:0">Đề xuất tạm ứng, xăng xe trong tháng</h3><p class="small muted" style="margin-top:0">Ban giám đốc, kế toán chọn đưa hay không đưa vào lương. Xăng xe cộng vào thu nhập (không tính thuế), tạm ứng trừ vào thực lĩnh.</p>
    ${table([{h:'Đề xuất',f:x=>`<b style="font-weight:600">${esc(x.type)}</b> <span class="small muted">${esc(x.code)}</span>${x.title?`<div class="small muted">${esc(x.title)}</div>`:''}`},{h:'Số tiền',r:1,f:x=>vnd(x.amount)},
      {h:'Vào lương',f:x=>ed?`<select data-act-change="pay-item" data-id="${esc(x.id)}" aria-label="Đưa vào lương">${opts([['','Theo thiết lập ('+(x.included&&x.choice==null?'có':x.choice==null?'không':'')+')'],['1','Đưa vào lương'],['0','Không đưa']], x.choice==null?'':x.choice?'1':'0')}</select>`:(x.included?pill('Có','ok'):pill('Không'))}], l, {nopage:true})}</div>`; }
document.addEventListener('change', async ev=>{ const el=ev.target.closest && ev.target.closest('[data-act-change="pay-item"]'); if(!el) return;
  try{ await api('PUT',`/api/vp/requests/${encodeURIComponent(el.dataset.id)}/payroll`,{include: el.value===''?null:el.value==='1'}); const m=payMonth(); delete VP.pay[m]; closeModal(); toast('Đã cập nhật'); render(); }catch(e){ toast(errText(e),'err'); } });
ACT['pay-goto']=m=>{ S.f.plm=m; if(location.hash!=='#luong') location.hash='#luong'; else render(); };
ACT['pay-confirm']=async a=>{ const fb=($('#pc_fb')||{}).value||''; if(a==='0'&&!fb.trim()){ toast('Ghi nội dung kiến nghị.','err'); return; }
  if(a==='1'&&!await confirmBox(fb.trim()?'Xác nhận đồng ý bảng lương và gửi kèm ghi chú?':'Xác nhận bạn đồng ý với phiếu lương tháng này?','Xác nhận')) return;
  const m=payMonth(); await api('POST',`/api/vp/luong/${m}/xac-nhan`,{agree:a==='1', feedback:fb.trim()||null}); delete VP.pay[m]; VP.st=null; vpLoad(true); render(); toast(a==='1'?'Đã xác nhận lương':'Đã gửi kiến nghị'); };
ACT['pay-reply']=id=>{ const r=payRow(id); if(!r) return; closeModal();
  openForm({title:'Trả lời kiến nghị: '+r.name, narrow:true, value:{reply:r.reply||''}, fields:[{key:'_k',type:'html',html:`<div class="fld full"><div class="small muted">Kiến nghị</div><div style="white-space:pre-wrap">${esc(r.feedback||'')}</div></div>`},{key:'reply',label:'Nội dung trả lời',type:'textarea',rows:4,req:true,keepLines:true}],
    onSave:async v=>{ await api('POST',`/api/vp/luong/${payMonth()}/${encodeURIComponent(id)}/tra-loi`,{reply:v.reply}); delete VP.pay[payMonth()]; VP.st=null; vpLoad(true); return {id}; }}); };
/* Bản 1.10.4: phép năm, tiền phép chưa nghỉ (tháng 12), công tác phí, xăng xe */
function payExtraLines(r, L){ let h='';
  if(r.unusedLeavePay) h+=L('<b>6. Tiền phép năm chưa nghỉ</b>', vnd(r.unusedLeavePay), fmtN(r.unusedLeave,1)+' ngày');
  if(r.tripPay) h+=L('<b>7. Công tác phí</b>', vnd(r.tripPay), fmtN(r.tripDays,1)+' ngày, không tính thuế');
  if(r.fuelPay) h+=L('<b>8. Xăng xe</b>', vnd(r.fuelPay), 'không tính thuế');
  if(r.leaveTotal!=null && (r.leaveDays||r.leaveOver)) h+=L('Phép năm', '', `tháng này nghỉ ${fmtN(r.leaveDays||0,1)} ngày, cả năm ${fmtN(r.leaveUsedYear||0,1)}/${fmtN(r.leaveTotal,1)}${r.leaveOver?`, <b>vượt ${fmtN(r.leaveOver,1)} ngày trừ lương</b>`:''}`);
  if(r.privateLeave) h+=L('Nghỉ việc riêng có lương', '', fmtN(r.privateLeave,1)+' ngày, hưởng nguyên lương');
  if(r.unpaidDays) h+=L('Nghỉ không lương, nghỉ ốm/thai sản (BHXH chi trả)', '', fmtN(r.unpaidDays,1)+' ngày, không tính lương công ty');
  return h; }
function paySlipHTML(r, m){
  const L=(a,b,c='')=>`<tr><td>${a}</td><td class="r">${b}</td><td class="small muted">${c}</td></tr>`;
  return `<div class="card" style="max-width:640px"><h2 style="margin-top:0">${esc(r.name)}</h2><p class="small muted" style="margin-top:-6px">${esc(vpDeptName(r.departmentId))}${r.position?', '+esc(r.position):''} · Tháng ${m.slice(5)}/${m.slice(0,4)}</p>
  <table class="tbl" style="width:100%"><tbody>
  ${L('Lương chính', vnd(r.baseSalary))}${L('Ngày công hưởng lương', fmtN(r.paid,1)+' / '+fmtN(r.standard,1), r.noAttendance?'không chấm công: hưởng nguyên lương chính':r.absent?`vắng không lý do ${fmtN(r.absent,1)}`:'')}
  ${L('<b>1. Lương theo ngày công</b>', vnd(r.timePay))}
  ${(r.allowanceLines||[]).map(a=>L('&nbsp;&nbsp;Phụ cấp: '+esc(a.label), vnd(a.amount), esc(a.note||''))).join('')}
  ${L('<b>2. Phụ cấp</b>', vnd(r.allowances-(r.allowanceCut||0)))}${L('<b>3. Tăng ca</b>', vnd(r.otPay), r.otHours?fmtN(r.otHours,1)+' giờ':'')}
  ${L('<b>4. Thưởng KPI</b>', vnd(r.kpiBonus), r.kpiGrade?'xếp loại '+esc(r.kpiGrade):'')}${L('<b>5. Thưởng, bổ sung khác</b>', vnd(r.bonus), esc(r.note||''))}
  ${payExtraLines(r, L)}
  ${L('<b>TỔNG THU NHẬP</b>', '<b>'+vnd(r.gross)+'</b>')}
  ${L('BHXH, BHYT, BHTN người lao động', vnd(r.insurance), r.insBase?`trên mức ${vnd(r.insBase)}`:'')}
  ${L('Thu nhập tính thuế', vnd(r.assessable), r.dependents?`${r.dependents} người phụ thuộc`:'')}${L('Thuế TNCN', vnd(r.pit))}
  ${L('Ứng lương, tạm ứng', vnd(r.advance), r.tempAdvance?'gồm tạm ứng '+vnd(r.tempAdvance):'')}${L('Khấu trừ khác', vnd(r.deduction))}
  ${L('<b>THỰC LĨNH</b>', '<b style="font-size:1.15em">'+vnd(r.net)+'</b>')}</tbody></table></div>`;
}
ACT['pay-row']=id=>{ const r=payRow(id), d=VP.pay[payMonth()]; if(!r) return;
  const edit=d.canEdit && !r.locked;
  openModal(`<div class="mform wide"><header><h3>Phiếu lương</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:16px;max-height:calc(100vh - 120px);overflow:auto">${paySlipHTML(r, payMonth())}${payItemsHTML(r, d.canEdit && !r.locked)}${payFeedbackHTML(r)}${r.locked?`<p class="small" style="margin-top:8px">Xác nhận: ${payStatePill(r)}</p>`:''}
    <div class="toolbar" style="margin-top:10px">${d.canEdit&&r.feedback?`<button class="btn primary" data-act="pay-reply" data-id="${esc(id)}">${r.reply?'Sửa trả lời':'Trả lời kiến nghị'}</button>`:''}${edit?`<button class="btn" data-act="pay-adj" data-id="${esc(id)}">Thưởng, khấu trừ khác</button>`:''}<button class="btn ghost" data-act="pay-pdf" data-id="${esc(id)}">In, lưu PDF</button></div></div></div>`); };
ACT['pay-adj']=id=>{ const r=payRow(id); if(!r) return; closeModal();
  openForm({title:'Điều chỉnh lương: '+r.name, narrow:true, value:{bonus:r.bonus||'', deduction:r.deduction||'', note:r.note||''},
    fields:[{key:'bonus',label:'Thưởng, bổ sung khác (đồng, tính thuế)',type:'money'},{key:'deduction',label:'Khấu trừ khác (đồng)',type:'money'},{key:'note',label:'Ghi chú (in trên phiếu)',type:'text'}],
    onSave:async v=>{ await api('PUT',`/api/vp/luong/${payMonth()}/${encodeURIComponent(id)}`,{bonus:N(v.bonus), deduction:N(v.deduction), note:v.note||''}); delete VP.pay[payMonth()]; return {id}; }}); };
// Tháng đã kết thúc (theo giờ Việt Nam) thì mới nên chốt; tháng đang chạy chỉ chốt sớm khi xác nhận
const payMonthEnded = m => { const t=new Date(Date.now()+7*3600e3).toISOString().slice(0,7); return m < t; };
ACT['pay-lock']=async l=>{ const m=payMonth(); const d=VP.pay[m]; const miss=d&&d.rows? d.rows.filter(r=>!r.hasProfile).length : 0;
  if(l==='1e'){ if(!await confirmBox(`Tháng ${m.slice(5)}/${m.slice(0,4)} <b>chưa kết thúc</b>. Máy sẽ tự chốt vào đầu tháng sau, khi đã đủ công, đề xuất và thưởng KPI. Chốt sớm thì số liệu các ngày còn lại không được tính, phải mở chốt để tính lại. Vẫn chốt ngay?`,'Vẫn chốt sớm')) return; l='1';
    await api('POST',`/api/vp/luong/${m}/chot`,{lock:true}); delete VP.pay[m]; render(); toast('Đã chốt bảng lương'); return; }
  if(l==='1' && !await confirmBox(`Chốt bảng lương tháng ${m.slice(5)}/${m.slice(0,4)}? Số liệu được lưu cố định, người lao động xem được phiếu lương của mình.${miss?` <b>${miss} người chưa có hồ sơ lương</b> sẽ không có phiếu.`:''}`,'Chốt')) return;
  await api('POST',`/api/vp/luong/${m}/chot`,{lock:l==='1'}); delete VP.pay[m]; render(); toast(l==='1'?'Đã chốt bảng lương':'Đã mở chốt'); };
const payAllowText = l => (l||[]).map(a=>[a.name, a.amount, a.exempt||0].join('; ')).join('\n');
const payAllowParse = t => String(t||'').split('\n').map(x=>x.split(';').map(y=>y.trim())).filter(p=>p[0]).map(p=>({name:p[0], amount:N(String(p[1]||'0').replace(/\./g,'')), exempt:N(String(p[2]||'0').replace(/\./g,''))}));
ACT['pay-profiles']=async()=>{ const l=await api('GET','/api/vp/luong-ho-so'); const by=Object.fromEntries(l.map(p=>[p.employeeId,p]));
  const emps=VP.emps.filter(e=>e.status!=='Nghỉ việc');
  openModal(`<div class="mform wide"><header><h3>Hồ sơ lương</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:16px">
    <p class="small muted" style="margin-top:0">Bấm một người để nhập lương chính, lương đóng bảo hiểm, phụ cấp cố định, số người phụ thuộc.</p>
    ${table([{h:'Họ tên',f:e=>`<b style="font-weight:600">${esc(e.name)}</b><div class="small muted">${esc(vpDeptName(e.departmentId))}</div>`},
      {h:'Lương chính',r:1,f:e=>by[e.id]?vnd(by[e.id].baseSalary):'<span class="muted">chưa có</span>'},{h:'Đóng BH',r:1,f:e=>by[e.id]?(by[e.id].noInsurance?'Không':vnd(by[e.id].insuranceSalary??by[e.id].baseSalary)):''},
      {h:'Phụ cấp',r:1,f:e=>by[e.id]?vnd(by[e.id].allowances.reduce((s,a)=>s+a.amount,0)):''},{h:'Người phụ thuộc',r:1,f:e=>e.dependents||0},{h:'Công tác phí/ngày',r:1,f:e=>by[e.id]&&by[e.id].tripRate!=null?(by[e.id].tripRate?vnd(by[e.id].tripRate):'Không hưởng'):'<span class="muted">mức chung</span>'}], emps, {nopage:true, rowAct:'pay-prof'})}</div></div>`);
  VP._prof=by; };
ACT['pay-prof']=id=>{ const e=VP.emps.find(x=>x.id===id), p=(VP._prof||{})[id]||{}; if(!e) return; closeModal();
  openForm({title:'Hồ sơ lương: '+e.name, narrow:true, value:{base:p.baseSalary||'', ins:p.insuranceSalary??'', allow:payAllowText(p.allowances), dep:e.dependents||0, noIns:p.noInsurance?'1':'0', flat:p.flatTax?'1':'0', from:p.fromMonth||'', trip:p.tripRate??''},
    fields:[{key:'base',label:'Lương chính (đồng/tháng)',type:'money',req:true},{key:'ins',label:'Lương đóng bảo hiểm (trống = bằng lương chính)',type:'money'},
      {key:'allow',label:'Phụ cấp cố định: mỗi dòng "tên; số tiền; phần không tính thuế"',type:'textarea',rows:4,keepLines:true,ph:'Ăn trưa; 730000; 730000'},
      {key:'dep',label:'Số người phụ thuộc (giảm trừ gia cảnh)',type:'number'},{key:'noIns',label:'Đóng bảo hiểm',type:'select',req:true,options:[['0','Có đóng bảo hiểm'],['1','Không đóng (thử việc, cộng tác viên)']]},
      {key:'flat',label:'Cách tính thuế TNCN',type:'select',req:true,options:[['0','Biểu lũy tiến, có giảm trừ gia cảnh'],['1','Khấu trừ 10% (hợp đồng dưới 3 tháng, cộng tác viên)']]},{key:'trip',label:'Mức công tác phí riêng (đồng/ngày; trống = mức chung, 0 = không hưởng)',type:'money'},{key:'from',label:'Áp dụng từ tháng (ghi chú)',type:'text',ph:'2026-12'}],
    onSave:async v=>{ await api('PUT',`/api/vp/luong-ho-so/${encodeURIComponent(id)}`,{baseSalary:N(v.base), insuranceSalary:v.ins===''||v.ins==null?null:N(v.ins), allowances:payAllowParse(v.allow), noInsurance:v.noIns==='1', flatTax:v.flat==='1', fromMonth:v.from||null, dependents:N(v.dep), tripRate:v.trip===''||v.trip==null?null:N(v.trip)});
      e.dependents=N(v.dep); VP.pay={}; return {id}; }}); };
ACT['pay-set']=async()=>{ const s=await api('GET','/api/vp/luong-settings');
  openForm({title:'Thiết lập lương', value:{...s, ...Object.fromEntries(['tripOn','leaveOverDeduct','payUnusedLeave','fuelToPayroll','advanceToPayroll','transferAscii'].map(k=>[k,s[k]?'1':'0']), ['otByApproval', s.otByApproval===false?'0':'1'], ['autoLock', s.autoLock===false?'0':'1'], ['otWithAllowances', s.otWithAllowances===false?'0':'1'], ['eworkBonus', s.eworkBonus===false?'0':'1']), taxText:s.taxTables.map(t=>t.from+' | '+t.brackets.map(b=>`${b.upTo/1e6||0}:${b.rate}`).join(' ')).join('\n')},
    fields:[{key:'_h1',type:'html',html:'<div class="fld full"><b>Bảo hiểm người lao động đóng (%)</b></div>'},{key:'empBhxh',label:'BHXH',type:'number'},{key:'empBhyt',label:'BHYT',type:'number'},{key:'empBhtn',label:'BHTN',type:'number'},
      {key:'_h2',type:'html',html:'<div class="fld full"><b>Doanh nghiệp đóng (%)</b></div>'},{key:'coBhxh',label:'BHXH (gồm TNLĐ-BNN)',type:'number'},{key:'coBhyt',label:'BHYT',type:'number'},{key:'coBhtn',label:'BHTN',type:'number'},{key:'coKpcd',label:'Kinh phí công đoàn',type:'number'},
      {key:'baseWage',label:'Lương cơ sở (trần BHXH, BHYT = 20 lần)',type:'number'},{key:'regionMinWage',label:'Lương tối thiểu vùng (trần BHTN = 20 lần)',type:'number'},
      {key:'personalDeduction',label:'Giảm trừ bản thân (đồng/tháng)',type:'number'},{key:'dependentDeduction',label:'Giảm trừ mỗi người phụ thuộc',type:'number'},
      {key:'otRate',label:'Tăng ca ngày thường (%, tối thiểu 150)',type:'number'},{key:'otRestRate',label:'Tăng ca ngày nghỉ hằng tuần (%, tối thiểu 200)',type:'number'},{key:'otHolidayRate',label:'Tăng ca ngày lễ, tết (%, tối thiểu 300)',type:'number'},{key:'otMaxPerDay',label:'Tăng ca bình thường: tối đa giờ/ngày',type:'number'},{key:'otMaxUrgent',label:'Tăng ca theo yêu cầu (gấp): tối đa giờ/ngày',type:'number'},{key:'otByApproval',label:'Phiếu tăng ca tính vào lương tháng',type:'select',options:[['1','Theo ngày duyệt phiếu'],['0','Theo ngày tăng ca (như e-work)']]},{key:'otWithAllowances',label:'Đơn giá giờ tăng ca tính trên',type:'select',options:[['1','Lương chính + phụ cấp (như e-work)'],['0','Chỉ lương chính']]},{key:'eworkBonus',label:'Thưởng tháng còn làm trên e-work',type:'select',options:[['1','Lấy theo bảng lương e-work'],['0','Theo KPI trên QLDA']]},{key:'payDay',label:'Ngày trả lương (in trên phiếu)',type:'text'},
      {key:'deptView',label:'Ai xem bảng lương của phòng (chỉ xem)',type:'select',options:[['ca-hai','Trưởng phòng và người cùng phụ trách'],['cung-phu-trach','Chỉ người cùng phụ trách'],['truong-phong','Chỉ trưởng phòng'],['khong','Không ai (chỉ Giám đốc, Kế toán)']]},{key:'autoLock',label:'Tự chốt bảng lương tháng trước',type:'select',options:[['1','Có (sau khi KPI tự chốt)'],['0','Không, Kế toán bấm chốt']]},{key:'autoLockDay',label:'Tự chốt vào 0 giờ ngày (tháng sau)',type:'number'},{key:'confirmFrom',label:'Nhân viên xác nhận lương từ ngày (tháng sau)',type:'number'},{key:'confirmTo',label:'đến hết ngày',type:'number'},
      {key:'_h3',type:'html',html:'<div class="fld full"><b>Công tác phí, phép năm, đề xuất</b></div>'},
      {key:'tripOn',label:'Công tác phí',type:'select',options:[['0','Không tính'],['1','Tính theo ngày công tác được duyệt']]},{key:'tripRate',label:'Mức công tác phí (đồng/ngày)',type:'money'},
      {key:'leaveOverDeduct',label:'Nghỉ phép vượt số ngày được hưởng',type:'select',options:[['1','Trừ lương như nghỉ không lương'],['0','Không trừ']]},
      {key:'payUnusedLeave',label:'Phép năm chưa nghỉ hết',type:'select',options:[['1','Trả vào lương tháng 12'],['0','Không trả']]},
      {key:'fuelToPayroll',label:'Đề xuất xăng xe đã duyệt (mặc định)',type:'select',options:[['1','Đưa vào lương'],['0','Không đưa (thanh toán riêng)']]},
      {key:'advanceToPayroll',label:'Đề xuất tạm ứng đã duyệt (mặc định)',type:'select',options:[['0','Không trừ vào lương (hoàn ứng riêng)'],['1','Trừ vào lương']]},
      {key:'_h4',type:'html',html:'<div class="fld full"><b>Danh sách chuyển khoản ngân hàng</b><div class="small muted">Xuất sau khi Giám đốc hoặc Kế toán duyệt chi. Theo mẫu danh sách giao dịch của ngân hàng (MB Bank). Nội dung viết hoa không dấu, dùng {thang}, {nam}, {ten}.</div></div>'},
      {key:'payAccount',label:'Tài khoản trích nợ của công ty',type:'text'},{key:'payBank',label:'Ngân hàng của công ty',type:'text'},
      {key:'transferNote',label:'Nội dung chuyển khoản',type:'text'},{key:'transferAscii',label:'Tên người hưởng',type:'select',options:[['0','Giữ nguyên có dấu (như mẫu MB Bank)'],['1','Viết hoa không dấu']]},{key:'transferSheet',label:'Tên trang tính',type:'text'},
      {key:'taxText',label:'Biểu thuế TNCN theo tháng: mỗi dòng "ngày hiệu lực | đến (triệu):thuế suất …", bậc cuối ghi 0',type:'textarea',rows:3,keepLines:true}],
    onSave:async v=>{ ['tripOn','leaveOverDeduct','payUnusedLeave','fuelToPayroll','advanceToPayroll','transferAscii'].forEach(k=>s[k]=v[k]==='1'); s.deptView=v.deptView||'ca-hai'; s.payAccount=v.payAccount||''; s.payBank=v.payBank||''; s.transferNote=v.transferNote||'THANH TOAN LUONG T{thang}.{nam}'; s.transferSheet=v.transferSheet||'Chuyển lương'; s.tripRate=N(v.tripRate); const taxTables=String(v.taxText||'').split('\n').map(l=>l.split('|')).filter(p=>p.length===2).map(p=>({from:p[0].trim(), brackets:p[1].trim().split(/\s+/).map(x=>x.split(':')).map(([u,r])=>({upTo:N(u)*1e6, rate:N(r)}))}));
      const b={...s}; ['empBhxh','empBhyt','empBhtn','coBhxh','coBhyt','coBhtn','coKpcd','baseWage','regionMinWage','personalDeduction','dependentDeduction','otRate','otRestRate','otHolidayRate','otMaxPerDay','otMaxUrgent','confirmFrom','confirmTo','autoLockDay'].forEach(k=>b[k]=N(v[k])); b.autoLock=v.autoLock!=='0'; b.payDay=v.payDay||''; b.otByApproval=v.otByApproval!=='0'; b.otWithAllowances=v.otWithAllowances!=='0'; b.eworkBonus=v.eworkBonus!=='0'; b.taxTables=taxTables;
      await api('PUT','/api/vp/luong-settings', b); VP.pay={}; return {id:'luong'}; }}); };
ACT['pay-xlsx']=()=>{ const m=payMonth(), d=VP.pay[m]; if(!d||!d.rows) return; const dep=S.f.pld||'';
  const rows=d.rows.filter(r=>r.hasProfile&&(!dep||r.departmentId===dep)).sort((a,b)=>vpDeptName(a.departmentId).localeCompare(vpDeptName(b.departmentId),'vi')||a.name.localeCompare(b.name,'vi'))
    .map((r,i)=>[i+1, r.name, vpDeptName(r.departmentId), r.baseSalary, r.standard, r.paid, r.timePay, r.allowances-(r.allowanceCut||0), r.otNormal||0, r.otRest||0, r.otHoliday||0, r.otHours, r.otPay, r.kpiBonus, r.bonus, r.gross, r.bhxh, r.bhyt, r.bhtn, r.dependents, r.assessable, r.pit, r.advance, r.deduction, r.net, r.employerIns, r.cost, r.leaveOver||0, r.unusedLeavePay||0, r.tripPay||0, r.fuelPay||0, r.tempAdvance||0, r.confirmState||'', r.feedback||'']);
  exportXlsx(`Bang_luong_${m}.xlsx`, [{name:'Luong '+m, title:`BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG ${m.slice(5)}/${m.slice(0,4)}`, sub:`Ngày công chuẩn ${fmtN(d.rows[0]?.standard||0,1)}`,
    head:['STT','Họ tên','Phòng ban','Lương chính','Công chuẩn','Công hưởng lương','Lương theo công','Phụ cấp','Giờ TC ngày thường (150%)','Giờ TC ngày nghỉ (200%)','Giờ TC ngày lễ (300%)','Tổng giờ tăng ca','Tiền tăng ca','Thưởng KPI','Thưởng khác','Tổng thu nhập','BHXH','BHYT','BHTN','Người phụ thuộc','Thu nhập tính thuế','Thuế TNCN','Ứng lương','Khấu trừ khác','Thực lĩnh','BH doanh nghiệp','Chi phí công ty','Nghỉ vượt phép (ngày)','Tiền phép chưa nghỉ','Công tác phí','Xăng xe','Tạm ứng trừ lương','Xác nhận','Kiến nghị'],
    rows, money:[3,6,7,12,13,14,15,16,17,18,20,21,22,23,24,25,26,28,29,30,31]}]); };
ACT['pay-approve']=async a=>{ const m=payMonth(), d=VP.pay[m]; const rows=(d&&d.rows||[]).filter(r=>r.locked);
  const un=rows.filter(r=>!r.confirmedAt && !r.noAttendance && r.confirmState!=='Quá hạn, coi như đồng ý').length, fb=rows.filter(r=>r.feedbackStatus==='Chờ xử lý').length;
  if(a==='1' && !await confirmBox(`Duyệt chi lương tháng ${m.slice(5)}/${m.slice(0,4)}: ${rows.length} người, thực lĩnh ${vnd(rows.reduce((s,r)=>s+(r.net||0),0))} đồng?${fb?` <b>Còn ${fb} kiến nghị chưa trả lời.</b>`:''}${un?` <b>${un} người chưa xác nhận</b> (còn trong hạn).`:''} Sau khi duyệt mới xuất được danh sách chuyển khoản; muốn sửa bảng lương phải hủy duyệt.`,'Duyệt chi')) return;
  try{ const r=await api('POST',`/api/vp/luong/${m}/duyet`,{approve:a==='1'}); delete VP.pay[m]; render(); toast(a==='1'?'Đã duyệt chi lương '+r.n+' người':'Đã hủy duyệt chi'); }catch(ex){ toast(errText(ex),'err'); } };
const payAscii = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toUpperCase().replace(/\s+/g,' ').trim();
function payBankRows(){ const m=payMonth(), d=VP.pay[m]; if(!d||!d.rows||!d.bank) return null; const s=d.settings||{}; const bk=Object.fromEntries(d.bank.map(x=>[x.employeeId,x]));
  const note=r=>payAscii(String(s.transferNote||'THANH TOAN LUONG T{thang}.{nam}').replace(/\{thang\}/g,m.slice(5)).replace(/\{nam\}/g,m.slice(0,4)).replace(/\{ten\}/g,r.name));
  const rows=d.rows.filter(r=>r.locked&&r.approvedAt&&r.net>0).sort((a,b)=>a.name.localeCompare(b.name,'vi'))
    .map(r=>({r, acc:(bk[r.employeeId]||{}).account||'', bank:(bk[r.employeeId]||{}).bankName||'', name:s.transferAscii?payAscii(r.name):r.name, note:note(r)}));
  return {m, s, rows};
}
/* Mẫu danh sách giao dịch chuyển lương theo lô của ngân hàng (mẫu MB Bank Tri Thức đang nộp): tiêu đề song ngữ, 6 cột, số tài khoản dạng chữ, không dòng tổng */
ACT['pay-bank']=async()=>{ const t=payBankRows(); if(!t) return; if(!t.rows.length) return toast('Chưa có phiếu lương đã duyệt chi.','err');
  try{ await loadExcel(); }catch(e){ return toast('Không tải được thư viện Excel, thử lại sau.','err'); }
  const wb=new ExcelJS.Workbook(); wb.creator=BR.appName||'QLDA'; const ws=wb.addWorksheet(String(t.s.transferSheet||'Chuyển lương').slice(0,31));
  ws.columns=[12.8,17.8,30.3,33.8,21.4,45].map(w=>({width:w}));
  ws.mergeCells('B1:F1'); const h=ws.getCell('B1'); h.value='DANH SÁCH GIAO DỊCH\n(LIST OF TRANSACTIONS)'; h.font={name:'Times New Roman',size:12,bold:true}; h.alignment={horizontal:'center',vertical:'middle',wrapText:true}; ws.getRow(1).height=36;
  const head=['STT\n(Ord. No.)\n(1)','Số tài khoản\n(Account No.)\n(2)','Tên đơn vị thụ hưởng\n(Beneficiary Organization)\n(3)','Ngân hàng thụ hưởng/Chi nhánh\n(Beneficiary Bank)\n(4)','Số tiền\n(Amount)\n(5)','Chi tiết thanh toán\n(Payment Detail)\n(6)'];
  const thin={style:'thin'}, bd={top:thin,left:thin,bottom:thin,right:thin};
  const hr=ws.getRow(2); hr.height=45; head.forEach((x,k)=>{ const c=hr.getCell(k+1); c.value=x; c.font={name:'Times New Roman',size:11,bold:true}; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFD8DAD9'}}; c.alignment={horizontal:'center',vertical:'middle',wrapText:true}; c.border=bd; });
  t.rows.forEach((x,i)=>{ const r=ws.getRow(3+i); [i+1, String(x.acc), x.name, x.bank, Math.round(x.r.net), x.note].forEach((v,k)=>{ const c=r.getCell(k+1); c.value=v; c.font={name:'Times New Roman',size:11}; c.border=bd; if(k===1) c.numFmt='@'; if(k===4) c.numFmt='_(* #,##0_);_(* \\(#,##0\\);_(* "-"??_);_(@_)'; if(k===0) c.alignment={horizontal:'center'}; }); });
  const out=await wb.xlsx.writeBuffer(); saveFile(`ChuyenLuong-T${t.m.slice(5)}.${t.m.slice(0,4)}.xlsx`, new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  const miss=t.rows.filter(x=>!x.acc).map(x=>x.r.name);
  toast(miss.length? 'Chưa có số tài khoản: '+miss.join(', ')+' (cập nhật ở hồ sơ nhân sự)' : `Đã xuất ${t.rows.length} giao dịch, tổng ${vnd(t.rows.reduce((a,x)=>a+x.r.net,0))} đồng`, miss.length?'err':''); };
ACT['pay-acc-pdf']=()=>{ const m=payMonth(), d=VP.pay[m]; if(!d||!d.rows) return; const dep=S.f.pld||''; const s=d.settings||{};
  const rows=d.rows.filter(r=>(!dep||r.departmentId===dep)&&(r.hasProfile||r.locked)).sort((a,b)=>vpDeptName(a.departmentId).localeCompare(vpDeptName(b.departmentId),'vi')||a.name.localeCompare(b.name,'vi'));
  const sum=k=>rows.reduce((a,r)=>a+(r[k]||0),0), v=x=>x?fmtVND(x):'';
  const cols=[['Lương chính','baseSalary'],['Công','paid'],['Lương theo công','timePay'],['Phụ cấp','_pc'],['Tăng ca','otPay'],['Thưởng KPI','kpiBonus'],['Thưởng khác','bonus'],['Tổng thu nhập','gross'],['BHXH','bhxh'],['BHYT','bhyt'],['BHTN','bhtn'],['Thu nhập tính thuế','assessable'],['Thuế TNCN','pit'],['Ứng, khấu trừ','_adv'],['Thực lĩnh','net']];
  const val=(r,k)=>k==='paid'?fmtN(r.paid,1):k==='_pc'?v(r.allowances-(r.allowanceCut||0)):k==='_adv'?v((r.advance||0)+(r.deduction||0)):v(r[k]);
  const tot=k=>k==='paid'?'':k==='_pc'?v(sum('allowances')-sum('allowanceCut')):k==='_adv'?v(sum('advance')+sum('deduction')):k==='baseSalary'?'':v(sum(k));
  const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Bảng lương ${m}</title><style>
  @page{size:A4 landscape; margin:10mm} body{font:11px/1.35 "Times New Roman",Times,serif; color:#000; margin:0}
  .hd{display:grid; grid-template-columns:1fr 1.2fr; text-align:center; margin-bottom:8px} .hd b{display:block} .hd .u{display:inline-block; border-top:1px solid #000; width:40%; margin-top:2px}
  h1{font-size:15px; text-align:center; margin:6px 0 2px} .sub{text-align:center; font-style:italic; margin-bottom:8px}
  table{width:100%; border-collapse:collapse} th,td{border:1px solid #000; padding:2px 3px; vertical-align:top} th{background:#eee; font-size:10.5px} td.r{text-align:right; white-space:nowrap} td.c{text-align:center}
  thead{display:table-header-group} tr{page-break-inside:avoid} .sign{display:grid; grid-template-columns:1fr 1fr 1fr; text-align:center; margin-top:14px; page-break-inside:avoid} .sign i{display:block} .sp{height:60px}
  </style></head><body>${printHead()}<h1>BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG ${m.slice(5)}/${m.slice(0,4)}</h1>
  <div class="sub">BHXH ${fmtN(s.empBhxh??8,1)}%, BHYT ${fmtN(s.empBhyt??1.5,1)}%, BHTN ${fmtN(s.empBhtn??1,1)}% (người lao động) · Đơn vị tính: đồng</div>
  <table><thead><tr><th>STT</th><th>Họ tên</th><th>Phòng ban</th>${cols.map(c=>`<th>${c[0]}</th>`).join('')}<th>Ký nhận</th></tr></thead>
  <tbody>${rows.map((r,i)=>`<tr><td class="c">${i+1}</td><td>${esc(r.name)}</td><td>${esc(vpDeptName(r.departmentId))}</td>${cols.map(c=>`<td class="r">${val(r,c[1])}</td>`).join('')}<td></td></tr>`).join('')}
  <tr><td></td><td colspan="2"><b>TỔNG CỘNG</b></td>${cols.map(c=>`<td class="r"><b>${tot(c[1])}</b></td>`).join('')}<td></td></tr></tbody></table>
  <div class="sign"><div><b>NGƯỜI LẬP BIỂU</b><i>(Ký, ghi rõ họ tên)</i><div class="sp"></div>${esc(S.user&&S.user.name||'')}</div><div><b>KẾ TOÁN TRƯỞNG</b><i>(Ký, ghi rõ họ tên)</i><div class="sp"></div></div>
  <div><i>${printDate()}</i><b>GIÁM ĐỐC</b><i>(Ký, ghi rõ họ tên, đóng dấu)</i><div class="sp"></div></div></div></body></html>`;
  const fr=document.createElement('iframe'); fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0'; fr.title='In bảng lương';
  document.body.appendChild(fr); const doc=fr.contentDocument; doc.open(); doc.write(html); doc.close();
  setTimeout(()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }finally{ setTimeout(()=>fr.remove(), 60000); } }, 250); };
ACT['pay-pdf']=id=>{ const m=payMonth(), d=VP.pay[m]; if(!d||!d.rows) return; const s=d.settings||{};
  const list=d.rows.filter(r=>id? r.employeeId===id : r.hasProfile||r.locked);
  const L=(a,b,c='')=>`<tr><td>${a}</td><td class="r">${b}</td><td class="n">${c}</td></tr>`;
  const one=r=>`<div class="slip">${printHead()}<h1>PHIẾU LƯƠNG THÁNG ${m.slice(5)}/${m.slice(0,4)}</h1>
    <p>Họ tên: <b>${esc(r.name)}</b> &nbsp;·&nbsp; Phòng ban: ${esc(vpDeptName(r.departmentId))}${r.position?' &nbsp;·&nbsp; Chức vụ: '+esc(r.position):''}</p>
    <table><tbody>${L('Lương chính',vnd(r.baseSalary))}${L('Ngày công hưởng lương / công chuẩn',fmtN(r.paid,1)+' / '+fmtN(r.standard,1))}
    ${L('<b>1. Lương theo ngày công</b>',vnd(r.timePay))}${(r.allowanceLines||[]).map(a=>L('&nbsp;&nbsp;'+esc(a.label),vnd(a.amount))).join('')}${L('<b>2. Phụ cấp</b>',vnd(r.allowances-(r.allowanceCut||0)))}
    ${L('<b>3. Tăng ca</b>',vnd(r.otPay),r.otHours?fmtN(r.otHours,1)+' giờ':'')}${L('<b>4. Thưởng KPI</b>',vnd(r.kpiBonus),r.kpiGrade?'Xếp loại '+esc(r.kpiGrade):'')}${L('<b>5. Thưởng, bổ sung khác</b>',vnd(r.bonus),esc(r.note||''))}
    ${payExtraLines(r, L)}${L('<b>TỔNG THU NHẬP</b>','<b>'+vnd(r.gross)+'</b>')}${L(`BHXH (${fmtN(s.empBhxh??8,1)}%), BHYT (${fmtN(s.empBhyt??1.5,1)}%), BHTN (${fmtN(s.empBhtn??1,1)}%)`,vnd(r.insurance))}${L('Thu nhập tính thuế',vnd(r.assessable),r.dependents?r.dependents+' người phụ thuộc':'')}${L('Thuế TNCN',vnd(r.pit))}
    ${L('Ứng lương',vnd(r.advance))}${L('Khấu trừ khác',vnd(r.deduction))}${L('<b>THỰC LĨNH</b>','<b>'+vnd(r.net)+'</b>')}</tbody></table>
    <p class="n">${esc(s.payDay||'')}${r.locked?'':' · Bản tạm tính, chưa chốt'}</p>
    <div class="sign"><div><b>NGƯỜI NHẬN</b><i>(Ký, ghi rõ họ tên)</i><div class="sp"></div>${esc(r.name)}</div><div><b>KẾ TOÁN</b><i>(Ký, ghi rõ họ tên)</i><div class="sp"></div></div></div></div>`;
  const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Phieu luong ${m}</title><style>
  @page{size:A5; margin:10mm} body{font:12.5px/1.4 "Times New Roman",Times,serif; color:#000; margin:0}
  .hd{display:grid; grid-template-columns:1fr 1.2fr; text-align:center; margin-bottom:8px; font-size:11px} .hd b{display:block} .hd .u{display:inline-block; border-top:1px solid #000; width:40%; margin-top:2px}
  h1{font-size:15px; text-align:center; margin:6px 0} table{width:100%; border-collapse:collapse} td{border:1px solid #000; padding:3px 5px} td.r{text-align:right; white-space:nowrap} td.n,.n{font-size:11px; font-style:italic}
  .slip{page-break-after:always} .slip:last-child{page-break-after:auto} .sign{display:grid; grid-template-columns:1fr 1fr; text-align:center; margin-top:10px} .sign i{display:block} .sp{height:48px}
  </style></head><body>${list.map(one).join('')||'<p>Không có phiếu lương.</p>'}</body></html>`;
  const fr=document.createElement('iframe'); fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0'; fr.title='In phiếu lương';
  document.body.appendChild(fr); const doc=fr.contentDocument; doc.open(); doc.write(html); doc.close();
  setTimeout(()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }finally{ setTimeout(()=>fr.remove(), 60000); } }, 250); };
