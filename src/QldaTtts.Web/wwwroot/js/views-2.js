/* ===== MÔ HÌNH HÓA CÔNG TRÌNH (UC6–9): lưu trữ, cập nhật phiên bản, tra cứu tệp mô hình và thông tin hạng mục ===== */
function dispose3D(){}
function mhPid(){ const ps=projects(); let pid=S.pid || S.f.mhp; if(!pid||!pidOk(pid)||!get('projects',pid)) pid=(ps.find(p=>D('models').some(m=>m.projectId===p.id))||ps[0]||{}).id; return pid; }
VIEWS['mo-hinh']=()=>{
  const pid=mhPid(); const p=pid&&get('projects',pid); const q=S.f.mhq||'', fm=S.f.mhf||'', it=S.f.mhi||'';
  if(!p) return `<div class="head"><div class="grow"><h1>Mô hình hóa công trình</h1></div></div>`+emptyBox('Chưa có dự án.');
  const ed=can('mo-hinh','edit');
  const items=D('items').filter(i=>i.projectId===pid).sort(by('code'));
  const files=D('models').filter(m=>m.projectId===pid);
  const keyOf=m=>m.fileKey||m.id;
  const latestAll=Object.values(files.reduce((a,m)=>{ const k=keyOf(m); if(!a[k]||N(a[k].version)<N(m.version)) a[k]=m; return a; },{}));
  const latest=latestAll.filter(m=>(!fm||m.format===fm) && (!it||m.itemId===it) && has({...m, item:(get('items',m.itemId)||{}).name},q)).sort(by('date',-1));
  const fItems=items.filter(i=>has(i,q));
  const last=latestAll.slice().sort(by('date',-1))[0];
  const itemName=id=>{ const i=get('items',id); return i? i.code+' · '+i.name : 'Toàn dự án'; };
  return `<div class="head"><div class="grow"><h1>Mô hình hóa công trình</h1><p>${esc(p.code)} · ${esc(p.name)}</p></div>
    ${!S.pid?`<select data-f="mhp" aria-label="Chọn dự án">${opts(projOpts(),pid)}</select>`:''}${ed?`<button class="btn primary" data-act="add-model" data-id="${pid}">+ Tải lên tệp mô hình</button>`:''}</div>
  <div class="grid g4"><div class="card kpi"><div class="eyebrow">Tệp mô hình</div><div class="v">${latestAll.length}</div><div class="s">${files.length} phiên bản lưu trữ</div></div>
    <div class="card kpi"><div class="eyebrow">Dung lượng lưu trữ</div><div class="v">${fmtSize(sum(files,'size'))}</div><div class="s">Tất cả phiên bản</div></div>
    <div class="card kpi"><div class="eyebrow">Hạng mục công trình</div><div class="v">${items.length}</div><div class="s">${items.filter(i=>files.some(m=>m.itemId===i.id)).length} hạng mục đã có mô hình</div></div>
    <div class="card kpi"><div class="eyebrow">Cập nhật gần nhất</div><div class="v" style="font-size:1.05rem">${last?fmtDate(last.date):'—'}</div><div class="s">${last?esc(last.name)+' v'+N(last.version):''}</div></div></div>
  <div class="toolbar"><input type="search" data-f="mhq" value="${esc(q)}" placeholder="Tìm tên tệp, nội dung thay đổi, hạng mục, kết cấu…" aria-label="Tìm kiếm mô hình"><select data-f="mhf" aria-label="Định dạng">${opts(catalog('Định dạng mô hình'),fm,'Mọi định dạng')}</select><select data-f="mhi" aria-label="Hạng mục">${opts(items.map(i=>[i.id,i.code+' · '+i.name]),it,'Mọi hạng mục')}</select></div>
  <div class="card"><div class="ch"><h2>Tệp mô hình công trình</h2></div>
  ${table([{h:'Tên tệp',f:r=>`<b style="font-weight:600">${esc(r.name)}</b><div class="small muted">${esc(r.note||'')}</div>`},{h:'Định dạng',f:r=>pill(r.format,'info')},{h:'Phiên bản',r:1,f:r=>'v'+N(r.version)},{h:'Hạng mục',f:r=>esc(itemName(r.itemId))},{h:'Cập nhật',f:r=>`<span class="num">${fmtDate(r.date)}</span><div class="small muted">${esc(r.by||'')}</div>`},{h:'Dung lượng',r:1,f:r=>fmtSize(r.size)},
    {h:'Tệp',f:r=>fileUrl(r)?`<a href="${esc(fileUrl(r))}" target="_blank" rel="noopener">Tải về</a>`:'<span class="small muted">Chưa có tệp</span>'}], latest,
    {actions:r=>`<button class="btn sm ghost" data-act="model-hist" data-id="${r.id}">Lịch sử (${files.filter(m=>keyOf(m)===keyOf(r)).length})</button>`+(ed?`<button class="btn sm ghost" data-act="model-ver" data-id="${r.id}">Cập nhật phiên bản</button><button class="btn sm ghost" data-act="edit-models" data-id="${r.id}">Sửa</button><button class="btn sm ghost danger" data-act="del" data-col="models" data-id="${r.id}">Xóa</button>`:''), empty:q||fm||it?'Không có tệp phù hợp.':'Chưa có tệp mô hình.'})}
  <p class="small muted" style="margin:8px 0 0">Phần mềm lưu trữ, quản lý phiên bản và tra cứu tệp mô hình do đơn vị tư vấn, nhà thầu lập (IFC, RVT, DWG, NWD, PDF…). Việc dựng và xem chi tiết mô hình thực hiện trên phần mềm chuyên dụng sau khi tải tệp về.</p></div>
  <div class="card"><div class="ch"><h2>Thông tin các hạng mục công trình</h2>${ed?`<button class="btn primary sm" data-act="add-item" data-id="${pid}">+ Thêm hạng mục</button>`:''}</div>
  ${table([{h:'Mã',f:r=>`<span class="num" style="white-space:nowrap">${esc(r.code)}</span>`},{h:'Tên hạng mục',f:r=>`<b style="font-weight:600">${esc(r.name)}</b><div class="small muted">${esc(r.desc||'')}</div>`},{h:'Kết cấu / vật liệu',k:'structure'},{h:'Diện tích (m²)',r:1,f:r=>fmtN(r.area)},{h:'Số tầng',r:1,f:r=>N(r.floors)||'—'},{h:'Tệp',f:r=>attCell(atts('items',r.id),true)},{h:'Tệp mô hình',r:1,f:r=>latestAll.filter(m=>m.itemId===r.id).length},{h:'Tiến độ',f:r=>`<div style="min-width:110px">${progBar(itemProgress(r))}</div>`}], fItems,
    {rowAct:'pick-item', actions:r=>editBtns('mo-hinh','items',r.id), empty:q?'Không có hạng mục phù hợp.':'Chưa có hạng mục.'})}
  <p class="small muted" style="margin:8px 0 0">Bấm vào một hạng mục để lọc các tệp mô hình của hạng mục đó.</p></div>`;
};
ACT['pick-item']=(id,el,e)=>{ if(e.target.closest('button')) return; S.f.mhi=S.f.mhi===id?'':id; render(); };
const itemFields=()=>[{key:'code',label:'Mã hạng mục',req:true},{key:'name',label:'Tên hạng mục',req:true},{key:'structure',label:'Kết cấu / vật liệu'},{key:'area',label:'Diện tích (m²)',type:'number'},
  {key:'floors',label:'Số tầng',type:'number'},{key:'progress',label:'Tiến độ (%) – dùng khi chưa gắn kế hoạch tiến độ',type:'percent'},{key:'desc',label:'Quy mô, thông số chính',type:'textarea'},{key:'att',label:'Bản vẽ, thuyết minh, hình ảnh hạng mục',type:'attach',col:'items'}];
