/* ===== Trạng thái giao diện & khung ứng dụng ===== */
const S = {user:null, route:'tong-quan', pid:'', dirty:false, sel:{}, tab:{}, f:{}, after:[], cam:null};
const ACT = {'att-pdf':(k)=>pdfView(k)};
const VIEWS = {};
let _raf=0;
function onData(){
  if(!$('#ov').hidden){ S.dirty=true; return; }
  const a=document.activeElement;
  if(a && $('#content') && $('#content').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && !a.dataset.f){ S.dirty=true; return; }
  cancelAnimationFrame(_raf); _raf=requestAnimationFrame(render);
}
document.addEventListener('focusout', ()=>{ setTimeout(()=>{ if(S.dirty && $('#ov').hidden){ const a=document.activeElement; if(!(a && $('#content') && $('#content').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName))){ S.dirty=false; render(); } } },0); });

function render(){
  const root=$('#root');
  if(Store.mode==='loading'){ if(!$('#loading')) root.innerHTML=`<div id="loading" style="display:grid;place-items:center;min-height:100%;padding:40px" class="muted">Đang kết nối máy chủ…</div>`; return; }
  if(Store.mode==='offline' && !S.user){ root.innerHTML=`<div id="loading" style="display:grid;place-items:center;min-height:100%;padding:40px;text-align:center" class="muted">Không kết nối được máy chủ ứng dụng.<br>${esc(Store.error)}<br>Hệ thống sẽ tự thử lại sau ít giây.</div>`; return; }
  if(!Store.initialized){ return renderSetup(); }
  if(!S.user) return S.mfaStep ? ($('#mfa')? undefined : renderMfa()) : renderLogin();
  if(S.user.mustChangePassword) return $('#pwfirst')? undefined : renderPwFirst();
  if(!$('#app')) buildShell();
  let r=(location.hash||'').slice(1)||(innerWidth<820?'van-phong':'tong-quan');
  if(!VIEWS[r]) r='tong-quan';
  if(!can(r)) r = MODULES.find(m=>can(m.key))?.key || 'hien-truong';
  if(S.pid && !pidOk(S.pid)) S.pid='';
  S.route=r;
  renderNav(); renderTop();
  dispose3D();
  S.after=[];
  const prevF = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.f : null;
  const caret = prevF ? document.activeElement.selectionStart : null;
  const c=$('#content'); const y=window.scrollY;
  c.innerHTML = VIEWS[r]();
  if(S._lastRoute===r) window.scrollTo(0,y); else window.scrollTo(0,0);
  S._lastRoute=r;
  S.after.forEach(f=>{ try{ f(); }catch(e){ console.error(e); } });
  if(prevF){ const el=c.querySelector(`[data-f="${prevF}"]`); if(el && el.tagName==='INPUT'){ el.focus(); try{ el.setSelectionRange(caret,caret); }catch{} } }
  renderTabbar();
  introAdd(c, r);
  fitTables(c); comboWire(c); comboWire($('#top'));
}
/* Bản 1.8.8: mỗi màn hình nghiệp vụ có một dòng giới thiệu: dùng để làm gì, việc liên quan làm ở đâu */
const lnk=(r,l)=>`<a href="#${r}">${l}</a>`;
const INTRO={
  'cb-goi-thau':()=>`Gói thầu giai đoạn chuẩn bị đầu tư (${XD('khảo sát, lập báo cáo kinh tế - kỹ thuật, thiết kế, dự toán…','lập, thẩm tra báo cáo kinh tế - kỹ thuật, thẩm định giá…')}). Bấm vào một gói để nhập hợp đồng; nghiệm thu sản phẩm và thanh toán tại ${lnk('cb-thanh-toan','Chuẩn bị đầu tư › Nghiệm thu, thanh toán')}.`,
  'goi-thau':()=>`Gói thầu giai đoạn thực hiện đầu tư. Gói tư vấn nghiệm thu, thanh toán theo sản phẩm tại ${lnk('tv-thanh-toan','Nghiệm thu, thanh toán tư vấn')}; gói ${XD('thi công','triển khai')}, mua sắm theo dõi khối lượng, tiến độ và thanh toán tại ${lnk('thanh-toan','Quản lý thanh toán')}.`,
  'cb-thanh-toan':()=>`Hợp đồng tư vấn chuẩn bị đầu tư: khai báo sản phẩm của hợp đồng, nghiệm thu từng sản phẩm, rồi lập hồ sơ thanh toán theo giá trị đã nghiệm thu.`,
  'tv-thanh-toan':()=>`Hợp đồng tư vấn giai đoạn thực hiện đầu tư (quản lý dự án, lập và đánh giá hồ sơ mời thầu, giám sát, kiểm thử…): khai báo sản phẩm, nghiệm thu sản phẩm, thanh toán theo sản phẩm. Hợp đồng ${XD('thi công','triển khai')}, mua sắm ở ${lnk('thanh-toan','Quản lý thanh toán')}.`,
  'thanh-toan':()=>`Hợp đồng ${XD('thi công','triển khai')}, mua sắm, phi tư vấn: kế hoạch thanh toán và hồ sơ thanh toán theo khối lượng đã nghiệm thu. Hợp đồng tư vấn ở ${lnk('tv-thanh-toan','Nghiệm thu, thanh toán tư vấn')}.`,
  'khoi-luong':()=>`Bảng khối lượng và các đợt nghiệm thu khối lượng của hợp đồng ${XD('thi công','triển khai')}, mua sắm. Hợp đồng tư vấn nghiệm thu theo sản phẩm ở mục Nghiệm thu, thanh toán của giai đoạn.`,
  'nghiem-thu':()=>`Biên bản nghiệm thu hoàn thành hạng mục, ${XD('công trình','hệ thống')}, vận hành thử, bàn giao và theo dõi bảo hành. Nghiệm thu từng sản phẩm của hợp đồng tư vấn làm ở mục Nghiệm thu, thanh toán của giai đoạn.`,
  'tien-do':()=>`Kế hoạch tiến độ các hạng mục, công việc của từng gói thầu và cập nhật phần trăm thực hiện. Chọn gói thầu ở ô bên dưới (gõ tên gói hoặc tên dự án để tìm).`,
  'nhat-ky':()=>XD('Nhật ký thi công hằng ngày của gói thi công, mua sắm lắp đặt.','Nhật ký triển khai: công việc đã làm, người tham gia, vướng mắc, ảnh hiện trường của từng gói thầu.'),
  'danh-muc-don-vi':()=>`Danh mục dùng chung cho mọi dự án. Gói thầu chọn nhà thầu, đơn vị giám sát từ danh mục này; trong từng giai đoạn, thẻ "Nhà thầu của giai đoạn" chỉ liệt kê đơn vị có gói ở giai đoạn đó.`};
function introAdd(c, r){ const f=INTRO[r]; const h=c.querySelector(':scope > .head'); if(!f || !h || c.querySelector('.steps') || (/goi-thau$/.test(r) && S.tab.gt==='nt')) return;
  h.insertAdjacentHTML('afterend', `<p class="intro">${f()}</p>`); }
function buildShell(){
  $('#root').innerHTML=`<div class="app" id="app">
    <aside class="side" id="side"><div class="brand"><div class="mark${BR.logo?' logo':''}" id="brandmark">${brandMark()}</div><div><span id="brand_org">${esc(BR.orgShort)}</span><b id="brand_app">${esc(BR.appName)}</b></div></div><nav class="nav" id="nav"></nav><div class="foot" id="sidefoot"></div></aside>
    <div class="main"><header class="top" id="top"></header><main class="content" id="content"></main></div>
  </div><nav class="tabbar" id="tabbar"></nav>`;
}
/* Mục menu ứng với một cảnh báo: cảnh báo của gói thầu giai đoạn chuẩn bị đầu tư đếm vào mục của giai đoạn đó */
const alertRoute = a => a.kid ? phRoute(a.mod, pkgPhase(pkgOf(a.kid))) : a.mod;
function goRoute(r){ if(location.hash==='#'+r) render(); else location.hash=r; }
/* Mở gói thầu, thanh toán của hợp đồng đúng mục menu theo giai đoạn */
function goPkg(kid){ S.sel.pkg=kid; goRoute(phRoute('goi-thau', pkgPhase(pkgOf(kid)))); }
/* Hợp đồng nghiệm thu theo sản phẩm mở mục Nghiệm thu, thanh toán (tư vấn) của giai đoạn; hợp đồng khác mở Quản lý thanh toán */
function goPay(cid, tab){ const ph=cidPhase(cid);
  if(ph==='cb'){ S.f.ttcb=cid; if(tab) S.tab.ttcb=tab; return goRoute('cb-thanh-toan'); }
  if(cidProd(cid)){ S.f.tttv=cid; if(tab) S.tab.tttv=tab; return goRoute('tv-thanh-toan'); }
  S.f.ttc=cid; if(tab&&tab!=='nt') S.tab.tt=tab; goRoute('thanh-toan'); }
