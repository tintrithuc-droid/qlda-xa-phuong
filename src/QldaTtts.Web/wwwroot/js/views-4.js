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
ACT['add-acceptances']=()=>openForm({title:'Thêm biên bản nghiệm thu, bàn giao', fields:accFields(), onSave:v=>accCheck(v)?save('acceptances',v,(v.number||v.kind)):false});
ACT['edit-acceptances']=(id)=>openForm({title:'Cập nhật nghiệm thu, bàn giao', fields:accFields(), value:get('acceptances',id), onSave:v=>accCheck(v)?save('acceptances',v,(v.number||v.kind)):false});

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

/* ===== TRÌNH DUYỆT HỒ SƠ (bản 1.2) ===== */
const WF_ACT = {submit:['Trình duyệt','Trình hồ sơ cho người có quyền duyệt.',false], withdraw:['Rút lại','Rút hồ sơ về soạn thảo để sửa tiếp.',false],
  approve:['Duyệt','Duyệt hồ sơ.',false], return:['Trả lại','Trả hồ sơ về người lập để sửa, ghi rõ nội dung cần sửa.',true],
  reject:['Từ chối','Từ chối hồ sơ (không thực hiện), ghi rõ lý do.',true], recall:['Thu hồi','Thu hồi hồ sơ đã duyệt về soạn thảo để điều chỉnh, ghi rõ lý do.',true]};