ACT['add-item']=(pid)=>openForm({title:'Thêm hạng mục công trình', fields:itemFields(), onSave:v=>save('items',{...v, projectId:pid})});
ACT['edit-items']=(id)=>openForm({title:'Cập nhật hạng mục công trình', fields:itemFields(), value:get('items',id), onSave:v=>save('items',v)});
const modelFields=(pid)=>[{key:'file',label:'Tệp mô hình',type:'files',accept:'.ifc,.rvt,.dwg,.nwd,.nwc,.pdf,.skp,.zip',full:true,hint:'Tệp được lưu vào kho tệp trên máy chủ (tối đa 500 MB mỗi tệp).'},
  {key:'name',label:'Tên tệp (để trống sẽ lấy theo tệp chọn)'},{key:'format',label:'Định dạng',type:'select',options:()=>catalog('Định dạng mô hình'),req:true},
  {key:'itemId',label:'Thuộc hạng mục',type:'select',options:()=>D('items').filter(i=>i.projectId===pid).map(i=>[i.id,i.code+' – '+i.name])},{key:'by',label:'Đơn vị lập / cập nhật',def:S.user?.unit||''},{key:'note',label:'Nội dung, thay đổi so với phiên bản trước',type:'textarea'}];
async function modelSave(v, base){
  const f=v.file&&v.file[0]; delete v.file;
  if(!f && !base) { $('#mform_err').textContent='Vui lòng chọn tệp mô hình.'; return false; }
  if(f){ Object.assign(v, {name:v.name||f.name, size:f.size}, await storeFile(f)); v.date=TODAY; }
  return save('models', v, v.name+' v'+v.version);
}
ACT['add-model']=(pid)=>openForm({title:'Tải lên tệp mô hình', fields:modelFields(pid), onSave:v=>modelSave({...v, projectId:pid, fileKey:uid('f'), version:1})});
ACT['edit-models']=(id)=>{ const m=get('models',id); openForm({title:'Sửa thông tin tệp mô hình', fields:modelFields(m.projectId).filter(f=>f.key!=='file'), value:m, onSave:v=>modelSave(v, m)}); };
ACT['model-ver']=(id)=>{ const m=get('models',id); openForm({title:'Cập nhật phiên bản mới: '+m.name, fields:modelFields(m.projectId), value:{format:m.format, itemId:m.itemId, by:S.user.unit||m.by, name:m.name}, onSave:v=>{ const vs=D('models').filter(x=>(x.fileKey||x.id)===(m.fileKey||m.id)); return modelSave({...v, projectId:m.projectId, fileKey:m.fileKey||m.id, version:Math.max(...vs.map(x=>N(x.version)))+1}); }}); };
ACT['model-hist']=(id)=>{ const m=get('models',id); const vs=D('models').filter(x=>(x.fileKey||x.id)===(m.fileKey||m.id)).sort(by('version',-1));
  openModal(`<div class="mform"><header><h3>Lịch sử phiên bản: ${esc(m.name)}</h3><button class="icon-btn" data-close>×</button></header><div style="padding:16px;overflow:auto">${table([{h:'Phiên bản',f:r=>'v'+r.version},{h:'Ngày',f:r=>fmtDate(r.date)},{h:'Đơn vị',k:'by'},{h:'Nội dung thay đổi',k:'note'},{h:'Dung lượng',r:1,f:r=>fmtSize(r.size)},{h:'Tệp',f:r=>fileUrl(r)?`<a href="${esc(fileUrl(r))}" target="_blank" rel="noopener">Tải về</a>`:'—'}], vs)}</div></div>`); };

/* ===== GÓI THẦU VÀ HỢP ĐỒNG (UC10–14) ===== */
const pkgFields=()=>[{key:'projectId',label:'Thuộc dự án',type:'select',options:projOpts,req:true,full:true,def:S.pid},{key:'code',label:'Ký hiệu gói thầu',req:true},{key:'type',label:'Loại gói thầu',type:'select',options:()=>catalog('Loại gói thầu'),req:true},
  {key:'name',label:'Tên gói thầu',req:true,full:true},{key:'method',label:'Hình thức lựa chọn nhà thầu',type:'select',options:()=>catalog('Hình thức lựa chọn nhà thầu')},{key:'estimate',label:'Giá gói thầu (đồng)',type:'money',req:true},
  {key:'status',label:'Trạng thái',type:'select',options:()=>catalog('Trạng thái gói thầu'),req:true},{key:'duration',label:'Thời gian thực hiện gói thầu'}];