function renderNav(){
  const al=alerts(); const cnt={}; al.forEach(a=>{ const r=alertRoute(a); cnt[r]=(cnt[r]||0)+1; });
  let html='', grp='';
  const link=(r,l,i,t)=>`<a href="#${r}" title="${esc(t||l)}" class="${S.route===r?'on':''}">${ic(i)}<span>${esc(l)}</span>${cnt[r]?`<span class="cnt">${cnt[r]}</span>`:''}</a>`;
  /* Bản 1.9: nhóm Văn phòng (điểm danh, đề xuất cho mọi người; bảng công cho người có quyền, trưởng phòng; nhân sự theo quyền) */
  if(typeof VP!=='undefined'){ if(!VP.st && !VP.loading && !VP.err) setTimeout(()=>vpLoad(),0);
    const pend=VP.st? VP.st.pending : 0;
    html+=`<div class="grp">Văn phòng</div>`+link('van-phong','Điểm danh','check')+`<a href="#de-xuat" class="${S.route==='de-xuat'?'on':''}">${ic('doc')}<span>Đề xuất</span>${pend?`<span class="cnt">${pend}</span>`:''}</a>`
      +link('lich-hop','Lịch công tác','cal')+`<a href="#thong-bao" class="${S.route==='thong-bao'?'on':''}">${ic('bell')}<span>Thông báo</span>${VP.ib&&VP.ib.unread?`<span class="cnt">${VP.ib.unread}</span>`:''}</a>`
      +(vpCanAttAll()? link('diem-danh','Bảng công, chấm công','cal') : '')+(can('nhan-su')? link('nhan-su','Nhân sự','user') : ''); grp='Văn phòng'; }
  MODULES.filter(m=>can(m.key) && m.grp!=='Văn phòng').forEach(m=>{
    if(m.grp!==grp){ grp=m.grp; html+=`<div class="grp">${esc(grp)}</div>`;
      if(grp==='Nghiệp vụ'){ const cb=NAV_CB.filter(([r])=>can(r)); if(cb.length) html+=`<div class="sub">${esc(PHASES.cb)}</div>`+cb.map(([r,l,i])=>link(r,l,i,PHASES.cb+': '+l)).join('')+`<div class="sub">${esc(PHASES.dt)}</div>`; } }
    html+=`<a href="#${m.key}" class="${S.route===m.key?'on':''}">${ic(m.icon)}<span>${esc(m.label)}</span>${cnt[m.key]?`<span class="cnt">${cnt[m.key]}</span>`:''}</a>`;
    if(m.key==='du-an' && can(NAV_DM[0])) html+=link(NAV_DM[0],NAV_DM[1],NAV_DM[2]);
    if(m.key==='goi-thau' && can(NAV_TV[0])) html+=link(NAV_TV[0],NAV_TV[1],NAV_TV[2],PHASES.dt+': '+NAV_TV[1]);
    if(m.key==='tong-quan'){ const n=wfMine().length; html+=`<a href="#trinh-duyet" class="${S.route==='trinh-duyet'?'on':''}">${ic('stamp')}<span>Trình duyệt hồ sơ</span>${n?`<span class="cnt">${n}</span>`:''}</a>`;
      html+=`<a href="#canh-bao" title="Trung tâm cảnh báo" class="${S.route==='canh-bao'?'on':''}">${ic('bell')}<span>Trung tâm cảnh báo</span>${al.length?`<span class="cnt">${al.length}</span>`:''}</a>`; }
  });
  html+=`<div class="grp">Tiện ích</div><a href="#hien-truong" class="${S.route==='hien-truong'?'on':''}">${ic('phone')}<span>Hiện trường (di động)</span></a><a href="#huong-dan" class="${S.route==='huong-dan'?'on':''}">${ic('help')}<span>Hướng dẫn sử dụng</span></a><a href="#" data-act="appearance">${ic('palette')}<span>Giao diện, màu sắc</span></a>${can('quan-tri')?`<a href="#doi-chieu" class="${S.route==='doi-chieu'?'on':''}">${ic('check')}<span>Danh mục chức năng</span></a>`:''}`;
  $('#nav').innerHTML=html;
  $('#sidefoot').innerHTML=`Phiên bản ${APP_VERSION} · ${esc(BR.support)}`;
  $('#brandmark').className='mark'+(BR.logo?' logo':''); $('#brandmark').innerHTML=brandMark(); $('#brand_org').textContent=BR.orgShort; $('#brand_app').textContent=BR.appName;
}
function renderTop(){
  const cb=NAV_CB.find(x=>x[0]===S.route), m=MODULES.find(x=>x.key===S.route); const title=cb? PHASES.cb+' › '+cb[1] : S.route===NAV_TV[0]? PHASES.dt+' › '+NAV_TV[1] : S.route===NAV_DM[0]? NAV_DM[1] : m? (['goi-thau','thanh-toan'].includes(m.key)? PHASES.dt+' › ':'')+m.label: S.route==='hien-truong'?'Hiện trường':S.route==='huong-dan'?'Hướng dẫn sử dụng':S.route==='trinh-duyet'?'Trình duyệt hồ sơ':S.route==='canh-bao'?'Trung tâm cảnh báo':S.route==='van-phong'?'Điểm danh':'Danh mục chức năng';
  const g=myGroup();
  $('#top').innerHTML=`<button class="btn ghost sm menu-btn" data-act="menu" aria-label="Mở menu">${ic('menu').replace('<svg','<svg width="18" height="18"')}</button>
    <div class="title">${esc(title)}</div><div class="sp"></div>
    ${['van-phong','de-xuat','diem-danh','nhan-su'].includes(S.route)?'':`<select id="gpid" data-f="__pid" aria-label="Lọc theo dự án">${opts(projOpts(), S.pid, 'Tất cả dự án')}</select>`}
    ${themeBtn()}${wfBell()}
    <span class="mode ${Store.mode==='server'?'shared':''}" title="${Store.mode==='server'?'Dữ liệu lưu tập trung trên máy chủ, mọi người dùng cùng thấy':'Mất kết nối máy chủ: thay đổi chưa được lưu'}">${Store.mode==='server'?'Đã kết nối máy chủ':'Mất kết nối máy chủ'}</span>
    <div class="who"><button class="btn ghost sm" data-act="account" title="Tài khoản"><span class="avatar">${esc(initials(S.user.name))}</span><span class="nm" style="text-align:left;line-height:1.2">${esc(S.user.name)}<br><span class="small muted">${esc(g?g.name:'')}</span></span></button></div>`;
}
function renderTabbar(){
  const items=[['van-phong','check','Điểm danh'],['tong-quan','dash','Tổng quan'],['du-an','proj','Dự án'],['de-xuat','doc','Đề xuất']].filter(x=>can(x[0]));
  $('#tabbar').innerHTML = items.map(([k,i,l])=>`<a href="#${k}" class="${S.route===k?'on':''}">${ic(i)}<span>${l}</span></a>`).join('') + `<a href="#" data-act="menu">${ic('menu')}<span>Menu</span></a>`;
  $('#tabbar').style.gridTemplateColumns=`repeat(${items.length+1},1fr)`;
}
window.addEventListener('hashchange', ()=>{ $('#side')?.classList.remove('open'); render(); });

/* Sự kiện chung */
document.addEventListener('click', e=>{
  if(e.target.closest('[data-close]')){ closeModal(); return; }
  if(e.target.id==='ov'){ closeModal(); return; }
  const side=$('#side'); if(side && side.classList.contains('open') && !e.target.closest('#side') && !e.target.closest('[data-act="menu"]')) side.classList.remove('open');
  const t=e.target.closest('[data-act]'); if(!t) return;
  const fn=ACT[t.dataset.act]; if(fn){ e.preventDefault(); Promise.resolve(fn(t.dataset.id, t, e)).catch(ex=>{ console.error(ex); toast(errText(ex),'err'); }); }
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !$('#ov').hidden) closeModal(); });
let _ft=0;
function onFilter(e){
  const el=e.target; const k=el.dataset && el.dataset.f; if(!k) return;
  if(k==='__pid'){ S.pid=el.value; S.sel={}; render(); return; }
  S.f[k]=el.type==='checkbox'?el.checked:el.value; S.pg={}; S.nkn=0;
  clearTimeout(_ft); _ft=setTimeout(render, el.tagName==='INPUT'&&el.type==='search'?180:0);
}
document.addEventListener('input', e=>{ if(e.target.matches('input[type=search][data-f]')) onFilter(e); });
document.addEventListener('change', e=>{ if(e.target.matches('[data-f]') && !e.target.matches('input[type=search]')) onFilter(e); });
ACT.menu=()=>$('#side').classList.toggle('open');
ACT.pg=(key,el)=>{ S.pg=S.pg||{}; S.pg[key]=+el.dataset.p; render(); };
document.addEventListener('change', e=>{ if(e.target.matches('select.pg-size')){ try{ localStorage.setItem('qlda-pgsize', e.target.value); }catch{} S.pg={}; render(); } });
ACT.theme=()=>{ const m=themeGet(), n=THEMES[(THEMES.findIndex(x=>x[0]===m)+1)%3][0]; UI.set('mode',n); render(); toast('Chế độ hiển thị: '+THEMES.find(x=>x[0]===n)[1].toLowerCase()); };
ACT.appearance=()=>{ $('#side')?.classList.remove('open'); openModal(appearanceHTML()); };
ACT['ap-reset']=()=>{ for(const [k,d] of Object.entries(UI_OPTS)) UI.p[k]=d.def; UI.set('mode','auto'); $('#ov').innerHTML=appearanceHTML(); S.dirty=true; };
document.addEventListener('change', e=>{ const el=e.target; if(!el.matches('[data-ap]')) return; UI.set(el.dataset.ap, el.value); $('#ov').innerHTML=appearanceHTML(); const f=$('#ov').querySelector(`[data-ap="${el.dataset.ap}"]:checked`); if(f) f.focus(); S.dirty=true; });
ACT.tab=(id,el)=>{ S.tab[el.dataset.g]=id; if(el.dataset.g==='qt' && typeof ADM!=='undefined'){ delete ADM.storage; delete ADM.auto; } render(); };
ACT.go=(id)=>{ location.hash=id; };
ACT.photo=(id,el)=>{ openModal(`<div class="lightbox" style="display:grid;gap:8px;justify-items:center"><img src="${esc(el.getAttribute('src'))}" alt=""><button class="btn" data-close>Đóng</button></div>`); };

/* Xem nhanh ảnh đính kèm, danh sách tệp đính kèm */
ACT['att-view']=(id,el,e)=>{ const a=get('attachments',id); if(!a) return; e&&e.preventDefault&&e.preventDefault();
  openModal(`<div class="lightbox" style="display:grid;gap:8px;justify-items:center"><img src="${attUrl(a)}" alt="${esc(a.fileName)}"><div class="small" style="color:#fff">${esc(a.fileName)} · ${attMeta(a)}</div><div class="toolbar"><a class="btn" href="${attUrl(a)}?download=true">Tải về</a><button class="btn" data-close>Đóng</button></div></div>`); };
ACT['att-all']=(ids)=>{ const list=String(ids).split(',').map(id=>get('attachments',id)).filter(Boolean);
  openModal(`<div class="mform narrow"><header><h3>Tệp đính kèm (${list.length})</h3><button class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:16px;overflow:auto"><ul class="attlist">${list.map(a=>`<li><a href="${attUrl(a)}" target="_blank" rel="noopener" ${isPdf(a)?pdfAttr(attUrl(a),a.fileName):''}>${attIcon(a)} ${esc(a.fileName)}</a>${a.kind?` <span class="pill">${esc(a.kind)}</span>`:''}<span class="small muted">${attMeta(a)}</span></li>`).join('')}</ul></div></div>`); };

const DEPS = {projects:[['packages','projectId'],['tasks','projectId'],['legal','projectId'],['items','projectId'],['schedule','projectId'],['diaries','projectId'],['models','projectId'],['capitals','projectId'],['acceptances','projectId'],['settlements','projectId'],['clearances','projectId']],
  packages:[['contracts','packageId'],['schedule','packageId'],['diaries','packageId'],['legal','packageId'],['acceptances','packageId']], contracts:[['boq','contractId'],['payments','contractId'],['payplans','contractId'],['addenda','contractId']],
  boq:[['volumes','boqId']], groups:[['users','groupId']], items:[['schedule','itemId']]};
const COL_MOD = {projects:'du-an',tasks:'du-an',legal:'du-an',items:'mo-hinh',models:'mo-hinh',packages:'goi-thau',orgs:'goi-thau',contracts:'goi-thau',addenda:'goi-thau',schedule:'tien-do',diaries:'nhat-ky',boq:'khoi-luong',volumes:'khoi-luong',payplans:'thanh-toan',payments:'thanh-toan',capitals:'von',acceptances:'nghiem-thu',settlements:'quyet-toan',clearances:'gpmb',users:'quan-tri',groups:'quan-tri',catalogs:'quan-tri'};
ACT.del=async(id,el)=>{
  const col=el.dataset.col; const o=get(col,id); if(!o) return;
  if(!can(COL_MOD[col]||'quan-tri','edit')) return toast('Bạn không có quyền xóa dữ liệu này.','err');
  for(const [dc,fk] of (DEPS[col]||[])){ const n=D(dc).filter(x=>x[fk]===id).length; if(n) return toast(`Không xóa được: còn ${n} bản ghi "${COL_LABEL[dc]}" liên quan. Hãy xử lý các bản ghi đó trước.`,'err'); }
  if(col==='users' && id===S.user.id) return toast('Không thể xóa tài khoản đang đăng nhập.','err');
  const label=o.name||o.code||o.number||o.value||o.username||o.date||id;
  if(!await confirmBox(`Xóa ${esc(COL_LABEL[col].toLowerCase())} <b>${esc(label)}</b>? Thao tác này không hoàn tác được.`)) return;
  if(col==='models'){ /* xóa cả các phiên bản khi xóa bản mới nhất */ }
  try{ await remove(col,id); }catch(ex){ return toast(errText(ex),'err'); } toast('Đã xóa');
  if(S.sel.project===id) S.sel.project=null; if(S.sel.pkg===id) S.sel.pkg=null;
};

