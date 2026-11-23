/* ===== Bản 1.10.4: Công việc: dự án → nhiệm vụ → công việc, việc phát sinh, phối hợp, gia hạn, nghiệm thu; nhắc việc và KPI tạm tính ===== */
VP.cv={}; VP.cvn={};
const CV_ST=[['open','Đang làm'],['overdue','Quá hạn'],['confirm','Việc phát sinh chờ xác nhận'],['review','Chờ nghiệm thu'],['done','Đã xong'],['all','Tất cả']];
const cvKey = () => [S.f.cvs||'my', S.f.cvt||'open', S.f.cvp||'', S.f.cvm||''].join('|');
const cvUrl = () => { const [sc,st,p,m]=cvKey().split('|'); return `/api/vp/viec?scope=${sc}&status=${st}`+(p?'&project='+encodeURIComponent(p):'')+(m?'&month='+m:''); };
const cvData = () => vpFetch(VP.cv, cvKey(), cvUrl());
function cvReset(){ VP.cv={}; VP.cvn={}; VP.kpi={}; }
const cvRow = id => { for(const k in VP.cv){ const d=VP.cv[k]; const r=d&&d.rows&&d.rows.find(x=>x.id===id); if(r) return r; } return null; };
const cvStars = q => q? '★'.repeat(q)+'☆'.repeat(5-q) : '';
function cvStatus(r){
  if(r.arising && !r.arisingConfirmed && r.status!=='Đã hủy') return pill('Phát sinh, chờ xác nhận','warn');
  if(r.status==='Hoàn thành') return pill('Hoàn thành','ok')+(r.quality?` <span class="small" title="Nghiệm thu ${r.quality} sao">${cvStars(r.quality)}</span>`:'');
  if(r.status==='Đã hủy') return pill('Đã hủy','bad');
  if(r.overdue) return pill('Quá hạn','bad');
  if(r.dueSoon) return pill('Sắp đến hạn','warn');
  return pill(r.status, r.status==='Đang thực hiện'?'info':'');
}
function cvActs(r){
  const b=[];
  if(r.canConfirm) b.push(`<button class="btn sm primary" data-act="cv-confirm" data-id="${esc(r.id)}|1">Xác nhận</button><button class="btn sm ghost" data-act="cv-confirm" data-id="${esc(r.id)}|0">Không nhận</button>`);
  if(r.canWork && r.status==='Chưa bắt đầu' ) b.push(`<button class="btn sm ghost" data-act="cv-start" data-id="${esc(r.id)}">Bắt đầu</button>`);
  if(r.canWork && !r.hasChildren) b.push(`<button class="btn sm" data-act="cv-done" data-id="${esc(r.id)}">Hoàn thành</button>`);
  if(r.canReview && !r.quality) b.push(`<button class="btn sm primary" data-act="cv-review" data-id="${esc(r.id)}">Nghiệm thu</button>`);
  return b.join(' ');
}
function cvRemindHTML(n, full){
  if(!n || n.error) return '';
  const it=x=>`<a href="#" data-act="cv-view" data-id="${esc(x.id)}">${esc(x.name)}</a> <span class="muted">(${x.late?'trễ '+x.late+' ngày':'hạn '+fmtDate(x.due)})</span>`;
  const parts=[];
  if(n.overdue.length) parts.push(`<div><b style="color:var(--red)">Quá hạn ${n.overdue.length} việc:</b> ${n.overdue.slice(0,full?20:3).map(it).join(' · ')}${!full&&n.overdue.length>3?' …':''}</div>`);
  if(n.soon.length) parts.push(`<div><b>Sắp đến hạn (${n.remindDays} ngày tới) ${n.soon.length} việc:</b> ${n.soon.slice(0,full?20:3).map(it).join(' · ')}${!full&&n.soon.length>3?' …':''}</div>`);
  if(n.myPending) parts.push(`<div class="small muted">${n.myPending} việc phát sinh của bạn đang chờ xác nhận (chưa tính KPI).</div>`);
  if(n.kpi && n.kpi.estimate) parts.push(`<div class="small muted">KPI tháng này: chưa có điểm công việc nên chưa xếp loại (chuyên cần tạm tính ${fmtN(n.kpi.total,1)}).</div>`);
  else if(n.kpi){ const k=n.kpi, ok=k.total>=k.targetMin;
    parts.push(`<div>KPI tạm tính tháng này: <b>${fmtN(k.total,1)}</b> điểm${k.grade?' ('+esc(k.grade)+')':''}, ${ok?`<span style="color:var(--green,#16a34a)">đạt mức ${esc(k.target)} (từ ${fmtN(k.targetMin)})</span>`:`<span style="color:var(--red)">dưới mức ${esc(k.target)} (cần từ ${fmtN(k.targetMin)})</span>`}${k.missing&&k.missing.length?` <span class="small muted">· chưa có: ${esc(k.missing.join(', '))}</span>`:''}</div>`); }
  const t=n.team;
  if(t && (t.overdue||t.confirm||t.review||t.lowKpi.length)) parts.push(`<div style="margin-top:4px;padding-top:4px;border-top:1px dashed var(--line,#ddd)"><b>Việc của phòng, người bạn giao:</b>
    ${t.overdue?`<a href="#" data-act="cv-goto" data-id="dept|overdue">${t.overdue} việc quá hạn</a>${t.byPerson.length?' ('+t.byPerson.slice(0,5).map(p=>esc(p.name)+' '+p.n).join(', ')+')':''}`:''}
    ${t.confirm?` · <a href="#" data-act="cv-goto" data-id="all|confirm">${t.confirm} việc phát sinh chờ xác nhận</a>`:''}
    ${t.review?` · <a href="#" data-act="cv-goto" data-id="all|review">${t.review} việc chờ nghiệm thu</a>`:''}
    ${t.lowKpi.length?`<div class="small">KPI tạm tính dưới mức ${esc(n.kpi?n.kpi.target:'B')}: ${t.lowKpi.map(p=>esc(p.name)+' '+fmtN(p.total,1)).join(', ')}</div>`:''}</div>`);
  if(!parts.length) return full? `<div class="alert ok" style="margin-bottom:10px">Không có việc quá hạn hay sắp đến hạn.</div>` : '';
  return `<div class="alert ${n.overdue.length||(t&&t.overdue)?'bad':'info'} cv-remind" style="margin-bottom:10px">${parts.join('')}${full?'':' <a class="small" href="#cong-viec">Xem công việc</a>'}</div>`;
}
const cvRemind = () => vpFetch(VP.cvn, TODAY, '/api/vp/viec/nhac');
ACT['cv-goto']=id=>{ const [sc,st]=id.split('|'); S.f.cvs=sc; S.f.cvt=st; goRoute('cong-viec'); };

