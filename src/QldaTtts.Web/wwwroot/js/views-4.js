/* ===== Phiên bản 1.1: chức năng Ban QLDA cấp xã (Luật Xây dựng 2025, NĐ 217/2026, NĐ 207/2026) =====
   Kế hoạch vốn và giải ngân · Nghiệm thu, bàn giao, bảo hành · Quyết toán dự án hoàn thành · Giải phóng mặt bằng */

const pcode = id => esc((projOf(id)||{}).code||'');
const pcell = id => { const p=projOf(id)||{}; return `<div style="min-width:190px"><span class="num" style="white-space:nowrap">${esc(p.code||'')}</span><div class="small muted">${esc(p.name||'')}</div></div>`; };
const pshort = id => { const p=projOf(id)||{}; return `<span class="num" style="white-space:nowrap" title="${esc(p.name||'')}">${esc(p.code||'')}</span>`; };
const kpiCard = (label, v, s, k) => `<div class="card kpi ${k||''}"><div class="eyebrow">${label}</div><div class="v">${v}</div>${s?`<div class="s">${s}</div>`:''}</div>`;
const tabsBar = (g, cur, list) => `<div class="tabs">${list.map(([k,l])=>`<button class="${cur===k?'on':''}" data-act="tab" data-g="${g}" data-id="${k}">${l}</button>`).join('')}</div>`;
const projSel = (def) => ({key:'projectId',label:'Dự án',type:'select',options:projOpts,req:true,full:true,def:def||S.pid||''});

/* ===== KẾ HOẠCH VỐN, GIẢI NGÂN ===== */
function capState(done, tg){ if(done>=tg-0.05) return {k:'ok', t:'Đạt kịch bản'}; if(tg-done<=10) return {k:'warn', t:'Chậm '+fmtP(tg-done)}; return {k:'bad', t:'Chậm giải ngân '+fmtP(tg-done)}; }
VIEWS['von']=()=>{
  const years=[...new Set([TODAY.slice(0,4), ...D('capitals').filter(c=>isAnnualCap(c)).map(c=>String(c.year))])].sort().reverse();
  const Y=S.f.vy&&years.includes(S.f.vy)? S.f.vy : TODAY.slice(0,4); const t=S.tab.von||'gn'; const ed=can('von','edit');
  const ps=projects().filter(p=>inFilter(p.id));
  const upto = Y===TODAY.slice(0,4)? TODAY : (Y<TODAY.slice(0,4)? Y+'-12-31' : Y+'-01-01');
  const rows=ps.map(p=>{ const plan=capPlan(p.id,Y), d=disbursed(p.id,Y), tg=capTargetAt(p.id,Y,upto), done=pct(d,plan); return {...p, mid:capMidTerm(p.id), plan, d, done, tg, st:plan?capState(done,tg):null}; }).filter(r=>r.plan||r.mid||r.d);
  const tp=sum(rows,'plan'), td=sum(rows,'d'), ttg=tp? sum(rows,r=>r.plan*r.tg)/tp : 0, slow=rows.filter(r=>r.plan&&r.tg-r.done>10).length;
  let body='';
  if(t==='gn') body=`<div class="card"><h2>Theo dõi giải ngân kế hoạch vốn năm ${Y}</h2>${table([
      {h:'Dự án',f:r=>pcell(r.id)},{h:'Nguồn vốn',f:r=>esc(r.capital||'—')},{h:'KH trung hạn',r:1,f:r=>r.mid?fmtVND(r.mid):'—'},{h:'Kế hoạch vốn năm',r:1,f:r=>fmtVND(r.plan)},
      {h:'Đã giải ngân',r:1,f:r=>fmtVND(r.d)},{h:'Tỷ lệ / kịch bản',f:r=>r.plan?`<div style="min-width:140px">${progBar(r.done, r.st.k==='ok'?'':r.st.k)}<div class="small muted">Kịch bản đến nay ${fmtP(r.tg)}</div></div>`:'—'},
      {h:'Tình trạng',f:r=>r.st?pill(r.st.t,r.st.k):pill('Chưa giao vốn năm')}], rows,
      {empty:'Chưa có kế hoạch vốn. Thêm tại thẻ "Kế hoạch vốn".', foot:['Tổng cộng','',fmtVND(sum(rows,'mid')),fmtVND(tp),fmtVND(td),fmtP(pct(td,tp)),'']})}
    <p class="small muted" style="margin:10px 0 0">Giải ngân tính từ hồ sơ thanh toán đã được Kho bạc chi trong năm (không tính thu hồi tạm ứng). Kịch bản giải ngân lũy kế theo quý nhập ở kế hoạch vốn năm, mặc định 20% · 45% · 70% · 100%.</p></div>`;
  else if(t==='kh'){ const caps=D('capitals').filter(c=>inFilter(c.projectId)).sort((a,b)=>N(b.year)-N(a.year)||pcode(a.projectId).localeCompare(pcode(b.projectId))||String(a.date||'').localeCompare(String(b.date||'')));
    body=`<div class="card"><div class="ch"><h2>Kế hoạch vốn được giao</h2>${ed?'<button class="btn primary sm" data-act="add-capitals">+ Thêm kế hoạch vốn</button>':''}</div>${table([
      {h:'Dự án',f:r=>pshort(r.projectId)},{h:'Loại kế hoạch · năm',f:r=>`<div style="min-width:150px">${esc(r.kind||'')}<div class="small muted num">Năm ${esc(r.year)}</div></div>`},{h:'Nguồn vốn',f:r=>`<div style="min-width:130px">${esc(r.source||'')}</div>`},
      {h:'Giá trị',r:1,f:r=>(r.kind===CAP_MINUS?'−':'')+fmtVND(r.amount)},{h:'Quyết định giao vốn',f:r=>`${esc(r.number||'—')}${r.date?`<div class="small muted num">${fmtDate(r.date)}</div>`:''}`},
      {h:'Kịch bản QI · QII · QIII',f:r=>r.kind==='Kế hoạch vốn năm'?`<span class="num small">${[1,2,3].map(q=>fmtN(capTarget(r.projectId,r.year,q),0)+'%').join(' · ')}</span>`:'<span class="muted small">—</span>'},
      {h:'Tệp',f:r=>attCell(atts('capitals',r.id))}], caps, {actions:r=>editBtns('von','capitals',r.id), empty:'Chưa có kế hoạch vốn.'})}</div>`; }
  else { const qs=[1,2,3,4].map(q=>{ const end=q<4? Y+'-'+pad(q*3)+'-'+(q===1?'31':'30') : Y+'-12-31'; const until=end<upto?end:upto; const reached=(Y+'-'+pad((q-1)*3+1)+'-01')<=upto;
      return {id:'q'+q, k:'Quý '+['I','II','III','IV'][q-1], tgv:sum(rows,r=>r.plan*capTarget(r.id,Y,q)/100), act:reached? sum(rows,r=>disbursed(r.id,Y,until)) : null}; });
    body=`<div class="grid g2"><div class="card"><h2>Kịch bản và thực tế giải ngân lũy kế năm ${Y}</h2>${tp?barChart({labels:qs.map(x=>x.k), series:[{name:'Kịch bản lũy kế',color:'var(--c5)',values:qs.map(x=>x.tgv)},{name:'Thực tế lũy kế',color:'var(--c2)',values:qs.map(x=>x.act||0)}], fmt:v=>fmtN(v/1e9,1)+' tỷ'}):emptyBox('Chưa có kế hoạch vốn năm '+Y+'.')}</div>
      <div class="card"><h2>Số liệu theo quý</h2>${table([{h:'Quý',k:'k'},{h:'Kịch bản lũy kế',r:1,f:r=>fmtVND(r.tgv)},{h:'Thực tế lũy kế',r:1,f:r=>r.act==null?'—':fmtVND(r.act)},{h:'Đạt kịch bản',r:1,f:r=>r.act==null?'—':fmtP(pct(r.act,r.tgv))},{h:'Tỷ lệ / KH năm',r:1,f:r=>r.act==null?'—':fmtP(pct(r.act,tp))}], qs)}</div></div>`; }
  return `<div class="head"><div class="grow"><h1>Kế hoạch vốn, giải ngân</h1><p>Kế hoạch đầu tư công trung hạn, vốn giao hằng năm và tiến độ giải ngân so với kịch bản</p></div>
    <select data-f="vy" aria-label="Năm kế hoạch">${opts(years.map(y=>[y,'Năm '+y]),Y)}</select></div>
  <div class="grid g4">${kpiCard('Kế hoạch vốn năm '+Y, fmtTy(tp), rows.filter(r=>r.plan).length+' dự án được giao vốn')}${kpiCard('Đã giải ngân', fmtTy(td), fmtP(pct(td,tp))+' kế hoạch vốn')}
    ${kpiCard('Kịch bản đến nay', fmtP(ttg), 'Chênh lệch '+(pct(td,tp)-ttg>=0?'+':'')+fmtP(pct(td,tp)-ttg), ttg-pct(td,tp)>10?'warn':'')}${kpiCard('Dự án chậm giải ngân', slow, 'chậm quá 10% so với kịch bản', slow?'bad':'')}</div>
  ${tabsBar('von', t, [['gn','Theo dõi giải ngân'],['kh','Kế hoạch vốn'],['q','Lũy kế theo quý']])}${body}`;
};
const capFields=()=>[projSel(),{key:'year',label:'Năm kế hoạch',type:'number',req:true,def:TODAY.slice(0,4)},{key:'kind',label:'Loại kế hoạch',type:'select',options:()=>catalog('Loại kế hoạch vốn'),req:true,def:'Kế hoạch vốn năm'},
  {key:'source',label:'Nguồn vốn',type:'select',options:()=>catalog('Nguồn vốn')},{key:'amount',label:'Giá trị (đồng)',type:'money',req:true},
  {key:'number',label:'Số quyết định giao vốn'},{key:'date',label:'Ngày quyết định',type:'date'},
  {key:'targetQ1',label:'Kịch bản giải ngân lũy kế hết quý I (%)',type:'percent',def:20},{key:'targetQ2',label:'Hết quý II (%)',type:'percent',def:45},{key:'targetQ3',label:'Hết quý III (%)',type:'percent',def:70},
  {key:'note',label:'Ghi chú (kịch bản chỉ áp dụng cho loại "Kế hoạch vốn năm")',type:'textarea'},{key:'att',label:'Quyết định giao kế hoạch vốn, văn bản đăng ký kế hoạch',type:'attach',col:'capitals'}];