/* Gói thầu: nhập kèm QĐ phê duyệt KHLCNT và QĐ phê duyệt kết quả LCNT (lưu thành hồ sơ pháp lý gói thầu kèm tệp) */
function pkgForm(k){
  const ctx={}; const kh=k&&findLegal(k.projectId,k.id,'Kế hoạch lựa chọn nhà thầu'), kq=k&&findLegal(k.projectId,k.id,'Kết quả lựa chọn nhà thầu');
  const fields=[...pkgFields(), ...legalInline('kh','QĐ phê duyệt KHLCNT',ctx,kh), ...legalInline('kq','QĐ phê duyệt kết quả LCNT',ctx,kq)];
  const value=legalInlineValue('kq', kq, legalInlineValue('kh', kh, {...(k||{})}));
  openForm({title:k?'Cập nhật gói thầu':'Thêm gói thầu', fields, value, onSave:async v=>{
    const pv={...v}; ['kh','kq'].forEach(p=>['No','Date','Issuer','Att'].forEach(x=>delete pv[p+x]));
    const r=await save('packages',pv); if(!k) S.sel.pkg=r.id;
    const base={projectId:r.projectId, packageId:r.id, issuer:BR.ownerDefault};
    ctx.kh=await legalInlineSave('kh', v, kh, {...base, type:'Kế hoạch lựa chọn nhà thầu', title:(kh&&kh.title)||'Phê duyệt KHLCNT gói '+r.code, ...(kh?{issuer:kh.issuer}:{})});
    ctx.kq=await legalInlineSave('kq', v, kq, {...base, type:'Kết quả lựa chọn nhà thầu', title:(kq&&kq.title)||'Phê duyệt kết quả LCNT gói '+r.code, ...(kq?{issuer:kq.issuer}:{})});
    return r; }});
}
ACT['add-pkg']=()=>pkgForm(null);
ACT['edit-packages']=(id)=>pkgForm(get('packages',id));
ACT['open-pkg']=(id)=>{ S.sel.pkg=id; if(location.hash==='#goi-thau') render(); else location.hash='goi-thau'; };
ACT['back-pkg']=()=>{ S.sel.pkg=null; render(); };
VIEWS['goi-thau']=()=>{
  const k=S.sel.pkg&&get('packages',S.sel.pkg); if(k && pidOk(k.projectId)) return pkgDetail(k);
  const q=S.f.kq||'', st=S.f.kst||'', ty=S.f.kty||'';
  const rows=D('packages').filter(k=>inFilter(k.projectId) && has(k,q) && (!st||k.status===st) && (!ty||k.type===ty)).sort((a,b)=>(a.projectId+a.code).localeCompare(b.projectId+b.code)).map(k=>{ const c=contractOfPkg(k.id); return {...k, c, cv:c?contractValue(c):0, done:c?pct(contractDone(c.id),contractValue(c)):0}; });
  return `<div class="head"><div class="grow"><h1>Gói thầu và hợp đồng</h1><p>${rows.length} gói thầu · Giá gói thầu ${fmtTy(sum(rows,'estimate'))} · Giá trị hợp đồng ${fmtTy(sum(rows,'cv'))}</p></div>${can('goi-thau','edit')?`<button class="btn primary" data-act="add-pkg">+ Thêm gói thầu</button>`:''}</div>
  <div class="toolbar"><input type="search" data-f="kq" value="${esc(q)}" placeholder="Tìm ký hiệu, tên gói thầu…" aria-label="Tìm gói thầu"><select data-f="kty" aria-label="Loại">${opts(catalog('Loại gói thầu'),ty,'Mọi loại gói thầu')}</select><select data-f="kst" aria-label="Trạng thái">${opts(catalog('Trạng thái gói thầu'),st,'Mọi trạng thái')}</select></div>
  ${table([{h:'Ký hiệu',f:r=>`<span class="num" style="white-space:nowrap">${esc(r.code)}</span>`},{h:'Tên gói thầu',f:r=>`<b style="font-weight:600">${esc(r.name)}</b><div class="small muted">${esc((projOf(r.projectId)||{}).code||'')} · ${esc(r.type)} · ${esc(r.method||'')}</div>`},{h:'Giá gói thầu',r:1,f:r=>fmtTy(r.estimate)},
    {h:'Hợp đồng',f:r=>r.c?`<span class="num small">${esc(r.c.number)}</span><div class="small muted">${esc(r.c.contractor)}</div>`:'<span class="muted small">Chưa ký</span>'},{h:'Giá trị HĐ',r:1,f:r=>r.c?fmtTy(r.cv):'—'},{h:'Thực hiện HĐ',f:r=>r.c?`<div style="min-width:110px">${progBar(r.done)}</div>`:''},{h:'Trạng thái',f:r=>statusPill(r.status)}], rows, {rowAct:'open-pkg', empty:'Không có gói thầu phù hợp.'})}`;
};
function pkgDetail(k){
  const p=projOf(k.projectId); const c=contractOfPkg(k.id); const ed=can('goi-thau','edit');
  let cBody='';
  if(!c) cBody=emptyBox('Gói thầu chưa có hợp đồng.', ed?`<button class="btn primary" data-act="add-contract" data-id="${k.id}">+ Nhập thông tin hợp đồng</button>`:'');
  else {
    const cv=contractValue(c), end=contractEnd(c), done=contractDone(c.id), acc=contractAcc(c.id), paid=contractPaid(c.id);
    const tEl=c.start&&end? Math.min(100,pct(Math.max(0,days(c.start,TODAY)),days(c.start,end))):0; const sp=pkgProgress(k.id);
    const ad=D('addenda').filter(a=>a.contractId===c.id).sort(by('date'));
    cBody=`<div class="grid g2"><div class="card"><div class="ch"><h2>Thông tin hợp đồng</h2>${ed?`<button class="btn sm" data-act="edit-contracts" data-id="${c.id}">Sửa</button><button class="btn sm ghost danger" data-act="del" data-col="contracts" data-id="${c.id}">Xóa</button>`:''}</div><dl class="kv">
      <dt>Số hợp đồng</dt><dd class="num">${esc(c.number)}</dd><dt>Nhà thầu</dt><dd>${esc(c.contractor)}</dd><dt>Ngày ký</dt><dd class="num">${fmtDate(c.signDate)}</dd><dt>Loại hợp đồng</dt><dd>${esc(c.ctype||'—')}</dd>
      <dt>Giá trị ký kết</dt><dd class="num">${fmtVND(c.value)} đ</dd><dt>Giá trị sau điều chỉnh</dt><dd class="num"><b>${fmtVND(cv)} đ</b></dd><dt>Thời gian thực hiện</dt><dd class="num">${fmtDate(c.start)} – ${fmtDate(end)}${end!==c.end?` <span class="pill warn">gia hạn ${days(c.end,end)} ngày</span>`:''}</dd>
      <dt>Bảo lãnh thực hiện</dt><dd>${esc(c.guarantee||'—')}${c.guaranteeUntil?` · hiệu lực đến <span class="num" style="${c.guaranteeUntil<=addDays(TODAY,30)?'color:var(--red);font-weight:600':''}">${fmtDate(c.guaranteeUntil)}</span>`:''}</dd><dt>Tỷ lệ tạm ứng</dt><dd>${c.advanceRate!=null?esc(c.advanceRate)+'%':'—'}${c.advanceGuaranteeUntil?` · bảo lãnh tạm ứng đến <span class="num" style="${c.advanceGuaranteeUntil<=addDays(TODAY,30)?'color:var(--red);font-weight:600':''}">${fmtDate(c.advanceGuaranteeUntil)}</span>`:''}</dd>
      ${CONTRACT_DOCS.map(([kind,l])=>`<dt>${l}</dt><dd>${attLinks(atts('contracts',c.id,kind))}</dd>`).join('')}</dl></div>
      <div class="card"><h2>Theo dõi tiến độ thực hiện hợp đồng</h2><div class="list">
        <div><div class="small muted">Thời gian hợp đồng đã qua</div>${progBar(tEl)}</div>
        <div><div class="small muted">Tiến độ thi công (theo kế hoạch tiến độ gói thầu)</div>${progBar(sp, tEl-sp>15?'warn':'')}</div>
        <div><div class="small muted">Giá trị khối lượng thực hiện · ${fmtTy(done)}</div>${progBar(pct(done,cv), tEl-pct(done,cv)>15?'warn':'')}</div>
        <div><div class="small muted">Giá trị nghiệm thu · ${fmtTy(acc)}</div>${progBar(pct(acc,cv))}</div>
        <div><div class="small muted">Giá trị đã thanh toán · ${fmtTy(paid)}</div>${progBar(pct(paid,cv))}</div>
        ${tEl-sp>15?`<div class="alert">Tiến độ thi công đang chậm ${Math.round(tEl-sp)}% so với thời gian hợp đồng đã qua.</div>`:''}
        <div class="toolbar"><button class="btn sm" data-act="goto-kl" data-id="${c.id}">Khối lượng</button><button class="btn sm" data-act="goto-tt" data-id="${c.id}">Thanh toán</button><button class="btn sm" data-act="goto-td" data-id="${k.id}">Tiến độ</button></div></div></div></div>
      <div class="card"><div class="ch"><h2>Điều chỉnh, phụ lục hợp đồng</h2>${ed?`<button class="btn primary sm" data-act="add-addendum" data-id="${c.id}">+ Thêm phụ lục</button>`:''}</div>
      ${table([{h:'Số phụ lục',k:'number'},{h:'Ngày ký',f:r=>`<span class="num">${fmtDate(r.date)}</span>`},{h:'Nội dung điều chỉnh',k:'content'},{h:'Giá trị điều chỉnh',r:1,f:r=>(N(r.valueChange)>0?'+':'')+fmtVND(r.valueChange)},{h:'Gia hạn (ngày)',r:1,f:r=>N(r.daysChange)||'—'},{h:'Trạng thái',f:r=>wfPill('addenda',r)},{h:'Tệp',f:r=>attCell(atts('addenda',r.id))}], ad, {actions:r=>wfBtns('addenda',r)+wfEditBtns('addenda',r), empty:'Chưa có phụ lục điều chỉnh.', foot:ad.length?['Tổng đã duyệt','','',fmtVND(sum(ad.filter(addApproved),'valueChange')),sum(ad.filter(addApproved),'daysChange')||'—','','']:null})}
      ${(()=>{ const pd=contractPending(c); return pd.n? `<p class="small" style="margin:8px 0 0;color:var(--amber)">Đang chờ duyệt ${pd.n} phụ lục: ${pd.value>0?'+':''}${fmtVND(pd.value)} đồng${pd.days?', gia hạn '+pd.days+' ngày':''}. Chưa tính vào giá trị và thời hạn hợp đồng cho đến khi phụ lục được duyệt.</p>` : ''; })()}</div>`;
  }
  return `<div class="head"><div class="grow"><button class="btn ghost sm" data-act="back-pkg">← Danh sách gói thầu</button><h1 style="margin-top:8px">${esc(k.code)} · ${esc(k.name)}</h1><p>${esc(p?p.code+' – '+p.name:'')} · ${statusPill(k.status)}</p></div>${ed?`<button class="btn" data-act="edit-packages" data-id="${k.id}">Sửa gói thầu</button><button class="btn ghost danger" data-act="del" data-col="packages" data-id="${k.id}">Xóa</button>`:''}</div>
  <div class="grid g4"><div class="card kpi"><div class="eyebrow">Loại gói thầu</div><div class="v" style="font-size:1.05rem;font-family:var(--f-ui)">${esc(k.type)}</div><div class="s">${esc(k.method||'')}</div></div><div class="card kpi"><div class="eyebrow">Giá gói thầu</div><div class="v">${fmtTy(k.estimate)}</div></div>
    <div class="card kpi"><div class="eyebrow">Giá trị hợp đồng</div><div class="v">${c?fmtTy(contractValue(c)):'—'}</div><div class="s">${c&&N(k.estimate)?'Tiết kiệm '+fmtP(100-pct(N(c.value),k.estimate)):''}${c&&contractPending(c).n?`<br><span style="color:var(--amber)">Phụ lục chờ duyệt: ${fmtTy(contractPending(c).value)}</span>`:''}</div></div><div class="card kpi"><div class="eyebrow">Tiến độ gói thầu</div><div class="v">${fmtP(pkgProgress(k.id))}</div><div class="s">Kế hoạch ${fmtP(pkgExpected(k.id))}</div></div></div>
  ${cBody}
  ${legalCard(D('legal').filter(l=>l.packageId===k.id), k.projectId, k.id, 'goi-thau', 'Hồ sơ pháp lý gói thầu')}`;
}
const CONTRACT_DOCS=[['Hợp đồng đã ký','Bản hợp đồng đã ký'],['Bảo lãnh thực hiện hợp đồng','Bảo lãnh thực hiện HĐ'],['Bảo lãnh tạm ứng','Bảo lãnh tạm ứng']];
const contractFields=()=>[{key:'number',label:'Số hợp đồng',req:true},{key:'signDate',label:'Ngày ký',type:'date',req:true},{key:'contractor',label:'Nhà thầu / Liên danh',req:true,full:true},{key:'ctype',label:'Loại hợp đồng',type:'select',options:()=>catalog('Loại hợp đồng')},
  {key:'value',label:'Giá trị hợp đồng (đồng)',type:'money',req:true},{key:'start',label:'Ngày bắt đầu',type:'date',req:true},{key:'end',label:'Ngày kết thúc',type:'date',req:true},{key:'guarantee',label:'Bảo lãnh thực hiện HĐ (số, ngân hàng phát hành)'},{key:'guaranteeUntil',label:'Bảo lãnh thực hiện HĐ hiệu lực đến',type:'date'},{key:'advanceRate',label:'Tỷ lệ tạm ứng (%)',type:'percent'},{key:'advanceGuaranteeUntil',label:'Bảo lãnh tạm ứng hiệu lực đến',type:'date'},{key:'note',label:'Ghi chú',type:'textarea'},
  ...CONTRACT_DOCS.map(([kind,l],i)=>({key:'att'+i,label:l,type:'attach',col:'contracts',kind}))];
