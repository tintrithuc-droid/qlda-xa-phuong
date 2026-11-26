/* ===== Công việc (bản 1.10.4, 1.10.17): Dự án › Gói thầu › Công việc › việc con, việc tự tạo, phối hợp, gia hạn, báo xong → chờ nghiệm thu (quá 3 ngày làm việc tự Đạt); nhắc việc và KPI tạm tính ===== */
VP.cv={}; VP.cvn={};
const CV_ST=[['open','Đang làm'],['overdue','Quá hạn'],['confirm','Việc tự tạo chờ xác nhận'],['review','Chờ nghiệm thu'],['done','Đã xong'],['all','Tất cả']];
const cvKey = () => { if(S.f._cvp0!==(S.f.cvp||'')){ S.f._cvp0=S.f.cvp||''; S.f.cvk=''; } const k=S.f.cvp&&S.f.cvp!=='-'? S.f.cvk||'' : ''; return [S.f.cvs||'my', S.f.cvt||'open', S.f.cvp||'', S.f.cvm||'', k].join('|'); };
const cvUrl = () => { const [sc,st,p,m,k]=cvKey().split('|'); return `/api/vp/viec?scope=${sc}&status=${st}`+(p?'&project='+encodeURIComponent(p):'')+(m?'&month='+m:'')+(k?'&package='+encodeURIComponent(k):''); };
const cvData = () => vpFetch(VP.cv, cvKey(), cvUrl());
function cvReset(){ VP.cv={}; VP.cvn={}; VP.kpi={}; VP.pj={}; }
const cvRow = id => { for(const k in VP.cv){ const d=VP.cv[k]; const r=d&&d.rows&&d.rows.find(x=>x.id===id); if(r) return r; } return null; };
const cvStars = q => q? '★'.repeat(q)+'☆'.repeat(5-q) : '';
function cvStatus(r){
  if(r.arising && !r.arisingConfirmed && r.status!=='Đã hủy') return pill('Tự tạo, chờ xác nhận','warn');
  if(r.pendingReview) return pill('Chờ nghiệm thu','warn')+`<div class="small muted">quá 3 ngày làm việc tự Đạt</div>`;
  if(r.status==='Hoàn thành') return pill('Hoàn thành','ok')+(r.quality?` <span class="small" title="Nghiệm thu ${r.quality} sao">${cvStars(r.quality)}</span>`:r.autoAccepted?'<div class="small muted">tự Đạt (không nghiệm thu)</div>':'');
  if(r.status==='Đã hủy') return pill('Đã hủy','bad');
  if(r.overdue) return pill('Quá hạn','bad');
  if(r.dueSoon) return pill('Sắp đến hạn','warn');
  return pill(r.status, r.status==='Đang thực hiện'?'info':'');
}
function cvActs(r, full){
  const b=[];
  if(r.canConfirm) b.push(`<button class="btn sm primary" data-act="cv-confirm" data-id="${esc(r.id)}|1">Xác nhận</button><button class="btn sm ghost" data-act="cv-confirm" data-id="${esc(r.id)}|0">Không nhận</button>`);
  if(r.canUpdate && !r.hasChildren) b.push(`<button class="btn sm ghost" data-act="cv-upd" data-id="${esc(r.id)}">Cập nhật</button>`);
  if(full && r.canAskExtend) b.push(`<button class="btn sm ghost" data-act="cv-ext" data-id="${esc(r.id)}">Xin gia hạn</button>`);
  if(r.canWork && !r.hasChildren && r.role!=='phoi-hop') b.push(`<button class="btn sm" data-act="cv-done" data-id="${esc(r.id)}">Báo xong</button>`);
  if(r.canReview) b.push(`<button class="btn sm primary" data-act="cv-review" data-id="${esc(r.id)}">Nghiệm thu</button>`);
  if(!full && r.extendPending) b.push(`<span class="pill warn" title="Có đề nghị gia hạn chờ duyệt">Xin gia hạn</span>`);
  return b.join(' ');
}
function cvRemindHTML(n, full){
  if(!n || n.error) return '';
  const it=x=>`<a href="#" data-act="cv-view" data-id="${esc(x.id)}">${esc(x.name)}</a> <span class="muted">(${x.late?'trễ '+x.late+' ngày':'hạn '+fmtDate(x.due)})</span>`;
  const parts=[];
  if(n.overdue.length) parts.push(`<div><b style="color:var(--red)">Quá hạn ${n.overdue.length} việc:</b> ${n.overdue.slice(0,full?20:3).map(it).join(' · ')}${!full&&n.overdue.length>3?' …':''}</div>`);
  if(n.soon.length) parts.push(`<div><b>Sắp đến hạn (${n.remindDays} ngày tới) ${n.soon.length} việc:</b> ${n.soon.slice(0,full?20:3).map(it).join(' · ')}${!full&&n.soon.length>3?' …':''}</div>`);
  if(n.myPending) parts.push(`<div class="small muted">${n.myPending} việc tự tạo của bạn đang chờ xác nhận (chưa tính KPI).</div>`);
  if(n.kpi && n.kpi.estimate) parts.push(`<div class="small muted">KPI tháng này: chưa có điểm công việc nên chưa xếp loại (chuyên cần tạm tính ${fmtN(n.kpi.total,1)}).</div>`);
  else if(n.kpi){ const k=n.kpi, ok=k.total>=k.targetMin;
    parts.push(`<div>KPI tạm tính tháng này: <b>${fmtN(k.total,1)}</b> điểm${k.grade?' ('+esc(k.grade)+')':''}, ${ok?`<span style="color:var(--green,#16a34a)">đạt mức ${esc(k.target)} (từ ${fmtN(k.targetMin)})</span>`:`<span style="color:var(--red)">dưới mức ${esc(k.target)} (cần từ ${fmtN(k.targetMin)})</span>`}${k.missing&&k.missing.length?` <span class="small muted">· chưa có: ${esc(k.missing.join(', '))}</span>`:''}</div>`); }
  const t=n.team;
  if(t && (t.overdue||t.confirm||t.review||t.lowKpi.length)) parts.push(`<div style="margin-top:4px;padding-top:4px;border-top:1px dashed var(--line,#ddd)"><b>Việc của phòng, người bạn giao:</b>
    ${t.overdue?`<a href="#" data-act="cv-goto" data-id="dept|overdue">${t.overdue} việc quá hạn</a>${t.byPerson.length?' ('+t.byPerson.slice(0,5).map(p=>esc(p.name)+' '+p.n).join(', ')+')':''}`:''}
    ${t.confirm?` · <a href="#" data-act="cv-goto" data-id="all|confirm">${t.confirm} việc tự tạo chờ xác nhận</a>`:''}
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

/* Bản 1.10.17 (anh Trí 26/11/2026): cây Dự án (cấp cha) › Gói thầu (cấp con, không bắt buộc) › Công việc › việc con.
   Mỗi dự án, mỗi gói thầu có dòng tổng hợp; thêm việc ngay ở dự án hoặc ở gói thầu; "Việc của tôi" hay "Giao cho người khác" chọn rõ trên biểu mẫu. */
const cvChips = s => !s? '' : `<span class="cv-sum"><b>${s.total}</b> việc · ${s.done} xong (${s.pct}%)${s.overdue?` · <span style="color:var(--red)">${s.overdue} quá hạn</span>`:''}${s.review?` · ${s.review} chờ nghiệm thu`:''}</span>`;
function cvTask(r, lvl){
  const pad=12+lvl*22;
  return `<tr class="click" data-act="cv-view" data-id="${esc(r.id)}"><td data-label="Công việc" style="padding-left:${pad}px">${r.parentId&&lvl>0&&r._child?'<span class="muted">↳ </span>':''}<b style="font-weight:600">${esc(r.name)}</b>${r.role==='phoi-hop'?' <span class="pill">Phối hợp</span>':r.role==='theo-doi'?' <span class="pill">Theo dõi</span>':''}${r.hasChildren?' <span class="pill info" title="Đã chia việc con: KPI tính theo việc con">Có việc con</span>':''}${r.parentName&&!r._child?`<div class="small muted">thuộc: ${esc(r.parentName)}</div>`:''}</td>
    <td data-label="Người làm">${esc(r.assignee||'—')}${r.collabNames.length?`<div class="small muted">Phối hợp: ${esc(r.collabNames.join(', '))}</div>`:''}</td>
    <td data-label="Mức độ">${esc(r.level||'')}</td>
    <td data-label="Hạn"><span class="num" style="${r.overdue?'color:var(--red);font-weight:600':''}">${fmtDate(r.due)}</span>${r.extendCount?`<div class="small muted" title="Hạn ban đầu ${fmtDate(r.originalDue)}">gia hạn ${r.extendCount} lần</div>`:''}${r.doneDate?`<div class="small muted">xong ${fmtDate(r.doneDate)}</div>`:''}</td>
    <td data-label="Trạng thái">${cvStatus(r)}${r.status!=='Hoàn thành'&&r.status!=='Đã hủy'&&r.progress?`<div>${cvBar(r.progress)}</div>`:''}${r.reopenCount?`<div class="small muted">mở lại ${r.reopenCount} lần</div>`:''}</td>
    <td class="acts">${cvActs(r)}</td></tr>`;
}
/* rows: các việc đã lọc; summary: tổng hợp của máy chủ; o.packages: gói thầu cần hiện cả khi chưa có việc (tab dự án); o.add: có nút thêm việc */
function cvTree(rows, summary, o={}){
  const sumOf=(pid,kid)=>{ const p=(summary||[]).find(x=>(x.projectId||'')===(pid||'')); if(!p) return null; if(kid===undefined) return p.sum; const k=p.packages.find(x=>(x.packageId||'')===(kid||'')); return k&&k.sum; };
  const byProj=new Map(); rows.forEach(r=>{ const k=r.projectId||''; if(!byProj.has(k)) byProj.set(k,[]); byProj.get(k).push(r); });
  (o.projects||[]).forEach(p=>{ if(!byProj.has(p.id)) byProj.set(p.id,[]); });
  const keys=[...byProj.keys()].sort((a,b)=>a===''?1:b===''?-1:String((byProj.get(a)[0]||{}).projectName||(o.projects||[]).find(p=>p.id===a)?.name||'').localeCompare(String((byProj.get(b)[0]||{}).projectName||(o.projects||[]).find(p=>p.id===b)?.name||''),'vi'));
  const addBtn=(pid,kid)=> o.add? `<button class="btn sm ghost" data-act="cv-add" data-id="${esc((pid||'-')+'|'+(kid||''))}">+ Thêm việc</button>` : '';
  const list=xs=>{ /* việc cha rồi đến việc con ngay dưới */
    const ids=new Set(xs.map(x=>x.id)), out=[];
    const kids=id=>xs.filter(x=>x.parentId===id);
    const walk=(x,l)=>{ out.push([x,l]); kids(x.id).forEach(c=>walk({...c,_child:true}, l+1)); };
    xs.filter(x=>!x.parentId||!ids.has(x.parentId)).forEach(x=>walk(x,0)); return out; };
  let body='';
  for(const pid of keys){
    const xs=byProj.get(pid); const pname=pid? ((xs[0]||{}).projectName || ((o.projects||[]).find(p=>p.id===pid)||{}).name || '') : 'Việc nội bộ (không thuộc dự án)';
    if(!o.hideProject) body+=`<tr class="grp cv-p"><td colspan="6"><div class="cv-h"><span><span class="cv-lv">${pid?'Dự án':'Nội bộ'}</span> ${esc(pname)}</span>${cvChips(sumOf(pid))}<span style="flex:1"></span>${pid?addBtn(pid,''):addBtn('','')}</div></td></tr>`;
    const pk=new Map(); xs.forEach(r=>{ const k=r.packageId||''; if(!pk.has(k)) pk.set(k,[]); pk.get(k).push(r); });
    if(pid) (o.packages||[]).filter(k=>k.projectId===pid).forEach(k=>{ if(!pk.has(k.id)) pk.set(k.id,[]); });
    const named=[...pk.keys()].filter(k=>k).sort((a,b)=>String(cvPkgName(a,pk,o)).localeCompare(String(cvPkgName(b,pk,o)),'vi'));
    const common=pk.get('')||[];
    if(pid && named.length){
      if(common.length || o.packages) body+=`<tr class="grp cv-k"><td colspan="6"><div class="cv-h" style="padding-left:18px"><span><span class="cv-lv">Việc chung</span> của dự án (không thuộc gói thầu)</span>${cvChips(sumOf(pid,''))}<span style="flex:1"></span>${o.hideProject?addBtn(pid,''):''}</div></td></tr>`;
      list(common).forEach(([r,l])=>body+=cvTask(r,l+1));
      for(const k of named){ body+=`<tr class="grp cv-k"><td colspan="6"><div class="cv-h" style="padding-left:18px"><span><span class="cv-lv">Gói thầu</span> ${esc(cvPkgName(k,pk,o))}</span>${cvChips(sumOf(pid,k))}<span style="flex:1"></span>${addBtn(pid,k)}</div></td></tr>`;
        const ks=pk.get(k); if(!ks.length) body+=`<tr><td colspan="6" class="small muted" style="padding-left:46px">Chưa có việc.</td></tr>`; list(ks).forEach(([r,l])=>body+=cvTask(r,l+1)); }
    } else { if(!xs.length) body+=`<tr><td colspan="6" class="small muted" style="padding-left:24px">Chưa có việc.</td></tr>`; list(xs).forEach(([r,l])=>body+=cvTask(r,pid?l+1:l+1)); }
  }
  if(!body) return emptyBox(o.empty||'Không có công việc.');
  return `<div class="tw rt cv-tree"><table><thead><tr><th>Công việc</th><th>Người làm</th><th>Mức độ</th><th>Hạn</th><th>Trạng thái</th><th></th></tr></thead><tbody>${body}</tbody></table></div>`;
}
function cvPkgName(k, pk, o){ const r=(pk.get(k)||[])[0]; return r&&r.packageName || ((o.packages||[]).find(x=>x.id===k)||{}).name || 'Gói thầu'; }

VIEWS['cong-viec']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>Công việc</h1></div></div>`+vpWait(); }
  const d=cvData(), sc=S.f.cvs||'my', st=S.f.cvt||'open', q=fold(S.f.cvq||'');
  const pm=d&&d.perms||{}, canGive=pm.boss || (pm.managed||[]).length>0;
  const cn=d&&d.counts||{}, cnt=n=>n?` <span class="cnt">${n}</span>`:'';
  const tabs=[['my','Việc của tôi'+cnt(cn.my)],['duoc','Được giao'+cnt(cn.duoc)],['giao','Tôi giao'+cnt(cn.giao)]].concat(canGive?[['dept','Phòng tôi phụ trách']]:[]).concat(pm.seeAll?[['all','Tất cả']]:[]);
  let body;
  if(d===null) body='<div class="empty">Đang tải…</div>';
  else if(d.error) body=emptyBox(esc(d.error));
  else {
    const rows=d.rows.filter(r=>!q || fold(r.name+' '+(r.assignee||'')+' '+(r.parentName||'')+' '+(r.projectName||'')+' '+(r.packageName||'')).includes(q));
    body=cvTree(rows, d.summary, {add:true, empty: st==='open'&&sc==='my'? 'Không có việc đang làm.' : 'Không có công việc.'});
    if(d.total>=1000) body=`<p class="small muted">Hiện 1.000 việc đầu; lọc theo dự án hoặc tháng để xem thêm.</p>`+body;
  }
  const pkOpts=((d&&d.packages)||[]).filter(k=>!S.f.cvp||k.projectId===S.f.cvp);
  return `<div class="head"><div class="grow"><h1>Công việc</h1></div>
    <div class="toolbar"><button class="btn primary" data-act="cv-add" data-id="|">+ Thêm việc</button></div></div>
  ${cvRemindHTML(cvRemind(), true)}
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${sc===k?'on':''}" data-act="cv-tab" data-id="${k}">${l}</button>`).join('')}</div>
  <p class="small muted" style="margin:6px 0 0">${{my:'Việc tôi tự tạo và tự làm.',duoc:'Việc người khác giao cho tôi: làm chính, phối hợp hoặc theo dõi.',giao:'Việc tôi giao cho người khác: theo dõi tiến độ, duyệt gia hạn, nghiệm thu.',dept:'Việc của người trong phòng tôi phụ trách.',all:'Mọi việc trong phạm vi được xem.'}[sc]||''}</p>
  <div class="toolbar" style="margin:8px 0 10px"><select data-f="cvt" aria-label="Trạng thái">${opts(CV_ST, st)}</select>
    <select data-f="cvp" aria-label="Dự án">${opts([['-','Việc nội bộ (không thuộc dự án)']].concat(((d&&d.projects)||[]).map(p=>[p.id,p.name])), S.f.cvp||'', 'Tất cả dự án')}</select>
    ${S.f.cvp&&S.f.cvp!=='-'&&pkOpts.length?`<select data-f="cvk" aria-label="Gói thầu">${opts([['-','Việc chung của dự án']].concat(pkOpts.map(k=>[k.id,k.name])), S.f.cvk||'', 'Mọi gói thầu')}</select>`:''}
    <input type="month" data-f="cvm" value="${esc(S.f.cvm||'')}" aria-label="Tháng (hạn hoặc ngày xong)" title="Tháng (theo hạn hoặc ngày xong)">
    <input type="search" data-f="cvq" value="${esc(S.f.cvq||'')}" placeholder="Tìm việc, người làm…" aria-label="Tìm">
    <span style="flex:1"></span><button class="btn sm ghost" data-act="cv-xlsx">Xuất Excel</button></div>${body}`;
};
ACT['cv-tab']=k=>{ S.f.cvs=k; render(); };
ACT['cv-add']=x=>{ const [p,k]=String(x||'|').split('|'); ACT['cv-new'](null,null,null,null,{projectId:p||'', packageId:k||''}); };

function cvAssignees(d){
  const pm=d.perms||{}; const me=VP.st.me;
  const list=VP.emps.filter(e=>e.userId && e.status!=='Nghỉ việc' && (!me||e.userId!==me.userId) && (pm.boss || (pm.assignable||[]).includes(e.userId)));
  return list.map(e=>[e.userId, e.name+(e.departmentId?' · '+vpDeptName(e.departmentId):'')]);
}
ACT['cv-new']=async (mode, el, ev, base, preset)=>{
  const d=VP.cv[cvKey()] || await api('GET','/api/vp/viec?scope=my&status=open');
  const me=VP.st.me, r=base||null, pre=preset||{};
  const others=cvAssignees(d), canGive=others.length>0, hasMe=!!(me&&me.userId);
  // Tài khoản quản trị chưa gắn hồ sơ nhân sự vẫn giao việc được, chỉ không có "Việc của tôi"
  if(!r && !hasMe && !canGive) return toast('Tài khoản chưa gắn hồ sơ nhân sự.','err');
  const projOpts=[['-','Việc nội bộ (không thuộc dự án)']].concat((d.projects||[]).map(p=>[p.id,p.name]));
  const pkFor=pid=> !pid||pid==='-'? [['','— (việc nội bộ không có gói thầu)']] : [['','Việc chung của dự án (không chọn gói thầu)']].concat((d.packages||[]).filter(k=>k.projectId===pid).map(k=>[k.id,k.name]));
  const parFor=pid=> d.parents.filter(p=>(!r||p.id!==r.id) && (p.projectId||'-')===(pid||'-')).map(p=>[p.id,(p.packageName?p.packageName+' › ':'')+p.name]);
  const fields=[
    {key:'projectId',label:'Dự án (cấp cha)',type:'select',options:projOpts,req:true},
    {key:'packageId',label:'Gói thầu (cấp con)',type:'select',options:pkFor,dep:'projectId',req:true,hint:'Dự án chưa có gói thầu hoặc việc chung của dự án thì để "Việc chung của dự án".'},
    {key:'name',label:'Tên công việc',req:true,full:true},
    {key:'who',label:'Ai làm',type:'select',req:true,options:[hasMe&&['me','Việc của tôi (tôi tự làm)'], canGive&&['give','Giao cho người khác']].filter(Boolean)},
    {key:'assigneeUserId',label:'Người thực hiện',type:'select',dep:'who',options:w=>w==='give'? others : [['', (me&&me.name)||'Tôi']]},
    {key:'parentId',label:'Là việc con của (không bắt buộc)',type:'select',options:parFor,dep:'projectId',full:true,hint:'Việc con theo dự án, gói thầu của việc cha.'},
    {key:'level',label:'Mức độ',type:'select',options:d.levels||['Bình thường','Quan trọng','Khẩn cấp'],req:true},
    {key:'startDate',label:'Ngày bắt đầu',type:'date'},{key:'due',label:'Hạn hoàn thành',type:'date',req:true},
    {key:'collaborators',label:'Người phối hợp',type:'checks',options:VP.emps.filter(e=>e.userId&&e.status!=='Nghỉ việc').map(e=>[e.userId,e.name])},
    {key:'watchers',label:'Người theo dõi (xem, nhận nhắc, không tính KPI)',type:'checks',options:VP.emps.filter(e=>e.userId&&e.status!=='Nghỉ việc').map(e=>[e.userId,e.name])},
    {key:'note',label:'Nội dung, yêu cầu, sản phẩm cần có',type:'textarea',keepLines:true}];
  if(!r) fields.push({key:'files',label:'Tệp đính kèm (văn bản giao việc, tài liệu)',type:'files',multiple:true});
  if(r && r.canEdit && d.perms && d.perms.boss) fields.push({key:'correct',label:'Đổi hạn',type:'select',options:[['0','Gia hạn (đếm số lần gia hạn)'],['1','Sửa nhầm hạn (không tính gia hạn)']]});
  const mine=r? r.assigneeUserId===(me&&me.userId) : true;
  const value=r? {projectId:r.projectId||'-', packageId:r.packageId||'', name:r.name, who:mine?'me':'give', assigneeUserId:mine?'':r.assigneeUserId, parentId:r.parentId||'', level:r.level||'', startDate:r.startDate||'', due:r.due||'', collaborators:r.collaborators, watchers:r.watchers||[], note:r.note||'', correct:'0'}
    : {projectId:pre.projectId||'-', packageId:pre.packageId||'', who:(mode==='give'&&canGive)||!hasMe?'give':'me', level:(d.levels||[])[0]||'', startDate:TODAY, collaborators:[], watchers:[]};
  openForm({title:r?'Sửa công việc':'Thêm việc', value, fields,
    onSave:async v=>{ const pid=v.projectId==='-'?'':v.projectId;
      if(v.who==='give' && !v.assigneeUserId) throw new Error('Chọn người thực hiện.');
      const body={name:v.name, parentId:v.parentId||'', projectId:v.parentId?null:pid, packageId:v.parentId?null:(v.packageId||''), assigneeUserId:v.who==='give'?v.assigneeUserId:(me&&me.userId), level:v.level, startDate:v.startDate||null, due:v.due, collaborators:v.collaborators||[], watchers:v.watchers||[], note:v.note||'', correct:v.correct==='1'};
      const res= r? await api('PUT','/api/vp/viec/'+encodeURIComponent(r.id), body) : await api('POST','/api/vp/viec', body);
      if(!r && v.files && v.files.length) await cvUpload(res.id, v.files, null, 'Văn bản giao việc');
      cvReset(); if(!r && res.arising) setTimeout(()=>toast('Đã tạo việc của bạn: trưởng phòng hoặc Ban giám đốc xác nhận thì việc được tính KPI'),400); return {id:res.id||r.id}; }});
};
ACT['cv-edit']=id=>{ const r=cvRow(id)||(VP.pj&&VP.pj.rows||[]).find(x=>x.id===id); if(r) ACT['cv-new'](null, null, null, r); };
async function cvPost(id, path, body, msg){ await api('POST',`/api/vp/viec/${encodeURIComponent(id)}/${path}`, body); cvReset(); render(); if(msg) toast(msg); }
ACT['cv-start']=id=>cvPost(id,'trang-thai',{status:'Đang thực hiện'},'Đã chuyển sang đang thực hiện').catch(ex=>toast(errText(ex),'err'));
ACT['cv-done']=id=>{ const r=cvRow(id)||VP.cvd&&VP.cvd.row; if(!r) return;
  openForm({title:'Báo xong: '+r.name, narrow:true, submit:'Báo xong', value:{doneDate:TODAY},
    fields:[{key:'doneDate',label:'Ngày hoàn thành',type:'date',req:true,full:true},{key:'result',label:'Kết quả, sản phẩm',type:'textarea',keepLines:true},{key:'files',label:'Tệp kết quả (nếu có)',type:'files',multiple:true}],
    onSave:async v=>{ await api('POST',`/api/vp/viec/${encodeURIComponent(id)}/trang-thai`,{status:'Hoàn thành', doneDate:v.doneDate, result:v.result||''}); await cvUpload(id, v.files, null, 'Kết quả'); setTimeout(()=>cvAfter(id, r.role==='tu-lam'?'Đã báo xong':'Đã báo xong: chờ người giao nghiệm thu'),50); return {id}; }}); };
ACT['cv-review']=id=>{ const r=cvRow(id)||VP.cvd&&VP.cvd.row; if(!r) return;
  openForm({title:'Nghiệm thu: '+r.name, narrow:true, value:{kind:'5', newDue:''},
    fields:[{key:'_i',type:'html',html:`<div class="fld full small">${esc(r.assignee||'')} báo xong ${fmtDate(r.doneDate)} (hạn ${fmtDate(r.due)}).</div>`},
      {key:'kind',label:'Kết quả nghiệm thu',type:'select',req:true,full:true,options:[['5','5 sao: xuất sắc'],['4','4 sao: tốt'],['3','3 sao: đạt'],['2','2 sao: cần sửa nhỏ'],['1','1 sao: chưa đạt'],['reopen','Mở lại: yêu cầu làm lại']]},
      {key:'newDue',label:'Hạn mới khi mở lại (không tính gia hạn)',type:'date'},{key:'note',label:'Nhận xét',type:'textarea',keepLines:true}],
    onSave:async v=>{ await api('POST',`/api/vp/viec/${encodeURIComponent(id)}/nghiem-thu`, v.kind==='reopen'? {reopen:true, newDue:v.newDue||null, note:v.note||''} : {quality:+v.kind, note:v.note||''}); setTimeout(()=>cvAfter(id),50); return {id}; }}); };
ACT['cv-confirm']=async x=>{ const [id,a]=x.split('|');
  if(a==='0' && !await confirmBox('Không xác nhận việc tự tạo này? Việc chuyển sang Đã hủy, không tính KPI.','Không xác nhận')) return;
  await cvPost(id,'xac-nhan',{accept:a==='1'}, a==='1'?'Đã xác nhận việc':'Đã ghi không xác nhận').catch(ex=>toast(errText(ex),'err')); };
ACT['cv-del']=async id=>{ if(!await confirmBox('Xóa công việc này?')) return; await api('DELETE','/api/vp/viec/'+encodeURIComponent(id)); closeModal(); cvReset(); render(); toast('Đã xóa'); };
/* Chi tiết việc (bản 1.10.17): thông tin, việc con, tệp, nhật ký (giao, cập nhật tiến độ, gia hạn, báo xong, nghiệm thu, mở lại) và các nút xử lý */
const CV_LOG={giao:'Giao việc','cap-nhat':'Cập nhật tiến độ','xin-gia-han':'Xin gia hạn','gia-han':'Gia hạn','bao-xong':'Báo xong','nghiem-thu':'Nghiệm thu','mo-lai':'Mở lại','xac-nhan':'Xác nhận việc','huy':'Không xác nhận'};
const cvBar = p => `<span class="cv-bar" title="Tiến độ ${p||0}%"><i style="width:${Math.max(0,Math.min(100,p||0))}%"></i></span><span class="small muted">${p||0}%</span>`;
async function cvUpload(id, files, ref, kind){ for(const f of files||[]){ const fd=new FormData(); fd.append('file',f); if(ref) fd.append('ref',ref); if(kind) fd.append('kind',kind); await api('POST',`/api/vp/viec/${encodeURIComponent(id)}/tep`, fd); } }
ACT['cv-view']=async (id,el,ev)=>{ if(ev&&ev.preventDefault) ev.preventDefault(); if(ev&&ev.target&&ev.target.closest&&ev.target.closest('button')) return;
  let d; try{ d=await api('GET','/api/vp/viec/'+encodeURIComponent(id)); }catch(ex){ return toast(errText(ex),'err'); }
  const r=d.row; VP.cvd=d; VP.cv['_d|'+r.id]={rows:[r]};
  const li=(k,v)=>v?`<div class="fld"><label>${k}</label><div>${v}</div></div>`:'';
  const fileRow=f=>`<div class="cv-file"><a href="/api/files/${esc(f.fileId)}" target="_blank" rel="noopener">${esc(f.fileName)}</a> <span class="small muted">${fmtSize(f.size)} · ${esc(f.uploadedBy||'')} · ${fmtDT(f.uploadedAt)}</span></div>`;
  const logFiles=lid=>d.files.filter(f=>f.ref===lid).map(fileRow).join('');
  const logs=d.logs.slice().reverse().map(l=>`<li><div><b>${esc(CV_LOG[l.kind]||l.kind)}</b>${l.progress!=null&&l.kind==='cap-nhat'?` · ${l.progress}%`:''}${l.newDue?` · hạn mới ${fmtDate(l.newDue)}`:''}${l.state?` · ${pill(l.state, l.state==='Đã duyệt'?'ok':l.state==='Từ chối'?'bad':'warn')}`:''}
      <span class="small muted"> · ${esc(l.byName||'')} · ${fmtDT(l.at)}${l.decidedBy?` · duyệt: ${esc(l.decidedBy)}`:''}</span></div>${l.content?`<div style="white-space:pre-wrap">${esc(l.content)}</div>`:''}${logFiles(l.id)}
      ${l.canDecide?`<div style="margin-top:4px"><button class="btn sm primary" data-act="cv-ext-ok" data-id="${esc(r.id+'|'+l.id+'|1')}">Duyệt gia hạn</button> <button class="btn sm ghost" data-act="cv-ext-ok" data-id="${esc(r.id+'|'+l.id+'|0')}">Từ chối</button></div>`:''}</li>`).join('');
  const gen=d.files.filter(f=>!f.ref);
  openModal(`<div class="mform wide"><header><h3>${esc(r.name)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header>
    <div style="padding:16px;max-height:calc(100vh - 200px);overflow:auto;display:grid;gap:14px">
    <div class="fgrid" style="padding:0">${li('Dự án', esc(r.projectName||'Việc nội bộ'))}${r.projectId?li('Gói thầu', esc(r.packageName||'Việc chung của dự án')):''}${li('Là việc con của', r.parentName?esc(r.parentName):'')}
    ${li('Người làm', esc(r.assignee||''))}${li('Người giao', esc(r.assignedBy||'')+(r.role==='tu-lam'?' (việc của tôi)':''))}${li('Phối hợp', esc(r.collabNames.join(', ')))}${li('Theo dõi', esc((r.watcherNames||[]).join(', ')))}
    ${li('Mức độ', esc(r.level||''))}${li('Thời gian', `${fmtDate(r.startDate)} → ${fmtDate(r.due)}${r.extendCount?` (hạn ban đầu ${fmtDate(r.originalDue)}, gia hạn ${r.extendCount} lần)`:''}`)}
    ${li('Trạng thái', cvStatus(r)+(r.doneDate?' xong '+fmtDate(r.doneDate):'')+(r.reopenCount?`, mở lại ${r.reopenCount} lần`:'')+(r.fromEwork?' <span class="small muted">· chuyển từ e-work</span>':''))}${li('Tiến độ', cvBar(r.progress))}</div>
    ${r.note?`<div><div class="eyebrow">Nội dung, yêu cầu</div><div style="white-space:pre-wrap">${esc(r.note)}</div></div>`:''}
    ${d.children.length?`<div><div class="eyebrow">Việc con (${d.children.length})</div>${d.children.map(c=>`<div><a href="#" data-act="cv-view" data-id="${esc(c.id)}">${esc(c.name)}</a> <span class="small muted">· ${esc(c.assignee||'')} · hạn ${fmtDate(c.due)} · ${esc(c.status||'')}</span></div>`).join('')}</div>`:''}
    <div><div class="eyebrow">Tệp đính kèm</div>${gen.length?gen.map(fileRow).join(''):'<div class="small muted">Chưa có tệp.</div>'}${d.canAttach?`<label class="btn sm ghost" style="margin-top:6px">+ Thêm tệp<input type="file" multiple hidden data-cvfile="${esc(r.id)}"></label>`:''}</div>
    <div><div class="eyebrow">Nhật ký xử lý</div>${logs?`<ul class="cv-log">${logs}</ul>`:'<div class="small muted">Chưa có.</div>'}</div></div>
    <footer>${r.canEdit&&!r.hasChildren?`<button class="btn ghost danger" data-act="cv-del" data-id="${esc(r.id)}">Xóa</button>`:''}<span style="flex:1"></span>${cvActs(r,true)}${r.canEdit?`<button class="btn" data-act="cv-edit" data-id="${esc(r.id)}">Sửa</button>`:''}</footer></div>`);
  const fi=document.querySelector('[data-cvfile]'); if(fi) fi.addEventListener('change', async()=>{ try{ await cvUpload(r.id,[...fi.files]); toast('Đã thêm tệp'); ACT['cv-view'](r.id); }catch(ex){ toast(errText(ex),'err'); } });
};
async function cvAfter(id, msg){ cvReset(); render(); if(msg) toast(msg); if(!$('#ov').hidden && VP.cvd && VP.cvd.row.id===id) ACT['cv-view'](id); }
ACT['cv-upd']=id=>{ const r=cvRow(id)||VP.cvd&&VP.cvd.row; if(!r) return;
  openForm({title:'Cập nhật tiến độ: '+r.name, narrow:true, submit:'Lưu cập nhật', value:{progress:r.progress||0},
    fields:[{key:'content',label:'Đã làm được gì',type:'textarea',req:true,full:true,keepLines:true},{key:'progress',label:'Tiến độ (%)',type:'number',hint:'0–99; xong hẳn thì bấm Báo xong.'},{key:'files',label:'Tệp kèm (nếu có)',type:'files',multiple:true}],
    onSave:async v=>{ const res=await api('POST',`/api/vp/viec/${encodeURIComponent(id)}/cap-nhat`,{content:v.content, progress:v.progress==null?null:Math.round(v.progress)}); await cvUpload(id, v.files, res.logId, 'Cập nhật tiến độ'); setTimeout(()=>cvAfter(id),50); return {id}; }}); };
ACT['cv-ext']=id=>{ const r=cvRow(id)||VP.cvd&&VP.cvd.row; if(!r) return;
  openForm({title:'Xin gia hạn: '+r.name, narrow:true, submit:r.role==='tu-lam'?'Gia hạn':'Gửi xin gia hạn', value:{},
    fields:[{key:'_i',type:'html',html:`<div class="fld full small">Hạn hiện tại ${fmtDate(r.due)}.${r.role==='tu-lam'?' Việc của tôi: gia hạn ngay, vẫn đếm số lần gia hạn.':' Người giao việc duyệt; được duyệt thì tính một lần gia hạn.'}</div>`},{key:'newDue',label:'Hạn mới',type:'date',req:true},{key:'reason',label:'Lý do',type:'textarea',req:true,full:true}],
    onSave:async v=>{ await api('POST',`/api/vp/viec/${encodeURIComponent(id)}/xin-gia-han`,{newDue:v.newDue, reason:v.reason}); setTimeout(()=>cvAfter(id, r.role==='tu-lam'?'Đã gia hạn':'Đã gửi xin gia hạn'),50); return {id}; }}); };
ACT['cv-ext-ok']=async x=>{ const [id,lid,a]=x.split('|'); try{ await api('POST',`/api/vp/viec/${encodeURIComponent(id)}/duyet-gia-han`,{logId:lid, accept:a==='1'}); cvAfter(id, a==='1'?'Đã duyệt gia hạn':'Đã từ chối gia hạn'); }catch(ex){ toast(errText(ex),'err'); } };
ACT['cv-xlsx']=()=>{ const d=VP.cv[cvKey()]; if(!d||!d.rows) return;
  const rows=d.rows.map((r,i)=>[i+1, r.projectName||'Việc nội bộ', r.projectId?(r.packageName||'Việc chung'):'', r.parentName||'', r.name, r.assignee||'', r.collabNames.join(', '), r.level||'', r.startDate?fmtDate(r.startDate):'', r.due?fmtDate(r.due):'', r.originalDue?fmtDate(r.originalDue):'', r.extendCount||'', r.doneDate?fmtDate(r.doneDate):'',
    r.arising&&!r.arisingConfirmed&&r.status!=='Đã hủy'?'Tự tạo, chờ xác nhận':r.pendingReview?'Chờ nghiệm thu':r.overdue?'Quá hạn':r.status, r.quality||'', r.reopenCount||'']);
  exportXlsx(`CongViec_${TODAY}.xlsx`, [{name:'Công việc', title:'DANH SÁCH CÔNG VIỆC', sub:'Ngày xuất '+fmtDate(TODAY),
    head:['STT','Dự án','Gói thầu','Thuộc việc','Công việc','Người thực hiện','Phối hợp','Mức độ','Bắt đầu','Hạn','Hạn ban đầu','Số lần gia hạn','Ngày xong','Trạng thái','Chất lượng (sao)','Số lần mở lại'], rows}]); };

/* Bản 1.10.17: đơn vị dùng Văn phòng thì tab Công việc của dự án là cây Gói thầu › Công việc lấy từ mục Công việc (một nguồn, cùng biểu mẫu, cùng nút báo xong, nghiệm thu) */
VP.pj={};
function pjTasks(p){
  if(modHidden('cong-viec') || typeof cvTree!=='function') return '';
  const d=vpFetch(VP.pj, p.id, '/api/vp/viec?scope=all&status=all&project='+encodeURIComponent(p.id));
  if(d===null) return '<div class="empty">Đang tải…</div>';
  if(d.error || !d.unified) return '';
  if(!VP.st){ vpLoad(); return vpWait(); }
  VP.cv['pj|'+p.id]=d;
  const pk=D('packages').filter(k=>k.projectId===p.id).map(k=>({id:k.id, projectId:p.id, name:(k.code?k.code+' · ':'')+k.name}));
  const ps=(d.summary||[]).find(x=>x.projectId===p.id);
  return `<div class="card"><div class="ch"><h2>Công việc của dự án</h2>${ps?`<span class="small muted" style="flex:1;margin-left:12px">${cvChips(ps.sum)}</span>`:''}<span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn primary sm" data-act="cv-add" data-id="${esc(p.id)}|">+ Thêm việc</button></span></div>
    ${cvTree(d.rows.filter(r=>r.status!=='Đã hủy'), d.summary, {add:true, hideProject:true, packages:pk, projects:[{id:p.id,name:p.name}], empty:'Chưa có công việc.'})}</div>`;
}
