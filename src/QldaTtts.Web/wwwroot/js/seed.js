/* ===== Dữ liệu mẫu cấp xã/phường (chỉ nạp khi người quản trị chọn "Kèm dữ liệu mẫu" lúc khởi tạo) ===== */
function makeSampleData(){
  const T = 1e9, M = 1e6;
  const D = {projects:[],tasks:[],legal:[],items:[],models:[],packages:[],contracts:[],addenda:[],schedule:[],diaries:[],boq:[],volumes:[],payplans:[],payments:[],capitals:[],acceptances:[],settlements:[],clearances:[]};
  const mark = '(mẫu)';
  const OWNER = 'UBND xã Mẫu';
  D.projects = [
    {boardRole:'Chủ đầu tư', decisionMaker:'Chủ tịch UBND xã Mẫu', mgmtForm:'Ban QLDA đầu tư xây dựng', projectKind:'Xây dựng mới', reportType:'Báo cáo nghiên cứu khả thi', id:'p1', code:'DA-01', name:'Nâng cấp, mở rộng đường giao thông liên ấp Tân Hòa – Tân Lợi', group:'Nhóm C', tmdt:28.5*T, capital:'Ngân sách Thành phố hỗ trợ có mục tiêu', owner:OWNER, location:'Xã Mẫu', start:'2025-03-01', end:'2027-03-31', status:'Đang thi công', phase:'Thực hiện dự án', decision:'QĐ phê duyệt dự án số 215/QĐ-UBND '+mark, desc:'Dự án mẫu: nâng cấp 4,2 km đường bê tông nhựa, cống thoát nước dọc, chiếu sáng.'},
    {boardRole:'Chủ đầu tư', decisionMaker:'Chủ tịch UBND xã Mẫu', mgmtForm:'Ban QLDA đầu tư xây dựng', projectKind:'Xây dựng mới', reportType:'Báo cáo nghiên cứu khả thi', id:'p2', code:'DA-02', name:'Xây dựng Trường Mầm non xã Mẫu (12 phòng học)', group:'Nhóm C', tmdt:24.8*T, capital:'Ngân sách Thành phố hỗ trợ có mục tiêu', owner:OWNER, location:'Xã Mẫu', start:'2025-06-01', end:'2027-01-31', status:'Đang thi công', phase:'Thực hiện dự án', decision:'QĐ phê duyệt dự án số 238/QĐ-UBND '+mark, desc:'Dự án mẫu: khối phòng học 2 tầng, nhà bếp, sân chơi, hàng rào.'},
    {boardRole:'Chủ đầu tư', decisionMaker:'Chủ tịch UBND xã Mẫu', mgmtForm:'Ban QLDA đầu tư xây dựng', projectKind:'Xây dựng mới', reportType:'Báo cáo kinh tế - kỹ thuật', id:'p3', code:'DA-03', name:'Nạo vét, kè gia cố kênh thủy lợi ấp Tân Thạnh', group:'Nhóm C', tmdt:9.6*T, capital:'Ngân sách xã/phường', owner:OWNER, location:'Xã Mẫu', start:'2026-08-01', end:'2027-09-30', status:'Chuẩn bị đầu tư', phase:'Chuẩn bị dự án', decision:'', desc:'Dự án mẫu ở giai đoạn chuẩn bị đầu tư, đang lập báo cáo kinh tế - kỹ thuật.'},
    {boardRole:'Tư vấn quản lý dự án', decisionMaker:'Chủ tịch UBND xã Mẫu', mgmtForm:'Chủ đầu tư thuê tư vấn quản lý dự án', projectKind:'Sửa chữa, cải tạo, nâng cấp', reportType:'Báo cáo kinh tế - kỹ thuật', id:'p4', code:'DA-04', name:'Sửa chữa Nhà văn hóa – Trung tâm học tập cộng đồng xã', group:'Nhóm C', tmdt:3.2*T, capital:'Ngân sách xã/phường', owner:'Trung tâm Văn hóa - Thể thao xã Mẫu (đơn vị quản lý sử dụng)', location:'Xã Mẫu', start:'2024-09-01', end:'2025-04-30', status:'Đã quyết toán', phase:'Kết thúc dự án', decision:'QĐ phê duyệt quyết toán số 88/QĐ-UBND '+mark, desc:'Dự án mẫu đã hoàn thành và quyết toán.'},
    {boardRole:'Quản lý dự án được giao', decisionMaker:'Chủ tịch UBND xã Mẫu', mgmtForm:'Ban QLDA đầu tư xây dựng', projectKind:'Mua sắm', reportType:'Không yêu cầu (mua sắm, nhiệm vụ)', id:'p5', code:'DA-05', name:'Mua sắm trang thiết bị Bộ phận Tiếp nhận và trả kết quả xã', group:'Nhóm C', tmdt:1.05*T, capital:'Ngân sách xã/phường', owner:OWNER, location:'Xã Mẫu', start:'2026-07-01', end:'2026-12-31', status:'Đang thực hiện', phase:'Thực hiện dự án', decision:'QĐ phê duyệt dự toán mua sắm số 142/QĐ-UBND '+mark, desc:'Việc mẫu không phải xây dựng: mua sắm máy tính, máy quét, màn hình tra cứu, ki-ốt lấy số cho Bộ phận một cửa.'},
    {boardRole:'Quản lý dự án được giao', decisionMaker:'Chủ tịch UBND xã Mẫu', mgmtForm:'Ban QLDA đầu tư xây dựng', projectKind:'Nhiệm vụ khác', reportType:'Không yêu cầu (mua sắm, nhiệm vụ)', id:'p6', code:'DA-06', name:'Số hóa hồ sơ, tài liệu lưu trữ của UBND xã (nhiệm vụ chuyển đổi số năm 2026)', group:'Nhóm C', tmdt:0.86*T, capital:'Ngân sách xã/phường', owner:OWNER, location:'Xã Mẫu', start:'2026-05-01', end:'2026-12-15', status:'Đang thực hiện', phase:'Thực hiện dự án', decision:'Kế hoạch chuyển đổi số năm 2026 số 35/KH-UBND '+mark, desc:'Nhiệm vụ mẫu: số hóa hồ sơ lưu trữ giai đoạn 2015–2025, tạo lập dữ liệu phục vụ tra cứu và giải quyết thủ tục.'}
  ];
  D.tasks = [
    {id:'t1', projectId:'p1', name:'Trình thẩm định điều chỉnh dự toán gói XL01', assignee:'Bộ phận Kỹ thuật', due:'2026-11-05', status:'Đang thực hiện', priority:'Cao'},
    {id:'t2', projectId:'p1', name:'Hoàn thiện hồ sơ bồi thường, giải phóng mặt bằng đoạn Km2–Km3', assignee:'Bộ phận Kế hoạch', due:'2026-10-20', status:'Đang thực hiện', priority:'Cao'},
    {id:'t3', projectId:'p2', name:'Kiểm tra hồ sơ thanh toán đợt 2 gói XL02', assignee:'Kế toán', due:'2026-11-12', status:'Chưa bắt đầu', priority:'Trung bình'},
    {id:'t4', projectId:'p2', name:'Phê duyệt kết quả lựa chọn nhà thầu gói TB01', assignee:'Lãnh đạo Ban', due:'2026-12-10', status:'Chưa bắt đầu', priority:'Cao'},
    {id:'t5', projectId:'p3', name:'Lấy ý kiến cơ quan chuyên môn về BCKTKT', assignee:'Bộ phận Kỹ thuật', due:'2026-12-01', status:'Chưa bắt đầu', priority:'Trung bình'},
    {id:'t6', projectId:'p1', name:'Nghiệm thu nền đường giai đoạn 1', assignee:'Bộ phận Kỹ thuật', due:'2026-01-15', status:'Hoàn thành', priority:'Trung bình'},
    {id:'t7', projectId:'p5', name:'Nghiệm thu, bàn giao thiết bị đợt 1 cho Bộ phận một cửa', assignee:'Văn phòng HĐND - UBND', due:'2026-11-20', status:'Đang thực hiện', priority:'Cao'},
    {id:'t8', projectId:'p5', name:'Lập danh mục tài sản, ghi tăng tài sản cố định', assignee:'Kế toán', due:'2026-12-10', status:'Chưa bắt đầu', priority:'Trung bình'},
    {id:'t9', projectId:'p6', name:'Báo cáo kết quả số hóa quý III gửi UBND Thành phố', assignee:'Văn phòng HĐND - UBND', due:'2026-10-30', status:'Đang thực hiện', priority:'Cao'},
    {id:'t10', projectId:'p6', name:'Kiểm tra chất lượng dữ liệu số hóa lô 3 (hồ sơ đất đai)', assignee:'Phòng Kinh tế', due:'2026-11-25', status:'Chưa bắt đầu', priority:'Trung bình'},
    {id:'t11', projectId:'p6', name:'Hoàn thành số hóa lô 1, lô 2 (hồ sơ hộ tịch)', assignee:'Văn phòng HĐND - UBND', due:'2026-08-31', status:'Hoàn thành', priority:'Trung bình'}
  ];
  D.legal = [
    {id:'l1', projectId:'p1', type:'Quyết định chủ trương đầu tư', number:'12/NQ-HĐND '+mark, date:'2024-07-12', issuer:'HĐND xã', title:'Chủ trương đầu tư dự án đường liên ấp'},
    {id:'l2', projectId:'p1', type:'Quyết định phê duyệt dự án', number:'215/QĐ-UBND '+mark, date:'2025-01-20', issuer:'UBND xã', title:'Phê duyệt báo cáo kinh tế - kỹ thuật'},
    {id:'l3', projectId:'p1', type:'Thiết kế, dự toán', number:'45/QĐ-UBND '+mark, date:'2025-03-28', issuer:'UBND xã', title:'Phê duyệt thiết kế BVTC và dự toán'},
    {id:'l4', projectId:'p2', type:'Quyết định phê duyệt dự án', number:'238/QĐ-UBND '+mark, date:'2025-02-14', issuer:'UBND xã', title:'Phê duyệt dự án Trường Mầm non'},
    {id:'l5', projectId:'p2', type:'Giấy phép xây dựng', number:'21/GPXD '+mark, date:'2025-08-22', issuer:'UBND xã', title:'Giấy phép xây dựng khối phòng học'},
    {id:'l6', projectId:'p1', packageId:'k1', type:'Kế hoạch lựa chọn nhà thầu', number:'61/QĐ-UBND '+mark, date:'2025-03-30', issuer:'UBND xã', title:'Phê duyệt KHLCNT gói XL01'},
    {id:'l7', projectId:'p1', packageId:'k1', type:'Kết quả lựa chọn nhà thầu', number:'98/QĐ-UBND '+mark, date:'2025-05-05', issuer:'UBND xã', title:'Phê duyệt kết quả LCNT gói XL01'},
    {id:'l8', projectId:'p2', packageId:'k4', type:'Bảo lãnh thực hiện hợp đồng', number:'BL-2025-0915 '+mark, date:'2025-09-06', issuer:'Ngân hàng thương mại', title:'Bảo lãnh thực hiện HĐ gói XL02, hiệu lực đến 31/01/2027'},
    {id:'l9', projectId:'p2', packageId:'k5', type:'Hồ sơ mời thầu', number:'HSMT-TB01 '+mark, date:'2026-09-10', issuer:'Ban QLDA xã', title:'Hồ sơ mời thầu gói thiết bị, đồ dùng mầm non'},
    {id:'l10', projectId:'p5', type:'Quyết định phê duyệt dự án', number:'142/QĐ-UBND '+mark, date:'2026-06-18', issuer:'UBND xã', title:'Phê duyệt dự toán mua sắm trang thiết bị Bộ phận một cửa'},
    {id:'l11', projectId:'p5', packageId:'k8', type:'Kết quả lựa chọn nhà thầu', number:'171/QĐ-UBND '+mark, date:'2026-08-05', issuer:'UBND xã', title:'Phê duyệt kết quả chào hàng cạnh tranh gói TB02'},
    {id:'l12', projectId:'p6', type:'Kế hoạch, văn bản giao nhiệm vụ', number:'35/KH-UBND '+mark, date:'2026-02-10', issuer:'UBND xã', title:'Kế hoạch chuyển đổi số năm 2026, giao nhiệm vụ số hóa hồ sơ lưu trữ'},
    {id:'l13', projectId:'p6', type:'Kế hoạch, văn bản giao nhiệm vụ', number:'1250/UBND-VP '+mark, date:'2026-04-02', issuer:'UBND Thành phố', title:'Hướng dẫn số hóa, báo cáo kết quả hằng quý'}
  ];
  D.items = [
    {id:'i1', projectId:'p1', code:'HM01', name:'Nền, móng đường', structure:'Cấp phối đá dăm', area:29400, x:-80, z:-40, w:150, d:110, h:0.6, floors:0},
    {id:'i2', projectId:'p1', code:'HM02', name:'Mặt đường bê tông nhựa', structure:'BTN chặt 12,5', area:25200, x:0, z:30, w:230, d:12, h:0.4, floors:0},
    {id:'i3', projectId:'p1', code:'HM03', name:'Cống thoát nước dọc', structure:'Cống BTCT D600', area:4200, x:-60, z:80, w:110, d:70, h:1.2, floors:0},
    {id:'i4', projectId:'p1', code:'HM04', name:'Cầu bản qua kênh ấp Tân Lợi', structure:'BTCT', area:180, x:60, z:80, w:60, d:40, h:9, floors:1},
    {id:'i5', projectId:'p1', code:'HM05', name:'Chiếu sáng, an toàn giao thông', structure:'Cột thép, đèn LED', area:4200, x:100, z:-30, w:24, d:18, h:7, floors:1},
    {id:'i6', projectId:'p2', code:'HM01', name:'Khối phòng học 2 tầng', structure:'Khung BTCT', area:1850, x:-30, z:0, w:48, d:26, h:9, floors:2},
    {id:'i7', projectId:'p2', code:'HM02', name:'Khối hiệu bộ, nhà bếp', structure:'Khung BTCT', area:620, x:35, z:5, w:44, d:30, h:5, floors:1},
    {id:'i8', projectId:'p2', code:'HM03', name:'Sân chơi, cây xanh', structure:'Bê tông, cỏ nhân tạo', area:1400, x:30, z:-40, w:30, d:30, h:0.3, floors:0},
    {id:'i9', projectId:'p2', code:'HM04', name:'Cổng, hàng rào, nhà bảo vệ', structure:'Bê tông, gạch', area:380, x:-20, z:-42, w:70, d:22, h:2.5, floors:0}
  ];
  D.models = [
    {id:'m1', fileKey:'f1', projectId:'p1', itemId:'', name:'DA01_MatBangTuyen.dwg', format:'DWG', version:3, date:'2026-08-14', by:'Tư vấn thiết kế', size:18200000, note:'Bình đồ tuyến sau điều chỉnh cống'},
    {id:'m2', fileKey:'f1', projectId:'p1', itemId:'', name:'DA01_MatBangTuyen.dwg', format:'DWG', version:2, date:'2026-02-03', by:'Tư vấn thiết kế', size:17900000, note:'Phiên bản trình duyệt'},
    {id:'m3', fileKey:'f2', projectId:'p1', itemId:'i4', name:'DA01_CauBan_KetCau.pdf', format:'PDF', version:1, date:'2026-01-10', by:'Tư vấn thiết kế', size:9500000, note:''},
    {id:'m4', fileKey:'f3', projectId:'p2', itemId:'i6', name:'DA02_KhoiPhongHoc_KienTruc.dwg', format:'DWG', version:4, date:'2026-09-02', by:'Nhà thầu XL02', size:23400000, note:'Cập nhật bản vẽ hoàn thiện tầng 2'},
    {id:'m5', fileKey:'f4', projectId:'p2', itemId:'i7', name:'DA02_HieuBo_DienNuoc.dwg', format:'DWG', version:2, date:'2026-07-21', by:'Tư vấn thiết kế', size:6800000, note:''}
  ];
  D.packages = [
    {id:'k1', projectId:'p1', code:'XL01', name:'Thi công nền, mặt đường và cống thoát nước', type:'Xây lắp', method:'Đấu thầu rộng rãi', estimate:17.6*T, status:'Đang thực hiện hợp đồng'},
    {id:'k2', projectId:'p1', code:'XL03', name:'Thi công cầu bản và chiếu sáng', type:'Xây lắp', method:'Chào hàng cạnh tranh', estimate:4.9*T, status:'Đang thực hiện hợp đồng'},
    {id:'k3', projectId:'p1', code:'TV01', name:'Tư vấn giám sát thi công xây dựng', type:'Tư vấn', method:'Chỉ định thầu rút gọn', estimate:0.62*T, status:'Đang thực hiện hợp đồng'},
    {id:'k4', projectId:'p2', code:'XL02', name:'Thi công khối phòng học, hiệu bộ và hạ tầng', type:'Xây lắp', method:'Đấu thầu rộng rãi', estimate:18.4*T, status:'Đang thực hiện hợp đồng'},
    {id:'k5', projectId:'p2', code:'TB01', name:'Cung cấp thiết bị, đồ dùng mầm non', type:'Mua sắm hàng hóa', method:'Chào hàng cạnh tranh', estimate:2.6*T, status:'Đang lựa chọn nhà thầu'},
    {id:'k6', projectId:'p2', code:'TV02', name:'Tư vấn lập thiết kế bản vẽ thi công và dự toán', type:'Tư vấn', method:'Chỉ định thầu rút gọn', estimate:0.55*T, status:'Đã thanh lý hợp đồng'},
    {id:'k7', projectId:'p3', code:'TV03', name:'Tư vấn lập báo cáo kinh tế - kỹ thuật', type:'Tư vấn', method:'Chỉ định thầu rút gọn', estimate:0.28*T, status:'Đang thực hiện hợp đồng'},
    {id:'k8', projectId:'p5', code:'TB02', name:'Cung cấp, lắp đặt thiết bị Bộ phận một cửa', type:'Mua sắm hàng hóa', method:'Chào hàng cạnh tranh', estimate:0.98*T, status:'Đang thực hiện hợp đồng'},
    {id:'k9', projectId:'p6', code:'PTV01', name:'Dịch vụ số hóa hồ sơ, tài liệu lưu trữ', type:'Phi tư vấn', method:'Chỉ định thầu rút gọn', estimate:0.84*T, status:'Đang thực hiện hợp đồng'}
  ];
  D.contracts = [
    {id:'c1', packageId:'k1', projectId:'p1', number:'15/2025/HĐ-XL01', contractor:'Công ty Xây dựng số 1 '+mark, signDate:'2025-05-10', value:16.9*T, start:'2025-05-20', end:'2026-12-31', ctype:'Đơn giá cố định', guarantee:'5%', advanceRate:15},
    {id:'c2', packageId:'k2', projectId:'p1', number:'22/2025/HĐ-XL03', contractor:'Công ty Xây dựng số 2 '+mark, signDate:'2025-07-01', value:4.62*T, start:'2025-07-15', end:'2027-03-31', ctype:'Trọn gói', guarantee:'5%', advanceRate:15},
    {id:'c3', packageId:'k3', projectId:'p1', number:'09/2025/HĐ-TV01', contractor:'Công ty Tư vấn giám sát '+mark, signDate:'2025-05-12', value:0.59*T, start:'2025-05-15', end:'2027-03-31', ctype:'Theo thời gian', guarantee:'', advanceRate:10},
    {id:'c4', packageId:'k4', projectId:'p2', number:'31/2025/HĐ-XL02', contractor:'Công ty Xây dựng số 3 '+mark, signDate:'2025-09-05', value:17.6*T, start:'2025-09-20', end:'2027-01-31', ctype:'Đơn giá điều chỉnh', guarantee:'5%', advanceRate:15},
    {id:'c5', packageId:'k6', projectId:'p2', number:'04/2025/HĐ-TV02', contractor:'Công ty Tư vấn thiết kế '+mark, signDate:'2025-03-01', value:0.52*T, start:'2025-03-05', end:'2025-08-30', ctype:'Trọn gói', guarantee:'', advanceRate:10},
    {id:'c6', packageId:'k7', projectId:'p3', number:'12/2026/HĐ-TV03', contractor:'Công ty Tư vấn đầu tư '+mark, signDate:'2026-08-15', value:0.26*T, start:'2026-08-20', end:'2026-12-15', ctype:'Trọn gói', guarantee:'', advanceRate:0},
    {id:'c7', packageId:'k8', projectId:'p5', number:'18/2026/HĐ-TB02', contractor:'Công ty Thiết bị văn phòng '+mark, signDate:'2026-08-12', value:0.935*T, start:'2026-08-15', end:'2026-11-30', ctype:'Trọn gói', guarantee:'3%', advanceRate:30},
    {id:'c8', packageId:'k9', projectId:'p6', number:'07/2026/HĐ-PTV01', contractor:'Công ty Dịch vụ số hóa '+mark, signDate:'2026-05-15', value:0.84*T, start:'2026-05-20', end:'2026-12-15', ctype:'Đơn giá cố định', guarantee:'', advanceRate:20}
  ];
  D.addenda = [
    {id:'a1', contractId:'c1', number:'PL01', date:'2026-03-12', content:'Bổ sung khối lượng cống thoát nước đoạn qua khu dân cư', valueChange:0.32*T, daysChange:0, status:'Đã duyệt'},
    {id:'a2', contractId:'c4', number:'PL01', date:'2026-07-20', content:'Gia hạn thời gian thực hiện do điều chỉnh thiết kế móng', valueChange:0, daysChange:45, status:'Đã duyệt'},
    {id:'a3', contractId:'c4', number:'PL02', date:'2026-09-28', content:'Điều chỉnh đơn giá thép theo chỉ số giá quý II/2026', valueChange:0.18*T, daysChange:0, status:'Đã duyệt'},
    {id:'a4', contractId:'c2', number:'PL01', date:'2026-10-25', content:'Bổ sung hệ thống chiếu sáng nhánh rẽ vào khu dân cư, gia hạn thời gian', valueChange:0.25*T, daysChange:30, status:'Chờ duyệt'}
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
    ['s1','p1','k1','i1','Nền, móng đường đoạn Km0–Km2','2025-06-01','2025-12-31',100,18],
    ['s2','p1','k1','i2','Mặt đường bê tông nhựa','2025-10-01','2026-09-30',82,25],
    ['s3','p1','k1','i3','Cống thoát nước dọc','2026-01-15','2026-11-30',64,40],
    ['s4','p1','k2','i5','Chiếu sáng, biển báo','2026-06-01','2026-12-31',20,17],
    ['s5','p1','k1','i1','Nền, móng đường đoạn Km2–Km4,2','2025-08-01','2026-06-30',100,30],
    ['s6','p1','k2','i4','Cầu bản qua kênh ấp Tân Lợi','2026-01-01','2026-12-31',55,20],
    ['s7','p1','k2','','Đường dẫn hai đầu cầu','2026-04-01','2027-03-31',25,35],
    ['s8','p1','k1','','Vạch sơn, hoàn thiện lề','2026-10-01','2027-03-31',0,15],
    ['s9','p2','k4','i6','Móng khối phòng học','2025-10-01','2026-05-31',100,20],
    ['s10','p2','k4','i6','Kết cấu thân khối phòng học','2026-04-01','2026-12-31',58,25],
    ['s11','p2','k4','i7','Khối hiệu bộ, nhà bếp','2026-03-01','2026-11-30',61,18],
    ['s12','p2','k4','i8','Sân chơi, cây xanh','2026-08-01','2027-01-31',15,10],
    ['s13','p2','k4','i9','Hoàn thiện, điện nước, cổng rào','2026-11-01','2027-01-31',0,27],
    ['s14','p2','k6','','Thiết kế BVTC và dự toán','2025-03-05','2025-08-30',100,8],
    ['s15','p3','k7','','Khảo sát, lập BCKTKT','2026-08-20','2026-12-15',45,10],
    ['s16','p2','k5','','Lựa chọn nhà thầu thiết bị','2026-09-01','2026-12-15',30,10],
    ['s17','p5','k8','','Giao hàng, lắp đặt thiết bị đợt 1','2026-08-20','2026-10-31',85,50],
    ['s18','p5','k8','','Giao hàng, lắp đặt thiết bị đợt 2, đào tạo sử dụng','2026-10-15','2026-11-30',20,50],
    ['s19','p6','k9','','Số hóa hồ sơ hộ tịch (lô 1, lô 2)','2026-05-20','2026-08-31',100,40],
    ['s20','p6','k9','','Số hóa hồ sơ đất đai (lô 3)','2026-08-15','2026-11-15',60,40],
    ['s21','p6','k9','','Kiểm tra, nghiệm thu dữ liệu, bàn giao','2026-11-01','2026-12-15',0,20]
  ];
  D.schedule = sc.map(([id,projectId,packageId,itemId,name,planStart,planEnd,progress,weight])=>({id,projectId,packageId,itemId,name,planStart,planEnd,progress,weight,history:hist(planStart,planEnd,progress)}));
  // Khối lượng hợp đồng (đơn giá, khối lượng) và tỷ lệ đã thực hiện / nghiệm thu
  const bq = [
    ['c1','AB.11','Đào nền đường đất cấp II','m3',18500,62000,1,1],
    ['c1','AD.11','Móng cấp phối đá dăm loại 1','m3',8800,520000,1,.98],
    ['c1','AD.23','Mặt đường bê tông nhựa chặt 12,5','m2',25200,280000,.84,.72],
    ['c1','AF.82','Cống BTCT D600','m',4200,1650000,.66,.55],
    ['c1','AB.65','Đắp lề đất K95','m3',6200,95000,.58,.45],
    ['c2','AF.12','Bê tông kết cấu cầu bản','m3',260,4100000,.7,.6],
    ['c2','AF.61','Cốt thép cầu','tấn',38,21000000,.6,.5],
    ['c2','BA.14','Cột đèn thép 8m, đèn LED','cột',140,14500000,.18,0],
    ['c2','AL.17','Biển báo, vạch sơn','HT',1,180000000,0,0],
    ['c3','TV','Chi phí tư vấn giám sát','gói',1,590000000,.52,.45],
    ['c4','AC.25','Cọc BTCT 250x250','m',3200,420000,1,1],
    ['c4','AF.11','Bê tông móng','m3',620,3600000,1,1],
    ['c4','AF.12','Bê tông thân nhà','m3',980,4200000,.6,.48],
    ['c4','AF.61','Cốt thép các loại','tấn',165,21000000,.68,.6],
    ['c4','AE.22','Xây, tô, hoàn thiện','m2',5200,1150000,.05,0],
    ['c4','BA.99','Hệ thống điện, nước, PCCC','HT',1,1850000000,0,0],
    ['c5','TV','Chi phí tư vấn thiết kế','gói',1,520000000,1,1],
    ['c6','TV','Chi phí lập BCKTKT','gói',1,260000000,.45,0],
    ['c7','TB.01','Máy tính để bàn cấu hình văn phòng','bộ',12,16500000,.85,.75],
    ['c7','TB.02','Máy quét tài liệu tốc độ cao','cái',4,38000000,.75,.5],
    ['c7','TB.03','Ki-ốt lấy số, màn hình tra cứu thủ tục','bộ',2,165000000,.5,0],
    ['c7','TB.04','Màn hình hiển thị, loa gọi số','bộ',3,85000000,.6,.3],
    ['c8','SH.01','Số hóa hồ sơ hộ tịch','trang',62000,5200,1,1],
    ['c8','SH.02','Số hóa hồ sơ đất đai','trang',85000,5300,.6,.3],
    ['c8','SH.03','Nhập dữ liệu đặc tả, kiểm tra chất lượng','hồ sơ',9500,7100,.55,.3]
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
  const pp=[['c1','Tạm ứng','2025-06-10',2.54],['c1','Đợt 1','2025-12-31',4],['c1','Đợt 2','2026-06-30',4.5],['c1','Đợt 3','2026-10-15',3.2],['c1','Quyết toán','2027-03-31',2.98],
    ['c2','Tạm ứng','2025-08-05',.69],['c2','Đợt 1','2026-03-31',1.2],['c2','Đợt 2','2026-09-30',1.3],['c2','Đợt 3','2027-03-31',1.43],
    ['c4','Tạm ứng','2025-10-10',2.64],['c4','Đợt 1','2026-03-31',4.2],['c4','Đợt 2','2026-08-31',5],['c4','Đợt 3','2026-12-31',5.94],
    ['c3','Tạm ứng','2025-06-01',.059],['c3','Đợt 1','2026-06-30',.16],['c5','Thanh toán 100%','2025-09-30',.52],['c6','Tạm ứng','2026-11-30',.08],
    ['c7','Tạm ứng','2026-08-20',.28],['c7','Thanh toán đợt 1','2026-11-10',.4],['c7','Thanh toán đợt 2','2026-12-20',.255],
    ['c8','Tạm ứng','2026-05-25',.168],['c8','Đợt 1','2026-09-15',.3],['c8','Quyết toán','2026-12-31',.372],
    ['c3','Đợt 2','2026-08-31',.15]];
  D.payplans = pp.map(([contractId,phase,planDate,amt],i)=>({id:'q'+(i+1), contractId, phase, planDate, amount:Math.round(amt*T)}));
  const pm=[['c1','TU-01','2025-06-12','Tạm ứng',2.54,'Đã thanh toán'],['c1','TT-01','2026-01-08','Thanh toán khối lượng',3.7,'Đã thanh toán'],['c1','TT-02','2026-07-06','Thanh toán khối lượng',4.1,'Đã thanh toán'],['c1','TT-03','2026-10-20','Thanh toán khối lượng',1.9,'Đang trình KBNN'],
    ['c2','TU-01','2025-08-06','Tạm ứng',.69,'Đã thanh toán'],['c2','TT-01','2026-04-10','Thanh toán khối lượng',1.05,'Đã thanh toán'],['c2','TT-02','2026-10-10','Thanh toán khối lượng',.62,'Đề nghị'],
    ['c4','TU-01','2025-10-12','Tạm ứng',2.64,'Đã thanh toán'],['c4','TT-01','2026-04-15','Thanh toán khối lượng',3.6,'Đã thanh toán'],['c4','TT-02','2026-09-08','Thanh toán khối lượng',3.9,'Đã thanh toán'],
    ['c3','TU-01','2025-06-02','Tạm ứng',.059,'Đã thanh toán'],['c3','TT-01','2026-07-02','Thanh toán khối lượng',.16,'Đã thanh toán'],['c5','TT-01','2025-10-05','Thanh toán khối lượng',.52,'Đã thanh toán'],
    ['c7','TU-01','2026-08-21','Tạm ứng',.28,'Đã thanh toán'],['c7','TT-01','2026-10-28','Thanh toán khối lượng',.35,'Đề nghị'],
    ['c8','TU-01','2026-05-26','Tạm ứng',.168,'Đã thanh toán'],['c8','TT-01','2026-09-18','Thanh toán khối lượng',.3,'Đã thanh toán']];
  // Hồ sơ thanh toán gắn với đợt kế hoạch (theo thứ tự hồ sơ ở trên)
  const pq=['q1','q2','q3','q4','q6','q7','q8','q10','q11','q12','q14','q15','q16','q18','q19','q21','q22'];
  D.payments = pm.map(([contractId,number,date,kind,amt,status],i)=>({id:'r'+(i+1), contractId, number, date, kind, amount:Math.round(amt*T), status, content:kind+' '+number, payPlanId:pq[i]||''}));
  D.diaries = [
    {id:'d1', projectId:'p1', packageId:'k1', date:'2026-10-26', shift:'Cả ngày', weather:'Nắng', workers:28, machines:'1 máy rải nhựa, 2 lu rung, 3 ô tô tự đổ', works:'Thảm bê tông nhựa đoạn Km1+200–Km1+480 | 1650 | m2\nLắp đặt cống D600 đoạn Km2+100 | 24 | m\nĐổ bê tông hố ga HG-17, HG-18 | 3.2 | m3', issues:'Thiếu 01 xe vận chuyển bê tông nhựa buổi sáng, đã điều bổ sung lúc 10h.', supervisor:'TVGS TV01', photos:[]},
    {id:'d2', projectId:'p1', packageId:'k1', date:'2026-10-25', shift:'Cả ngày', weather:'Mưa chiều', workers:22, machines:'1 máy đào, 1 cần cẩu 10T', works:'Lắp đặt cống D600 đoạn Km2+040–Km2+100 | 60 | m\nĐào hố móng hố ga HG-19 | 18 | m3', issues:'Mưa từ 15h, dừng thi công lắp cống 1,5 giờ.', supervisor:'TVGS TV01', photos:[]},
    {id:'d3', projectId:'p1', packageId:'k2', date:'2026-10-26', shift:'Ca sáng', weather:'Nắng', workers:16, machines:'1 cần cẩu 16T, 1 máy hàn', works:'Lắp dựng cốt thép bản mặt cầu | 6.5 | tấn\nĐổ bê tông mố cầu M2 | 32 | m3', issues:'', supervisor:'TVGS TV01', photos:[]},
    {id:'d4', projectId:'p2', packageId:'k4', date:'2026-10-26', shift:'Cả ngày', weather:'Nắng', workers:35, machines:'1 vận thăng, 1 xe bơm bê tông', works:'Đổ bê tông sàn tầng 2 khối phòng học | 96 | m3\nGia công lắp dựng cốt thép cột tầng 2 | 4.5 | tấn\nCốp pha sàn khối hiệu bộ | 220 | m2', issues:'Khối hiệu bộ chậm khoảng 2 tuần so với kế hoạch do điều chỉnh móng.', supervisor:'Ban QLDA', photos:[]},
    {id:'d5', projectId:'p2', packageId:'k4', date:'2026-10-24', shift:'Cả ngày', weather:'Âm u', workers:31, machines:'1 vận thăng', works:'Lắp dựng cốp pha sàn tầng 2 | 480 | m2\nNghiệm thu cốt thép sàn tầng 2 | 1 | lần', issues:'', supervisor:'Ban QLDA', photos:[]}
  ];
  // Kế hoạch vốn đầu tư công: trung hạn 2026–2030, vốn năm 2026 (kèm kịch bản giải ngân lũy kế theo quý)
  const cap=[['p1','Kế hoạch trung hạn 2026–2030',2026,'Ngân sách Thành phố hỗ trợ có mục tiêu',18,'45/NQ-HĐND','2025-12-15',null],
    ['p1','Kế hoạch vốn năm',2026,'Ngân sách Thành phố hỗ trợ có mục tiêu',10,'312/QĐ-UBND','2026-01-05',[20,45,70]],
    ['p1','Bổ sung kế hoạch năm',2026,'Ngân sách Thành phố hỗ trợ có mục tiêu',1.5,'1580/QĐ-UBND','2026-07-20',null],
    ['p2','Kế hoạch trung hạn 2026–2030',2026,'Ngân sách Thành phố hỗ trợ có mục tiêu',20,'45/NQ-HĐND','2025-12-15',null],
    ['p2','Kế hoạch vốn năm',2026,'Ngân sách Thành phố hỗ trợ có mục tiêu',13,'312/QĐ-UBND','2026-01-05',[20,45,70]],
    ['p3','Kế hoạch trung hạn 2026–2030',2026,'Ngân sách xã/phường',9.6,'45/NQ-HĐND','2025-12-15',null],
    ['p3','Kế hoạch vốn năm',2026,'Ngân sách xã/phường',.3,'315/QĐ-UBND','2026-01-05',[0,0,20]],
    ['p5','Kế hoạch vốn năm',2026,'Ngân sách xã/phường',.7,'142/QĐ-UBND','2026-06-10',[0,0,25]],
    ['p6','Kế hoạch vốn năm',2026,'Ngân sách xã/phường',.86,'35/KH-UBND','2026-04-20',[0,20,50]]];
  D.capitals = cap.map(([projectId,kind,year,source,amt,no,date,tg],i)=>({id:'vk'+(i+1), projectId, kind, year, source, amount:Math.round(amt*T), number:no+' '+mark, date,
    ...(tg?{targetQ1:tg[0],targetQ2:tg[1],targetQ3:tg[2]}:{}), note:''}));
  // Nghiệm thu theo giai đoạn, nghiệm thu hoàn thành, bàn giao và bảo hành (NĐ 207/2026)
  D.acceptances = [
    {id:'nt1', projectId:'p1', packageId:'k1', kind:'Nghiệm thu giai đoạn thi công', date:'2026-06-30', number:'BB-NT-GĐ01 '+mark, content:'Hoàn thành giai đoạn nền, móng đường đoạn Km2–Km4,2', result:'Đạt', receiver:'', note:''},
    {id:'nt2', projectId:'p2', packageId:'k4', kind:'Nghiệm thu giai đoạn thi công', date:'2026-05-31', number:'BB-NT-GĐ01 '+mark, content:'Hoàn thành phần móng khối phòng học', result:'Đạt, có tồn tại phải khắc phục', receiver:'', note:'Bổ sung hồ sơ thí nghiệm cọc trước khi thi công thân.'},
    {id:'nt3', projectId:'p6', packageId:'k9', kind:'Nghiệm thu hoàn thành hạng mục', date:'2026-08-31', number:'BB-NT-01 '+mark, content:'Số hóa hồ sơ hộ tịch lô 1, lô 2', result:'Đạt', receiver:'Văn phòng HĐND - UBND xã', note:''},
    {id:'nt4', projectId:'p5', packageId:'k8', kind:'Nghiệm thu hoàn thành hạng mục', date:'2026-10-31', number:'BB-NT-TB01 '+mark, content:'Giao hàng, lắp đặt thiết bị đợt 1', result:'Đạt', receiver:'Bộ phận Tiếp nhận và trả kết quả xã', warrantyMonths:24, note:''},
    {id:'nt5', projectId:'p4', packageId:'', kind:'Nghiệm thu hoàn thành công trình', date:'2025-04-25', number:'BB-NTHT '+mark, content:'Hoàn thành sửa chữa Nhà văn hóa – Trung tâm học tập cộng đồng', result:'Đạt', receiver:'', note:''},
    {id:'nt6', projectId:'p4', packageId:'', kind:'Bàn giao đưa vào sử dụng', date:'2025-05-20', number:'BB-BG '+mark, content:'Bàn giao công trình đưa vào sử dụng', result:'Đạt', receiver:'Trung tâm Văn hóa - Thể thao xã Mẫu', warrantyMonths:18, warrantyGuaranteeUntil:'2026-11-20', note:'Bảo lãnh bảo hành 5% giá trị hợp đồng.'}
  ];
  // Quyết toán dự án hoàn thành: đã phê duyệt nhưng chưa tất toán tài khoản (để minh họa cảnh báo)
  D.settlements = [
    {id:'qt1', projectId:'p4', completedDate:'2025-05-20', deadline:'2025-09-20', submittedDate:'2025-09-12', proposedValue:Math.round(3.12*T), auditedValue:Math.round(3.05*T), approvedValue:Math.round(3.05*T), number:'88/QĐ-UBND '+mark, approvalDate:'2025-11-14', closedDate:'', status:'Đã phê duyệt, chưa tất toán', note:'Chờ thu hồi số dư tạm ứng và đóng tài khoản tại Kho bạc.'}
  ];
  // Giải phóng mặt bằng theo đoạn tuyến
  D.clearances = [
    {id:'gp1', projectId:'p1', name:'Đoạn Km0+000–Km2+000 (ấp Tân Hòa)', households:46, householdsPaid:46, area:9200, handedArea:9200, budget:Math.round(3.1*T), amountPaid:Math.round(3.1*T), number:'56/QĐ-UBND '+mark, planDate:'2025-04-10', handoverDue:'2025-07-31', handoverDate:'2025-07-25', issues:''},
    {id:'gp2', projectId:'p1', name:'Đoạn Km2+000–Km3+000 (ấp Tân Lợi)', households:31, householdsPaid:24, area:6100, handedArea:4300, budget:Math.round(2.4*T), amountPaid:Math.round(1.85*T), number:'57/QĐ-UBND '+mark, planDate:'2025-04-10', handoverDue:'2026-10-15', handoverDate:'', issues:'7 hộ chưa thống nhất đơn giá bồi thường cây trồng, vật kiến trúc; UBND xã đang vận động, đối thoại.'},
    {id:'gp3', projectId:'p1', name:'Đoạn Km3+000–Km4+200', households:18, householdsPaid:18, area:5000, handedArea:5000, budget:Math.round(1.2*T), amountPaid:Math.round(1.2*T), number:'58/QĐ-UBND '+mark, planDate:'2025-09-05', handoverDue:'2026-01-31', handoverDate:'2026-01-20', issues:''},
    {id:'gp4', projectId:'p3', name:'Tuyến kè ấp Tân Thạnh', households:12, householdsPaid:0, area:3600, handedArea:0, budget:Math.round(.65*T), amountPaid:0, number:'', planDate:'', handoverDue:'2027-03-31', handoverDate:'', issues:'Đang kiểm đếm, lập phương án bồi thường.'}
  ];
  return D;
}
function defaultCatalogs(){
  const C = {
    'Trạng thái dự án':['Chuẩn bị đầu tư','Đang lựa chọn nhà thầu','Đang thi công','Đang thực hiện','Tạm dừng','Hoàn thành','Đã bàn giao đưa vào sử dụng','Đang quyết toán','Đã quyết toán'],
    'Nhóm dự án':['Quan trọng quốc gia','Nhóm A','Nhóm B','Nhóm C'],
    'Giai đoạn':['Chuẩn bị dự án','Thực hiện dự án','Kết thúc dự án'],
    'Nguồn vốn':['Ngân sách xã/phường','Ngân sách thành phố đầu tư trên địa bàn','Ngân sách Thành phố hỗ trợ có mục tiêu','Ngân sách Trung ương','Vốn huy động, đóng góp của Nhân dân','Vốn khác'],
    'Vai trò của Ban':['Chủ đầu tư','Quản lý dự án được giao','Tư vấn quản lý dự án'],
    'Hình thức quản lý dự án':['Ban QLDA đầu tư xây dựng','Chủ đầu tư thuê tư vấn quản lý dự án','Chủ đầu tư thành lập ban trực thuộc','Chủ đầu tư tự quản lý'],
    'Loại dự án':['Xây dựng mới','Sửa chữa, cải tạo, nâng cấp','Mua sắm','Nhiệm vụ khác'],
    'Hồ sơ dự án':['Báo cáo nghiên cứu khả thi','Báo cáo kinh tế - kỹ thuật','Không yêu cầu (mua sắm, nhiệm vụ)'],
    'Loại kế hoạch vốn':['Kế hoạch trung hạn 2026–2030','Kế hoạch vốn năm','Bổ sung kế hoạch năm','Điều chỉnh giảm kế hoạch năm'],
    'Loại nghiệm thu, bàn giao':['Nghiệm thu giai đoạn thi công','Nghiệm thu hoàn thành hạng mục','Nghiệm thu hoàn thành công trình','Kiểm tra công tác nghiệm thu (cơ quan chuyên môn)','Bàn giao đưa vào sử dụng'],
    'Kết quả nghiệm thu':['Đạt','Đạt, có tồn tại phải khắc phục','Không đạt'],
    'Trạng thái quyết toán':['Đang lập hồ sơ','Đã trình thẩm tra','Đã phê duyệt','Đã tất toán tài khoản'],
    'Loại hồ sơ pháp lý':['Quyết định chủ trương đầu tư','Quyết định phê duyệt dự án','Quyết định điều chỉnh dự án','Thiết kế, dự toán','Giấy phép xây dựng','Kế hoạch lựa chọn nhà thầu','Hồ sơ mời thầu','Kết quả lựa chọn nhà thầu','Bảo lãnh thực hiện hợp đồng','Bảo lãnh tạm ứng','Biên bản nghiệm thu','Kế hoạch, văn bản giao nhiệm vụ','Quyết định giao chủ đầu tư, giao quản lý dự án','Quyết định giao kế hoạch vốn','Báo cáo nghiên cứu khả thi / kinh tế - kỹ thuật','Kết quả thẩm định','Phương án bồi thường, giải phóng mặt bằng','Biên bản nghiệm thu giai đoạn','Biên bản nghiệm thu hoàn thành, bàn giao','Báo cáo quyết toán','Quyết định phê duyệt quyết toán','Văn bản khác'],
    'Loại gói thầu':['Xây lắp','Tư vấn','Mua sắm hàng hóa','Phi tư vấn','Hỗn hợp'],
    'Hình thức lựa chọn nhà thầu':['Đấu thầu rộng rãi','Đấu thầu hạn chế','Chỉ định thầu','Chỉ định thầu rút gọn','Chào hàng cạnh tranh','Mua sắm trực tuyến','Đàm phán giá','Lựa chọn nhà thầu trong trường hợp đặc biệt','Tham gia thực hiện của cộng đồng','Tự thực hiện'],
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
    {id:'g-tech', name:'Cán bộ kỹ thuật', admin:false, perms:P(['du-an','mo-hinh','goi-thau','tien-do','nhat-ky','khoi-luong','gpmb','nghiem-thu'],'*'), scope:[], desc:'Quản lý kỹ thuật, tiến độ, nhật ký, khối lượng, nghiệm thu, giải phóng mặt bằng.'},
    {id:'g-acc', name:'Kế toán', admin:false, perms:P(['thanh-toan','von','quyet-toan'],['tong-quan','du-an','goi-thau','khoi-luong','nghiem-thu','bao-cao']), scope:[], desc:'Kế hoạch vốn, giải ngân, thanh toán, quyết toán.'},
    {id:'g-site', name:'Tư vấn giám sát / Nhà thầu', admin:false, perms:P(['nhat-ky','tien-do'],['tong-quan','du-an','mo-hinh','khoi-luong','nghiem-thu']), scope:['p1'], desc:'Cập nhật nhật ký, tiến độ hiện trường trong phạm vi dự án được giao.'},
    {id:'g-ubnd', name:'Lãnh đạo UBND xã (người quyết định đầu tư)', admin:false, perms:P([],['tong-quan','du-an','von','gpmb','tien-do','nghiem-thu','thanh-toan','quyet-toan','bao-cao']), scope:[], desc:'Theo dõi tình hình dự án, giải ngân, quyết toán; nhận cảnh báo. Chỉ xem.'}
  ];
}
