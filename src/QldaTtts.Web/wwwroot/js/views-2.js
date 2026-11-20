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
  return `<div class="head"><div class="grow"><h1>Mô hình hóa công trình</h1><p>${esc(p.code)} – ${esc(p.name)}</p></div>
    ${!S.pid?`<select data-f="mhp" aria-label="Chọn dự án">${opts(projOpts(),pid)}</select>`:''}${ed?`<button class="btn primary" data-act="add-model" data-id="${pid}">+ Tải lên tệp mô hình</button>`:''}</div>
  <div class="grid g4"><div class="card kpi"><div class="eyebrow">Tệp mô hình</div><div class="v">${latestAll.length}</div><div class="s">${files.length} phiên bản lưu trữ</div></div>
    <div class="card kpi"><div class="eyebrow">Dung lượng lưu trữ</div><div class="v">${fmtSize(sum(files,'size'))}</div><div class="s">Tất cả phiên bản</div></div>
    <div class="card kpi"><div class="eyebrow">Hạng mục công trình</div><div class="v">${items.length}</div><div class="s">${items.filter(i=>files.some(m=>m.itemId===i.id)).length} hạng mục đã có mô hình</div></div>
    <div class="card kpi"><div class="eyebrow">Cập nhật gần nhất</div><div class="v" style="font-size:1.05rem">${last?fmtDate(last.date):'—'}</div><div class="s">${last?esc(last.name)+' v'+N(last.version):''}</div></div></div>
  <div class="toolbar"><input type="search" data-f="mhq" value="${esc(q)}" placeholder="Tìm tên tệp, nội dung thay đổi, hạng mục, kết cấu…" aria-label="Tìm kiếm mô hình"><select data-f="mhf" aria-label="Định dạng">${opts(catalog('Định dạng mô hình'),fm,'Mọi định dạng')}</select><select data-f="mhi" aria-label="Hạng mục">${opts(items.map(i=>[i.id,i.code+' · '+i.name]),it,'Mọi hạng mục')}</select></div>
  <div class="card"><div class="ch"><h2>Tệp mô hình công trình</h2></div>
  ${table([{h:'Tên tệp',f:r=>`<b style="font-weight:600">${esc(r.name)}</b><div class="small muted">${esc(r.note||'')}</div>`},{h:'Định dạng',f:r=>pill(r.format,'info')},{h:'Phiên bản',r:1,f:r=>'v'+N(r.version)},{h:'Hạng mục',f:r=>esc(itemName(r.itemId))},{h:'Cập nhật',f:r=>`<span class="num">${fmtDate(r.date)}</span><div class="small muted">${esc(r.by||'')}</div>`},{h:'Dung lượng',r:1,f:r=>fmtSize(r.size)},
    {h:'Tệp',f:r=>fileUrl(r)?`<a href="${esc(fileUrl(r))}" target="_blank" rel="noopener" ${isPdf(r)?pdfAttr(fileUrl(r),r.fileName):''}>${isPdf(r)?'Xem':'Tải về'}</a>`:'<span class="small muted">Chưa có tệp</span>'}], latest,
    {actions:r=>`<button class="btn sm ghost" data-act="model-hist" data-id="${r.id}">Lịch sử (${files.filter(m=>keyOf(m)===keyOf(r)).length})</button>`+(ed?`<button class="btn sm ghost" data-act="model-ver" data-id="${r.id}">Cập nhật phiên bản</button><button class="btn sm ghost" data-act="edit-models" data-id="${r.id}">Sửa</button><button class="btn sm ghost danger" data-act="del" data-col="models" data-id="${r.id}">Xóa</button>`:''), empty:q||fm||it?'Không có tệp phù hợp.':'Chưa có tệp mô hình.'})}
  <p class="small muted" style="margin:8px 0 0">Phần mềm lưu trữ, quản lý phiên bản và tra cứu tệp mô hình do đơn vị tư vấn, nhà thầu lập (IFC, RVT, DWG, NWD, PDF…). Việc dựng và xem chi tiết mô hình thực hiện trên phần mềm chuyên dụng sau khi tải tệp về.</p></div>
  <div class="card"><div class="ch"><h2>Thông tin các hạng mục công trình</h2>${ed?`<button class="btn primary sm" data-act="add-item" data-id="${pid}">+ Thêm hạng mục</button>`:''}</div>
  ${table([{h:'Mã',f:r=>`<span class="num" style="white-space:nowrap">${esc(r.code)}</span>`},{h:'Tên hạng mục',f:r=>`<b style="font-weight:600">${esc(r.name)}</b><div class="small muted">${esc(r.desc||'')}</div>`},{h:'Kết cấu / vật liệu',k:'structure'},{h:'Diện tích (m²)',r:1,f:r=>fmtN(r.area)},{h:'Số tầng',r:1,f:r=>N(r.floors)||'—'},{h:'Tệp',f:r=>attCell(atts('items',r.id),true)},{h:'Tệp mô hình',r:1,f:r=>latestAll.filter(m=>m.itemId===r.id).length},{h:'Tiến độ',f:r=>`<div style="min-width:110px">${progBar(itemProgress(r))}${itemInherited(r)?'<div class="small muted" title="Hạng mục chưa có đầu việc tiến độ riêng">theo tiến độ dự án</div>':''}</div>`}], fItems,
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
  openModal(`<div class="mform"><header><h3>Lịch sử phiên bản: ${esc(m.name)}</h3><button class="icon-btn" data-close>×</button></header><div style="padding:16px;overflow:auto">${table([{h:'Phiên bản',f:r=>'v'+r.version},{h:'Ngày',f:r=>fmtDate(r.date)},{h:'Đơn vị',k:'by'},{h:'Nội dung thay đổi',k:'note'},{h:'Dung lượng',r:1,f:r=>fmtSize(r.size)},{h:'Tệp',f:r=>fileUrl(r)?`<a href="${esc(fileUrl(r))}" target="_blank" rel="noopener" ${isPdf(r)?pdfAttr(fileUrl(r),r.fileName):''}>${isPdf(r)?'Xem':'Tải về'}</a>`:'—'}], vs)}</div></div>`); };

/* ===== GÓI THẦU VÀ HỢP ĐỒNG (UC10–14) ===== */
const pkgFields=()=>[{key:'projectId',label:'Thuộc dự án',type:'select',options:projOpts,req:true,full:true,def:S.pid},{key:'code',label:'Ký hiệu gói thầu',req:true},{key:'type',label:'Loại gói thầu',type:'select',options:()=>catalog('Loại gói thầu'),req:true},
  {key:'phase',label:'Giai đoạn',type:'select',options:phaseOpts,req:true,def:routePh(),hint:XD('Gói tư vấn khảo sát, lập báo cáo kinh tế - kỹ thuật, thiết kế, dự toán… thuộc chuẩn bị đầu tư; gói thi công, mua sắm, tư vấn giám sát… thuộc thực hiện đầu tư.','Gói lập, thẩm tra báo cáo kinh tế - kỹ thuật, thẩm định giá… thuộc chuẩn bị đầu tư; gói lập và thẩm định HSMT, quản lý dự án, giám sát, kiểm thử, triển khai, mua sắm… thuộc thực hiện đầu tư. Gói tư vấn ở cả hai giai đoạn nghiệm thu, thanh toán theo sản phẩm.')},
  {key:'name',label:'Tên gói thầu',req:true,full:true},{key:'method',label:'Hình thức lựa chọn nhà thầu',type:'select',options:()=>catalog('Hình thức lựa chọn nhà thầu')},{key:'estimate',label:'Giá gói thầu (đồng)',type:'money',req:true},
  {key:'status',label:'Trạng thái',type:'select',options:()=>catalog('Trạng thái gói thầu'),req:true},{key:'duration',label:'Thời gian thực hiện gói thầu'}];
/* Gói thầu: nhập kèm QĐ phê duyệt KHLCNT và QĐ phê duyệt kết quả LCNT (lưu thành hồ sơ pháp lý gói thầu kèm tệp) */
function pkgForm(k){
  const ctx={}; const kh=k&&findLegal(k.projectId,k.id,'Kế hoạch lựa chọn nhà thầu'), kq=k&&findLegal(k.projectId,k.id,'Kết quả lựa chọn nhà thầu');
  const fields=[...pkgFields(), ...pkgOrgFields(), ...legalInline('kh','QĐ phê duyệt KHLCNT',ctx,kh), ...legalInline('kq','QĐ phê duyệt kết quả LCNT',ctx,kq)];
  const value=legalInlineValue('kq', kq, legalInlineValue('kh', kh, {...(k||{}), ...pkgOrgValue(k||{}), phase:k?pkgPhase(k):routePh()}));
  openForm({title:k?'Cập nhật gói thầu':'Thêm gói thầu', fields, value, onSave:async v=>{
    const pv={...v}; ['kh','kq'].forEach(p=>['No','Date','Issuer','Att'].forEach(x=>delete pv[p+x])); await pkgOrgApply(pv);
    const r=await save('packages',pv); if(!k) S.sel.pkg=r.id;
    if(pkgPhase(r)!==routePh()) setTimeout(()=>{ toast(`Gói thầu ${r.code} thuộc giai đoạn ${PHASES[pkgPhase(r)].toLowerCase()}, đã chuyển sang mục tương ứng.`); goPkg(r.id); }, 0);
    const base={projectId:r.projectId, packageId:r.id, issuer:BR.ownerDefault};
    ctx.kh=await legalInlineSave('kh', v, kh, {...base, type:'Kế hoạch lựa chọn nhà thầu', title:(kh&&kh.title)||'Phê duyệt KHLCNT gói '+r.code, ...(kh?{issuer:kh.issuer}:{})});
    ctx.kq=await legalInlineSave('kq', v, kq, {...base, type:'Kết quả lựa chọn nhà thầu', title:(kq&&kq.title)||'Phê duyệt kết quả LCNT gói '+r.code, ...(kq?{issuer:kq.issuer}:{})});
    return r; }});
  pkgShareWire(k||{});
}
/* Ô tỷ lệ liên danh: hiện một ô cho mỗi thành viên đang chọn (đứng đầu + thành viên khác), cập nhật khi đổi lựa chọn */
function pkgShareWire(k){ const box=$('#f__shbox'); if(!box) return; const cur={...(k.contractorShares||{})};
  const read=()=>{ $$('input[data-org]',box).forEach(i=>{ const id=i.dataset.org==='_lead'?'_lead':i.dataset.org; cur[id]=i.value; }); };
  const draw=()=>{ read(); const sel=$('#f__ct_s'), nb=$('#f__ct .orgnew'); const leadNew=nb && !nb.hidden; const lead=leadNew?'_lead':(sel&&sel.value)||'';
    const ids=[lead, ...$$('#f__jv input:checked').map(i=>i.value).filter(id=>id!==lead)].filter(Boolean);
    if(ids.length<2){ box.innerHTML='<span class="small muted">Gói liên danh (đứng đầu và thành viên khác): nhập tỷ lệ liên danh của từng thành viên ở đây, cộng lại đúng 100%.</span>'; return; }
    box.innerHTML=ids.map(id=>{ const o=id==='_lead'? {name:($('#f__ct_n')||{}).value||'Nhà thầu mới'} : orgOf(id)||{}; const v=cur[id]??'';
      return `<label class="shrow"><span>${esc(o.shortName||o.name||'')}</span><input type="number" step="0.01" min="0" max="100" data-org="${esc(id)}" value="${esc(v)}" placeholder="%"></label>`; }).join('')
      + `<span class="small muted" id="f__shsum"></span>`; sum_(); };
  const sum_=()=>{ const t=$$('input[data-org]',box).reduce((a,i)=>a+(Number(String(i.value).replace(',','.'))||0),0); const s=$('#f__shsum'); if(s) s.textContent='Cộng: '+fmtP(t)+(Math.abs(t-100)>0.01?' (phải đúng 100%)':''); };
  const form=$('#mform'); form.addEventListener('change',e=>{ if(e.target.closest('#f__jv')||e.target.id==='f__ct_s') draw(); });
  form.addEventListener('input',e=>{ if(e.target.dataset && e.target.dataset.org) sum_(); });
  form.addEventListener('click',e=>{ if(e.target.closest('#f__ct [data-orgnew],#f__ct [data-orgback]')) setTimeout(draw,0); });
  draw(); }
ACT['add-pkg']=()=>pkgForm(null);
ACT['edit-packages']=(id)=>pkgForm(get('packages',id));
ACT['open-pkg']=(id,el,e)=>{ if(e && e.target.closest && e.target.closest('button')) return; goPkg(id); };
ACT['back-pkg']=()=>{ S.sel.pkg=null; render(); };
/* Hai mục "Gói thầu và hợp đồng" (chuẩn bị đầu tư, thực hiện đầu tư) là hai lát cắt của cùng một danh sách gói thầu */
VIEWS['goi-thau']=()=>pkgList('dt');
VIEWS['cb-goi-thau']=()=>pkgList('cb');
function pkgList(ph){
  const gt=S.tab.gt||'pkg'; if(gt!=='pkg') return orgPhaseView(ph);
  const k=S.sel.pkg&&get('packages',S.sel.pkg); if(k && pidOk(k.projectId) && pkgPhase(k)===ph) return pkgDetail(k);
  const q=S.f.kq||'', st=S.f.kst||'', ty=S.f.kty||'';
  const other=D('packages').filter(k=>inFilter(k.projectId) && pkgPhase(k)!==ph).length, oph=ph==='cb'?'dt':'cb';
  /* Bản 1.8.8: tìm theo tên gói, ký hiệu, dự án, số hợp đồng, nhà thầu; danh sách nhóm theo dự án */
  const rows=D('packages').filter(k=>inFilter(k.projectId) && pkgPhase(k)===ph && (!st||k.status===st) && (!ty||k.type===ty)).map(k=>{ const c=contractOfPkg(k.id); return {...k, c, cv:c?contractValue(c):0, done:c?pct(contractDone(c.id),contractValue(c)):0}; })
    .filter(r=>!q || has({code:r.code, name:r.name, pj:pjGroup(r.projectId), cn:r.c&&r.c.number, ct:r.c&&r.c.contractor, nt:pkgContractorName(r), gs:pkgSupervisorNames(r)},q)).sort(pkgSort);
  const gsum={}; rows.forEach(r=>{ const g=gsum[r.projectId]=gsum[r.projectId]||{n:0,v:0}; g.n++; g.v+=r.cv; });
  return `<div class="head"><div class="grow"><h1>Gói thầu và hợp đồng <span class="pill ${ph==='cb'?'info':'acc'}" style="vertical-align:middle;font-size:.8rem">${esc(PHASES[ph])}</span></h1><p>${rows.length} gói thầu, tổng giá gói thầu ${fmtTy(sum(rows,'estimate'))}; đã ký hợp đồng ${fmtTy(sum(rows,'cv'))}</p></div>${can('goi-thau','edit')&&!Store.meta.orgId?`<button class="btn primary" data-act="add-pkg">+ Thêm gói thầu</button>`:''}</div>
  ${orgTabs('pkg')}
  ${!rows.length&&!q&&!st&&!ty&&other?`<div class="alert info">Giai đoạn ${esc(PHASES[ph].toLowerCase())} chưa có gói thầu. ${other} gói thầu khác thuộc giai đoạn ${esc(PHASES[oph].toLowerCase())}, xem tại mục <a href="#${phRoute('goi-thau',oph)}">${esc(PHASES[oph])} › Gói thầu và hợp đồng</a>.</div>`:''}
  ${(()=>{ const al=alerts().filter(a=>a.mod==='goi-thau' && alertRoute(a)===S.route && (!a.pid||inFilter(a.pid))); return al.length?`<div class="card"><div class="ch"><h2>Cảnh báo gói thầu, hợp đồng (${al.length})</h2><a href="#canh-bao" class="small">Xem tất cả cảnh báo →</a></div>${alertList(al.slice(0,6))}</div>`:''; })()}
  <div class="toolbar"><input type="search" data-f="kq" value="${esc(q)}" placeholder="Tìm tên gói, dự án, số hợp đồng, nhà thầu…" aria-label="Tìm gói thầu"><select data-f="kty" aria-label="Loại">${opts(catalog('Loại gói thầu'),ty,'Mọi loại gói thầu')}</select><select data-f="kst" aria-label="Trạng thái">${opts(catalog('Trạng thái gói thầu'),st,'Mọi trạng thái')}</select></div>
  ${table([{h:'Gói thầu',f:r=>`<b style="font-weight:600">${esc(r.name)}</b> <span class="num small muted" style="white-space:nowrap">${esc(r.code)}</span><div class="small muted">${esc(r.type)}${r.method?' · '+esc(r.method):''}</div>${pkgContractorName(r)||pkgSupervisorNames(r)?`<div class="small">${[pkgContractorName(r)?'Nhà thầu: '+esc(pkgContractorName(r)):'', pkgSupervisorNames(r)?'Giám sát: '+esc(pkgSupervisorNames(r)):''].filter(Boolean).join(' · ')}</div>`:''}`},{h:'Giá gói thầu',r:1,f:r=>fmtTy(r.estimate)},
    {h:'Hợp đồng',f:r=>r.c?`<span class="num small">${cNumH(r.c)}</span><div class="small muted">${esc(ctShort(r.c))}</div>`:'<span class="muted small">Chưa ký</span>'},{h:'Giá trị HĐ',r:1,f:r=>r.c?fmtTy(r.cv):'—'},{h:'Thực hiện HĐ',f:r=>r.c?`<div style="min-width:110px">${progBar(pkgTrack(r).v)}</div>`:''},{h:'Trạng thái',f:r=>statusPill(r.status)}], rows, {rowAct:'open-pkg', pk:'pkg-'+ph, group:r=>{ const g=gsum[r.projectId]||{}; return `${esc(pjGroup(r.projectId))} <span class="small muted" style="font-weight:400">· ${g.n} gói${g.v?' · hợp đồng '+fmtTy(g.v):''}</span>`; }, empty:'Không có gói thầu phù hợp.'})}`;
}
/* Bản 1.8.8: dải "Các bước" của gói thầu: gói thầu → hợp đồng → sản phẩm (khối lượng) → nghiệm thu → thanh toán; bước còn thiếu có nút làm ngay */
function pkgSteps(k, c){
  const ed=can('goi-thau','edit'), edt=can('thanh-toan','edit'), prod=c? contractProd(c) : isTVPkg(k)||pkgPhase(k)==='cb';
  const cv=c?contractValue(c):0, boq=c?D('boq').filter(b=>b.contractId===c.id).length:0, acc=c?contractAcc(c.id):0, paid=c?contractPaid(c.id):0;
  const kq=findLegal(k.projectId,k.id,'Kết quả lựa chọn nhà thầu');
  const st=[
    {t:'Gói thầu', ok:true, s:(k.contractorIds||[]).length? 'Nhà thầu: '+esc(pkgContractorName(k)) : kq? 'Đã có kết quả lựa chọn nhà thầu' : 'Chưa chọn nhà thầu', b:!(k.contractorIds||[]).length&&ed?`<button class="btn sm" data-act="edit-packages" data-id="${k.id}">Chọn nhà thầu</button>`:''},
    {t:'Hợp đồng', ok:!!c, s:c? `${cNumH(c)} · ${fmtTy(cv)}` : 'Chưa nhập hợp đồng', b:!c&&ed?`<button class="btn sm primary" data-act="add-contract" data-id="${k.id}">Nhập hợp đồng</button>`:''},
    {t:prod?'Sản phẩm của hợp đồng':'Bảng khối lượng', ok:boq>0, s:boq? boq+(prod?' sản phẩm':' dòng khối lượng') : (prod?'Chưa khai báo sản phẩm':'Chưa lập bảng khối lượng'), b:c&&!boq&&(ed||edt)?`<button class="btn sm primary" data-act="goto-kl" data-id="${c.id}">${prod?'Khai báo sản phẩm':'Lập bảng khối lượng'}</button>`:''},
    {t:'Nghiệm thu', ok:cv>0 && acc>=cv-1, part:acc>0, s:c? (acc? fmtTy(acc)+' · '+fmtP(pct(acc,cv)) : 'Chưa nghiệm thu') : '—', b:c&&boq&&acc<cv-1?`<button class="btn sm" data-act="goto-kl" data-id="${c.id}">${prod?'Nghiệm thu sản phẩm':'Nghiệm thu khối lượng'}</button>`:''},
    {t:'Thanh toán', ok:cv>0 && paid>=cv-1, part:paid>0, s:c? (paid? fmtTy(paid)+' · '+fmtP(pct(paid,cv)) : 'Chưa thanh toán') : '—', b:c&&paid<cv-1?`<button class="btn sm" data-act="goto-tt" data-id="${c.id}">Thanh toán</button>`:''}];
  const now=st.findIndex(x=>!x.ok);
  return `<div class="card"><div class="ch"><h2>Các bước của gói thầu</h2><span class="small muted">${now<0?'Đã đủ các bước':'Bước tiếp theo: '+esc(st[now].t.toLowerCase())}</span></div><div class="steps">${st.map((x,i)=>`<div class="st ${x.ok?'ok':i===now?'now':''}"><span class="small">Bước ${i+1}${x.ok?' ✓':x.part?' · đang thực hiện':''}</span><b>${esc(x.t)}</b><span class="small">${x.s}</span>${x.b}</div>`).join('')}</div></div>`;
}
function pkgDetail(k){
  const p=projOf(k.projectId); const c=contractOfPkg(k.id); const ed=can('goi-thau','edit');
  let cBody='';
  if(!c) cBody=emptyBox('Gói thầu chưa có hợp đồng.', ed?`<button class="btn primary" data-act="add-contract" data-id="${k.id}">+ Nhập thông tin hợp đồng</button>`:'');
  else {
    const cv=contractValue(c), end=contractEnd(c), done=contractDone(c.id), acc=contractAcc(c.id), paid=contractPaid(c.id);
    const prod=contractProd(c); const tr=pkgTrack(k); const tEl=tr.mode==='done'?100:(c.start&&end? Math.min(100,pct(Math.max(0,days(c.start,TODAY)),days(c.start,end))):0); const sp=tr.v; const lag=tr.mode==='sched'? tEl-sp : 0;
    const ad=D('addenda').filter(a=>a.contractId===c.id).sort(by('date'));
    cBody=`<div class="grid g2"><div class="card"><div class="ch"><h2>Thông tin hợp đồng</h2>${wfOn('contracts',contractPid(c))||c.status?wfPill('contracts',c)+wfBtns('contracts',c):''}${ed&&wfEditable('contracts',c)?`<button class="btn sm" data-act="edit-contracts" data-id="${c.id}">Sửa</button><button class="btn sm ghost danger" data-act="del" data-col="contracts" data-id="${c.id}">Xóa</button>`:''}</div><dl class="kv">
      <dt>Số hợp đồng</dt><dd class="num">${cNumH(c)}</dd><dt>Nhà thầu</dt><dd>${esc(c.contractor)}</dd><dt>Ngày ký</dt><dd class="num">${fmtDate(c.signDate)}</dd><dt>Loại hợp đồng</dt><dd>${esc(c.ctype||'—')}</dd>
      <dt>Giá trị ký kết</dt><dd class="num">${fmtVND(c.value)} đ</dd><dt>Giá trị sau điều chỉnh</dt><dd class="num"><b>${fmtVND(cv)} đ</b></dd><dt>Thời gian thực hiện</dt><dd class="num">${fmtDate(c.start)} – ${fmtDate(end)}${end!==c.end?` <span class="pill warn">gia hạn ${days(c.end,end)} ngày</span>`:''}</dd>
      <dt>Bảo lãnh thực hiện</dt><dd>${esc(c.guarantee||'—')}${c.guaranteeUntil?` · hiệu lực đến <span class="num" style="${c.guaranteeUntil<=addDays(TODAY,30)?'color:var(--red);font-weight:600':''}">${fmtDate(c.guaranteeUntil)}</span>`:''}</dd><dt>Tỷ lệ tạm ứng</dt><dd>${c.advanceRate!=null?esc(c.advanceRate)+'%':'—'}${c.advanceGuaranteeUntil?` · bảo lãnh tạm ứng đến <span class="num" style="${c.advanceGuaranteeUntil<=addDays(TODAY,30)?'color:var(--red);font-weight:600':''}">${fmtDate(c.advanceGuaranteeUntil)}</span>`:''}</dd>
      ${CONTRACT_DOCS.map(([kind,l])=>`<dt>${l}</dt><dd>${attLinks(atts('contracts',c.id,kind))}</dd>`).join('')}</dl></div>
      <div class="card"><h2>Theo dõi tiến độ thực hiện hợp đồng</h2><div class="list">
        <div><div class="small muted">Thời gian hợp đồng đã qua</div>${progBar(tEl)}</div>
        <div><div class="small muted">${tr.mode==='sched'?XD('Tiến độ thi công','Tiến độ triển khai')+' (theo kế hoạch tiến độ gói thầu)':tr.mode==='done'?'Tiến độ thực hiện (gói thầu đã hoàn thành)':(D('boq').some(b=>b.contractId===c.id)?'Tiến độ thực hiện (theo giá trị nghiệm thu)':'Tiến độ thực hiện (theo giá trị đã thanh toán)')}</div>${progBar(sp, lag>15?'warn':'')}</div>
        ${prod?'':`<div><div class="small muted">Giá trị khối lượng thực hiện · ${fmtTy(done)}</div>${progBar(pct(done,cv), tEl-pct(done,cv)>15?'warn':'')}</div>`}
        <div><div class="small muted">${prod?'Giá trị nghiệm thu sản phẩm':'Giá trị nghiệm thu'} · ${fmtTy(acc)}</div>${progBar(pct(acc,cv))}</div>
        <div><div class="small muted">Giá trị đã thanh toán · ${fmtTy(paid)}</div>${progBar(pct(paid,cv))}</div>
        ${lag>15?`<div class="alert">${XD('Tiến độ thi công','Tiến độ triển khai')} đang chậm ${Math.round(lag)}% so với thời gian hợp đồng đã qua.</div>`:''}
        <div class="toolbar">${prod?`<button class="btn sm" data-act="goto-kl" data-id="${c.id}">Nghiệm thu sản phẩm</button><button class="btn sm" data-act="goto-tt" data-id="${c.id}">Thanh toán</button>${pkgPhase(k)==='dt'&&SCHED().some(s=>s.packageId===k.id)?`<button class="btn sm" data-act="goto-td" data-id="${k.id}">Tiến độ</button>`:''}`:`<button class="btn sm" data-act="goto-kl" data-id="${c.id}">Khối lượng</button><button class="btn sm" data-act="goto-tt" data-id="${c.id}">Thanh toán</button><button class="btn sm" data-act="goto-td" data-id="${k.id}">Tiến độ</button>`}</div></div></div></div>
      <div class="card"><div class="ch"><h2>Điều chỉnh, phụ lục hợp đồng</h2>${ed?`<button class="btn primary sm" data-act="add-addendum" data-id="${c.id}">+ Thêm phụ lục</button>`:''}</div>
      ${table([{h:'Số phụ lục',k:'number'},{h:'Ngày ký',f:r=>`<span class="num">${fmtDate(r.date)}</span>`},{h:'Nội dung điều chỉnh',k:'content'},{h:'Giá trị điều chỉnh',r:1,f:r=>(N(r.valueChange)>0?'+':'')+fmtVND(r.valueChange)},{h:'Gia hạn (ngày)',r:1,f:r=>N(r.daysChange)||'—'},{h:'Trạng thái',f:r=>wfPill('addenda',r)},{h:'Tệp',f:r=>attCell(atts('addenda',r.id))}], ad, {actions:r=>wfBtns('addenda',r)+wfEditBtns('addenda',r), empty:'Chưa có phụ lục điều chỉnh.', foot:ad.length?['Tổng đã duyệt','','',fmtVND(sum(ad.filter(addApproved),'valueChange')),sum(ad.filter(addApproved),'daysChange')||'—','','']:null})}
      ${(()=>{ const pd=contractPending(c); return pd.n? `<p class="small" style="margin:8px 0 0;color:var(--amber)">Đang chờ duyệt ${pd.n} phụ lục: ${pd.value>0?'+':''}${fmtVND(pd.value)} đồng${pd.days?', gia hạn '+pd.days+' ngày':''}. Chưa tính vào giá trị và thời hạn hợp đồng cho đến khi phụ lục được duyệt.</p>` : ''; })()}</div>`;
  }
  return `<div class="head"><div class="grow"><button class="btn ghost sm" data-act="back-pkg">← Danh sách gói thầu</button><h1 style="margin-top:8px">${esc(k.code)} · ${esc(k.name)}</h1><p>${esc(p?p.code+' – '+p.name:'')} · ${esc(PHASES[pkgPhase(k)])} · ${statusPill(k.status)}</p></div>${ed?`<button class="btn" data-act="edit-packages" data-id="${k.id}">Sửa gói thầu</button><button class="btn ghost danger" data-act="del" data-col="packages" data-id="${k.id}">Xóa</button>`:''}</div>
  ${(()=>{ const al=alerts({all:true}).filter(a=>a.kid===k.id); return al.length?`<div class="card"><h2>Cảnh báo của gói thầu (${al.length})</h2>${alertList(al.map(a=>a.go==='pkg|'+k.id?{...a,go:''}:a))}</div>`:''; })()}
  <div class="grid g4"><div class="card kpi"><div class="eyebrow">Loại gói thầu</div><div class="v" style="font-size:1.05rem;font-family:var(--f-ui)">${esc(k.type)}</div><div class="s">${esc(k.method||'')}</div></div><div class="card kpi"><div class="eyebrow">Giá gói thầu</div><div class="v">${fmtTy(k.estimate)}</div></div>
    <div class="card kpi"><div class="eyebrow">Giá trị hợp đồng</div><div class="v">${c?fmtTy(contractValue(c)):'—'}</div><div class="s">${(()=>{ if(!c||!N(k.estimate)) return ''; const d=contractValue(c)-N(k.estimate); if(Math.abs(d)<0.5) return 'Bằng giá gói thầu'; return d<0? 'Tiết kiệm '+fmtP(pct(-d,k.estimate))+' so với giá gói thầu' : `<span style="color:var(--red);font-weight:600">Vượt giá gói thầu ${fmtP(pct(d,k.estimate))}</span>`; })()}${c&&contractPending(c).n?`<br><span style="color:var(--amber)">Phụ lục chờ duyệt: ${fmtTy(contractPending(c).value)}</span>`:''}</div></div><div class="card kpi"><div class="eyebrow">Tiến độ gói thầu</div>${(()=>{ const t=pkgTrack(k); return `<div class="v">${fmtP(t.v)}</div><div class="s">${t.mode==='done'?'Đã hoàn thành':t.mode==='acc'?'Theo giá trị nghiệm thu, thanh toán':'Kế hoạch '+fmtP(t.plan)}</div>`; })()}</div></div>
  ${pkgSteps(k, c)}
  ${pkgOrgCard(k)}
  ${cBody}
  ${legalCard(D('legal').filter(l=>l.packageId===k.id), k.projectId, k.id, 'goi-thau', 'Hồ sơ pháp lý gói thầu')}`;
}
const CONTRACT_DOCS=[['Hợp đồng đã ký','Bản hợp đồng đã ký'],['Bảo lãnh thực hiện hợp đồng','Bảo lãnh thực hiện HĐ'],['Bảo lãnh tạm ứng','Bảo lãnh tạm ứng']];
const contractFields=()=>[{key:'number',label:'Số hợp đồng',hint:'Ghi đúng số trên hợp đồng đã ký. Chưa có số thì để trống, phần mềm ghi "Chưa có số hợp đồng" và nhắc bổ sung.'},{key:'signDate',label:'Ngày ký',type:'date'},{key:'_org',label:'Nhà thầu / Liên danh',type:'org',kind:'nt',req:true,full:true,hint:'Nhà thầu của hợp đồng phải trùng nhà thầu đã chọn ở gói thầu. Gói thầu chưa chọn nhà thầu thì được chọn theo hợp đồng này.'},{key:'ctype',label:'Loại hợp đồng',type:'select',options:()=>catalog('Loại hợp đồng')},
  {key:'value',label:'Giá trị hợp đồng (đồng)',type:'money',req:true},{key:'start',label:'Ngày bắt đầu',type:'date',req:true},{key:'end',label:'Ngày kết thúc',type:'date',req:true},{key:'guarantee',label:'Bảo lãnh thực hiện HĐ (số, ngân hàng phát hành)'},{key:'guaranteeUntil',label:'Bảo lãnh thực hiện HĐ hiệu lực đến',type:'date'},{key:'advanceRate',label:'Tỷ lệ tạm ứng (%)',type:'percent'},{key:'advanceGuaranteeUntil',label:'Bảo lãnh tạm ứng hiệu lực đến',type:'date'},{key:'note',label:'Ghi chú',type:'textarea'},
  ...CONTRACT_DOCS.map(([kind,l],i)=>({key:'att'+i,label:l,type:'attach',col:'contracts',kind}))];
ACT['add-contract']=(kid)=>openForm({wf:'contracts', title:'Nhập thông tin hợp đồng', fields:contractFields(), value:{_org:((pkgOf(kid)||{}).contractorIds||[])[0]||''}, onSave:async v=>{ if(v.end<v.start){ $('#mform_err').textContent='Ngày kết thúc phải sau ngày bắt đầu.'; return false; } if(!await contractOrgSync(v, kid)) return false; return save('contracts',{...v, packageId:kid, projectId:pkgOf(kid).projectId}); }});
ACT['edit-contracts']=(id)=>openForm({wf:'contracts', title:'Cập nhật hợp đồng', fields:contractFields(), value:contractOrgValue(get('contracts',id)), onSave:async v=>{ if(!await contractOrgSync(v, get('contracts',id).packageId)) return false; return save('contracts',v); }});
/* Bản 1.8.3: nhà thầu của hợp đồng lấy theo danh mục nhà thầu và phải khớp nhà thầu đã chọn ở gói thầu.
   Gói thầu chưa chọn nhà thầu thì chọn luôn đơn vị này; tên chưa có trong danh mục thì thêm vào danh mục. */
async function contractOrgSync(v, kid){
  const k=pkgOf(kid); const o=await orgResolve(v._org); v._org=undefined; if(!o){ $('#mform_err').textContent='Vui lòng chọn nhà thầu.'; return false; }
  const ids=(k&&k.contractorIds)||[];
  if(ids.length && !ids.includes(o.id)){ $('#mform_err').textContent=`Gói thầu ${k.code} đã chọn nhà thầu "${pkgContractorName(k)}". Nhà thầu của hợp đồng phải trùng nhà thầu của gói thầu; cần đổi thì sửa nhà thầu ở gói thầu trước.`; return false; }
  v.contractor= ids.length>1 && k.jointVenture? k.jointVenture : o.name;
  if(k && !ids.length) await save('packages',{...k, contractorIds:[o.id]});
  return true; }
/* Hợp đồng cũ chỉ có tên nhà thầu gõ tay: tìm đơn vị trong danh mục theo nhà thầu của gói thầu, rồi theo tên */
function contractOrgValue(c){ const k=pkgOf(c.packageId)||{}; const ids=k.contractorIds||[];
  const byName=D('orgs').find(o=>o.kind==='nt' && (normKey(o.name)===normKey(c.contractor)||(o.shortName && normKey(o.shortName)===normKey(c.contractor))));
  const id=ids.find(id=>byName && id===byName.id) || ids[0] || (byName||{}).id || '';
  /* Chưa có trong danh mục: mở sẵn ô thêm mới với tên đang ghi, lưu hợp đồng thì đơn vị vào danh mục */
  return {...c, _org: id || (String(c.contractor||'').trim()? {_new:{name:String(c.contractor).trim()}} : '')}; }
/* Đơn vị chọn hoặc thêm mới ở ô kiểu 'org': trả về bản ghi danh mục (thêm mới thì lưu vào danh mục; trùng tên hoặc mã số thuế thì dùng đơn vị đã có) */
async function orgResolve(val){ if(!val) return null; if(typeof val==='string') return orgOf(val);
  const n=val._new; const d=orgDupe({...n, id:''}); if(d) return d; return save('orgs',{...n, active:true}); }
const addFields=()=>[{key:'number',label:'Số phụ lục',req:true},{key:'date',label:'Ngày ký',type:'date',req:true},{key:'content',label:'Nội dung điều chỉnh',type:'textarea',req:true},{key:'valueChange',label:'Giá trị điều chỉnh (+ tăng / − giảm, đồng)',type:'number',def:0},{key:'daysChange',label:'Gia hạn thời gian (ngày)',type:'number',def:0},{key:'wfnote',type:'html',label:'',full:true,html:'<p class="small muted" style="margin:0">Lưu nháp để soạn tiếp, hoặc Lưu và chuyển duyệt để chuyển hồ sơ theo quy trình duyệt. Chỉ phụ lục đã duyệt mới cộng vào giá trị và thời hạn hợp đồng.</p>'},{key:'att',label:'Phụ lục đã ký, văn bản đề nghị điều chỉnh',type:'attach',col:'addenda'}];
ACT['add-addendum']=(cid)=>openForm({wf:'addenda', title:'Thêm phụ lục hợp đồng', fields:addFields(), onSave:v=>save('addenda',{...v, contractId:cid},'Phụ lục '+v.number)});
ACT['edit-addenda']=(id)=>openForm({wf:'addenda', title:'Cập nhật phụ lục', fields:addFields(), value:get('addenda',id), onSave:v=>save('addenda',v,'Phụ lục '+v.number)});
ACT['goto-kl']=(cid)=>{ if(cidProd(cid)) return goPay(cid,'nt'); S.f.klc=cid; location.hash='khoi-luong'; };
ACT['goto-tt']=(cid)=>goPay(cid, cidProd(cid)?'hs':null);
ACT['goto-td']=(kid)=>{ S.f.tdk=kid; location.hash='tien-do'; };

/* ===== DANH MỤC NHÀ THẦU, DANH MỤC ĐƠN VỊ GIÁM SÁT  =====
   Hai danh mục tách riêng (kind 'nt' / 'gs'; một công ty có cả hai vai trò thì có hai bản ghi).
   Gói thầu chọn nhà thầu (liên danh) và một hoặc nhiều đơn vị giám sát; tài khoản thuộc đơn vị tự thấy các gói thầu đó. */
const orgOf=id=>id?get('orgs',id):null;
const orgName=id=>{ const o=orgOf(id); return o? (o.shortName||o.name) : ''; };
const ORG_KIND={nt:'nhà thầu', gs:'đơn vị giám sát'};
const orgList=kind=>D('orgs').filter(o=>!kind||o.kind===kind).sort((a,b)=>String(a.name).localeCompare(String(b.name),'vi'));
/* Tên nhà thầu của gói thầu: tên liên danh, hoặc tên các đơn vị nối nhau */
function pkgContractorName(k){ if(!k) return ''; const ids=k.contractorIds||[]; if(!ids.length) return ''; if(k.jointVenture) return k.jointVenture; return ids.map(id=>(orgOf(id)||{}).name||'').filter(Boolean).join(' – '); }
/* Thành viên liên danh kèm tỷ lệ: "ITECH 41,8%, Tri Thức 58,2%" */
function jvMembersText(k){ if(!k) return ''; const ids=k.contractorIds||[]; if(ids.length<2) return ''; const sh=k.contractorShares||{};
  return ids.map(id=>{ const o=orgOf(id); const s=sh[id]; return o? (o.shortName||o.name)+(s!=null&&s!==''?' '+fmtP(N(s)):'') : ''; }).filter(Boolean).join(', '); }
const pkgSupervisorNames=k=>(k&&k.supervisorIds||[]).map(orgName).filter(Boolean).join(', ');
const orgPkgs=id=>{ const o=orgOf(id); return D('packages').filter(k=>o&&o.kind==='gs'?(k.supervisorIds||[]).includes(id):(k.contractorIds||[]).includes(id)); };
const orgUsers=id=>D('users').filter(u=>u.orgId===id);
/* Bản 1.8.8: trong mỗi giai đoạn chỉ có "Nhà thầu của giai đoạn" (lọc theo gói thầu của giai đoạn);
   danh mục đầy đủ (thêm, sửa nhà thầu, đơn vị giám sát) đặt một chỗ: Điều hành › Danh mục nhà thầu, đơn vị giám sát */
const ORG_TABS=[['pkg','Gói thầu và hợp đồng'],['nt','Nhà thầu của giai đoạn']];
function orgTabs(t){ return `<div class="tabs">${ORG_TABS.map(([k,l])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="gt" data-id="${k}">${l}</button>`).join('')}</div>`; }
const DM_TABS=[['nt','Danh mục nhà thầu'],['gs','Danh mục đơn vị giám sát']];
VIEWS['danh-muc-don-vi']=()=>orgView(S.tab.dm==='gs'?'gs':'nt');
const pkgRef=k=>`<a href="#" data-act="go-pkg" data-id="${esc(k.id)}" class="small"><span class="num">${esc((projOf(k.projectId)||{}).code||'')} · ${esc(k.code)}</span> ${esc(k.name)}</a>`;
ACT['go-pkg']=(id)=>goPkg(id);
function orgPhaseView(ph){
  const q=S.f.oq||''; const ks=D('packages').filter(k=>inFilter(k.projectId) && pkgPhase(k)===ph).sort(pkgSort);
  const m=new Map(); const put=(id,k,role)=>{ const o=orgOf(id); if(!o) return; const e=m.get(id)||{o, ks:[]}; e.ks.push({k,role}); m.set(id,e); };
  ks.forEach(k=>{ const ids=k.contractorIds||[]; ids.forEach((id,i)=>put(id,k,ids.length>1?(i===0?'Đứng đầu liên danh':'Thành viên liên danh'):'Nhà thầu')); (k.supervisorIds||[]).forEach(id=>put(id,k,'Giám sát')); });
  const rows=[...m.values()].map(e=>({...e, id:e.o.id, name:e.o.name, cv:sum(e.ks.filter(x=>x.role!=='Giám sát'),x=>{ const c=contractOfPkg(x.k.id); return c?contractValue(c):0; })}))
    .filter(r=>has({...r.o, pk:r.ks.map(x=>x.k.code+' '+x.k.name+' '+((projOf(x.k.projectId)||{}).code||'')).join(' ')},q)).sort((a,b)=>b.cv-a.cv||String(a.name).localeCompare(String(b.name),'vi'));
  const noOrg=ks.filter(k=>!(k.contractorIds||[]).length).length;
  return `<div class="head"><div class="grow"><h1>Nhà thầu của giai đoạn <span class="pill ${ph==='cb'?'info':'acc'}" style="vertical-align:middle;font-size:.8rem">${esc(PHASES[ph])}</span></h1><p>${rows.length} đơn vị tham gia ${ks.length} gói thầu ${esc(PHASES[ph].toLowerCase())}${noOrg?`; ${noOrg} gói thầu chưa chọn nhà thầu`:''}</p></div>${can('danh-muc-don-vi')?`<a class="btn" href="#danh-muc-don-vi">Danh mục nhà thầu, đơn vị giám sát →</a>`:''}</div>
  ${orgTabs('nt')}
  <p class="small muted" style="margin:0">Chỉ liệt kê nhà thầu, đơn vị giám sát có gói thầu ở giai đoạn này. Thêm, sửa thông tin đơn vị tại mục Điều hành › Danh mục nhà thầu, đơn vị giám sát.</p>
  <div class="toolbar"><input type="search" data-f="oq" value="${esc(q)}" placeholder="Tìm tên nhà thầu, mã số thuế, tên gói thầu, mã dự án…" aria-label="Tìm nhà thầu"></div>
  ${table([{h:'Đơn vị',f:r=>`<b style="font-weight:600">${esc(r.name)}</b>${r.o.member?' '+pill('Thành viên','acc'):''}${r.o.kind==='gs'?' '+pill('Đơn vị giám sát','info'):''}${r.o.taxCode?`<div class="small muted">MST ${esc(r.o.taxCode)}</div>`:''}`},
    {h:'Gói thầu ở giai đoạn này',f:r=>`<div style="display:grid;gap:3px;min-width:260px">${r.ks.map(x=>`<div>${pkgRef(x.k)}${x.role!=='Nhà thầu'?` <span class="small muted">(${esc(x.role.toLowerCase())})</span>`:''}</div>`).join('')}</div>`},
    {h:'Số gói',r:1,f:r=>r.ks.length},{h:'Giá trị hợp đồng',r:1,f:r=>r.cv?fmtTy(r.cv):'—'}], rows,
    {rowAct:'open-org', empty:q?'Không có đơn vị phù hợp.':'Các gói thầu của giai đoạn này chưa chọn nhà thầu.'})}`;
}
function orgView(kind){
  const q=S.f.oq||'', st=S.f.ost||''; const ed=can('goi-thau','edit') && !Store.meta.orgId;
  const all=orgList(kind); const rows=all.filter(o=>has(o,q) && (!st || (st==='on'?o.active!==false:o.active===false)));
  const title=kind==='nt'?'Danh mục nhà thầu':'Danh mục đơn vị giám sát';
  return `<div class="head"><div class="grow"><h1>${title}</h1><p>${all.length} ${kind==='gs'?'đơn vị giám sát độc lập':'nhà thầu (thi công, tư vấn, cung cấp)'}; chọn ở biểu mẫu gói thầu khi hình thành gói thầu</p></div>${ed?`<button class="btn primary" data-act="add-org" data-id="${kind}">+ Thêm ${ORG_KIND[kind]}</button>`:''}</div>
  <div class="tabs">${DM_TABS.map(([k,l])=>`<button class="${kind===k?'on':''}" data-act="tab" data-g="dm" data-id="${k}">${l}</button>`).join('')}</div>
  <div class="toolbar"><input type="search" data-f="oq" value="${esc(q)}" placeholder="Tìm tên, mã số thuế, người đại diện, địa chỉ…" aria-label="Tìm đơn vị"><select data-f="ost" aria-label="Trạng thái">${opts([['on','Đang hoạt động'],['off','Ngừng hoạt động']],st,'Mọi trạng thái')}</select></div>
  ${table([{h:kind==='gs'?'Tên đơn vị giám sát':'Tên nhà thầu',f:r=>`<b style="font-weight:600">${esc(r.name)}</b>${r.member?' '+pill('Thành viên','acc'):''}${r.shortName?`<div class="small muted">${esc(r.shortName)}</div>`:''}${r.address?`<div class="small muted">${esc(r.address)}</div>`:''}`},
    {h:'Mã số thuế',f:r=>`<span class="num">${esc(r.taxCode||'—')}</span>`},
    {h:'Người đại diện',f:r=>`${esc(r.representative||'—')}<div class="small muted">${esc(r.repTitle||'')}</div>`},
    {h:'Liên hệ',f:r=>`${esc(r.phone||'')}${r.email?`<div class="small">${esc(r.email)}</div>`:''}${r.contactName?`<div class="small muted">${esc(r.contactName)} ${esc(r.contactPhone||'')}</div>`:''}`},
    {h:'Chứng chỉ năng lực',f:r=>r.certNo?`<span class="num small">${esc(r.certNo)}</span>${r.certGrade?' · hạng '+esc(r.certGrade):''}${r.certDate?`<div class="small muted">cấp ${fmtDate(r.certDate)}</div>`:''}`:'<span class="muted small">—</span>'},
    {h:kind==='gs'?'Gói thầu giám sát':'Gói thầu tham gia',f:r=>{ const ks=orgPkgs(r.id).filter(k=>pidOk(k.projectId)).sort(pkgSort); return ks.length?`<div style="display:grid;gap:3px;min-width:240px">${ks.slice(0,6).map(k=>`<div>${pkgRef(k)} <span class="pill" style="font-size:.7rem">${esc(PHASES[pkgPhase(k)])}</span></div>`).join('')}${ks.length>6?`<div class="small muted">… và ${ks.length-6} gói khác (bấm vào dòng để xem đủ)</div>`:''}</div>`:'<span class="muted small">Chưa có</span>'; }},
    {h:'Tài khoản',r:1,f:r=>orgUsers(r.id).length||'—'},
    {h:'Trạng thái',f:r=>r.active===false?pill('Ngừng hoạt động','bad'):pill('Hoạt động','ok')}], rows,
    {rowAct:'open-org', actions:r=>ed?editBtns('goi-thau','orgs',r.id):'', empty:q||st?'Không có đơn vị phù hợp.':`Chưa có ${ORG_KIND[kind]} trong danh mục.`})}
  <p class="small muted" style="margin:8px 0 0">Bấm vào một dòng để xem đủ thông tin, các gói thầu và tài khoản người dùng của đơn vị. Tài khoản của ${ORG_KIND[kind]} do quản trị tạo và chọn "Thuộc đơn vị"; tài khoản tự thấy các gói thầu mà đơn vị được chọn.</p>`;
}
const orgFields=(kind)=>[
  {key:'name',label:(kind==='gs'?'Tên đơn vị giám sát':'Tên nhà thầu')+' (theo giấy chứng nhận đăng ký doanh nghiệp)',req:true,full:true},{key:'shortName',label:'Tên viết tắt'},{key:'taxCode',label:'Mã số thuế'},
  {key:'address',label:'Địa chỉ trụ sở',full:true},{key:'phone',label:'Điện thoại'},{key:'email',label:'Thư điện tử'},
  {key:'representative',label:'Người đại diện theo pháp luật'},{key:'repTitle',label:'Chức vụ người đại diện'},
  {key:'bankAccount',label:'Số tài khoản'},{key:'bankName',label:'Mở tại ngân hàng'},
  {key:'certNo',label:'Số chứng chỉ năng lực hoạt động xây dựng'},{key:'certGrade',label:'Hạng chứng chỉ',suggest:['I','II','III']},{key:'certDate',label:'Ngày cấp chứng chỉ',type:'date'},
  {key:'field',label:'Lĩnh vực hoạt động',full:true,ph:kind==='gs'?'Ví dụ: giám sát thi công xây dựng công trình giao thông, hạ tầng kỹ thuật':'Ví dụ: thi công công trình giao thông, hạ tầng kỹ thuật'},
  {key:'contactName',label:'Người liên hệ'},{key:'contactPhone',label:'Điện thoại người liên hệ'},
  {key:'status',label:'Trạng thái',type:'select',options:[['on','Đang hoạt động'],['off','Ngừng hoạt động']],req:true,def:'on'},
  ...(kind==='gs'?[]:[{key:'_mem',label:'Thành viên hệ sinh thái',type:'select',options:[['0','Không'],['1','Có: đơn vị thành viên']],req:true,def:'0',hint:'Đơn vị thành viên có bộ lọc và báo cáo riêng ở trang Tổng quan. Nên ghi Tên viết tắt (ví dụ Tri Thức) để hiển thị gọn.'}]),
  {key:'note',label:'Ghi chú',type:'textarea'},{key:'att',label:'Giấy chứng nhận đăng ký doanh nghiệp, chứng chỉ năng lực, hồ sơ năng lực',type:'attach',col:'orgs'}];
const orgIn=o=>({...o, status:o.active===false?'off':'on', _mem:o.member?'1':'0'});
function orgOut(v){ const o={...v, active:v.status!=='off', member:v.kind!=='gs' && v._mem==='1'}; delete o.status; delete o._mem; return o; }
function orgDupe(v){ const n=normKey(v.name), t=String(v.taxCode||'').replace(/\s/g,''); return D('orgs').find(o=>o.id!==v.id && o.kind===v.kind && (normKey(o.name)===n || (t && String(o.taxCode||'').replace(/\s/g,'')===t))); }
async function orgSave(v){ const d=orgDupe(v); if(d){ $('#mform_err').textContent=`Đã có trong danh mục ${ORG_KIND[v.kind]} (trùng tên hoặc mã số thuế): ${d.name}`; return false; } return save('orgs', orgOut(v)); }
ACT['add-org']=(kind)=>openForm({title:'Thêm '+ORG_KIND[kind], wide:true, fields:orgFields(kind), value:{kind, status:'on'}, onSave:orgSave});
ACT['edit-orgs']=(id)=>{ const o=get('orgs',id); openForm({title:'Cập nhật thông tin '+ORG_KIND[o.kind], wide:true, fields:orgFields(o.kind), value:orgIn(o), onSave:orgSave}); };
ACT['open-org']=(id,el,e)=>{ if(e && e.target.closest('button')) return; const o=get('orgs',id); if(!o) return;
  const ks=orgPkgs(id), us=orgUsers(id), row=(l,v)=>v?`<dt>${l}</dt><dd>${v}</dd>`:'';
  const role=k=>{ if(o.kind==='gs') return 'Giám sát'+((k.supervisorIds||[]).length>1?' (cùng '+((k.supervisorIds||[]).length-1)+' đơn vị khác)':''); const ids=k.contractorIds||[]; return ids.length>1?(ids[0]===id?'Đứng đầu liên danh':'Thành viên liên danh'):'Nhà thầu'; };
  openModal(`<div class="mform wide"><header><h3>${esc(o.name)}</h3><button class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:16px;overflow:auto"><dl class="kv">
    ${row('Danh mục',o.kind==='gs'?'Đơn vị giám sát độc lập':'Nhà thầu'+(o.member?', thành viên hệ sinh thái':''))}${row('Tên viết tắt',esc(o.shortName||''))}${row('Mã số thuế',esc(o.taxCode||''))}${row('Địa chỉ',esc(o.address||''))}
    ${row('Điện thoại',esc(o.phone||''))}${row('Thư điện tử',esc(o.email||''))}${row('Người đại diện',esc([o.representative,o.repTitle].filter(Boolean).join(' – ')))}
    ${row('Tài khoản ngân hàng',esc([o.bankAccount,o.bankName].filter(Boolean).join(' tại ')))}${row('Chứng chỉ năng lực',esc([o.certNo,o.certGrade?'hạng '+o.certGrade:'',o.certDate?'cấp ngày '+fmtDate(o.certDate):''].filter(Boolean).join(' · ')))}
    ${row('Lĩnh vực',esc(o.field||''))}${row('Người liên hệ',esc([o.contactName,o.contactPhone].filter(Boolean).join(' – ')))}${row('Trạng thái',o.active===false?'Ngừng hoạt động':'Đang hoạt động')}${row('Ghi chú',esc(o.note||''))}
    <dt>Hồ sơ đơn vị</dt><dd>${attLinks(atts('orgs',id))}</dd></dl>
    <h2 style="margin-top:16px">Gói thầu (${ks.length})</h2>${table([{h:'Ký hiệu',f:k=>`<span class="num">${esc(k.code)}</span>`},{h:'Tên gói thầu',f:k=>`${esc(k.name)}<div class="small muted">${esc((projOf(k.projectId)||{}).code||'')}</div>`},{h:'Vai trò',f:role},{h:'Trạng thái',f:k=>statusPill(k.status)}], ks, {empty:'Đơn vị chưa được chọn ở gói thầu nào.'})}
    ${can('quan-tri')?`<h2 style="margin-top:16px">Tài khoản người dùng của đơn vị (${us.length})</h2>${table([{h:'Tên đăng nhập',f:u=>`<span class="num">${esc(u.username)}</span>`},{h:'Họ và tên',k:'name'},{h:'Nhóm',f:u=>esc((get('groups',u.groupId)||{}).name||'—')},{h:'Trạng thái',f:u=>u.active===false?pill('Đã khóa','bad'):pill('Hoạt động','ok')}], us, {empty:'Chưa có tài khoản. Quản trị tạo tài khoản và chọn "Thuộc đơn vị" là đơn vị này.'})}`:''}
  </div></div>`); };
/* Biểu mẫu gói thầu: nhà thầu gõ tên hoặc chọn từ danh mục nhà thầu; đơn vị giám sát chọn một hoặc nhiều từ danh mục đơn vị giám sát.
   Tên chưa có được thêm vào đúng danh mục. */
function pkgOrgFields(){ return [
  {key:'_ct',label:'Nhà thầu trúng thầu (liên danh: chọn liên danh hoặc thành viên đứng đầu)',type:'org',kind:'nt',full:true},
  {key:'_jv',label:'Thành viên liên danh khác (nếu có)',type:'checks',options:()=>orgList('nt').filter(o=>o.active!==false).map(o=>[o.id,o.name])},
  {key:'jointVenture',label:'Tên liên danh (nếu có)',full:true},
  {key:'_sh',type:'html',full:true,label:'Tỷ lệ tham gia liên danh (%)',html:'<div id="f__shbox" class="shbox"></div>'},
  {key:'_sv',label:'Đơn vị giám sát độc lập (chọn một hoặc nhiều)',type:'checks',options:()=>orgList('gs').filter(o=>o.active!==false).map(o=>[o.id,o.name])},
  {key:'_svNew',label:'Đơn vị giám sát chưa có trong danh mục (gõ tên để thêm; nhiều đơn vị cách nhau dấu ;)',full:true}]; }
const pkgOrgValue=k=>({_ct:(k.contractorIds||[])[0]||'', _jv:(k.contractorIds||[]).slice(1), _sv:(k.supervisorIds||[]).slice(), _svNew:''});
async function orgByName(name, kind){ name=String(name||'').replace(/\s+/g,' ').trim(); if(!name) return null;
  const o=D('orgs').find(x=>x.kind===kind && (normKey(x.name)===normKey(name)||normKey(x.shortName)===normKey(name)));
  return o || save('orgs',{name, kind, active:true}); }
async function pkgOrgApply(v){
  const lead=await orgResolve(v._ct);
  v.contractorIds=lead? [lead.id, ...(v._jv||[]).filter(id=>id!==lead.id)] : [];
  const sv=[...(v._sv||[])]; for(const n of String(v._svNew||'').split(';')){ const o=await orgByName(n,'gs'); if(o && !sv.includes(o.id)) sv.push(o.id); }
  v.supervisorIds=sv; if(v.contractorIds.length<2) v.jointVenture='';
  /* Tỷ lệ liên danh: ô của nhà thầu đứng đầu mới nhập (chưa có mã) gắn với mã vừa tạo */
  const sh={}; $$('#f__shbox input[data-org]').forEach(i=>{ const t=i.value.trim().replace(',','.'); if(t==='') return; const id=i.dataset.org==='_lead'? (lead&&lead.id) : i.dataset.org; if(id) sh[id]=Number(t); });
  v.contractorShares= v.contractorIds.length>1? Object.fromEntries(Object.entries(sh).filter(([id])=>v.contractorIds.includes(id))) : {};
  const bad=Object.values(v.contractorShares).some(x=>!isFinite(x)||x<0||x>100), tot=Object.values(v.contractorShares).reduce((a,b)=>a+b,0);
  if(v.contractorIds.length>1 && (bad || v.contractorIds.some(id=>v.contractorShares[id]==null) || Math.abs(tot-100)>0.01))
    throw new Error('Gói liên danh phải nhập tỷ lệ liên danh cho từng thành viên, mỗi tỷ lệ từ 0 đến 100%, cộng lại đúng 100% (đang là '+fmtP(tot)+').');
  delete v._ct; delete v._jv; delete v._sv; delete v._svNew; return v; }
/* Thẻ "Nhà thầu và đơn vị giám sát" ở trang chi tiết gói thầu */
function pkgOrgCard(k){
  const ids=k.contractorIds||[], svs=(k.supervisorIds||[]).map(orgOf).filter(Boolean), ed=can('goi-thau','edit');
  const one=(o,role)=>o?`<div style="padding:6px 0;border-top:1px solid var(--line)"><a role="button" tabindex="0" style="cursor:pointer" data-act="open-org" data-id="${esc(o.id)}"><b style="font-weight:600">${esc(o.name)}</b></a> <span class="small muted">${esc(role)}</span>
    <div class="small muted">${[o.taxCode?'MST '+esc(o.taxCode):'', o.representative?'Đại diện: '+esc(o.representative)+(o.repTitle?' ('+esc(o.repTitle)+')':''):'', o.phone?'ĐT '+esc(o.phone):'', o.certNo?'CCNL '+esc(o.certNo)+(o.certGrade?' hạng '+esc(o.certGrade):''):''].filter(Boolean).join(' · ')}</div></div>`:'';
  return `<div class="card"><div class="ch"><h2>Nhà thầu và đơn vị giám sát</h2>${ed?`<button class="btn sm" data-act="edit-packages" data-id="${k.id}">Chọn nhà thầu, giám sát</button>`:''}</div>
    <div class="grid g2"><div><div class="eyebrow">${ids.length>1?'Liên danh nhà thầu'+(k.jointVenture?': '+esc(k.jointVenture):''):'Nhà thầu'}</div>${ids.length?ids.map((id,i)=>one(orgOf(id), ids.length>1?(i===0?'đứng đầu liên danh':'thành viên liên danh'):'')).join(''):'<div class="small muted">Chưa chọn nhà thầu.</div>'}</div>
    <div><div class="eyebrow">Đơn vị giám sát độc lập${svs.length>1?' ('+svs.length+')':''}</div>${svs.length?svs.map(o=>one(o,'')).join(''):'<div class="small muted">Chưa chọn đơn vị giám sát.</div>'}</div></div></div>`;
}

/* ===== QUẢN LÝ TIẾN ĐỘ (UC15–19) ===== */
VIEWS['tien-do']=()=>{
  const kid=S.f.tdk||''; const mode=S.tab.td||'goi-thau';
  const sch=D('schedule').filter(s=>inFilter(s.projectId) && (!kid||s.packageId===kid));
  /* chỉ kế hoạch đã duyệt được tính tiến độ; kế hoạch đang soạn thảo, chờ duyệt vẫn hiện trên biểu đồ để trình duyệt */
  const schA=sch.filter(schedOk), schP=sch.filter(s=>!schedOk(s));
  const al=alerts({all:!!kid}).filter(a=>a.mod==='tien-do' && (!kid||a.kid===kid));
  const ed=can('tien-do','edit');
  let summary;
  if(mode==='du-an'){
    const ps=projects().filter(p=>inFilter(p.id) && schA.some(s=>s.projectId===p.id));
    summary=table([{h:'Dự án',f:r=>`${esc(r.code)} · ${esc(r.name)}`},{h:'Kế hoạch đến nay',r:1,f:r=>fmtP(projExpected(r.id))},{h:'Thực tế',f:r=>`<div style="min-width:140px">${progBar(projProgress(r.id), projExpected(r.id)-projProgress(r.id)>10?'warn':'')}</div>`},{h:'Chênh lệch',r:1,f:r=>{ const d=projProgress(r.id)-projExpected(r.id); return `<span style="color:${d<-10?'var(--red)':d<0?'var(--amber)':'var(--green)'}">${d>0?'+':''}${fmtP(d)}</span>`; }},{h:'Hạng mục chậm',r:1,f:r=>schA.filter(s=>s.projectId===r.id && ['warn','bad'].includes(schedState(s).k)).length}], ps);
  } else {
    const ks=D('packages').filter(k=>schA.some(s=>s.packageId===k.id)).sort(by('code'));
    summary=table([{h:'Gói thầu',f:r=>`${esc(r.code)} · ${esc(r.name)}`},{h:'Dự án',f:r=>esc((projOf(r.projectId)||{}).code)},{h:'Kế hoạch đến nay',r:1,f:r=>fmtP(pkgExpected(r.id))},{h:'Thực tế',f:r=>`<div style="min-width:140px">${progBar(pkgProgress(r.id), pkgExpected(r.id)-pkgProgress(r.id)>10?'warn':'')}</div>`},{h:'Chênh lệch',r:1,f:r=>{ const d=pkgProgress(r.id)-pkgExpected(r.id); return `<span style="color:${d<-10?'var(--red)':d<0?'var(--amber)':'var(--green)'}">${d>0?'+':''}${fmtP(d)}</span>`; }},{h:'Hạng mục chậm',r:1,f:r=>schA.filter(s=>s.packageId===r.id && ['warn','bad'].includes(schedState(s).k)).length}], ks, {rowAct:'open-pkg'});
  }
  return `<div class="head"><div class="grow"><h1>Quản lý tiến độ</h1><p>${schA.length} hạng mục đã duyệt, trong đó ${schA.filter(s=>['warn','bad'].includes(schedState(s).k)).length} hạng mục đang chậm hoặc quá hạn${schP.length?`. Có ${schP.length} kế hoạch chưa duyệt, chưa tính vào tiến độ`:''}</p></div>${ed?`<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="imp" data-id="sched|${esc(kid)}">Nhập từ Excel</button><button class="btn primary" data-act="add-sched">+ Lập kế hoạch tiến độ</button></div>`:''}</div>
  <div class="toolbar"><select data-f="tdk" aria-label="Gói thầu">${opts(pkgOpts(S.pid),kid,'Tất cả gói thầu')}</select></div>
  ${al.length?`<div class="card"><h2>Cảnh báo chậm tiến độ</h2>${alertList(al)}</div>`:''}
  <div class="card"><div class="ch"><h2>Theo dõi tiến độ</h2><div class="tabs" style="border:0">${[['du-an','Theo dự án'],['goi-thau','Theo gói thầu']].map(([k,l])=>`<button class="${mode===k?'on':''}" data-act="tab" data-g="td" data-id="${k}">${l}</button>`).join('')}</div></div>${summary}</div>
  <div class="card"><div class="ch"><h2>Biểu đồ tiến độ (Gantt)</h2><span class="legend" style="margin:0"><span><i style="background:var(--accent)"></i>Đã thực hiện</span><span><i style="background:var(--amber)"></i>Chậm</span><span><i style="background:var(--red)"></i>Quá hạn</span><span><i style="background:transparent;border-left:2px dashed var(--red);border-radius:0"></i>Hôm nay</span></span></div>${gantt(sch, ed)}</div>`;
};
/* Bản 1.7 (mục 21–24): Gantt theo thang thời gian thật: chọn Tuần / Tháng / Quý, cuộn ngang với cột Hạng mục và cột Thực tế đứng yên,
   tự cuộn tới hôm nay, thu gọn hoặc mở từng gói thầu (phần mềm nhớ lựa chọn theo từng người dùng). */
const GZ={tuan:{l:'Tuần', px:9}, thang:{l:'Tháng', px:3.2}, quy:{l:'Quý', px:1.3}};
function ganttFold(){ try{ return new Set(JSON.parse(lsGet('qlda-gantt-'+((S.user&&S.user.id)||''))||'[]')); }catch{ return new Set(); } }
function ganttFoldSave(set){ lsSet('qlda-gantt-'+((S.user&&S.user.id)||''), JSON.stringify([...set])); }
function gantt(sch, ed){
  if(!sch.length) return emptyBox('Chưa có kế hoạch tiến độ.');
  let st=sch.map(s=>s.planStart).sort()[0], en=sch.map(s=>s.planEnd).sort().slice(-1)[0];
  if(TODAY<st) st=TODAY; if(TODAY>en) en=TODAY;
  const sp=days(st,en);
  const z=GZ[S.f.gz]? S.f.gz : (lsGet('qlda-gantt-zoom') in GZ? lsGet('qlda-gantt-zoom') : (sp>540?'quy':'thang'));
  const s0=new Date(st), e0=new Date(en);
  /* căn đầu, cuối theo đơn vị thời gian đang xem */
  if(z==='tuan'){ s0.setDate(s0.getDate()-((s0.getDay()+6)%7)); e0.setDate(e0.getDate()+(7-((e0.getDay()+6)%7))); }
  else if(z==='thang'){ s0.setDate(1); e0.setMonth(e0.getMonth()+1, 0); }
  else { s0.setMonth(Math.floor(s0.getMonth()/3)*3, 1); e0.setMonth(Math.floor(e0.getMonth()/3)*3+3, 0); }
  st=isoLocal(s0); en=isoLocal(e0);
  /* khung rộng hơn biểu đồ thì giãn thang cho vừa khung, không để khoảng trống bên phải */
  const px=Math.max(GZ[z].px, (S._gfit||0)/(days(st,en)+1)), W=Math.max(320, Math.round((days(st,en)+1)*px)); const X=d=>Math.round(Math.max(0,Math.min(days(st,en)+1, days(st,d)))*px);
  let ticks=''; const d=new Date(st);
  while(isoLocal(d)<=en){ const iso=isoLocal(d); let lb, nx;
    if(z==='tuan'){ lb=pad(d.getDate())+'/'+pad(d.getMonth()+1); nx=new Date(d.getFullYear(), d.getMonth(), d.getDate()+7); }
    else if(z==='thang'){ lb=pad(d.getMonth()+1)+'/'+String(d.getFullYear()).slice(2); nx=new Date(d.getFullYear(), d.getMonth()+1, 1); }
    else { lb='Q'+(Math.floor(d.getMonth()/3)+1)+'/'+String(d.getFullYear()).slice(2); nx=new Date(d.getFullYear(), d.getMonth()+3, 1); }
    ticks+=`<span class="gmonth${z==='tuan'&&d.getDate()<=7?' m1':''}" style="left:${X(iso)}px;width:${X(isoLocal(nx))-X(iso)}px">${lb}</span>`; d.setTime(nx.getTime()); }
  const today=`<span class="gtoday" style="left:${X(TODAY)}px"></span>`;
  const groups={}; sch.forEach(s=>{ (groups[s.packageId]=groups[s.packageId]||[]).push(s); });
  const fold=ganttFold(); let rows='';
  const gs=Object.entries(groups).sort((a,b)=>((pkgOf(a[0])||{}).code||'').localeCompare((pkgOf(b[0])||{}).code||''));
  gs.forEach(([kid,arr])=>{
    const k=pkgOf(kid)||{code:'?',name:''}, shut=fold.has(kid);
    const ps=arr.map(s=>s.planStart).sort()[0], pe=arr.map(s=>s.planEnd).sort().slice(-1)[0];
    rows+=`<div class="grow-row pk${shut?' shut':''}" data-k="${esc(kid)}"><div class="gl"><button type="button" class="gtog" data-act="gt-tog" data-id="${esc(kid)}" aria-expanded="${!shut}" title="${shut?'Mở gói thầu':'Thu gọn gói thầu'}"><span class="car">▾</span>${esc(k.code)} · ${esc(k.name)}</button><span class="small muted">${arr.length} việc</span></div>
      <div class="gtrack">${today}<div class="gsum" style="left:${X(ps)}px;width:${Math.max(4,X(pe)-X(ps))}px"><i style="width:${Math.min(100,N(pkgProgress(kid)))}%"></i></div></div><div class="gr num small">${fmtP(pkgProgress(kid))}</div></div>`;
    arr.sort(by('planStart')).forEach(s=>{
      const ok=schedOk(s), stt=ok? schedState(s) : {k:'', t:''}; const l=X(s.planStart), w=Math.max(4,X(s.planEnd)-l);
      rows+=`<div class="grow-row${ok?'':' draft'}" data-in="${esc(kid)}"${shut?' hidden':''}><div class="gl"><div class="gname" data-act="sched-more" data-id="${s.id}" role="button" tabindex="0" title="Xem chi tiết, lịch sử cập nhật">${esc(s.name)}</div><div class="small muted num">${fmtDate(s.planStart)} – ${fmtDate(s.planEnd)} ${ok? pill(stt.t, stt.k) : wfPill('schedule',s)}</div></div>
        <div class="gtrack">${today}<div class="gplan ${ok?(stt.k==='warn'?'warn':stt.k==='bad'?'bad':''):'pend'}" style="left:${l}px;width:${w}px" title="${esc(s.name)}: ${fmtDate(s.planStart)} – ${fmtDate(s.planEnd)}, ${ok? N(s.progress)+'%' : 'kế hoạch chưa duyệt'}"><i style="width:${ok?Math.min(100,N(s.progress)):0}%"></i></div></div>
        <div class="gr">${ok?`<span class="num" style="font-weight:600">${N(s.progress)}%</span>${ed?`<button class="btn sm ghost" data-act="upd-sched" data-id="${s.id}">Cập nhật</button>`:''}`:wfBtns('schedule',s)}<button class="btn sm ghost" data-act="sched-more" data-id="${s.id}" aria-label="Chi tiết">⋯</button></div></div>`;
    });
  });
  S.after.push(()=>{ const w=$('#gwrap'); if(!w) return; const g=w.querySelector('.grow-row.hd');
    const avail=w.clientWidth-g.children[0].offsetWidth-g.children[2].offsetWidth-2;
    if(!S._gfitting && Math.abs(avail-(S._gfit||0))>8 && (W<avail || S._gfit)){ S._gfit=avail; S._gfitting=true; try{ w.parentElement.outerHTML=gantt(sch, ed); }finally{ S._gfitting=false; } }
    ganttToday(false); });
  const tools=`<div class="gtools"><div class="gseg" role="group" aria-label="Thang thời gian">${Object.entries(GZ).map(([k,o])=>`<button type="button" class="${k===z?'on':''}" data-act="gt-zoom" data-id="${k}">${o.l}</button>`).join('')}</div>
    <button type="button" class="btn sm" data-act="gt-today">Hôm nay</button><span style="flex:1"></span>
    ${gs.length>1?`<button type="button" class="btn sm ghost" data-act="gt-all" data-id="0">Thu gọn tất cả</button><button type="button" class="btn sm ghost" data-act="gt-all" data-id="1">Mở tất cả</button>`:''}</div>`;
  return `<div class="gbox">${tools}<div class="gwrap" id="gwrap"><div class="gantt" style="--gw:${W}px" data-today="${X(TODAY)}"><div class="grow-row hd"><div class="gl">Hạng mục</div><div class="gtrack" style="height:26px">${ticks}${today}</div><div class="gr">Thực tế</div></div>${rows}</div></div></div>`;
}
/** Cuộn khung Gantt để ngày hôm nay nằm khoảng một phần ba bề rộng phần biểu đồ. */
function ganttToday(smooth){ const w=$('#gwrap'); if(!w) return; const g=w.querySelector('.gantt'); const t=+g.dataset.today||0;
  const left=(w.querySelector('.grow-row .gl')||{}).offsetWidth||0, right=(w.querySelector('.grow-row .gr')||{}).offsetWidth||0;
  const vis=w.clientWidth-left-right; w.scrollTo({left:Math.max(0,t-vis/3), behavior:smooth?'smooth':'auto'}); }
ACT['gt-zoom']=(z)=>{ S.f.gz=z; lsSet('qlda-gantt-zoom', z); render(); };
ACT['gt-today']=()=>ganttToday(true);
ACT['gt-tog']=(kid)=>{ const f=ganttFold(); const shut=!f.has(kid); shut? f.add(kid) : f.delete(kid); ganttFoldSave(f);
  const w=$('#gwrap'); if(!w) return; const pk=w.querySelector(`.grow-row.pk[data-k="${CSS.escape(kid)}"]`); if(pk){ pk.classList.toggle('shut',shut); const b=pk.querySelector('.gtog'); b.setAttribute('aria-expanded',!shut); b.title=shut?'Mở gói thầu':'Thu gọn gói thầu'; }
  w.querySelectorAll(`.grow-row[data-in="${CSS.escape(kid)}"]`).forEach(r=>r.hidden=shut); };
ACT['gt-all']=(open)=>{ const w=$('#gwrap'); if(!w) return; const ids=[...w.querySelectorAll('.grow-row.pk')].map(r=>r.dataset.k); const f=ganttFold();
  ids.forEach(id=>open==='1'? f.delete(id) : f.add(id)); ganttFoldSave(f);
  w.querySelectorAll('.grow-row.pk').forEach(r=>{ r.classList.toggle('shut',open!=='1'); const b=r.querySelector('.gtog'); b.setAttribute('aria-expanded',open==='1'); });
  w.querySelectorAll('.grow-row[data-in]').forEach(r=>r.hidden=open!=='1'); };
const schedFields=()=>[{key:'packageId',label:'Gói thầu',type:'select',options:()=>pkgOpts(S.pid),req:true,full:true,def:S.f.tdk},{key:'name',label:'Tên hạng mục / công việc',req:true,full:true},
  {key:'planStart',label:'Bắt đầu kế hoạch',type:'date',req:true},{key:'planEnd',label:'Kết thúc kế hoạch',type:'date',req:true},{key:'weight',label:'Trọng số (tỷ trọng giá trị, %)',type:'number',def:10},
  {key:'att',label:'Tiến độ được duyệt, tài liệu kèm theo (PDF, Excel, MS Project…)',type:'attach',col:'schedule',kind:'Kế hoạch tiến độ'},
  {key:'itemId',label:'Gắn với hạng mục công trình',type:'select',options:()=>D('items').filter(i=>!S.pid||i.projectId===S.pid).map(i=>[i.id,(projOf(i.projectId)||{}).code+' · '+i.code+' – '+i.name])},
  {key:'wfnote',type:'html',label:'',full:true,html:'<p class="small muted" style="margin:0">Kế hoạch lưu ở trạng thái Soạn thảo; bấm Trình duyệt để Lãnh đạo Ban duyệt. Chỉ kế hoạch đã duyệt mới được tính vào tiến độ gói thầu, dự án, đường cong S, cảnh báo và được cập nhật tiến độ thực tế.</p>'},
  {key:'wsum',type:'html',label:'',full:true,html:'<p class="small" id="sched_wsum" style="margin:0"></p>'}];
/** Dòng nhắc tổng trọng số của gói thầu khi lập, điều chỉnh kế hoạch (không chặn lưu; phần mềm tự quy về 100%). */
function schedWsum(self){
  const upd=()=>{ const k=$('#f_packageId'), w=$('#f_weight'), out=$('#sched_wsum'); if(!k||!w||!out) return;
    const t=sum(D('schedule').filter(s=>s.packageId===k.value && s.id!==self), s=>N(s.weight)||1)+(w.value===''?1:N(w.value));
    out.style.color=Math.abs(t-100)>0.01?'var(--amber)':'var(--muted)';
    out.textContent=Math.abs(t-100)>0.01? `Tổng trọng số các đầu việc của gói này sẽ là ${fmtN(t,2)}%. Phần mềm tự quy về 100% khi tính tiến độ; kiểm tra lại nếu nhập nhầm.` : 'Tổng trọng số các đầu việc của gói này là 100%.'; };
  ['#f_packageId','#f_weight'].forEach(q=>{ const el=$(q); if(el){ el.addEventListener('input',upd); el.addEventListener('change',upd); } }); upd();
}
ACT['add-sched']=()=>{ openForm({wf:'schedule', title:'Lập kế hoạch tiến độ', fields:schedFields(), onSave:v=>{ if(v.planEnd<v.planStart){ $('#mform_err').textContent='Ngày kết thúc phải sau ngày bắt đầu.'; return false; } return save('schedule',{...v, projectId:pkgOf(v.packageId).projectId, progress:0, history:[], status:'Soạn thảo'}); }}); schedWsum(''); };
ACT['edit-schedule']=(id)=>{ openForm({wf:'schedule', title:'Điều chỉnh kế hoạch tiến độ', fields:schedFields(), value:get('schedule',id), onSave:v=>{ if(v.planEnd<v.planStart){ $('#mform_err').textContent='Ngày kết thúc phải sau ngày bắt đầu.'; return false; } return save('schedule',{...v, projectId:pkgOf(v.packageId).projectId}); }}); schedWsum(id); };
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
  <dl class="kv"><dt>Trạng thái kế hoạch</dt><dd>${wfPill('schedule',s)}</dd></dl>
  <div class="toolbar">${wfBtns('schedule',s)}${wfEditable('schedule',s)?`<button class="btn" data-act="edit-schedule" data-id="${s.id}">Điều chỉnh kế hoạch</button><button class="btn danger" data-act="del" data-col="schedule" data-id="${s.id}">Xóa hạng mục</button>`:''}</div></div></div>`); };

/* ===== NHẬT KÝ THI CÔNG (UC20–23) ===== */
const parseWorks = worksParse;
VIEWS['nhat-ky']=()=>{
  const kid=S.f.nkk||'', from=S.f.nkf||'', to=S.f.nkt||'', q=S.f.nkq||'';
  const rows=D('diaries').filter(d=>inFilter(d.projectId) && (!kid||d.packageId===kid) && (!from||d.date>=from) && (!to||d.date<=to) && has(d,q)).sort((a,b)=>b.date.localeCompare(a.date)||String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const ed=can('nhat-ky','edit');
  return `<div class="head"><div class="grow"><h1>${modName('nhat-ky')}</h1><p>${rows.length} trang nhật ký, ${sum(rows,'workers')} ${XD('lượt nhân công','lượt người tham gia')}</p></div>${ed?`<button class="btn primary" data-act="add-diary">+ Ghi nhật ký</button>`:''}</div>
  <div class="toolbar"><select data-f="nkk" aria-label="Gói thầu">${opts(pkgOpts(S.pid),kid,'Tất cả gói thầu')}</select><input type="date" data-f="nkf" value="${esc(from)}" aria-label="Từ ngày"><input type="date" data-f="nkt" value="${esc(to)}" aria-label="Đến ngày"><input type="search" data-f="nkq" value="${esc(q)}" placeholder="Tra cứu nội dung, sự cố…" aria-label="Tra cứu nhật ký"></div>
  <div class="list">${rows.slice(0, S.nkn||10).map(d=>{ const k=pkgOf(d.packageId)||{}; const w=parseWorks(d.works); return `<article class="card"><div class="ch"><div style="flex:1;min-width:200px"><h3><span class="num">${fmtDate(d.date)}</span> · ${esc(k.code||'')} ${esc(k.name||'')}</h3><div class="small muted">${isIT()?'':esc(d.shift||'')}${isIT()&&!d.weather?'':` · Thời tiết: ${esc(d.weather||'—')}`} · ${XD('Nhân công','Số người')}: <b class="num">${N(d.workers)}</b> · ${esc(d.machines||'')}</div></div>
      ${ed?`<button class="btn sm ghost" data-act="diary-photo" data-id="${d.id}">${ic('cam').replace('<svg','<svg width="15" height="15"')} Thêm ảnh</button><button class="btn sm ghost" data-act="edit-diaries" data-id="${d.id}">Sửa</button><button class="btn sm ghost danger" data-act="del" data-col="diaries" data-id="${d.id}">Xóa</button>`:''}</div>
      ${w.length?`<div class="tw" style="margin-top:6px"><table><thead><tr><th>Công việc thực hiện</th><th class="r">Khối lượng</th><th>Đơn vị</th></tr></thead><tbody>${w.map(x=>`<tr><td>${esc(x.name)}</td><td class="r">${esc(x.qty||'')}</td><td>${esc(x.unit||'')}</td></tr>`).join('')}</tbody></table></div>`:''}
      ${d.issues?`<div class="alert" style="margin-top:8px"><span><b>Vướng mắc, sự cố:</b> ${esc(d.issues)}</span></div>`:''}
      ${(d.photos||[]).length?`<div class="thumbs" style="margin-top:8px">${d.photos.map(p=>`<figure><img src="${esc(fileUrl(p))}" alt="${esc(p.caption||p.name||'Ảnh hiện trường')}" title="${esc(p.caption||'')}" data-act="photo" loading="lazy">${p.caption?`<figcaption>${esc(p.caption)}</figcaption>`:''}</figure>`).join('')}</div>`:''}
      ${atts('diaries',d.id).length?`<div class="small" style="margin-top:6px"><b>Tệp đính kèm:</b> ${attLinks(atts('diaries',d.id))}</div>`:''}
      <div class="small muted" style="margin-top:6px">Xác nhận: ${esc(d.supervisor||'—')} · Người ghi: ${esc(d.byName||'—')}</div></article>`; }).join('') || emptyBox('Không có nhật ký phù hợp.', ed?`<button class="btn primary" data-act="add-diary">+ Ghi nhật ký</button>`:'')}</div>
  ${rows.length>(S.nkn||10)?`<div class="pager"><span class="small muted">Đang xem ${S.nkn||10} / ${rows.length} trang nhật ký</span><span class="sp"></span><button class="btn" data-act="nk-more">Xem thêm 10 trang nhật ký</button></div>`:''}`;
};
ACT['nk-more']=()=>{ S.nkn=(S.nkn||10)+10; render(); };
const diaryFields=()=>[{key:'packageId',label:'Gói thầu',type:'select',options:()=>pkgOpts(S.pid).filter(([id])=>{ const k=pkgOf(id); return k && (isIT() || /xây lắp|hỗn hợp|mua sắm/i.test(k.type)); }),req:true,full:true,def:S.f.nkk},
  {key:'date',label:'Ngày',type:'date',req:true,def:TODAY},...(isIT()?[]:[{key:'shift',label:'Ca làm việc',type:'select',options:['Cả ngày','Ca sáng','Ca chiều','Ca đêm'],def:'Cả ngày'}]),
  ...(isIT()?[]:[{key:'weather',label:'Thời tiết',type:'select',options:()=>catalog('Thời tiết')}]),{key:'workers',label:XD('Số nhân công','Số người tham gia'),type:'number'},{key:'machines',label:XD('Máy móc, thiết bị','Thiết bị, công cụ, môi trường triển khai'),full:true},
  {key:'works',label:'Công việc thực hiện',type:'works',req:true},{key:'issues',label:'Vướng mắc, sự cố, kiến nghị',type:'textarea',rows:2},
  {key:'supervisor',label:'Cán bộ giám sát xác nhận'},{key:'photos_new',label:XD('Hình ảnh hiện trường','Hình ảnh triển khai, ảnh chụp màn hình'),type:'files',multiple:true,accept:'image/*',hint:'Ảnh được lưu vào kho tệp trên máy chủ (tự thu nhỏ còn tối đa 1920 px).'},
  {key:'att',label:'Trang nhật ký đã ký (bản scan PDF/ảnh), biên bản hiện trường',type:'attach',col:'diaries',kind:'Trang nhật ký đã ký'}];
async function diaryPhotos(v){
  const files=v.photos_new||[]; delete v.photos_new; const ph=[...(v.photos||[])];
  for(const f of files){ const p=await storePhoto(f); ph.push({...p, date:TODAY, by:S.user.name}); }
  v.photos=ph; return v;
}
ACT['add-diary']=()=>openForm({title:XD('Ghi nhật ký thi công','Ghi nhật ký triển khai'), fields:diaryFields(), onSave:async v=>{ await diaryPhotos(v); return save('diaries',{...v, projectId:pkgOf(v.packageId).projectId, byName:S.user.name}, fmtDate(v.date)+' '+(pkgOf(v.packageId)||{}).code); }});
ACT['edit-diaries']=(id)=>openForm({title:XD('Cập nhật nhật ký thi công','Cập nhật nhật ký triển khai'), fields:diaryFields(), value:get('diaries',id), onSave:async v=>{ await diaryPhotos(v); return save('diaries',{...v, projectId:pkgOf(v.packageId).projectId}, fmtDate(v.date)); }});
/* Quản lý ảnh hiện trường: thêm ảnh, ghi chú thích, bỏ ảnh tải nhầm */
ACT['diary-photo']=(id)=>{ const d=get('diaries',id); const ph=d.photos||[];
  const grid=ph.length?`<div class="photo-edit" id="ph_edit">${ph.map((p,i)=>`<figure data-i="${i}"><img src="${esc(fileUrl(p))}" alt=""><input type="text" placeholder="Chú thích ảnh" value="${esc(p.caption||'')}" data-cap="${i}" aria-label="Chú thích ảnh ${i+1}"><label class="small"><input type="checkbox" data-rm="${i}" onchange="this.closest('figure').classList.toggle('del',this.checked)"> Bỏ ảnh này</label></figure>`).join('')}</div>`:'<p class="muted small">Chưa có ảnh.</p>';
  openForm({title:'Hình ảnh hiện trường '+fmtDate(d.date), fields:[{key:'cur',label:'Ảnh hiện có',type:'html',full:true,html:grid},{key:'photos_new',label:'Thêm ảnh (có thể chọn nhiều)',type:'files',multiple:true,accept:'image/*',full:true}], value:d,
    onSave:async v=>{ const keep=[]; ph.forEach((p,i)=>{ if(!$(`[data-rm="${i}"]`)?.checked) keep.push({...p, caption:($(`[data-cap="${i}"]`)?.value||'').trim()}); });
      v.photos=keep; await diaryPhotos(v); return save('diaries',v,'Ảnh nhật ký '+fmtDate(d.date)); }}); };