const capLabel=v=>(pcode(v.projectId)||'')+' '+v.kind+' '+v.year;
ACT['add-capitals']=()=>openForm({title:'Thêm kế hoạch vốn', fields:capFields(), onSave:v=>save('capitals',v,capLabel(v))});
ACT['edit-capitals']=(id)=>openForm({title:'Cập nhật kế hoạch vốn', fields:capFields(), value:get('capitals',id), onSave:v=>save('capitals',v,capLabel(v))});

/* ===== NGHIỆM THU, BÀN GIAO, BẢO HÀNH ===== */
function warrantyState(a){ const w=warrantyEnd(a); if(!w) return null; const left=days(TODAY,w);
  if(left<0) return {k:'', t:'Hết bảo hành', left}; if(left<=30) return {k:'warn', t:'Còn '+left+' ngày', left}; return {k:'ok', t:'Đang bảo hành', left}; }
VIEWS['nghiem-thu']=()=>{
  const t=S.tab.nt||'ds'; const ed=can('nghiem-thu','edit'); const kf=S.f.ntk||'';
  const all=D('acceptances').filter(a=>inFilter(a.projectId)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  const rows=all.filter(a=>!kf||a.kind===kf);
  const wr=all.filter(a=>warrantyEnd(a)).sort((a,b)=>warrantyEnd(a).localeCompare(warrantyEnd(b)));
  const inW=wr.filter(a=>warrantyState(a).left>=0), soon=wr.filter(a=>{ const s=warrantyState(a); return s.left>=0&&s.left<=30; });
  const pk=id=>{ const k=id&&pkgOf(id); return k?`<span class="num small">${esc(k.code)}</span>`:'<span class="muted small">Toàn dự án</span>'; };
  const resPill=r=>!r?'—':pill(r, r==='Đạt'?'ok':r==='Không đạt'?'bad':'warn');
  let body='';
  if(t==='ds') body=`<div class="card"><div class="ch"><h2>Nghiệm thu, bàn giao</h2><select data-f="ntk" aria-label="Loại">${opts(catalog('Loại nghiệm thu, bàn giao'),kf,'Mọi loại')}</select>${ed?'<button class="btn primary sm" data-act="add-acceptances">+ Thêm biên bản</button>':''}</div>${table([
      {h:'Ngày · số biên bản',f:r=>`<div style="white-space:nowrap"><span class="num">${fmtDate(r.date)}</span><div class="small muted num">${esc(r.number||'—')}</div></div>`},{h:'Dự án · gói thầu',f:r=>`<div style="white-space:nowrap">${pshort(r.projectId)}<div>${pk(r.packageId)}</div></div>`},
      {h:'Loại, nội dung',f:r=>`<div style="min-width:240px"><b class="small">${esc(r.kind||'')}</b><div>${esc(r.content||'')}</div>${r.receiver?`<div class="small muted">Tiếp nhận: ${esc(r.receiver)}</div>`:''}</div>`},{h:'Kết quả',f:r=>`<div style="max-width:150px">${resPill(r.result).replace('<span class="pill','<span style="white-space:normal;line-height:1.3" class="pill')}</div>`},{h:'Trạng thái',f:r=>wfPill('acceptances',r)},{h:'Tệp',f:r=>attCell(atts('acceptances',r.id))}], rows,
      {actions:r=>wfBtns('acceptances',r)+wfEditBtns('acceptances',r), empty:'Chưa có biên bản nghiệm thu, bàn giao.'})}
    <p class="small muted" style="margin:10px 0 0">Nghiệm thu theo giai đoạn thi công, nghiệm thu hoàn thành và bàn giao đưa vào sử dụng theo Nghị định 207/2026/NĐ-CP; đính kèm biên bản, bản vẽ hoàn công.</p></div>`;
  else body=`<div class="card"><h2>Theo dõi bảo hành công trình</h2>${table([
      {h:'Dự án',f:r=>pshort(r.projectId)},{h:'Gói thầu',f:r=>pk(r.packageId)},{h:'Bàn giao / nghiệm thu',f:r=>`<span class="num">${fmtDate(r.date)}</span><div class="small muted">${esc(r.kind||'')}</div>`},
      {h:'Thời hạn bảo hành',f:r=>N(r.warrantyMonths)?esc(r.warrantyMonths)+' tháng':'—'},{h:'Hết bảo hành',f:r=>`<span class="num">${fmtDate(warrantyEnd(r))}</span>`},
      {h:'Bảo lãnh bảo hành đến',f:r=>`<span class="num">${fmtDate(r.warrantyGuaranteeUntil)}</span>`},{h:'Tình trạng',f:r=>{ const s=warrantyState(r); return pill(s.t,s.k); }}], wr,
      {actions:r=>wfEditBtns('acceptances',r), empty:'Chưa có công trình nào nhập thời hạn bảo hành.'})}
    <p class="small muted" style="margin:10px 0 0">Phần mềm tự cảnh báo trước 30 ngày khi sắp hết thời hạn bảo hành hoặc bảo lãnh bảo hành, để Ban kiểm tra hiện trạng và yêu cầu nhà thầu sửa chữa trước khi hoàn trả bảo lãnh.</p></div>`;
  return `<div class="head"><div class="grow"><h1>Nghiệm thu, bàn giao, bảo hành</h1><p>${all.length} biên bản, ${inW.length} công trình đang trong thời gian bảo hành</p></div></div>
  <div class="grid g4">${kpiCard('Nghiệm thu giai đoạn', all.filter(a=>/giai đoạn/i.test(a.kind||'')).length, 'biên bản')}${kpiCard('Nghiệm thu hoàn thành', all.filter(a=>/hoàn thành/i.test(a.kind||'')).length, 'hạng mục, công trình')}
    ${kpiCard('Đã bàn giao sử dụng', all.filter(a=>/bàn giao/i.test(a.kind||'')).length, 'công trình')}${kpiCard('Sắp hết bảo hành', soon.length, 'trong 30 ngày tới', soon.length?'warn':'')}</div>
  ${tabsBar('nt', t, [['ds','Nghiệm thu, bàn giao'],['bh','Theo dõi bảo hành']])}${body}`;
};
const accFields=()=>[projSel(),{key:'packageId',label:'Gói thầu (để trống nếu toàn dự án)',type:'select',options:()=>pkgOpts(''),full:true},
  {key:'kind',label:'Loại',type:'select',options:()=>catalog('Loại nghiệm thu, bàn giao'),req:true},{key:'date',label:'Ngày',type:'date',req:true,def:TODAY},
  {key:'number',label:'Số biên bản / văn bản'},{key:'result',label:'Kết quả',type:'select',options:()=>catalog('Kết quả nghiệm thu'),def:'Đạt'},
  {key:'content',label:'Nội dung nghiệm thu, bàn giao',full:true},{key:'receiver',label:'Đơn vị tiếp nhận, quản lý sử dụng',full:true},
  {key:'warrantyMonths',label:'Thời hạn bảo hành (tháng)',type:'number'},{key:'warrantyUntil',label:'Hết bảo hành (để trống: tự tính)',type:'date'},
  {key:'warrantyGuaranteeUntil',label:'Bảo lãnh bảo hành hiệu lực đến',type:'date'},{key:'note',label:'Tồn tại, ghi chú',type:'textarea'},
  {key:'att',label:'Biên bản nghiệm thu, bàn giao, bản vẽ hoàn công, bảo lãnh bảo hành',type:'attach',col:'acceptances'}];
const accCheck=v=>{ if(v.packageId){ const k=pkgOf(v.packageId); if(k&&k.projectId!==v.projectId){ $('#mform_err').textContent='Gói thầu không thuộc dự án đã chọn.'; return false; } } return true; };
ACT['add-acceptances']=()=>openForm({wf:'acceptances', title:'Thêm biên bản nghiệm thu, bàn giao', fields:accFields(), onSave:v=>accCheck(v)?save('acceptances',v,(v.number||v.kind)):false});
ACT['edit-acceptances']=(id)=>openForm({wf:'acceptances', title:'Cập nhật nghiệm thu, bàn giao', fields:accFields(), value:get('acceptances',id), onSave:v=>accCheck(v)?save('acceptances',v,(v.number||v.kind)):false});

/* ===== QUYẾT TOÁN DỰ ÁN HOÀN THÀNH ===== */
VIEWS['quyet-toan']=()=>{
  const ed=can('quyet-toan','edit');
  const rows=D('settlements').filter(x=>inFilter(x.projectId)).map(x=>({...x, st:settleState(x)})).sort((a,b)=>({bad:0,warn:1,'':2,info:3,acc:4,ok:5}[a.st.k])-({bad:0,warn:1,'':2,info:3,acc:4,ok:5}[b.st.k])||String(a.deadline||'').localeCompare(String(b.deadline||'')));
  const missing=projects().filter(p=>inFilter(p.id) && /hoàn thành|bàn giao|quyết toán/i.test(p.status||'') && !D('settlements').some(x=>x.projectId===p.id));
  const late=rows.filter(r=>r.st.k==='bad').length;
  const red=sum(rows.filter(r=>r.approvedValue!=null&&r.approvedValue!==''&&N(r.proposedValue)),r=>N(r.proposedValue)-N(r.approvedValue));
  return `<div class="head"><div class="grow"><h1>Quyết toán dự án hoàn thành</h1><p>Theo dõi hạn lập báo cáo quyết toán, thẩm tra, phê duyệt và tất toán tài khoản</p></div>${ed?'<button class="btn primary" data-act="add-settlements">+ Thêm hồ sơ quyết toán</button>':''}</div>
  <div class="grid g4">${kpiCard('Dự án phải quyết toán', rows.length+missing.length, missing.length?missing.length+' dự án chưa lập hồ sơ':'đã lập đủ hồ sơ', missing.length?'warn':'')}${kpiCard('Quá hạn lập quyết toán', late, 'dự án', late?'bad':'')}
    ${kpiCard('Đã phê duyệt', rows.filter(r=>r.approvalDate).length, 'giá trị '+fmtTy(sum(rows,'approvedValue')))}${kpiCard('Giảm trừ qua thẩm tra', fmtTy(red), 'so với giá trị đề nghị')}</div>
  ${missing.length?`<div class="card"><h2>Dự án đã hoàn thành chưa lập hồ sơ quyết toán</h2><div class="list">${missing.map(p=>`<div class="alert"><span style="flex:1"><b>${esc(p.code)}</b> ${esc(p.name)} · ${esc(p.status)}</span>${ed?`<button class="btn sm" data-act="add-settlements" data-id="${p.id}">Lập hồ sơ</button>`:''}</div>`).join('')}</div></div>`:''}
  <div class="card"><h2>Hồ sơ quyết toán</h2>${table([
    {h:'Dự án',f:r=>pcell(r.projectId)},{h:'Hoàn thành · hạn lập · ngày trình',f:r=>`<div class="num small" style="white-space:nowrap">${fmtDate(r.completedDate)}<br>Hạn ${fmtDate(r.deadline)}<br>Trình ${fmtDate(r.submittedDate)}</div>`},
    {h:'Đề nghị · thẩm tra · phê duyệt',r:1,f:r=>`<div class="num small" style="white-space:nowrap">${fmtVND(r.proposedValue)}<br>${fmtVND(r.auditedValue)}<br><b>${fmtVND(r.approvedValue)}</b></div>`},
    {h:'Phê duyệt · tất toán',f:r=>`${r.number?`${esc(r.number)}<div class="small muted num">${fmtDate(r.approvalDate)}</div>`:'—'}<div class="small num">Tất toán: ${fmtDate(r.closedDate)}</div>`},
    {h:'Tình trạng',f:r=>pill(r.st.t,r.st.k)},{h:'Tệp',f:r=>attCell(atts('settlements',r.id))}], rows,
    {actions:r=>editBtns('quyet-toan','settlements',r.id), empty:'Chưa có hồ sơ quyết toán.', foot:['Tổng cộng','',`<div class="num small" style="white-space:nowrap">${fmtVND(sum(rows,'proposedValue'))}<br>${fmtVND(sum(rows,'auditedValue'))}<br><b>${fmtVND(sum(rows,'approvedValue'))}</b></div>`,'','','']})}
  <p class="small muted" style="margin:10px 0 0">Nhập hạn lập báo cáo quyết toán theo quy định quyết toán dự án hoàn thành hiện hành. Phần mềm cảnh báo trước 30 ngày, khi quá hạn và khi đã phê duyệt quá 60 ngày chưa tất toán tài khoản.</p></div>`;
};
const setFields=(pid)=>[projSel(pid),{key:'completedDate',label:'Ngày hoàn thành, bàn giao',type:'date'},{key:'deadline',label:'Hạn lập báo cáo quyết toán',type:'date'},{key:'submittedDate',label:'Ngày trình thẩm tra',type:'date'},
  {key:'proposedValue',label:'Giá trị đề nghị quyết toán (đồng)',type:'money'},{key:'auditedValue',label:'Giá trị thẩm tra (đồng)',type:'money'},{key:'approvedValue',label:'Giá trị phê duyệt (đồng)',type:'money'},
  {key:'number',label:'Số quyết định phê duyệt quyết toán'},{key:'approvalDate',label:'Ngày phê duyệt',type:'date'},{key:'closedDate',label:'Ngày tất toán tài khoản',type:'date'},
  {key:'note',label:'Ghi chú, vướng mắc',type:'textarea'},{key:'att',label:'Báo cáo quyết toán, thông báo thẩm tra, quyết định phê duyệt',type:'attach',col:'settlements'}];
const setSave=v=>{ v.status=settleState(v).t; const p=projOf(v.projectId); return save('settlements',v,'Quyết toán '+(p?p.code:'')); };
ACT['add-settlements']=(pid)=>{ const p=pid&&projOf(pid); const done=p? D('acceptances').filter(a=>a.projectId===p.id&&/bàn giao|hoàn thành công trình/i.test(a.kind||'')).map(a=>a.date).sort().pop() : '';
  openForm({title:'Thêm hồ sơ quyết toán', fields:setFields(pid), value:p?{projectId:p.id, completedDate:done||''}:{}, onSave:setSave}); };
ACT['edit-settlements']=(id)=>openForm({title:'Cập nhật hồ sơ quyết toán', fields:setFields(), value:get('settlements',id), onSave:setSave});

/* ===== GIẢI PHÓNG MẶT BẰNG ===== */
VIEWS['gpmb']=()=>{
  const ed=can('gpmb','edit');
  const rows=D('clearances').filter(c=>inFilter(c.projectId)).sort((a,b)=>pcode(a.projectId).localeCompare(pcode(b.projectId))||a.name.localeCompare(b.name));
  const hh=sum(rows,'households'), hp=sum(rows,'householdsPaid'), ar=sum(rows,'area'), ah=sum(rows,'handedArea'), bu=sum(rows,'budget'), pa=sum(rows,'amountPaid');
  const late=rows.filter(c=>!c.handoverDate&&c.handoverDue&&c.handoverDue<TODAY).length;
  const st=c=> c.handoverDate&&clearPct(c)>=100? pill('Đã bàn giao','ok') : !c.handoverDate&&c.handoverDue&&c.handoverDue<TODAY? pill('Chậm '+days(c.handoverDue,TODAY)+' ngày','bad') : c.handoverDate? pill('Bàn giao một phần','acc') : pill('Đang thực hiện','warn');
  return `<div class="head"><div class="grow"><h1>Giải phóng mặt bằng</h1><p>Bồi thường, hỗ trợ, tái định cư và bàn giao mặt bằng cho thi công</p></div>${ed?'<button class="btn primary" data-act="add-clearances">+ Thêm khu vực</button>':''}</div>
  <div class="grid g4">${kpiCard('Hộ bị ảnh hưởng', fmtN(hh), 'đã chi trả '+fmtN(hp)+' hộ ('+fmtP(pct(hp,hh))+')')}${kpiCard('Diện tích đã bàn giao', fmtP(pct(ah,ar)), fmtN(ah)+' / '+fmtN(ar)+' m²')}
    ${kpiCard('Kinh phí đã chi trả', fmtTy(pa), fmtP(pct(pa,bu))+' phương án '+fmtTy(bu))}${kpiCard('Chậm bàn giao', late, 'khu vực', late?'bad':'')}</div>
  <div class="card"><h2>Tiến độ bồi thường, bàn giao mặt bằng</h2>${table([
    {h:'Dự án',f:r=>pshort(r.projectId)},{h:'Khu vực, đoạn tuyến',f:r=>`<div style="min-width:200px">${esc(r.name)}${r.number?`<div class="small muted">Phương án ${esc(r.number)} · ${fmtDate(r.planDate)}</div>`:''}${r.issues?`<div class="small" style="color:var(--amber)">${esc(r.issues)}</div>`:''}</div>`},{h:'Hộ đã chi trả · m² đã bàn giao',r:1,f:r=>`<div class="num" style="white-space:nowrap">${fmtN(r.householdsPaid)} / ${fmtN(r.households)} hộ<div class="small muted">${fmtN(r.handedArea)} / ${fmtN(r.area)} m²</div></div>`},
    {h:'Kinh phí đã chi / phương án',r:1,f:r=>`${fmtVND(r.amountPaid)}<div class="small muted">${fmtVND(r.budget)}</div>`},
    {h:'Tiến độ, hạn bàn giao',f:r=>`<div style="min-width:130px">${progBar(clearPct(r))}<div style="margin-top:4px">${st(r)}</div><div class="small muted num" style="white-space:nowrap">Hạn ${fmtDate(r.handoverDue)}${r.handoverDate?' · giao '+fmtDate(r.handoverDate):''}</div></div>`},{h:'Tệp',f:r=>attCell(atts('clearances',r.id))}], rows,
    {actions:r=>editBtns('gpmb','clearances',r.id), empty:'Chưa có khu vực giải phóng mặt bằng.'})}</div>`;
};
const clrFields=()=>[projSel(),{key:'name',label:'Khu vực, đoạn tuyến',req:true,full:true},{key:'households',label:'Số hộ bị ảnh hưởng',type:'number'},{key:'householdsPaid',label:'Số hộ đã chi trả',type:'number'},
  {key:'area',label:'Diện tích thu hồi (m²)',type:'number'},{key:'handedArea',label:'Diện tích đã bàn giao (m²)',type:'number'},{key:'budget',label:'Kinh phí theo phương án (đồng)',type:'money'},{key:'amountPaid',label:'Kinh phí đã chi trả (đồng)',type:'money'},
  {key:'number',label:'Số quyết định phê duyệt phương án'},{key:'planDate',label:'Ngày phê duyệt',type:'date'},{key:'handoverDue',label:'Hạn bàn giao mặt bằng',type:'date'},{key:'handoverDate',label:'Ngày bàn giao (đợt gần nhất)',type:'date'},
  {key:'issues',label:'Vướng mắc, kiến nghị',type:'textarea'},{key:'att',label:'Phương án bồi thường, biên bản bàn giao mặt bằng',type:'attach',col:'clearances'}];
const clrCheck=v=>{ const e=$('#mform_err'); if(N(v.householdsPaid)>N(v.households)&&v.households!=null){ e.textContent='Số hộ đã chi trả lớn hơn số hộ bị ảnh hưởng.'; return false; } if(N(v.handedArea)>N(v.area)&&v.area!=null){ e.textContent='Diện tích đã bàn giao lớn hơn diện tích thu hồi.'; return false; } return true; };
ACT['add-clearances']=()=>openForm({title:'Thêm khu vực giải phóng mặt bằng', fields:clrFields(), onSave:v=>clrCheck(v)?save('clearances',v,v.name):false});
ACT['edit-clearances']=(id)=>openForm({title:'Cập nhật giải phóng mặt bằng', fields:clrFields(), value:get('clearances',id), onSave:v=>clrCheck(v)?save('clearances',v,v.name):false});

/* ===== TRÌNH DUYỆT HỒ SƠ (bản 1.2; quy trình tự thiết lập, theo dõi hồ sơ, phiếu trình, thông báo: bản 1.8) ===== */
const WF_ACT = {submit:['Chuyển duyệt','Chuyển hồ sơ sang bước xử lý đầu tiên của quy trình.',false], withdraw:['Rút lại','Rút hồ sơ vừa chuyển về để sửa tiếp (bước tiếp theo chưa xử lý).',false],
  approve:['Duyệt','Duyệt hồ sơ.',false], check:['Kiểm tra đạt','Xác nhận hồ sơ đúng, đủ và chuyển sang bước tiếp theo.',false], return:['Trả lại','Trả hồ sơ về người lập để sửa, ghi rõ nội dung cần sửa.',true],
  reject:['Từ chối','Từ chối hồ sơ (không thực hiện), ghi rõ lý do.',true], recall:['Thu hồi','Thu hồi hồ sơ đã duyệt về soạn thảo để điều chỉnh, ghi rõ lý do.',true]};
const WF_FIN = {addenda:'Sau khi duyệt, giá trị và thời hạn của phụ lục được cộng vào hợp đồng.', schedule:'Sau khi duyệt, kế hoạch được tính vào tiến độ gói thầu, dự án, đường cong S và cảnh báo; cán bộ được cập nhật tiến độ thực tế.',
  vbatches:'Sau khi duyệt, khối lượng nghiệm thu của đợt được tính vào số liệu, báo cáo và là căn cứ lập hồ sơ thanh toán khối lượng hoàn thành.', payments:'Sau khi duyệt, hồ sơ chuyển sang trạng thái Đang trình KBNN; kế toán xác nhận khi Kho bạc chi.'};
ACT.wf=(key)=>{
  const [col,id,a]=key.split('|'); const r=get(col,id); if(!r) return;
  if(a==='history') return wfHistory(col,r);
  if(a==='print') return wfPrint(col,r);
  const w=WF[col], st=wfState(col,r), pid=w.pid(r), on=wfOn(col,pid);
  let [lb,desc,need]=WF_ACT[a], next=null, nextLast=false, fin=false;
  if(a==='submit'){ const rt=on? wfRouteFor(wfFlow(col,pid), wfAmount(col,r)) : [];
    if(rt.length){ next=rt[0]; nextLast=rt.length===1; desc=`Hồ sơ đi qua ${rt.length} bước: ${rt.map((s,i)=>(i+1)+'. '+s.label).join('; ')}.`; }
    else { lb='Ghi nhận'; fin=true; desc=on? 'Giá trị hồ sơ không thuộc khoảng phải trình duyệt: hồ sơ được ghi nhận ngay.' : 'Loại hồ sơ này không qua trình duyệt: hồ sơ được ghi nhận ngay.'; } }
  if((a==='check'||a==='approve') && st.step){ lb=st.step.verb||lb; desc=`Bước: ${st.step.label}.`+(st.isLast?' Đây là bước cuối của quy trình.':'');
    if(st.isLast) fin=true; else { next=st.route[st.idx+1]; nextLast=st.idx+1===st.route.length-1; }
    if(st.step.noteRequired) need=true; }
  else if(a==='approve') fin=true;
  if(a==='return' && st.step && st.step.returnTo==='prev' && st.idx>0) desc=`Trả hồ sơ về bước trước (${st.route[st.idx-1].label}), ghi rõ nội dung cần sửa.`;
  if(a==='withdraw' && st.idx>0) desc=`Rút hồ sơ về bước "${st.route[st.idx-1].label}" để xử lý lại (bước hiện tại chưa xử lý).`;
  if(a==='check' && col==='vbatches' && st.idx===0) desc='Tư vấn giám sát xác nhận khối lượng thực hiện và nghiệm thu của đợt đúng với hiện trường, rồi chuyển bước tiếp theo.';
  const fields=[{key:'info',type:'html',label:'',full:true,html:`<p style="margin:0 0 6px">${esc(desc)}</p><p class="small muted" style="margin:0">${esc(w.info(r))}</p>${fin&&WF_FIN[col]?`<p class="small" style="margin:6px 0 0">${esc(WF_FIN[col])}</p>`:''}`}];
  if(next){ const hs=wfHandlers(col,next,nextLast);
    fields.push({key:'assignTo',label:`Chuyển cho (bước tiếp theo: ${next.label}${next.dueDays?', hạn '+next.dueDays+' ngày làm việc':''})`,type:'select',full:true,
      options:()=>hs.map(u=>[u.id, u.name+(u.unit?' · '+u.unit:'')]), hint:hs.length?'Để trống: mọi người được phân công bước này đều xử lý được.':'Chưa có tài khoản nào được phân công bước này; quản trị hệ thống xử lý thay hoặc phân công ở Thiết lập quy trình.'}); }
  fields.push({key:'note',label:need?'Ý kiến (bắt buộc)':'Ý kiến (nếu có)',type:'textarea',rows:3,req:need,full:true});
  openForm({title:lb+': '+w.label(r), narrow:true, submit:lb, value:{}, fields,
    onSave:async v=>{ const res=await api('POST','/api/approvals',{collection:col, id, action:a, note:v.note||'', assignTo:v.assignTo||null}); Store.setLocal(col,res.record); Store.setLocal('approvals',res.log); return res.record; }});
};
const wfActPill = x => pill(x.action, x.toStatus===(WF[x.collection]||{}).ok||x.action==='Duyệt'?'ok':x.action==='Từ chối'?'bad':x.action==='Trả lại'||x.action==='Thu hồi'||x.action==='Rút lại'?'warn':'info');
function wfStepOf(x){ if(!x.step) return ''; const r=get(x.collection,x.recordId); const st=r? wfState(x.collection,r) : null; const s=st && st.route.find(k=>k.key===x.step); return s? s.label : x.step; }
function wfHistory(col, r){
  const hs=wfLogs(col,r.id);
  openModal(`<div class="mform wide"><header><h3>Lịch sử trình duyệt: ${esc(WF[col].label(r))}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:14px 16px">
    ${table([{h:'Thời gian',f:x=>`<span class="num small">${fmtDT(x.at)}</span>`},{h:'Người thực hiện',f:x=>esc(x.byName||x.by||'')},{h:'Thao tác',f:wfActPill},{h:'Chuyển tới',f:x=>x.step?`<span class="small">${esc(wfStepOf(x))}${x.assigneeName?' · '+esc(x.assigneeName):''}${x.due?' · hạn '+fmtDate(x.due):''}</span>`:`<span class="small"><b>${esc(x.toStatus||'')}</b></span>`},{h:'Ý kiến',f:x=>esc(x.note||'')}], hs, {nopage:true, empty:'Chưa có lịch sử.'})}</div></div>`);
}
/* Phiếu trình: thông tin hồ sơ, các bước của quy trình, ý kiến từng bước, ô ký */
function wfPrint(col, r){
  const w=WF[col], st=wfState(col,r), pj=projOf(w.pid(r))||{}, hs=wfLogs(col,r.id).reverse(), d=TODAY.split('-');
  const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Phiếu trình ${esc(w.label(r))}</title><style>
  @page{size:A4; margin:16mm} body{font-family:"Times New Roman",serif; font-size:13px; color:#000}
  .hd{display:grid; grid-template-columns:1fr 1.2fr; text-align:center; margin-bottom:12px} .hd b{display:block} .hd .u{display:inline-block; border-top:1px solid #000; width:40%; margin-top:2px}
  h1{font-size:17px; text-align:center; margin:14px 0 4px} .sub{text-align:center; font-style:italic; margin-bottom:12px}
  table{width:100%; border-collapse:collapse; margin-top:8px} th,td{border:1px solid #000; padding:4px 6px; vertical-align:top} th{background:#eee} dl{display:grid; grid-template-columns:150px 1fr; gap:4px 10px; margin:0} dt{font-weight:bold}
  .sign{display:grid; grid-template-columns:1fr 1fr; text-align:center; margin-top:22px} .sign i{display:block} .sign .sp{height:80px}</style></head><body>
  <div class="hd"><div>${esc((BR.orgName||'').toUpperCase())}<b>${esc((BR.unitName||BR.reportOrg||'').toUpperCase())}</b><span class="u"></span></div>
    <div><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><b>Độc lập - Tự do - Hạnh phúc</b><span class="u"></span></div></div>
  <h1>PHIẾU TRÌNH</h1><div class="sub">${esc(w.name)}</div>
  <dl><dt>Hồ sơ</dt><dd>${esc(w.label(r))}</dd><dt>Dự án</dt><dd>${esc([pj.code,pj.name].filter(Boolean).join(' · '))}</dd><dt>Nội dung</dt><dd>${esc(w.info(r))}</dd>
    <dt>Tình trạng</dt><dd>${esc(wfDisp(col,wfStatus(col,r),r))}</dd>${st.sub?`<dt>Người trình</dt><dd>${esc(st.sub.byName||st.sub.by||'')}, ${fmtDT(st.sub.at)}</dd>`:''}</dl>
  <table><thead><tr><th style="width:36px">TT</th><th>Bước xử lý</th><th>Người xử lý</th><th>Thời gian</th><th>Ý kiến</th></tr></thead><tbody>
  ${hs.map((x,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(x.action)}${x.step?` → ${esc(wfStepOf(x))}`:x.toStatus?` → ${esc(x.toStatus)}`:''}</td><td>${esc(x.byName||x.by||'')}</td><td>${fmtDT(x.at)}</td><td>${esc(x.note||'')}</td></tr>`).join('')}</tbody></table>
  <div class="sign"><div><i>&nbsp;</i><b>NGƯỜI TRÌNH</b><i>(Ký, ghi rõ họ tên)</i><div class="sp"></div>${esc(st.sub?(st.sub.byName||''):'')}</div><div><i>…, ngày ${d[2]} tháng ${d[1]} năm ${d[0]}</i><b>LÃNH ĐẠO BAN QUẢN LÝ DỰ ÁN</b><i>(Ký, ghi rõ họ tên)</i><div class="sp"></div></div></div>
  </body></html>`;
  const fr=document.createElement('iframe'); fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0'; fr.title='In phiếu trình';
  document.body.appendChild(fr); const doc=fr.contentDocument; doc.open(); doc.write(html); doc.close();
  setTimeout(()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }finally{ setTimeout(()=>fr.remove(), 60000); } }, 250);
  log('In phiếu trình', col, w.label(r));
}
/* Thông báo: hồ sơ chờ mình xử lý, hồ sơ bị trả lại, hồ sơ mình chuyển đã được duyệt (7 ngày gần nhất) */
function wfNotices(){ if(!S.user) return []; const me=S.user.username, out=[], since=new Date(Date.now()-7*864e5).toISOString();
  wfMine().forEach(x=>{ const st=wfState(x.col,x.r); out.push({col:x.col, r:x.r, act:true, kind:wfOverdue(x.col,x.r,st)?'bad':'warn', text:`Chờ bạn ${lcFirst(st.step.verb||'xử lý')}: ${WF[x.col].label(x.r)}`, at:st.since||x.r.updatedAt, sub:(st.last?'Chuyển bởi '+(st.last.byName||st.last.by):'')+(st.due?' · hạn '+fmtDate(st.due)+(wfOverdue(x.col,x.r,st)?' (quá hạn)':''):'')}); });
  Object.keys(WF).filter(col=>can(WF[col].mod)).forEach(col=>D(col).forEach(r=>{ const ls=wfLogs(col,r.id); if(!ls.length) return; const l=ls[0], sub=ls.find(a=>a.route);
    const mineSub=(sub&&sub.by===me) || r.updatedBy===me;
    if(l.action==='Trả lại' && mineSub) out.push({col, r, act:true, kind:'bad', text:`Bị trả lại: ${WF[col].label(r)}`, at:l.at, sub:`${l.byName||l.by}: ${l.note||''}`});
    else if(l.toStatus===WF[col].ok && sub && sub.by===me && l.by!==me && l.at>=since) out.push({col, r, kind:'ok', text:`Đã duyệt: ${WF[col].label(r)}`, at:l.at, sub:'Bởi '+(l.byName||l.by)});
    else if(l.toStatus===WF[col].no && sub && sub.by===me && l.at>=since) out.push({col, r, kind:'bad', text:`Bị từ chối: ${WF[col].label(r)}`, at:l.at, sub:`${l.byName||l.by}: ${l.note||''}`}); }));
  return out.sort(by('at',-1)); }
function wfBell(){ if(!S.user) return ''; const n=wfNotices().filter(x=>x.act).length;
  return `<button class="btn ghost sm bell" data-act="wf-bell" title="Thông báo trình duyệt" aria-label="Thông báo trình duyệt${n?': '+n+' việc cần xử lý':''}">${ic('bell').replace('<svg','<svg width="18" height="18"')}${n?`<span class="bcnt num">${n>99?'99+':n}</span>`:''}</button>`; }
ACT['wf-bell']=()=>{ const ns=wfNotices();
  openModal(`<div class="mform"><header><h3>Thông báo trình duyệt</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:8px 16px 16px">
    ${ns.length? `<div class="list">${ns.slice(0,40).map(x=>`<button class="btn ghost" style="justify-content:flex-start;text-align:left;white-space:normal;display:block;width:100%" data-act="wf-go" data-id="${esc(x.col+'|'+(x.act?(x.kind==='bad'&&!wfWaiting(x.col,x.r)?'soan':'cho'):'xong'))}">${pill(x.kind==='ok'?'Đã duyệt':x.act&&wfWaiting(x.col,x.r)?'Cần xử lý':x.kind==='bad'?'Trả lại, từ chối':'Thông báo', x.kind)} <b style="font-weight:600">${esc(x.text)}</b><div class="small muted">${fmtDT(x.at)}${x.sub?' · '+esc(x.sub):''}</div></button>`).join('')}</div>`
      : emptyBox('Không có thông báo mới.')}
    <div class="toolbar" style="margin-top:10px"><button class="btn sm" data-act="wf-go" data-id="|cho">Mở Trình duyệt hồ sơ</button></div></div></div>`); };
ACT['wf-go']=(k)=>{ const t=k.split('|')[1]||'cho'; closeModal(); S.tab.td2=t; if(location.hash==='#trinh-duyet') render(); else location.hash='trinh-duyet'; };

VIEWS['trinh-duyet']=()=>{
  const t=S.tab.td2||'cho', me=S.user.username;
  const vis=Object.keys(WF).filter(col=>can(WF[col].mod));
  const all=vis.flatMap(col=>D(col).filter(r=>(r.status||!WF[col].opt) && pidOk(WF[col].pid(r)) && (!S.pid||WF[col].pid(r)===S.pid)).map(r=>({col,r,id:col+'|'+r.id,st:wfState(col,r)})));
  const mine=wfMine().filter(x=>!S.pid||WF[x.col].pid(x.r)===S.pid).map(x=>({...x,id:x.col+'|'+x.r.id,st:wfState(x.col,x.r)}));
  const cycle=x=>{ const i=x.st.sub? x.st.logs.indexOf(x.st.sub) : x.st.logs.length-1; return x.st.logs.slice(0,i+1); };
  const waiting=all.filter(x=>wfWaiting(x.col,x.r));
  const drafts=all.filter(x=>wfStatus(x.col,x.r)===WF[x.col].draft && (x.r.updatedBy===me || (x.st.sub&&x.st.sub.by===me)));
  const sent=waiting.filter(x=>cycle(x).some(l=>l.by===me));
  const done=all.filter(x=>wfLocked(x.col,x.r) && x.st.logs.some(l=>l.by===me)).sort((a,b)=>String((b.st.last||{}).at||'').localeCompare(String((a.st.last||{}).at||'')));
  const hist=D('approvals').filter(a=>vis.includes(a.collection) && (!S.pid||a.projectId===S.pid)).sort(by('at',-1));
  const od=waiting.filter(x=>wfOverdue(x.col,x.r,x.st)).length;
  const lastNote=x=>{ const h=x.st.last; return h&&h.note? `<div class="small muted">${esc(h.action)} · ${esc(h.byName||'')}: ${esc(h.note)}</div>` : ''; };
  const cols=[{h:'Loại hồ sơ',f:x=>`<span class="small">${esc(WF[x.col].name)}</span>`},{h:'Hồ sơ',f:x=>`<b style="font-weight:600">${esc(WF[x.col].label(x.r))}</b><div class="small muted">${esc(WF[x.col].info(x.r))}</div>${lastNote(x)}`},
    {h:'Dự án',f:x=>`<span style="white-space:nowrap">${esc((projOf(WF[x.col].pid(x.r))||{}).code||'')}</span>`},{h:'Đang ở bước',f:x=>wfPill(x.col,x.r)},
    {h:'Cập nhật',f:x=>{ const l=x.st.last; return l? `<span class="num small">${fmtDT(l.at)}</span><div class="small muted">${esc(l.action)} · ${esc(l.byName||l.by||'')}</div>` : `<span class="num small">${fmtDT(x.r.updatedAt)}</span><div class="small muted">${esc(x.r.updatedBy||'')}</div>`; }}];
  const lists={cho:mine, soan:drafts, chuyen:sent, xong:done, dang:waiting};
  const tabs=[['cho','Chờ tôi xử lý',mine.length],['soan','Tôi đang soạn',drafts.length],['chuyen','Tôi đã chuyển',sent.length],['xong','Đã hoàn thành',done.length],['dang','Tất cả đang xử lý',waiting.length],['ls','Lịch sử duyệt',0],...(myGroup()?.admin?[['qt','Thiết lập quy trình',0]]:[])];
  const empty={cho:Object.keys(WF).some(c=>can(WF[c].mod,'approve')||can(WF[c].mod,'check'))||D('approvals').length?'Không có hồ sơ nào chờ bạn xử lý.':'Tài khoản của bạn chưa được phân công bước duyệt nào. Hồ sơ bạn chuyển sẽ hiện ở thẻ Tôi đã chuyển.',
    soan:'Không có hồ sơ nháp hoặc bị trả lại của bạn.', chuyen:'Không có hồ sơ bạn đã chuyển đang chờ xử lý.', xong:'Chưa có hồ sơ đã hoàn thành mà bạn tham gia.', dang:'Không có hồ sơ đang xử lý.'};
  const body=t==='qt'? wfConfigView() : t==='ls'
    ? `<div class="card">${table([{h:'Thời gian',f:x=>`<span class="num small">${fmtDT(x.at)}</span>`},{h:'Hồ sơ',f:x=>`<span class="small muted">${esc((WF[x.collection]||{}).name||'')}</span><div>${esc(x.target||'')}</div>`},{h:'Thao tác',f:wfActPill},{h:'Chuyển tới',f:x=>x.step?`<span class="small">${esc(wfStepOf(x))}${x.assigneeName?' · '+esc(x.assigneeName):''}</span>`:`<span class="small">${esc(x.toStatus||'')}</span>`},{h:'Người thực hiện',f:x=>esc(x.byName||x.by||'')},{h:'Ý kiến',f:x=>esc(x.note||'')}], hist, {empty:'Chưa có lịch sử trình duyệt.'})}</div>`
    : `<div class="card">${table(cols, lists[t]||[], {actions:x=>wfBtns(x.col,x.r), empty:empty[t]})}</div>`;
  return `<div class="head"><div class="grow"><h1>Trình duyệt hồ sơ</h1><p>Hồ sơ do cán bộ lập rồi chuyển duyệt; mỗi bước do người được phân công xử lý: chuyển tiếp, trả lại hoặc từ chối. Người vừa chuyển được rút lại khi bước sau chưa xử lý. Chỉ hồ sơ đã duyệt mới được tính vào số liệu.${od?` <b style="color:var(--red)">${od} hồ sơ quá hạn xử lý.</b>`:''}</p></div></div>
  <div class="tabs">${tabs.map(([k,l,n])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="td2" data-id="${k}">${l}${n?` <span class="cnt" style="position:static;margin-left:4px">${n}</span>`:''}</button>`).join('')}</div>${body}`;
};

/* ----- Thiết lập quy trình duyệt (quản trị) ----- */
const wfClone = o => JSON.parse(JSON.stringify(o));
function wfSteps(fc){ return (fc.steps||[]).map((s,i)=>{ const gs=(s.groups||[]).map(id=>(get('groups',id)||{}).name).filter(Boolean), us=(s.users||[]).map(id=>(get('users',id)||{}).name).filter(Boolean);
  const who=[...gs,...us].join(', ')||(i===fc.steps.length-1?'theo quyền Duyệt':'theo quyền Kiểm tra hồ sơ');
  const amt=s.minAmount||s.maxAmount? ` · giá trị ${s.minAmount?'từ '+fmtTy(s.minAmount):''}${s.maxAmount?' dưới '+fmtTy(s.maxAmount):''}` : '';
  return `<div class="small"><b>${i+1}. ${esc(s.label)}</b> <span class="muted">(${esc(s.verb)}; ${esc(who)}${s.dueDays?'; hạn '+s.dueDays+' ngày':''}${s.returnTo==='prev'?'; trả về bước trước':''}${amt})</span></div>`; }).join(''); }
function wfConfigView(){ const c=wfCfg(), pid=S.f.wfp||'', pj=projOf(pid);
  const rows=Object.keys(WF).map(col=>{ const own=pid && c.projects && c.projects[pid] && c.projects[pid][col]; const fc=own || c.flows[col] || {enabled:false,steps:[]};
    return {id:col, col, fc, own:!!own}; });
  return `<div class="card"><div class="ch"><h2>Quy trình duyệt theo loại hồ sơ</h2><select data-f="wfp" aria-label="Phạm vi" style="max-width:320px">${opts(projects().map(p=>[p.id,'Quy trình riêng: '+p.code]), pid, 'Quy trình chung (mọi dự án)')}</select></div>
    <p class="small muted" style="margin-top:0">${pid?`Dự án ${esc(pj?pj.code:'')}: loại hồ sơ chưa thiết lập riêng thì dùng quy trình chung.`:'Bật loại hồ sơ nào thì hồ sơ đó phải chuyển duyệt qua các bước dưới đây; tắt thì hồ sơ được ghi nhận ngay khi lưu. Hồ sơ đang xử lý giữ nguyên các bước của lần chuyển duyệt.'}</p>
    ${table([{h:'Loại hồ sơ',f:r=>`<b style="font-weight:600">${esc(WF[r.col].name)}</b>${pid?`<div class="small muted">${r.own?'Quy trình riêng của dự án':'Đang dùng quy trình chung'}</div>`:''}`},
      {h:'Áp dụng',f:r=>`<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="wf-on" data-id="${r.col}" ${r.fc.enabled?'checked':''}${pid&&!r.own?' disabled':''}> ${r.fc.enabled?'Có':'Không'}</label>`},
      {h:'Các bước',f:r=>wfSteps(r.fc)||'<span class="muted small">Chưa có bước</span>'}], rows,
      {nopage:true, actions:r=>`<button class="btn sm" data-act="wf-edit" data-id="${r.col}">${pid&&!r.own?'Thiết lập riêng':'Thiết lập bước'}</button>${pid&&r.own?`<button class="btn sm ghost danger" data-act="wf-own-off" data-id="${r.col}">Dùng quy trình chung</button>`:''}`})}</div>
  <div class="card"><h2>Nguyên tắc xử lý</h2><div class="list">
    <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-act="wf-opt" data-id="assignedOnly" ${c.assignedOnly!==false?'checked':''}> Hồ sơ chuyển đích danh thì chỉ người được chọn (hoặc quản trị) xử lý</label>
    <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-act="wf-opt" data-id="noSelfReview" ${c.noSelfReview!==false?'checked':''}> Người chuyển duyệt hồ sơ không tự xử lý các bước sau của chính hồ sơ đó</label></div>
    <p class="small muted" style="margin:8px 0 0">Bước không chọn nhóm, người xử lý thì theo quyền "Kiểm tra hồ sơ" (bước giữa) hoặc "Duyệt" (bước cuối) của nhóm người dùng ở Quản trị hệ thống.</p></div>`; }
async function wfSaveCfg(c){ const r=await api('PUT','/api/workflow',c); Store.meta.wf=r; Store.meta.wfCheck=Object.keys(r.flows).filter(k=>(r.flows[k].steps||[]).length>1); toast('Đã lưu quy trình duyệt'); render(); return r; }
function wfTarget(c, col, pid, make){ if(!pid) return c.flows[col]; c.projects=c.projects||{}; const m=c.projects[pid]=c.projects[pid]||{}; if(!m[col] && make) m[col]=wfClone(c.flows[col]); return m[col]; }
ACT['wf-on']=(col,el)=>{ const c=wfClone(wfCfg()), t=wfTarget(c,col,S.f.wfp||'',true); t.enabled=el.checked; wfSaveCfg(c).catch(ex=>{ el.checked=!el.checked; toast(errText(ex),'err'); }); };
ACT['wf-opt']=(k,el)=>{ const c=wfClone(wfCfg()); c[k]=el.checked; wfSaveCfg(c).catch(ex=>{ el.checked=!el.checked; toast(errText(ex),'err'); }); };
ACT['wf-own-off']=async(col)=>{ const pid=S.f.wfp||''; if(!pid) return; if(!await confirmBox('Bỏ quy trình riêng của dự án cho loại hồ sơ này và dùng quy trình chung?','Dùng quy trình chung')) return;
  const c=wfClone(wfCfg()); if(c.projects&&c.projects[pid]){ delete c.projects[pid][col]; if(!Object.keys(c.projects[pid]).length) delete c.projects[pid]; } wfSaveCfg(c).catch(ex=>toast(errText(ex),'err')); };
let WFED=null;
ACT['wf-edit']=(col)=>{ const pid=S.f.wfp||'', c=wfCfg(); const src=(pid && c.projects && c.projects[pid] && c.projects[pid][col]) || c.flows[col] || {enabled:false, steps:[]};
  WFED={col, pid, fc:wfClone(src)}; if(!WFED.fc.steps.length) WFED.fc.steps=[wfClone(WF_STEP0)]; wfEdRender(); };
function wfEdRead(){ const ov=$('#ov'); if(!WFED||!ov) return; WFED.fc.enabled=!!($('#wfe_on')||{}).checked;
  WFED.fc.steps.forEach((s,i)=>{ const v=k=>{ const el=ov.querySelector(`[data-wfe="${i}|${k}"]`); return el?el.value:''; };
    s.label=v('label').trim(); s.verb=v('verb').trim(); s.returnTo=v('returnTo')||'author'; s.dueDays=Math.max(0,parseInt(v('dueDays'))||0);
    s.minAmount=v('minAmount')===''?null:Number(v('minAmount')); s.maxAmount=v('maxAmount')===''?null:Number(v('maxAmount'));
    s.noteRequired=!!(ov.querySelector(`[data-wfe="${i}|noteRequired"]`)||{}).checked;
    s.groups=[...ov.querySelectorAll(`[data-wfg="${i}"]:checked`)].map(x=>x.value); s.users=[...ov.querySelectorAll(`[data-wfu="${i}"]:checked`)].map(x=>x.value); }); }
function wfEdRender(){ const e=WFED, w=WF[e.col], n=e.fc.steps.length, pj=projOf(e.pid);
  const gs=D('groups').filter(g=>!g.admin).sort(by('name')), us=D('users').filter(u=>u.active!==false).sort((a,b)=>String(a.name).localeCompare(String(b.name),'vi'));
  const step=(s,i)=>`<div class="card" style="margin:0 0 10px;padding:12px"><div class="ch" style="margin-bottom:6px"><h3 style="margin:0">Bước ${i+1}${i===n-1?' (bước cuối)':''}</h3><span style="display:flex;gap:4px">
      <button type="button" class="btn sm ghost" data-act="wfe-mv" data-id="${i}|-1" ${i===0?'disabled':''} title="Đưa lên">↑</button><button type="button" class="btn sm ghost" data-act="wfe-mv" data-id="${i}|1" ${i===n-1?'disabled':''} title="Đưa xuống">↓</button><button type="button" class="btn sm ghost danger" data-act="wfe-rm" data-id="${i}" ${n===1?'disabled':''}>Xóa bước</button></span></div>
    <div class="fgrid" style="padding:0">
      <div class="fld"><label>Tên bước</label><input data-wfe="${i}|label" value="${esc(s.label||'')}" placeholder="Ví dụ: Kế toán kiểm tra"></div>
      <div class="fld"><label>Chữ trên nút xử lý</label><input data-wfe="${i}|verb" value="${esc(s.verb||'')}" placeholder="Kiểm tra đạt, Xác nhận, Duyệt…"></div>
      <div class="fld"><label>Khi trả lại</label><select data-wfe="${i}|returnTo">${opts([['author','Trả về người lập'],['prev','Trả về bước trước']], s.returnTo||'author')}</select></div>
      <div class="fld"><label>Hạn xử lý (ngày làm việc, 0 = không đặt)</label><input type="number" min="0" data-wfe="${i}|dueDays" value="${N(s.dueDays)}"></div>
      <div class="fld"><label>Chỉ áp dụng khi giá trị hồ sơ từ (đồng)</label><input type="number" min="0" data-wfe="${i}|minAmount" value="${s.minAmount??''}" ${w.amt?'':'disabled'}></div>
      <div class="fld"><label>đến dưới (đồng)</label><input type="number" min="0" data-wfe="${i}|maxAmount" value="${s.maxAmount??''}" ${w.amt?'':'disabled'}></div>
      <div class="fld full"><label>Nhóm người dùng xử lý</label><div style="display:flex;flex-wrap:wrap;gap:4px 14px">${gs.map(g=>`<label class="small" style="display:flex;gap:4px;align-items:center"><input type="checkbox" data-wfg="${i}" value="${g.id}" ${(s.groups||[]).includes(g.id)?'checked':''}> ${esc(g.name)}</label>`).join('')}</div></div>
      <div class="fld full"><details${(s.users||[]).length?' open':''}><summary class="small">Người cụ thể xử lý (${(s.users||[]).length})</summary><div style="display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:6px">${us.map(u=>`<label class="small" style="display:flex;gap:4px;align-items:center"><input type="checkbox" data-wfu="${i}" value="${u.id}" ${(s.users||[]).includes(u.id)?'checked':''}> ${esc(u.name)} <span class="muted">${esc((get('groups',u.groupId)||{}).name||'')}</span></label>`).join('')}</div></details></div>
      <div class="fld full"><label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-wfe="${i}|noteRequired" ${s.noteRequired?'checked':''}> Bắt buộc ghi ý kiến khi xử lý bước này</label></div></div></div>`;
  openModal(`<div class="mform wide"><header><h3>Quy trình duyệt: ${esc(w.name)}${e.pid?' · dự án '+esc(pj?pj.code:''):''}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header>
    <div style="padding:14px 16px;max-height:70vh;overflow:auto"><label style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><input type="checkbox" id="wfe_on" ${e.fc.enabled?'checked':''}> Áp dụng quy trình duyệt cho loại hồ sơ này</label>
    <p class="small muted" style="margin:0 0 10px">Không chọn nhóm, người xử lý thì bước giữa theo quyền "Kiểm tra hồ sơ", bước cuối theo quyền "Duyệt" của phân hệ. Bước có điều kiện giá trị chỉ áp dụng cho hồ sơ có giá trị trong khoảng đó.</p>
    ${e.fc.steps.map(step).join('')}<button type="button" class="btn sm" data-act="wfe-add">+ Thêm bước</button></div>
    <footer><span class="small muted" id="wfe_err" style="flex:1;color:var(--red)"></span><button type="button" class="btn ghost" data-close>Hủy</button><button type="button" class="btn primary" data-act="wfe-save">Lưu quy trình</button></footer></div>`); }
ACT['wfe-add']=()=>{ wfEdRead(); const n=WFED.fc.steps.length; WFED.fc.steps.splice(Math.max(0,n-1),0,{key:'', label:'Bước '+n+': kiểm tra', verb:'Kiểm tra đạt', groups:[], users:[], returnTo:'author', dueDays:0}); wfEdRender(); };
ACT['wfe-rm']=(i)=>{ wfEdRead(); WFED.fc.steps.splice(+i,1); wfEdRender(); };
ACT['wfe-mv']=(k)=>{ wfEdRead(); const [i,d]=k.split('|').map(Number), a=WFED.fc.steps; const j=i+d; if(j<0||j>=a.length) return; [a[i],a[j]]=[a[j],a[i]]; wfEdRender(); };
ACT['wfe-save']=async()=>{ wfEdRead(); const e=WFED; const bad=e.fc.steps.findIndex(s=>!s.label);
  if(bad>=0){ $('#wfe_err').textContent=`Bước ${bad+1} chưa có tên.`; return; }
  const bad2=e.fc.steps.findIndex(s=>s.minAmount!=null && s.maxAmount!=null && s.maxAmount<=s.minAmount);
  if(bad2>=0){ $('#wfe_err').textContent=`Bước ${bad2+1}: khoảng giá trị không hợp lệ.`; return; }
  const c=wfClone(wfCfg()); if(e.pid){ c.projects=c.projects||{}; (c.projects[e.pid]=c.projects[e.pid]||{})[e.col]=e.fc; } else c.flows[e.col]=e.fc;
  try{ await wfSaveCfg(c); closeModal(); WFED=null; }catch(ex){ $('#wfe_err').textContent=errText(ex); } };