ACT['add-contract']=(kid)=>openForm({title:'Nhập thông tin hợp đồng', fields:contractFields(), onSave:v=>{ if(v.end<v.start){ $('#mform_err').textContent='Ngày kết thúc phải sau ngày bắt đầu.'; return false; } return save('contracts',{...v, packageId:kid, projectId:pkgOf(kid).projectId}); }});
ACT['edit-contracts']=(id)=>openForm({title:'Cập nhật hợp đồng', fields:contractFields(), value:get('contracts',id), onSave:v=>save('contracts',v)});
const addFields=()=>[{key:'number',label:'Số phụ lục',req:true},{key:'date',label:'Ngày ký',type:'date',req:true},{key:'content',label:'Nội dung điều chỉnh',type:'textarea',req:true},{key:'valueChange',label:'Giá trị điều chỉnh (+ tăng / − giảm, đồng)',type:'number',def:0},{key:'daysChange',label:'Gia hạn thời gian (ngày)',type:'number',def:0},{key:'wfnote',type:'html',label:'',full:true,html:'<p class="small muted" style="margin:0">Phụ lục lưu ở trạng thái Soạn thảo; bấm Trình duyệt để Lãnh đạo Ban duyệt. Chỉ phụ lục đã duyệt mới cộng vào giá trị và thời hạn hợp đồng.</p>'},{key:'att',label:'Phụ lục đã ký, văn bản đề nghị điều chỉnh',type:'attach',col:'addenda'}];
ACT['add-addendum']=(cid)=>openForm({title:'Thêm phụ lục hợp đồng', fields:addFields(), onSave:v=>save('addenda',{...v, contractId:cid},'Phụ lục '+v.number)});
ACT['edit-addenda']=(id)=>openForm({title:'Cập nhật phụ lục', fields:addFields(), value:get('addenda',id), onSave:v=>save('addenda',v,'Phụ lục '+v.number)});
ACT['goto-kl']=(cid)=>{ S.f.klc=cid; location.hash='khoi-luong'; };
ACT['goto-tt']=(cid)=>{ S.f.ttc=cid; location.hash='thanh-toan'; };
ACT['goto-td']=(kid)=>{ S.f.tdk=kid; location.hash='tien-do'; };