/* ===== Thiết lập lần đầu & đăng nhập ===== */
function authArt(){
  const deco=BR.bannerDeco!=='0', bg=BR.loginBg?` has-bg" style="--art-bg:url('${esc(BR.loginBg)}')`:'';
  return `<div class="art${bg}">${deco&&!BR.logo&&!BR.loginBg?`<div class="drum-mark">${drumSVG()}</div>`:''}
  <div class="art-head"><div class="seal${BR.logo?' logo':''}">${brandMark()}</div><div><div class="org1">${esc(BR.orgName)}</div><div class="org2">${esc(BR.unitName)}</div></div></div>
  <div class="art-title"><h1>${esc(BR.bannerTitle)}</h1><p>${esc(BR.bannerText)}</p></div>
  <div class="meta">${esc(BR.address)}</div></div>`;
}
const authCls = () => 'auth'+(BR.bannerDeco==='0'?' plain':'');
function renderSetup(){
  // Mã khởi tạo: lấy từ đường dẫn được cấp (…/?ma=XXXX-XXXX-XXXX) rồi xóa khỏi thanh địa chỉ
  const qs=new URLSearchParams(location.search), ma=qs.get('ma')||'';
  if(ma){ qs.delete('ma'); history.replaceState(null,'',location.pathname+(qs.toString()?'?'+qs:'')+location.hash); }
  $('#root').innerHTML=`<div class="${authCls()}">${authArt()}<div class="box"><form id="setup" autocomplete="off">
    <div class="form-head"><h2>Khởi tạo hệ thống</h2><p class="muted small">Tạo tài khoản quản trị đầu tiên. Hệ thống chưa có người dùng. Tài khoản này có toàn quyền và dùng để cấp tài khoản cho cán bộ khác.</p></div>
    ${Store.setupToken?`<div class="fld"><label for="su_token">Mã khởi tạo (do đơn vị cung cấp dịch vụ gửi)</label><input id="su_token" required value="${esc(ma)}" placeholder="XXXX-XXXX-XXXX" autocapitalize="characters" spellcheck="false"></div>`:''}
    <div class="fld"><label for="su_name">Họ và tên</label><input id="su_name" required value=""></div>
    <div class="fld"><label for="su_user">Tên đăng nhập</label><input id="su_user" required value="admin"></div>
    <div class="fld"><label for="su_pw">Mật khẩu (tối thiểu 8 ký tự, có chữ và số)</label><input id="su_pw" type="password" required autocomplete="new-password"></div>
    <div class="fld"><label for="su_pw2">Nhập lại mật khẩu</label><input id="su_pw2" type="password" required autocomplete="new-password"></div>
    <label class="checks"><input type="checkbox" id="su_sample" ${Store.setupToken?'':'checked'}> Nạp dữ liệu mẫu để chạy thử (6 dự án, nhiệm vụ cấp xã kèm kế hoạch vốn, nghiệm thu, quyết toán, GPMB và tài khoản mẫu)</label>
    <div class="err" id="su_err"></div>
    <button class="btn primary" type="submit" style="justify-content:center;padding:10px">Khởi tạo hệ thống</button>
    <p class="small muted" style="margin:0">Dữ liệu được lưu tập trung trong cơ sở dữ liệu riêng của đơn vị trên máy chủ.</p>
  </form><p class="auth-foot">${brandFoot()}</p></div></div>`;
  $('#setup').onsubmit=async e=>{
    e.preventDefault(); const err=$('#su_err');
    const name=$('#su_name').value.trim(), username=$('#su_user').value.trim().toLowerCase(), pw=$('#su_pw').value, pw2=$('#su_pw2').value;
    if(!name||!username) return err.textContent='Vui lòng nhập họ tên và tên đăng nhập.';
    if(!/^[a-z0-9._-]{3,32}$/.test(username)) return err.textContent='Tên đăng nhập 3–32 ký tự, chỉ gồm chữ thường không dấu, số, dấu chấm, gạch.';
    if(!pwOk(pw)) return err.textContent='Mật khẩu cần tối thiểu 8 ký tự, gồm cả chữ và số.';
    if(pw!==pw2) return err.textContent='Hai lần nhập mật khẩu không khớp.';
    if(Store.setupToken && !$('#su_token').value.trim()) return err.textContent='Vui lòng nhập mã khởi tạo.';
    const btn=e.submitter||$('#setup button[type=submit]'); btn.disabled=true;
    try{
      err.style.color='var(--muted)'; err.textContent='Đang khởi tạo danh mục, nhóm quyền'+($('#su_sample').checked?' và dữ liệu mẫu':'')+'…';
      const body={name, username, password:pw, groups:defaultGroups(), catalogs:defaultCatalogs()};
      if(Store.setupToken) body.token=$('#su_token').value.trim();
      if($('#su_sample').checked){
        body.sample=makeSampleData();
        body.sampleUsers=[['lanhdao','Lãnh đạo Ban (mẫu)','g-lead','Lãnh đạo Ban'],['kythuat','Cán bộ kỹ thuật (mẫu)','g-tech','Phòng Kỹ thuật'],['ketoan','Kế toán (mẫu)','g-acc','Phòng Kế toán'],['giamsat','Tư vấn giám sát TV01 (mẫu)','g-site','Tư vấn giám sát'],['ubnd','Chủ tịch UBND xã (mẫu)','g-ubnd','UBND xã'],['bithu','Bí thư Đảng ủy xã (mẫu)','g-ubnd','Đảng ủy xã'],['phochutich','Phó Chủ tịch UBND xã (mẫu)','g-ubnd','UBND xã']].map(([username,name,groupId,unit])=>({username,name,groupId,unit}));
      }
      const r=await api('POST','/api/auth/setup',body,{auth:true});
      Store.initialized=true; Store.sampleUsers=!!body.sampleUsers; location.hash='tong-quan';
      await authDone(r);
    }catch(ex){ console.error(ex); err.style.color='var(--red)'; err.textContent=errText(ex); btn.disabled=false; }
  };
}
function renderLogin(){
  $('#root').innerHTML=`<div class="${authCls()}">${authArt()}<div class="box"><form id="login">
    <div class="form-head"><h2>${esc(BR.loginTitle)}</h2><p class="muted small">${esc(BR.loginHint)}</p></div>
    <div class="fld"><label for="lg_user">Tên đăng nhập</label><input id="lg_user" autocomplete="username" required></div>
    <div class="fld"><label for="lg_pw">Mật khẩu</label><input id="lg_pw" type="password" autocomplete="current-password" required></div>
    <div class="fld" id="lg_cap" hidden><label for="lg_capv">Mã kiểm tra</label><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span id="lg_capimg" style="display:inline-flex;border-radius:6px;overflow:hidden"></span><button type="button" class="btn sm ghost" id="lg_capnew">Đổi mã khác</button></div><input id="lg_capv" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="8" placeholder="Nhập 5 ký tự trong hình" style="margin-top:6px;text-transform:uppercase"></div>
    <div class="err" id="lg_err"></div>
    <button class="btn primary" type="submit" style="justify-content:center;padding:10px">Đăng nhập</button>
    <p class="small muted" style="margin:0">${esc(BR.forgotText)} ${Store.sampleUsers?'Tài khoản mẫu: lanhdao, kythuat, ketoan, giamsat, ubnd (mật khẩu như tài khoản quản trị lúc khởi tạo).':''}</p>
  </form><p class="auth-foot">${brandFoot()}</p></div></div>`;
  /* Sau vài lần nhập sai, máy chủ yêu cầu mã kiểm tra (tự sinh, không dùng dịch vụ ngoài) */
  let capId='';
  const showCap=c=>{ if(!c) return; capId=c.id; $('#lg_cap').hidden=false; $('#lg_capimg').innerHTML=`<img class="cap-img" src="${esc(c.img)}" width="160" height="52" alt="Mã kiểm tra" draggable="false">`; $('#lg_capv').value=''; };
  $('#lg_capnew').onclick=async()=>{ try{ showCap(await api('GET','/api/auth/captcha',undefined,{auth:true})); $('#lg_capv').focus(); }catch(ex){ $('#lg_err').textContent=errText(ex); } };
  $('#login').onsubmit=async e=>{
    e.preventDefault(); const err=$('#lg_err');
    const un=$('#lg_user').value.trim().toLowerCase(), pw=$('#lg_pw').value;
    const btn=$('#login button[type=submit]'); btn.disabled=true; err.textContent='';
    try{ const r=await api('POST','/api/auth/login',{username:un, password:pw, ...(capId?{captchaId:capId, captcha:$('#lg_capv').value.trim()}:{})},{auth:true}); await authDone(r); }
    catch(ex){ err.textContent=errText(ex); btn.disabled=false; if(ex.data&&ex.data.captcha){ showCap(ex.data.captcha); if(ex.status===428) $('#lg_capv').focus(); } else if(capId){ capId=''; $('#lg_cap').hidden=true; } }
  };
}
/* ===== Xác thực 2 lớp (bắt buộc với tài khoản quản trị) ===== */
async function authDone(r){
  if(r.mfa){ S.mfaStep=r; return renderMfa(); }
  if(r.recoveryCodes){ S.mfaStep={mfa:'codes', codes:r.recoveryCodes, user:r.user}; return renderMfa(); }
  S.mfaStep=null; S.user=r.user; S.mfa=r.recoveryLeft!=null?{enabled:true, required:true, recoveryLeft:r.recoveryLeft}:S.mfa;
  if(S.user && S.user.mustChangePassword) return render();
  await Store.load(); render();
}
/* Lần đăng nhập đầu (hoặc sau khi quản trị đặt lại mật khẩu): bắt buộc tự đặt mật khẩu riêng trước khi dùng phần mềm */
function renderPwFirst(){
  authBox(`<form id="pwfirst">
    <div class="form-head"><h2>Đặt mật khẩu của bạn</h2><p class="muted small">Tài khoản <b>${esc(S.user.username)}</b> đang dùng mật khẩu ban đầu do quản trị hệ thống cấp. Để bảo mật, vui lòng đặt mật khẩu riêng trước khi sử dụng phần mềm.</p></div>
    <div class="fld"><label for="pf_old">Mật khẩu ban đầu</label><input id="pf_old" type="password" autocomplete="current-password" required></div>
    <div class="fld"><label for="pf_pw">Mật khẩu mới (tối thiểu 8 ký tự, có chữ và số)</label><input id="pf_pw" type="password" autocomplete="new-password" required></div>
    <div class="fld"><label for="pf_pw2">Nhập lại mật khẩu mới</label><input id="pf_pw2" type="password" autocomplete="new-password" required></div>
    <div class="err" id="pf_err"></div>
    <button class="btn primary" type="submit" style="justify-content:center;padding:10px">Lưu mật khẩu và vào hệ thống</button>
    <button class="btn ghost" type="button" id="pf_out" style="justify-content:center">Đăng xuất</button>
  </form>`);
  $('#pf_out').onclick=()=>ACT.logout();
  $('#pf_old').focus();
  $('#pwfirst').onsubmit=async e=>{ e.preventDefault(); const err=$('#pf_err'); err.textContent='';
    const old=$('#pf_old').value, pw=$('#pf_pw').value;
    if(!pwOk(pw)) return err.textContent='Mật khẩu mới cần tối thiểu 8 ký tự, gồm cả chữ và số.';
    if(pw!==$('#pf_pw2').value) return err.textContent='Hai lần nhập mật khẩu mới không khớp.';
    if(pw===old) return err.textContent='Mật khẩu mới phải khác mật khẩu ban đầu.';
    const btn=$('#pwfirst button[type=submit]'); btn.disabled=true;
    try{ await api('POST','/api/auth/change-password',{old, password:pw},{auth:true});
      S.user={...S.user, mustChangePassword:false}; await Store.load(); render(); toast('Đã đặt mật khẩu mới.'); }
    catch(ex){ err.textContent=errText(ex); btn.disabled=false; } };
}
function authBox(inner){ $('#root').innerHTML=`<div class="${authCls()}">${authArt()}<div class="box">${inner}<p class="auth-foot">${brandFoot()}</p></div></div>`; }
const codeField=(label)=>`<div class="fld"><label for="mf_code">${label}</label><input id="mf_code" class="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]*" maxlength="7" required></div>`;
function recoveryText(codes, user){ return `MÃ KHÔI PHỤC XÁC THỰC 2 LỚP – ${String(BR.appName||"PHẦN MỀM QUẢN LÝ DỰ ÁN").toUpperCase()}\r\nTài khoản: ${user}\r\nTạo lúc: ${fmtDT(new Date().toISOString())}\r\n\r\nMỗi mã chỉ dùng được một lần, khi không có điện thoại để lấy mã 6 số.\r\nCất giữ nơi an toàn, không chia sẻ cho người khác.\r\n\r\n${codes.map((c,i)=>String(i+1).padStart(2,' ')+'. '+c).join('\r\n')}\r\n`; }
function codesHtml(codes){ return `<ol class="rcodes">${codes.map(c=>`<li><code>${esc(c)}</code></li>`).join('')}</ol>`; }
function printCodes(codes, user){ const w=window.open('','_blank'); if(!w) return toast('Trình duyệt chặn cửa sổ in. Hãy dùng nút Tải tệp.','err'); w.document.write(`<title>Ma khoi phuc</title><pre style="font:15px/1.7 monospace;padding:24px">${esc(recoveryText(codes,user))}</pre>`); w.document.close(); w.focus(); w.print(); }
function renderMfa(){
  const st=S.mfaStep; if(!st) return renderLogin();
  if(st.mfa==='codes'){
    authBox(`<form id="mfa" class="wide">
      <div class="form-head"><h2>Lưu mã khôi phục</h2><p class="muted small">Đã bật xác thực 2 lớp cho tài khoản <b>${esc(st.user.username)}</b>. Khi mất hoặc đổi điện thoại, dùng một trong các mã dưới đây thay cho mã 6 số. Mỗi mã dùng một lần; mã chỉ hiển thị lần này.</p></div>
      ${codesHtml(st.codes)}
      <div class="row-btns"><button type="button" class="btn" id="rc_dl">Tải tệp .txt</button><button type="button" class="btn" id="rc_pr">In</button></div>
      <label class="checks"><input type="checkbox" id="rc_ok"> Tôi đã lưu mã khôi phục ở nơi an toàn</label>
      <button class="btn primary" type="submit" disabled>Vào hệ thống</button>
    </form>`);
    $('#rc_dl').onclick=()=>saveFile('Ma khoi phuc QLDA - '+st.user.username+'.txt', new Blob([recoveryText(st.codes,st.user.username)],{type:'text/plain;charset=utf-8'}));
    $('#rc_pr').onclick=()=>printCodes(st.codes, st.user.username);
    $('#rc_ok').onchange=e=>{ $('#mfa button[type=submit]').disabled=!e.target.checked; };
    $('#mfa').onsubmit=async e=>{ e.preventDefault(); const u=st.user; S.mfaStep=null; S.user=u; S.mfa={enabled:true, required:true, recoveryLeft:st.codes.length}; await Store.load(); render(); };
    return;
  }
  const enroll=st.mfa==='enroll', rec=!!st.useRecovery;
  const key=enroll? st.secret.match(/.{1,4}/g).join(' ') : '';
  authBox(`<form id="mfa" class="${enroll?'wide':''}" autocomplete="off">
    <div class="form-head"><h2>${enroll?'Thiết lập xác thực 2 lớp':'Xác thực 2 lớp'}</h2><p class="muted small">${enroll
      ? 'Tài khoản quản trị phải dùng thêm mã xác thực trên điện thoại khi đăng nhập. Thực hiện 3 bước sau (chỉ làm một lần).'
      : rec ? 'Nhập một mã khôi phục đã lưu khi bật xác thực 2 lớp (dạng xxxxx-xxxxx). Mỗi mã chỉ dùng một lần.'
      : 'Mở ứng dụng xác thực trên điện thoại (Google Authenticator, Microsoft Authenticator…) và nhập mã 6 số của mục <b>'+esc('QLDA Xa Phuong')+'</b>.'}</p></div>
    ${enroll?`<ol class="mfa-steps">
      <li><b>Cài ứng dụng xác thực</b> trên điện thoại: Google Authenticator hoặc Microsoft Authenticator (miễn phí trên CH Play, App Store).</li>
      <li><b>Quét mã QR</b> bằng ứng dụng (nút “+” → Quét mã QR).<div class="qr" role="img" aria-label="Mã QR thiết lập xác thực 2 lớp">${st.qrSvg}</div>
        <span class="small muted">Không quét được? Chọn “Nhập khóa thiết lập” và nhập: tài khoản <b>${esc(st.account)}</b>, khóa</span><code class="otp-key">${esc(key)}</code></li>
      <li><b>Nhập mã 6 số</b> ứng dụng đang hiển thị để xác nhận.</li></ol>` : ''}
    ${rec?`<div class="fld"><label for="mf_code">Mã khôi phục</label><input id="mf_code" autocomplete="off" maxlength="12" required></div>`:codeField('Mã xác thực 6 số')}
    <div class="err" id="mf_err" role="alert"></div>
    <button class="btn primary" type="submit">${enroll?'Xác nhận và bật':'Xác nhận'}</button>
    <p class="small muted mfa-links">${!enroll?`<a href="#" id="mf_alt">${rec?'Dùng mã 6 số từ ứng dụng':'Không có điện thoại? Dùng mã khôi phục'}</a> · `:''}<a href="#" id="mf_back">Quay lại đăng nhập</a></p>
  </form>`);
  $('#mf_code').focus();
  $('#mf_back').onclick=e=>{ e.preventDefault(); S.mfaStep=null; api('POST','/api/auth/logout',undefined,{auth:true}).catch(()=>{}); renderLogin(); };
  if($('#mf_alt')) $('#mf_alt').onclick=e=>{ e.preventDefault(); st.useRecovery=!rec; renderMfa(); };
  $('#mfa').onsubmit=async e=>{
    e.preventDefault(); const err=$('#mf_err'), btn=$('#mfa button[type=submit]'); const code=$('#mf_code').value.trim();
    if(!rec && !/^\d{6}$/.test(code.replace(/\s/g,''))) return err.textContent='Mã xác thực gồm 6 chữ số.';
    btn.disabled=true; err.textContent='';
    try{ await authDone(await api('POST','/api/auth/mfa',{code, recovery:rec},{auth:true})); }
    catch(ex){ err.textContent=errText(ex); btn.disabled=false; if(ex.status===401||ex.status===423){ S.mfaStep=null; setTimeout(()=>{ renderLogin(); $('#lg_err').textContent=errText(ex); },0); } else { $('#mf_code').select(); } }
  };
}
ACT['new-rc']=()=>openForm({title:'Tạo mã khôi phục mới', narrow:true, fields:[{key:'pw',label:'Nhập mật khẩu để xác nhận',type:'password',req:true,full:true}],
  onSave:async v=>{ const r=await api('POST','/api/auth/recovery-codes',{password:v.pw},{auth:true}); S.mfa={...S.mfa, recoveryLeft:r.recoveryCodes.length};
    setTimeout(()=>openModal(`<div class="mform narrow"><header><h3>Mã khôi phục mới</h3><button class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:16px;display:flex;flex-direction:column;gap:12px"><p class="small muted" style="margin:0">Bộ mã cũ đã hết hiệu lực. Lưu bộ mã này ở nơi an toàn; mã chỉ hiển thị lần này.</p>${codesHtml(r.recoveryCodes)}<div class="row-btns"><button class="btn" id="rc_dl">Tải tệp .txt</button><button class="btn" id="rc_pr">In</button></div></div></div>`,true),0);
    setTimeout(()=>{ const c=r.recoveryCodes, un=S.user.username; $('#rc_dl').onclick=()=>saveFile('Ma khoi phuc QLDA - '+un+'.txt', new Blob([recoveryText(c,un)],{type:'text/plain;charset=utf-8'})); $('#rc_pr').onclick=()=>printCodes(c,un); },20); }});