/* Trang Điểm danh: nhắc việc ngay dưới lời chúc */
const _vpHome3=VIEWS['van-phong'];
VIEWS['van-phong']=()=>{
  const html=_vpHome3(); if(!VP.st) return html;
  const box=cvRemindHTML(cvRemind(), false); if(!box) return html;
  const i=html.indexOf('<div class="grid g2 vp-top">'); return i<0? html : html.slice(0,i)+box+html.slice(i);
};

VIEWS['cong-viec']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>Công việc</h1></div></div>`+vpWait(); }
  const d=cvData(), sc=S.f.cvs||'my', st=S.f.cvt||'open', q=fold(S.f.cvq||'');
  const pm=d&&d.perms||{}, canGive=pm.boss || (pm.managed||[]).length>0;
  const tabs=[['my','Việc của tôi'],['giao','Tôi giao']].concat(canGive?[['dept','Phòng tôi phụ trách']]:[]).concat(pm.seeAll?[['all','Tất cả']]:[]);
  let body;
  if(d===null) body='<div class="empty">Đang tải…</div>';
  else if(d.error) body=emptyBox(esc(d.error));
  else {
    const rows=d.rows.filter(r=>!q || fold(r.name+' '+(r.assignee||'')+' '+(r.parentName||'')+' '+(r.projectName||'')).includes(q));
    body=table([
      {h:'Công việc', f:r=>`<b style="font-weight:600">${esc(r.name)}</b>${r.arising?' <span class="pill" title="Việc phát sinh">PS</span>':''}${r.hasChildren?' <span class="pill info" title="Nhiệm vụ có việc con: KPI tính theo việc con">Nhiệm vụ</span>':''}
        <div class="small muted">${esc(r.projectName||'Việc nội bộ')}${r.parentName?' › '+esc(r.parentName):''}</div>`},
      {h:'Người làm', f:r=>`${esc(r.assignee||'—')}${r.collabNames.length?`<div class="small muted">Phối hợp: ${esc(r.collabNames.join(', '))}</div>`:''}`},
      {h:'Mức độ', f:r=>esc(r.level||'')},
      {h:'Hạn', f:r=>`<span class="num" style="${r.overdue?'color:var(--red);font-weight:600':''}">${fmtDate(r.due)}</span>${r.extendCount?`<div class="small muted" title="Hạn ban đầu ${fmtDate(r.originalDue)}">gia hạn ${r.extendCount} lần</div>`:''}${r.doneDate?`<div class="small muted">xong ${fmtDate(r.doneDate)}</div>`:''}`},
      {h:'Trạng thái', f:r=>cvStatus(r)+(r.reopenCount?`<div class="small muted">mở lại ${r.reopenCount} lần</div>`:'')},
      {h:'', f:r=>cvActs(r)}],
      rows, {empty: st==='open'&&sc==='my'? 'Không có việc đang làm.' : 'Không có công việc.', rowAct:'cv-view'});
    if(d.total>=1000) body=`<p class="small muted">Hiện 1.000 việc đầu; lọc theo dự án hoặc tháng để xem thêm.</p>`+body;
  }
  return `<div class="head"><div class="grow"><h1>Công việc</h1><p>Dự án → nhiệm vụ → công việc. Việc tự tạo là việc phát sinh từ một nhiệm vụ, được xác nhận mới tính KPI.</p></div>
    <div class="toolbar">${canGive?`<button class="btn primary" data-act="cv-new" data-id="give">Giao việc</button>`:''}<button class="btn" data-act="cv-new" data-id="self">+ Việc phát sinh</button></div></div>
  ${cvRemindHTML(cvRemind(), true)}
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${sc===k?'on':''}" data-act="cv-tab" data-id="${k}">${l}</button>`).join('')}</div>
  <div class="toolbar" style="margin:8px 0 10px"><select data-f="cvt" aria-label="Trạng thái">${opts(CV_ST, st)}</select>
    <select data-f="cvp" aria-label="Dự án">${opts([['-','Việc nội bộ (không thuộc dự án)']].concat(((d&&d.projects)||[]).map(p=>[p.id,p.name])), S.f.cvp||'', 'Tất cả dự án')}</select>
    <input type="month" data-f="cvm" value="${esc(S.f.cvm||'')}" aria-label="Tháng (hạn hoặc ngày xong)" title="Tháng (theo hạn hoặc ngày xong)">
    <input type="search" data-f="cvq" value="${esc(S.f.cvq||'')}" placeholder="Tìm việc, người làm…" aria-label="Tìm">
    <span style="flex:1"></span><button class="btn sm ghost" data-act="cv-xlsx">Xuất Excel</button></div>${body}`;
};
ACT['cv-tab']=k=>{ S.f.cvs=k; render(); };

function cvAssignees(d){
  const pm=d.perms||{}; const me=VP.st.me;
  const list=VP.emps.filter(e=>e.userId && e.status!=='Nghỉ việc' && (pm.boss || (pm.assignable||[]).includes(e.userId) || (me&&e.userId===me.userId)));
  return list.map(e=>[e.userId, e.name+(e.departmentId?' · '+vpDeptName(e.departmentId):'')]);
}
ACT['cv-new']=async (mode, el, ev, base)=>{
  const d=VP.cv[cvKey()] || await api('GET','/api/vp/viec?scope=my&status=open');
  const me=VP.st.me, self=mode==='self', r=base||null;
  if(self && !r && (!me||!me.userId)) return toast('Tài khoản chưa gắn hồ sơ nhân sự.','err');
  const parents=d.parents.filter(p=>!r||p.id!==r.id).map(p=>[p.id, (p.projectName?p.projectName+' › ':'Nội bộ › ')+p.name]);
  const fields=[{key:'name',label:'Tên công việc',req:true,full:true},
    {key:'parentId',label:self?'Phát sinh từ nhiệm vụ / công việc':'Thuộc nhiệm vụ (việc cha)',type:'select',options:parents,req:self&&!(d.perms&&d.perms.boss),full:true,hint:'Việc con kế thừa dự án của việc cha.'},
    {key:'projectId',label:'Dự án (khi không chọn việc cha)',type:'select',options:(d.projects||[]).map(p=>[p.id,p.name]),full:true}];
  if(!self) fields.push({key:'assigneeUserId',label:'Người thực hiện chính',type:'select',options:cvAssignees(d),req:true});
  fields.push({key:'level',label:'Mức độ',type:'select',options:d.levels||['Bình thường','Quan trọng','Khẩn cấp'],req:true},
    {key:'startDate',label:'Ngày bắt đầu',type:'date'},{key:'due',label:'Hạn hoàn thành',type:'date',req:true},
    {key:'collaborators',label:'Người phối hợp (tính KPI theo hệ số phối hợp)',type:'checks',options:VP.emps.filter(e=>e.userId&&e.status!=='Nghỉ việc').map(e=>[e.userId,e.name])},
    {key:'note',label:'Nội dung, yêu cầu, sản phẩm cần có',type:'textarea',keepLines:true});
  if(r && r.canEdit && d.perms && d.perms.boss) fields.push({key:'correct',label:'Đổi hạn',type:'select',options:[['0','Gia hạn (đếm số lần gia hạn)'],['1','Sửa nhầm hạn (không tính gia hạn)']]});
  const value=r? {name:r.name, parentId:r.parentId||'', projectId:r.projectId||'', assigneeUserId:r.assigneeUserId||'', level:r.level||'', startDate:r.startDate||'', due:r.due||'', collaborators:r.collaborators, note:r.note||'', correct:'0'}
    : {level:(d.levels||[])[0]||'', startDate:TODAY, assigneeUserId:'', collaborators:[]};
  openForm({title:r?'Sửa công việc':self?'Việc phát sinh':'Giao việc', value, fields,
    onSave:async v=>{ const body={name:v.name, parentId:v.parentId||'', projectId:v.parentId?null:(v.projectId||''), assigneeUserId:self&&!r?me.userId:(v.assigneeUserId||r&&r.assigneeUserId), level:v.level, startDate:v.startDate||null, due:v.due, collaborators:v.collaborators||[], note:v.note||'', correct:v.correct==='1'};
      const res= r? await api('PUT','/api/vp/viec/'+encodeURIComponent(r.id), body) : await api('POST','/api/vp/viec', body);
      cvReset(); if(!r && res.arising) setTimeout(()=>toast('Đã tạo việc phát sinh: chờ người giao nhiệm vụ hoặc trưởng phòng xác nhận'),400); return {id:res.id||r.id}; }});
};
ACT['cv-edit']=id=>{ const r=cvRow(id); if(r) ACT['cv-new'](r.arising&&!r.arisingConfirmed?'self':'give', null, null, r); };
async function cvPost(id, path, body, msg){ await api('POST',`/api/vp/viec/${encodeURIComponent(id)}/${path}`, body); cvReset(); render(); if(msg) toast(msg); }
ACT['cv-start']=id=>cvPost(id,'trang-thai',{status:'Đang thực hiện'},'Đã chuyển sang đang thực hiện').catch(ex=>toast(errText(ex),'err'));
ACT['cv-done']=id=>{ const r=cvRow(id); if(!r) return;
  openForm({title:'Hoàn thành: '+r.name, narrow:true, submit:'Báo hoàn thành', value:{doneDate:TODAY},
    fields:[{key:'doneDate',label:'Ngày hoàn thành',type:'date',req:true,full:true},{key:'result',label:'Kết quả, sản phẩm',type:'textarea',keepLines:true}],
    onSave:async v=>{ await api('POST',`/api/vp/viec/${encodeURIComponent(id)}/trang-thai`,{status:'Hoàn thành', doneDate:v.doneDate, result:v.result||''}); cvReset(); return {id}; }}); };
ACT['cv-review']=id=>{ const r=cvRow(id); if(!r) return;
  openForm({title:'Nghiệm thu: '+r.name, narrow:true, value:{kind:'5', newDue:''},
    fields:[{key:'_i',type:'html',html:`<div class="fld full small">${esc(r.assignee||'')} báo xong ${fmtDate(r.doneDate)} (hạn ${fmtDate(r.due)}).</div>`},
      {key:'kind',label:'Kết quả nghiệm thu',type:'select',req:true,full:true,options:[['5','5 sao: xuất sắc'],['4','4 sao: tốt'],['3','3 sao: đạt'],['2','2 sao: cần sửa nhỏ'],['1','1 sao: chưa đạt'],['reopen','Mở lại: yêu cầu làm lại']]},
      {key:'newDue',label:'Hạn mới khi mở lại (không tính gia hạn)',type:'date'},{key:'note',label:'Nhận xét',type:'textarea',keepLines:true}],
    onSave:async v=>{ await api('POST',`/api/vp/viec/${encodeURIComponent(id)}/nghiem-thu`, v.kind==='reopen'? {reopen:true, newDue:v.newDue||null, note:v.note||''} : {quality:+v.kind, note:v.note||''}); cvReset(); return {id}; }}); };
ACT['cv-confirm']=async x=>{ const [id,a]=x.split('|');
  if(a==='0' && !await confirmBox('Không xác nhận việc phát sinh này? Việc chuyển sang Đã hủy, không tính KPI.','Không xác nhận')) return;
  await cvPost(id,'xac-nhan',{accept:a==='1'}, a==='1'?'Đã xác nhận việc phát sinh':'Đã ghi không xác nhận').catch(ex=>toast(errText(ex),'err')); };
ACT['cv-del']=async id=>{ if(!await confirmBox('Xóa công việc này?')) return; await api('DELETE','/api/vp/viec/'+encodeURIComponent(id)); closeModal(); cvReset(); render(); toast('Đã xóa'); };
ACT['cv-view']=async (id,el,ev)=>{ if(ev&&ev.preventDefault) ev.preventDefault(); if(ev&&ev.target&&ev.target.closest&&ev.target.closest('button')) return;
  let r=cvRow(id);
  if(!r){ const d=await api('GET','/api/vp/viec?scope=all&status=all'); VP.cv['all|all||']=d; r=d.rows.find(x=>x.id===id); if(!r) return toast('Không thấy công việc.','err'); }
  const li=(k,v)=>v?`<div class="fld"><label>${k}</label><div>${v}</div></div>`:'';
  openModal(`<div class="mform wide"><header><h3>${esc(r.name)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header>
    <div class="fgrid" style="padding:16px;max-height:calc(100vh - 200px);overflow:auto">${li('Dự án', esc(r.projectName||'Việc nội bộ'))}${li('Thuộc nhiệm vụ', r.parentName?esc(r.parentName):'')}${li('Người làm', esc(r.assignee||''))}${li('Phối hợp', esc(r.collabNames.join(', ')))}${li('Người giao', esc(r.assignedBy||''))}
    ${li('Mức độ', esc(r.level||''))}${li('Thời gian', `${fmtDate(r.startDate)} → ${fmtDate(r.due)}${r.extendCount?` (hạn ban đầu ${fmtDate(r.originalDue)}, gia hạn ${r.extendCount} lần)`:''}`)}
    ${li('Trạng thái', cvStatus(r)+(r.doneDate?' xong '+fmtDate(r.doneDate):'')+(r.reopenCount?`, mở lại ${r.reopenCount} lần`:'')+(r.fromEwork?' <span class="small muted">· chuyển từ e-work</span>':''))}
    ${r.note?`<div class="fld full"><label>Nội dung, kết quả</label><div style="white-space:pre-wrap">${esc(r.note)}</div></div>`:''}</div>
    <footer>${r.canEdit&&!r.hasChildren?`<button class="btn ghost danger" data-act="cv-del" data-id="${esc(r.id)}">Xóa</button>`:''}<span style="flex:1"></span>${cvActs(r)}${r.canEdit?`<button class="btn" data-act="cv-edit" data-id="${esc(r.id)}">Sửa</button>`:''}</footer></div>`);
};
ACT['cv-xlsx']=()=>{ const d=VP.cv[cvKey()]; if(!d||!d.rows) return;
  const rows=d.rows.map((r,i)=>[i+1, r.projectName||'Việc nội bộ', r.parentName||'', r.name, r.assignee||'', r.collabNames.join(', '), r.level||'', r.startDate?fmtDate(r.startDate):'', r.due?fmtDate(r.due):'', r.originalDue?fmtDate(r.originalDue):'', r.extendCount||'', r.doneDate?fmtDate(r.doneDate):'',
    r.arising&&!r.arisingConfirmed&&r.status!=='Đã hủy'?'Phát sinh, chờ xác nhận':r.overdue?'Quá hạn':r.status, r.quality||'', r.reopenCount||'']);
  exportXlsx(`CongViec_${TODAY}.xlsx`, [{name:'Công việc', title:'DANH SÁCH CÔNG VIỆC', sub:'Ngày xuất '+fmtDate(TODAY),
    head:['STT','Dự án','Nhiệm vụ','Công việc','Người thực hiện','Phối hợp','Mức độ','Bắt đầu','Hạn','Hạn ban đầu','Số lần gia hạn','Ngày xong','Trạng thái','Chất lượng (sao)','Số lần mở lại'], rows}]); };