/* ===== QUẢN LÝ TIẾN ĐỘ (UC15–19) ===== */
VIEWS['tien-do']=()=>{
  const kid=S.f.tdk||''; const mode=S.tab.td||'goi-thau';
  const sch=D('schedule').filter(s=>inFilter(s.projectId) && (!kid||s.packageId===kid));
  const al=alerts().filter(a=>a.mod==='tien-do');
  const ed=can('tien-do','edit');
  let summary;
  if(mode==='du-an'){
    const ps=projects().filter(p=>inFilter(p.id) && sch.some(s=>s.projectId===p.id));
    summary=table([{h:'Dự án',f:r=>`${esc(r.code)} · ${esc(r.name)}`},{h:'Kế hoạch đến nay',r:1,f:r=>fmtP(projExpected(r.id))},{h:'Thực tế',f:r=>`<div style="min-width:140px">${progBar(projProgress(r.id), projExpected(r.id)-projProgress(r.id)>10?'warn':'')}</div>`},{h:'Chênh lệch',r:1,f:r=>{ const d=projProgress(r.id)-projExpected(r.id); return `<span style="color:${d<-10?'var(--red)':d<0?'var(--amber)':'var(--green)'}">${d>0?'+':''}${fmtP(d)}</span>`; }},{h:'Hạng mục chậm',r:1,f:r=>sch.filter(s=>s.projectId===r.id && ['warn','bad'].includes(schedState(s).k)).length}], ps);
  } else {
    const ks=D('packages').filter(k=>sch.some(s=>s.packageId===k.id)).sort(by('code'));
    summary=table([{h:'Gói thầu',f:r=>`${esc(r.code)} · ${esc(r.name)}`},{h:'Dự án',f:r=>esc((projOf(r.projectId)||{}).code)},{h:'Kế hoạch đến nay',r:1,f:r=>fmtP(pkgExpected(r.id))},{h:'Thực tế',f:r=>`<div style="min-width:140px">${progBar(pkgProgress(r.id), pkgExpected(r.id)-pkgProgress(r.id)>10?'warn':'')}</div>`},{h:'Chênh lệch',r:1,f:r=>{ const d=pkgProgress(r.id)-pkgExpected(r.id); return `<span style="color:${d<-10?'var(--red)':d<0?'var(--amber)':'var(--green)'}">${d>0?'+':''}${fmtP(d)}</span>`; }},{h:'Hạng mục chậm',r:1,f:r=>sch.filter(s=>s.packageId===r.id && ['warn','bad'].includes(schedState(s).k)).length}], ks, {rowAct:'open-pkg'});
  }
  return `<div class="head"><div class="grow"><h1>Quản lý tiến độ</h1><p>${sch.length} hạng mục tiến độ · ${sch.filter(s=>['warn','bad'].includes(schedState(s).k)).length} hạng mục chậm hoặc quá hạn</p></div>${ed?`<button class="btn primary" data-act="add-sched">+ Lập kế hoạch tiến độ</button>`:''}</div>
  <div class="toolbar"><select data-f="tdk" aria-label="Gói thầu">${opts(pkgOpts(S.pid),kid,'Tất cả gói thầu')}</select></div>
  ${al.length?`<div class="card"><h2>Cảnh báo chậm tiến độ</h2><div class="list">${al.map(a=>`<div class="alert ${a.lvl==='bad'?'bad':''}">${a.text}</div>`).join('')}</div></div>`:''}
  <div class="card"><div class="ch"><h2>Theo dõi tiến độ</h2><div class="tabs" style="border:0">${[['du-an','Theo dự án'],['goi-thau','Theo gói thầu']].map(([k,l])=>`<button class="${mode===k?'on':''}" data-act="tab" data-g="td" data-id="${k}">${l}</button>`).join('')}</div></div>${summary}</div>
  <div class="card"><div class="ch"><h2>Biểu đồ tiến độ (Gantt)</h2><span class="legend" style="margin:0"><span><i style="background:var(--accent)"></i>Đã thực hiện</span><span><i style="background:var(--amber)"></i>Chậm</span><span><i style="background:var(--red)"></i>Quá hạn</span><span><i style="background:transparent;border-left:2px dashed var(--red);border-radius:0"></i>Hôm nay</span></span></div>${gantt(sch, ed)}</div>`;
};
function gantt(sch, ed){
  if(!sch.length) return emptyBox('Chưa có kế hoạch tiến độ.');
  let st=sch.map(s=>s.planStart).sort()[0], en=sch.map(s=>s.planEnd).sort().slice(-1)[0];
  st=st.slice(0,7)+'-01'; const e=new Date(en); en=isoLocal(new Date(e.getFullYear(), e.getMonth()+1, 0));
  const span=Math.max(1,days(st,en)); const X=d=>Math.max(0,Math.min(100,days(st,d)/span*100));
  let months=''; let d=new Date(st); const step=span>900?3:span>420?2:1; let i=0;
  while(isoLocal(d)<=en){ if(i%step===0) months+=`<span class="gmonth" style="left:${X(isoLocal(d))}%">${pad(d.getMonth()+1)}/${String(d.getFullYear()).slice(2)}</span>`; d=new Date(d.getFullYear(), d.getMonth()+1, 1); i++; }
  const today=TODAY>=st&&TODAY<=en?`<span class="gtoday" style="left:${X(TODAY)}%"></span>`:'';
  const groups={}; sch.forEach(s=>{ (groups[s.packageId]=groups[s.packageId]||[]).push(s); });
  let rows='';
  Object.entries(groups).sort((a,b)=>((pkgOf(a[0])||{}).code||'').localeCompare((pkgOf(b[0])||{}).code||'')).forEach(([kid,arr])=>{
    const k=pkgOf(kid)||{code:'?',name:''};
    rows+=`<div class="grow-row pk"><div>${esc(k.code)} · ${esc(k.name)}</div><div class="gtrack">${today}</div><div class="num small">${fmtP(pkgProgress(kid))}</div></div>`;
    arr.sort(by('planStart')).forEach(s=>{
      const stt=schedState(s); const l=X(s.planStart), w=Math.max(.8,X(s.planEnd)-l);
      rows+=`<div class="grow-row"><div><div>${esc(s.name)}</div><div class="small muted num">${fmtDate(s.planStart)} – ${fmtDate(s.planEnd)} · ${pill(stt.t, stt.k)}</div></div>
        <div class="gtrack">${today}<div class="gplan ${stt.k==='warn'?'warn':stt.k==='bad'?'bad':''}" style="left:${l}%;width:${w}%" title="${esc(s.name)}: ${N(s.progress)}%"><i style="width:${Math.min(100,N(s.progress))}%"></i></div></div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end"><span class="num" style="font-weight:600">${N(s.progress)}%</span>${ed?`<button class="btn sm ghost" data-act="upd-sched" data-id="${s.id}">Cập nhật</button>`:''}<button class="btn sm ghost" data-act="sched-more" data-id="${s.id}">⋯</button></div></div>`;
    });
  });
  return `<div class="tw" style="border:0"><div class="gantt"><div class="grow-row hd"><div>Hạng mục</div><div class="gtrack" style="height:24px">${months}</div><div style="text-align:right">Thực tế</div></div>${rows}</div></div>`;
}
const schedFields=()=>[{key:'packageId',label:'Gói thầu',type:'select',options:()=>pkgOpts(S.pid),req:true,full:true,def:S.f.tdk},{key:'name',label:'Tên hạng mục / công việc',req:true,full:true},
  {key:'planStart',label:'Bắt đầu kế hoạch',type:'date',req:true},{key:'planEnd',label:'Kết thúc kế hoạch',type:'date',req:true},{key:'weight',label:'Trọng số (tỷ trọng giá trị, %)',type:'number',def:10},
  {key:'att',label:'Tiến độ được duyệt, tài liệu kèm theo (PDF, Excel, MS Project…)',type:'attach',col:'schedule',kind:'Kế hoạch tiến độ'},
  {key:'itemId',label:'Gắn với hạng mục công trình',type:'select',options:()=>D('items').filter(i=>!S.pid||i.projectId===S.pid).map(i=>[i.id,(projOf(i.projectId)||{}).code+' · '+i.code+' – '+i.name])}];
