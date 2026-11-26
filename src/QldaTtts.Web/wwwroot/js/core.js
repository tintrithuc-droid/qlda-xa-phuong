/* ===== Lõi: cấu hình phân hệ, lưu trữ, xác thực, tiện ích ===== */
const ICON = {
  download:'<path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  dash:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  proj:'<path d="M3 7h18v13H3zM8 7V4h8v3"/>',
  cube:'<path d="M12 2 3 7v10l9 5 9-5V7zM3 7l9 5 9-5M12 12v10"/>',
  doc:'<path d="M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8"/>',
  gantt:'<path d="M3 4v16h18M7 8h7M9 12h9M7 16h5"/>',
  book:'<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM4 16a4 4 0 0 1 4-4h12"/>',
  ruler:'<path d="m3 17 14-14 4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M15 9h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9M12 6v2M12 16v2"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  phone:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
  check:'<path d="M4 12l5 5L20 6"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  out:'<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  cam:'<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  wallet:'<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-4 2 4M16 13.5h2"/>',
  stamp:'<path d="M9 3h6l-1 7h4l1 4H5l1-4h4zM5 18h14M7 21h10"/>',
  seal:'<circle cx="12" cy="9" r="6"/><path d="m9 9 2 2 4-4M8.5 14 7 22l5-3 5 3-1.5-8"/>',
  map:'<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  auto:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>',
  palette:'<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15.5" cy="7.5" r="1"/>'
};
const ic = (n)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]||''}</svg>`;
/* Hoa văn mặt trống đồng Đông Sơn (vẽ cách điệu): ngôi sao 14 cánh, vành tròn chấm, vành vạch, vành chim Lạc bay ngược chiều kim đồng hồ, vành răng cưa */
const drumSVG = (()=>{ let cache=null; return ()=>{ if(cache) return cache;
  const P=Math.PI, f=n=>+n.toFixed(2), C=160, out=[];
  const ring=r=>out.push(`<circle cx="${C}" cy="${C}" r="${r}"/>`);
  const at=(r,a)=>[f(C+r*Math.cos(a)), f(C+r*Math.sin(a))];
  const star=[]; for(let k=0;k<28;k++){ const r=k%2?11:34, a=-P/2+k*P/14; star.push(at(r,a).join(',')); }
  out.push(`<polygon points="${star.join(' ')}" fill="currentColor" stroke="none"/>`);
  for(let k=0;k<14;k++){ const a=-P/2+(k+.5)*P/7; const [x1,y1]=at(20,a-.12),[x2,y2]=at(31,a),[x3,y3]=at(20,a+.12); out.push(`<path d="M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}"/>`); }
  [40,44].forEach(ring);
  for(let k=0;k<36;k++){ const [x,y]=at(50,k*P/18); out.push(`<circle cx="${x}" cy="${y}" r="4.2"/><circle cx="${x}" cy="${y}" r="1.1" fill="currentColor"/>`); }
  [56,59].forEach(ring);
  for(let k=0;k<96;k++){ const a=k*P/48, [x1,y1]=at(60,a), [x2,y2]=at(67,a); out.push(`<path d="M${x1} ${y1}L${x2} ${y2}"/>`); }
  [68,71].forEach(ring);
  const bird='M-17 0C-10-3.2 3-3.4 9-.6L24-1.4 9.4 1.4C3 3.4-10 3.2-17 0ZM-3-1.6-9-13-1-2.6M3-1-1-11 5-1.8M-17 0-25-6M-17 0-25 5M8-1 12-6';
  for(let k=0;k<10;k++){ const a=k*P/5+P/10, [x,y]=at(87,a), deg=f(a*180/P-90); out.push(`<path transform="translate(${x} ${y}) rotate(${deg})" d="${bird}"/>`); }
  [104,107].forEach(ring);
  for(let k=0;k<48;k++){ const [x,y]=at(113,k*P/24); out.push(`<circle cx="${x}" cy="${y}" r="4.2"/><circle cx="${x}" cy="${y}" r="1.1" fill="currentColor"/>`); }
  [119,122].forEach(ring);
  const zz=[]; for(let k=0;k<=96;k++){ zz.push(at(k%2?131:124,k*P/48).join(',')); } out.push(`<polyline points="${zz.join(' ')}"/>`);
  [133,137,150].forEach(ring);
  for(let k=0;k<120;k++){ const a=k*P/60, [x1,y1]=at(139,a), [x2,y2]=at(148,a); out.push(`<path d="M${x1} ${y1}L${x2} ${y2}"/>`); }
  return cache=`<svg viewBox="0 0 320 320" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${out.join('')}</svg>`; }; })();

const MODULES = [
  {key:'tong-quan', label:'Tổng quan', icon:'dash', grp:'Điều hành'},
  {key:'du-an', label:'Quản lý dự án', icon:'proj', grp:'Điều hành'},
  {key:'von', label:'Kế hoạch vốn, giải ngân', icon:'wallet', grp:'Điều hành'},
  {key:'gpmb', label:'Giải phóng mặt bằng', icon:'map', grp:'Nghiệp vụ'},
  {key:'mo-hinh', label:'Mô hình hóa công trình', icon:'cube', grp:'Nghiệp vụ'},
  {key:'goi-thau', label:'Gói thầu và hợp đồng', icon:'doc', grp:'Nghiệp vụ'},
  {key:'tien-do', label:'Quản lý tiến độ', icon:'gantt', grp:'Nghiệp vụ'},
  {key:'nhat-ky', label:'Nhật ký thi công', icon:'book', grp:'Nghiệp vụ'},
  {key:'khoi-luong', label:'Quản lý khối lượng', icon:'ruler', grp:'Nghiệp vụ'},
  {key:'nghiem-thu', label:'Nghiệm thu, bàn giao, bảo hành', icon:'stamp', grp:'Nghiệp vụ'},
  {key:'thanh-toan', label:'Quản lý thanh toán', icon:'coin', grp:'Nghiệp vụ'},
  {key:'quyet-toan', label:'Quyết toán dự án', icon:'seal', grp:'Nghiệp vụ'},
  {key:'nhan-su', label:'Nhân sự', icon:'user', grp:'Văn phòng'},
  {key:'diem-danh', label:'Bảng công, chấm công', icon:'cal', grp:'Văn phòng'},
  {key:'de-xuat', label:'Đề xuất', icon:'doc', grp:'Văn phòng'},
  {key:'lich-hop', label:'Lịch công tác, lịch họp', icon:'cal', grp:'Văn phòng'},
  {key:'thong-bao', label:'Thông báo nội bộ', icon:'bell', grp:'Văn phòng'},
  {key:'cong-viec', label:'Công việc, nhiệm vụ', icon:'gantt', grp:'Văn phòng'},
  {key:'kpi', label:'KPI, đánh giá tháng', icon:'chart', grp:'Văn phòng'},
  {key:'luong', label:'Lương, phiếu lương', icon:'coin', grp:'Văn phòng'},
  {key:'bao-cao', label:'Báo cáo, thống kê', icon:'chart', grp:'Khai thác'},
  {key:'quan-tri', label:'Quản trị hệ thống', icon:'gear', grp:'Khai thác'}
];
const EXTRA_ROUTES = ['hien-truong','doi-chieu','huong-dan','trinh-duyet','canh-bao','cb-goi-thau','cb-thanh-toan','tv-thanh-toan','danh-muc-don-vi'];
/* Menu Nghiệp vụ chia theo giai đoạn. Quyền vẫn theo phân hệ (MODULES); hai mục của giai đoạn chuẩn bị đầu tư dùng chung quyền
   với phân hệ tương ứng (ROUTE_PERM). Gói thầu thuộc một giai đoạn; hợp đồng và hồ sơ của hợp đồng theo giai đoạn của gói thầu. */
const PHASES = {cb:'Chuẩn bị đầu tư', dt:'Thực hiện đầu tư'};
const NAV_CB = [['cb-goi-thau','Gói thầu chuẩn bị','doc'],['cb-thanh-toan','Thanh toán chuẩn bị','coin']];
const ROUTE_PERM = {'ework-cu':'quan-tri', 'cb-goi-thau':'goi-thau', 'cb-thanh-toan':'thanh-toan', 'tv-thanh-toan':'thanh-toan', 'danh-muc-don-vi':'goi-thau'};
const NAV_DM = ['danh-muc-don-vi','Danh mục nhà thầu, đơn vị giám sát','user'];
/* Bản 1.8.7: hợp đồng tư vấn giai đoạn thực hiện đầu tư (quản lý dự án, lập và thẩm định HSMT, giám sát, kiểm thử…) nghiệm thu theo sản phẩm như ở chuẩn bị đầu tư */
const NAV_TV = ['tv-thanh-toan','Nghiệm thu, thanh toán tư vấn','coin'];
const PH_ROUTE = {cb:{'goi-thau':'cb-goi-thau', 'thanh-toan':'cb-thanh-toan', 'khoi-luong':'cb-thanh-toan'}, dt:{}};
const phRoute = (mod, ph) => (PH_ROUTE[ph]||{})[mod] || mod;
const routePh = r => String(r||S.route).startsWith('cb-') ? 'cb' : 'dt';
const APP_VERSION = '1.10';
/* Thông tin đơn vị và nhận diện giao diện: quản trị hệ thống cập nhật tại Quản trị hệ thống → Thông tin đơn vị, giao diện */
const BR_DEF = {appName:'Quản lý dự án, nhiệm vụ', orgShort:'Ban QLDA xã/phường …', orgName:'Ủy ban nhân dân xã/phường …', unitName:'Ban Quản lý dự án đầu tư xây dựng',
  bannerTitle:'Phần mềm quản lý dự án đầu tư xây dựng', bannerText:'Theo dõi dự án, gói thầu, hợp đồng, tiến độ, khối lượng và thanh toán trên một hệ thống thống nhất.',
  address:'Địa chỉ: …', footer:'© {năm} Ban Quản lý dự án đầu tư xây dựng xã/phường …',
  reportOrg:'Ban QLDA đầu tư xây dựng xã/phường …', ownerDefault:'UBND xã/phường …', support:'Hỗ trợ: quản trị hệ thống của đơn vị',
  loginTitle:'Đăng nhập hệ thống', loginHint:'Sử dụng tài khoản do quản trị hệ thống cấp.', forgotText:'Quên mật khẩu: liên hệ quản trị hệ thống để đặt lại.', bannerDeco:'1',
  color:'navy', printNation:'1', place:'…', signReport:'THỦ TRƯỞNG ĐƠN VỊ', signApprove:'LÃNH ĐẠO BAN QUẢN LÝ DỰ ÁN', signTech:'CÁN BỘ KỸ THUẬT', signAcc:'KẾ TOÁN',
  logo:null, loginBg:null, field:'xd', hideMods:'', style:'gov', sideBg:'peach', loginTpl:'split'};
let BR = {...BR_DEF, color:lsGet('qlda-brcolor')||'navy', style:lsGet('qlda-brstyle')||'gov', sideBg:lsGet('qlda-brside')||'peach', loginTpl:lsGet('qlda-brlogin')||'split'};
/* Lĩnh vực dự án của đơn vị (Quản trị hệ thống → Thông tin đơn vị): 'xd' đầu tư xây dựng (mặc định, các xã/phường),
   'cntt' dự án CNTT, chuyển đổi số, đổi mới sáng tạo: đổi tên chức năng, nhãn theo nghề và ẩn chức năng chỉ dùng cho xây dựng. Dữ liệu giữ nguyên. */
const isIT=()=>BR.field==='cntt';
const modHidden = k => String(BR.hideMods||'').split(',').includes(k);
const IT_HIDE=new Set(['gpmb','mo-hinh']);
const IT_MOD={'nhat-ky':'Nhật ký triển khai','khoi-luong':'Hạng mục, khối lượng công việc','nghiem-thu':'Nghiệm thu, vận hành thử, bảo hành'};
const XD=(xd,it)=>isIT()?it:xd;
MODULES.forEach(m=>m.label0=m.label);
function applyField(){ MODULES.forEach(m=>{ m.label=(isIT()&&IT_MOD[m.key])||m.label0; }); }
const modName=k=>(MODULES.find(m=>m.key===k)||{}).label||k;
/* Danh mục mặc định cho lĩnh vực CNTT: nạp khi quản trị chọn lĩnh vực CNTT (giá trị đang dùng trong dữ liệu được giữ lại) */
const IT_CATS={
  'Loại dự án':['Đầu tư ứng dụng CNTT','Thuê dịch vụ CNTT','Mua sắm thiết bị, phần mềm','Nhiệm vụ chuyển đổi số','Nhiệm vụ KH&CN, đổi mới sáng tạo','Nhiệm vụ khác'],
  'Lĩnh vực':['Chuyển đổi số','Ứng dụng CNTT','Chính quyền số','Dữ liệu, CSDL','An toàn thông tin','Đổi mới sáng tạo','Khoa học và công nghệ'],
  'Trạng thái dự án':['Chuẩn bị đầu tư','Đang lựa chọn nhà thầu','Đang triển khai','Đang thực hiện','Tạm dừng','Hoàn thành','Đã bàn giao đưa vào sử dụng','Đang quyết toán','Đã quyết toán'],
  'Hồ sơ dự án':['Báo cáo nghiên cứu khả thi','Báo cáo kinh tế - kỹ thuật','Đề cương và dự toán chi tiết','Không yêu cầu (mua sắm, nhiệm vụ)'],
  'Loại gói thầu':['Tư vấn','Phi tư vấn','Thuê dịch vụ CNTT','Mua sắm hàng hóa, thiết bị CNTT','Phần mềm','Hỗn hợp'],
  'Loại nghiệm thu, bàn giao':['Nghiệm thu giai đoạn triển khai','Vận hành thử','Nghiệm thu hoàn thành','Bàn giao đưa vào sử dụng'],
  'Đơn vị tính':['Gói','Bộ','Hệ thống','Bản quyền','Người dùng','Tháng','Năm','Ngày công','Trang','Hồ sơ','Cái']};
/* Đổi tên giá trị danh mục loại hồ sơ pháp lý khi hiển thị (lĩnh vực CNTT) và các giá trị ẩn khỏi danh sách chọn */
const IT_CAT_HIDE={'Loại hồ sơ pháp lý':['Giấy phép xây dựng','Phương án bồi thường, giải phóng mặt bằng']};
const IT_CAT_REN={'Thiết kế, dự toán':'Thiết kế chi tiết, dự toán (hoặc đề cương, dự toán chi tiết)'};
function setBrand(b){
  BR={...BR_DEF, ...(b||{})}; applyField(); document.title=BR.appName+' – '+BR.orgShort; lsSet('qlda-brcolor', BR.color); lsSet('qlda-brstyle', BR.style); lsSet('qlda-brside', BR.sideBg); lsSet('qlda-brlogin', BR.loginTpl);
  const fi=document.getElementById('favicon'); if(fi){ const h=BR.logo||'/icons/icon.svg'; if(fi.getAttribute('href')!==h){ fi.setAttribute('href',h); if(BR.logo) fi.removeAttribute('type'); else fi.type='image/svg+xml'; } }
  try{ if(UI.p) UI.apply(UI.p); }catch{}
}
/* Bản 1.10: phong cách Công nghệ dùng biểu tượng hình học (lớp chồng) thay trống đồng; CSS chọn hiện một trong hai theo data-style */
const TECH_MARK='<svg class="bm-tech" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 9 4.5-9 4.5-9-4.5z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/></svg>';
const brandMark = () => BR.logo ? `<img src="${esc(BR.logo)}" alt="Logo ${esc(BR.orgShort)}">` : `<span class="bm-gov">${drumSVG()}</span>${TECH_MARK}`;
/* Mẫu in: phần đầu (tên đơn vị, quốc hiệu, tiêu ngữ) và dòng địa danh, ngày tháng theo thiết lập của đơn vị */
const printHead = (unit) => {
  const left=`<div>${esc((BR.orgName||'').toUpperCase())}<b>${esc((unit||BR.unitName||BR.reportOrg||'').toUpperCase())}</b><span class="u"></span></div>`;
  return BR.printNation==='0' ? `<div class="hd" style="grid-template-columns:1fr">${left}</div>`
    : `<div class="hd">${left}<div><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><b>Độc lập - Tự do - Hạnh phúc</b><span class="u"></span></div></div>`; };
const printDate = (iso=TODAY) => { const d=String(iso).slice(0,10).split('-'); return `${esc(BR.place||'…')}, ngày ${d[2]} tháng ${d[1]} năm ${d[0]}`; };
const brandFoot = () => esc(BR.footer.replace(/\{năm\}/g, new Date().getFullYear()));
const COLS = ['projects','tasks','legal','items','models','packages','orgs','contracts','addenda','schedule','diaries','boq','volumes','vbatches','payplans','payments','capitals','acceptances','settlements','clearances','users','groups','catalogs','logs','attachments','guides','approvals'];
const COL_LABEL = {approvals:'Lịch sử trình duyệt',guides:'Hướng dẫn sử dụng',projects:'Dự án',tasks:'Công việc',legal:'Hồ sơ pháp lý',items:'Hạng mục công trình',models:'Tệp mô hình',packages:'Gói thầu',orgs:'Nhà thầu, đơn vị giám sát',contracts:'Hợp đồng',addenda:'Phụ lục hợp đồng',schedule:'Tiến độ',diaries:'Nhật ký thi công',boq:'Khối lượng hợp đồng',volumes:'Khối lượng thực hiện',vbatches:'Đợt nghiệm thu khối lượng',payplans:'Kế hoạch thanh toán',payments:'Hồ sơ thanh toán',capitals:'Kế hoạch vốn',acceptances:'Nghiệm thu, bàn giao',settlements:'Quyết toán dự án',clearances:'Giải phóng mặt bằng',users:'Người dùng',groups:'Nhóm người dùng',catalogs:'Danh mục',logs:'Nhật ký hệ thống',attachments:'Tệp đính kèm'};

/* --- tiện ích --- */
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
/* Bản 1.10.17: một nút "Xuất" mở danh sách tệp xuất (thay cho nhiều nút nằm ngang). items: [act, id, nhãn, khóa?] */
function exportMenu(items){ return `<details class="xmenu"><summary class="btn sm">${ic('download')} Xuất</summary><div class="xmenu-list" role="menu">${items.map(([a,id,l,dis])=>`<button type="button" class="btn ghost sm" role="menuitem" data-act="${a}" data-id="${esc(id||'')}" ${dis?'disabled':''}>${esc(l)}</button>`).join('')}</div></details>`; }
document.addEventListener('click', e=>{ document.querySelectorAll('details.xmenu[open]').forEach(d=>{ if(!d.contains(e.target) || e.target.closest('.xmenu-list button')) d.open=false; }); });
/* Bản 1.10.17: ô chọn tháng ghi "Tháng 11/2026" (ô month của trình duyệt hiện theo ngôn ngữ máy, có máy ra tiếng Anh) */
function monthSel(k, v, empty, label){ const now=new Date(), list=[];
  for(let i=-1;i<36;i++){ const d=new Date(now.getFullYear(), now.getMonth()-i, 1), val=d.getFullYear()+'-'+pad(d.getMonth()+1); list.push([val,'Tháng '+pad(d.getMonth()+1)+'/'+d.getFullYear()]); }
  if(v && !list.some(x=>x[0]===v)) list.push([v,'Tháng '+String(v).slice(5)+'/'+String(v).slice(0,4)]);
  return `<select data-f="${k}" data-nocombo class="month-sel" aria-label="${label||'Tháng'}">${opts(list, v, empty)}</select>`; }
const isoLocal = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const TODAY = isoLocal(new Date());
const fmtDate = d => d ? String(d).slice(0,10).split('-').reverse().join('/') : '—';
/* Giờ máy chủ thiếu múi giờ (không có Z/+07:00) là giờ UTC → thêm 'Z' để trình duyệt đổi đúng sang giờ Việt Nam */
const parseTs = s => (typeof s==='string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s))? new Date(s.replace(' ','T')+'Z') : new Date(s);
const fmtDT = s => { if(!s) return '—'; const d=parseTs(s); return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes()); };
const N = v => Number(v)||0;
const fmtN = (v,dg=0) => (v==null||v==='')?'—':Number(v).toLocaleString('vi-VN',{maximumFractionDigits:dg});
const fmtVND = v => (v==null||v==='')?'—':Math.round(Number(v)).toLocaleString('vi-VN');
const fmtTy = v => (N(v)/1e9).toLocaleString('vi-VN',{minimumFractionDigits:2, maximumFractionDigits:2})+' tỷ';
const fmtSize = b => !b?'—': b>1e6? (b/1e6).toLocaleString('vi-VN',{maximumFractionDigits:1})+' MB' : Math.ceil(b/1e3)+' KB';
const pct = (a,b) => b ? Math.max(0, a/b*100) : 0;
const fmtP = v => (Math.round(v*10)/10).toLocaleString('vi-VN')+'%';
const days = (a,b) => Math.round((Date.parse(b)-Date.parse(a))/864e5);
const addDays = (d,n) => isoLocal(new Date(Date.parse(d)+n*864e5));
const uid = p => p+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const by = (k,dir=1) => (a,b)=> (a[k]>b[k]?1:a[k]<b[k]?-1:0)*dir;
const sum = (arr,f) => arr.reduce((s,x)=>s+N(typeof f==='function'?f(x):x[f]),0);
const norm = s => String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d');
const has = (obj,q) => !q || norm(Object.values(obj).filter(v=>typeof v!=='object').join(' ')).includes(norm(q));
const initials = n => String(n||'?').replace(/\(.*?\)/g,'').trim().split(/\s+/).slice(-2).map(w=>w[0]).join('').toUpperCase();
function lsGet(k){ try{ return localStorage.getItem(k); }catch{ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); return true; }catch{ return false; } }
function ssGet(k){ try{ return sessionStorage.getItem(k); }catch{ return null; } }
function ssSet(k,v){ try{ v==null? sessionStorage.removeItem(k) : sessionStorage.setItem(k,v); }catch{} }

/* --- lưu trữ: máy chủ ứng dụng ASP.NET Core + CSDL (PostgreSQL / SQL Server / SQLite), giao tiếp qua API --- */
class ApiError extends Error{ constructor(status,message,data){ super(message); this.status=status; this.data=data||null; } }
async function api(method, url, body, opts={}){
  const init={method, headers:{'X-QLDA':'1'}, credentials:'same-origin'};
  if(body instanceof FormData) init.body=body;
  else if(body!==undefined){ init.headers['Content-Type']='application/json'; init.body=JSON.stringify(body); }
  let r; try{ r=await fetch(url, init); }catch(e){ throw new ApiError(0,'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.'); }
  if(r.status===401 && !opts.auth){ Store.signedOut(); throw new ApiError(401,'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); }
  const data=(r.headers.get('content-type')||'').includes('json') ? await r.json().catch(()=>null) : null;
  if(!r.ok) throw new ApiError(r.status, (data&&data.message)||('Lỗi máy chủ ('+r.status+').'), data);
  return data;
}
const Store = {
  meta:{ownerId:'', wfCheck:[], wf:null, orgId:''},
  mode:'loading', initialized:false, sampleUsers:false, setupToken:false, error:'',
  data:Object.fromEntries(COLS.map(c=>[c,[]])),
  _timer:0,
  async init(){
    try{
      const [s,b]=await Promise.all([api('GET','/api/auth/state'), api('GET','/api/branding',undefined,{auth:true}).catch(()=>null)]);
      setBrand(b);
      this.initialized=s.initialized; this.sampleUsers=s.sampleUsers; this.setupToken=!!s.setupToken; S.user=s.user||null; S.mfa=s.mfa||null;
      if(S.user && !S.user.mustChangePassword) await this.load();
      this.mode='server'; this.error='';
    }catch(e){ this.mode='offline'; this.error=e.message; setTimeout(()=>this.init(),10000); }
    onData();
    clearInterval(this._timer);
    this._timer=setInterval(()=>{ if(S.user && !S.user.mustChangePassword && document.visibilityState==='visible') this.load().catch(()=>{}); }, 30000);
  },
  async load(){
    const d=await api('GET','/api/data');
    COLS.forEach(c=>{ this.data[c]=Array.isArray(d[c])?d[c]:[]; });
    this.meta={ownerId:d.ownerId||'', wfCheck:Array.isArray(d.wfCheck)?d.wfCheck:[], wf:d.wf||null, orgId:d.orgId||''};
    const me=S.user && this.data.users.find(u=>u.id===S.user.id); if(me) S.user={...S.user,...me};
    if(S.user) UI.load(S.user);
    onData();
    if(S.user && !S.user.mustChangePassword && !S._gw && typeof guideWelcome==='function'){ S._gw=1; setTimeout(guideWelcome, 800); }
  },
  clear(){ COLS.forEach(c=>{ this.data[c]=[]; }); if(typeof vpReset==='function') vpReset(); },
  signedOut(){ if(S.user){ S.user=null; this.clear(); toast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.','err'); onData(); } },
  allReady(){ return this.mode!=='loading'; },
  setLocal(col,o){ const a=this.data[col]; const i=a.findIndex(x=>x.id===o.id); if(i>=0) a[i]=o; else a.push(o); onData(); this.soon(); return o; },
  /* đồng bộ lại toàn bộ (kể cả nhật ký hoạt động) ngay sau khi ghi */
  soon(){ clearTimeout(this._soon); this._soon=setTimeout(()=>this.load().catch(()=>{}),1200); },
  async put(col,obj){
    const o={...obj}; if(!o.id) o.id=uid(col.slice(0,3));
    const r=await api('PUT','/api/data/'+col+'/'+encodeURIComponent(o.id), o);
    return this.setLocal(col,r);
  },
  async del(col,id){
    await api('DELETE',(col==='users'?'/api/users/':'/api/data/'+col+'/')+encodeURIComponent(id));
    this.data[col]=this.data[col].filter(x=>x.id!==id);
    this.data.attachments=this.data.attachments.filter(a=>!(a.collection===col && a.recordId===id)); /* tệp của bản ghi đã chuyển vào thùng rác */
    onData(); this.soon();
  }
};
const D = c => Store.data[c];
const get = (c,id) => Store.data[c].find(x=>x.id===id);

function errText(e){ return (e&&e.message)||'Không lưu được dữ liệu.'; }

/* --- ghi dữ liệu: máy chủ kiểm tra quyền và tự ghi nhật ký hoạt động --- */
async function save(col,obj){ return Store.put(col,obj); }
async function remove(col,id){ await Store.del(col,id); }
/* ghi nhật ký cho thao tác không làm thay đổi dữ liệu (xuất báo cáo…) */
function log(action,col,target){
  if(!S.user) return;
  api('POST','/api/data/logs',{action, module:COL_LABEL[col]||col, target:String(target||'').slice(0,160)}).catch(()=>{});
}

/* --- xác thực --- */
function pwOk(pw){ return pw.length>=8 && /[A-Za-z]/.test(pw) && /\d/.test(pw); }

/* --- phân quyền --- */
function myGroup(){ return S.user ? get('groups', S.user.groupId) : null; }
/* Bản 1.10.24: nhóm có quyền cập nhật nhưng đánh dấu "<phân hệ>:khongxoa" thì không xóa được */
function canDel(mod){ const m=ROUTE_PERM[mod]||mod, g=myGroup(); return can(mod,'edit') && (!g || g.admin || (g.perms||{})[m+':khongxoa']!=='1'); }
function can(mod, lvl='view'){
  mod=ROUTE_PERM[mod]||mod;
  if(isIT() && IT_HIDE.has(mod)) return false;
  if(modHidden(mod)) return false; /* Bản 1.10: phân hệ đơn vị không dùng (Thông tin đơn vị → Phân hệ sử dụng) */
  if(mod==='hien-truong'||mod==='huong-dan'||mod==='trinh-duyet'||mod==='canh-bao') return !!S.user;
  /* Bản 1.9: mọi tài khoản tự điểm danh, gửi đề xuất; bảng công (trưởng phòng xem phòng mình) do máy chủ lọc phạm vi */
  if(lvl==='view' && (mod==='van-phong'||mod==='de-xuat'||mod==='diem-danh'||mod==='lich-hop'||mod==='thong-bao'||mod==='kpi'||mod==='luong'||mod==='cong-viec'||mod==='ho-so')) return !!S.user;
  if(mod==='doi-chieu') mod='quan-tri'; // trang giới thiệu chức năng: dành cho quản trị
  const g=myGroup(); if(!g) return false; if(g.admin) return true;
  if(mod==='quan-tri') return false; // Quản trị hệ thống: chỉ nhóm toàn quyền
  if(lvl==='approve') return (g.perms||{})[mod+':duyet']==='1';
  if(lvl==='check') return (g.perms||{})[mod+':kiemtra']==='1';
  const p=(g.perms||{})[mod]||'none';
  return lvl==='view' ? p!=='none' : p==='edit';
}
function scopeIds(){ const g=myGroup(); if(!g||g.admin||!Array.isArray(g.scope)||!g.scope.length) return null; return g.scope; }
function projects(){ const sc=scopeIds(); return D('projects').filter(p=>!sc||sc.includes(p.id)).sort(by('code')); }
function pidOk(pid){ const sc=scopeIds(); return !sc || sc.includes(pid); }
function inFilter(pid){ return pidOk(pid) && (!S.pid || S.pid===pid); }

/* --- tính toán nghiệp vụ --- */
const pkgOf = id => get('packages',id);
const projOf = id => get('projects',id);
/** Sắp xếp mã hiệu tự nhiên: 1.2 trước 1.10 */
const byCode = (a,b)=> String(a.code??'').localeCompare(String(b.code??''),'vi',{numeric:true});
const contractOfPkg = kid => D('contracts').find(c=>c.packageId===kid);
const contractPid = c => c.projectId || (pkgOf(c.packageId)||{}).projectId;
/* Phụ lục hợp đồng: chỉ phụ lục đã duyệt mới cộng vào giá trị, thời hạn hợp đồng (phụ lục nhập trước bản 1.2 không có trạng thái, coi là đã duyệt) */
const ADD_STATUS = ['Soạn thảo','Chờ duyệt','Đã duyệt','Từ chối'];
const addApproved = a => !a.status || a.status==='Đã duyệt';
const addPending = a => a.status==='Soạn thảo' || a.status==='Chờ duyệt';
function contractValue(c){ return N(c.value) + sum(D('addenda').filter(a=>a.contractId===c.id && addApproved(a)),'valueChange'); }
function contractEnd(c){ const d=sum(D('addenda').filter(a=>a.contractId===c.id && addApproved(a)),'daysChange'); return c.end? addDays(c.end,d) : ''; }
/** Phụ lục đang soạn thảo, chờ duyệt của hợp đồng: chưa tính vào hợp đồng, chỉ để nhắc. */
function contractPending(c){ const xs=D('addenda').filter(a=>a.contractId===c.id && addPending(a)); return {n:xs.length, value:sum(xs,'valueChange'), days:sum(xs,'daysChange')}; }
/* Bản 1.7: đợt nghiệm thu khối lượng. Dòng không thuộc đợt nào là dữ liệu trước bản 1.7, coi như đã nghiệm thu.
   Khối lượng thực hiện tính mọi đợt (trừ đợt bị từ chối); khối lượng nghiệm thu chỉ tính đợt đã duyệt. */
const VB_DISP = {'Soạn thảo':'Dự thảo','Chờ kiểm tra':'Chờ TVGS xác nhận','Chờ duyệt':'Chờ duyệt nghiệm thu','Đã duyệt':'Đã nghiệm thu','Từ chối':'Không nghiệm thu'};
const batchOf = v => v.batchId ? get('vbatches', v.batchId) : null;
function volAccOk(v){ const b=batchOf(v); return !b || !b.status || b.status==='Đã duyệt'; }
function volLive(v){ const b=batchOf(v); return !b || b.status!=='Từ chối'; }
function volAccPend(v){ const b=batchOf(v); return !!b && (b.status==='Chờ kiểm tra' || b.status==='Chờ duyệt'); }
function boqDone(b, upto){ return sum(D('volumes').filter(v=>v.boqId===b.id && volLive(v) && (!upto||v.date<=upto)),'doneQty'); }
function boqAcc(b, upto){ return sum(D('volumes').filter(v=>v.boqId===b.id && volAccOk(v) && (!upto||v.date<=upto)),'acceptedQty'); }
/** Lũy kế khối lượng nghiệm thu đã ghi (mọi đợt chưa bị từ chối), dùng để kiểm tra theo lũy kế (mục 29). */
function boqAccAll(b){ return sum(D('volumes').filter(v=>v.boqId===b.id && volLive(v)),'acceptedQty'); }
/** Giá trị nghiệm thu đang chờ xác nhận, chờ duyệt của hợp đồng. */
function contractAccPend(cid){ return sum(D('volumes').filter(v=>v.contractId===cid && volAccPend(v)), v=>N(v.acceptedQty)*N((get('boq',v.boqId)||{}).price)); }
function contractDone(cid, upto){ return sum(D('boq').filter(b=>b.contractId===cid), b=>boqDone(b,upto)*N(b.price)); }
function contractAcc(cid, upto){ return sum(D('boq').filter(b=>b.contractId===cid), b=>boqAcc(b,upto)*N(b.price)); }
/** Số tiền của hồ sơ thanh toán khi cộng dồn: thu hồi tạm ứng là khoản khấu trừ nên mang dấu âm. */
const PAY_RECOVER='Thu hồi tạm ứng';
const payAmt = p => p.kind===PAY_RECOVER ? -N(p.amount) : N(p.amount);
/* Lũy kế đã chi (giải ngân) của HĐ đến ngày upto, tính theo ngày Kho bạc chi; thu hồi tạm ứng được trừ */
function contractPaid(cid, upto){ return sum(D('payments').filter(p=>p.contractId===cid && p.status==='Đã thanh toán' && (!upto||payDay(p)<=upto)),payAmt); }
function expectedPct(s, date=TODAY){
  if(!s.planStart||!s.planEnd) return 0;
  if(date<=s.planStart) return 0; if(date>=s.planEnd) return 100;
  return days(s.planStart,date)/Math.max(1,days(s.planStart,s.planEnd))*100;
}
function progressAt(s, date){ const h=(s.history||[]).filter(x=>x.date<=date).sort(by('date')); return h.length? N(h[h.length-1].progress) : 0; }
function schedState(s){
  const p=N(s.progress), e=expectedPct(s);
  if(p>=100) return {k:'ok', t:'Hoàn thành'};
  if(TODAY>s.planEnd) return {k:'bad', t:'Quá hạn '+days(s.planEnd,TODAY)+' ngày'};
  if(e-p>10) return {k:'warn', t:'Chậm '+Math.round(e-p)+'%'};
  if(TODAY<s.planStart && p===0) return {k:'', t:'Chưa đến hạn'};
  return {k:'acc', t:'Đúng tiến độ'};
}
/** Kế hoạch tiến độ đã duyệt (bản 1.5): chỉ những kế hoạch này được tính tiến độ, đường cong S, cảnh báo và được cập nhật thực tế.
 *  Kế hoạch chưa có trạng thái (dữ liệu trước bản 1.5) coi là đã duyệt. */
function schedOk(s){ return !s.status || s.status==='Đã duyệt'; }
const SCHED = () => D('schedule').filter(schedOk);
/** Bình quân theo trọng số: chỉ dùng cho các đầu việc trong CÙNG một gói thầu (trọng số do cán bộ phụ trách gói đặt). */
function wavg(items, f){ const w=sum(items, s=>N(s.weight)||1); return w? sum(items, s=>(N(s.weight)||1)*f(s))/w : 0; }
/** Giá trị của gói thầu dùng để quy đổi tiến độ: giá trị hợp đồng sau điều chỉnh (phụ lục đã duyệt), chưa có hợp đồng thì lấy giá gói thầu. */
function pkgValue(kid){ const c=contractOfPkg(kid); const v=c? contractValue(c) : 0; return v>0? v : N((pkgOf(kid)||{}).estimate); }
/** Tiến độ gộp nhiều gói thầu (dự án, hạng mục): trọng số của đầu việc chỉ so được trong gói, nên quy ra giá trị
 *  = giá trị gói × trọng số ÷ tổng trọng số các đầu việc của gói, rồi bình quân theo giá trị. Gói chưa có giá trị
 *  lấy bằng bình quân các gói đã có giá trị; nếu không gói nào có giá trị thì bình quân theo trọng số như cũ. */
function vavg(items, f){
  if(!items.length) return 0;
  const keys=[...new Set(items.map(s=>s.packageId||''))];
  const pv={}; keys.forEach(k=>pv[k]=k?pkgValue(k):0);
  const known=keys.filter(k=>pv[k]>0); if(!known.length) return wavg(items,f);
  const avg=sum(known,k=>pv[k])/known.length;
  const tw={}; keys.forEach(k=>tw[k]=sum(SCHED().filter(s=>(s.packageId||'')===k && (k || s.projectId===items[0].projectId)), s=>N(s.weight)||1)||1);
  const val=s=>{ const k=s.packageId||''; return (pv[k]>0?pv[k]:avg)*(N(s.weight)||1)/tw[k]; };
  const w=sum(items,val); return w? sum(items, s=>val(s)*f(s))/w : 0;
}
function projProgress(pid){ const p=projOf(pid); if(p && /hoàn thành|quyết toán/i.test(p.status||'') && !SCHED().some(s=>s.projectId===pid)) return 100; return vavg(SCHED().filter(s=>s.projectId===pid), s=>N(s.progress)); }
function projExpected(pid){ return vavg(SCHED().filter(s=>s.projectId===pid), s=>expectedPct(s)); }
function pkgProgress(kid){ return wavg(SCHED().filter(s=>s.packageId===kid), s=>N(s.progress)); }
function pkgExpected(kid){ return wavg(SCHED().filter(s=>s.packageId===kid), s=>expectedPct(s)); }
/* Hạng mục không có đầu việc tiến độ riêng → dự án đã hoàn thành thì 100%, chưa thì kế thừa tiến độ chung của dự án (nếu chưa tự nhập %). */
const projDone = p => !!p && /hoàn thành|quyết toán|kết thúc/i.test((p.status||'')+' '+(p.phase||''));
function itemProgress(it){ const ss=SCHED().filter(s=>s.itemId===it.id); if(ss.length) return vavg(ss,s=>N(s.progress)); const p=projOf(it.projectId); if(projDone(p)) return 100; return N(it.progress)|| (SCHED().some(s=>s.projectId===it.projectId)? projProgress(it.projectId) : 0); }
function itemInherited(it){ return !SCHED().some(s=>s.itemId===it.id) && !N(it.progress) && (projDone(projOf(it.projectId)) || SCHED().some(s=>s.projectId===it.projectId)); }
/* Gói thầu không theo dõi tiến độ thi công (tư vấn, mua sắm… hoặc chưa lập đầu việc) → tiến độ theo giá trị nghiệm thu
   (HĐ không có bảng khối lượng thì theo giá trị đã thanh toán); gói đã nghiệm thu, thanh lý, hoàn thành → 100%. */
const pkgClosed = k => !!k && /đã nghiệm thu|thanh lý|hoàn thành|quyết toán/i.test(k.status||'');
function pkgTrack(k){
  if(pkgClosed(k)) return {v:100, plan:100, mode:'done'};
  const hasSch=SCHED().some(s=>s.packageId===k.id);
  if(hasSch && (!k.type || /xây lắp|hỗn hợp/i.test(k.type))) return {v:pkgProgress(k.id), plan:pkgExpected(k.id), mode:'sched'};
  const c=contractOfPkg(k.id); const cv=c? contractValue(c):0;
  const got= !c?0 : D('boq').some(b=>b.contractId===c.id)? contractAcc(c.id) : contractPaid(c.id);
  return {v: cv? Math.min(100,pct(got,cv)) : (hasSch? pkgProgress(k.id):0), plan: hasSch? pkgExpected(k.id) : null, mode:'acc'};
}
/* --- vốn đầu tư công, giải ngân (phân hệ Kế hoạch vốn) --- */
const CAP_MINUS = 'Điều chỉnh giảm kế hoạch năm';
const isAnnualCap = c => c.kind && !/trung hạn/i.test(c.kind);
/** Kế hoạch vốn năm của dự án (vốn năm + bổ sung − điều chỉnh giảm). */
function capPlan(pid, year){ return sum(D('capitals').filter(c=>c.projectId===pid && N(c.year)===N(year) && isAnnualCap(c)), c=>c.kind===CAP_MINUS? -N(c.amount) : N(c.amount)); }
function capMidTerm(pid){ return sum(D('capitals').filter(c=>c.projectId===pid && /trung hạn/i.test(c.kind||'')),'amount'); }
/** Ngày Kho bạc chi (giải ngân) của hồ sơ thanh toán. */
const payDay = p => p.paidDate || p.date || '';
/** Giá trị giải ngân trong năm của dự án đến ngày upto (hồ sơ đã thanh toán; thu hồi tạm ứng được trừ ra). */
function disbursed(pid, year, upto){ const y=String(year); return sum(D('payments').filter(p=>p.status==='Đã thanh toán' && payDay(p).startsWith(y) && (!upto||payDay(p)<=upto) && contractPid(get('contracts',p.contractId)||{})===pid),payAmt); }
/** Kịch bản giải ngân lũy kế (%) đến hết quý q (1–4) của dự án trong năm; mặc định 20/45/70/100. */
function capTarget(pid, year, q){ if(q>=4) return 100; const c=D('capitals').find(x=>x.projectId===pid && N(x.year)===N(year) && x.kind==='Kế hoạch vốn năm'); const d=[20,45,70][q-1]; const v=c&&c['targetQ'+q]; return v==null||v===''? d : N(v); }
/** Kịch bản giải ngân đến ngày date: nội suy tuyến tính trong quý. */
function capTargetAt(pid, year, date=TODAY){ const y=N(year); if(N(date.slice(0,4))<y) return 0; if(N(date.slice(0,4))>y) return 100;
  const m=N(date.slice(5,7)), q=Math.floor((m-1)/3)+1; const qs=y+'-'+pad((q-1)*3+1)+'-01', qe=q<4? y+'-'+pad(q*3+1)+'-01' : (y+1)+'-01-01';
  const a=q>1? capTarget(pid,y,q-1) : 0, b=capTarget(pid,y,q); return a+(b-a)*Math.min(1,days(qs,date)/Math.max(1,days(qs,qe))); }
/* --- kế hoạch thanh toán: tình trạng từng đợt (dùng chung cho bảng, cảnh báo, báo cáo) --- */
/** Số đã thanh toán của đợt kế hoạch: các hồ sơ thanh toán gắn với đợt ở trạng thái Đã thanh toán. */
function planPaid(p){ return sum(D('payments').filter(x=>x.payPlanId===p.id && x.status==='Đã thanh toán'),payAmt); }
/** Tình trạng đợt: Đã thực hiện (có hồ sơ gắn đợt đã được chi) · Đang trình thanh toán · Quá hạn N ngày · Sắp đến hạn (15 ngày) · Chưa đến hạn. */
function planState(p){
  const ps=D('payments').filter(x=>x.payPlanId===p.id), paid=planPaid(p);
  if(ps.some(x=>x.status==='Đã thanh toán')) return {k:'ok', t:'Đã thực hiện', paid};
  const proc=ps.some(payInProc);
  const left=p.planDate? days(TODAY,p.planDate) : null;
  if(left!==null && left<0) return {k:'bad', t:'Quá hạn '+(-left)+' ngày'+(proc?', đang trình':''), paid, late:-left, proc};
  if(proc) return {k:'info', t:'Đang trình thanh toán', paid};
  if(left!==null && left<=15) return {k:'warn', t:left? 'Còn '+left+' ngày đến hạn' : 'Đến hạn hôm nay', paid};
  return {k:'', t:'Chưa đến hạn', paid};
}
/* --- nghiệm thu, quyết toán, GPMB --- */
function warrantyEnd(a){ return a.warrantyUntil || (a.date && N(a.warrantyMonths)? isoLocal(new Date(new Date(a.date).setMonth(new Date(a.date).getMonth()+N(a.warrantyMonths)))) : ''); }
function settleState(x){
  if(x.closedDate) return {k:'ok', t:'Đã tất toán'};
  if(x.approvalDate) return {k:'acc', t:'Chờ tất toán'};
  if(x.submittedDate) return {k:'info', t:'Đã trình thẩm tra'};
  if(x.deadline && x.deadline<TODAY) return {k:'bad', t:'Quá hạn '+days(x.deadline,TODAY)+' ngày'};
  if(x.deadline && days(TODAY,x.deadline)<=30) return {k:'warn', t:'Còn '+days(TODAY,x.deadline)+' ngày đến hạn'};
  return {k:'', t:'Đang lập hồ sơ'};
}
function clearPct(c){ return N(c.area)? pct(N(c.handedArea),N(c.area)) : N(c.households)? pct(N(c.householdsPaid),N(c.households)) : 0; }
function catalog(type){ return D('catalogs').filter(c=>c.type===type).sort(by('order')).map(c=>c.value); }
/* Danh sách chọn theo lĩnh vực của đơn vị: bỏ giá trị chỉ dùng cho xây dựng, đổi tên hiển thị (giá trị lưu giữ nguyên) */
const catSel=type=>{ const h=(isIT()&&IT_CAT_HIDE[type])||[]; return catalog(type).filter(x=>!h.includes(x)).map(x=>[x,catText(x)]); };
const catText=v=>(isIT()&&IT_CAT_REN[v])||v;

/* --- cảnh báo (UC19, UC37) --- */
/* --- cảnh báo (UC19, UC37) ---
   Mỗi cảnh báo gắn với đối tượng: pid (dự án), kid (gói thầu), cid (hợp đồng), go (mở đúng đối tượng),
   kind (nhóm cảnh báo), who (đơn vị chịu trách nhiệm), due (thời hạn) để lọc, xuất Excel trong Trung tâm cảnh báo. */
const ALERT_KINDS = ['Tiến độ','Hợp đồng','Bảo lãnh','Pháp lý','Thanh toán','Vốn đầu tư','Giải ngân','Mặt bằng','Bảo hành','Quyết toán','Công việc','Trình duyệt'];
/* Dư nợ tạm ứng chưa thu hồi của HĐ (đã chi tạm ứng − đã thu hồi) */
function advanceLeft(cid){ const ps=D('payments').filter(p=>p.contractId===cid && p.status==='Đã thanh toán');
  return sum(ps.filter(p=>/tạm ứng/i.test(p.kind||'') && p.kind!==PAY_RECOVER),'amount')-sum(ps.filter(p=>p.kind===PAY_RECOVER),'amount'); }
/* HĐ có bảng khối lượng chi tiết (xây lắp) hay nghiệm thu theo mốc, sản phẩm (tư vấn, mua sắm…) */
const contractHasBoq = cid => D('boq').some(b=>b.contractId===cid);
/* Giá trị thực hiện để xem tổng quan: hợp đồng có bảng khối lượng thì theo khối lượng; hợp đồng tư vấn, trọn gói không lập bảng khối lượng
   thì ước theo tiến độ của gói thầu (nếu có kế hoạch tiến độ), không có kế hoạch thì theo giá trị đã thanh toán. */
function contractDoneEst(c){
  if(contractHasBoq(c.id)) return contractDone(c.id);
  if(c.packageId && SCHED().some(s=>s.packageId===c.packageId)) return contractValue(c)*Math.min(100,N(pkgProgress(c.packageId)))/100;
  return Math.min(contractValue(c), contractPaid(c.id));
}
function alerts(o={}){
  const out=[]; const ok=pid=>o.all? pidOk(pid) : inFilter(pid);
  const pc=pid=>(projOf(pid)||{}).code||'';
  const add=a=>{ const k=a.kid&&pkgOf(a.kid); a.pcode=pc(a.pid); a.kcode=k?k.code:''; out.push(a); };
  const tag=(pid,k)=>`(${esc(pc(pid))}${k?' · '+esc(k.code):''})`;
  SCHED().filter(s=>ok(s.projectId)).forEach(s=>{
    const st=schedState(s); const k=pkgOf(s.packageId); const c=k&&D('contracts').find(x=>x.packageId===k.id);
    const base={mod:'tien-do', kind:'Tiến độ', pid:s.projectId, kid:s.packageId, cid:c&&c.id, go:'td|'+(s.packageId||''), who:c?c.contractor||'':'', due:s.planEnd};
    if(st.k==='bad') add({...base, lvl:'bad', text:`<b>${esc(s.name)}</b> ${tag(s.projectId,k)} ${st.t.toLowerCase()}, mới đạt ${N(s.progress)}%.`});
    else if(st.k==='warn') add({...base, lvl:'warn', text:`<b>${esc(s.name)}</b> ${tag(s.projectId,k)} chậm so với kế hoạch: thực tế ${N(s.progress)}%, kế hoạch ${Math.round(expectedPct(s))}%.`});
  });
  D('contracts').filter(c=>ok(contractPid(c))).forEach(c=>{
    const e=contractEnd(c); const k=pkgOf(c.packageId); const pid=contractPid(c); const base={mod:'goi-thau', kind:'Hợp đồng', pid, kid:c.packageId, cid:c.id, go:'pkg|'+c.packageId, who:c.contractor||''};
    /* Ký hợp đồng vượt giá gói thầu được duyệt */
    if(k && N(k.estimate)>0 && contractValue(c)>N(k.estimate)+1) add({...base, lvl:'bad', kind:'Vốn đầu tư', text:`Hợp đồng <b>${c.number?esc(c.number):'(chưa có số)'}</b> ${tag(pid,k)} có giá trị ${fmtVND(contractValue(c))} đ vượt giá gói thầu được duyệt ${fmtVND(k.estimate)} đ (vượt ${fmtVND(contractValue(c)-N(k.estimate))} đ).`});
    if(!e) return;
    if(k && /thanh lý|nghiệm thu/i.test(k.status||'')) return;
    /* HĐ không lập bảng khối lượng chi tiết (tư vấn, mua sắm, dịch vụ): đo mức hoàn thành theo giá trị đã thanh toán */
    const boq=contractHasBoq(c.id); const done=boq? pct(contractDone(c.id),contractValue(c)) : pct(contractPaid(c.id),contractValue(c));
    const what=boq? 'khối lượng thực hiện' : 'giá trị đã thanh toán';
    const left=days(TODAY,e);
    if(left<0 && done<100) add({...base, lvl:'bad', due:e, text:`Hợp đồng <b>${c.number?esc(c.number):'(chưa có số)'}</b> ${tag(pid,k)} đã hết hạn ${-left} ngày, ${what} ${fmtP(done)}.`});
    else if(left>=0 && left<=60 && done<90) add({...base, lvl:'warn', due:e, text:`Hợp đồng <b>${c.number?esc(c.number):'(chưa có số)'}</b> ${tag(pid,k)} còn ${left} ngày đến hạn (${fmtDate(e)}), ${what} ${fmtP(done)}.`});
  });
  /* Bản 1.8.8: hợp đồng chưa có số hoặc ngày ký (dữ liệu đầu kỳ thiếu): nhắc bổ sung; nhiều hợp đồng thì Tổng quan gom một dòng */
  const nonum=D('contracts').filter(c=>ok(contractPid(c)) && (!String(c.number||'').trim() || !c.signDate)).sort((a,b)=>codeCmp(pc(contractPid(a)),pc(contractPid(b)))||codeCmp((pkgOf(a.packageId)||{}).code,(pkgOf(b.packageId)||{}).code));
  const nnMiss=c=>[!String(c.number||'').trim()?'số hợp đồng':'', !c.signDate?'ngày ký':''].filter(Boolean).join(', ');
  if(nonum.length>3 && !o.all) add({mod:'goi-thau', kind:'Hợp đồng', go:'cbk|Hợp đồng', who:'Cán bộ quản lý hợp đồng', lvl:'warn', text:`<b>${nonum.length} hợp đồng chưa có số hoặc ngày ký</b> (dữ liệu nhập đầu kỳ còn thiếu), cần bổ sung theo hợp đồng đã ký.`});
  else nonum.forEach(c=>{ const k=pkgOf(c.packageId); add({mod:'goi-thau', kind:'Hợp đồng', pid:contractPid(c), kid:c.packageId, cid:c.id, go:'pkg|'+c.packageId, who:'Cán bộ quản lý hợp đồng', lvl:'warn', text:`Hợp đồng gói <b>${esc(k?k.name:'')}</b> ${tag(contractPid(c),k)}${c.contractor?', '+esc(ctShort(c)):''} chưa có ${nnMiss(c)}, cần bổ sung.`}); });
  /* Tổng giá trị hợp đồng của dự án vượt tổng mức đầu tư */
  projects().filter(p=>ok(p.id) && N(p.tmdt)>0).forEach(p=>{ const cv=sum(D('contracts').filter(c=>contractPid(c)===p.id),contractValue);
    if(cv>N(p.tmdt)+1) add({mod:'du-an', kind:'Vốn đầu tư', lvl:'bad', pid:p.id, go:'proj|'+p.id, who:'', text:`Dự án <b>${esc(p.code)}</b>: tổng giá trị hợp đồng ${fmtVND(cv)} đ vượt tổng mức đầu tư ${fmtVND(p.tmdt)} đ (vượt ${fmtVND(cv-N(p.tmdt))} đ).`}); });
  /* Bảo lãnh, giấy phép… sắp hết hiệu lực (trước 30 ngày) hoặc đã hết hiệu lực.
     keep=true: nhắc đến khi được gia hạn (bảo lãnh HĐ, giấy phép); bảo hành hết hạn là bình thường nên chỉ nhắc 90 ngày */
  const expiry=(until, label, base, keep=true)=>{ if(!until) return; const left=days(TODAY,until);
    if(left<0 && (keep || left>=-90)) add({...base, lvl:'bad', due:until, text:`${label} đã hết hiệu lực từ ${fmtDate(until)} (${-left} ngày)${keep?', chưa gia hạn':''}.`});
    else if(left>=0 && left<=30) add({...base, lvl:'warn', due:until, text:`${label} sắp hết hiệu lực: còn ${left} ngày (đến ${fmtDate(until)}).`}); };
  D('contracts').filter(c=>ok(contractPid(c))).forEach(c=>{ const k=pkgOf(c.packageId); if(k && /thanh lý/i.test(k.status||'')) return;
    const pid=contractPid(c); const base={mod:'goi-thau', kind:'Bảo lãnh', pid, kid:c.packageId, cid:c.id, go:'pkg|'+c.packageId, who:c.contractor||''};
    /* Bảo lãnh thực hiện HĐ: hết nghĩa vụ khi HĐ đã thanh toán đủ */
    if(pct(contractPaid(c.id),contractValue(c))<100) expiry(c.guaranteeUntil, `Bảo lãnh thực hiện HĐ <b>${c.number?esc(c.number):'(chưa có số)'}</b> ${tag(pid,k)}`, base);
    /* Bảo lãnh tạm ứng: chỉ nhắc khi còn dư nợ tạm ứng chưa thu hồi */
    const adv=advanceLeft(c.id); if(adv>1) expiry(c.advanceGuaranteeUntil, `Bảo lãnh tạm ứng HĐ <b>${c.number?esc(c.number):'(chưa có số)'}</b> ${tag(pid,k)}, dư nợ tạm ứng ${fmtVND(adv)} đ`, base); });
  D('legal').filter(l=>l.validUntil && ok(l.projectId)).forEach(l=>{ const p=projOf(l.projectId); if(p && /hoàn thành|quyết toán|bàn giao/i.test(p.status||'')) return;
    const k=l.packageId&&pkgOf(l.packageId); expiry(l.validUntil, `${esc(l.type)} <b>${esc(l.number)}</b> ${tag(l.projectId,k)}`, {mod:k?'goi-thau':'du-an', kind:'Pháp lý', pid:l.projectId, kid:k?k.id:'', go:k?'pkg|'+k.id:'legal|'+l.projectId, who:l.issuer||''}); });
  /* Đợt thanh toán quá hạn: nhắc cho đến khi đợt được thực hiện; nhiều đợt thì gom một dòng ở Tổng quan, Trung tâm cảnh báo liệt kê đủ */
  const lates=D('payplans').map(p=>({p, c:get('contracts',p.contractId), st:planState(p)})).filter(x=>x.c && ok(contractPid(x.c)) && x.st.late && pct(contractPaid(x.c.id),contractValue(x.c))<100).sort((a,b)=>b.st.late-a.st.late);
  const lateRow=({p,c,st})=>({mod:'thanh-toan', kind:'Thanh toán', pid:contractPid(c), kid:c.packageId, cid:c.id, go:'tt|'+c.id, who:'Kế toán Ban', due:p.planDate, lvl:st.late>30?'bad':'warn', text:`Kế hoạch thanh toán <b>${esc(p.phase)}</b> HĐ ${esc(c.number)} ${tag(contractPid(c),pkgOf(c.packageId))} (${fmtTy(p.amount)}) đến hạn ${fmtDate(p.planDate)}, quá hạn ${st.late} ngày chưa thực hiện${st.proc?' (hồ sơ đang trình)':''}.`});
  if(lates.length>3 && !o.all) add({mod:'thanh-toan', kind:'Thanh toán', go:'tt|', who:'Kế toán Ban', lvl:lates.some(x=>x.st.late>30)?'bad':'warn', text:`<b>${lates.length} đợt kế hoạch thanh toán quá hạn</b> chưa thực hiện, tổng ${fmtTy(sum(lates,x=>N(x.p.amount)))}; lâu nhất ${lates[0].st.late} ngày (đợt ${esc(lates[0].p.phase)} HĐ ${esc(lates[0].c.number)}).`});
  else lates.forEach(x=>add(lateRow(x)));
  /* Giải ngân năm hiện tại thấp hơn kịch bản */
  const Y=TODAY.slice(0,4);
  projects().filter(p=>ok(p.id)).forEach(p=>{ const plan=capPlan(p.id,Y); if(!plan) return;
    const done=pct(disbursed(p.id,Y),plan), tg=capTargetAt(p.id,Y);
    if(tg-done>10) add({mod:'von', kind:'Giải ngân', pid:p.id, go:'mod|von', who:'', due:Y+'-12-31', lvl:tg-done>25?'bad':'warn', text:`Dự án <b>${esc(p.code)}</b> giải ngân năm ${Y} mới đạt ${fmtP(done)} kế hoạch vốn (kịch bản đến nay ${fmtP(tg)}).`}); });
  /* Bảo hành, bảo lãnh bảo hành sắp hết hoặc đã hết */
  D('acceptances').filter(a=>ok(a.projectId)).forEach(a=>{ const p=projOf(a.projectId)||{}; const k=a.packageId&&pkgOf(a.packageId);
    const base={mod:'nghiem-thu', kind:'Bảo hành', pid:a.projectId, kid:k?k.id:'', go:'mod|nghiem-thu', who:''};
    const w=warrantyEnd(a); if(w) expiry(w, `Thời hạn bảo hành ${esc(k?k.code:p.code||'')} (${esc(a.number||a.kind||'')})`, base, false);
    expiry(a.warrantyGuaranteeUntil, `Bảo lãnh bảo hành ${esc(k?k.code:p.code||'')}`, base, false); });
  /* Quyết toán quá hạn, đã phê duyệt mà chưa tất toán */
  D('settlements').filter(x=>ok(x.projectId)).forEach(x=>{ const p=projOf(x.projectId)||{}; const st=settleState(x);
    const base={mod:'quyet-toan', kind:'Quyết toán', pid:x.projectId, go:'mod|quyet-toan', who:'', due:x.deadline};
    if(st.k==='bad'||st.k==='warn') add({...base, lvl:st.k, text:`Quyết toán dự án <b>${esc(p.code||'')}</b>: ${st.t.toLowerCase()} (hạn ${fmtDate(x.deadline)}).`});
    else if(st.k==='acc' && days(x.approvalDate,TODAY)>60) add({...base, lvl:'warn', text:`Dự án <b>${esc(p.code||'')}</b> đã phê duyệt quyết toán ${days(x.approvalDate,TODAY)} ngày nhưng chưa tất toán tài khoản.`}); });
  /* Mặt bằng chưa bàn giao đúng hạn */
  D('clearances').filter(c=>ok(c.projectId) && !c.handoverDate && c.handoverDue && c.handoverDue<TODAY).forEach(c=>{ const p=projOf(c.projectId)||{};
    add({mod:'gpmb', kind:'Mặt bằng', pid:c.projectId, go:'mod|gpmb', who:'', due:c.handoverDue, lvl:'bad', text:`Mặt bằng <b>${esc(c.name)}</b> (${esc(p.code||'')}) chậm bàn giao ${days(c.handoverDue,TODAY)} ngày, đạt ${fmtP(clearPct(c))}.`}); });
  D('tasks').filter(t=>ok(t.projectId) && t.status!=='Hoàn thành' && t.due && t.due<TODAY).forEach(t=>{
    add({mod:'du-an', kind:'Công việc', pid:t.projectId, go:'task|'+t.projectId, who:t.assignee||'', due:t.due, lvl:'bad', text:`Công việc <b>${esc(t.name)}</b> (${esc(pc(t.projectId))}) quá hạn ${days(t.due,TODAY)} ngày (${esc(t.assignee||'')}).`});
  });
  out.sort((a,b)=>(a.lvl==='bad'?0:1)-(b.lvl==='bad'?0:1) || String(a.due||'9').localeCompare(String(b.due||'9')));
  /* Hồ sơ chờ người dùng duyệt: luôn đứng đầu */
  if(typeof WF!=='undefined'){ const mine=wfMine().filter(x=>ok(WF[x.col].pid(x.r))); if(mine.length) out.unshift({lvl:'warn', mod:'trinh-duyet', kind:'Trình duyệt', go:'mod|trinh-duyet', pcode:'', kcode:'', who:'', text:`Có <b>${mine.length} hồ sơ chờ bạn duyệt</b>: ${esc([...new Set(mine.map(x=>WF[x.col].name.toLowerCase()))].join(', '))}.`}); }
  /* Bản 1.8.9: hồ sơ trình duyệt trễ hạn xử lý (tính theo ngày làm việc); nhiều hồ sơ thì gom một dòng */
  if(typeof wfLateDays==='function'){ const lateWf=Object.keys(WF).filter(col=>can(WF[col].mod)).flatMap(col=>D(col).filter(r=>wfWaiting(col,r) && ok(WF[col].pid(r))).map(r=>({col,r,st:wfState(col,r)}))).map(x=>({...x, lt:wfLateDays(x.col,x.r,x.st)})).filter(x=>x.lt>0).sort((a,b)=>b.lt-a.lt);
    if(lateWf.length>3 && !o.all) add({mod:'trinh-duyet', kind:'Trình duyệt', go:'wf|vt', who:'Người đang giữ hồ sơ', lvl:'bad', text:`<b>${lateWf.length} hồ sơ trình duyệt trễ hạn xử lý</b>, lâu nhất ${lateWf[0].lt} ngày làm việc (${esc(WF[lateWf[0].col].label(lateWf[0].r))}).`});
    else lateWf.forEach(x=>add({mod:'trinh-duyet', kind:'Trình duyệt', pid:WF[x.col].pid(x.r), go:'wf|vt', who:wfHolder(x.col,x.st), lvl:'bad', due:x.st.due, text:`<b>${esc(WF[x.col].label(x.r))}</b> ${tag(WF[x.col].pid(x.r))} trễ hạn ${x.lt} ngày ở bước ${esc(x.st.step.label)}.`})); }
  return out;
}
/* Một dòng cảnh báo có nút "Xem" mở đúng đối tượng */
/* Bản 1.8.9: cảnh báo dạng danh sách gọn trong một khung; mức độ ghi bằng chữ (không chỉ bằng màu); quá 5 dòng thì thu gọn */
function alertRow(a){ const bad=a.lvl==='bad'; return `<div class="alr ${bad?'bad':'warn'}"><span class="alr-d">${bad?'Nghiêm trọng':'Theo dõi'}</span><span class="alr-t">${a.text}</span>${a.go?`<button type="button" class="btn sm ghost" data-act="alert-go" data-id="${esc(a.go)}">Xem</button>`:''}</div>`; }
function alertList(list, empty, max=5){ if(!list.length) return empty?`<div class="alert info">${empty}</div>`:''; const a=list.slice(0,max), b=list.slice(max);
  return `<div class="alrs">${a.map(alertRow).join('')}${b.length?`<details class="alr-more"><summary>Xem thêm ${b.length} cảnh báo</summary>${b.map(alertRow).join('')}</details>`:''}</div>`; }
const cellText = h => { const d=document.createElement('div'); d.innerHTML=h; return d.textContent||''; };

/* --- giao diện chung --- */
function toast(msg, kind){ const t=$('#toast'); t.textContent=msg; t.className='toast'+(kind?' '+kind:''); t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true, kind==='err'?6000:2600); }
function pill(text, k){ return `<span class="pill ${k||''}">${esc(text)}</span>`; }
function statusPill(s){
  const k = /hoàn thành|đã quyết toán|đã thanh toán|đã thanh lý|đã nghiệm thu/i.test(s)?'ok': /tạm dừng|từ chối|quá hạn/i.test(s)?'bad': /chuẩn bị|lựa chọn|đề nghị|trình|chưa/i.test(s)?'info': /thi công|thực hiện|đang/i.test(s)?'acc':'';
  return pill(s||'—',k);
}
function progBar(v, k){ const w=Math.max(0,Math.min(100,N(v))); return `<div class="barl"><div class="bar ${k||''}"><i style="width:${w}%"></i></div><span>${Math.round(N(v))}%</span></div>`; }
/* Mục chọn: [giá trị, nhãn, nhóm, chữ tìm thêm]. Có nhóm thì gom vào <optgroup> (gói thầu, hợp đồng nhóm theo dự án) */
function opts(list, cur, empty){ let g=null, h=(empty!=null?`<option value="">${esc(empty)}</option>`:'');
  list.forEach(o=>{ const [v,l,gr,sx]=Array.isArray(o)?o:[o,o];
    if((gr||null)!==g){ if(g) h+='</optgroup>'; g=gr||null; if(g) h+=`<optgroup label="${esc(g)}">`; }
    h+=`<option value="${esc(v)}" ${String(v)===String(cur??'')?'selected':''}${sx?` data-s="${esc(sx)}"`:''}>${esc(l)}</option>`; });
  return h+(g?'</optgroup>':''); }
/* Ô chọn dài (trên 12 mục) có ô gõ để tìm: gõ tên gói, tên dự án, số hợp đồng, nhà thầu, không cần dấu.
   Ô chọn gốc vẫn giữ (ẩn) để biểu mẫu, bộ lọc đọc giá trị như cũ. */
const fold = x => String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
let _combo=null;
addEventListener('scroll',e=>{ if(_combo && !_combo.lst.hidden && !_combo.lst.contains(e.target)) _combo.place(); },true);
addEventListener('resize',()=>{ if(_combo && !_combo.lst.hidden) _combo.place(); });
function comboWire(root){ document.querySelectorAll('body > .combo-list').forEach(l=>{ if(!document.body.contains(l._inp)) l.remove(); });
  (root||document).querySelectorAll('select').forEach(sel=>{ if(sel._cb || sel.classList.contains('pg-size') || sel.hasAttribute('data-nocombo')) return;
    /* Bản 1.8.9: ô chọn dự án, gói thầu, hợp đồng, nhà thầu có ô tìm từ 6 mục; ô chọn khác từ 13 mục */
    const key=fold((sel.getAttribute('aria-label')||'')+' '+(sel.id||'')+' '+((sel.closest('.fld')||{}).textContent||'').slice(0,60)+' '+(sel.options[0]?sel.options[0].text:''));
    const big=sel.id==='gpid' || /du an|goi thau|hop dong|nha thau|don vi/.test(key);
    if(sel.options.length <= (big?5:12)) return; comboMake(sel); }); }
function comboMake(sel){
  sel._cb=1; const box=document.createElement('span'); box.className='combo'; if(sel.style.maxWidth) box.style.maxWidth=sel.style.maxWidth;
  sel.parentNode.insertBefore(box, sel); box.appendChild(sel); sel.classList.add('combo-src'); sel.tabIndex=-1;
  const inp=document.createElement('input'); inp.type='text'; inp.className='combo-in'; inp.autocomplete='off'; inp.spellcheck=false;
  inp.setAttribute('role','combobox'); inp.setAttribute('aria-expanded','false'); inp.setAttribute('aria-label',(sel.getAttribute('aria-label')||'')+' (gõ để tìm)');
  inp.placeholder='Gõ để tìm…'; box.insertBefore(inp, sel);
  const lst=document.createElement('div'); lst.className='combo-list'; lst.hidden=true; lst._inp=inp; document.body.appendChild(lst);
  /* Bản 1.8.9: ô tìm có kính lúp ở đầu danh sách, mở ra là gõ tìm được ngay */
  const qbox=document.createElement('div'); qbox.className='combo-qb'; const q=document.createElement('input'); q.type='search'; q.className='combo-q'; q.autocomplete='off'; q.spellcheck=false;
  q.placeholder='Tìm: gõ mã, tên hoặc số…'; q.setAttribute('aria-label','Tìm trong danh sách'); qbox.appendChild(q); lst.appendChild(qbox);
  const body=document.createElement('div'); body.className='combo-b'; body.setAttribute('role','listbox'); lst.appendChild(body);
  const gcode=o=>{ const g=o.parentElement && o.parentElement.tagName==='OPTGROUP' ? o.parentElement.label : ''; return g? g.split(' – ')[0] : ''; };
  const label=()=>{ const o=sel.options[sel.selectedIndex]; if(!o) return ''; const g=gcode(o); return (g&&o.value? g+' · ' : '')+o.text; };
  const sync=()=>{ inp.value=label(); inp.title=(()=>{ const o=sel.options[sel.selectedIndex]; return o&&o.parentElement.tagName==='OPTGROUP'? o.parentElement.label : ''; })(); };
  let items=[], on=-1;
  const draw=q=>{ const ws=fold(q).split(/\s+/).filter(Boolean); let h='', gPrev=null, n=0; items=[];
    [...sel.options].forEach(o=>{ const gl=o.parentElement.tagName==='OPTGROUP'? o.parentElement.label : '';
      if(ws.length){ const t=fold(o.text+' '+gl+' '+(o.dataset.s||'')); if(!ws.every(w=>t.includes(w))) return; }
      if(n>=300) return; n++;
      if(gl!==gPrev){ gPrev=gl; if(gl) h+=`<div class="combo-g">${esc(gl)}</div>`; }
      h+=`<div class="combo-o${o.value===sel.value?' cur':''}" role="option" data-i="${items.length}">${esc(o.text)}</div>`; items.push(o); });
    body.innerHTML=h||'<div class="combo-none">Không tìm thấy. Thử gõ mã, tên dự án, tên gói, số hợp đồng hoặc tên nhà thầu.</div>'; on=-1; };
  const place=()=>{ const r=inp.getBoundingClientRect(); const below=innerHeight-r.bottom; lst.style.left=Math.max(8,Math.min(r.left, innerWidth-Math.max(r.width,320)-8))+'px'; lst.style.minWidth=Math.min(innerWidth-16,Math.max(r.width,320))+'px';
    if(below<240 && r.top>below){ lst.style.top=''; lst.style.bottom=(innerHeight-r.top+2)+'px'; lst.style.maxHeight=Math.min(360,r.top-12)+'px'; } else { lst.style.bottom=''; lst.style.top=(r.bottom+2)+'px'; lst.style.maxHeight=Math.min(360,below-12)+'px'; } };
  const open=(qs, focusQ)=>{ if(_combo && _combo.lst!==lst) _combo.lst.hidden=true; _combo={lst,place}; q.value=qs||''; draw(q.value); place(); lst.hidden=false; inp.setAttribute('aria-expanded','true');
    if(focusQ!==false){ q.focus(); const n=q.value.length; try{ q.setSelectionRange(n,n); }catch{} const c=!n && body.querySelector('.combo-o.cur'); if(c) c.scrollIntoView({block:'nearest'}); } };
  const close=()=>{ lst.hidden=true; inp.setAttribute('aria-expanded','false'); };
  const pick=o=>{ close(); if(o && sel.value!==o.value){ sel.value=o.value; sync(); sel.dispatchEvent(new Event('change',{bubbles:true})); } else sync(); };
  const mark=i=>{ const els=body.querySelectorAll('.combo-o'); if(!els.length) return; on=(i+els.length)%els.length; els.forEach((e,j)=>e.classList.toggle('on',j===on)); els[on].scrollIntoView({block:'nearest'}); };
  inp.readOnly=true; inp.placeholder='';
  inp.addEventListener('click',()=>{ if(lst.hidden) open(''); else { close(); } });
  const away=()=>setTimeout(()=>{ if(document.activeElement!==inp && document.activeElement!==q){ close(); sync(); } },150);
  inp.addEventListener('blur',away); q.addEventListener('blur',away);
  q.addEventListener('input',()=>{ draw(q.value); place(); });
  const keys=e=>{ if(e.key==='ArrowDown'){ e.preventDefault(); if(lst.hidden) open(''); mark(on+1); } else if(e.key==='ArrowUp'){ e.preventDefault(); mark(on-1); }
    else if(e.key==='Enter'){ if(!lst.hidden){ e.preventDefault(); pick(items[on>=0?on:0]); inp.focus(); } else { e.preventDefault(); open(''); } }
    else if(e.key==='Escape'){ if(!lst.hidden){ e.stopPropagation(); e.preventDefault(); close(); sync(); inp.focus(); } }
    else if(e.target===inp && e.key.length===1 && !e.ctrlKey && !e.metaKey && !e.altKey){ e.preventDefault(); open(e.key); } };
  inp.addEventListener('keydown',keys); q.addEventListener('keydown',keys);
  lst.addEventListener('mousedown',e=>{ e.preventDefault(); const d=e.target.closest('.combo-o'); if(d) pick(items[+d.dataset.i]); });
  sel.addEventListener('change',sync); sel.addEventListener('focus',()=>inp.focus()); sel._cbSync=sync;
  sync(); }
const projOpts = () => projects().map(p=>[p.id, p.code+' – '+p.name]);
/* Bản 1.8.8: gói thầu, hợp đồng nhóm theo dự án, ghi tên gói trước, ký hiệu sau; tìm được theo số hợp đồng, nhà thầu */
const pjGroup = pid => { const p=projOf(pid)||{}; return (p.code||'')+' – '+(p.name||''); };
const codeCmp = (a,b) => String(a||'').localeCompare(String(b||''),'vi',{numeric:true});
const pkgSort = (a,b) => codeCmp((projOf(a.projectId)||{}).code, (projOf(b.projectId)||{}).code) || codeCmp(a.code,b.code);
const pkgOpts = (pid) => D('packages').filter(k=>pidOk(k.projectId) && (!pid||k.projectId===pid)).sort(pkgSort).map(k=>{ const c=contractOfPkg(k.id);
  return [k.id, k.name+' ('+k.code+')', pjGroup(k.projectId), [k.code, c&&c.number, c&&c.contractor, typeof pkgContractorName==='function'?pkgContractorName(k):''].filter(Boolean).join(' ')]; });
/* Số hợp đồng: hợp đồng chưa có số (dữ liệu đầu kỳ thiếu số) ghi rõ "Chưa có số hợp đồng" */
const NO_CNUM='Chưa có số hợp đồng';
const cNum = c => (c && String(c.number||'').trim()) || NO_CNUM;
const cNumH = c => (c && String(c.number||'').trim()) ? esc(c.number) : `<span class="no-num">${NO_CNUM}</span>`;
/* Tên ngắn của nhà thầu (tên viết tắt trong danh mục nếu có) */
const ctShort = c => { if(!c) return ''; const n=normKey(c.contractor); const o=n && D('orgs').find(x=>normKey(x.name)===n); return (o&&o.shortName)||c.contractor||''; };
/* Mô tả hợp đồng một dòng: DA050 · TV07 Tư vấn quản lý dự án */
const cDesc = c => { const k=c&&pkgOf(c.packageId); const p=projOf(contractPid(c)); return [(p||{}).code, k? k.code+' '+k.name : ''].filter(Boolean).join(' · '); };
/* Giai đoạn của gói thầu: chọn ở biểu mẫu gói thầu; chưa chọn thì gói tư vấn (trừ tư vấn giám sát) thuộc chuẩn bị đầu tư */
const isSupPkg = k => (/GS/i.test(k.code||'') && /tư vấn/i.test(k.type||'')) || /giám sát/i.test((k.name||'')+' '+(k.type||''));
const pkgPhaseDef = k => /tư vấn/i.test(k.type||'') && !/phi tư vấn/i.test(k.type||'') && !isSupPkg(k) ? 'cb' : 'dt';
const pkgPhase = k => !k ? 'dt' : (k.phase==='cb'||k.phase==='dt') ? k.phase : pkgPhaseDef(k);
const contractPhase = c => pkgPhase(c && pkgOf(c.packageId));
const cidPhase = cid => contractPhase(get('contracts',cid));
const phaseOpts = () => Object.entries(PHASES);
/* Gói tư vấn (không gồm phi tư vấn). Hợp đồng nghiệm thu theo sản phẩm: mọi hợp đồng chuẩn bị đầu tư và hợp đồng tư vấn thực hiện đầu tư */
const isTVPkg = k => !!k && /tư vấn/i.test(k.type||'') && !/phi tư vấn/i.test(k.type||'');
const contractProd = c => !!c && (contractPhase(c)==='cb' || isTVPkg(pkgOf(c.packageId)));
const cidProd = cid => contractProd(get('contracts',cid));
/* Nhóm hợp đồng: 'cb' chuẩn bị đầu tư, 'dt' mọi hợp đồng thực hiện đầu tư, 'tv' hợp đồng tư vấn thực hiện đầu tư, 'kl' hợp đồng thực hiện đầu tư quản lý theo khối lượng */
const phMatch = (c, ph) => !ph || (ph==='tv'? contractPhase(c)==='dt' && contractProd(c) : ph==='kl'? contractPhase(c)==='dt' && !contractProd(c) : contractPhase(c)===ph);
const contractOpts = (pid, ph) => D('contracts').filter(c=>pidOk(contractPid(c)) && (!pid||contractPid(c)===pid) && phMatch(c,ph)).map(c=>({c, k:pkgOf(c.packageId)||{}})).sort((a,b)=>codeCmp((projOf(contractPid(a.c))||{}).code,(projOf(contractPid(b.c))||{}).code)||codeCmp(a.k.code,b.k.code))
  .map(({c,k})=>[c.id, [(k.name||'')+(k.code?' ('+k.code+')':''), ctShort(c), cNum(c)].filter(Boolean).join(' · '), pjGroup(contractPid(c)), [c.number, c.contractor, k.code].filter(Boolean).join(' ')]);
function emptyBox(text, btn){ return `<div class="empty">${text}${btn?`<div style="margin-top:10px">${btn}</div>`:''}</div>`; }

/* Bảng dữ liệu chung */
/* Phân trang dùng chung cho mọi bảng: mặc định 20 dòng/trang, chọn 20/50/100/tất cả (nhớ theo máy); dòng tổng do nơi gọi tính trên toàn bộ dữ liệu */
const PG_SIZES=[20,50,100,0];
function pgSize(){ try{ const r=localStorage.getItem('qlda-pgsize'); const v=r==null? 20 : +r; return PG_SIZES.includes(v)? v : 20; }catch{ return 20; } }
function pager(key, total, page, size){
  const pages=Math.max(1,Math.ceil(total/size)); const b=(p,l,dis,t)=>`<button type="button" class="btn sm ghost" data-act="pg" data-id="${esc(key)}" data-p="${p}" ${dis?'disabled':''} title="${t}" aria-label="${t}">${l}</button>`;
  return `<div class="pager"><span class="small muted">${(page-1)*size+1}–${Math.min(total,page*size)} / ${total} dòng</span><span class="sp"></span>
    ${b(1,'«',page<=1,'Trang đầu')}${b(page-1,'‹',page<=1,'Trang trước')}<span class="small">Trang <b>${page}</b>/${pages}</span>${b(page+1,'›',page>=pages,'Trang sau')}${b(pages,'»',page>=pages,'Trang cuối')}
    <select class="pg-size" aria-label="Số dòng mỗi trang">${PG_SIZES.map(n=>`<option value="${n}" ${n===size?'selected':''}>${n?n+' dòng/trang':'Tất cả'}</option>`).join('')}</select></div>`;
}
function table(cols, rows, o={}){
  if(!rows.length) return emptyBox(o.empty||'Chưa có dữ liệu.');
  const size=o.nopage? 0 : pgSize(); let pg='';
  if(size && rows.length>size){
    const key=(S.route||'')+':'+(o.pk||cols.map(c=>c.h).join('|'));
    const pages=Math.ceil(rows.length/size); const page=Math.min(Math.max(1,(S.pg||{})[key]||1),pages);
    pg=pager(key, rows.length, page, size); rows=rows.slice((page-1)*size, page*size);
  }
  const head = cols.map(c=>`<th class="${c.r?'r':''}">${esc(c.h)}</th>`).join('') + (o.actions?'<th></th>':'');
  /* o.group(r): nhãn nhóm của dòng (phần, hạng mục của bảng khối lượng); đổi nhóm thì chèn một dòng tiêu đề nhóm */
  const nc=cols.length+(o.actions?1:0); let gPrev;
  const grpRow=(r,ri)=>{ if(!o.group) return ''; const g=o.group(r)||''; if(ri>0 && g===gPrev) return ''; gPrev=g; return g?`<tr class="grp"><td colspan="${nc}">${g}</td></tr>`:''; };
  const body = rows.map((r,ri)=>grpRow(r,ri)+`<tr class="${o.rowAct?'click':''}" ${o.rowAct?`data-act="${o.rowAct}" data-id="${esc(r.id)}"`:''}>${cols.map(c=>`<td class="${c.r?'r':''}" data-label="${esc(c.h)}">${c.f?c.f(r):esc(r[c.k])}</td>`).join('')}${o.actions?`<td class="acts">${o.actions(r)}</td>`:''}</tr>`).join('');
  /* dòng tổng cũng gắn nhãn cột: trên điện thoại bảng thành thẻ, thiếu nhãn thì chỉ thấy một cột số (góp ý Triển khai, mục 14) */
  const foot = o.foot? `<tfoot><tr>${o.foot.map((f,i)=>`<td class="${cols[i]&&cols[i].r?'r':''}"${i&&cols[i]?` data-label="${esc(cols[i].h)}"`:''}>${f??''}</td>`).join('')}${o.actions?'<td></td>':''}</tr></tfoot>`:'';
  return `<div class="tw rt"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${foot}</table></div>${pg}`;
}
const editBtns = (mod, col, id, extra='') => can(mod,'edit') ? `${extra}<button class="btn sm ghost" data-act="edit-${col}" data-id="${esc(id)}">Sửa</button>${canDel(mod)?`<button class="btn sm ghost danger" data-act="del" data-col="${col}" data-id="${esc(id)}">Xóa</button>`:''}` : extra;

/* Hộp thoại biểu mẫu */
/* Ô chữ có danh sách gợi ý (datalist + thẻ chọn nhanh 1 chạm); vẫn cho gõ giá trị mới */
function fieldSuggest(f){ if(!f.suggest) return []; const l=typeof f.suggest==='function'?f.suggest():f.suggest; return [...new Set((l||[]).map(x=>String(x||'').trim()).filter(Boolean))]; }
const normKey = x => String(x||'').normalize('NFC').replace(/\s+/g,' ').trim().toLocaleLowerCase('vi');
function fieldHTML(f, v, rec={}){
  const id='f_'+f.key, req=f.req?' <span class="req">*</span>':'';
  const cls='fld'+(f.full||f.type==='textarea'||f.type==='works'||f.type==='checks'||f.type==='files'||f.type==='attach'?' full':'')+(f.more?' fld-more':'');
  let input='';
  const val = v ?? f.def ?? '';
  switch(f.type){
    case 'textarea': input=`<textarea id="${id}" rows="${f.rows||3}" placeholder="${esc(f.ph||'')}">${esc(val)}</textarea>`; break;
    case 'works': input=worksHTML(id, val, f); break;
    case 'select': { let list=typeof f.options==='function'?f.options(f.dep? rec[f.dep] : undefined):f.options;
      // giá trị đang lưu không còn trong danh mục (đã đổi, ẩn): vẫn giữ trong danh sách để lưu lại không bị đổi ngầm
      if(!f.dep && val!=='' && val!=null && !(list||[]).some(o=>String(Array.isArray(o)?o[0]:o)===String(val))) list=[...(list||[]),[val,catText(String(val))]];
      input=`<select id="${id}">${opts(list,val, f.req?null:'— Chọn —')}</select>${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}`; break; }
    case 'money': input=`<input id="${id}" type="number" step="1" min="0" value="${esc(val)}" data-money><span class="hint" id="${id}_h">${val!==''?fmtVND(val)+' đồng':''}</span>`; break;
    case 'number': case 'percent': input=`<input id="${id}" type="number" step="any" ${f.type==='percent'?'min="0" max="100"':''} value="${esc(val)}">`; break;
    case 'date': input=`<input id="${id}" type="date" value="${esc(val)}">`; break;
    case 'time': input=`<input id="${id}" type="time" value="${esc(val)}">`; break;
    case 'password': input=`<input id="${id}" type="password" autocomplete="new-password" value="">`; break;
    case 'checks': { const list=typeof f.options==='function'?f.options():f.options; const cur=Array.isArray(val)?val:[]; input=`<div class="checks" id="${id}">${list.map(o=>{const [ov,ol]=Array.isArray(o)?o:[o,o]; return `<label><input type="checkbox" value="${esc(ov)}" ${cur.includes(ov)?'checked':''}> ${esc(ol)}</label>`;}).join('')}</div>`; break; }
    case 'files': input=`<input id="${id}" type="file" ${f.multiple?'multiple':''} accept="${esc(f.accept||'')}">${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}`; break;
    case 'attach': input=attachHTML(f, rec); break;
    case 'html': input=f.html; break;
    /* Bản 1.8.3: chọn đơn vị từ danh mục (nhà thầu, đơn vị giám sát); chưa có thì bấm "+ Thêm" nhập ngay tại chỗ, lưu vào danh mục */
    case 'org': { const nw=val && typeof val==='object' && val._new || null; const ov=nw? '' : val;
      const list=D('orgs').filter(o=>o.kind===(f.kind||'nt') && (o.active!==false || o.id===ov)).sort((a,b)=>String(a.name).localeCompare(String(b.name),'vi'));
      const what=f.kind==='gs'?'đơn vị giám sát':'nhà thầu';
      input=`<div class="orgpick" id="${id}"><div class="orgpick-row"${nw?' hidden':''}><select id="${id}_s" aria-label="${esc(f.label)}">${opts(list.map(o=>[o.id,o.name+(o.shortName?' ('+o.shortName+')':'')]),ov,'— Chọn từ danh mục '+what+' —')}</select><button type="button" class="btn sm" data-orgnew>+ Thêm ${what}</button></div>
        <div class="orgnew"${nw?'':' hidden'}><div class="small muted">${nw?`Tên ${what} đang ghi chưa có trong danh mục; khi lưu sẽ thêm vào danh mục ${what} (hoặc bấm Chọn từ danh mục):`:`${esc(what.charAt(0).toUpperCase()+what.slice(1))} mới, được lưu vào danh mục ${what}:`}</div>
        <input id="${id}_n" type="text" value="${esc(nw?nw.name||'':'')}" placeholder="Tên đầy đủ theo giấy chứng nhận đăng ký doanh nghiệp, hoặc tên liên danh"><div class="orgnew-2"><input id="${id}_sn" type="text" placeholder="Tên viết tắt"><input id="${id}_mst" type="text" placeholder="Mã số thuế"></div>
        ${f.kind==='gs'?'':`<label class="small"><input type="checkbox" id="${id}_m"> Thành viên hệ sinh thái</label>`}<button type="button" class="btn sm ghost" data-orgback>← Chọn từ danh mục</button></div></div>${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}`; break; }
    default: { const sg=fieldSuggest(f);
      input=`<input id="${id}" type="text" value="${esc(val)}" placeholder="${esc(f.ph||'')}"${sg.length?` list="${id}_dl" autocomplete="off"`:''}>${sg.length?`<datalist id="${id}_dl">${sg.map(o=>`<option value="${esc(o)}"></option>`).join('')}</datalist><div class="chips" data-chips-for="${id}">${sg.slice(0,12).map(o=>`<button type="button" class="chip${o===val?' on':''}" data-chip="${esc(o)}" title="Chọn nhanh">${esc(o)}</button>`).join('')}</div>`:''}${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}`; }
  }
  return `<div class="${cls}"><label for="${id}">${esc(f.label)}${req}</label>${input}</div>`;
}
function openModal(html, narrow){
  const ov=$('#ov'); ov.innerHTML=html; ov.hidden=false;
  fitTables(ov); comboWire(ov);
  const first=ov.querySelector('input:not([type=checkbox]):not([type=file]):not(.combo-in),select:not(.combo-src),textarea'); /* Bản 1.8.9: không tự chọn ô gõ để tìm (tránh bôi đen cả dòng khi mở biểu mẫu) */ if(first) setTimeout(()=>first.focus(),30);
  return ov;
}
function closeModal(){ const ov=$('#ov'); ov.hidden=true; ov.innerHTML=''; if(S.dirty){ S.dirty=false; render(); } }
function openForm({title, fields, value={}, onSave, narrow, wide, submit='Lưu', wf}){
  /* Bản 1.8: biểu mẫu hồ sơ có quy trình duyệt: Lưu nháp / Lưu và chuyển duyệt */
  const wfSend = wf && WF[wf] && wfOn(wf, value.id? WF[wf].pid(value) : S.pid||null) && (!value.id || wfStatus(wf,value)===WF[wf].draft) && (can(WF[wf].mod,'edit')||can(WF[wf].mod,'approve'));
  if(wfSend && submit==='Lưu') submit='Lưu nháp';
  /* Bản 1.8.9: hồ sơ đã có thì kèm mục Lịch sử thay đổi (ai, lúc nào, sửa gì) */
  const hcol = value.id && typeof recHistBox==='function' ? COLS.find(c=>!['logs','approvals','attachments','guides'].includes(c) && get(c, value.id)) : null;
  const ov=openModal(`<form class="mform ${narrow?'narrow':''} ${wide?'wide':''}" id="mform" novalidate><header><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div class="fgrid">${fields.map(f=>fieldHTML(f, value[f.key], value)).join('')}${hcol?`<div class="fld full">${recHistBox(hcol, value.id)}</div>`:''}</div><footer><span class="small muted" id="mform_err" style="flex:1;color:var(--red)"></span><button type="button" class="btn ghost" data-close>Hủy</button><button class="btn ${wfSend?'':'primary'}" type="submit">${esc(submit)}</button>${wfSend?'<button class="btn primary" type="submit" data-send="1">Lưu và chuyển duyệt</button>':''}</footer></form>`);
  if(hcol) recHistWire(ov);
  ov.querySelectorAll('[data-money]').forEach(inp=>inp.addEventListener('input',()=>{ const h=$('#'+inp.id+'_h'); if(h) h.textContent=inp.value?fmtVND(inp.value)+' đồng':''; }));
  const form=$('#mform');
  fields.filter(f=>f.type==='attach').forEach(f=>attachWire($('#f_'+f.key)));
  fields.filter(f=>f.type==='org').forEach(f=>{ const box=$('#f_'+f.key); if(!box) return; const nb=$('.orgnew',box), row=$('.orgpick-row',box);
    const mode=on=>{ nb.hidden=!on; row.hidden=on; if(on) setTimeout(()=>$('#f_'+f.key+'_n').focus(),20); };
    box.addEventListener('click',e=>{ if(e.target.closest('[data-orgnew]')){ e.preventDefault(); mode(true); } else if(e.target.closest('[data-orgback]')){ e.preventDefault(); mode(false); } }); });
  ov.querySelectorAll('[data-chips-for]').forEach(box=>{ const inp=$('#'+box.dataset.chipsFor); const mark=()=>box.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on', normKey(c.dataset.chip)===normKey(inp.value)));
    box.addEventListener('click',e=>{ const c=e.target.closest('[data-chip]'); if(!c) return; e.preventDefault(); inp.value=c.dataset.chip; inp.dispatchEvent(new Event('input',{bubbles:true})); mark(); }); inp.addEventListener('input',mark); });
  /* Ô chọn phụ thuộc ô khác (dep): đổi ô gốc thì nạp lại danh sách */
  fields.filter(f=>f.dep && f.type==='select').forEach(f=>{ const src=$('#f_'+f.dep), el=$('#f_'+f.key); if(!src||!el) return;
    const fill=()=>{ const cur=el.value; el.innerHTML=opts(f.options(src.value), cur, f.req?null:'— Chọn —'); if(el._cbSync) el._cbSync(); else comboWire(el.parentNode); };
    fill(); src.addEventListener('change', fill); });
  form.onsubmit=async e=>{
    e.preventDefault(); const send=!!(e.submitter && e.submitter.dataset.send);
    const v={...value}; const err=$('#mform_err'); err.textContent='';
    for(const f of fields){
      if(f.type==='html') continue;
      const el=$('#f_'+f.key);
      if(f.type==='attach'){ const n=el._keep()+el._files.length; if(f.req && !n){ err.textContent='Vui lòng đính kèm "'+f.label+'".'; return; } continue; }
      if(f.type==='org'){ const nb=$('.orgnew',el);
        if(!nb.hidden){ const nm=$('#f_'+f.key+'_n').value.replace(/\s+/g,' ').trim(); if(!nm){ err.textContent='Vui lòng nhập tên '+(f.kind==='gs'?'đơn vị giám sát':'nhà thầu')+' mới.'; $('#f_'+f.key+'_n').focus(); return; }
          v[f.key]={_new:{name:nm, shortName:$('#f_'+f.key+'_sn').value.trim(), taxCode:$('#f_'+f.key+'_mst').value.trim(), member:!!($('#f_'+f.key+'_m')||{}).checked, kind:f.kind||'nt'}}; }
        else v[f.key]=$('#f_'+f.key+'_s').value;
        if(f.req && !v[f.key]){ err.textContent='Vui lòng chọn "'+f.label+'".'; return; } continue; }
      if(f.type==='checks') v[f.key]=$$('input:checked',el).map(i=>i.value);
      else if(f.type==='files') v[f.key]=[...el.files];
      else if(f.type==='password') v[f.key]=el.value;
      else if(f.keepLines) v[f.key]=el.value.replace(/[ \t]+\n/g,'\n').trim(); /* Bản 1.10: giữ xuống dòng (nội dung thông báo, kết luận cuộc họp) */
      else if(f.type==='works'){ const r=worksRead(el); if(r.err){ err.textContent=r.err; return; } v[f.key]=r.text; }
      else if(['money','number','percent'].includes(f.type)) v[f.key]= el.value===''? null : Number(el.value);
      else { v[f.key]=el.value.replace(/\s+/g,' ').trim(); if(f.suggest && v[f.key]){ const hit=fieldSuggest(f).find(o=>normKey(o)===normKey(v[f.key])); if(hit) v[f.key]=hit; } }
      if(f.req && (v[f.key]==null || v[f.key]==='' || (Array.isArray(v[f.key])&&!v[f.key].length))){ err.textContent='Vui lòng nhập "'+f.label+'".'; el.focus&&el.focus(); return; }
      if(f.type==='percent' && v[f.key]!=null && (v[f.key]<0||v[f.key]>100)){ err.textContent='"'+f.label+'" phải từ 0 đến 100.'; return; }
    }
    const btn=send? e.submitter : form.querySelector('[type=submit]'), lb0=btn.textContent; btn.disabled=true; btn.textContent='Đang lưu…';
    try{ const r=await onSave(v); if(r===false){ btn.disabled=false; btn.textContent=lb0; return; }
      const atf=fields.filter(f=>f.type==='attach');
      if(atf.length){ const failed=await attachApply(atf, r, v, btn); if(failed){ closeModal(); toast('Đã lưu dữ liệu nhưng '+failed,'err'); return; } }
      closeModal(); toast('Đã lưu');
      const rid=r && (r.id || (typeof r==='string'? r : null));
      if(send && rid && get(wf,rid)) setTimeout(()=>ACT.wf(wf+'|'+rid+'|submit'), 60); }
    catch(ex){ console.error(ex); err.textContent=errText(ex); btn.disabled=false; btn.textContent=lb0; }
  };
}
function confirmBox(msg, okText='Xóa'){
  return new Promise(res=>{
    openModal(`<div class="mform narrow"><header><h3>Xác nhận</h3></header><div style="padding:16px">${msg}</div><footer><button class="btn ghost" id="cf_no">Hủy</button><button class="btn primary" id="cf_ok" style="background:var(--red);border-color:var(--red);color:#fff">${esc(okText)}</button></footer></div>`);
    $('#cf_no').onclick=()=>{closeModal();res(false)}; $('#cf_ok').onclick=()=>{closeModal();res(true)};
  });
}

/* Ảnh và tệp: lưu vào kho tệp trên máy chủ (App_Data/files), tối đa 500 MB mỗi tệp */
function downscale(file, max=1920, q=.82){
  return new Promise((res,rej)=>{ const url=URL.createObjectURL(file); const img=new Image(); img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('Không đọc được ảnh'));}; img.onload=()=>{ URL.revokeObjectURL(url); const k=Math.min(1,max/Math.max(img.width,img.height)); if(k===1 && file.size<1.5e6) return res(file); const c=document.createElement('canvas'); c.width=Math.round(img.width*k); c.height=Math.round(img.height*k); c.getContext('2d').drawImage(img,0,0,c.width,c.height); c.toBlob(b=>res(b? new File([b], file.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'}) : file),'image/jpeg',q); }; img.src=url; });
}
async function uploadFile(file){ const fd=new FormData(); fd.append('file',file); return api('POST','/api/files',fd); }
async function storePhoto(file){
  let f=file; try{ if(/^image\/(jpeg|png|webp)/.test(file.type)) f=await downscale(file); }catch{}
  const r=await uploadFile(f); return {assetId:r.id, url:r.url, name:file.name};
}
async function storeFile(file){ const r=await uploadFile(file); return {assetId:r.id, url:r.url}; }
const fileUrl = o => o.url || (o.assetId? '/api/files/'+o.assetId : '');

/* ===== Tệp đính kèm dùng chung cho mọi màn hình nhập liệu =====
   Trường biểu mẫu {type:'attach', col, kind?, ref?/refFrom?, rid?, photo?, accept?}:
   - col: loại bản ghi nhận tệp (mặc định là bản ghi của biểu mẫu); rid(r,v): mã bản ghi nhận tệp sau khi lưu
   - kind: loại tài liệu; ref / refFrom: tham chiếu phụ (đợt nghiệm thu, ngày cập nhật…)
   - Tệp mới được tải lên sau khi lưu bản ghi; tệp gỡ ra chuyển vào thùng rác (quản trị khôi phục được 30 ngày) */
const ATT_ACCEPT = '.pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.dwg,.zip,.rar,.7z,.mpp,.xml,.txt';
const VIDEO_ACCEPT = 'video/*,.mp4,.webm,.mov';
function atts(col, id, kind, ref){ if(!id) return []; return D('attachments').filter(a=>a.collection===col && a.recordId===id && (kind==null||a.kind===kind) && (ref==null||(a.ref||'')===ref)).sort(by('uploadedAt')); }
const attUrl = a => '/api/files/'+encodeURIComponent(a.fileId);
const AICO={"clip": "<svg class=\"aico\" viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9\"/></svg>", "img": "<svg class=\"aico\" viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><circle cx=\"9\" cy=\"10\" r=\"2\"/><path d=\"M21 16l-5-5-9 9\"/></svg>", "doc": "<svg class=\"aico\" viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z\"/><path d=\"M14 3v6h6\"/></svg>", "cam": "<svg class=\"aico\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 8h3l2-3h6l2 3h3v11H4z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/></svg>"};
const attIcon = a => /^image\//.test(a.contentType)?AICO.img:/pdf|word|sheet|excel|text/.test(a.contentType)?AICO.doc:AICO.clip;
function attMeta(a){ return `${fmtSize(a.size)} · ${esc(a.uploadedBy||'')} · ${fmtDT(a.uploadedAt)}`; }
/* Danh sách tệp gọn để hiển thị trong trang (bấm để xem; ảnh mở khung xem nhanh) */
function attLinks(list, opt={}){
  if(!list.length) return opt.empty ?? '<span class="muted small">Chưa đính kèm</span>';
  const max=opt.max||99; const shown=list.slice(0,max);
  return `<span class="attl">${shown.map(a=>`<a href="${attUrl(a)}" target="_blank" rel="noopener" ${/^image\//.test(a.contentType)?`data-act="att-view" data-id="${esc(a.id)}"`:isPdf(a)?pdfAttr(attUrl(a),a.fileName):''} title="${esc(a.fileName)} · ${attMeta(a)}">${attIcon(a)} ${esc(a.fileName)}</a>`).join('')}${list.length>max?`<button class="btn sm ghost" data-act="att-all" data-id="${esc(list.map(a=>a.id).join(','))}">+${list.length-max} tệp</button>`:''}</span>`;
}
/* Ô "Tệp" trong bảng: 1 tệp hiện tên, nhiều tệp hiện số lượng (bấm xem danh sách) */
function attCell(list, btnOnly){ if(!list.length) return '<span class="muted small">—</span>'; if(list.length===1 && !btnOnly) return attLinks(list); return `<button class="btn sm ghost" data-act="att-all" data-id="${esc(list.map(a=>a.id).join(','))}">${AICO.clip} ${list.length} tệp</button>`; }
function attachHTML(f, rec){
  const rid=f.cur!==undefined? f.cur : rec.id;
  const ref=f.ref!=null? f.ref : (f.refFrom? (rec[f.refFrom]||'') : null);
  const cur=rid? atts(f.col, rid, f.kind, ref) : [];
  return `<div class="attbox" id="f_${f.key}"><ul class="attlist">${cur.map(a=>`<li data-aid="${esc(a.id)}"><a href="${attUrl(a)}" target="_blank" rel="noopener" ${isPdf(a)?pdfAttr(attUrl(a),a.fileName):''}>${attIcon(a)} ${esc(a.fileName)}</a><span class="small muted">${attMeta(a)}</span><button type="button" class="btn sm ghost" data-attdel title="Gỡ tệp này">Gỡ</button></li>`).join('')}</ul>
    <label class="attdrop"><input type="file" multiple accept="${esc(f.accept||ATT_ACCEPT)}"><span>${f.photo?AICO.cam+' Chụp ảnh / chọn ảnh':AICO.clip+' Chọn tệp'} hoặc kéo thả vào đây</span></label><ul class="attlist attnew"></ul>${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}</div>`;
}
function attachWire(box){
  box._files=[]; box._del=new Set();
  box._keep=()=>$$('li[data-aid]',box).filter(li=>!box._del.has(li.dataset.aid)).length;
  const inp=$('input[type=file]',box), lst=$('.attnew',box);
  const draw=()=>{ lst.innerHTML=box._files.map((f,i)=>`<li><span>${/^image\//.test(f.type)?AICO.img:AICO.clip} ${esc(f.name)}</span><span class="small muted">${fmtSize(f.size)} · sẽ tải lên khi lưu</span><button type="button" class="btn sm ghost" data-i="${i}">Bỏ</button></li>`).join(''); };
  const add=fl=>{ for(const f of fl){ if(f.size>500*1024*1024){ toast('Tệp '+f.name+' vượt quá 500 MB.','err'); continue; } box._files.push(f); } draw(); };
  inp.onchange=()=>{ add([...inp.files]); inp.value=''; };
  const drop=$('.attdrop',box);
  drop.addEventListener('dragover',e=>{ e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave',()=>drop.classList.remove('over'));
  drop.addEventListener('drop',e=>{ e.preventDefault(); drop.classList.remove('over'); add([...e.dataTransfer.files]); });
  box.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.i!=null){ box._files.splice(+b.dataset.i,1); draw(); }
    else if(b.hasAttribute('data-attdel')){ const li=b.closest('li'); const id=li.dataset.aid;
      if(box._del.has(id)){ box._del.delete(id); li.classList.remove('del'); b.textContent='Gỡ'; } else { box._del.add(id); li.classList.add('del'); b.textContent='Hoàn tác'; } }
  });
}
async function uploadAttachment(file, col, rid, kind, ref, photo){
  let f=file; if(photo){ try{ if(/^image\/(jpeg|png|webp)/.test(file.type)) f=await downscale(file); }catch{} }
  const fd=new FormData(); fd.append('file',f, photo&&f!==file? f.name : file.name); fd.append('collection',col); fd.append('recordId',rid); if(kind) fd.append('kind',kind); if(ref) fd.append('ref',ref);
  const a=await api('POST','/api/attachments',fd); Store.data.attachments.push(a); return a;
}
/* Sau khi lưu bản ghi: gỡ tệp đánh dấu và tải tệp mới. Trả về thông báo lỗi (nếu có) */
async function attachApply(fields, r, v, btn){
  const errs=[]; let total=0, done=0;
  fields.forEach(f=>{ total+=$('#f_'+f.key)._files.length; });
  for(const f of fields){
    const box=$('#f_'+f.key);
    for(const id of box._del){ try{ await api('DELETE','/api/attachments/'+encodeURIComponent(id)); Store.data.attachments=Store.data.attachments.filter(a=>a.id!==id); }catch(ex){ errs.push(errText(ex)); } }
    if(!box._files.length) continue;
    const rid=typeof f.rid==='function'? f.rid(r,v) : (f.rid || (r&&r.id) || v.id);
    if(!rid){ errs.push('chưa xác định được bản ghi để đính kèm tệp'); continue; }
    const ref=f.ref!=null? f.ref : (f.refFrom? (v[f.refFrom]||'') : '');
    for(const file of box._files){
      if(btn) btn.textContent=`Đang tải tệp ${++done}/${total}…`;
      try{ await uploadAttachment(file, f.col, rid, f.kind, ref, f.photo); }catch(ex){ errs.push(file.name+': '+errText(ex)); }
    }
  }
  onData(); Store.soon();
  return errs.length? 'có '+errs.length+' tệp lỗi ('+errs[0]+')' : '';
}
/* Biểu mẫu nhỏ chỉ để đính kèm tệp vào một bản ghi có sẵn */
function attachForm(title, col, rid, kind, opt={}){
  openForm({title, narrow:true, value:{id:rid}, fields:[{key:'att',label:opt.label||'Tệp đính kèm',type:'attach',col,kind,ref:opt.ref,photo:opt.photo,accept:opt.accept,full:true,rid}], onSave:()=>({id:rid})});
}