ACT.account=()=>{
  const g=myGroup();
  openModal(`<div class="mform narrow"><header><h3>Tài khoản</h3><button class="icon-btn" data-close>×</button></header>
  <div style="padding:16px;display:flex;flex-direction:column;gap:12px"><div style="display:flex;gap:12px;align-items:center"><span class="avatar" style="width:44px;height:44px;font-size:15px">${esc(initials(S.user.name))}</span><div><b>${esc(S.user.name)}</b><div class="small muted">${esc(S.user.username)} · ${esc(g?g.name:'')}</div><div class="small muted">${esc(S.user.unit||'')}</div></div></div>
  ${S.mfa&&S.mfa.enabled?`<div class="mfa-state">${ic('shield').replace('<svg','<svg width="18" height="18"')}<div><b>Xác thực 2 lớp: đang bật</b><div class="small muted">Còn ${S.mfa.recoveryLeft} mã khôi phục chưa dùng</div></div></div>
  <button class="btn" data-act="new-rc">Tạo mã khôi phục mới</button>`:''}
  <button class="btn" data-act="appearance">${ic('palette').replace('<svg','<svg width="16" height="16"')} Giao diện: màu sắc, cỡ chữ</button>
  <button class="btn" data-act="chpw">${ic('key').replace('<svg','<svg width="16" height="16"')} Đổi mật khẩu</button>
  <button class="btn danger" data-act="logout">${ic('out').replace('<svg','<svg width="16" height="16"')} Đăng xuất</button></div></div>`);
};
ACT.logout=async()=>{ UI.reset(); try{ await api('POST','/api/auth/logout',undefined,{auth:true}); }catch{} S.user=null; S.mfa=null; S.mfaStep=null; Store.clear(); closeModal(); S.sel={}; render(); };
ACT.chpw=()=>{
  openForm({title:'Đổi mật khẩu', narrow:true, fields:[{key:'old',label:'Mật khẩu hiện tại',type:'password',req:true,full:true},{key:'pw',label:'Mật khẩu mới (≥ 8 ký tự, có chữ và số)',type:'password',req:true,full:true},{key:'pw2',label:'Nhập lại mật khẩu mới',type:'password',req:true,full:true}],
    onSave: async v=>{
      const err=$('#mform_err');
      if(!pwOk(v.pw)){ err.textContent='Mật khẩu mới cần ≥ 8 ký tự, gồm cả chữ và số.'; return false; }
      if(v.pw!==v.pw2){ err.textContent='Hai lần nhập không khớp.'; return false; }
      await api('POST','/api/auth/change-password',{old:v.old, password:v.pw},{auth:true});
    }});
};

/* ===== TỔNG QUAN (UC32–42) ===== */
const STATUS_COL = {'Chuẩn bị đầu tư':'var(--c3)','Đang lựa chọn nhà thầu':'var(--c4)','Đang thi công':'var(--c1)','Đang triển khai':'var(--c1)','Đang thực hiện':'var(--c4)','Tạm dừng':'var(--red)','Hoàn thành':'var(--c2)','Đã quyết toán':'var(--c5)','Đã bàn giao đưa vào sử dụng':'var(--c2)','Đang quyết toán':'var(--c3)'};
/* ===== Bản 1.8.3: Tổng quan hệ sinh thái đơn vị thành viên =====
   Bật khi danh mục nhà thầu có đơn vị đánh dấu "Thành viên hệ sinh thái"; chưa có thì giữ Tổng quan của Ban QLDA.
   Một quy tắc tính dùng chung cho mọi thẻ, biểu đồ, bảng và báo cáo xuất:
   - Đơn vị của hợp đồng: các nhà thầu của gói thầu (danh mục nhà thầu); hợp đồng liên danh còn nhận thành viên có tên trong tên liên danh.
   - Mỗi hợp đồng thuộc đúng một nhóm khi cộng theo đơn vị: đơn vị thành viên (làm riêng), Liên danh, Đơn vị khác. Cộng các nhóm = tổng chung.
     Lọc theo một đơn vị thì lấy cả hợp đồng làm riêng và hợp đồng liên danh có đơn vị đó.
   - Trạng thái theo gói thầu: Đã nghiệm thu, Đã thanh lý hợp đồng là đã hoàn thành; còn lại là đang thực hiện.
   - Năm hiệu lực: theo ngày bắt đầu hợp đồng (không có thì ngày ký, rồi ngày bắt đầu dự án). Hợp đồng đang thực hiện ký từ năm trước vẫn tính vào năm đang xem. */
const memberOrgs=()=>D('orgs').filter(o=>o.member && o.kind!=='gs').sort((a,b)=>String(a.shortName||a.name).localeCompare(String(b.shortName||b.name),'vi'));
const unitLabel=o=>o? (o.shortName||o.name) : '';
const TQ_DONE=['Đã nghiệm thu','Đã thanh lý hợp đồng'];
const ctDone=c=>TQ_DONE.includes((pkgOf(c.packageId)||{}).status);
const ctYear=c=>String(c.start||c.signDate||(projOf(contractPid(c))||{}).start||'').slice(0,4);
const ctJV=c=>(((pkgOf(c.packageId)||{}).contractorIds||[]).length>1) || /^\s*liên\s+danh/i.test(String(c.contractor||'').normalize('NFC'));
function ctMembers(c){ const ms=memberOrgs(); const ids=new Set(((pkgOf(c.packageId)||{}).contractorIds||[]).filter(id=>ms.some(o=>o.id===id)));
  const t=normKey(c.contractor);
  ms.forEach(o=>{ if(!t) return; if(t===normKey(o.name) || (o.shortName && t===normKey(o.shortName))) ids.add(o.id);
    else if(ctJV(c) && [o.name,o.shortName].some(n=>n && normKey(n).length>=4 && t.includes(normKey(n)))) ids.add(o.id); });
  return ms.filter(o=>ids.has(o.id)).map(o=>o.id); }