ACT['add-sched']=()=>openForm({title:'Lập kế hoạch tiến độ', fields:schedFields(), onSave:v=>{ if(v.planEnd<v.planStart){ $('#mform_err').textContent='Ngày kết thúc phải sau ngày bắt đầu.'; return false; } return save('schedule',{...v, projectId:pkgOf(v.packageId).projectId, progress:0, history:[]}); }});
ACT['edit-schedule']=(id)=>openForm({title:'Điều chỉnh kế hoạch tiến độ', fields:schedFields(), value:get('schedule',id), onSave:v=>save('schedule',{...v, projectId:pkgOf(v.packageId).projectId})});
ACT['upd-sched']=(id)=>{ const s=get('schedule',id);
  openForm({title:'Cập nhật tiến độ: '+s.name, narrow:true, fields:[{key:'progress',label:'Tiến độ thực tế lũy kế (%)',type:'percent',req:true,full:true},{key:'date',label:'Ngày cập nhật',type:'date',req:true,def:TODAY,full:true},{key:'note',label:'Ghi chú / nguyên nhân chậm',type:'textarea'},PROG_ATT(s.id)], value:{progress:s.progress},
    onSave:v=>{ const h=[...(s.history||[]).filter(x=>x.date!==v.date), {date:v.date, progress:v.progress, note:v.note||'', by:S.user.name}].sort(by('date')); return save('schedule',{...s, progress:h[h.length-1].progress, history:h, actualStart:s.actualStart||(v.progress>0?v.date:''), actualEnd:v.progress>=100?v.date:''}, s.name+' → '+v.progress+'%'); }}); };
