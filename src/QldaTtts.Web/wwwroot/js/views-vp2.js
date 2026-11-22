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

/* Hộp thư: số thông báo chưa xem, thông báo quan trọng, lịch của tôi trong 7 ngày */
function vpInbox(force){
  if(!S.user || VP.ibLoading || (!force && VP.ib && Date.now()-VP.ibAt<120000)) return;
  VP.ibLoading=true;
  api('GET','/api/vp/inbox').then(r=>{ VP.ib=r; VP.ibAt=Date.now(); }).catch(()=>{}).finally(()=>{ VP.ibLoading=false; onData(); });
}
setInterval(()=>{ if(S.user && document.visibilityState==='visible') vpInbox(true); }, 120000);

/* Trang Điểm danh: thông báo quan trọng chưa xem và lịch của tôi hiện ngay trên đầu (không phải mở thêm trang) */
const _vpHome=VIEWS['van-phong'];
VIEWS['van-phong']=()=>{
  const html=_vpHome(); if(!VP.st) return html; vpInbox();
  const ib=VP.ib; if(!ib) return html;
  let top='', mid='';
  if(ib.important.length) top+=`<div class="alert bad" style="margin-bottom:10px"><b>Thông báo quan trọng chưa xem:</b> ${ib.important.map(n=>`<a href="#" data-act="nt-open" data-id="${esc(n.id)}">${esc(n.title)}</a>`).join(' · ')}</div>`;
  const ms=ib.meetings.filter(m=>m.status!=='Đã hủy');
  if(ms.length) mid+=`<div class="card" style="margin-top:12px"><div class="toolbar" style="justify-content:space-between"><h2 style="margin:0">Lịch của tôi 7 ngày tới</h2><a class="small" href="#lich-hop">Lịch công tác tuần</a></div>
    <div class="alertList">${ms.map(m=>`<div class="alr click" data-act="mt-view" data-id="${esc(m.id)}"><span class="alr-d"><b>${['CN','T2','T3','T4','T5','T6','T7'][mtLocal(m.startAt).getDay()]} ${fmtDate(mtDay(m.startAt)).slice(0,5)}</b> ${mtTime(m)}</span><span>${esc(m.title)}${m.place?` <span class="muted">· ${esc(m.place)}</span>`:''} ${mtStatusPill(m)}</span></div>`).join('')}</div></div>`;
  /* Thông báo quan trọng trên cùng; lịch của tôi ngay dưới khối điểm danh (điểm danh vẫn là việc chính của trang) */
  const i=html.indexOf('<div class="grid g2 vp-top">'), j=html.indexOf('<div class="card" style="margin-top:12px"><div class="toolbar" style="justify-content:space-between"><h2 style="margin:0">Lịch sử điểm danh');
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
    <span style="flex:1"></span><button class="btn sm ghost" data-act="mt-pdf">In, lưu PDF</button><button class="btn sm ghost" data-act="mt-xlsx">Xuất Excel</button></div>${body}`;
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
    {key:'att',label:'Mời người tham dự (hiện ở "Lịch của tôi" của từng người)',type:'checks',options:()=>VP.emps.filter(e=>e.status!=='Nghỉ việc').sort((a,b)=>vpDeptName(a.departmentId).localeCompare(vpDeptName(b.departmentId),'vi')||String(a.name).localeCompare(String(b.name),'vi')).map(e=>[e.id, e.name+(e.departmentId?' · '+vpDeptName(e.departmentId):'')])},
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