/* Tỷ lệ của một đơn vị thành viên trong hợp đồng: làm riêng 100%; liên danh theo tỷ lệ liên danh của gói (chưa có tỷ lệ thì 0, ghi rõ ở bảng) */
const ctShareOf=(c,u)=>{ const s=((pkgOf(c.packageId)||{}).contractorShares||{})[u]; return s==null||s===''? null : N(s)/100; };
function ctShare(c,u){ if(!ctMembers(c).includes(u)) return 0; if(!ctJV(c)) return 1; return ctShareOf(c,u)||0; }
/* Phân bổ một hợp đồng vào các nhóm cộng theo đơn vị; cộng các phần luôn bằng 1 (giá trị hợp đồng không bị đếm hai lần):
   làm riêng: cả hợp đồng vào đơn vị thành viên hoặc Đơn vị khác; liên danh: thành viên hệ sinh thái theo tỷ lệ, phần còn lại vào nhóm Liên danh */
function ctAlloc(c){ if(!ctJV(c)) return [{b:ctMembers(c)[0]||'khac', f:1}];
  const ps=ctMembers(c).map(u=>({b:u, f:ctShareOf(c,u)||0})).filter(x=>x.f>0); const rest=1-sum(ps,'f');
  return rest>1e-6? [...ps,{b:'jv',f:rest}] : ps; }
const ctBucket=c=>ctJV(c)? 'jv' : (ctMembers(c)[0]||'khac');
const ctPaidCap=c=>Math.min(contractPaid(c.id), contractValue(c));
const TQ_ST=[['run','Đang thực hiện'],['done','Đã hoàn thành'],['*','Tất cả trạng thái']];
/* Bộ lọc Năm (mặc định năm nay), Trạng thái (mặc định đang thực hiện) dùng chung cho Tổng quan và Thống kê theo đơn vị */
function tqF(){ const f=S.f; return {u:'', y:f.tqy||TODAY.slice(0,4), s:f.tqs||'run', st:''}; }
const tqYears=()=>[...new Set(D('contracts').map(ctYear).filter(Boolean)), TODAY.slice(0,4)].filter((x,i,a)=>a.indexOf(x)===i).sort().reverse();
const tqFilterBar=()=>{ const F=tqF(); return `<select data-f="tqy" aria-label="Năm">${opts([...tqYears().map(y=>[y,'Năm '+y]),['*','Tất cả các năm']],F.y)}</select><select data-f="tqs" aria-label="Trạng thái">${opts(TQ_ST,F.s)}</select>`; };
const tqFilterText=()=>{ const F=tqF(); return [F.y==='*'?'mọi năm':'năm '+F.y, ((TQ_ST.find(x=>x[0]===F.s)||[])[1]||'').toLowerCase()].join(', '); };
function tqRows(o={}){ const F=tqF(); const vis=new Set(projects().filter(p=>!S.pid||p.id===S.pid).map(p=>p.id));
  return D('contracts').filter(c=>{ const pid=contractPid(c); if(!vis.has(pid)) return false;
    if(!o.noUnit && F.u){ if(F.u==='jv'){ if(!ctJV(c)) return false; } else if(F.u==='khac'){ if(ctBucket(c)!=='khac') return false; } else if(!ctMembers(c).includes(F.u)) return false; }
    const done=ctDone(c);
    if(!o.noStatus && F.s!=='*' && (F.s==='done')!==done) return false;
    if(!o.noYear && F.y!=='*'){ const y=ctYear(c); if(done? y!==F.y : (y && y>F.y)) return false; }
    if(!o.noStage && F.st && (projOf(pid)||{}).status!==F.st) return false;
    return true; }); }
const tqLate=c=>!ctDone(c) && contractEnd(c) && contractEnd(c)<TODAY;
VIEWS['tong-quan']=()=>tqBan();
function tqBan(){
  /* Đơn vị có đánh dấu thành viên hệ sinh thái: lọc theo năm hiệu lực, trạng thái hợp đồng (mặc định năm nay, đang thực hiện);
     dự án trong phạm vi là dự án có hợp đồng phù hợp bộ lọc, mọi số liệu bên dưới tính trên các hợp đồng đó */
  const eco=memberOrgs().length>0, F=tqF(), flt=eco && !(F.y==='*' && F.s==='*');
  const csF=flt? tqRows({noUnit:true, noStage:true}) : null; const pidF=flt? new Set(csF.map(contractPid)) : null, kidF=flt? new Set(csF.map(c=>c.packageId)) : null;
  const ps=projects().filter(p=>(!S.pid||p.id===S.pid) && (!flt||pidF.has(p.id))); const pids=ps.map(p=>p.id);
  const cs=flt? csF : D('contracts').filter(c=>pids.includes(contractPid(c)));
  const tm=sum(ps,'tmdt'), cv=sum(cs,contractValue), done=sum(cs,contractDoneEst), acc=sum(cs,c=>contractAcc(c.id)), paid=sum(cs,c=>contractPaid(c.id));
  const al=alerts().filter(a=>!flt || (a.kid? kidF.has(a.kid) : pidF.has(a.pid))); const nb=al.filter(a=>a.lvl==='bad').length;
  const Y=eco && F.y!=='*'? F.y : TODAY.slice(0,4), py=sum(ps,p=>capPlan(p.id,Y)), dy=sum(ps,p=>disbursed(p.id,Y)), tgy=py? sum(ps,p=>capPlan(p.id,Y)*capTargetAt(p.id,Y))/py : 0;
  const stats=catalog('Trạng thái dự án'); const extra=[...new Set(ps.map(p=>p.status))].filter(s=>!stats.includes(s));
  const donutItems=[...stats,...extra].map(s=>({label:s, value:ps.filter(p=>p.status===s).length, color:STATUS_COL[s]||'var(--c5)'})).filter(i=>i.value);
  const pk=D('packages').filter(k=>pids.includes(k.projectId) && (!flt||kidF.has(k.id)) && SCHED().some(s=>s.packageId===k.id)).sort(by('code'));
  const sc=sCurve(SCHED().filter(s=>pids.includes(s.projectId) && (!flt||kidF.has(s.packageId))));
  const tasks=D('tasks').filter(t=>pids.includes(t.projectId) && t.status!=='Hoàn thành').sort(by('due')).slice(0,6);
  const pjRows=ps.map(p=>{ const c=cs.filter(c=>contractPid(c)===p.id); return {...p, cv:sum(c,contractValue), paid:sum(c,x=>contractPaid(x.id)), done:sum(c,contractDoneEst), acc:sum(c,x=>contractAcc(x.id)), prog:projProgress(p.id), exp:projExpected(p.id)}; });
  // Đơn vị có nhiều dự án, gói thầu: biểu đồ cột chỉ vẽ tối đa 15 mục đáng chú ý nhất để đọc được
  const TOP=15, multi=new Set(pk.map(k=>k.code)).size<pk.length;
  const pkLabel=k=>multi||!S.pid&&pids.length>1? `${(projOf(k.projectId)||{}).code||''} ${k.code}`.trim() : k.code;
  const pkTop=pk.length<=TOP? pk : pk.map(k=>({k, gap:pkgExpected(k.id)-pkgProgress(k.id)})).sort((a,b)=>b.gap-a.gap).slice(0,TOP).map(x=>x.k).sort(by('code'));
  const csTop=cs.length<=TOP? cs : [...cs].sort((a,b)=>contractValue(b)-contractValue(a)).slice(0,TOP);
  const pjTop=pjRows.length<=TOP? pjRows : [...pjRows].sort((a,b)=>b.cv-a.cv).slice(0,TOP);
  const fmtAxis=vals=>{ const m=Math.max(0,...vals); return m>=5e9? v=>fmtN(v/1e9,0)+' tỷ' : m>=5e6? v=>fmtN(v/1e6,0)+' tr' : v=>fmtN(v); };
  return `<div class="head"><div class="grow"><h1>Tổng quan tình hình thực hiện</h1><p>Số liệu tính đến ngày ${fmtDate(TODAY)}${S.pid?', dự án '+esc(projOf(S.pid)?.code):', gồm các dự án bạn được giao theo dõi'}${eco?': '+esc(tqFilterText()):''}</p></div>${eco?`<div class="toolbar tq-f" style="margin:0">${tqFilterBar()}</div>`:''}</div>
  <div class="grid g5 kpis" style="grid-template-columns:repeat(5,minmax(0,1fr))">
    <div class="card kpi"><div class="eyebrow">Dự án</div><div class="v">${ps.length}</div><div class="s">${ps.filter(p=>['Đang thi công','Đang triển khai','Đang thực hiện'].includes(p.status)).length} đang thực hiện</div></div>
    <div class="card kpi"><div class="eyebrow">Tổng mức đầu tư</div><div class="v">${fmtTy(tm)}</div><div class="s">${D('packages').filter(k=>pids.includes(k.projectId)).length} gói thầu</div></div>
    <div class="card kpi"><div class="eyebrow">Giá trị hợp đồng</div><div class="v">${fmtTy(cv)}</div><div class="s">${cs.length} hợp đồng, thực hiện ${fmtP(pct(done,cv))}</div></div>
    ${py?`<div class="card kpi ${tgy-pct(dy,py)>10?'warn':''}"><div class="eyebrow">Giải ngân năm ${Y}</div><div class="v">${fmtP(pct(dy,py))}</div><div class="s">${fmtTy(dy)} / kế hoạch vốn ${fmtTy(py)}, kịch bản ${fmtP(tgy)}</div></div>`:`<div class="card kpi"><div class="eyebrow">Đã giải ngân</div><div class="v">${fmtTy(paid)}</div><div class="s">${fmtP(pct(paid,tm))} tổng mức đầu tư</div></div>`}
    <div class="card kpi ${nb?'bad':al.length?'warn':''}"><div class="eyebrow">Cảnh báo</div><div class="v">${al.length}</div><div class="s">${nb} nghiêm trọng</div></div>
  </div>
  <div class="grid g3">
    <div class="card"><h2>Dự án theo trạng thái</h2>${donutItems.length?donut(donutItems, ps.length):emptyBox('Chưa có dự án.')}</div>
    <div class="card span2"><h2>Tiến độ gói thầu: kế hoạch và thực tế${pk.length>pkTop.length?`<span class="small muted" style="font-weight:400"> (${pkTop.length} gói chậm nhất trong ${pk.length} gói)</span>`:''}</h2>${pk.length?barChart({labels:pkTop.map(pkLabel), series:[{name:'Kế hoạch đến nay',color:'var(--c5)',values:pkTop.map(k=>pkgExpected(k.id))},{name:'Thực tế',color:'var(--c1)',values:pkTop.map(k=>pkgProgress(k.id))}], max:100, fmt:v=>Math.round(v)+'%'}):emptyBox('Chưa có kế hoạch tiến độ.')}</div>
  </div>
  <div class="grid g2">
    <div class="card"><h2>Giá trị hợp đồng và thực hiện hợp đồng${cs.length>csTop.length?`<span class="small muted" style="font-weight:400"> (${csTop.length} hợp đồng lớn nhất)</span>`:''}</h2>${cs.length?barChart({labels:csTop.map(c=>{ const k=pkgOf(c.packageId); return k?pkLabel(k):c.number; }), series:[{name:'Giá trị HĐ',color:'var(--c5)',values:csTop.map(contractValue)},{name:'Thực hiện',color:'var(--c1)',values:csTop.map(contractDoneEst)},{name:'Đã thanh toán',color:'var(--c2)',values:csTop.map(c=>contractPaid(c.id))}], fmt:fmtAxis(csTop.map(contractValue))}):emptyBox('Chưa có hợp đồng.')}</div>
    <div class="card"><h2>Khối lượng thực hiện, nghiệm thu và thanh toán${pjRows.length>pjTop.length?`<span class="small muted" style="font-weight:400"> (${pjTop.length} dự án có giá trị hợp đồng lớn nhất)</span>`:''}</h2>${ps.length?barChart({labels:pjTop.map(p=>p.code), series:[{name:'Thực hiện',color:'var(--c1)',values:pjTop.map(p=>p.done)},{name:'Nghiệm thu',color:'var(--c3)',values:pjTop.map(p=>p.acc)},{name:'Thanh toán',color:'var(--c2)',values:pjTop.map(p=>p.paid)}], fmt:fmtAxis(pjTop.map(p=>Math.max(p.done,p.acc,p.paid)))}):''}</div>
  </div>
  <div class="grid g2">
    <div class="card"><h2>So sánh kế hoạch và thực tế (đường cong S)</h2>${sc?lineChart({labels:sc.labels, series:[{name:'Kế hoạch lũy kế',color:'var(--c5)',values:sc.plan,dash:true},{name:'Thực tế lũy kế',color:'var(--c1)',values:sc.act,area:true}]}):emptyBox('Chưa có kế hoạch tiến độ.')}</div>
    <div class="card"><div class="ch"><h2>Cảnh báo và việc cần xử lý</h2><a href="#canh-bao" class="small" data-act="alerts-all">Xem tất cả cảnh báo →</a></div><div class="list">${al.slice(0,7).map(alertRow).join('')||'<div class="alert info">Không có cảnh báo.</div>'}
      ${al.length>7?`<a href="#canh-bao" class="small" data-act="alerts-all">Còn ${al.length-7} cảnh báo khác, xem tất cả →</a>`:''}
      ${tasks.length?`<div class="eyebrow" style="margin-top:8px">Công việc đang mở</div>`+tasks.map(t=>`<div class="small" style="display:flex;gap:8px;justify-content:space-between"><span>${esc(t.name)} <span class="muted">· ${esc(t.assignee||'')}</span></span><span class="num ${t.due<TODAY?'':'muted'}" style="${t.due<TODAY?'color:var(--red)':''}">${fmtDate(t.due)}</span></div>`).join(''):''}</div></div>
  </div>
  <div class="card"><h2>Tình hình thực hiện các dự án</h2>${table([
    {h:'Mã',f:r=>`<span class="num" style="white-space:nowrap">${esc(r.code)}</span>`},{h:'Tên dự án',f:r=>`<a href="#du-an" data-act="open-project" data-id="${r.id}">${esc(r.name)}</a>`},{h:'Trạng thái',f:r=>statusPill(r.status)},
    {h:'Tổng mức đầu tư',r:1,f:r=>fmtTy(r.tmdt)},{h:'Giá trị HĐ',r:1,f:r=>fmtTy(r.cv)},{h:'Đã thanh toán',r:1,f:r=>fmtTy(r.paid)},
    {h:'Tiến độ thực tế / kế hoạch',f:r=>`<div style="min-width:160px">${progBar(r.prog, r.exp-r.prog>10?'warn':'')}<div class="small muted">Kế hoạch ${Math.round(r.exp)}%</div></div>`}], pjRows)}</div>`;
}
ACT['alerts-all']=()=>{ S.f.cbp=S.pid||''; if(location.hash==='#canh-bao') render(); else location.hash='canh-bao'; };
ACT['alerts-proj']=(id)=>{ S.f.cbp=id; location.hash='canh-bao'; };
/* ===== TRUNG TÂM CẢNH BÁO: toàn bộ cảnh báo trên một màn hình, lọc, xuất Excel, mở đúng đối tượng ===== */
function alertCenterRows(){ const lv=S.f.cbl||'', pid=S.pid||S.f.cbp||'', kd=S.f.cbk||'', q=S.f.cbq||'';
  return alerts({all:true}).filter(a=>(!lv||a.lvl===lv) && (!pid||a.pid===pid) && (!kd||a.kind===kd) && (!q||norm(cellText(a.text)+' '+(a.who||'')).includes(norm(q)))); }