/* Ảnh hiện trường, báo cáo kèm theo mỗi lần cập nhật tiến độ (gắn theo ngày cập nhật) */
const PROG_ATT=(sid)=>({key:'att',label:'Ảnh hiện trường, báo cáo tuần (không bắt buộc)',type:'attach',col:'schedule',kind:'Cập nhật tiến độ',refFrom:'date',rid:sid,photo:true,cur:null,accept:'image/*,.pdf,.doc,.docx,.xls,.xlsx'});
ACT['sched-more']=(id)=>{ const s=get('schedule',id); const h=[...(s.history||[])].sort(by('date',-1));
  openModal(`<div class="mform"><header><h3>${esc(s.name)}</h3><button class="icon-btn" data-close>×</button></header><div style="padding:16px;overflow:auto;display:flex;flex-direction:column;gap:12px">
  <dl class="kv"><dt>Gói thầu</dt><dd>${esc((pkgOf(s.packageId)||{}).code||'')}</dd><dt>Kế hoạch</dt><dd class="num">${fmtDate(s.planStart)} – ${fmtDate(s.planEnd)}</dd><dt>Thực tế</dt><dd class="num">${fmtDate(s.actualStart)} – ${fmtDate(s.actualEnd)}</dd><dt>Kế hoạch đến nay</dt><dd>${fmtP(expectedPct(s))}</dd><dt>Thực tế</dt><dd>${N(s.progress)}%</dd></dl>
  <dl class="kv"><dt>Tiến độ được duyệt</dt><dd>${attLinks(atts('schedule',s.id,'Kế hoạch tiến độ'))}</dd></dl>
  <h3>Lịch sử cập nhật</h3>${table([{h:'Ngày',f:r=>fmtDate(r.date)},{h:'Tiến độ',r:1,f:r=>r.progress+'%'},{h:'Ghi chú',k:'note'},{h:'Người cập nhật',k:'by'},{h:'Ảnh, tài liệu',f:r=>attLinks(atts('schedule',s.id,'Cập nhật tiến độ',r.date),{empty:'<span class="muted small">—</span>'})}], h.map(x=>({...x,id:x.date})), {empty:'Chưa có lần cập nhật nào.'})}
  ${can('tien-do','edit')?`<div class="toolbar"><button class="btn" data-act="edit-schedule" data-id="${s.id}">Điều chỉnh kế hoạch</button><button class="btn danger" data-act="del" data-col="schedule" data-id="${s.id}">Xóa hạng mục</button></div>`:''}</div></div>`); };

