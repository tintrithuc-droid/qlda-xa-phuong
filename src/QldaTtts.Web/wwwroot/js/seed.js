/* ===== Dữ liệu mẫu (chỉ nạp khi người quản trị chọn "Kèm dữ liệu mẫu" lúc khởi tạo) ===== */
function makeSampleData(){
  const T = 1e9, M = 1e6;
  const D = {projects:[],tasks:[],legal:[],items:[],models:[],packages:[],contracts:[],addenda:[],schedule:[],diaries:[],boq:[],volumes:[],payplans:[],payments:[]};
  const mark = '(mẫu)';
  D.projects = [
    {id:'p1', code:'DA-TP01', name:'Dự án thành phần 1: Hạ tầng kỹ thuật và khu sản xuất giống thủy sản', group:'Nhóm B', tmdt:680*T, capital:'Ngân sách Thành phố', owner:'Ban QL Trung tâm Thủy sản TP.HCM', location:'TP. Hồ Chí Minh', start:'2025-03-01', end:'2027-12-31', status:'Đang thi công', phase:'Thực hiện dự án', decision:'QĐ phê duyệt dự án số 1021/QĐ-UBND '+mark, desc:'San nền, giao thông nội bộ, cấp thoát nước, khu ao nuôi giống, nhà ương và trạm bơm.'},
    {id:'p2', code:'DA-TP02', name:'Dự án thành phần 2: Khu điều hành, phòng thí nghiệm và trang thiết bị', group:'Nhóm B', tmdt:520*T, capital:'Ngân sách Thành phố', owner:'Ban QL Trung tâm Thủy sản TP.HCM', location:'TP. Hồ Chí Minh', start:'2025-06-01', end:'2027-06-30', status:'Đang thi công', phase:'Thực hiện dự án', decision:'QĐ phê duyệt dự án số 1022/QĐ-UBND '+mark, desc:'Nhà điều hành 5 tầng, phòng thí nghiệm 3 tầng, kho lạnh và thiết bị phòng thí nghiệm.'},
    {id:'p3', code:'DA-CB03', name:'Cải tạo hệ thống xử lý nước thải khu nuôi', group:'Nhóm C', tmdt:14.5*T, capital:'Ngân sách Thành phố', owner:'Ban QL Trung tâm Thủy sản TP.HCM', location:'TP. Hồ Chí Minh', start:'2026-08-01', end:'2027-09-30', status:'Chuẩn bị đầu tư', phase:'Chuẩn bị dự án', decision:'', desc:'Dự án mẫu ở giai đoạn chuẩn bị đầu tư.'},
    {id:'p4', code:'DA-SC04', name:'Sửa chữa kè bảo vệ bờ ao khu B', group:'Nhóm C', tmdt:4.8*T, capital:'Ngân sách Thành phố', owner:'Ban QL Trung tâm Thủy sản TP.HCM', location:'TP. Hồ Chí Minh', start:'2024-09-01', end:'2025-04-30', status:'Đã quyết toán', phase:'Kết thúc dự án', decision:'QĐ phê duyệt quyết toán số 88/QĐ-BQL '+mark, desc:'Dự án mẫu đã hoàn thành và quyết toán.'}
  ];
  D.tasks = [
    {id:'t1', projectId:'p1', name:'Trình thẩm định điều chỉnh dự toán gói XL01', assignee:'Phòng Kỹ thuật', due:'2026-11-05', status:'Đang thực hiện', priority:'Cao'},
    {id:'t2', projectId:'p1', name:'Hoàn thiện hồ sơ bàn giao mặt bằng đợt 2', assignee:'Phòng Kế hoạch', due:'2026-10-20', status:'Đang thực hiện', priority:'Cao'},
    {id:'t3', projectId:'p2', name:'Kiểm tra hồ sơ thanh toán đợt 4 gói XL03', assignee:'Phòng Kế toán', due:'2026-11-12', status:'Chưa bắt đầu', priority:'Trung bình'},
    {id:'t4', projectId:'p2', name:'Phê duyệt kết quả lựa chọn nhà thầu gói TB01', assignee:'Lãnh đạo Ban', due:'2026-12-10', status:'Chưa bắt đầu', priority:'Cao'},
    {id:'t5', projectId:'p3', name:'Lấy ý kiến cơ quan chuyên môn về BCKTKT', assignee:'Phòng Kỹ thuật', due:'2026-12-01', status:'Chưa bắt đầu', priority:'Trung bình'},
    {id:'t6', projectId:'p1', name:'Nghiệm thu giai đoạn san nền', assignee:'Phòng Kỹ thuật', due:'2026-01-15', status:'Hoàn thành', priority:'Trung bình'}
  ];
  D.legal = [
    {id:'l1', projectId:'p1', type:'Quyết định chủ trương đầu tư', number:'512/NQ-HĐND '+mark, date:'2024-07-12', issuer:'HĐND Thành phố', title:'Chủ trương đầu tư dự án thành phần 1'},
    {id:'l2', projectId:'p1', type:'Quyết định phê duyệt dự án', number:'1021/QĐ-UBND '+mark, date:'2025-01-20', issuer:'UBND Thành phố', title:'Phê duyệt dự án đầu tư xây dựng'},
    {id:'l3', projectId:'p1', type:'Thiết kế, dự toán', number:'45/QĐ-BQL '+mark, date:'2025-03-28', issuer:'Ban QL Trung tâm Thủy sản', title:'Phê duyệt thiết kế BVTC và dự toán'},
    {id:'l4', projectId:'p2', type:'Quyết định phê duyệt dự án', number:'1022/QĐ-UBND '+mark, date:'2025-02-14', issuer:'UBND Thành phố', title:'Phê duyệt dự án đầu tư xây dựng'},
    {id:'l5', projectId:'p2', type:'Giấy phép xây dựng', number:'210/GPXD '+mark, date:'2025-08-22', issuer:'Sở Xây dựng', title:'Giấy phép xây dựng nhà điều hành, phòng thí nghiệm'},
    {id:'l6', projectId:'p1', packageId:'k1', type:'Kế hoạch lựa chọn nhà thầu', number:'61/QĐ-BQL '+mark, date:'2025-03-30', issuer:'Ban QL Trung tâm Thủy sản', title:'Phê duyệt KHLCNT gói XL01'},
    {id:'l7', projectId:'p1', packageId:'k1', type:'Kết quả lựa chọn nhà thầu', number:'98/QĐ-BQL '+mark, date:'2025-05-05', issuer:'Ban QL Trung tâm Thủy sản', title:'Phê duyệt kết quả LCNT gói XL01'},
    {id:'l8', projectId:'p2', packageId:'k4', type:'Bảo lãnh thực hiện hợp đồng', number:'BL-2025-0915 '+mark, date:'2025-09-06', issuer:'Ngân hàng thương mại', title:'Bảo lãnh thực hiện HĐ gói XL03, hiệu lực đến 30/06/2027'},
    {id:'l9', projectId:'p2', packageId:'k5', type:'Hồ sơ mời thầu', number:'HSMT-TB01 '+mark, date:'2026-09-10', issuer:'Ban QL Trung tâm Thủy sản', title:'Hồ sơ mời thầu gói thiết bị phòng thí nghiệm'}
  ];
  // Hạng mục công trình
  D.items = [
    {id:'i1', projectId:'p1', code:'HM01', name:'San nền khu A', structure:'Đất đắp K95', area:52000, x:-80, z:-40, w:150, d:110, h:0.6, floors:0},
    {id:'i2', projectId:'p1', code:'HM02', name:'Đường giao thông nội bộ', structure:'Bê tông nhựa', area:38000, x:0, z:30, w:230, d:12, h:0.4, floors:0},
    {id:'i3', projectId:'p1', code:'HM03', name:'Khu ao nuôi giống (8 ao)', structure:'Ao lót HDPE', area:24000, x:-60, z:80, w:110, d:70, h:1.2, floors:0},
    {id:'i4', projectId:'p1', code:'HM04', name:'Nhà ương giống', structure:'Khung thép, mái tôn', area:3600, x:60, z:80, w:60, d:40, h:9, floors:1},
    {id:'i5', projectId:'p1', code:'HM05', name:'Trạm bơm cấp nước', structure:'BTCT', area:420, x:100, z:-30, w:24, d:18, h:7, floors:1},
    {id:'i6', projectId:'p2', code:'HM01', name:'Nhà điều hành 5 tầng', structure:'Khung BTCT', area:6200, x:-30, z:0, w:48, d:26, h:21, floors:5},
    {id:'i7', projectId:'p2', code:'HM02', name:'Phòng thí nghiệm 3 tầng', structure:'Khung BTCT', area:3900, x:35, z:5, w:44, d:30, h:13, floors:3},
    {id:'i8', projectId:'p2', code:'HM03', name:'Kho lạnh', structure:'Panel cách nhiệt', area:900, x:30, z:-40, w:30, d:30, h:8, floors:1},
    {id:'i9', projectId:'p2', code:'HM04', name:'Sân, cổng, nhà bảo vệ', structure:'Bê tông, gạch', area:2400, x:-20, z:-42, w:70, d:22, h:0.3, floors:0}
  ];
  D.models = [
    {id:'m1', fileKey:'f1', projectId:'p1', itemId:'', name:'TP01_TongMatBang.ifc', format:'IFC', version:3, date:'2026-08-14', by:'Tư vấn thiết kế', size:48200000, note:'Tổng mặt bằng sau điều chỉnh cống hộp'},
    {id:'m2', fileKey:'f1', projectId:'p1', itemId:'', name:'TP01_TongMatBang.ifc', format:'IFC', version:2, date:'2026-02-03', by:'Tư vấn thiết kế', size:46900000, note:'Phiên bản trình duyệt'},
    {id:'m3', fileKey:'f2', projectId:'p1', itemId:'i4', name:'TP01_NhaUongGiong_KetCau.rvt', format:'RVT', version:1, date:'2026-01-10', by:'Tư vấn thiết kế', size:91500000, note:''},
    {id:'m4', fileKey:'f3', projectId:'p2', itemId:'i6', name:'TP02_NhaDieuHanh_KienTruc.ifc', format:'IFC', version:4, date:'2026-09-02', by:'Nhà thầu XL03', size:73400000, note:'Cập nhật shopdrawing tầng 3–5'},
    {id:'m5', fileKey:'f4', projectId:'p2', itemId:'i7', name:'TP02_PTN_MEP.dwg', format:'DWG', version:2, date:'2026-07-21', by:'Tư vấn thiết kế', size:12800000, note:''}
  ];
  D.packages = [
    {id:'k1', projectId:'p1', code:'XL01', name:'Thi công san nền, giao thông và hạ tầng kỹ thuật', type:'Xây lắp', method:'Đấu thầu rộng rãi', estimate:210*T, status:'Đang thực hiện hợp đồng'},
    {id:'k2', projectId:'p1', code:'XL02', name:'Thi công khu ao nuôi, nhà ương và trạm bơm', type:'Xây lắp', method:'Đấu thầu rộng rãi', estimate:185*T, status:'Đang thực hiện hợp đồng'},
    {id:'k3', projectId:'p1', code:'TV01', name:'Tư vấn giám sát thi công xây dựng', type:'Tư vấn', method:'Đấu thầu rộng rãi', estimate:6.2*T, status:'Đang thực hiện hợp đồng'},
    {id:'k4', projectId:'p2', code:'XL03', name:'Thi công nhà điều hành, phòng thí nghiệm và kho lạnh', type:'Xây lắp', method:'Đấu thầu rộng rãi', estimate:240*T, status:'Đang thực hiện hợp đồng'},
    {id:'k5', projectId:'p2', code:'TB01', name:'Cung cấp, lắp đặt thiết bị phòng thí nghiệm', type:'Mua sắm hàng hóa', method:'Đấu thầu rộng rãi', estimate:95*T, status:'Đang lựa chọn nhà thầu'},
    {id:'k6', projectId:'p2', code:'TV02', name:'Tư vấn lập thiết kế bản vẽ thi công và dự toán', type:'Tư vấn', method:'Chỉ định thầu', estimate:8.5*T, status:'Đã thanh lý hợp đồng'},
    {id:'k7', projectId:'p3', code:'TV03', name:'Tư vấn lập báo cáo kinh tế - kỹ thuật', type:'Tư vấn', method:'Chỉ định thầu rút gọn', estimate:0.42*T, status:'Đang thực hiện hợp đồng'}
  ];
  D.contracts = [
    {id:'c1', packageId:'k1', projectId:'p1', number:'15/2025/HĐ-XL01', contractor:'Liên danh Nhà thầu Xây lắp số 1 '+mark, signDate:'2025-05-10', value:198.6*T, start:'2025-05-20', end:'2026-12-31', ctype:'Đơn giá cố định', guarantee:'10%', advanceRate:15},
    {id:'c2', packageId:'k2', projectId:'p1', number:'22/2025/HĐ-XL02', contractor:'Công ty Xây lắp số 2 '+mark, signDate:'2025-07-01', value:176.2*T, start:'2025-07-15', end:'2027-06-30', ctype:'Đơn giá cố định', guarantee:'10%', advanceRate:15},
    {id:'c3', packageId:'k3', projectId:'p1', number:'09/2025/HĐ-TV01', contractor:'Công ty Tư vấn giám sát '+mark, signDate:'2025-05-12', value:5.9*T, start:'2025-05-15', end:'2027-12-31', ctype:'Theo thời gian', guarantee:'3%', advanceRate:10},
    {id:'c4', packageId:'k4', projectId:'p2', number:'31/2025/HĐ-XL03', contractor:'Liên danh Nhà thầu Xây lắp số 3 '+mark, signDate:'2025-09-05', value:229.8*T, start:'2025-09-20', end:'2027-03-31', ctype:'Đơn giá điều chỉnh', guarantee:'10%', advanceRate:15},
    {id:'c5', packageId:'k6', projectId:'p2', number:'04/2025/HĐ-TV02', contractor:'Công ty Tư vấn thiết kế '+mark, signDate:'2025-03-01', value:8.1*T, start:'2025-03-05', end:'2025-08-30', ctype:'Trọn gói', guarantee:'3%', advanceRate:10},
    {id:'c6', packageId:'k7', projectId:'p3', number:'12/2026/HĐ-TV03', contractor:'Công ty Tư vấn đầu tư '+mark, signDate:'2026-08-15', value:0.39*T, start:'2026-08-20', end:'2026-12-15', ctype:'Trọn gói', guarantee:'', advanceRate:0}
  ];
  D.addenda = [
    {id:'a1', contractId:'c1', number:'PL01', date:'2026-03-12', content:'Bổ sung khối lượng cống hộp thoát nước tuyến N3', valueChange:3.2*T, daysChange:0},
    {id:'a2', contractId:'c4', number:'PL01', date:'2026-07-20', content:'Gia hạn thời gian thực hiện do điều chỉnh thiết kế móng', valueChange:0, daysChange:45},
    {id:'a3', contractId:'c4', number:'PL02', date:'2026-09-28', content:'Điều chỉnh đơn giá thép theo chỉ số giá quý II/2026', valueChange:1.85*T, daysChange:0}
  ];
  // Tiến độ: lịch sử cập nhật hằng tháng
  const now = new Date().toISOString().slice(0,10);
  function hist(ps, pe, prog){
    const out=[]; const s=new Date(ps), e=new Date(now<pe?now:pe);
    let d=new Date(s.getFullYear(), s.getMonth()+1, 0); const pts=[];
    while(d<=e){ pts.push(d.toISOString().slice(0,10)); d=new Date(d.getFullYear(), d.getMonth()+2, 0); }
    if(!pts.length) return prog? [{date:now, progress:prog, note:'Cập nhật'}] : [];
    pts.forEach((p,i)=>{ const f=(i+1)/pts.length; out.push({date:p, progress:Math.round(prog*Math.pow(f,1.15)), note:'Cập nhật định kỳ'}); });
    out[out.length-1].progress=prog; return out;
  }
  const sc = [
    ['s1','p1','k1','i1','San nền giai đoạn 1','2025-06-01','2025-12-31',100,18],
    ['s2','p1','k1','i2','Đường giao thông nội bộ','2025-10-01','2026-09-30',82,25],
    ['s3','p1','k1','','Thoát nước mưa, cống hộp','2026-01-15','2026-11-30',64,40],
    ['s4','p1','k1','','Cấp điện, chiếu sáng ngoài nhà','2026-06-01','2026-12-31',20,17],
    ['s5','p1','k2','i3','Đào, đắp và lót đáy ao nuôi giống','2025-08-01','2026-06-30',100,30],
    ['s6','p1','k2','i4','Nhà ương giống','2026-01-01','2026-12-31',55,20],
    ['s7','p1','k2','i5','Trạm bơm và đường ống cấp nước','2026-04-01','2027-03-31',25,35],
    ['s8','p1','k2','','Lắp đặt hệ thống sục khí','2026-10-01','2027-05-31',0,15],
    ['s9','p2','k4','i6','Móng, tầng hầm nhà điều hành','2025-10-01','2026-05-31',100,20],
    ['s10','p2','k4','i6','Kết cấu thân nhà điều hành','2026-04-01','2026-12-31',58,25],
    ['s11','p2','k4','i7','Kết cấu phòng thí nghiệm','2026-03-01','2026-11-30',61,18],
    ['s12','p2','k4','i8','Kho lạnh','2026-08-01','2027-01-31',15,10],
    ['s13','p2','k4','i9','Hoàn thiện, MEP, sân cổng','2026-11-01','2027-03-31',0,27],
    ['s14','p2','k6','','Thiết kế BVTC và dự toán','2025-03-05','2025-08-30',100,8],
    ['s15','p3','k7','','Khảo sát, lập BCKTKT','2026-08-20','2026-12-15',45,10],
    ['s16','p2','k5','','Lựa chọn nhà thầu thiết bị','2026-09-01','2026-12-15',30,10]
  ];
  D.schedule = sc.map(([id,projectId,packageId,itemId,name,planStart,planEnd,progress,weight])=>({id,projectId,packageId,itemId,name,planStart,planEnd,progress,weight,history:hist(planStart,planEnd,progress)}));
  // Khối lượng hợp đồng (đơn giá, khối lượng) và tỷ lệ đã thực hiện / nghiệm thu
  const bq = [
    ['c1','AB.11','Đào san nền đất cấp II','m3',145000,62000,1,1],
    ['c1','AB.65','Đắp cát nền độ chặt K95','m3',280000,185000,1,.98],
    ['c1','AD.23','Mặt đường bê tông nhựa, móng cấp phối','m2',38000,650000,.84,.72],
    ['c1','AF.82','Cống hộp BTCT 2x2m','m',3200,18500000,.66,.55],
    ['c1','BB.13','Ống cấp nước HDPE D315','m',12500,1850000,.58,.45],
    ['c1','BA.14','Cột đèn thép 8m, đèn LED','cột',520,21500000,.18,0],
    ['c1','AL.17','Trồng cây xanh, thảm cỏ','cây',3600,5200000,0,0],
    ['c2','AB.21','Đào, đắp ao nuôi','m3',320000,95000,1,1],
    ['c2','AK.95','Lót bạt HDPE đáy ao','m2',96000,210000,1,1],
    ['c2','AF.12','Bê tông kết cấu nhà ương','m3',4200,4100000,.7,.6],
    ['c2','AI.11','Kết cấu thép mái nhà ương','tấn',380,42000000,.45,.3],
    ['c2','BA.31','Trạm bơm, máy bơm','trạm',2,18500000000,.2,0],
    ['c2','BB.18','Đường ống cấp nước ao','m',9800,2300000,.3,.2],
    ['c2','BA.55','Hệ thống sục khí','HT',1,32900000000,0,0],
    ['c3','TV','Chi phí tư vấn giám sát','gói',1,5900000000,.52,.45],
    ['c4','AC.25','Cọc BTCT D400','m',14200,1050000,1,1],
    ['c4','AF.11','Bê tông móng, tầng hầm','m3',6800,3600000,1,1],
    ['c4','AF.12','Bê tông thân nhà','m3',9200,4200000,.6,.48],
    ['c4','AF.61','Cốt thép các loại','tấn',2650,21000000,.68,.6],
    ['c4','AE.22','Xây, tô, hoàn thiện','m2',42000,1150000,.05,0],
    ['c4','BA.99','Hệ thống MEP','HT',1,47800000000,0,0],
    ['c5','TV','Chi phí tư vấn thiết kế','gói',1,8100000000,1,1],
    ['c6','TV','Chi phí lập BCKTKT','gói',1,390000000,.45,0]
  ];
  const months=['2025-09-28','2025-12-26','2026-03-27','2026-06-26','2026-09-25'];
  let vn=0;
  bq.forEach(([cid,code,name,unit,qty,price,fd,fa],i)=>{
    const id='b'+(i+1); D.boq.push({id, contractId:cid, code, name, unit, qty, price});
    if(!fd) return;
    const c=D.contracts.find(x=>x.id===cid);
    const ms=months.filter(m=>m>=c.start).slice(-4);
    const n=Math.max(1,Math.min(ms.length, Math.ceil(fd*4)));
    const use=ms.slice(-n);
    use.forEach((m,j)=>{
      const part=(j+1)/n, prev=j/n;
      const dq=Math.round(qty*fd*(part-prev)*1000)/1000, aq=Math.round(qty*fa*(part-prev)*1000)/1000;
      D.volumes.push({id:'v'+(++vn), boqId:id, contractId:cid, date:m, period:'Đợt '+(j+1), doneQty:dq, acceptedQty:aq, note:''});
    });
  });
  // Kế hoạch & hồ sơ thanh toán
  const pp=[['c1','Tạm ứng','2025-06-10',29.79],['c1','Đợt 1','2025-12-31',45],['c1','Đợt 2','2026-06-30',52],['c1','Đợt 3','2026-10-15',38],['c1','Quyết toán','2027-03-31',37],
    ['c2','Tạm ứng','2025-08-05',26.4],['c2','Đợt 1','2026-03-31',40],['c2','Đợt 2','2026-09-30',30],['c2','Đợt 3','2027-03-31',50],
    ['c4','Tạm ứng','2025-10-10',34.5],['c4','Đợt 1','2026-03-31',45],['c4','Đợt 2','2026-08-31',55],['c4','Đợt 3','2026-12-31',50],
    ['c3','Tạm ứng','2025-06-01',.59],['c3','Đợt 1','2026-06-30',1.6],['c5','Thanh toán 100%','2025-09-30',8.1],['c6','Tạm ứng','2026-11-30',.12]];
  D.payplans = pp.map(([contractId,phase,planDate,amt],i)=>({id:'q'+(i+1), contractId, phase, planDate, amount:Math.round(amt*T)}));
  const pm=[['c1','TU-01','2025-06-12','Tạm ứng',29.79,'Đã thanh toán'],['c1','TT-01','2026-01-08','Thanh toán khối lượng',41.2,'Đã thanh toán'],['c1','TT-02','2026-07-06','Thanh toán khối lượng',48.6,'Đã thanh toán'],['c1','TT-03','2026-10-20','Thanh toán khối lượng',22.4,'Đang trình KBNN'],
    ['c2','TU-01','2025-08-06','Tạm ứng',26.4,'Đã thanh toán'],['c2','TT-01','2026-04-10','Thanh toán khối lượng',33.5,'Đã thanh toán'],['c2','TT-02','2026-10-10','Thanh toán khối lượng',18.9,'Đề nghị'],
    ['c4','TU-01','2025-10-12','Tạm ứng',34.5,'Đã thanh toán'],['c4','TT-01','2026-04-15','Thanh toán khối lượng',39.8,'Đã thanh toán'],['c4','TT-02','2026-09-08','Thanh toán khối lượng',41.6,'Đã thanh toán'],
    ['c3','TU-01','2025-06-02','Tạm ứng',.59,'Đã thanh toán'],['c3','TT-01','2026-07-02','Thanh toán khối lượng',1.6,'Đã thanh toán'],['c5','TT-01','2025-10-05','Thanh toán khối lượng',8.1,'Đã thanh toán']];
  D.payments = pm.map(([contractId,number,date,kind,amt,status],i)=>({id:'r'+(i+1), contractId, number, date, kind, amount:Math.round(amt*T), status, content:kind+' '+number}));
  D.diaries = [
    {id:'d1', projectId:'p1', packageId:'k1', date:'2026-10-26', shift:'Cả ngày', weather:'Nắng', workers:64, machines:'2 máy rải nhựa, 3 lu rung, 4 ô tô tự đổ', works:'Thảm bê tông nhựa tuyến N2 đoạn Km0+200–Km0+480 | 2650 | m2\nLắp đặt cống hộp tuyến N3 đốt 41–46 | 12 | m\nĐổ bê tông hố ga HG-17, HG-18 | 6.4 | m3', issues:'Thiếu 01 xe vận chuyển bê tông nhựa buổi chiều, đã điều chỉnh ca.', supervisor:'TVGS TV01', photos:[]},
    {id:'d2', projectId:'p1', packageId:'k1', date:'2026-10-25', shift:'Cả ngày', weather:'Mưa chiều', workers:51, machines:'1 máy đào, 2 cần cẩu 25T', works:'Lắp đặt cống hộp tuyến N3 đốt 35–40 | 12 | m\nĐào hố móng hố ga HG-19 | 85 | m3', issues:'Mưa từ 15h, dừng thi công lắp cống 1,5 giờ.', supervisor:'TVGS TV01', photos:[]},
    {id:'d3', projectId:'p1', packageId:'k2', date:'2026-10-26', shift:'Ca sáng', weather:'Nắng', workers:38, machines:'1 cẩu tháp, 1 máy hàn', works:'Lắp dựng kèo thép nhà ương trục 5–9 | 14.5 | tấn\nĐổ bê tông nền nhà ương khối B | 120 | m3', issues:'', supervisor:'TVGS TV01', photos:[]},
    {id:'d4', projectId:'p2', packageId:'k4', date:'2026-10-26', shift:'Cả ngày', weather:'Nắng', workers:92, machines:'1 cẩu tháp, 2 xe bơm bê tông', works:'Đổ bê tông sàn tầng 4 nhà điều hành | 310 | m3\nGia công lắp dựng cốt thép cột tầng 5 | 18 | tấn\nCốp pha sàn tầng 3 phòng thí nghiệm | 640 | m2', issues:'Phòng thí nghiệm chậm khoảng 2 tuần do chờ bản vẽ điều chỉnh lỗ mở kỹ thuật.', supervisor:'Ban QLDA', photos:[]},
    {id:'d5', projectId:'p2', packageId:'k4', date:'2026-10-24', shift:'Cả ngày', weather:'Âm u', workers:88, machines:'1 cẩu tháp', works:'Lắp dựng cốp pha sàn tầng 4 | 1150 | m2\nNghiệm thu cốt thép sàn tầng 4 | 1 | lần', issues:'', supervisor:'Ban QLDA', photos:[]}
  ];
  return D;
}
function defaultCatalogs(){
  const C = {
    'Trạng thái dự án':['Chuẩn bị đầu tư','Đang lựa chọn nhà thầu','Đang thi công','Tạm dừng','Hoàn thành','Đã quyết toán'],
    'Nhóm dự án':['Quan trọng quốc gia','Nhóm A','Nhóm B','Nhóm C'],
    'Giai đoạn':['Chuẩn bị dự án','Thực hiện dự án','Kết thúc dự án'],
    'Nguồn vốn':['Ngân sách Thành phố','Ngân sách Trung ương','Vốn khác'],
    'Loại hồ sơ pháp lý':['Quyết định chủ trương đầu tư','Quyết định phê duyệt dự án','Thiết kế, dự toán','Giấy phép xây dựng','Kế hoạch lựa chọn nhà thầu','Hồ sơ mời thầu','Kết quả lựa chọn nhà thầu','Bảo lãnh thực hiện hợp đồng','Biên bản nghiệm thu','Văn bản khác'],
    'Loại gói thầu':['Xây lắp','Tư vấn','Mua sắm hàng hóa','Phi tư vấn','Hỗn hợp'],
    'Hình thức lựa chọn nhà thầu':['Đấu thầu rộng rãi','Đấu thầu hạn chế','Chỉ định thầu','Chỉ định thầu rút gọn','Chào hàng cạnh tranh','Tự thực hiện'],
    'Trạng thái gói thầu':['Chưa lựa chọn nhà thầu','Đang lựa chọn nhà thầu','Đang thực hiện hợp đồng','Đã nghiệm thu','Đã thanh lý hợp đồng'],
    'Loại hợp đồng':['Trọn gói','Đơn giá cố định','Đơn giá điều chỉnh','Theo thời gian','Hỗn hợp'],
    'Đơn vị tính':['m','m2','m3','tấn','cái','cột','cây','trạm','HT','gói','bộ'],
    'Thời tiết':['Nắng','Âm u','Mưa','Mưa chiều','Mưa lớn'],
    'Định dạng mô hình':['IFC','RVT','DWG','NWD','PDF','SKP'],
    'Loại thanh toán':['Tạm ứng','Thanh toán khối lượng','Thu hồi tạm ứng','Quyết toán'],
    'Trạng thái thanh toán':['Đề nghị','Đang trình KBNN','Đã thanh toán','Từ chối']
  };
  const out=[]; let n=0;
  Object.entries(C).forEach(([type,vals])=>vals.forEach((value,i)=>out.push({id:'cat'+(++n), type, value, order:i})));
  return out;
}
function defaultGroups(){
  const ALL = MODULES.map(m=>m.key);
  const P = (edit, view)=>Object.fromEntries(ALL.map(k=>[k, edit.includes(k)?'edit':(view==='*'||view.includes(k))?'view':'none']));
  return [
    {id:'g-admin', name:'Quản trị hệ thống', admin:true, perms:P(ALL,'*'), scope:[], desc:'Toàn quyền, quản lý người dùng và cấu hình.'},
    {id:'g-lead', name:'Lãnh đạo Ban', admin:false, perms:P(['du-an'],'*'), scope:[], desc:'Xem toàn bộ, chỉ đạo, cập nhật thông tin dự án.'},
    {id:'g-tech', name:'Cán bộ kỹ thuật', admin:false, perms:P(['du-an','mo-hinh','goi-thau','tien-do','nhat-ky','khoi-luong'],'*'), scope:[], desc:'Quản lý kỹ thuật, tiến độ, nhật ký, khối lượng.'},
    {id:'g-acc', name:'Kế toán', admin:false, perms:P(['thanh-toan'],['tong-quan','du-an','goi-thau','khoi-luong','bao-cao']), scope:[], desc:'Kế hoạch và hồ sơ thanh toán.'},
    {id:'g-site', name:'Tư vấn giám sát / Nhà thầu', admin:false, perms:P(['nhat-ky','tien-do'],['tong-quan','du-an','mo-hinh','khoi-luong']), scope:['p1'], desc:'Cập nhật nhật ký, tiến độ hiện trường trong phạm vi dự án được giao.'}
  ];
}