const AL_LV={bad:'Đỏ', warn:'Vàng'};
/* Bản 1.8.9: bảng trên màn hình bỏ các cột mã Nhóm, Dự án, Gói thầu, Hợp đồng (Nội dung đã ghi đủ); tệp Excel vẫn giữ để lọc, sắp xếp */
const AL_COLS=[{h:'Mức độ',f:a=>pill(AL_LV[a.lvl]||a.lvl, a.lvl),x:a=>AL_LV[a.lvl]||a.lvl},{xo:1,h:'Nhóm',f:a=>esc(a.kind||''),x:a=>a.kind||''},
  {xo:1,h:'Dự án',f:a=>`<span class="num">${esc(a.pcode||'')}</span>`,x:a=>a.pcode||''},{xo:1,h:'Gói thầu',f:a=>`<span class="num">${esc(a.kcode||'')}</span>`,x:a=>a.kcode||''},{xo:1,h:'Hợp đồng',f:a=>`<span class="num small">${esc((get('contracts',a.cid)||{}).number||'')}</span>`,x:a=>(get('contracts',a.cid)||{}).number||''},
  {h:'Nội dung',f:a=>a.text,x:a=>cellText(a.text)},{h:'Đơn vị thực hiện',f:a=>esc(a.who||''),x:a=>a.who||''},{h:'Thời hạn',f:a=>`<span class="num">${a.due?fmtDate(a.due):''}</span>`,x:a=>a.due?fmtDate(a.due):''}];
VIEWS['canh-bao']=()=>{ const all=alerts({all:true}); const rows=alertCenterRows(); const pid=S.pid||S.f.cbp||'';
  const nb=rows.filter(a=>a.lvl==='bad').length;
  return `<div class="head"><div class="grow"><h1>Trung tâm cảnh báo</h1><p>${all.length} cảnh báo trong phạm vi được giao; đang hiển thị ${rows.length} (${nb} mức đỏ, ${rows.length-nb} mức vàng). Bấm Xem để mở đúng hồ sơ cần xử lý.</p></div><button class="btn" data-act="export-alerts">Xuất Excel</button></div>
  <div class="toolbar"><select data-f="cbl" aria-label="Mức độ">${opts([['bad','Đỏ: quá hạn, nghiêm trọng'],['warn','Vàng: sắp đến hạn, cần theo dõi']],S.f.cbl||'','Mọi mức độ')}</select>
    ${!S.pid?`<select data-f="cbp" aria-label="Dự án" style="max-width:340px">${opts(projOpts(),pid,'Tất cả dự án')}</select>`:''}<select data-f="cbk" aria-label="Nhóm cảnh báo">${opts(ALERT_KINDS,S.f.cbk||'','Mọi nhóm')}</select>
    <input type="search" data-f="cbq" value="${esc(S.f.cbq||'')}" placeholder="Tìm nội dung, đơn vị…" aria-label="Tìm cảnh báo"></div>
  <div class="card">${table(AL_COLS.filter(c=>!c.xo), rows.map((a,i)=>({...a,id:'al'+i})), {nopage:true, empty:'Không có cảnh báo phù hợp bộ lọc.', actions:a=>a.go?`<button class="btn sm ghost" data-act="alert-go" data-id="${esc(a.go)}">Xem</button>`:''})}</div>`;
};
ACT['export-alerts']=()=>{ const rows=alertCenterRows(); const pid=S.pid||S.f.cbp||'';
  exportXlsx(`CanhBao_${TODAY}.xlsx`, [{name:'Canh bao', title:'DANH SÁCH CẢNH BÁO, VIỆC CẦN XỬ LÝ', money:[], sub:BR.reportOrg+' · Lập ngày '+fmtDate(TODAY)+(pid?' · Dự án '+((projOf(pid)||{}).code||''):''), head:AL_COLS.map(c=>c.h), rows:rows.map(a=>AL_COLS.map(c=>c.x(a)))}]);
  log('Xuất danh sách','logs','Trung tâm cảnh báo'); };
ACT['alert-go']=(id)=>{ const i=String(id).indexOf('|'), t=id.slice(0,i), x=id.slice(i+1); const go=h=>location.hash==='#'+h? render() : (location.hash=h);
  if(t==='pkg'){ goPkg(x); }
  else if(t==='td'){ S.f.tdk=x; S.tab.td='goi-thau'; go('tien-do'); }
  else if(t==='tt'){ goPay(x); }
  else if(t==='cbk'){ S.f.cbk=x; go('canh-bao'); }
  else if(t==='wf'){ S.tab.td2= x==='vt' && !wfCanRole()? 'dang' : x||'dang'; go('trinh-duyet'); }
  else if(t==='mod'){ go(x); }
  else { S.sel.project=x; S.tab.proj=t==='task'?'tasks':t==='legal'?'legal':'status'; go('du-an'); } };
ACT['open-project']=(id)=>{ S.sel.project=id; S.tab.proj='info'; if(location.hash==='#du-an') render(); else location.hash='du-an'; };

/* ===== QUẢN LÝ DỰ ÁN (UC1–5) ===== */
const projFields=()=>[
  {key:'code',label:'Mã dự án',req:true},{key:'status',label:'Trạng thái',type:'select',options:()=>catalog('Trạng thái dự án'),req:true},
  {key:'name',label:'Tên dự án',req:true,full:true},
  {key:'group',label:'Nhóm dự án',type:'select',options:()=>catalog('Nhóm dự án')},{key:'phase',label:'Giai đoạn',type:'select',options:()=>catalog('Giai đoạn')},
  {key:'tmdt',label:'Tổng mức đầu tư (đồng)',type:'money',req:true},{key:'capital',label:'Nguồn vốn',type:'select',options:()=>catalog('Nguồn vốn')},
  {key:'start',label:'Thời gian bắt đầu',type:'date'},{key:'end',label:'Thời gian hoàn thành',type:'date'},
  {key:'boardRole',label:XD('Vai trò của Ban','Vai trò của đơn vị'),type:'select',options:()=>catalog('Vai trò của Ban'),def:XD('Chủ đầu tư','')},{key:'decisionMaker',label:'Người quyết định đầu tư',def:'Chủ tịch '+BR.ownerDefault},
  {key:'mgmtForm',label:'Hình thức quản lý dự án',type:'select',options:()=>catalog('Hình thức quản lý dự án'),def:XD('Ban QLDA đầu tư xây dựng','')},{key:'projectKind',label:'Loại dự án',type:'select',options:()=>catalog('Loại dự án')},
  ...(isIT()?[{key:'field',label:'Lĩnh vực',type:'select',options:()=>catalog('Lĩnh vực')}]:[]),
  {key:'reportType',label:'Hồ sơ dự án',type:'select',options:()=>catalog('Hồ sơ dự án')},
  {key:'owner',label:'Chủ đầu tư / Đại diện',def:BR.ownerDefault},{key:'location',label:XD('Địa điểm xây dựng','Địa điểm, phạm vi triển khai'),ph:XD('','Sở, ngành, xã/phường triển khai…')},
  {key:'desc',label:'Quy mô, mô tả',type:'textarea',ph:XD('','Phần mềm, hạ tầng, số người dùng, số đơn vị triển khai…')},
  {key:'viewerIds',label:'Tài khoản khách hàng được xem dự án',type:'checks',options:()=>viewerUsers().map(u=>[u.id,u.name+' ('+u.username+')']),
    hint:viewerUsers().length?'Tài khoản khách hàng chỉ thấy các dự án được đánh dấu ở đây.':'Chưa có tài khoản khách hàng. Quản trị tạo tài khoản thuộc nhóm có thiết lập "Chỉ thấy dự án được gán cho tài khoản", sau đó gán tại đây.'}];
