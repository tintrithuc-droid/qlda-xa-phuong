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

/* ---------------------------------------------------------------- KPI tháng (Bản 1.10) */
VP.kpi={};
EXTRA_ROUTES.push('kpi');
const kpiMonth = () => S.f.kpim || (()=>{ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-(new Date().getDate()<=5?1:0)); return d.getFullYear()+'-'+pad(d.getMonth()+1); })();
const kpiGradePill = g => g? pill(g, g==='A'?'ok':g==='B'?'info':g==='C'?'warn':'bad') : '';
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
    body=`<p class="small muted" style="margin:0 0 8px">Tổng điểm = Công việc ${k.wWork}% + Kết quả dự án ${k.wProject}% + Chuyên cần ${k.wAttendance}% + Đánh giá quản lý ${k.wManager}%. Xếp loại: ${k.grades.map(g=>`${esc(g.name)} từ ${fmtN(g.min)}`).join(', ')}. ${locked?pill('Đã chốt','ok'):need?pill(need+' người chưa chấm đủ','warn'):''}</p>`
    + table([
      {h:'Họ tên', f:r=>`<b style="font-weight:600">${esc(r.name)}</b><div class="small muted">${esc(vpDeptName(r.departmentId))}</div>`},
      {h:`Công việc (${k.wWork}%)`, r:1, f:r=>`${kpiN(r.work)}${r.workOverride!=null?' <span class="small muted" title="Quản lý ghi đè">✎</span>':''}${r.workAuto?`<div class="small muted">${r.workAuto.total} việc, ${r.workAuto.onTime} đúng hạn${r.workAuto.late?', '+r.workAuto.late+' trễ':''}${r.workAuto.overdue?', '+r.workAuto.overdue+' quá hạn':''}</div>`:''}`},
      {h:`Dự án (${k.wProject}%)`, r:1, f:r=> r.canRate? `<input type="number" min="0" max="100" step="5" value="${r.project??''}" data-kpi-proj="${esc(r.employeeId)}" style="width:70px;text-align:right" aria-label="Điểm kết quả dự án của ${esc(r.name)}">` : kpiN(r.project)},
      {h:`Chuyên cần (${k.wAttendance}%)`, r:1, f:r=>`${kpiN(r.attendance)}${r.attendance!=null?`<div class="small muted">muộn ${r.attDetail.late}${r.attDetail.absent?', nghỉ KLD '+fmtN(r.attDetail.absent,1):''}${r.attDetail.noOut?', quên ra '+r.attDetail.noOut:''}</div>`:''}`},
      {h:`Quản lý (${k.wManager}%)`, f:r=>kpiStars(r)+(r.ratingNote?`<div class="small muted" title="${esc(r.ratingNote)}">${esc(r.ratingNote.slice(0,40))}</div>`:'')},
      {h:'Tổng', r:1, f:r=>`<b>${fmtN(r.total,1)}</b>`}, {h:'Xếp loại', f:r=>kpiGradePill(r.grade)+(r.employeeNote?` <span title="Có phản hồi: ${esc(r.employeeNote)}">💬</span>`:'')}],
      rows, {empty:'Chưa có nhân sự trong phạm vi bạn xem.', nopage:true, rowAct:'kpi-row'});
  }
  const ed=d&&d.canEdit, locked=d&&d.rows&&d.rows.length&&d.rows.every(r=>r.locked);
  return `<div class="head"><div class="grow"><h1>KPI tháng ${m.slice(5)}/${m.slice(0,4)}</h1><p>${VP.st.perms.admin||ed?'Toàn công ty':(VP.st.perms.managed||[]).length?'Phòng do bạn phụ trách và của bạn':'Kết quả của bạn'}</p></div>
    <div class="toolbar">${ed?`<button class="btn" data-act="kpi-set">Thiết lập</button><button class="btn ${locked?'':'primary'}" data-act="kpi-lock" data-id="${locked?'0':'1'}">${locked?'Mở chốt':'Chốt KPI tháng'}</button>`:''}</div></div>
  <div class="toolbar" style="margin:4px 0 10px"><input type="month" data-f="kpim" value="${esc(m)}" aria-label="Tháng"><select data-f="kpid" aria-label="Phòng ban">${opts(VP.depts.map(x=>[x.id,x.name]), dep, 'Tất cả phòng ban')}</select>
    <span style="flex:1"></span><button class="btn sm ghost" data-act="kpi-pdf">In, lưu PDF</button><button class="btn sm ghost" data-act="kpi-xlsx">Xuất Excel</button></div>${body}`;
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
  openForm({title:'Thiết lập KPI', value:{...k, grades:k.grades.map(g=>[g.name,g.min,g.bonus].join('; ')).join('\n')},
    fields:[{key:'_h1',type:'html',html:'<div class="fld full"><b>Trọng số bốn nhóm (tổng 100)</b></div>'},{key:'wWork',label:'Hoàn thành công việc',type:'number',req:true},{key:'wProject',label:'Kết quả dự án',type:'number',req:true},
      {key:'wAttendance',label:'Chuyên cần',type:'number',req:true},{key:'wManager',label:'Đánh giá của quản lý',type:'number',req:true},
      {key:'_h2',type:'html',html:'<div class="fld full"><b>Chuyên cần: 100 điểm, trừ mỗi lần</b></div>'},{key:'penLate',label:'Đi muộn',type:'number'},{key:'graceMinutes',label:'Phút ân hạn (muộn không quá số phút này không trừ)',type:'number'},
      {key:'penEarly',label:'Về sớm',type:'number'},{key:'penNoOut',label:'Quên điểm danh ra',type:'number'},{key:'penAbsent',label:'Mỗi ngày nghỉ không lý do',type:'number'},
      {key:'grades',label:'Xếp loại: mỗi dòng "tên; điểm từ; thưởng (đồng)"',type:'textarea',rows:4,keepLines:true}],
    onSave:async v=>{ const grades=String(v.grades||'').split('\n').map(l=>l.split(';').map(x=>x.trim())).filter(p=>p[0]).map(p=>({name:p[0], min:N(p[1]), bonus:N(String(p[2]||'0').replace(/\./g,''))}));
      if(N(v.wWork)+N(v.wProject)+N(v.wAttendance)+N(v.wManager)!==100) throw new Error('Tổng trọng số phải bằng 100.');
      await api('PUT','/api/vp/kpi-settings',{wWork:N(v.wWork), wProject:N(v.wProject), wAttendance:N(v.wAttendance), wManager:N(v.wManager), penLate:N(v.penLate), penEarly:N(v.penEarly), penNoOut:N(v.penNoOut), penAbsent:N(v.penAbsent), graceMinutes:N(v.graceMinutes), grades});
      VP.kpi={}; return {id:'kpi'}; }}); };