ACT.wf=(key)=>{
  const [col,id,a]=key.split('|'); const r=get(col,id); if(!r) return;
  if(a==='history') return wfHistory(col,r);
  const [lb,desc,need]=WF_ACT[a]; const w=WF[col];
  openForm({title:lb+': '+w.label(r), narrow:true, submit:lb, value:{},
    fields:[{key:'info',type:'html',label:'',full:true,html:`<p style="margin:0 0 6px">${esc(desc)}</p><p class="small muted" style="margin:0">${esc(w.info(r))}</p>${a==='approve'&&col==='addenda'?'<p class="small" style="margin:6px 0 0">Sau khi duyệt, giá trị và thời hạn của phụ lục được cộng vào hợp đồng.</p>':''}${a==='approve'&&col==='payments'?'<p class="small" style="margin:6px 0 0">Sau khi duyệt, hồ sơ chuyển sang trạng thái Đang trình KBNN; kế toán xác nhận khi Kho bạc chi.</p>':''}`},
      {key:'note',label:need?'Ý kiến (bắt buộc)':'Ý kiến (nếu có)',type:'textarea',rows:3,req:need,full:true}],
    onSave:async v=>{ const res=await api('POST','/api/approvals',{collection:col, id, action:a, note:v.note||''}); Store.setLocal(col,res.record); Store.setLocal('approvals',res.log); return res.record; }});
};
function wfHistory(col, r){
  const hs=D('approvals').filter(a=>a.collection===col && a.recordId===r.id).sort(by('at',-1));
  openModal(`<div class="mform"><header><h3>Lịch sử trình duyệt: ${esc(WF[col].label(r))}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:14px 16px">
    ${table([{h:'Thời gian',f:x=>`<span class="num small">${fmtDT(x.at)}</span>`},{h:'Người thực hiện',f:x=>esc(x.byName||x.by||'')},{h:'Thao tác',f:x=>pill(x.action, x.action==='Duyệt'?'ok':x.action==='Từ chối'?'bad':x.action==='Trả lại'||x.action==='Thu hồi'?'warn':'info')},{h:'Trạng thái',f:x=>`<span class="small">${esc(x.fromStatus||'')} → <b>${esc(x.toStatus||'')}</b></span>`},{h:'Ý kiến',f:x=>esc(x.note||'')}], hs, {nopage:true, empty:'Chưa có lịch sử.'})}</div></div>`);
}
VIEWS['trinh-duyet']=()=>{
  const t=S.tab.td2||'cho';
  const vis=Object.keys(WF).filter(col=>can(WF[col].mod));
  const all=vis.flatMap(col=>D(col).filter(r=>pidOk(WF[col].pid(r)) && (!S.pid||WF[col].pid(r)===S.pid)).map(r=>({col,r,id:col+'|'+r.id})));
  const mine=wfMine().filter(x=>!S.pid||WF[x.col].pid(x.r)===S.pid).map(x=>({...x,id:x.col+'|'+x.r.id}));
  const waiting=all.filter(x=>wfWaiting(x.col,x.r)), drafts=all.filter(x=>wfStatus(x.col,x.r)===WF[x.col].draft);
  const hist=D('approvals').filter(a=>vis.includes(a.collection) && (!S.pid||a.projectId===S.pid)).sort(by('at',-1));
  const lastNote=x=>{ const h=D('approvals').filter(a=>a.collection===x.col && a.recordId===x.r.id).sort(by('at',-1))[0]; return h&&h.note? `<div class="small muted">${esc(h.action)} · ${esc(h.byName||'')}: ${esc(h.note)}</div>` : ''; };
  const cols=[{h:'Loại hồ sơ',f:x=>`<span class="small">${esc(WF[x.col].name)}</span>`},{h:'Hồ sơ',f:x=>`<b style="font-weight:600">${esc(WF[x.col].label(x.r))}</b><div class="small muted">${esc(WF[x.col].info(x.r))}</div>${lastNote(x)}`},
    {h:'Dự án',f:x=>`<span style="white-space:nowrap">${esc((projOf(WF[x.col].pid(x.r))||{}).code||'')}</span>`},{h:'Trạng thái',f:x=>wfPill(x.col,x.r)},{h:'Cập nhật',f:x=>`<span class="num small">${fmtDT(x.r.updatedAt)}</span><div class="small muted">${esc(x.r.updatedBy||'')}</div>`}];
  const list=t==='cho'?mine:t==='dang'?waiting:drafts;
  const tabs=[['cho','Chờ tôi duyệt',mine.length],['dang','Đang chờ duyệt',waiting.length],['soan','Đang soạn thảo, bị trả lại',drafts.length],['ls','Lịch sử duyệt',hist.length]];
  return `<div class="head"><div class="grow"><h1>Trình duyệt hồ sơ</h1><p>Phụ lục hợp đồng, hồ sơ thanh toán và biên bản nghiệm thu do cán bộ lập rồi trình; Lãnh đạo Ban duyệt hoặc trả lại. Chỉ hồ sơ đã duyệt mới được tính vào số liệu.</p></div></div>
  <div class="tabs">${tabs.map(([k,l,n])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="td2" data-id="${k}">${l}${n?` <span class="cnt" style="position:static;margin-left:4px">${n}</span>`:''}</button>`).join('')}</div>
  <div class="card">${t==='ls'
    ? table([{h:'Thời gian',f:x=>`<span class="num small">${fmtDT(x.at)}</span>`},{h:'Hồ sơ',f:x=>`<span class="small muted">${esc((WF[x.collection]||{}).name||'')}</span><div>${esc(x.target||'')}</div>`},{h:'Thao tác',f:x=>pill(x.action, x.action==='Duyệt'?'ok':x.action==='Từ chối'?'bad':x.action==='Trả lại'||x.action==='Thu hồi'?'warn':'info')},{h:'Người thực hiện',f:x=>esc(x.byName||x.by||'')},{h:'Ý kiến',f:x=>esc(x.note||'')}], hist, {empty:'Chưa có lịch sử trình duyệt.'})
    : table(cols, list, {actions:x=>wfBtns(x.col,x.r), empty:t==='cho'?(Object.keys(WF).some(c=>can(WF[c].mod,'approve'))?'Không có hồ sơ nào chờ bạn duyệt.':'Tài khoản của bạn không có quyền duyệt. Hồ sơ bạn trình sẽ hiện ở thẻ Đang chờ duyệt.'):'Không có hồ sơ.'})}</div>`;
};