/* Tài khoản thuộc nhóm "chỉ thấy dự án được gán" (khách hàng, chủ đầu tư) */
const viewerGroups=()=>D('groups').filter(g=>g.assignedOnly && !g.admin).map(g=>g.id);
const viewerUsers=()=>{ const gs=viewerGroups(); return D('users').filter(u=>gs.includes(u.groupId) && u.active!==false).sort(by('name')); };
const viewerNames=p=>{ const gs=viewerGroups(); return (p.viewerIds||[]).map(id=>get('users',id)).filter(u=>u && gs.includes(u.groupId)).map(u=>u.name); };
/* Văn bản pháp lý chính nhập ngay trong biểu mẫu (lưu thành hồ sơ pháp lý kèm tệp) */
function findLegal(pid, kid, type){ return D('legal').filter(l=>l.projectId===pid && (l.packageId||'')===(kid||'') && l.type===type).sort(by('date'))[0]; }
function legalInline(prefix, label, ctx, cur, opt={}){
  return [{key:prefix+'No',label:'Số '+label},{key:prefix+'Date',label:'Ngày ban hành',type:'date'},
    ...(opt.issuer?[{key:prefix+'Issuer',label:'Cơ quan ban hành',full:true}]:[]),
    {key:prefix+'Att',label:'Tệp '+label+' (bản scan PDF, ảnh…)',type:'attach',col:'legal',cur:cur?cur.id:null,rid:()=>ctx[prefix]}];
}
function legalInlineValue(prefix, l, v){ if(l){ v[prefix+'No']=l.number; v[prefix+'Date']=l.date; v[prefix+'Issuer']=l.issuer; } return v; }
/* Tạo/cập nhật hồ sơ pháp lý từ các ô nhập; trả về mã hồ sơ (hoặc '' nếu không nhập gì) */
async function legalInlineSave(prefix, v, cur, base){
  const no=(v[prefix+'No']||'').trim(), date=v[prefix+'Date']||'', issuer=v[prefix+'Issuer'];
  const box=$('#f_'+prefix+'Att'); const hasFiles=box && box._files.length;
  ['No','Date','Issuer','Att'].forEach(k=>delete v[prefix+k]);
  if(!cur && !no && !hasFiles) return '';
  const l={...(cur||{}), ...base, number:no||(cur&&cur.number)||'(chưa nhập số)', date:date||(cur&&cur.date)||TODAY, ...(issuer!==undefined?{issuer}:{})};
  const r=await save('legal', l); return r.id;
}
function projForm(p){
  const ctx={}; const cur=p&&findLegal(p.id,'','Quyết định phê duyệt dự án');
  const fields=[...projFields(), ...legalInline('dec','quyết định phê duyệt dự án',ctx,cur,{issuer:true})];
  const value=legalInlineValue('dec', cur, {...(p||{})}); if(p && !cur && p.decision) value.decNo=p.decision;
  openForm({title:p?'Cập nhật thông tin dự án':'Thêm dự án', fields, value, onSave:async v=>{
    if(!p && D('projects').some(x=>x.code===v.code)){ $('#mform_err').textContent='Mã dự án đã tồn tại.'; return false; }
    const no=(v.decNo||'').trim(), dt=v.decDate;
    v.decision = no ? no+(dt?' ngày '+fmtDate(dt):'') : (p?p.decision:'');
    const pv={...v}; ['decNo','decDate','decIssuer','decAtt'].forEach(k=>delete pv[k]);
    const r=await save('projects',pv); if(!p) S.sel.project=r.id;
    ctx.dec=await legalInlineSave('dec', v, cur, {projectId:r.id, packageId:'', type:'Quyết định phê duyệt dự án', title:(cur&&cur.title)||'Phê duyệt dự án '+r.name});
    return r; }});
}
ACT['add-project']=()=>projForm(null);
ACT['edit-projects']=(id)=>projForm(get('projects',id));
ACT['back-project']=()=>{ S.sel.project=null; render(); };
/* Danh sách dự án đang lọc (dùng chung cho bảng và Xuất Excel) */
/* Lọc danh sách dự án theo Năm (mặc định năm nay) và Trạng thái (mặc định đang thực hiện), cùng cách hiểu với Tổng quan:
   dự án đã hoàn thành (kể cả đang, đã quyết toán, đã bàn giao) hiện ở các năm từ khi bắt đầu đến khi kết thúc;
   dự án chưa hoàn thành hiện từ năm bắt đầu trở đi; năm lấy theo ngày của dự án và các hợp đồng thuộc dự án */
const PJ_DONE=['Hoàn thành','Đã bàn giao đưa vào sử dụng','Đang quyết toán','Đã quyết toán'];
const pjDone=p=>PJ_DONE.includes(p.status);
function pjYears(p){ const cs=D('contracts').filter(c=>contractPid(c)===p.id);
  const ys=[p.start,p.end,...cs.flatMap(c=>[c.start,c.signDate,contractEnd(c)])].map(d=>String(d||'').slice(0,4)).filter(y=>/^\d{4}$/.test(y)).sort();
  return ys.length? [ys[0], ys[ys.length-1]] : null; }
function pjF(){ const f=S.f; return {y:f.pjy||TODAY.slice(0,4), s:f.pjs||'run'}; }
function pjInYear(p,Y){ if(Y==='*') return true; const r=pjYears(p); if(!r) return true;
  return pjDone(p)? r[0]<=Y && Y<=r[1] : r[0]<=Y; }
function pjInStatus(p,s){ return s==='*' || (s==='run'? !pjDone(p) : s==='done'? pjDone(p) : p.status===s); }
const pjYearList=()=>[...new Set([TODAY.slice(0,4), ...projects().flatMap(p=>pjYears(p)||[])])].sort().reverse();
const pjFilterBar=()=>{ const F=pjF(), st=catalog('Trạng thái dự án'), extra=[...new Set(projects().map(p=>p.status))].filter(x=>x && !st.includes(x));
  return `<select data-f="pjy" aria-label="Năm">${opts([...pjYearList().map(y=>[y,'Năm '+y]),['*','Tất cả các năm']],F.y)}</select>
  <select data-f="pjs" aria-label="Trạng thái"><optgroup label="Nhóm trạng thái">${opts([['run','Đang thực hiện (chưa hoàn thành)'],['done','Đã hoàn thành'],['*','Tất cả trạng thái']],F.s)}</optgroup><optgroup label="Từng trạng thái">${opts([...st,...extra],F.s)}</optgroup></select>`; };
const pjFilterText=()=>{ const F=pjF(); const sl={run:'đang thực hiện',done:'đã hoàn thành','*':'mọi trạng thái'}[F.s]||('trạng thái '+F.s);
  return (F.y==='*'?'mọi năm':'năm '+F.y)+', '+sl; };
function projListRows(){ const q=S.f.pq||'', F=pjF();
  return projects().filter(p=>(!S.pid||p.id===S.pid) && has(p,q) && pjInStatus(p,F.s) && pjInYear(p,F.y)).map(p=>({...p, prog:projProgress(p.id), exp:projExpected(p.id), nk:D('packages').filter(k=>k.projectId===p.id).length})); }
ACT['export-projects']=()=>{ const rows=projListRows(), q=S.f.pq||'';
  const head=['STT','Mã dự án','Tên dự án','Nhóm dự án','Giai đoạn','Trạng thái','Chủ đầu tư','Địa điểm','Nguồn vốn','Tổng mức đầu tư (đồng)','Số gói thầu','Ngày bắt đầu','Ngày kết thúc','Tiến độ thực tế (%)','Tiến độ kế hoạch (%)'];
  exportXlsx(`DanhSachDuAn_${pjF().y==='*'?'TatCaNam':pjF().y}_${TODAY}.xlsx`, [{name:'Du an', title:'DANH SÁCH DỰ ÁN', money:[9], sub:BR.reportOrg+' · Lập ngày '+fmtDate(TODAY)+' · '+pjFilterText()+(q?' · Tìm: '+q:''), head,
    rows:rows.map((r,i)=>[i+1, r.code||'', r.name||'', r.group||'', r.phase||'', r.status||'', r.owner||'', r.location||'', r.capital||'', +r.tmdt||0, r.nk, fmtDate(r.start), fmtDate(r.end), Math.round(+r.prog||0), Math.round(+r.exp||0)])}]);
  log('Xuất danh sách','logs','Danh sách dự án'); };