function kpiTable(){ const m=kpiMonth(), d=VP.kpi[m]; if(!d||!d.rows) return null; const dep=S.f.kpid||'';
  return {m, k:d.settings, rows:d.rows.filter(r=>!dep||r.departmentId===dep).slice().sort((a,b)=>vpDeptName(a.departmentId).localeCompare(vpDeptName(b.departmentId),'vi')||b.total-a.total)}; }
ACT['kpi-xlsx']=()=>{ const t=kpiTable(); if(!t) return;
  const rows=t.rows.map((r,i)=>[i+1, r.name, vpDeptName(r.departmentId), r.work??'', r.project??'', r.attendance??'', r.rating?r.rating*20:'', r.total, r.grade||'', r.bonus||0, r.ratingNote||'']);
  exportXlsx(`KPI_${t.m}.xlsx`, [{name:'KPI '+t.m, title:`BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ KPI THÁNG ${t.m.slice(5)}/${t.m.slice(0,4)}`, sub:`Trọng số: công việc ${t.k.wWork}%, kết quả dự án ${t.k.wProject}%, chuyên cần ${t.k.wAttendance}%, đánh giá quản lý ${t.k.wManager}%`,
    head:['STT','Họ tên','Phòng ban','Công việc','Kết quả dự án','Chuyên cần','Đánh giá quản lý','Tổng điểm','Xếp loại','Thưởng (đồng)','Nhận xét'], rows, money:[9]}]); };
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
  <tbody>${t.rows.map((r,i)=>`<tr><td class="c">${i+1}</td><td>${esc(r.name)}</td><td>${esc(vpDeptName(r.departmentId))}</td><td class="r">${f(r.work)}</td><td class="r">${f(r.project)}</td><td class="r">${f(r.attendance)}</td><td class="r">${r.rating?f(r.rating*20):''}</td><td class="r"><b>${f(r.total)}</b></td><td class="c"><b>${esc(r.grade||'')}</b></td><td class="r">${r.bonus?fmtVND(r.bonus):''}</td></tr>`).join('')}</tbody></table>
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
