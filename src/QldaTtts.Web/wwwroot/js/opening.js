/* ===== TẠO LẬP DỮ LIỆU ĐẦU KỲ (Quản trị hệ thống → thẻ "Dữ liệu đầu kỳ") =====
   Dùng khi xã/phường bắt đầu dùng phần mềm mà đã có dự án đang làm dở: tải bộ mẫu Excel (mỗi trang ghi rõ bộ phận điền),
   đọc tệp ở trình duyệt → máy chủ kiểm tra toàn bộ (POST /api/opening/import, dryRun) → còn lỗi thì không ghi dòng nào → ghi một lần.
   Khối lượng lũy kế, tạm ứng, thanh toán, phụ lục, tiến độ được ghi nhận là "Số liệu đầu kỳ" (đã duyệt, không qua trình duyệt).
   Kèm: bảng đối soát theo hợp đồng (Excel, In có ô ký 3 bên), tải hồ sơ scan hàng loạt theo số hiệu trong tên tệp, dọn dữ liệu chạy thử. */
const DK_WHO = {kt:'Cán bộ kỹ thuật', ke:'Kế toán', nt:'Nhà thầu, tư vấn giám sát (cán bộ kỹ thuật tổng hợp)', qt:'Quản trị hệ thống'};
const DK_SHEETS = [
  {key:'catalogs', sheet:'01 Danh muc', label:'Danh mục', who:'qt', note:'Chỉ điền khi cần bổ sung giá trị danh mục chưa có (loại hồ sơ, đơn vị tính, nguồn vốn…). Giá trị đang có xem ở trang "Danh muc tham chieu".',
    cols:[{key:'type',h:'Loại danh mục',req:true},{key:'value',h:'Giá trị',req:true},{key:'order',h:'Thứ tự',type:'num'}],
    ex:['Đơn vị tính','tấn',20]},
  {key:'projects', sheet:'02 Du an', label:'Dự án', who:'kt', note:'Theo quyết định phê duyệt dự án (hoặc báo cáo kinh tế - kỹ thuật). Mã dự án dùng để liên kết ở các trang sau.',
    cols:[{key:'code',h:'Mã dự án',req:true},{key:'name',h:'Tên dự án',req:true},{key:'group',h:'Nhóm dự án',cat:'Nhóm dự án'},{key:'tmdt',h:'Tổng mức đầu tư (đồng)',type:'num'},
      {key:'capital',h:'Nguồn vốn'},{key:'owner',h:'Chủ đầu tư'},{key:'location',h:'Địa điểm'},{key:'start',h:'Ngày bắt đầu',type:'date'},{key:'end',h:'Ngày kết thúc',type:'date'},
      {key:'status',h:'Trạng thái',cat:'Trạng thái dự án'},{key:'phase',h:'Giai đoạn',cat:'Giai đoạn'},{key:'decision',h:'Quyết định phê duyệt'},{key:'desc',h:'Mô tả'},
      {key:'boardRole',h:'Vai trò của Ban',cat:'Vai trò của Ban'},{key:'decisionMaker',h:'Người quyết định đầu tư'},{key:'mgmtForm',h:'Hình thức quản lý dự án',cat:'Hình thức quản lý dự án'},
      {key:'projectKind',h:'Loại dự án',cat:'Loại dự án'},{key:'reportType',h:'Hồ sơ dự án',cat:'Hồ sơ dự án'}],
    ex:['DA-01','Nâng cấp đường giao thông nông thôn ấp 3','Nhóm C',12500000000,'Ngân sách xã/phường','UBND xã …','Ấp 3','01/03/2026','31/12/2026','Đang thi công','Thực hiện dự án','125/QĐ-UBND ngày 20/01/2026','','Chủ đầu tư','Chủ tịch UBND xã …','Ban QLDA đầu tư xây dựng','Xây dựng mới','Báo cáo kinh tế - kỹ thuật']},
  {key:'legal', sheet:'03 Ho so phap ly', label:'Hồ sơ pháp lý', who:'kt', note:'Mỗi văn bản một dòng. Bản scan đặt tên tệp theo Số hiệu (thay / bằng -) để tải lên hàng loạt.',
    cols:[{key:'projectCode',h:'Mã dự án',req:true},{key:'packageCode',h:'Mã gói thầu'},{key:'type',h:'Loại hồ sơ',req:true,cat:'Loại hồ sơ pháp lý'},{key:'number',h:'Số hiệu',req:true},
      {key:'date',h:'Ngày ban hành',type:'date'},{key:'issuer',h:'Cơ quan ban hành'},{key:'title',h:'Trích yếu'},{key:'validUntil',h:'Hiệu lực đến',type:'date'}],
    ex:['DA-01','','Quyết định phê duyệt dự án','125/QĐ-UBND','20/01/2026','UBND xã …','Phê duyệt báo cáo kinh tế - kỹ thuật','']},
  {key:'items', sheet:'04 Hang muc', label:'Hạng mục công trình', who:'kt', note:'Theo hồ sơ thiết kế (không bắt buộc).',
    cols:[{key:'projectCode',h:'Mã dự án',req:true},{key:'code',h:'Mã hạng mục',req:true},{key:'name',h:'Tên hạng mục',req:true},{key:'structure',h:'Kết cấu'},
      {key:'area',h:'Diện tích (m2)',type:'num'},{key:'floors',h:'Số tầng',type:'num'},{key:'desc',h:'Mô tả'}],
    ex:['DA-01','HM01','Mặt đường bê tông xi măng','BTXM M300 dày 20 cm',8400,0,'']},
  {key:'packages', sheet:'05 Goi thau', label:'Gói thầu', who:'kt', note:'Theo kế hoạch lựa chọn nhà thầu đã duyệt.',
    cols:[{key:'projectCode',h:'Mã dự án',req:true},{key:'code',h:'Mã gói thầu',req:true},{key:'name',h:'Tên gói thầu',req:true},{key:'type',h:'Loại gói thầu',cat:'Loại gói thầu'},
      {key:'method',h:'Hình thức lựa chọn nhà thầu',cat:'Hình thức lựa chọn nhà thầu'},{key:'estimate',h:'Giá gói thầu (đồng)',type:'num'},{key:'status',h:'Trạng thái',cat:'Trạng thái gói thầu'},{key:'duration',h:'Thời gian thực hiện'}],
    ex:['DA-01','XL01','Thi công xây dựng công trình','Xây lắp','Chỉ định thầu rút gọn',11200000000,'Đang thực hiện hợp đồng','180 ngày']},
  {key:'contracts', sheet:'06 Hop dong', label:'Hợp đồng', who:'kt', note:'Hợp đồng đã ký. Số hợp đồng là mã liên kết ở các trang 07, 08, 10, 11, 12.',
    cols:[{key:'projectCode',h:'Mã dự án',req:true},{key:'packageCode',h:'Mã gói thầu',req:true},{key:'number',h:'Số hợp đồng',req:true},{key:'contractor',h:'Nhà thầu',req:true},
      {key:'signDate',h:'Ngày ký',type:'date'},{key:'value',h:'Giá trị hợp đồng (đồng)',req:true,type:'num'},{key:'start',h:'Ngày bắt đầu',type:'date'},{key:'end',h:'Ngày kết thúc',type:'date'},
      {key:'ctype',h:'Loại hợp đồng',cat:'Loại hợp đồng'},{key:'guarantee',h:'Bảo lãnh thực hiện'},{key:'guaranteeUntil',h:'Bảo lãnh thực hiện hiệu lực đến',type:'date'},
      {key:'advanceRate',h:'Tỷ lệ tạm ứng (%)',type:'num'},{key:'advanceGuaranteeUntil',h:'Bảo lãnh tạm ứng hiệu lực đến',type:'date'},{key:'note',h:'Ghi chú'}],
    ex:['DA-01','XL01','05/2026/HĐ-XL','Công ty TNHH Xây dựng …','10/03/2026',11050000000,'15/03/2026','10/09/2026','Đơn giá cố định','5%','10/10/2026',20,'10/09/2026','']},
  {key:'addenda', sheet:'07 Phu luc HD', label:'Phụ lục hợp đồng', who:'kt', note:'Phụ lục đã ký đến mốc chốt. Ghi nhận là số liệu đầu kỳ (đã duyệt).',
    cols:[{key:'contractNumber',h:'Số hợp đồng',req:true},{key:'number',h:'Số phụ lục',req:true},{key:'date',h:'Ngày ký',type:'date'},{key:'content',h:'Nội dung'},
      {key:'valueChange',h:'Giá trị tăng/giảm (đồng)',type:'num'},{key:'daysChange',h:'Số ngày gia hạn',type:'num'}],
    ex:['05/2026/HĐ-XL','PL01','15/06/2026','Bổ sung khối lượng cống ngang đường',350000000,15]},
  {key:'boq', sheet:'08 Bang khoi luong', label:'Bảng khối lượng hợp đồng', who:'nt', note:'Phụ lục khối lượng của hợp đồng; có thể dán từ bảng giá Mẫu số 11B hoặc bảng dự toán. Mã hiệu không trùng trong một hợp đồng.',
    cols:[{key:'contractNumber',h:'Số hợp đồng',req:true},{key:'code',h:'Mã hiệu',req:true},{key:'name',h:'Nội dung công việc',req:true},{key:'unit',h:'Đơn vị tính',req:true,cat:'Đơn vị tính'},
      {key:'qty',h:'Khối lượng hợp đồng',req:true,type:'num'},{key:'price',h:'Đơn giá (đồng)',req:true,type:'num'},{key:'section',h:'Nhóm công việc'}],
    ex:['05/2026/HĐ-XL','1.1','Bê tông mặt đường đá 1x2 M300','m3',1680,1650000,'1. PHẦN MẶT ĐƯỜNG']},
  {key:'schedule', sheet:'09 Tien do', label:'Kế hoạch tiến độ', who:'nt', note:'Tiến độ đã được duyệt; cột Hoàn thành (%) là tiến độ thực tế tại mốc chốt.',
    cols:[{key:'projectCode',h:'Mã dự án',req:true},{key:'packageCode',h:'Mã gói thầu',req:true},{key:'name',h:'Tên công việc',req:true},{key:'planStart',h:'Bắt đầu kế hoạch',req:true,type:'date'},
      {key:'planEnd',h:'Kết thúc kế hoạch',req:true,type:'date'},{key:'weight',h:'Trọng số (%)',type:'num'},{key:'itemCode',h:'Mã hạng mục'},{key:'actualStart',h:'Bắt đầu thực tế',type:'date'},
      {key:'actualEnd',h:'Kết thúc thực tế',type:'date'},{key:'progress',h:'Hoàn thành (%)',type:'num'}],
    ex:['DA-01','XL01','Thi công mặt đường','01/04/2026','31/07/2026',60,'HM01','05/04/2026','',70]},
  {key:'volumes', sheet:'10 KL luy ke', label:'Khối lượng lũy kế đã nghiệm thu', who:'nt', note:'Một dòng cho mỗi công việc của bảng khối lượng: lũy kế từ khởi công đến mốc chốt, theo các biên bản nghiệm thu. Ghi vào một đợt "Lũy kế đến mốc chốt" đã duyệt.',
    cols:[{key:'contractNumber',h:'Số hợp đồng',req:true},{key:'boqCode',h:'Mã hiệu',req:true},{key:'doneQty',h:'KL thực hiện lũy kế',type:'num'},
      {key:'acceptedQty',h:'KL nghiệm thu lũy kế',req:true,type:'num'},{key:'note',h:'Ghi chú'}],
    ex:['05/2026/HĐ-XL','1.1',1200,1150,'Biên bản nghiệm thu đợt 1–3']},
  {key:'payments', sheet:'11 Tam ung thanh toan', label:'Tạm ứng, thanh toán đã thực hiện', who:'ke', note:'Mỗi lần chi một dòng (tạm ứng, thanh toán khối lượng, thu hồi tạm ứng). Chỉ các khoản Kho bạc đã chi đến mốc chốt.',
    cols:[{key:'contractNumber',h:'Số hợp đồng',req:true},{key:'number',h:'Số hồ sơ, chứng từ',req:true},{key:'kind',h:'Loại',req:true,cat:'Loại thanh toán'},{key:'date',h:'Ngày đề nghị',type:'date'},
      {key:'amount',h:'Số tiền (đồng)',req:true,type:'num'},{key:'paidDate',h:'Ngày chi',req:true,type:'date'},{key:'content',h:'Nội dung'}],
    ex:['05/2026/HĐ-XL','TU-01/2026','Tạm ứng','16/03/2026',2210000000,'25/03/2026','Tạm ứng 20% giá trị hợp đồng']},
  {key:'payplans', sheet:'12 Ke hoach TT', label:'Kế hoạch thanh toán còn lại', who:'ke', note:'Các đợt dự kiến thanh toán sau mốc chốt.',
    cols:[{key:'contractNumber',h:'Số hợp đồng',req:true},{key:'phase',h:'Đợt',req:true},{key:'planDate',h:'Ngày dự kiến',req:true,type:'date'},{key:'amount',h:'Số tiền (đồng)',req:true,type:'num'},{key:'note',h:'Ghi chú'}],
    ex:['05/2026/HĐ-XL','Đợt 3','15/12/2026',3500000000,'']},
  {key:'capitals', sheet:'13 Ke hoach von', label:'Kế hoạch vốn', who:'ke', note:'Kế hoạch vốn đầu tư công của dự án: trung hạn, vốn năm, bổ sung, điều chỉnh giảm; kịch bản giải ngân lũy kế theo quý (quý IV là 100%).',
    cols:[{key:'projectCode',h:'Mã dự án',req:true},{key:'year',h:'Năm kế hoạch',req:true,type:'num'},{key:'kind',h:'Loại kế hoạch',req:true,cat:'Loại kế hoạch vốn'},{key:'source',h:'Nguồn vốn',cat:'Nguồn vốn'},
      {key:'amount',h:'Giá trị (đồng)',req:true,type:'num'},{key:'number',h:'Số quyết định giao vốn'},{key:'date',h:'Ngày quyết định',type:'date'},
      {key:'targetQ1',h:'Giải ngân hết quý I (%)',type:'num'},{key:'targetQ2',h:'Giải ngân hết quý II (%)',type:'num'},{key:'targetQ3',h:'Giải ngân hết quý III (%)',type:'num'},{key:'note',h:'Ghi chú'}],
    ex:['DA-01',2026,'Kế hoạch vốn năm','Ngân sách xã/phường',8000000000,'15/QĐ-UBND','05/01/2026',20,45,70,'']}
];
const DK_ATT_KIND = {legal:r=>r.type||'Hồ sơ pháp lý', contracts:()=>'Hợp đồng đã ký', addenda:()=>'Phụ lục hợp đồng', payments:()=>'Hồ sơ đề nghị thanh toán'};
const DK_MARK = 'Số liệu đầu kỳ';
const DK = {rows:null, file:'', res:null, busy:false, scan:null, scanFiles:[]};