/* Xuất tệp (Excel/JSON) */
async function saveFile(filename, data){
  try{ const blob=data instanceof Blob?data:new Blob([data]); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); toast('Đã tạo tệp '+filename); }
  catch(e){ toast('Trình duyệt không cho phép tải tệp.','err'); }
}
/* Bản 1.7: tệp Excel có định dạng (ExcelJS, giấy phép MIT, đóng gói kèm phần mềm, chỉ tải khi cần).
   sheets: [{name, title, sub, head, rows, money:[chỉ số cột tiền], total:true nếu dòng cuối là dòng tổng}] */
const LIBS={};
function loadLib(src, test){
  if(test()) return Promise.resolve();
  return LIBS[src] || (LIBS[src]=new Promise((ok,no)=>{ const el=document.createElement('script'); el.src=src; el.onload=()=>test()?ok():no(new Error('lib')); el.onerror=()=>{ delete LIBS[src]; no(new Error('Không tải được thư viện '+src)); }; document.head.appendChild(el); }));
}
const loadExcel = () => loadLib('/lib/exceljs.min.js', ()=>!!window.ExcelJS);
const XL = {font:'Times New Roman', head:'FF1F4E79', headInk:'FFFFFFFF', band:'FFF3F6FA', line:'FFB7C3D0', money:'#,##0', num:'#,##0.##'};
/* Ô văn bản dạng số kiểu Việt Nam thành số thật để Excel tính được (SUM, nhân đơn giá…):
   1 · 55 · 1.600.000 · 0,55 · 1.250,5 · 75% (thành 0,75 định dạng %). Cột mã hiệu, số hiệu, điện thoại… giữ nguyên dạng chữ. */