/* ===== NHẬT KÝ THI CÔNG (UC20–23) ===== */
const parseWorks = worksParse;
VIEWS['nhat-ky']=()=>{
  const kid=S.f.nkk||'', from=S.f.nkf||'', to=S.f.nkt||'', q=S.f.nkq||'';
  const rows=D('diaries').filter(d=>inFilter(d.projectId) && (!kid||d.packageId===kid) && (!from||d.date>=from) && (!to||d.date<=to) && has(d,q)).sort((a,b)=>b.date.localeCompare(a.date)||String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const ed=can('nhat-ky','edit');
  return `<div class="head"><div class="grow"><h1>Nhật ký thi công</h1><p>${rows.length} trang nhật ký · ${sum(rows,'workers')} lượt nhân công</p></div>${ed?`<button class="btn primary" data-act="add-diary">+ Ghi nhật ký</button>`:''}</div>
  <div class="toolbar"><select data-f="nkk" aria-label="Gói thầu">${opts(pkgOpts(S.pid),kid,'Tất cả gói thầu')}</select><input type="date" data-f="nkf" value="${esc(from)}" aria-label="Từ ngày"><input type="date" data-f="nkt" value="${esc(to)}" aria-label="Đến ngày"><input type="search" data-f="nkq" value="${esc(q)}" placeholder="Tra cứu nội dung, sự cố…" aria-label="Tra cứu nhật ký"></div>
  <div class="list">${rows.slice(0, S.nkn||10).map(d=>{ const k=pkgOf(d.packageId)||{}; const w=parseWorks(d.works); return `<article class="card"><div class="ch"><div style="flex:1;min-width:200px"><h3><span class="num">${fmtDate(d.date)}</span> · ${esc(k.code||'')} ${esc(k.name||'')}</h3><div class="small muted">${esc(d.shift||'')} · Thời tiết: ${esc(d.weather||'—')} · Nhân công: <b class="num">${N(d.workers)}</b> · ${esc(d.machines||'')}</div></div>
      ${ed?`<button class="btn sm ghost" data-act="diary-photo" data-id="${d.id}">${ic('cam').replace('<svg','<svg width="15" height="15"')} Thêm ảnh</button><button class="btn sm ghost" data-act="edit-diaries" data-id="${d.id}">Sửa</button><button class="btn sm ghost danger" data-act="del" data-col="diaries" data-id="${d.id}">Xóa</button>`:''}</div>
      ${w.length?`<div class="tw" style="margin-top:6px"><table><thead><tr><th>Công việc thực hiện</th><th class="r">Khối lượng</th><th>Đơn vị</th></tr></thead><tbody>${w.map(x=>`<tr><td>${esc(x.name)}</td><td class="r">${esc(x.qty||'')}</td><td>${esc(x.unit||'')}</td></tr>`).join('')}</tbody></table></div>`:''}
      ${d.issues?`<div class="alert" style="margin-top:8px"><span><b>Vướng mắc, sự cố:</b> ${esc(d.issues)}</span></div>`:''}
      ${(d.photos||[]).length?`<div class="thumbs" style="margin-top:8px">${d.photos.map(p=>`<figure><img src="${esc(fileUrl(p))}" alt="${esc(p.caption||p.name||'Ảnh hiện trường')}" title="${esc(p.caption||'')}" data-act="photo" loading="lazy">${p.caption?`<figcaption>${esc(p.caption)}</figcaption>`:''}</figure>`).join('')}</div>`:''}
      ${atts('diaries',d.id).length?`<div class="small" style="margin-top:6px"><b>Tệp đính kèm:</b> ${attLinks(atts('diaries',d.id))}</div>`:''}
      <div class="small muted" style="margin-top:6px">Xác nhận: ${esc(d.supervisor||'—')} · Người ghi: ${esc(d.byName||'—')}</div></article>`; }).join('') || emptyBox('Không có nhật ký phù hợp.', ed?`<button class="btn primary" data-act="add-diary">+ Ghi nhật ký</button>`:'')}</div>
  ${rows.length>(S.nkn||10)?`<div class="pager"><span class="small muted">Đang xem ${S.nkn||10} / ${rows.length} trang nhật ký</span><span class="sp"></span><button class="btn" data-act="nk-more">Xem thêm 10 trang nhật ký</button></div>`:''}`;
};
ACT['nk-more']=()=>{ S.nkn=(S.nkn||10)+10; render(); };
const diaryFields=()=>[{key:'packageId',label:'Gói thầu',type:'select',options:()=>pkgOpts(S.pid).filter(([id])=>{ const k=pkgOf(id); return k && /xây lắp|hỗn hợp|mua sắm/i.test(k.type); }),req:true,full:true,def:S.f.nkk},
  {key:'date',label:'Ngày',type:'date',req:true,def:TODAY},{key:'shift',label:'Ca làm việc',type:'select',options:['Cả ngày','Ca sáng','Ca chiều','Ca đêm'],def:'Cả ngày'},
  {key:'weather',label:'Thời tiết',type:'select',options:()=>catalog('Thời tiết')},{key:'workers',label:'Số nhân công',type:'number'},{key:'machines',label:'Máy móc, thiết bị',full:true},
  {key:'works',label:'Công việc thực hiện',type:'works',req:true},{key:'issues',label:'Vướng mắc, sự cố, kiến nghị',type:'textarea',rows:2},
  {key:'supervisor',label:'Cán bộ giám sát xác nhận'},{key:'photos_new',label:'Hình ảnh hiện trường',type:'files',multiple:true,accept:'image/*',hint:'Ảnh được lưu vào kho tệp trên máy chủ (tự thu nhỏ còn tối đa 1920 px).'},
  {key:'att',label:'Trang nhật ký đã ký (bản scan PDF/ảnh), biên bản hiện trường',type:'attach',col:'diaries',kind:'Trang nhật ký đã ký'}];
async function diaryPhotos(v){
  const files=v.photos_new||[]; delete v.photos_new; const ph=[...(v.photos||[])];
  for(const f of files){ const p=await storePhoto(f); ph.push({...p, date:TODAY, by:S.user.name}); }
  v.photos=ph; return v;
}
ACT['add-diary']=()=>openForm({title:'Ghi nhật ký thi công', fields:diaryFields(), onSave:async v=>{ await diaryPhotos(v); return save('diaries',{...v, projectId:pkgOf(v.packageId).projectId, byName:S.user.name}, fmtDate(v.date)+' '+(pkgOf(v.packageId)||{}).code); }});
ACT['edit-diaries']=(id)=>openForm({title:'Cập nhật nhật ký thi công', fields:diaryFields(), value:get('diaries',id), onSave:async v=>{ await diaryPhotos(v); return save('diaries',{...v, projectId:pkgOf(v.packageId).projectId}, fmtDate(v.date)); }});
/* Quản lý ảnh hiện trường: thêm ảnh, ghi chú thích, bỏ ảnh tải nhầm */
ACT['diary-photo']=(id)=>{ const d=get('diaries',id); const ph=d.photos||[];
  const grid=ph.length?`<div class="photo-edit" id="ph_edit">${ph.map((p,i)=>`<figure data-i="${i}"><img src="${esc(fileUrl(p))}" alt=""><input type="text" placeholder="Chú thích ảnh" value="${esc(p.caption||'')}" data-cap="${i}" aria-label="Chú thích ảnh ${i+1}"><label class="small"><input type="checkbox" data-rm="${i}" onchange="this.closest('figure').classList.toggle('del',this.checked)"> Bỏ ảnh này</label></figure>`).join('')}</div>`:'<p class="muted small">Chưa có ảnh.</p>';
  openForm({title:'Hình ảnh hiện trường '+fmtDate(d.date), fields:[{key:'cur',label:'Ảnh hiện có',type:'html',full:true,html:grid},{key:'photos_new',label:'Thêm ảnh (có thể chọn nhiều)',type:'files',multiple:true,accept:'image/*',full:true}], value:d,
    onSave:async v=>{ const keep=[]; ph.forEach((p,i)=>{ if(!$(`[data-rm="${i}"]`)?.checked) keep.push({...p, caption:($(`[data-cap="${i}"]`)?.value||'').trim()}); });
      v.photos=keep; await diaryPhotos(v); return save('diaries',v,'Ảnh nhật ký '+fmtDate(d.date)); }}); };