function dkMarked(col, id){ return D('approvals').some(a=>a.collection===col && a.recordId===id && a.action===DK_MARK); }
function dkInfo(){ const r=admLoad('opening','/api/opening'); return r&&!r.error? r : null; }
function dkPrevMonthEnd(){ const d=new Date(); return isoLocal(new Date(d.getFullYear(), d.getMonth(), 0, 12)); }
function dkCutoff(){ const i=dkInfo(); return DK.cutoff || (i&&i.info&&i.info.cutoff) || dkPrevMonthEnd(); }

/* ---------- Bộ mẫu Excel ---------- */
function dkRowsOf(key){
  const pc=id=>(projOf(id)||{}).code||'', kc=id=>(pkgOf(id)||{}).code||'', cn=id=>(get('contracts',id)||{}).number||'', fd=d=>d?fmtDate(d):'';
  const mk=(col,r)=>dkMarked(col,r.id)||!r.status;
  switch(key){
    case 'projects': return D('projects').sort(by('code')).map(p=>[p.code,p.name,p.group,p.tmdt,p.capital,p.owner,p.location,fd(p.start),fd(p.end),p.status,p.phase,p.decision,p.desc,p.boardRole,p.decisionMaker,p.mgmtForm,p.projectKind,p.reportType]);
    case 'legal': return D('legal').map(l=>[pc(l.projectId),kc(l.packageId),l.type,l.number,fd(l.date),l.issuer,l.title,fd(l.validUntil)]);
    case 'items': return D('items').map(i=>[pc(i.projectId),i.code,i.name,i.structure,i.area,i.floors,i.desc]);
    case 'packages': return D('packages').map(k=>[pc(k.projectId),k.code,k.name,k.type,k.method,k.estimate,k.status,k.duration]);
    case 'contracts': return D('contracts').map(c=>[pc(contractPid(c)),kc(c.packageId),c.number,c.contractor,fd(c.signDate),c.value,fd(c.start),fd(c.end),c.ctype,c.guarantee,fd(c.guaranteeUntil),c.advanceRate,fd(c.advanceGuaranteeUntil),c.note]);
    case 'addenda': return D('addenda').filter(a=>mk('addenda',a)).map(a=>[cn(a.contractId),a.number,fd(a.date),a.content,a.valueChange,a.daysChange]);
    case 'boq': return D('boq').sort(byCode).map(b=>[cn(b.contractId),b.code,b.name,b.unit,b.qty,b.price,b.section]);
    case 'schedule': return D('schedule').filter(s=>mk('schedule',s)).map(s=>[pc(s.projectId),kc(s.packageId),s.name,fd(s.planStart),fd(s.planEnd),s.weight,(get('items',s.itemId)||{}).code||'',fd(s.actualStart),fd(s.actualEnd),s.progress]);
    case 'volumes': return D('volumes').filter(v=>dkMarked('volumes',v.id)).map(v=>{ const b=get('boq',v.boqId)||{}; return [cn(v.contractId),b.code,v.doneQty,v.acceptedQty,v.note]; });
    case 'payments': return D('payments').filter(p=>dkMarked('payments',p.id)).map(p=>[cn(p.contractId),p.number,p.kind,fd(p.date),p.amount,fd(p.paidDate),p.content]);
    case 'payplans': return D('payplans').map(p=>[cn(p.contractId),p.phase,fd(p.planDate),p.amount,p.note]);
    case 'capitals': return D('capitals').sort((a,b)=>(pc(a.projectId)+a.year).localeCompare(pc(b.projectId)+b.year)).map(c=>[pc(c.projectId),c.year,c.kind,c.source,c.amount,c.number,fd(c.date),c.targetQ1,c.targetQ2,c.targetQ3,c.note]);
  }
  return [];
}
/* Bộ mẫu có định dạng: khung viền, phông Times New Roman, ngày dd/mm/yyyy, số tiền #,##0, độ rộng cột theo nội dung.
   Bố cục mỗi trang: dòng 1 ghi chú (đơn vị điền), dòng 2 ví dụ, dòng 3 tiêu đề cột, dữ liệu từ dòng 4. */