const XL_TEXT_COL = /^(mã|ký hiệu|số hiệu|số hợp đồng|số hồ sơ|số văn bản|số quyết định|số qđ|điện thoại|tên đăng nhập|đợt|stt)/i;
function numParse(s){
  if(/^[-+]?(0|[1-9]\d{0,14})$/.test(s)) return Number(s);
  if(/^[-+]?\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,''));
  if(/^[-+]?(\d{1,3}(\.\d{3})+|\d+),\d+$/.test(s)) return Number(s.replace(/\./g,'').replace(',','.'));
  return null; }
function numCell(v, head){ if(typeof v==='number') return v; if(head && XL_TEXT_COL.test(String(head))) return v;
  const s=String(v==null?'':v).trim(); if(!s) return v;
  const n=numParse(s); if(n!=null) return n;
  const m=/^([-+]?[\d.,]+)\s*%$/.exec(s); if(m){ const x=numParse(m[1]); if(x!=null) return {pct:x/100}; }
  return v; }
/* Số nguyên không có phần thập phân thừa, số lẻ giữ phần thập phân, có phân cách hàng nghìn */
const xlFmt = (n, money) => money? '#,##0' : Number.isInteger(n)? '#,##0' : '#,##0.0##';
const xlPctFmt = p => Number.isInteger(Math.round(p*1e5)/1e3)? '0%' : '0.0#%';
const XL_CENTER_COL = /^(stt|mã|ký hiệu|số hiệu|đvt|đơn vị tính|ngày|tháng|quý|thời hạn|gói thầu|gói|dự án|hợp đồng|số hợp đồng|số hồ sơ|trạng thái|tình trạng|đợt|mức độ|hạn)/i;
const xlCenter = (head, v) => { const t=String(v??''); return /^\d{2}\/\d{2}\/\d{4}/.test(t) || (XL_CENTER_COL.test(String(head||'')) && t.length<=24); };
function xlBorder(c, strong){ const t={style:'thin', color:{argb:XL.line}}; c.border={top:t,left:t,bottom:strong?{style:'double',color:{argb:'FF333333'}}:t,right:t}; }
/** Một trang tính chuẩn văn phòng: tên đơn vị, tên báo cáo gộp ô, dòng tiêu đề tô màu, kẻ khung, số có phân cách hàng nghìn, dòng tổng in đậm. */
function xlSheet(wb, s){
  const ws=wb.addWorksheet(String(s.name||'Trang 1').slice(0,31), {views:[{state:'frozen', ySplit:5}], pageSetup:{paperSize:9, orientation:s.head.length>7?'landscape':'portrait', fitToPage:true, fitToWidth:1, fitToHeight:0}});
  const n=s.head.length, money=s.money||[];
  ws.mergeCells(1,1,1,n); const o=ws.getCell(1,1); o.value=(BR.reportOrg||BR.orgShort||'').toUpperCase(); o.font={name:XL.font, size:11, bold:true};
  ws.mergeCells(2,1,2,n); const t=ws.getCell(2,1); t.value=s.title; t.font={name:XL.font, size:14, bold:true}; t.alignment={horizontal:'center'};
  ws.mergeCells(3,1,3,n); const u=ws.getCell(3,1); u.value=s.sub||''; u.font={name:XL.font, size:11, italic:true}; u.alignment={horizontal:'center'};
  const hr=ws.getRow(5); s.head.forEach((h,i)=>{ const c=hr.getCell(i+1); c.value=h; c.font={name:XL.font, bold:true, color:{argb:XL.headInk}}; c.fill={type:'pattern', pattern:'solid', fgColor:{argb:XL.head}}; c.alignment={horizontal:'center', vertical:'middle', wrapText:true}; xlBorder(c); });
  hr.height=32;
  s.rows.forEach((r,ri)=>{ const row=ws.getRow(6+ri); const last=s.total && ri===s.rows.length-1;
    r.forEach((v,i)=>{ const c=row.getCell(i+1); let nv=numCell(v, s.head[i]); const isP=nv&&typeof nv==='object'&&'pct' in nv; if(isP) nv=nv.pct; const isN=typeof nv==='number';
      c.value=(nv===''||nv==null)?null:nv; c.font={name:XL.font, bold:last};
      /* Số căn phải, định dạng theo quy tắc Việt Nam; ngày, mã hiệu, ĐVT căn giữa; diễn giải căn trái */
      if(isN){ c.alignment={horizontal:'right', vertical:'top'}; c.numFmt=isP? xlPctFmt(nv) : xlFmt(nv, money.includes(i)); }
      else if(xlCenter(s.head[i], v)) c.alignment={horizontal:'center', vertical:'top', wrapText:true};
      else c.alignment={vertical:'top', wrapText:typeof v==='string' && v.length>30};
      if(!last && ri%2===1) c.fill={type:'pattern', pattern:'solid', fgColor:{argb:XL.band}};
      xlBorder(c, last); }); });
  s.head.forEach((h,i)=>{ const w=Math.max(String(h).length*0.9, ...s.rows.slice(0,300).map(r=>{ const v=r[i]; return typeof v==='number'? (money.includes(i)?fmtVND(v).length+2:String(v).length+1) : String(v??'').length; })); ws.getColumn(i+1).width=Math.max(9, Math.min(48, w+2)); });
  if(s.foot){ const fr=ws.getRow(7+s.rows.length); ws.mergeCells(fr.number,1,fr.number,n); fr.getCell(1).value=s.foot; fr.getCell(1).font={name:XL.font, italic:true, size:10}; }
  return ws;
}
async function exportXlsx(filename, sheets){
  try{ await loadExcel(); }catch(e){ toast('Không tải được thư viện Excel, thử lại sau.','err'); return; }
  const wb=new ExcelJS.Workbook(); wb.creator=BR.appName||'QLDA'; wb.created=new Date();
  sheets.forEach(s=>xlSheet(wb, s));
  const out=await wb.xlsx.writeBuffer();
  saveFile(filename, new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
}
/** Xuất JSON (báo cáo kinh tế kỹ thuật, trang 78): mỗi dòng là một đối tượng theo tên cột. */
function exportJson(filename, s){
  const rows=s.rows.map(r=>Object.fromEntries(s.head.map((h,i)=>[h, r[i]===undefined?null:r[i]])));
  saveFile(filename, new Blob([JSON.stringify({tieuDe:s.title, ghiChu:s.sub||'', ngayXuat:TODAY, soDong:rows.length, duLieu:rows}, null, 2)],{type:'application/json'}));
}

/* Bản 1.7: xem trước tệp PDF ngay trên phần mềm (Mozilla PDF.js, giấy phép Apache 2.0, đóng gói kèm phần mềm nên chạy được trong mạng nội bộ) */
const isPdf = a => /pdf/i.test(a.contentType||'') || /\.pdf$/i.test(a.fileName||a.name||'');
const pdfAttr = (url, name) => `data-act="att-pdf" data-id="${esc(url+'|'+(name||''))}"`;
async function pdfView(key){
  const i=key.indexOf('|'), url=key.slice(0,i), name=key.slice(i+1)||'Tệp PDF';
  const ov=openModal(`<div class="mform pdfv"><header><h3 title="${esc(name)}">${esc(name)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header>
    <div class="pdfbar"><button type="button" class="btn sm ghost" data-pdf="prev" aria-label="Trang trước">‹</button><span class="small num" id="pdf_pg">…</span><button type="button" class="btn sm ghost" data-pdf="next" aria-label="Trang sau">›</button>
      <span style="flex:1"></span><button type="button" class="btn sm ghost" data-pdf="out" aria-label="Thu nhỏ">−</button><span class="small num" id="pdf_z">100%</span><button type="button" class="btn sm ghost" data-pdf="in" aria-label="Phóng to">+</button><button type="button" class="btn sm ghost" data-pdf="fit">Vừa khung</button>
      <a class="btn sm" href="${esc(url)}?download=true">Tải về</a><button type="button" class="btn sm" data-pdf="print">In</button></div>
    <div class="pdfpages" id="pdf_box"><p class="muted" style="padding:20px">Đang mở tệp…</p></div></div>`);
  let doc, zoom=0, page=1; const box=$('#pdf_box',ov);
  try{ await loadLib('/lib/pdfjs/pdf.min.js', ()=>!!window.pdfjsLib); pdfjsLib.GlobalWorkerOptions.workerSrc='/lib/pdfjs/pdf.worker.min.js';
    doc=await pdfjsLib.getDocument({url, withCredentials:true}).promise; }
  catch(e){ box.innerHTML=`<div class="alert bad" style="margin:16px">Không xem trước được tệp này. Bấm <b>Tải về</b> để mở bằng phần mềm trên máy.</div>`; return; }
  const draw=async()=>{ const first=await doc.getPage(1); const w0=first.getViewport({scale:1}).width; const fit=Math.max(.3,(box.clientWidth-24)/w0); const sc=zoom||fit;
    $('#pdf_z',ov).textContent=Math.round(sc*100)+'%'; box.innerHTML='';
    for(let n=1;n<=doc.numPages;n++){ const pg=await doc.getPage(n); const vp=pg.getViewport({scale:sc*(window.devicePixelRatio||1)});
      const c=document.createElement('canvas'); c.width=vp.width; c.height=vp.height; c.style.width=(vp.width/(window.devicePixelRatio||1))+'px'; c.dataset.pg=n; box.appendChild(c);
      await pg.render({canvasContext:c.getContext('2d'), viewport:vp}).promise; if(!ov.contains(box)) return; }
    upd(); };
  const upd=()=>{ $('#pdf_pg',ov).textContent=`Trang ${page} / ${doc.numPages}`; };
  box.addEventListener('scroll',()=>{ const cs=[...box.querySelectorAll('canvas')]; const top=box.scrollTop+40; const hit=cs.filter(c=>c.offsetTop<=top).pop(); if(hit){ page=+hit.dataset.pg; upd(); } });
  const go=n=>{ page=Math.max(1,Math.min(doc.numPages,n)); const c=box.querySelector(`canvas[data-pg="${page}"]`); if(c) box.scrollTop=c.offsetTop-8; upd(); };
  ov.querySelector('.pdfbar').addEventListener('click',e=>{ const b=e.target.closest('[data-pdf]'); if(!b) return; const a=b.dataset.pdf; const cur=zoom||parseInt($('#pdf_z',ov).textContent)/100;
    if(a==='prev') go(page-1); else if(a==='next') go(page+1);
    else if(a==='in'){ zoom=Math.min(4,cur*1.25); draw(); } else if(a==='out'){ zoom=Math.max(.3,cur/1.25); draw(); } else if(a==='fit'){ zoom=0; draw(); }
    else if(a==='print'){ const w=window.open(url,'_blank'); if(w) w.addEventListener('load',()=>{ try{ w.print(); }catch{} }); } });
  draw();
};

/* --- Biểu đồ SVG --- */
function niceMax(v){ if(v<=0) return 1; const p=Math.pow(10,Math.floor(Math.log10(v))); const n=v/p; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p; }
function barChart({labels, series, h=240, fmt=v=>fmtN(v), max}){
  const W=640, L=58, R=10, T=12, B=48; const ih=h-T-B, iw=W-L-R;
  const mx=max||niceMax(Math.max(1,...series.flatMap(s=>s.values)));
  const gw=iw/Math.max(1,labels.length), bw=Math.min(28,(gw*.72)/series.length);
  let g='';
  for(let i=0;i<=4;i++){ const y=T+ih-ih*i/4; g+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${y+4}" text-anchor="end">${esc(fmt(mx*i/4))}</text>`; }
  labels.forEach((lb,i)=>{
    const x0=L+gw*i+(gw-bw*series.length)/2;
    series.forEach((s,j)=>{ const v=Math.max(0,N(s.values[i])); const bh=ih*Math.min(1,v/mx); g+=`<rect x="${x0+j*bw}" y="${T+ih-bh}" width="${Math.max(1,bw-2)}" height="${Math.max(0,bh)}" rx="2" fill="${s.color}"><title>${esc(lb)}, ${esc(s.name)}: ${esc(fmt(v))}</title></rect>`; });
    // Nhiều cột thì thưa nhãn trục, tránh chữ chồng lên nhau
    /* Bản 1.8.9: nhãn hai phần (mã dự án, mã gói) ghi thành hai dòng cho khỏi chồng chữ */
    const t=String(lb), sp=t.indexOf(' '), two=sp>0 && t.length>8, a=two?t.slice(0,sp):t, b2=two?t.slice(sp+1):'', cut=x=>x.length>14?x.slice(0,13)+'…':x;
    const wch=Math.max(a.length, b2.length), step=Math.ceil(labels.length*Math.min(84,Math.max(40,Math.min(14,wch)*6.8+8))/iw), cx=L+gw*i+gw/2;
    if(i%step===0) g+= two? `<text x="${cx}" y="${T+ih+15}" text-anchor="middle"><tspan x="${cx}">${esc(cut(a))} </tspan><tspan x="${cx}" dy="13">${esc(cut(b2))}</tspan></text>`
      : `<text x="${cx}" y="${T+ih+16}" text-anchor="middle">${esc(cut(t))}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">${g}</svg>${legend(series)}`;
}
function legend(series){ return `<div class="legend">${series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`; }
function lineChart({labels, series, h=240, max=100, fmt=v=>v+'%'}){
  const W=640, L=44, R=26, T=12, B=40; const ih=h-T-B, iw=W-L-R;
  const x=i=>L+(labels.length<=1?0:iw*i/(labels.length-1)), y=v=>T+ih-ih*Math.min(1,v/max);
  let g='';
  for(let i=0;i<=4;i++){ const yy=T+ih-ih*i/4; g+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${L-6}" y="${yy+4}" text-anchor="end">${esc(fmt(max*i/4))}</text>`; }
  const step=Math.ceil(labels.length/8);
  labels.forEach((lb,i)=>{ if(i%step===0||i===labels.length-1) g+=`<text x="${x(i)}" y="${T+ih+16}" text-anchor="middle">${esc(lb)}</text>`; });
  series.forEach(s=>{
    const pts=s.values.map((v,i)=>v==null?null:[x(i),y(v)]).filter(Boolean); if(!pts.length) return;
    if(s.area) g+=`<path d="M${pts[0][0]},${T+ih} ${pts.map(p=>'L'+p[0]+','+p[1]).join(' ')} L${pts[pts.length-1][0]},${T+ih}Z" fill="${s.color}" opacity=".12"/>`;
    g+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.2" ${s.dash?'stroke-dasharray="6 4"':''}/>`;
    const l=pts[pts.length-1]; g+=`<circle cx="${l[0]}" cy="${l[1]}" r="4" fill="${s.color}"/>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">${g}</svg>${legend(series)}`;
}
function donut(items, center){
  const tot=sum(items,'value'); const R=70, r=46, cx=90, cy=90; let a=-Math.PI/2, g='';
  if(!tot) g=`<circle cx="${cx}" cy="${cy}" r="${(R+r)/2}" fill="none" stroke="var(--line)" stroke-width="${R-r}"/>`;
  items.filter(i=>i.value>0).forEach(it=>{
    const da=it.value/tot*Math.PI*2; const a2=a+da-(items.filter(i=>i.value>0).length>1?0.02:0.0001);
    const p=(ang,rad)=>[cx+rad*Math.cos(ang), cy+rad*Math.sin(ang)]; const lg=da>Math.PI?1:0;
    const [x1,y1]=p(a,R),[x2,y2]=p(a2,R),[x3,y3]=p(a2,r),[x4,y4]=p(a,r);
    g+=`<path d="M${x1},${y1} A${R},${R} 0 ${lg} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${lg} 0 ${x4},${y4}Z" fill="${it.color}"><title>${esc(it.label)}: ${it.value}</title></path>`; a+=da;
  });
  g+=`<text x="${cx}" y="${cy-2}" text-anchor="middle" style="font-size:24px;fill:var(--ink);font-family:var(--f-num)">${esc(center??tot)}</text><text x="${cx}" y="${cy+16}" text-anchor="middle">dự án</text>`;
  return `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 180 180" style="width:170px;max-width:100%">${g}</svg><div class="list small">${items.map(i=>`<div><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${i.color};margin-right:6px"></i>${esc(i.label)} <b class="num">${i.value}</b></div>`).join('')}</div></div>`;
}
/* Đường cong S kế hoạch – thực tế theo tháng */
function sCurve(scheds){
  if(!scheds.length) return null;
  const st=scheds.map(s=>s.planStart).sort()[0], en=scheds.map(s=>s.planEnd).sort().slice(-1)[0];
  const months=[]; let d=new Date(st.slice(0,7)+'-01');
  while(isoLocal(d)<=en){ months.push(isoLocal(new Date(d.getFullYear(), d.getMonth()+1, 0))); d=new Date(d.getFullYear(), d.getMonth()+1, 1); if(months.length>60) break; }
  const plan=months.map(m=>wavg(scheds, s=>expectedPct(s,m)));
  const act=months.map(m=>m<=addDays(TODAY,31)? wavg(scheds, s=>progressAt(s, m>TODAY?TODAY:m)) : null);
  return {labels:months.map(m=>m.slice(5,7)+'/'+m.slice(2,4)), plan, act};
}


/* ===== Bản 1.2: ô ngày dd/mm/yyyy, bảng nhập công việc, giao diện sáng/tối ===== */
/** Đọc ngày người dùng gõ theo kiểu Việt Nam: 03/11/2026, 3/11 (năm nay), 3-11-26, 03112026. Trả về yyyy-mm-dd, '' nếu bỏ trống, null nếu sai. */
function parseVNDate(t){
  t=String(t||'').trim(); if(!t) return '';
  let d,m,y;
  if(/^\d+$/.test(t)){
    if(t.length===8){ d=t.slice(0,2); m=t.slice(2,4); y=t.slice(4); }
    else if(t.length===6){ d=t.slice(0,2); m=t.slice(2,4); y='20'+t.slice(4); }
    else if(t.length===4){ d=t.slice(0,2); m=t.slice(2,4); y=TODAY.slice(0,4); }
    else return null;
  } else {
    const p=t.split(/[\/\-.\s]+/).filter(Boolean); if(p.length<2||p.length>3||p.some(x=>!/^\d+$/.test(x))) return null;
    [d,m,y]=p; if(!y) y=TODAY.slice(0,4); if(y.length===2) y='20'+y;
  }
  d=+d; m=+m; y=+y;
  if(!(y>=1900 && y<=2100 && m>=1 && m<=12 && d>=1 && d<=31)) return null;
  const dt=new Date(y,m-1,d); if(dt.getMonth()!==m-1) return null;
  return y+'-'+pad(m)+'-'+pad(d);
}
/** Ô ngày của trình duyệt hiển thị theo ngôn ngữ máy (máy tiếng Anh ra mm/dd/yyyy). Mọi ô type="date" được thay bằng ô chữ
 *  luôn hiển thị dd/mm/yyyy kèm nút lịch; ô gốc vẫn giữ giá trị yyyy-mm-dd nên các biểu mẫu, bộ lọc đọc dữ liệu như cũ. */
function enhanceDate(inp){
  if(inp.dataset.dx) return; inp.dataset.dx='1';
  const w=document.createElement('span'); w.className='dx';
  const t=document.createElement('input'); t.type='text'; t.inputMode='numeric'; t.placeholder='dd/mm/yyyy'; t.autocomplete='off'; t.className='dx-t'; t.maxLength=10;
  if(inp.id){ t.id=inp.id+'_t'; const lb=document.querySelector(`label[for="${inp.id}"]`); if(lb) lb.htmlFor=t.id; }
  const al=inp.getAttribute('aria-label') || (inp.closest('label')&&inp.closest('label').textContent.trim()); if(al) t.setAttribute('aria-label', al);
  const b=document.createElement('button'); b.type='button'; b.className='dx-b'; b.tabIndex=-1; b.title='Chọn ngày trên lịch'; b.setAttribute('aria-label','Chọn ngày trên lịch');
  b.innerHTML=ic('cal').replace('<svg','<svg width="16" height="16"');
  inp.parentNode.insertBefore(w,inp); w.append(t,b,inp); inp.classList.add('dx-n'); inp.tabIndex=-1; inp.setAttribute('aria-hidden','true');
  const show=()=>{ t.value=inp.value? fmtDate(inp.value) : ''; t.classList.remove('bad'); t.removeAttribute('title'); };
  const fire=()=>{ inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true})); };
  const commit=()=>{ const iso=parseVNDate(t.value);
    if(iso===null){ t.classList.add('bad'); t.title='Ngày không hợp lệ. Nhập theo dạng ngày/tháng/năm, ví dụ 03/11/2026'; if(inp.value){ inp.value=''; fire(); } return; }
    if(inp.value!==iso){ inp.value=iso; fire(); } show(); };
  show();
  t.addEventListener('input', e=>{ if(e.inputType==='insertText' && /^\d{2}$|^\d{1,2}\/\d{2}$/.test(t.value)) t.value+='/'; });
  t.addEventListener('change', commit);
  t.addEventListener('keydown', e=>{ if(e.key==='Enter') commit(); });
  b.addEventListener('click', ()=>{ try{ inp.showPicker(); }catch{ t.focus(); } });
  inp.addEventListener('change', ()=>{ if(document.activeElement!==t) show(); });
}
new MutationObserver(()=>document.querySelectorAll('input[type=date]:not([data-dx])').forEach(enhanceDate)).observe(document.documentElement,{childList:true,subtree:true});

/** Bảng nhập "Công việc thực hiện" của nhật ký: mỗi dòng Công việc · Khối lượng · Đơn vị, có thêm/xóa dòng.
 *  Vẫn lưu dạng văn bản "Nội dung | Khối lượng | Đơn vị" mỗi dòng như bản trước nên nhật ký cũ đọc được ngay. */
function worksParse(t){ return String(t||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{ const [name,qty,unit]=l.split('|').map(x=>(x||'').trim()); return {name,qty,unit}; }); }
function worksRow(r={}){ const q=r.qty==null?'':String(r.qty).replace(',','.');
  return `<div class="wk-row"><input class="wk-n" placeholder="${XD('Công việc, vị trí thi công','Công việc, nội dung triển khai')}" value="${esc(r.name||'')}" aria-label="Công việc">
    <input class="wk-q" inputmode="decimal" placeholder="Khối lượng" value="${esc(q)}" aria-label="Khối lượng"><input class="wk-u" placeholder="Đơn vị" value="${esc(r.unit||'')}" list="wk_units" aria-label="Đơn vị">
    <button type="button" class="btn sm ghost danger wk-del" title="Xóa dòng" aria-label="Xóa dòng">×</button></div>`; }
function worksHTML(id, val, f){
  const rows=worksParse(val); if(!rows.length) rows.push({});
  const units=[...new Set(['m','m2','m3','tấn','kg','cái','bộ','công','ca',...D('boq').map(b=>b.unit).filter(Boolean)])];
  return `<div class="wk" id="${id}"><div class="wk-h"><span>Công việc</span><span>Khối lượng</span><span>Đơn vị</span><span></span></div><div class="wk-body">${rows.map(worksRow).join('')}</div>
    <button type="button" class="btn sm wk-add">+ Thêm dòng</button><datalist id="wk_units">${units.map(u=>`<option value="${esc(u)}">`).join('')}</datalist></div>`;
}
function worksRead(el){
  const rows=[...el.querySelectorAll('.wk-row')].map(r=>({name:r.querySelector('.wk-n').value.trim(), qty:r.querySelector('.wk-q').value.trim().replace(',','.'), unit:r.querySelector('.wk-u').value.trim()})).filter(r=>r.name||r.qty||r.unit);
  const clean=x=>x.replace(/\|/g,'/').replace(/\s+/g,' ');
  for(const r of rows){ if(!r.name) return {err:'Dòng công việc có khối lượng "'+r.qty+'" chưa nhập tên công việc.'}; if(r.qty && !(Number(r.qty)>=0)) return {err:'Khối lượng của "'+r.name+'" phải là số (ví dụ 12.5).'}; }
  return {text: rows.map(r=>[clean(r.name), r.qty, clean(r.unit)].join(' | ').replace(/( \| )+$/,'')).join('\n')};
}
document.addEventListener('click', e=>{
  const a=e.target.closest('.wk-add'); if(a){ const body=a.parentNode.querySelector('.wk-body'); body.insertAdjacentHTML('beforeend', worksRow()); body.lastElementChild.querySelector('.wk-n').focus(); return; }
  const d=e.target.closest('.wk-del'); if(d){ const body=d.closest('.wk-body'); d.closest('.wk-row').remove(); if(!body.children.length) body.insertAdjacentHTML('beforeend', worksRow()); }
});

/* ===== Bản 1.3: tùy chọn giao diện theo từng người dùng =====
   Chế độ sáng/tối, tông màu, kiểu thanh bên, cỡ chữ, mật độ hiển thị. Lưu trên máy chủ theo tài khoản (đăng nhập máy khác vẫn giữ),
   kèm bản sao trên máy để mở ứng dụng là áp dụng ngay, không bị nháy màu. */
const UI_OPTS = {
  style:  {label:'Phong cách', def:'unit', list:[['unit','Theo đơn vị'],['gov','Hành chính'],['tech','Công nghệ']]},
  mode:   {label:'Chế độ hiển thị', def:'auto', list:[['auto','Tự động theo máy'],['light','Sáng'],['dark','Tối']]},
  color:  {label:'Tông màu chủ đạo', def:'unit', list:[['unit','Theo đơn vị'],['navy','Xanh hành chính','#1f5fbf','#0d2a57'],['teal','Xanh ngọc','#0b7a72','#0a3431'],['indigo','Tím than','#4338ca','#1e1b4b'],['green','Xanh lá','#15803d','#0f2f1c'],['earth','Cam đất','#b4490c','#2e1608'],['slate','Than chì','#334155','#111827']]},
  sidebg: {label:'Màu nền menu và trang đăng nhập (phong cách Công nghệ)', def:'unit', list:[['unit','Theo đơn vị'],['peach','Cam nhạt','#f8d6b8','#fdebdc'],['blue','Xanh Tri Thức','#2149a3','#133a8a'],['night','Xanh đêm','#1d2e58','#0d1b3d'],['teal','Xanh ngọc','#175358','#0c3b3f'],['slate','Xám đậm','#323d4f','#1f2937']]},
  side:   {label:'Thanh điều hướng', def:'dark', list:[['dark','Nền đậm theo tông màu'],['light','Nền sáng']]},
  size:   {label:'Cỡ chữ', def:'md', list:[['sm','Nhỏ'],['md','Vừa'],['lg','Lớn'],['xl','Rất lớn']]},
  density:{label:'Mật độ hiển thị', def:'comfy', list:[['comfy','Thoáng'],['compact','Gọn (nhiều dòng hơn)']]}
};
const THEMES=UI_OPTS.mode.list;
const UI = {
  p:{}, _uid:null,
  /* Bản 1.8 trở về trước không có lựa chọn «Theo đơn vị»: màu mặc định cũ (navy) coi như chưa tự chọn */
  clean(o){ const r={}; for(const [k,d] of Object.entries(UI_OPTS)){ const v=o&&o[k]; r[k]=d.list.some(x=>x[0]===v)? v : d.def; }
    if(o && !o.v && r.color==='navy') r.color='unit'; r.v=2; return r; },
  apply(p){
    this.p=this.clean(p); const r=document.documentElement, dark=this.p.mode==='dark' || (this.p.mode==='auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    r.dataset.mode=dark?'dark':'light'; r.dataset.color=this.p.color==='unit'?(BR.color||'navy'):this.p.color; r.dataset.style=this.p.style==='unit'?(BR.style||'gov'):this.p.style; r.dataset.sidebg=this.p.sidebg==='unit'?(BR.sideBg||'peach'):this.p.sidebg; r.dataset.login=BR.loginTpl||'split'; r.dataset.side=this.p.side; r.dataset.size=this.p.size; r.dataset.density=this.p.density;
    if(this.p.mode==='auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme',this.p.mode);
    const mc=document.querySelector('meta[name=theme-color]'); if(mc) setTimeout(()=>{ mc.content=getComputedStyle(r).getPropertyValue('--brand').trim()||'#0d2a57'; },0);
  },
  /* Đọc tùy chọn của người dùng vừa đăng nhập (máy chủ), dùng bản trên máy nếu máy chủ chưa có. */
  async load(user){
    if(!user || this._uid===user.id) return; this._uid=user.id;
    const k='qlda-ui:'+user.id; let p=null; try{ p=JSON.parse(lsGet(k)||'null'); }catch{}
    if(p) this.apply(p);
    try{ const r=await api('GET','/api/auth/ui',undefined,{auth:true}); if(r && r.value){ p=JSON.parse(r.value); this.apply(p); lsSet(k,JSON.stringify(this.p)); lsSet('qlda-ui',JSON.stringify(this.p)); onData(); } }catch{}
  },
  async set(k,v){
    this.apply({...this.p,[k]:v}); const js=JSON.stringify(this.p); lsSet('qlda-ui',js);
    if(S.user){ lsSet('qlda-ui:'+S.user.id,js); try{ await api('PUT','/api/auth/ui',{value:js}); }catch(e){ toast('Chưa lưu được tùy chọn lên máy chủ: '+errText(e),'err'); } }
  },
  reset(){ this._uid=null; }
};
/* Bản 1.2 trở về trước chỉ lưu sáng/tối trên máy: chuyển sang tùy chọn mới */
(()=>{ let p=null; try{ p=JSON.parse(lsGet('qlda-ui')||'null'); }catch{} if(!p){ const t=lsGet('qlda-theme'); p={mode:t||'auto'}; } UI.apply(p); })();
try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{ if(UI.p.mode==='auto'){ UI.apply(UI.p); } }); }catch{}
function themeGet(){ return UI.p.mode; }
function themeApply(m){ UI.apply({...UI.p, mode:m}); }
function themeBtn(){ const m=themeGet(), next=THEMES[(THEMES.findIndex(x=>x[0]===m)+1)%3];
  return `<button class="btn ghost sm theme-btn" data-act="theme" title="Đang dùng: ${esc(THEMES.find(x=>x[0]===m)[1].toLowerCase())} · bấm để chuyển sang ${esc(next[1].toLowerCase())}" aria-label="Đổi chế độ sáng/tối">${ic(m==='auto'?'auto':m==='light'?'sun':'moon').replace('<svg','<svg width="18" height="18"')}</button>`
    + `<button class="btn ghost sm theme-btn ap-btn" data-act="appearance" title="Giao diện: tông màu, cỡ chữ, mật độ" aria-label="Tùy chỉnh giao diện">${ic('palette').replace('<svg','<svg width="18" height="18"')}</button>`; }
/** Hộp thoại Giao diện: chọn là áp dụng ngay, tự lưu theo tài khoản. */
function appearanceHTML(){
  const p=UI.p;
  const seg=(k)=>`<fieldset class="ap-group"><legend>${esc(UI_OPTS[k].label)}</legend><div class="seg" role="radiogroup">${UI_OPTS[k].list.map(([v,l])=>`<label class="${p[k]===v?'on':''}"><input type="radio" name="ap_${k}" value="${v}" data-ap="${k}" ${p[k]===v?'checked':''}><span>${esc(l)}</span></label>`).join('')}</div></fieldset>`;
  const swk=(k,cur)=>{ const L=UI_OPTS[k].list, uc=L.find(x=>x[0]===cur)||L[1];
    return `<fieldset class="ap-group"><legend>${esc(UI_OPTS[k].label)}</legend><div class="swatches" role="radiogroup">${L.map(x=>x[0]==='unit'?['unit','Theo đơn vị ('+uc[1].toLowerCase()+')',uc[2],uc[3]]:x).map(([v,l,a,b])=>`<label class="sw ${p[k]===v?'on':''}"><input type="radio" name="ap_${k}" value="${v}" data-ap="${k}" ${p[k]===v?'checked':''}><span class="chip" style="--a:${a};--b:${b}" aria-hidden="true"><i></i></span><span>${esc(l)}</span></label>`).join('')}</div></fieldset>`; };
  const sw=swk('color',BR.color), sbg=document.documentElement.dataset.style==='tech'?swk('sidebg',BR.sideBg||'peach'):'';
  return `<div class="mform narrow ap" role="dialog" aria-modal="true" aria-labelledby="ap_t"><header><h3 id="ap_t">Giao diện</h3><button class="icon-btn" data-close aria-label="Đóng">×</button></header>
    <div class="ap-body">${seg('style')}${seg('mode')}${sw}${sbg}${seg('side')}${seg('size')}${seg('density')}
    <p class="small muted" style="margin:0">Chọn là áp dụng ngay. Tùy chọn được lưu theo tài khoản của bạn, đăng nhập trên máy khác vẫn giữ nguyên.</p></div>
    <footer><button class="btn ghost" data-act="ap-reset">Khôi phục mặc định</button><button class="btn primary" data-close>Xong</button></footer></div>`;
}


/* ===== Quy trình trình duyệt hồ sơ =====
   Bản 1.2: Soạn thảo → Trình duyệt → Đã duyệt / Trả lại / Từ chối. Bản 1.8: quản trị tự thiết lập các bước (tên bước, nút xử lý, nhóm hoặc
   người xử lý, trả về người lập hay bước trước, hạn xử lý, bước theo khoảng giá trị), quy trình riêng cho từng dự án, chuyển đích danh.
   Trạng thái hồ sơ vẫn ghi bằng chữ (Chờ kiểm tra: đang ở bước giữa; Chờ duyệt: đang ở bước cuối); bước cụ thể đọc từ lịch sử trình duyệt.
   Máy chủ kiểm tra quyền và trạng thái ở /api/approvals. */
const WF = {
  addenda:{mod:'goi-thau', name:'Phụ lục hợp đồng', draft:'Soạn thảo', wait:'Chờ duyệt', ok:'Đã duyệt', no:'Từ chối', locked:['Đã duyệt','Từ chối'], amt:'valueChange',
    label:r=>{ const c=get('contracts',r.contractId)||{}; return `Phụ lục ${r.number||''} HĐ ${c.number||''}`; }, pid:r=>contractPid(get('contracts',r.contractId)||{}),
    info:r=>`${N(r.valueChange)>0?'+':''}${fmtVND(r.valueChange)} đ${N(r.daysChange)?', gia hạn '+N(r.daysChange)+' ngày':''} · ${r.content||''}`},
  payments:{mod:'thanh-toan', name:'Hồ sơ thanh toán', draft:'Đề nghị', wait:'Chờ duyệt', ok:'Đang trình KBNN', no:'Từ chối', locked:['Đang trình KBNN','Đã thanh toán','Từ chối'], amt:'amount',
    label:r=>{ const c=get('contracts',r.contractId)||{}; return `Hồ sơ thanh toán ${r.number||''} HĐ ${c.number||''}`; }, pid:r=>contractPid(get('contracts',r.contractId)||{}),
    info:r=>`${r.kind||''} · ${fmtVND(r.amount)} đ${r.payPlanId&&get('payplans',r.payPlanId)?' · '+(/^đợt/i.test(get('payplans',r.payPlanId).phase||'')?'':'đợt ')+get('payplans',r.payPlanId).phase:''}`},
  schedule:{mod:'tien-do', name:'Kế hoạch tiến độ', draft:'Soạn thảo', wait:'Chờ duyệt', ok:'Đã duyệt', no:'Từ chối', locked:['Đã duyệt','Từ chối'],
    label:r=>`Kế hoạch ${r.name||''} (${(pkgOf(r.packageId)||{}).code||''})`, pid:r=>r.projectId,
    info:r=>`${fmtDate(r.planStart)} – ${fmtDate(r.planEnd)}, trọng số ${N(r.weight)||1}`},
  vbatches:{mod:'khoi-luong', name:'Đợt nghiệm thu khối lượng', draft:'Soạn thảo', wait:'Chờ duyệt', ok:'Đã duyệt', no:'Từ chối', locked:['Đã duyệt','Từ chối'], disp:VB_DISP,
    label:r=>{ const c=get('contracts',r.contractId)||{}; return `Nghiệm thu ${r.name||''} HĐ ${c.number||''}`; }, pid:r=>contractPid(get('contracts',r.contractId)||{}),
    info:r=>{ const vs=D('volumes').filter(v=>v.batchId===r.id); return `${r.number?'Biên bản '+r.number+', ':''}${fmtDate(r.date)}, ${vs.length} công việc, giá trị nghiệm thu ${fmtVND(sum(vs,v=>N(v.acceptedQty)*N((get('boq',v.boqId)||{}).price)))} đ`; }},
  acceptances:{mod:'nghiem-thu', name:'Nghiệm thu, bàn giao', draft:'Soạn thảo', wait:'Chờ duyệt', ok:'Đã duyệt', no:'Từ chối', locked:['Đã duyệt','Từ chối'],
    label:r=>`${r.kind||'Biên bản'} ${r.number||''}`, pid:r=>r.projectId, info:r=>`${fmtDate(r.date)} · ${r.content||''}${r.result?' · '+r.result:''}`},
  // Bản 1.8: mặc định tắt, quản trị bật khi cần
  contracts:{mod:'goi-thau', name:'Hợp đồng', draft:'Soạn thảo', wait:'Chờ duyệt', ok:'Đã duyệt', no:'Từ chối', locked:['Đã duyệt','Từ chối'], amt:'value', opt:true,
    label:r=>`Hợp đồng ${r.number||''}`, pid:r=>contractPid(r), info:r=>`${r.contractor||''} · ${fmtVND(r.value)} đ · ${fmtDate(r.start)} – ${fmtDate(r.end)}`},
  payplans:{mod:'thanh-toan', name:'Kế hoạch thanh toán', draft:'Soạn thảo', wait:'Chờ duyệt', ok:'Đã duyệt', no:'Từ chối', locked:['Đã duyệt','Từ chối'], amt:'amount', opt:true,
    label:r=>{ const c=get('contracts',r.contractId)||{}; return `Kế hoạch thanh toán ${r.phase||''} HĐ ${c.number||''}`; }, pid:r=>contractPid(get('contracts',r.contractId)||{}),
    info:r=>`${fmtDate(r.planDate)} · ${fmtVND(r.amount)} đ`},
  legal:{mod:'du-an', name:'Hồ sơ pháp lý', draft:'Soạn thảo', wait:'Chờ duyệt', ok:'Đã duyệt', no:'Từ chối', locked:['Đã duyệt','Từ chối'], opt:true,
    label:r=>`${r.type||'Hồ sơ'} ${r.number||''}`, pid:r=>r.projectId, info:r=>`${fmtDate(r.date)} · ${r.issuer||''} · ${r.title||''}`}
};
const WF_CHECK = 'Chờ kiểm tra';
const WF_STEP0 = {key:'approve', label:'Lãnh đạo Ban duyệt', verb:'Duyệt', groups:[], users:[], returnTo:'author', dueDays:0};
/** Thiết lập quy trình (máy chủ gửi kèm dữ liệu). */
const wfCfg = () => Store.meta.wf || {flows:{}, projects:{}, assignedOnly:true, noSelfReview:true};
function wfFlow(col, pid){ const c=wfCfg(); return (pid && c.projects && c.projects[pid] && c.projects[pid][col]) || (c.flows||{})[col] || {enabled:!WF[col].opt, steps:[WF_STEP0]}; }
const wfOn = (col, pid) => !!wfFlow(col, pid).enabled;
const wfHasCheck = col => (wfFlow(col).steps||[]).length > 1;
/** Trạng thái quy trình của hồ sơ (dữ liệu trước khi áp dụng quy trình không có trạng thái: coi là đã duyệt). */
function wfStatus(col, r){ return r.status || WF[col].ok; }
const wfPendingS = (col, s) => s===WF[col].wait || s===WF_CHECK;
const wfWaiting = (col, r) => wfPendingS(col, wfStatus(col,r));
const wfLocked = (col, r) => WF[col].locked.includes(wfStatus(col,r));
const wfLogs = (col, id) => D('approvals').filter(a=>a.collection===col && a.recordId===id).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
const wfAmount = (col, r) => WF[col].amt ? Math.abs(N(r[WF[col].amt])) : 0;
const wfRouteFor = (fc, amt, col, r) => (fc.steps||[]).filter(s=>(s.minAmount==null || amt>=s.minAmount) && (s.maxAmount==null || amt<s.maxAmount))
  /* Đợt nghiệm thu sản phẩm tư vấn giai đoạn chuẩn bị đầu tư không qua bước tư vấn giám sát xác nhận */
  .filter(s=>!(col==='vbatches' && s.key==='check' && r && cidProd(r.contractId)));
/** Tình trạng xử lý: các bước, bước đang chờ, lần chuyển duyệt, thao tác gần nhất, người được chuyển đích danh, hạn xử lý. */
function wfState(col, r){
  const logs=wfLogs(col,r.id), last=logs[0]||null, sub=logs.find(a=>a.route)||null; let route=null;
  if(sub){ try{ route=JSON.parse(sub.route); }catch{} }
  if(!route) route=wfRouteFor(wfFlow(col, WF[col].pid(r)), wfAmount(col,r), col, r);
  if(!route.length) route=[WF_STEP0];
  let idx=-1; const s=wfStatus(col,r);
  if(wfPendingS(col,s)){ idx=last&&last.step? route.findIndex(x=>x.key===last.step) : -1; if(idx<0) idx= s===WF_CHECK?0:route.length-1; }
  const cur=idx>=0;
  return {route, idx, step:cur?route[idx]:null, isLast:idx===route.length-1, last, sub, logs,
    assignee:cur&&last?last.assignee:null, assigneeName:cur&&last?last.assigneeName:null, due:cur&&last?last.due:null, since:cur&&last?last.at:null}; }
/** Người dùng được xử lý bước: quản trị; người, nhóm được chỉ định; để trống thì theo quyền Kiểm tra hồ sơ (bước giữa) / Duyệt (bước cuối) của phân hệ. */
function wfHandles(col, step, isLast, u=S.user){ if(!u||!step) return false; const g=get('groups',u.groupId); if(!g) return false; if(g.admin) return true;
  if((step.users||[]).includes(u.id) || (step.groups||[]).includes(g.id)) return true;
  if(!(step.users||[]).length && !(step.groups||[]).length) return (g.perms||{})[WF[col].mod+(isLast?':duyet':':kiemtra')]==='1';
  return false; }
/** Người dùng đang được xử lý hồ sơ (đúng bước, đúng người được chuyển đích danh, không tự duyệt hồ sơ mình chuyển). */
function wfCanAct(col, r, st=wfState(col,r)){ if(!st.step || !wfHandles(col, st.step, st.isLast)) return false; const c=wfCfg(), adm=!!(myGroup()||{}).admin;
  if(c.assignedOnly!==false && !adm && st.assignee && st.assignee!==S.user.id) return false;
  if(c.noSelfReview!==false && !adm && st.sub && st.sub.by===S.user.username) return false;
  return true; }
/** Người có thể xử lý một bước (để chọn chuyển đích danh). */
const wfHandlers = (col, step, isLast) => D('users').filter(u=>u.active!==false && wfHandles(col, step, isLast, u)).sort((a,b)=>String(a.name).localeCompare(String(b.name),'vi'));
/** Ai đang giữ hồ sơ: người được chuyển đích danh, hoặc nhóm/người được phân công bước. */
function wfHolder(col, st){ if(!st.step) return ''; if(st.assigneeName) return st.assigneeName;
  const s=st.step, gs=(s.groups||[]).map(id=>(get('groups',id)||{}).name).filter(Boolean), us=(s.users||[]).map(id=>(get('users',id)||{}).name).filter(Boolean);
  return [...gs,...us].join(', ') || (st.isLast?'Người có quyền duyệt':'Người có quyền kiểm tra'); }
const lcFirst = s => s ? s.charAt(0).toLowerCase()+s.slice(1) : s;
function wfDisp(col, s, r){ if(r && wfPendingS(col,s)){ const st=wfState(col,r); if(st.step) return 'Chờ '+lcFirst(st.step.label); }
  return s===WF_CHECK ? 'Chờ kiểm tra' : (WF[col].disp&&WF[col].disp[s]) || s; }
/** Hồ sơ quá hạn xử lý bước đang chờ. */
const wfOverdue = (col, r, st=wfState(col,r)) => !!(st.due && st.due < TODAY);
/* Bản 1.8.9: ngày làm việc (bỏ thứ Bảy, Chủ nhật và ngày nghỉ quản trị khai báo), sắp đến hạn, trễ hạn báo lên */
const wfHol = () => new Set(wfCfg().holidays||[]);
/** Số ngày làm việc từ ngày a (không tính) đến ngày b (có tính); b trước a thì số âm. */
function wdBetween(a, b, hol=wfHol()){ if(!a||!b) return 0; let d=new Date(String(a).slice(0,10)+'T00:00:00'), e=new Date(String(b).slice(0,10)+'T00:00:00'), sg=1, n=0;
  if(e<d){ [d,e]=[e,d]; sg=-1; }
  for(let i=0; d<e && i<4000; i++){ d.setDate(d.getDate()+1); const w=d.getDay(); if(w!==0 && w!==6 && !hol.has(isoLocal(d))) n++; }
  return n*sg; }
/** Số ngày làm việc trễ so với hạn tính đến ngày end (mặc định hôm nay); quá hạn vào ngày nghỉ vẫn tính 1 ngày. */
const wdLate = (due, end=TODAY) => due && String(end).slice(0,10) > String(due).slice(0,10) ? Math.max(1, wdBetween(due, end)) : 0;
/** Ngày giờ máy chủ (giờ UTC) đổi ra ngày theo giờ Việt Nam. */
const tsDay = s => s ? isoLocal(parseTs(s)) : '';
const wfLateDays = (col, r, st=wfState(col,r)) => st.step ? wdLate(st.due) : 0;
/** Sắp đến hạn: còn trong số ngày nhắc trước của bước (mặc định 1 ngày làm việc). */
function wfSoon(col, r, st=wfState(col,r)){ if(!st.step || !st.due || st.due < TODAY) return false; return wdBetween(TODAY, st.due) <= Math.max(1, N(st.step.remindDays)); }
/** Trễ đủ số ngày phải báo cấp trên. */
const wfEscalated = (col, r, st=wfState(col,r)) => !!(st.step && N(st.step.escalateDays)>0 && wfLateDays(col,r,st) >= N(st.step.escalateDays));
const wfEscTarget = (step, u=S.user) => !!(u && step && ((step.escalateUsers||[]).includes(u.id) || (step.escalateGroups||[]).includes(u.groupId)));
/** Người dùng sửa được hồ sơ không (người duyệt luôn sửa được; người khác chỉ sửa khi đang soạn thảo). Loại hồ sơ tắt quy trình thì không khóa. */
const wfEditable = (col, r) => !wfOn(col, WF[col].pid(r)) || can(WF[col].mod,'approve') || (can(WF[col].mod,'edit') && !wfLocked(col,r) && !wfWaiting(col,r));
/** Hồ sơ bị trả lại và chưa chuyển lại (lần thao tác gần nhất là Trả lại): trả về dòng lịch sử đó. */
function wfReturned(col, r){ if(!WF[col] || wfStatus(col,r)!==WF[col].draft) return null;
  const h=wfLogs(col,r.id)[0]; return h && h.action==='Trả lại' ? h : null; }
/** Hồ sơ thanh toán đang đề nghị (mới lập, đang duyệt, đang trình Kho bạc); hồ sơ bị trả lại không tính. */
function payInProc(p){ return ['Đề nghị',WF_CHECK,'Chờ duyệt','Đang trình KBNN'].includes(p.status) && !wfReturned('payments',p); }
/** Thanh toán khối lượng hoàn thành (không gồm tạm ứng, thu hồi tạm ứng). */
const payIsVol = p => /khối lượng|theo sản phẩm/i.test(p.kind||'') && !/tạm ứng/i.test(p.kind||'');
function wfPill(col, r){ const w=WF[col], s=wfStatus(col,r), rt=wfReturned(col,r);
  if(rt) return `<span class="pill bad" title="${esc('Trả lại: '+(rt.note||''))}">Bị trả lại</span>${rt.note?`<div class="small muted">${esc(rt.note)}</div>`:''}`;
  if(wfPendingS(col,s)){ const st=wfState(col,r), od=wfOverdue(col,r,st);
    return pill(wfDisp(col,s,r), od?'bad':'warn')+`<div class="small muted">${esc(wfHolder(col,st))}${st.due?` · hạn ${fmtDate(st.due)}${od?' (quá hạn)':''}`:''}</div>`; }
  return pill(wfDisp(col,s), s===w.draft?'':s===w.no?'bad':s==='Đã thanh toán'||s===w.ok?'ok':'info'); }
/** Các nút quy trình của một hồ sơ, theo bước đang chờ và phân công. */
function wfBtns(col, r){ const w=WF[col], s=wfStatus(col,r), ap=can(w.mod,'approve'), ed=can(w.mod,'edit')||ap, on=wfOn(col, w.pid(r));
  const b=(a,l,cls='')=>`<button class="btn sm ${cls||'ghost'}" data-act="wf" data-id="${esc(col+'|'+r.id+'|'+a)}">${esc(l)}</button>`;
  let h=''; const st=wfState(col,r);
  if(s===w.draft && ed) h+=on? b('submit','Chuyển duyệt') : b('submit','Ghi nhận');
  if(st.step){
    if(wfCanAct(col,r,st)) h+=b(st.isLast?'approve':'check', st.step.verb||'Duyệt', 'primary')+b('return','Trả lại')+(st.isLast?b('reject','Từ chối','ghost danger'):'');
    else if(ap && wfHandles(col, st.step, st.isLast)) h+=b('return','Trả lại');
    if(st.last && st.last.by===S.user.username || (st.idx===0 && !st.last && ed)) h+=b('withdraw','Rút lại');
  }
  if(w.locked.includes(s) && s!=='Đã thanh toán' && (ap || wfHandles(col, st.route[st.route.length-1], true)) && (on || r.status)) h+=b('recall','Thu hồi');
  if(st.logs.length){ h+=b('history','Lịch sử'); h+=b('print','In phiếu trình'); }
  return h; }
/** Nút Sửa/Xóa có xét khóa của quy trình. */
const wfEditBtns = (col, r, extra='') => wfEditable(col,r) ? editBtns(WF[col].mod, col, r.id, extra) : extra;
/** Hồ sơ đang chờ người dùng này xử lý. */
function wfMine(){ return Object.keys(WF).flatMap(col=>D(col).filter(r=>wfWaiting(col,r) && pidOk(WF[col].pid(r)) && wfCanAct(col,r)).map(r=>({col,r}))); }

/* ===== Bản 1.3: tự căn độ rộng cột của mọi bảng =====
   Cột chữ ngắn (mã, trạng thái, ngày, số) không xuống dòng; cột chữ dài (tên dự án, nội dung…) được độ rộng tối thiểu dễ đọc,
   bảng rộng hơn khung thì cuộn ngang và giữ cố định cột đầu. Trên điện thoại bảng đã chuyển thành thẻ nên không áp dụng. */
function fitTables(root){
  const mob=matchMedia('(max-width:820px)').matches;
  (root||document).querySelectorAll(mob? '.tw:not(.rt) > table:not(.perm)' : '.tw > table:not(.perm)').forEach(t=>{
    const head=t.tHead && t.tHead.rows[0]; if(!head) return;
    const rows=[...t.tBodies].flatMap(b=>[...b.rows]).slice(0,60);
    const longCols=[];
    [...head.cells].forEach((th,i)=>{
      let line=0, ctl=false, chips=false;
      for(const r of rows){ const c=r.cells[i]; if(!c) continue;
        if(c.querySelectorAll('.pill').length>=3){ chips=true; continue; }
        if(c.classList.contains('acts') || c.querySelector('button,select,input,.bar,.thumbs')){ ctl=true; continue; }
        for(const ln of (c.innerText||'').split('\n')){ const n=ln.trim().length; if(n>line) line=n; } }
      const hl=th.textContent.trim().length;
      const cells=rows.map(r=>r.cells[i]).filter(Boolean);
      th.classList.toggle('wrap', hl>22); th.style.removeProperty('--mw'); cells.forEach(c=>c.classList.remove('nw'));
      if(chips){ th.style.setProperty('--mw','400px'); return; }
      if(ctl) return;
      if(line<=24) cells.forEach(c=>c.classList.add('nw'));
      else { const mw=Math.min(360, Math.max(190, Math.round(Math.sqrt(line)*28))); th.style.setProperty('--mw', mw+'px'); longCols.push([th,mw]); }
    });
    const tw=t.parentElement;
    /* bảng vượt khung: thu hẹp dần các cột chữ dài (không dưới 210px để vẫn dễ đọc) trước khi phải cuộn ngang */
    let over=t.scrollWidth-tw.clientWidth;
    if(over>0 && longCols.length){ const room=longCols.reduce((a,[,m])=>a+m-210,0);
      if(room>0){ const k=Math.min(1, over/room); longCols.forEach(([th,m])=>th.style.setProperty('--mw', Math.round(m-(m-210)*k)+'px')); }
      over=t.scrollWidth-tw.clientWidth; }
    tw.classList.toggle('wide', over>2);
  });
}
addEventListener('resize', ()=>{ clearTimeout(fitTables._t); fitTables._t=setTimeout(()=>fitTables(), 150); });

/* ===== Ô chọn nhiều mục (dự án, gói thầu, hợp đồng…): bấm vào mở danh sách kèm ô gõ tìm, gõ không dấu vẫn tìm được ===== */
const SS_MIN = 10;
let _ss = null;
const ssOk = s => s && s.tagName === 'SELECT' && !s.multiple && !s.disabled && s.options.length >= SS_MIN;
function ssClose(focus){ if(!_ss) return; const s=_ss.sel; _ss.box.remove(); _ss=null; if(focus) s.focus(); }
function ssOpen(sel){
  ssClose();
  const box=document.createElement('div'); box.className='ss-pop'; box.setAttribute('role','dialog'); box.setAttribute('aria-label', sel.getAttribute('aria-label')||'Chọn');
  box.innerHTML='<input type="search" placeholder="Gõ để tìm…" aria-label="Tìm trong danh sách" autocomplete="off"><ul role="listbox"></ul>';
  document.body.appendChild(box);
  /* Đặt hộp ngay dưới ô chọn (thiếu chỗ thì mở lên trên); trang cuộn thì hộp đi theo ô chọn */
  const place=()=>{ const z=parseFloat(getComputedStyle(document.body).zoom)||1, r=sel.getBoundingClientRect();
    const vw=innerWidth/z, vh=innerHeight/z, w=Math.min(Math.max(r.width/z, 300), vw-16), left=Math.max(8, Math.min(r.left/z, vw-w-8));
    const below=vh-r.bottom/z-12, above=r.top/z-12, up=below<260 && above>below, h=Math.min(380, Math.max(160, up?above:below));
    box.style.cssText=`left:${left}px;width:${w}px;max-height:${h}px;`+(up?`bottom:${vh-r.top/z+4}px`:`top:${r.bottom/z+4}px`); };
  place();
  const inp=box.querySelector('input'), ul=box.querySelector('ul');
  const items=[...sel.options].map(o=>({v:o.value, t:o.text, n:norm(o.text), d:o.disabled}));
  let list=items, act=Math.max(0, items.findIndex(x=>x.v===sel.value));
  const draw=()=>{ const q=norm(inp.value.trim()); list=q? items.filter(x=>x.n.includes(q)) : items; act=Math.max(0, Math.min(act, list.length-1));
    ul.innerHTML=list.length? list.map((x,k)=>`<li role="option" data-k="${k}" class="${k===act?'on':''}${x.v===sel.value?' cur':''}${x.d?' dis':''}" aria-selected="${x.v===sel.value}">${esc(x.t)}</li>`).join('') : '<li class="none">Không tìm thấy mục phù hợp</li>';
    const a=ul.querySelector('.on'); if(a){ if(a.offsetTop<ul.scrollTop) ul.scrollTop=a.offsetTop; else if(a.offsetTop+a.offsetHeight>ul.scrollTop+ul.clientHeight) ul.scrollTop=a.offsetTop+a.offsetHeight-ul.clientHeight; } };
  const pick=x=>{ if(!x||x.d) return; const ch=sel.value!==x.v; sel.value=x.v; ssClose(true); if(ch){ sel.dispatchEvent(new Event('input',{bubbles:true})); sel.dispatchEvent(new Event('change',{bubbles:true})); } };
  inp.addEventListener('input', ()=>{ act=0; draw(); });
  inp.addEventListener('keydown', e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); act=(act+(e.key==='ArrowDown'?1:-1)+list.length)%Math.max(1,list.length); draw(); }
    else if(e.key==='Enter'){ e.preventDefault(); pick(list[act]); }
    else if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); ssClose(true); }
    else if(e.key==='Tab'){ ssClose(); } });
  ul.addEventListener('mousedown', e=>{ const li=e.target.closest('li[data-k]'); if(li){ e.preventDefault(); pick(list[+li.dataset.k]); } });
  _ss={box, sel, place}; draw(); inp.focus({preventScroll:true});
}
document.addEventListener('mousedown', e=>{ if(_ss && !e.target.closest('.ss-pop')) ssClose(); const s=e.target.closest && e.target.closest('select'); if(e.button===0 && ssOk(s)){ e.preventDefault(); ssOpen(s); } }, true);
document.addEventListener('touchend', e=>{ const s=e.target.closest && e.target.closest('select'); if(ssOk(s)){ e.preventDefault(); ssOpen(s); } }, {capture:true, passive:false});
document.addEventListener('keydown', e=>{ const s=e.target; if(ssOk(s) && (e.key==='Enter'||e.key===' '||e.key==='F4'||(e.altKey&&e.key==='ArrowDown'))){ e.preventDefault(); ssOpen(s); } }, true);
addEventListener('resize', ()=>ssClose());
document.addEventListener('scroll', e=>{ if(!_ss || _ss.box.contains(e.target)) return;
  const r=_ss.sel.getBoundingClientRect(); if(!_ss.sel.isConnected || r.bottom<0 || r.top>innerHeight) ssClose(); else _ss.place(); }, true);