VIEWS['du-an']=()=>{
  const sel=S.sel.project && get('projects',S.sel.project);
  if(sel && pidOk(sel.id)) return projectDetail(sel);
  const q=S.f.pq||'';
  const rows=projListRows(), all=projects().filter(p=>!S.pid||p.id===S.pid).length;
  return `<div class="head"><div class="grow"><h1>Danh sách dự án</h1><p>${rows.length} dự án (${esc(pjFilterText())}${rows.length<all?`, trong tổng số ${all} dự án`:''}), tổng mức đầu tư ${fmtTy(sum(rows,'tmdt'))}</p></div><button class="btn" data-act="export-projects">Xuất Excel</button>${can('du-an','edit')?`<button class="btn primary" data-act="add-project">+ Thêm dự án</button>`:''}</div>
  <div class="toolbar"><input type="search" placeholder="Tìm theo mã, tên, địa điểm…" data-f="pq" value="${esc(q)}" aria-label="Tìm dự án">${pjFilterBar()}</div>
  ${table([{h:'Mã',f:r=>`<span class="num" style="white-space:nowrap">${esc(r.code)}</span>`},{h:'Tên dự án',f:r=>`<b style="font-weight:600">${esc(r.name)}</b>${[r.group,r.phase].filter(Boolean).length?`<div class="small muted">${esc([r.group,r.phase].filter(Boolean).join(' · '))}</div>`:''}`},{h:'Trạng thái',f:r=>statusPill(r.status)},
    {h:'Tổng mức đầu tư',r:1,f:r=>fmtTy(r.tmdt)},{h:'Gói thầu',r:1,f:r=>r.nk},{h:'Thời gian',f:r=>r.start||r.end?`<span class="num small">${fmtDate(r.start)} – ${fmtDate(r.end)}</span>`:'<span class="small muted">Chưa có</span>'},
    {h:'Tiến độ',f:r=>`<div style="min-width:130px">${progBar(r.prog, r.exp-r.prog>10?'warn':'')}</div>`}], rows, {rowAct:'open-project', empty:'Không có dự án phù hợp.'})}`;
};
function projectDetail(p){
  const t=S.tab.proj||'info';
  const tabs=[['info','Thông tin chung'],['tasks','Công việc'],['legal','Hồ sơ pháp lý'],['status','Tình trạng thực hiện']];
  let body='';
  if(t==='info'){
    body=`<div class="grid g2"><div class="card"><dl class="kv">
      <dt>Mã dự án</dt><dd class="num">${esc(p.code)}</dd><dt>Nhóm dự án</dt><dd>${esc(p.group||'—')}</dd><dt>Giai đoạn</dt><dd>${esc(p.phase||'—')}</dd><dt>Trạng thái</dt><dd>${statusPill(p.status)}</dd>
      <dt>Tổng mức đầu tư</dt><dd class="num">${fmtVND(p.tmdt)} đồng</dd><dt>Nguồn vốn</dt><dd>${esc(p.capital||'—')}</dd><dt>Chủ đầu tư</dt><dd>${esc(p.owner||'—')}</dd>${viewerGroups().length?`<dt>Khách hàng được xem</dt><dd>${esc(viewerNames(p).join(', ')||'Chưa gán tài khoản nào')}</dd>`:''}
      <dt>${XD('Vai trò của Ban','Vai trò của đơn vị')}</dt><dd>${p.boardRole?pill(p.boardRole,'info'):'—'}</dd><dt>Người quyết định đầu tư</dt><dd>${esc(p.decisionMaker||'—')}</dd><dt>Hình thức quản lý</dt><dd>${esc(p.mgmtForm||'—')}</dd><dt>Loại dự án</dt><dd>${esc([p.projectKind,p.reportType].filter(Boolean).join(' · ')||'—')}</dd>
      ${isIT()?`<dt>Lĩnh vực</dt><dd>${esc(p.field||'—')}</dd>`:''}<dt>${XD('Địa điểm','Phạm vi triển khai')}</dt><dd>${esc(p.location||'—')}</dd><dt>Thời gian</dt><dd class="num">${fmtDate(p.start)} – ${fmtDate(p.end)}</dd><dt>Quyết định phê duyệt</dt><dd>${(()=>{ const l=findLegal(p.id,'','Quyết định phê duyệt dự án'); return l? `<span class="num">${esc(l.number)}</span> ngày ${fmtDate(l.date)}${l.issuer?' · '+esc(l.issuer):''}<div style="margin-top:4px">${attLinks(atts('legal',l.id))}</div>` : esc(p.decision||'—'); })()}</dd><dt>Quy mô</dt><dd>${esc(p.desc||'—')}</dd></dl></div>
      ${keyLegalCard(p)}
      <div class="card"><h2>Gói thầu thuộc dự án</h2>${table([{h:'Mã',f:r=>`<span class="num" style="white-space:nowrap">${esc(r.code)}</span>`},{h:'Tên gói thầu',k:'name'},{h:'Giá gói thầu',r:1,f:r=>fmtTy(r.estimate)},{h:'Trạng thái',f:r=>statusPill(r.status)}], D('packages').filter(k=>k.projectId===p.id).sort(by('code')), {rowAct:'open-pkg', empty:'Chưa có gói thầu.'})}</div></div>`;
  } else if(t==='tasks'){
    const rows=D('tasks').filter(x=>x.projectId===p.id).sort(by('due')), tv=S.f.tview||'list';
    /* Bản 1.8.9: xem theo người thực hiện */
    const seg=`<span class="seg" role="group" aria-label="Cách xem" style="display:inline-flex;gap:4px"><button class="btn sm ${tv==='list'?'primary':'ghost'}" data-act="tview" data-id="list">Danh sách</button><button class="btn sm ${tv==='person'?'primary':'ghost'}" data-act="tview" data-id="person">Theo người thực hiện</button></span>`;
    if(tv==='person') body=`<div class="toolbar" style="margin-bottom:8px">${seg}</div>`+taskByPerson(rows, false);
    else body=`<div class="card"><div class="ch"><h2>Công việc thuộc dự án</h2><span style="display:flex;gap:6px;flex-wrap:wrap">${seg}${can('du-an','edit')?`<button class="btn primary sm" data-act="add-task" data-id="${p.id}">+ Thêm công việc</button>`:''}</span></div>
    ${table([{h:'Công việc',k:'name'},{h:'Phụ trách',k:'assignee'},{h:'Ưu tiên',f:r=>pill(r.priority||'—', r.priority==='Cao'?'warn':'')},{h:'Hạn',f:r=>`<span class="num" style="${r.due<TODAY&&r.status!=='Hoàn thành'?'color:var(--red);font-weight:600':''}">${fmtDate(r.due)}</span>`},{h:'Trạng thái',f:r=>statusPill(r.status)},{h:'Tệp',f:r=>attCell(atts('tasks',r.id))}], rows, {actions:r=>editBtns('du-an','tasks',r.id, r.status!=='Hoàn thành'&&can('du-an','edit')?`<button class="btn sm ghost" data-act="task-done" data-id="${r.id}">Hoàn thành</button>`:''), empty:'Chưa có công việc.'})}</div>`;
  } else if(t==='legal'){
    body=legalCard(D('legal').filter(l=>l.projectId===p.id && !l.packageId), p.id, null, 'du-an', 'Hồ sơ pháp lý dự án');
  } else {
    const ks=D('packages').filter(k=>k.projectId===p.id).sort(by('code')); const cs=D('contracts').filter(c=>contractPid(c)===p.id);
    const sc=sCurve(SCHED().filter(s=>s.projectId===p.id)); const cv=sum(cs,contractValue), paid=sum(cs,c=>contractPaid(c.id));
    const tEl=p.start&&p.end? Math.min(100,pct(Math.max(0,days(p.start,TODAY)),days(p.start,p.end))):0;
    body=`<div class="grid g4"><div class="card kpi"><div class="eyebrow">Tiến độ thực tế</div><div class="v">${fmtP(projProgress(p.id))}</div><div class="s">Kế hoạch đến nay ${fmtP(projExpected(p.id))}</div></div>
      <div class="card kpi"><div class="eyebrow">Thời gian đã qua</div><div class="v">${fmtP(tEl)}</div><div class="s">Còn ${Math.max(0,days(TODAY,p.end||TODAY))} ngày</div></div>
      <div class="card kpi"><div class="eyebrow">Giá trị hợp đồng</div><div class="v">${fmtTy(cv)}</div><div class="s">${fmtP(pct(cv,p.tmdt))} TMĐT</div></div>
      <div class="card kpi"><div class="eyebrow">Đã giải ngân</div><div class="v">${fmtTy(paid)}</div><div class="s">${fmtP(pct(paid,p.tmdt))} TMĐT</div></div></div>
      <div class="grid g2"><div class="card"><h2>Đường cong S của dự án</h2>${sc?lineChart({labels:sc.labels, series:[{name:'Kế hoạch',color:'var(--c5)',values:sc.plan,dash:true},{name:'Thực tế',color:'var(--c1)',values:sc.act,area:true}]}):emptyBox('Chưa lập kế hoạch tiến độ.')}</div>
      <div class="card"><h2>Tình trạng từng gói thầu</h2>${table([{h:'Gói',k:'code'},{h:'Tiến độ',f:r=>`<div style="min-width:120px">${progBar(pkgProgress(r.id), pkgExpected(r.id)-pkgProgress(r.id)>10?'warn':'')}</div>`},{h:'KH đến nay',r:1,f:r=>fmtP(pkgExpected(r.id))},{h:'Trạng thái',f:r=>statusPill(r.status)}], ks, {rowAct:'open-pkg'})}</div></div>
      ${(()=>{ const al=alerts({all:true}).filter(a=>a.pid===p.id); return al.length?`<div class="card"><div class="ch"><h2>Cảnh báo của dự án (${al.length})</h2><button class="btn sm ghost" data-act="alerts-proj" data-id="${p.id}">Mở trong Trung tâm cảnh báo</button></div>${alertList(al)}</div>`:''; })()}`;
  }
  return `<div class="head"><div class="grow"><button class="btn ghost sm" data-act="back-project">← Danh sách dự án</button><h1 style="margin-top:8px">${esc(p.name)}</h1><p><span class="num">${esc(p.code)}</span> · ${statusPill(p.status)}</p></div>${can('du-an','edit')?`<button class="btn" data-act="edit-projects" data-id="${p.id}">Sửa thông tin</button><button class="btn ghost danger" data-act="del" data-col="projects" data-id="${p.id}">Xóa</button>`:''}</div>
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="proj" data-id="${k}">${l}</button>`).join('')}</div>${body}`;
}
const taskFields=()=>[{key:'name',label:'Tên công việc',req:true,full:true},{key:'assignee',label:'Đơn vị / người phụ trách'},{key:'due',label:'Hạn hoàn thành',type:'date',req:true},{key:'priority',label:'Mức ưu tiên',type:'select',options:['Cao','Trung bình','Thấp'],def:'Trung bình'},{key:'status',label:'Trạng thái',type:'select',options:['Chưa bắt đầu','Đang thực hiện','Hoàn thành','Tạm dừng'],def:'Chưa bắt đầu',req:true},{key:'note',label:'Ghi chú',type:'textarea'},{key:'att',label:'Văn bản giao việc, tài liệu liên quan',type:'attach',col:'tasks',kind:'Văn bản giao việc'}];
ACT.tview=k=>{ S.f.tview=k; S.pg={}; render(); };
ACT['add-task']=(pid)=>openForm({title:'Thêm công việc', fields:taskFields(), onSave:v=>save('tasks',{...v, projectId:pid})});
ACT['edit-tasks']=(id)=>openForm({title:'Cập nhật công việc', fields:taskFields(), value:get('tasks',id), onSave:v=>save('tasks',v)});
ACT['task-done']=(id)=>{ const t=get('tasks',id); openForm({title:'Hoàn thành: '+t.name, narrow:true, submit:'Xác nhận hoàn thành', value:{...t, doneDate:TODAY},
  fields:[{key:'doneDate',label:'Ngày hoàn thành',type:'date',req:true,full:true},{key:'note',label:'Kết quả, ghi chú',type:'textarea'},{key:'att',label:'Tệp kết quả (văn bản, báo cáo, biên bản…)',type:'attach',col:'tasks',kind:'Kết quả',full:true}],
  onSave:v=>save('tasks',{...v, status:'Hoàn thành'})}); };

/* Hồ sơ pháp lý dùng chung cho dự án (UC4) và gói thầu (UC11) */
function legalCard(rows, pid, kid, mod, title){
  return `<div class="card"><div class="ch"><h2>${esc(title)}</h2>${can(mod,'edit')?`<button class="btn primary sm" data-act="add-legal" data-id="${pid}" data-k="${kid||''}" data-m="${mod}">+ Thêm hồ sơ</button>`:''}</div>
  ${table([{h:'Loại hồ sơ',f:r=>esc(catText(r.type||''))},{h:'Số hiệu',f:r=>`<span class="num">${esc(r.number)}</span>`},{h:'Ngày',f:r=>`<span class="num">${fmtDate(r.date)}</span>`},{h:'Cơ quan ban hành',k:'issuer'},{h:'Trích yếu',k:'title'},{h:'Hiệu lực đến',f:r=>r.validUntil?`<span class="num" style="${r.validUntil<TODAY?'color:var(--red);font-weight:600':r.validUntil<=addDays(TODAY,30)?'color:var(--amber);font-weight:600':''}">${fmtDate(r.validUntil)}</span>`:'<span class="muted small">—</span>'},{h:'Tệp',f:r=>attCell(atts('legal',r.id))},...(wfOn('legal',S.pid||null)||rows.some(x=>x.status)?[{h:'Trình duyệt',f:r=>wfPill('legal',r)}]:[])], rows.sort(by('date')), {actions:r=>wfBtns('legal',r)+(wfEditable('legal',r)?editBtns(mod,'legal',r.id):''), empty:'Chưa có hồ sơ pháp lý.'})}</div>`;
}
const legalFields=()=>[{key:'type',label:'Loại hồ sơ',type:'select',options:()=>catSel('Loại hồ sơ pháp lý'),req:true},{key:'number',label:'Số hiệu văn bản',req:true},{key:'date',label:'Ngày ban hành',type:'date',req:true},{key:'issuer',label:'Cơ quan ban hành'},{key:'title',label:'Trích yếu nội dung',full:true,req:true},
  {key:'validUntil',label:'Hiệu lực đến (bảo lãnh, giấy phép… để cảnh báo trước 30 ngày)',type:'date'},{key:'att',label:'Tệp đính kèm (PDF, ảnh scan, Word, Excel…)',type:'attach',col:'legal'}];
ACT['add-legal']=(pid,el)=>openForm({wf:'legal', title:'Thêm hồ sơ pháp lý', fields:legalFields(), value:{type:el.dataset.t||''}, onSave:v=>save('legal',{...v, projectId:pid, packageId:el.dataset.k||''})});
ACT['edit-legal']=(id)=>openForm({wf:'legal', title:'Cập nhật hồ sơ pháp lý', fields:legalFields(), value:get('legal',id), onSave:v=>save('legal',v)});
/* Văn bản pháp lý chính của dự án (chủ trương, phê duyệt, điều chỉnh) kèm tệp, hiển thị ở Thông tin chung */
const KEY_LEGAL=['Quyết định chủ trương đầu tư','Quyết định phê duyệt dự án','Quyết định điều chỉnh dự án'];
function keyLegalCard(p){
  const rows=D('legal').filter(l=>l.projectId===p.id && !l.packageId && KEY_LEGAL.includes(l.type)).sort(by('date'));
  const ed=can('du-an','edit');
  return `<div class="card"><div class="ch"><h2>Văn bản pháp lý chính</h2>${ed?`<button class="btn sm" data-act="add-legal" data-id="${p.id}" data-k="" data-t="Quyết định chủ trương đầu tư">+ QĐ chủ trương</button><button class="btn sm" data-act="add-legal" data-id="${p.id}" data-k="" data-t="Quyết định điều chỉnh dự án">+ QĐ điều chỉnh</button>`:''}</div>
  ${table([{h:'Loại',f:r=>esc(catText(r.type||''))},{h:'Số hiệu',f:r=>`<span class="num">${esc(r.number)}</span>`},{h:'Ngày',f:r=>`<span class="num">${fmtDate(r.date)}</span>`},{h:'Tệp',f:r=>attCell(atts('legal',r.id))}], rows, {actions:r=>wfBtns('legal',r)+wfEditBtns('legal',r), empty:'Chưa có quyết định chủ trương, phê duyệt hoặc điều chỉnh dự án.'})}</div>`;
}