function dkColKind(c){ if(c.type==='date') return 'date'; if(c.type==='num') return /đồng/i.test(c.h)? 'money' : /%/.test(c.h)? 'pct' : 'qty';
  return /code|Code|number|Number|^unit$|^phase$|^kind$|^order$|^year$/.test(c.key)? 'center' : 'text'; }
function dkCellVal(v, kind){ if(v==null||v==='') return null;
  if(kind==='date'){ const iso=typeof v==='string'? (parseVNDate(v)||(/^\d{4}-\d\d-\d\d$/.test(v)?v:'')) : ''; if(iso){ const [y,m,d]=iso.split('-').map(Number); return new Date(Date.UTC(y,m-1,d)); } return v; }
  if(['money','pct','qty'].includes(kind)){ const n=typeof v==='number'? v : Number(String(v).replace('%','')); return isFinite(n)&&String(v).trim()!==''? n : v; }
  return v; }
async function dkTemplate(withData){
  try{ await loadExcel(); }catch(e){ toast('Không tải được thư viện Excel, thử lại sau.','err'); return; }
  const cut=dkCutoff();
  const NAVY='FF0D2A57', BLUE='FF1F5FBF', OPT='FF5B6B82', EXBG='FFF4F6F9';
  const thin={style:'thin',color:{argb:'FF9AA6B6'}}, med={style:'medium',color:{argb:NAVY}};
  const box={top:thin,left:thin,right:thin,bottom:thin}, hbox={top:med,left:thin,right:thin,bottom:med};
  const F=(o={})=>({name:XL.font, size:11, ...o});
  const dt=iso=>{ const [y,m,d]=iso.split('-').map(Number); return new Date(Date.UTC(y,m-1,d)); };
  const wb=new ExcelJS.Workbook(); wb.creator=BR.appName||'QLDA'; wb.created=new Date();
  const g=wb.addWorksheet('Huong dan'); g.columns=[{width:24},{width:96},{width:44}];
  const put=(r,vals,o={})=>{ const row=g.getRow(r); vals.forEach((v,i)=>{ const c=row.getCell(i+1); c.value=v; c.font=F(o.font); c.alignment={vertical:'top',wrapText:true,...(o.al||{})}; if(o.border) c.border=box; if(o.fill) c.fill={type:'pattern',pattern:'solid',fgColor:{argb:o.fill}}; }); return row; };
  g.mergeCells('A1:C1'); put(1,['BỘ MẪU DỮ LIỆU ĐẦU KỲ – PHẦN MỀM QUẢN LÝ DỰ ÁN'],{font:{bold:true,size:13,color:{argb:NAVY}},al:{horizontal:'center'}}); g.getRow(1).height=22;
  g.mergeCells('A2:C2'); put(2,[BR.reportOrg||''],{font:{italic:true},al:{horizontal:'center'}});
  put(4,['Mốc chốt số liệu', dt(cut)],{font:{bold:true}}); g.getCell('B4').numFmt='dd/mm/yyyy'; g.getCell('B4').alignment={horizontal:'left'};
  put(5,['Ngày lập tệp', dt(TODAY)]); g.getCell('B5').numFmt='dd/mm/yyyy'; g.getCell('B5').alignment={horizontal:'left'};
  put(7,['CÁCH ĐIỀN'],{font:{bold:true,color:{argb:NAVY}}});
  const steps=['Mỗi trang tính một nhóm dữ liệu, điền theo thứ tự 01 → 13. Không đổi tên trang tính và dòng tiêu đề cột (dòng 3).',
    'Dòng 2 của mỗi trang là ví dụ, phần mềm không nhập dòng này. Điền dữ liệu từ dòng 4 trở đi (các dòng đã kẻ khung sẵn).',
    'Các trang liên kết với nhau bằng mã: Mã dự án, Mã gói thầu, Số hợp đồng, Mã hiệu công việc. Ghi đúng như đã khai ở trang trước.',
    'Ngày ghi dd/mm/yyyy (ví dụ 31/10/2026); số tiền ghi đơn vị đồng, không ghi chữ "đ".',
    'Cột có dấu * (tiêu đề nền xanh đậm) là bắt buộc. Cột có danh mục: ghi đúng giá trị trong trang "Danh muc tham chieu" (hoặc bổ sung ở trang 01).',
    'Khối lượng, tạm ứng, thanh toán, phụ lục chỉ ghi các khoản đến hết mốc chốt; phát sinh sau mốc chốt nhập trên phần mềm như nghiệp vụ thường.',
    'Tệp có thể nhập lại nhiều lần: dòng trùng mã sẽ cập nhật, không nhân đôi.'];
  steps.forEach((t,i)=>{ put(8+i,[String(i+1),t],{border:true}); g.getCell('A'+(8+i)).alignment={horizontal:'center',vertical:'top'}; });
  const r0=8+steps.length+1;
  put(r0,['TRANG TÍNH','NỘI DUNG','BỘ PHẬN ĐIỀN'],{font:{bold:true,color:{argb:'FFFFFFFF'}},fill:BLUE,al:{horizontal:'center',vertical:'middle'}}).eachCell(c=>c.border=hbox);
  DK_SHEETS.forEach((s,i)=>put(r0+1+i,[s.sheet, s.label+'. '+s.note, DK_WHO[s.who]],{border:true}));
  for(const s of DK_SHEETS){
    const nc=s.cols.length, kinds=s.cols.map(dkColKind);
    const rows=withData? dkRowsOf(s.key) : [];
    const ws=wb.addWorksheet(s.sheet, {views:[{state:'frozen', ySplit:3}]});
    ws.mergeCells(1,1,1,nc); const t=ws.getCell('A1'); t.value=`${s.label.toUpperCase()} · Bộ phận điền: ${DK_WHO[s.who]} · ${s.note}`;
    t.font=F({bold:true,color:{argb:NAVY}}); t.alignment={vertical:'middle',wrapText:true}; ws.getRow(1).height=Math.max(30, 15*Math.ceil(t.value.length/Math.max(60, nc*14)));
    const ex=['Ví dụ → '+s.ex[0], ...s.ex.slice(1)];
    const head=s.cols.map(c=>c.h+(c.req?' *':''));
    const styleCell=(c,i,o={})=>{ const k=kinds[i]; c.border=box; c.font=F(o.font);
      c.alignment= k==='money'||k==='qty'||k==='pct'? {horizontal:'right',vertical:'top'} : k==='date'||k==='center'? {horizontal:'center',vertical:'top',wrapText:true} : {horizontal:'left',vertical:'top',wrapText:true};
      c.numFmt= k==='money'? '#,##0' : k==='qty'? '#,##0.###' : k==='pct'? '0.##' : k==='date'? 'dd/mm/yyyy' : '@';
      if(o.fill) c.fill={type:'pattern',pattern:'solid',fgColor:{argb:o.fill}}; };
    const er=ws.getRow(2); ex.forEach((v,i)=>{ const c=er.getCell(i+1); c.value=dkCellVal(v,i?kinds[i]:'text'); styleCell(c,i,{font:{italic:true,color:{argb:'FF6B7686'}},fill:EXBG}); if(i===0){ c.alignment={horizontal:'left',vertical:'top',wrapText:true}; c.numFmt='@'; } });
    const hr=ws.getRow(3); head.forEach((h,i)=>{ const c=hr.getCell(i+1); c.value=h; c.font=F({bold:true,color:{argb:'FFFFFFFF'}}); c.fill={type:'pattern',pattern:'solid',fgColor:{argb:s.cols[i].req?BLUE:OPT}}; c.alignment={horizontal:'center',vertical:'middle',wrapText:true}; c.border=hbox; });
    hr.height=Math.max(30, 15*Math.ceil(Math.max(...head.map(h=>h.length))/18));
    rows.forEach((r,ri)=>{ const row=ws.getRow(4+ri); for(let i=0;i<nc;i++){ const c=row.getCell(i+1); c.value=dkCellVal(r[i],kinds[i]); styleCell(c,i); } });
    for(let ri=0; ri<(withData?10:50); ri++){ const row=ws.getRow(4+rows.length+ri); for(let i=0;i<nc;i++) styleCell(row.getCell(i+1),i); }
    s.cols.forEach((c,i)=>{ const k=kinds[i]; const lens=[...rows.map(r=>r[i]), ex[i]].map(v=>v==null?0: k==='money'? fmtVND(v).length : String(v).length);
      const w=Math.max(Math.min(22,head[i].length), ...lens)+2;
      ws.getColumn(i+1).width= k==='date'? 13 : k==='text'? Math.max(16, Math.min(50, w)) : Math.max(10, Math.min(28, w)); });
    ws.pageSetup={orientation:'landscape', paperSize:9, fitToPage:true, fitToWidth:1, fitToHeight:0, printTitlesRow:'3:3'};
  }
  const cats=[...new Set(D('catalogs').map(c=>c.type))].sort();
  const ref=wb.addWorksheet('Danh muc tham chieu', {views:[{state:'frozen', ySplit:1}]}); ref.columns=[{width:34},{width:60}];
  const rh=ref.getRow(1); ['LOẠI DANH MỤC','GIÁ TRỊ'].forEach((h,i)=>{ const c=rh.getCell(i+1); c.value=h; c.font=F({bold:true,color:{argb:'FFFFFFFF'}}); c.fill={type:'pattern',pattern:'solid',fgColor:{argb:BLUE}}; c.alignment={horizontal:'center',vertical:'middle'}; c.border=hbox; });
  cats.flatMap(t=>D('catalogs').filter(c=>c.type===t).sort(by('order')).map(c=>[t,c.value])).forEach((r,ri)=>{ const row=ref.getRow(2+ri); r.forEach((v,i)=>{ const c=row.getCell(i+1); c.value=v; c.font=F(); c.border=box; c.alignment={vertical:'top',wrapText:true}; }); });
  const buf=await wb.xlsx.writeBuffer();
  saveFile(`Mau du lieu dau ky${withData?' kem du lieu':''} ${fmtDate(cut).replace(/\//g,'.')}.xlsx`, new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  log('Tải bộ mẫu dữ liệu đầu kỳ','logs', withData?'Kèm dữ liệu đang có':'Mẫu trống');
}

/* ---------- Đọc tệp đã điền ---------- */
function dkRead(buf){
  const wb=XLSX.read(buf,{type:'array', cellDates:true}); const out={}, issues=[]; let n=0;
  const nk=x=>impKey(x).replace(/ /g,'');
  DK_SHEETS.forEach(s=>{
    const name=wb.SheetNames.find(x=>nk(x)===nk(s.sheet)) || wb.SheetNames.find(x=>nk(x).endsWith(nk(s.sheet).replace(/^\d+/,'')));
    if(!name) return;
    const ws=wb.Sheets[name]; const aoa=XLSX.utils.sheet_to_json(ws,{header:1, raw:true, defval:null}), txt=XLSX.utils.sheet_to_json(ws,{header:1, raw:false, defval:null});
    const keys=s.cols.map(c=>impKey(c.h));
    let hr=-1, map=null;
    for(let i=0;i<Math.min(8,aoa.length);i++){ const row=(aoa[i]||[]).map(x=>impKey(x)); const m=keys.map(k=>row.indexOf(k)); if(m.filter(x=>x>=0).length>=Math.min(2,keys.length) && s.cols.every((c,ci)=>!c.req||m[ci]>=0)){ hr=i; map=m; break; } }
    if(hr<0){ issues.push({sheet:s.label, line:0, message:'Không tìm thấy dòng tiêu đề cột (dùng bộ mẫu dữ liệu đầu kỳ, giữ nguyên dòng 3).'}); return; }
    const rows=[];
    for(let i=hr+1;i<aoa.length;i++){ const raw=aoa[i]||[], tx=txt[i]||[];
      if(map.every(j=>j<0 || raw[j]==null || String(raw[j]).trim()==='')) continue;
      if(String(raw[map[0]]??'').startsWith('Ví dụ')) continue;
      const o={line:i+1};
      s.cols.forEach((c,ci)=>{ const j=map[ci]; if(j<0) return; const v=raw[j]; if(v==null || String(v).trim()==='') return;
        if(c.type==='num'){ const x=impNum(v); if(Number.isNaN(x)) issues.push({sheet:s.label, line:i+1, message:`"${c.h}" không phải số`}); else if(x!=null) o[c.key]=x; }
        else if(c.type==='date'){ const d=impDate(v); if(d===null) issues.push({sheet:s.label, line:i+1, message:`"${c.h}" không đúng ngày dd/mm/yyyy`}); else if(d) o[c.key]=d; }
        else o[c.key]=String(typeof v==='number' && tx[j]!=null? tx[j] : v).replace(/\s+/g,' ').trim(); });
      rows.push(o); }
    out[s.key]=rows; n+=rows.length; });
  return {sheets:out, issues, n};
}
async function dkCheck(commit){
  if(!DK.rows) return;
  const cut=parseVNDate($('#dk_cut')?.value||fmtDate(dkCutoff()));
  if(!cut){ toast('Mốc chốt số liệu không đúng ngày dd/mm/yyyy.','err'); return; }
  DK.cutoff=cut; DK.basis=$('#dk_basis')?.value.trim()||DK.basis||'';
  DK.busy=true; render();
  try{
    const r=await api('POST','/api/opening/import',{dryRun:!commit, cutoff:cut, basis:DK.basis, sheets:DK.rows.sheets});
    const seen=new Set(); DK.res=r; DK.res.errors=[...DK.rows.issues, ...r.errors].filter(e=>{ const k=e.sheet+'|'+e.line+'|'+String(e.message).replace(/"/g,''); if(seen.has(k)) return false; seen.add(k); return true; });
    if(r.saved){ toast('Đã ghi dữ liệu đầu kỳ'); DK.rows=null; DK.res=null; DK.file=''; admReload('opening'); await Store.load(); }
  }catch(ex){ toast(errText(ex),'err'); }
  DK.busy=false; render();
}
function dkErrExport(){
  const r=DK.res; if(!r) return;
  exportXlsx('Danh sach loi du lieu dau ky '+fmtDate(TODAY).replace(/\//g,'.')+'.xlsx', [
    {name:'Loi', title:'DANH SÁCH LỖI CẦN SỬA – DỮ LIỆU ĐẦU KỲ', sub:'Tệp: '+DK.file+' · kiểm tra ngày '+fmtDate(TODAY), head:['Trang tính','Dòng','Lỗi'], rows:r.errors.map(e=>[e.sheet,e.line||'',e.message])},
    {name:'Canh bao', title:'CẢNH BÁO (vẫn nhập được, cần xem lại)', sub:'', head:['Trang tính','Dòng','Cảnh báo'], rows:r.warnings.map(e=>[e.sheet,e.line||'',e.message])}]);
}

/* ---------- Bảng đối soát theo hợp đồng ---------- */
function dkRecon(pid, cut){
  const paid=(c,f)=>sum(D('payments').filter(p=>p.contractId===c.id && p.status==='Đã thanh toán' && payDay(p)<=cut && f(impKey(p.kind))),'amount');
  return D('contracts').filter(c=>pidOk(contractPid(c)) && (!pid||contractPid(c)===pid)).sort((a,b)=>((projOf(contractPid(a))||{}).code+a.number).localeCompare((projOf(contractPid(b))||{}).code+b.number)).map(c=>{
    const tu=paid(c,k=>k==='tam ung'), th=paid(c,k=>k.includes('thu hoi')), tt=paid(c,k=>k!=='tam ung'&&!k.includes('thu hoi'));
    const v=contractValue(c), acc=contractAcc(c.id, cut);
    return {id:c.id, project:(projOf(contractPid(c))||{}).code||'', pkg:(pkgOf(c.packageId)||{}).code||'', number:c.number, contractor:c.contractor||'', value:v, acc, tu, th, tt, spent:tu+tt, advLeft:tu-th, left:v-tu-tt}; });
}
const DK_RC_HEAD=['Dự án','Gói thầu','Số hợp đồng','Nhà thầu','Giá trị HĐ gồm phụ lục (đ)','Giá trị KL nghiệm thu lũy kế (đ)','Đã tạm ứng (đ)','Đã thu hồi tạm ứng (đ)','Đã thanh toán KL (đ)','Lũy kế đã chi (đ)','Tạm ứng chưa thu hồi (đ)','Giá trị HĐ còn lại (đ)'];
const DK_RC_SIGN=['CÁN BỘ KỸ THUẬT','KẾ TOÁN','LÃNH ĐẠO BAN QUẢN LÝ DỰ ÁN'];
function dkReconRows(pid, cut){ const l=dkRecon(pid, cut); const t=k=>sum(l,k);
  return [...l.map(r=>[r.project,r.pkg,r.number,r.contractor,r.value,r.acc,r.tu,r.th,r.tt,r.spent,r.advLeft,r.left]),
    ...(l.length>1?[['Tổng cộng','','','',t('value'),t('acc'),t('tu'),t('th'),t('tt'),t('spent'),t('advLeft'),t('left')]]:[])]; }
function dkReconSub(pid, cut){ const i=dkInfo(); return `Số liệu lũy kế đến ngày ${fmtDate(cut)}${pid?' · Dự án '+((projOf(pid)||{}).code||''):''}${i&&i.info&&i.info.basis?' · '+i.info.basis:''}`; }
ACT['dk-recon-xlsx']=()=>{ const pid=S.f.dkp||'', cut=S.f.dkc||dkCutoff(); const rows=dkReconRows(pid, cut);
  exportXlsx('Doi soat hop dong '+fmtDate(cut).replace(/\//g,'.')+'.xlsx',[{name:'Doi soat', title:'BẢNG ĐỐI SOÁT SỐ LIỆU THEO HỢP ĐỒNG', sub:dkReconSub(pid,cut), head:DK_RC_HEAD, rows, money:[4,5,6,7,8,9,10,11], total:rows.length>1,
    foot:'Xác nhận: '+DK_RC_SIGN.join(' · ')}]); log('Xuất bảng đối soát hợp đồng','logs',fmtDate(cut)); };
/* Bản in (lưu PDF) có ô ký 3 bên */
ACT['dk-recon-pdf']=()=>{ const pid=S.f.dkp||'', cut=S.f.dkc||dkCutoff(); const rows=dkReconRows(pid, cut); if(!rows.length) return toast('Chưa có hợp đồng để đối soát.','err');
  const d=TODAY.split('-');
  const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Bảng đối soát hợp đồng</title><style>
  @page{size:A4 landscape; margin:12mm} body{font-family:"Times New Roman",serif; font-size:11.5px; color:#000}
  .hd{display:grid; grid-template-columns:1fr 1.2fr; text-align:center; margin-bottom:12px} .hd b{display:block} .hd .u{display:inline-block; border-top:1px solid #000; width:40%; margin-top:2px}
  h1{font-size:15px; text-align:center; margin:10px 0 2px} .sub{text-align:center; font-style:italic; margin-bottom:10px}
  table{width:100%; border-collapse:collapse} th,td{border:1px solid #000; padding:3px 4px; vertical-align:top} th{background:#eee}
  td.r{text-align:right; white-space:nowrap} tr.t td{font-weight:bold} thead{display:table-header-group} tr{page-break-inside:avoid}
  .sign{display:grid; grid-template-columns:repeat(3,1fr); text-align:center; margin-top:16px; page-break-inside:avoid} .sign i{display:block} .sign .sp{height:70px}
  </style></head><body>
  <div class="hd"><div>${esc((BR.orgName||'').toUpperCase())}<b>${esc((BR.unitName||BR.reportOrg||'').toUpperCase())}</b><span class="u"></span></div>
    <div><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><b>Độc lập - Tự do - Hạnh phúc</b><span class="u"></span></div></div>
  <h1>BẢNG ĐỐI SOÁT SỐ LIỆU THEO HỢP ĐỒNG</h1><div class="sub">${esc(dkReconSub(pid,cut))}</div>
  <table><thead><tr><th>STT</th>${DK_RC_HEAD.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
  <tbody>${rows.map((r,k)=>`<tr class="${r[0]==='Tổng cộng'?'t':''}"><td class="r">${r[0]==='Tổng cộng'?'':k+1}</td>${r.map((v,i)=>`<td class="${i>3?'r':''}">${i>3?fmtVND(v):esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <div class="sign">${DK_RC_SIGN.map((s,i)=>`<div>${i===2?`<i>…, ngày ${d[2]} tháng ${d[1]} năm ${d[0]}</i>`:'<i>&nbsp;</i>'}<b>${s}</b><i>(Ký, ghi rõ họ tên)</i><div class="sp"></div></div>`).join('')}</div>
  </body></html>`;
  const fr=document.createElement('iframe'); fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0'; fr.title='In bảng đối soát';
  document.body.appendChild(fr); const doc=fr.contentDocument; doc.open(); doc.write(html); doc.close();
  setTimeout(()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }finally{ setTimeout(()=>fr.remove(), 60000); } }, 250);
  log('In bảng đối soát hợp đồng','logs',fmtDate(cut)); };

/* ---------- Tải hồ sơ scan hàng loạt ---------- */
function dkScanMatch(files){
  const nk=x=>impKey(x).replace(/ /g,'');
  const pools=[['legal','Hồ sơ pháp lý',l=>l.number],['contracts','Hợp đồng',c=>c.number],['addenda','Phụ lục hợp đồng',a=>a.number],['payments','Tạm ứng, thanh toán',p=>p.number]];
  return files.map(f=>{
    const base=f.name.replace(/\.[^.]+$/,''); const keys=[nk(base), nk(base.split('_')[0])].filter(Boolean);
    let hits=[]; for(const k of keys){ hits=pools.flatMap(([col,lbl,num])=>D(col).filter(r=>num(r) && nk(num(r))===k).map(r=>({col,lbl,r}))); if(hits.length) break; }
    const dup=hits.length===1 && D('attachments').some(a=>a.collection===hits[0].col && a.recordId===hits[0].r.id && a.fileName===f.name);
    return {f, hits, dup}; });
}
/* Chọn tệp scan cộng dồn từ nhiều thư mục; trùng tên tệp thì lấy bản chọn sau; gỡ từng tệp */
function dkScanAdd(fs){ const m=new Map((DK.scanFiles||[]).map(f=>[f.name.toLowerCase(),f])); fs.forEach(f=>m.set(f.name.toLowerCase(),f)); DK.scanFiles=[...m.values()]; DK.scan=DK.scanFiles.length? dkScanMatch(DK.scanFiles) : null; }
ACT['dk-scan-rm']=(i)=>{ const f=(DK.scan||[])[+i]; if(!f) return; DK.scanFiles=(DK.scanFiles||[]).filter(x=>x!==f.f); DK.scan=DK.scanFiles.length? dkScanMatch(DK.scanFiles) : null; render(); };
ACT['dk-scan-clear']=()=>{ DK.scan=null; DK.scanFiles=[]; render(); };
ACT['dk-scan-go']=async()=>{ const l=(DK.scan||[]).filter(x=>x.hits.length===1 && !x.dup); if(!l.length) return;
  let n=0; const errs=[]; DK.busy=true;
  for(const x of l){ const b=$('#dk_scan_go'); if(b) b.textContent=`Đang tải ${n+1}/${l.length}…`;
    const h=x.hits[0]; try{ await uploadAttachment(x.f, h.col, h.r.id, DK_ATT_KIND[h.col](h.r), 'Số hóa hồ sơ đầu kỳ'); n++; }catch(ex){ errs.push(x.f.name+': '+errText(ex)); } }
  DK.busy=false; DK.scan=null; DK.scanFiles=[]; log('Tải hồ sơ scan hàng loạt','attachments',`${n} tệp`+(errs.length?`, ${errs.length} lỗi`:''));
  toast(`Đã tải ${n} tệp`+(errs.length?`, ${errs.length} tệp lỗi: ${errs[0]}`:''), errs.length?'err':''); await Store.load(); render(); };

/* ---------- Dọn dữ liệu chạy thử ---------- */
ACT['dk-purge']=()=>openForm({title:'Dọn dữ liệu chạy thử', narrow:true, submit:'Sao lưu và dọn dữ liệu', fields:[
  {key:'msg',type:'html',full:true,html:`<div class="alert bad"><div>Hệ thống sẽ <b>sao lưu toàn bộ lên máy chủ</b>, sau đó xóa <b>mọi dự án và dữ liệu con</b> (gói thầu, hợp đồng, khối lượng, thanh toán, tiến độ, kế hoạch vốn, giải phóng mặt bằng, nghiệm thu, quyết toán, nhật ký, hồ sơ, lịch sử trình duyệt), chuyển tệp đính kèm vào thùng rác và xóa ${D('users').filter(u=>u.sample).length} tài khoản mẫu.<br>Giữ lại: nhóm quyền, danh mục, hướng dẫn sử dụng, tài khoản thật, thông tin đơn vị, nhật ký hoạt động.</div></div>`},
  {key:'confirm',label:'Gõ XOA DU LIEU để xác nhận',req:true,full:true}],
  onSave:async v=>{ if(String(v.confirm).trim().toUpperCase()!=='XOA DU LIEU'){ $('#mform_err').textContent='Gõ đúng XOA DU LIEU để xác nhận.'; return false; }
    $('#mform_err').textContent='Đang sao lưu và dọn dữ liệu…';
    const r=await api('POST','/api/opening/purge',{confirm:v.confirm}); admReload('opening'); delete ADM.auto; await Store.load();
    toast('Đã dọn dữ liệu chạy thử. Bản sao lưu trước khi dọn: '+r.backup); }});

/* ---------- Giao diện thẻ ---------- */
function openingView(){
  if(!myGroup()?.admin) return `<div class="alert">Chỉ quản trị hệ thống được tạo lập dữ liệu đầu kỳ.</div>`;
  const st=admLoad('opening','/api/opening'); if(!st) return emptyBox('Đang tải…'); if(st.error) return `<div class="alert bad">${esc(st.error)}</div>`;
  const info=st.info||{}, cut=dkCutoff(), res=DK.res;
  const mk=Object.fromEntries((st.marks||[]).map(m=>[m.collection,m.records]));
  const step=(n,t)=>`<span class="pill info" style="margin-right:6px">Bước ${n}</span>${t}`;
  const stat=info.importedAt?`<div class="alert info"><div>Lần ghi gần nhất: <b>${fmtDT(info.importedAt)}</b> bởi ${esc(info.importedBy||'')} · mốc chốt <b>${fmtDate(info.cutoff)}</b>${info.basis?' · '+esc(info.basis):''}. Hồ sơ đánh dấu số liệu đầu kỳ: ${['volumes','payments','addenda','schedule'].map(c=>`${COL_LABEL[c]} ${mk[c]||0}`).join(', ')}.</div></div>`:'';
  let check='';
  if(DK.rows){
    const errs=res?res.errors:DK.rows.issues, warns=res?res.warnings:[];
    const cnt=res?`<div class="tw"><table><thead><tr><th>Trang tính</th><th class="r">Số dòng</th><th class="r">Thêm mới</th><th class="r">Cập nhật</th><th class="r">Không đổi</th></tr></thead><tbody>${res.counts.map(c=>`<tr><td>${esc(c.label)}</td><td class="r num">${(DK.rows.sheets[c.sheet]||[]).length}</td><td class="r num">${c.add}</td><td class="r num">${c.update}</td><td class="r num">${c.same}</td></tr>`).join('')}</tbody></table></div>`:'';
    const lst=(l,color)=>`<div class="tw" style="max-height:38vh;overflow:auto"><table><thead><tr><th>Trang tính</th><th class="r">Dòng</th><th>Nội dung</th></tr></thead><tbody>${l.map(e=>`<tr><td>${esc(e.sheet)}</td><td class="r num">${e.line||''}</td><td style="color:var(${color})">${esc(e.message)}</td></tr>`).join('')}</tbody></table></div>`;
    check=`<div class="small" style="margin:10px 0">Tệp <b>${esc(DK.file)}</b>: ${DK.rows.n} dòng dữ liệu.</div>${cnt}
      ${errs.length?`<h3 style="margin-top:12px;color:var(--red)" id="dk_errs">${errs.length} lỗi cần sửa trong tệp (chưa ghi dòng nào)</h3>${lst(errs,'--red')}`:res?'<div class="alert info" style="margin-top:10px" id="dk_ok"><div>Không có lỗi. Có thể ghi dữ liệu đầu kỳ.</div></div>':''}
      ${warns.length?`<h3 style="margin-top:12px;color:var(--amber)">${warns.length} cảnh báo (vẫn ghi được, cần xem lại)</h3>${lst(warns,'--amber')}`:''}
      <div class="toolbar" style="margin-top:10px">${res&&(errs.length||warns.length)?'<button class="btn sm" data-act="dk-err-exp">Xuất danh sách lỗi, cảnh báo (.xlsx)</button>':''}
        <button class="btn sm" data-act="dk-recheck" ${DK.busy?'disabled':''}>Kiểm tra lại</button>
        <button class="btn primary" id="dk_go" data-act="dk-commit" ${!res||errs.length||DK.busy?'disabled':''}>Ghi dữ liệu đầu kỳ</button></div>`;
  }
  const scan=DK.scan, okN=scan?scan.filter(x=>x.hits.length===1&&!x.dup).length:0;
  const scanHtml=scan?`<div class="small" style="margin:8px 0">${scan.length} tệp: <b style="color:var(--green)">${okN}</b> khớp, ${scan.filter(x=>x.dup).length} đã có, <b style="color:var(--red)">${scan.filter(x=>x.hits.length!==1).length}</b> không khớp hoặc khớp nhiều hồ sơ.</div>
    <div class="tw" style="max-height:34vh;overflow:auto"><table><thead><tr><th>Tệp</th><th>Gắn vào</th><th></th></tr></thead><tbody>${scan.map((x,xi)=>`<tr><td>${esc(x.f.name)}</td><td>${x.hits.length===1?`${esc(x.hits[0].lbl)}: <b>${esc(x.hits[0].r.number)}</b>${x.dup?' <span class="muted small">(đã có tệp này, bỏ qua)</span>':''}`:x.hits.length?`<span style="color:var(--red)">Khớp ${x.hits.length} hồ sơ: ${x.hits.map(h=>esc(h.lbl+' '+h.r.number)).join('; ')}</span>`:'<span style="color:var(--red)">Không có hồ sơ nào có số hiệu này</span>'}</td><td class="r"><button type="button" class="btn ghost sm danger" data-act="dk-scan-rm" data-id="${xi}" ${DK.busy?'disabled':''} title="Gỡ tệp này khỏi danh sách">Gỡ</button></td></tr>`).join('')}</tbody></table></div>
    <div class="toolbar" style="margin-top:8px"><button class="btn primary" id="dk_scan_go" data-act="dk-scan-go" ${okN?'':'disabled'}>Tải lên ${okN} tệp khớp</button><button class="btn ghost sm" data-act="dk-scan-clear">Bỏ chọn tất cả</button></div>`:'';
  const pid=S.f.dkp||''; const rcut=S.f.dkc||cut;
  const rc=dkReconRows(pid, rcut);
  return `${stat}
  <div class="grid g2">
    <div class="card"><h2>${step(1,'Mốc chốt và bộ mẫu Excel')}</h2>
      <div class="grid g2" style="gap:10px"><div class="fld"><label for="dk_cut">Mốc chốt số liệu</label><input id="dk_cut" value="${esc(fmtDate(cut))}" placeholder="dd/mm/yyyy" inputmode="numeric"></div>
        <div class="fld"><label for="dk_basis">Căn cứ (biên bản đối soát, công văn…)</label><input id="dk_basis" value="${esc(DK.basis??info.basis??'')}" placeholder="Ví dụ: Biên bản đối soát ngày 24/11/2026"></div></div>
      <p class="small muted">Khối lượng, tạm ứng, thanh toán, phụ lục đến hết mốc chốt là số liệu đầu kỳ: được ghi nhận đã duyệt, không phải trình lại. Phát sinh sau mốc chốt nhập như nghiệp vụ thường.</p>
      <div class="toolbar"><button class="btn" data-act="dk-tpl">Tải bộ mẫu trống (.xlsx)</button><button class="btn ghost" data-act="dk-tpl" data-id="data">Tải mẫu kèm dữ liệu đang có</button></div>
      <p class="small muted" style="margin:8px 0 0">Bộ mẫu gồm 13 trang tính: danh mục, dự án, hồ sơ pháp lý, hạng mục, gói thầu, hợp đồng, phụ lục, bảng khối lượng, tiến độ, khối lượng lũy kế, tạm ứng và thanh toán, kế hoạch thanh toán, kế hoạch vốn. Mỗi trang ghi rõ bộ phận điền. Mẫu kèm dữ liệu dùng khi cần sửa và nhập lại.</p></div>
    <div class="card"><h2>${step(2,'Nhập tệp đã điền')}</h2>
      <p class="small muted">Phần mềm kiểm tra toàn bộ tệp trước: thiếu cột bắt buộc, sai ngày, sai số, mã liên kết không tồn tại, trùng dòng, giá trị ngoài danh mục. Còn lỗi thì không ghi dòng nào. Dòng trùng mã với dữ liệu đã có sẽ được cập nhật.</p>
      <div class="toolbar"><label class="btn primary" style="cursor:pointer">Chọn tệp Excel đã điền<input type="file" id="dk_file" accept=".xlsx,.xls" hidden></label>${DK.busy?'<span class="small muted">Đang kiểm tra…</span>':''}</div>
      ${check}</div>
  </div>
  <div class="card"><div class="ch"><h2>${step(3,'Bảng đối soát theo hợp đồng')}</h2><span style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><select data-f="dkp" aria-label="Dự án">${opts(projects().map(p=>[p.id,p.code]),pid,'Tất cả dự án')}</select><input data-f="dkc" type="date" value="${esc(rcut)}" aria-label="Lũy kế đến ngày" style="max-width:150px"><button class="btn sm" data-act="dk-recon-xlsx">Xuất Excel</button><button class="btn sm" data-act="dk-recon-pdf">In / PDF (ô ký 3 bên)</button></span></div>
    <p class="small muted" style="margin-top:0">Lũy kế đến ${fmtDate(rcut)} theo từng hợp đồng: giá trị gồm phụ lục đã duyệt, nghiệm thu lũy kế, tạm ứng, thu hồi tạm ứng, thanh toán, còn lại. In để cán bộ kỹ thuật, kế toán đối chiếu với sổ kế toán và Kho bạc, lãnh đạo Ban ký xác nhận; biên bản đã ký đính kèm vào hồ sơ pháp lý của dự án.</p>
    <div class="tw"><table><thead><tr>${DK_RC_HEAD.map((h,i)=>i===3?'':`<th class="${i>3?'r':''}">${esc(h.replace(' (đ)',''))}</th>`).join('')}</tr></thead><tbody>${rc.length?rc.map(r=>`<tr${r[0]==='Tổng cộng'?' style="font-weight:600"':''}>${r.map((v,i)=>i===3?'':`<td class="${i>3?'r num':''}" ${i===2?`style="white-space:nowrap" title="${esc(r[3])}"`:''}>${i>3?fmtVND(v):esc(v)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${DK_RC_HEAD.length-1}" class="muted">Chưa có hợp đồng.</td></tr>`}</tbody></table></div></div>
  <div class="grid g2">
    <div class="card"><h2>${step(4,'Tải hồ sơ scan hàng loạt')}</h2>
      <p class="small muted">Đặt tên tệp theo số hiệu văn bản, số hợp đồng, số phụ lục hoặc số chứng từ (thay dấu / bằng -, ví dụ <span class="num">05-2026-HĐ-XL.pdf</span>; có thể thêm ghi chú sau dấu _). Phần mềm tự gắn tệp vào đúng hồ sơ và báo tệp không khớp. Có thể chọn thêm tệp từ nhiều thư mục.</p>
      <div class="toolbar"><label class="btn" style="cursor:pointer">${scan&&scan.length?'+ Chọn thêm tệp scan':'Chọn các tệp scan'}<input type="file" id="dk_scan" multiple accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" hidden></label></div>${scanHtml}</div>
    <div class="card"><h2>Dọn dữ liệu chạy thử</h2>
      <p class="small muted">Dùng một lần trước khi nhập dữ liệu chính thức: xóa dữ liệu mẫu và dữ liệu nhập thử (${st.projects} dự án, ${st.sampleUsers} tài khoản mẫu). Hệ thống tự sao lưu lên máy chủ trước khi xóa, có thể phục hồi lại từ bản sao lưu.</p>
      <button class="btn danger" data-act="dk-purge" ${st.projects||st.sampleUsers?'':'disabled'}>Dọn dữ liệu chạy thử…</button></div>
  </div>`;
}
ACT['dk-tpl']=(id)=>dkTemplate(id==='data');
ACT['dk-recheck']=()=>dkCheck(false);
ACT['dk-commit']=async()=>{ const w=DK.res&&DK.res.warnings.length;
  if(!await confirmBox(`Ghi dữ liệu đầu kỳ với mốc chốt <b>${fmtDate(DK.cutoff)}</b>?${w?` Còn ${w} cảnh báo.`:''} Khối lượng, tạm ứng, thanh toán, phụ lục, tiến độ được ghi nhận là số liệu đầu kỳ đã duyệt.`,'Ghi dữ liệu')) return;
  dkCheck(true); };
ACT['dk-err-exp']=()=>dkErrExport();
document.addEventListener('change', async e=>{
  const t=e.target;
  if(t.id==='dk_cut'){ const v=parseVNDate(t.value); if(v){ DK.cutoff=v; if(DK.res) DK.res=null; render(); } else toast('Mốc chốt không đúng ngày dd/mm/yyyy.','err'); }
  else if(t.id==='dk_basis') DK.basis=t.value.trim();
  else if(t.id==='dk_file'){ const f=t.files[0]; t.value=''; if(!f) return; if(!window.XLSX){ toast('Thư viện Excel chưa tải xong, thử lại sau.','err'); return; }
    try{ DK.rows=dkRead(await f.arrayBuffer()); DK.file=f.name; DK.res=null;
      if(!DK.rows.n && !DK.rows.issues.length){ DK.rows=null; toast('Tệp không có dòng dữ liệu nào (dùng bộ mẫu dữ liệu đầu kỳ).','err'); render(); return; }
      await dkCheck(false); }catch(ex){ console.error(ex); DK.rows=null; toast(errText(ex),'err'); render(); } }
  else if(t.id==='dk_scan'){ const fs=[...t.files]; t.value=''; if(!fs.length) return; dkScanAdd(fs); render(); }
});
