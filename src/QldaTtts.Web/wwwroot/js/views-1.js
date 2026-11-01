/* ===== Trạng thái giao diện & khung ứng dụng ===== */
const S = {user:null, route:'tong-quan', pid:'', dirty:false, sel:{}, tab:{}, f:{}, after:[], cam:null};
const ACT = {};
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
  if(!$('#app')) buildShell();
  let r=(location.hash||'').slice(1)||'tong-quan';
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
}
function buildShell(){
  $('#root').innerHTML=`<div class="app" id="app">
    <aside class="side" id="side"><div class="brand"><div class="mark${BR.logo?' logo':''}" id="brandmark">${brandMark()}</div><div><span id="brand_org">${esc(BR.orgShort)}</span><b id="brand_app">${esc(BR.appName)}</b></div></div><nav class="nav" id="nav"></nav><div class="foot" id="sidefoot"></div></aside>
    <div class="main"><header class="top" id="top"></header><main class="content" id="content"></main></div>
  </div><nav class="tabbar" id="tabbar"></nav>`;
}
function renderNav(){
  const al=alerts(); const cnt={}; al.forEach(a=>cnt[a.mod]=(cnt[a.mod]||0)+1);
  let html='', grp='';
  MODULES.filter(m=>can(m.key)).forEach(m=>{
    if(m.grp!==grp){ grp=m.grp; html+=`<div class="grp">${esc(grp)}</div>`; }
    html+=`<a href="#${m.key}" class="${S.route===m.key?'on':''}">${ic(m.icon)}<span>${esc(m.label)}</span>${cnt[m.key]?`<span class="cnt">${cnt[m.key]}</span>`:''}</a>`;
  });
  html+=`<div class="grp">Tiện ích</div><a href="#hien-truong" class="${S.route==='hien-truong'?'on':''}">${ic('phone')}<span>Hiện trường (di động)</span></a><a href="#huong-dan" class="${S.route==='huong-dan'?'on':''}">${ic('help')}<span>Hướng dẫn sử dụng</span></a><a href="#doi-chieu" class="${S.route==='doi-chieu'?'on':''}">${ic('check')}<span>Danh mục chức năng</span></a>`;
  $('#nav').innerHTML=html;
  $('#sidefoot').innerHTML=`Phiên bản ${APP_VERSION} · ${esc(BR.support)}`;
  $('#brandmark').className='mark'+(BR.logo?' logo':''); $('#brandmark').innerHTML=brandMark(); $('#brand_org').textContent=BR.orgShort; $('#brand_app').textContent=BR.appName;
}
function renderTop(){
  const m=MODULES.find(x=>x.key===S.route); const title=m?m.label: S.route==='hien-truong'?'Hiện trường':S.route==='huong-dan'?'Hướng dẫn sử dụng':'Danh mục chức năng';
  const g=myGroup();
  $('#top').innerHTML=`<button class="btn ghost sm menu-btn" data-act="menu" aria-label="Mở menu">${ic('menu').replace('<svg','<svg width="18" height="18"')}</button>
    <div class="title">${esc(title)}</div><div class="sp"></div>
    <select id="gpid" data-f="__pid" aria-label="Lọc theo dự án">${opts(projOpts(), S.pid, 'Tất cả dự án')}</select>
    <span class="mode ${Store.mode==='server'?'shared':''}" title="${Store.mode==='server'?'Dữ liệu lưu tập trung trên máy chủ, mọi người dùng cùng thấy':'Mất kết nối máy chủ: thay đổi chưa được lưu'}">${Store.mode==='server'?'● Đã kết nối máy chủ':'● Mất kết nối'}</span>
    <div class="who"><button class="btn ghost sm" data-act="account" title="Tài khoản"><span class="avatar">${esc(initials(S.user.name))}</span><span class="nm" style="text-align:left;line-height:1.2">${esc(S.user.name)}<br><span class="small muted">${esc(g?g.name:'')}</span></span></button></div>`;
}
function renderTabbar(){
  const items=[['tong-quan','dash','Tổng quan'],['du-an','proj','Dự án'],['hien-truong','phone','Hiện trường'],['nhat-ky','book','Nhật ký']].filter(x=>can(x[0]));
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
  S.f[k]=el.type==='checkbox'?el.checked:el.value;
  clearTimeout(_ft); _ft=setTimeout(render, el.tagName==='INPUT'&&el.type==='search'?180:0);
}
document.addEventListener('input', e=>{ if(e.target.matches('input[type=search][data-f]')) onFilter(e); });
document.addEventListener('change', e=>{ if(e.target.matches('[data-f]') && !e.target.matches('input[type=search]')) onFilter(e); });
ACT.menu=()=>$('#side').classList.toggle('open');
ACT.tab=(id,el)=>{ S.tab[el.dataset.g]=id; if(el.dataset.g==='qt' && typeof ADM!=='undefined'){ delete ADM.storage; delete ADM.auto; } render(); };
ACT.go=(id)=>{ location.hash=id; };
ACT.photo=(id,el)=>{ openModal(`<div class="lightbox" style="display:grid;gap:8px;justify-items:center"><img src="${esc(el.getAttribute('src'))}" alt=""><button class="btn" data-close>Đóng</button></div>`); };

/* Xem nhanh ảnh đính kèm, danh sách tệp đính kèm */
ACT['att-view']=(id,el,e)=>{ const a=get('attachments',id); if(!a) return; e&&e.preventDefault&&e.preventDefault();
  openModal(`<div class="lightbox" style="display:grid;gap:8px;justify-items:center"><img src="${attUrl(a)}" alt="${esc(a.fileName)}"><div class="small" style="color:#fff">${esc(a.fileName)} · ${attMeta(a)}</div><div class="toolbar"><a class="btn" href="${attUrl(a)}?download=true">Tải về</a><button class="btn" data-close>Đóng</button></div></div>`); };
ACT['att-all']=(ids)=>{ const list=String(ids).split(',').map(id=>get('attachments',id)).filter(Boolean);
  openModal(`<div class="mform narrow"><header><h3>Tệp đính kèm (${list.length})</h3><button class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:16px;overflow:auto"><ul class="attlist">${list.map(a=>`<li><a href="${attUrl(a)}" target="_blank" rel="noopener">${attIcon(a)} ${esc(a.fileName)}</a>${a.kind?` <span class="pill">${esc(a.kind)}</span>`:''}<span class="small muted">${attMeta(a)}</span></li>`).join('')}</ul></div></div>`); };

const DEPS = {projects:[['packages','projectId'],['tasks','projectId'],['legal','projectId'],['items','projectId'],['schedule','projectId'],['diaries','projectId'],['models','projectId']],
  packages:[['contracts','packageId'],['schedule','packageId'],['diaries','packageId'],['legal','packageId']], contracts:[['boq','contractId'],['payments','contractId'],['payplans','contractId'],['addenda','contractId']],
  boq:[['volumes','boqId']], groups:[['users','groupId']], items:[['schedule','itemId']]};
const COL_MOD = {projects:'du-an',tasks:'du-an',legal:'du-an',items:'mo-hinh',models:'mo-hinh',packages:'goi-thau',contracts:'goi-thau',addenda:'goi-thau',schedule:'tien-do',diaries:'nhat-ky',boq:'khoi-luong',volumes:'khoi-luong',payplans:'thanh-toan',payments:'thanh-toan',users:'quan-tri',groups:'quan-tri',catalogs:'quan-tri'};
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
  return `<div class="art">${BR.logo?'':`<div class="drum-mark">${drumSVG()}</div>`}
  <div class="art-head"><div class="seal${BR.logo?' logo':''}">${brandMark()}</div><div><div class="org1">${esc(BR.orgName)}</div><div class="org2">${esc(BR.unitName)}</div></div></div>
  <div class="art-title"><h1>${esc(BR.bannerTitle)}</h1><p>${esc(BR.bannerText)}</p></div>
  <div class="meta">${esc(BR.address)}</div></div>`;
}
function renderSetup(){
  $('#root').innerHTML=`<div class="auth">${authArt()}<div class="box"><form id="setup" autocomplete="off">
    <div class="form-head"><h2>Khởi tạo hệ thống</h2><p class="muted small">Tạo tài khoản quản trị đầu tiên. Hệ thống chưa có người dùng. Tài khoản này có toàn quyền và dùng để cấp tài khoản cho cán bộ khác.</p></div>
    <div class="fld"><label for="su_name">Họ và tên</label><input id="su_name" required value=""></div>
    <div class="fld"><label for="su_user">Tên đăng nhập</label><input id="su_user" required value="admin"></div>
    <div class="fld"><label for="su_pw">Mật khẩu (tối thiểu 8 ký tự, có chữ và số)</label><input id="su_pw" type="password" required autocomplete="new-password"></div>
    <div class="fld"><label for="su_pw2">Nhập lại mật khẩu</label><input id="su_pw2" type="password" required autocomplete="new-password"></div>
    <label class="checks"><input type="checkbox" id="su_sample" checked> Nạp dữ liệu mẫu để chạy thử (4 dự án, 7 gói thầu, 6 hợp đồng và tài khoản mẫu)</label>
    <div class="err" id="su_err"></div>
    <button class="btn primary" type="submit" style="justify-content:center;padding:10px">Khởi tạo hệ thống</button>
    <p class="small muted" style="margin:0">Dữ liệu được lưu tập trung trong cơ sở dữ liệu SQL Server của máy chủ.</p>
  </form><p class="auth-foot">${brandFoot()}</p></div></div>`;
  $('#setup').onsubmit=async e=>{
    e.preventDefault(); const err=$('#su_err');
    const name=$('#su_name').value.trim(), username=$('#su_user').value.trim().toLowerCase(), pw=$('#su_pw').value, pw2=$('#su_pw2').value;
    if(!name||!username) return err.textContent='Vui lòng nhập họ tên và tên đăng nhập.';
    if(!/^[a-z0-9._-]{3,32}$/.test(username)) return err.textContent='Tên đăng nhập 3–32 ký tự, chỉ gồm chữ thường không dấu, số, dấu chấm, gạch.';
    if(!pwOk(pw)) return err.textContent='Mật khẩu cần tối thiểu 8 ký tự, gồm cả chữ và số.';
    if(pw!==pw2) return err.textContent='Hai lần nhập mật khẩu không khớp.';
    const btn=e.submitter||$('#setup button[type=submit]'); btn.disabled=true;
    try{
      err.style.color='var(--muted)'; err.textContent='Đang khởi tạo danh mục, nhóm quyền'+($('#su_sample').checked?' và dữ liệu mẫu':'')+'…';
      const body={name, username, password:pw, groups:defaultGroups(), catalogs:defaultCatalogs()};
      if($('#su_sample').checked){
        body.sample=makeSampleData();
        body.sampleUsers=[['lanhdao','Lãnh đạo Ban (mẫu)','g-lead','Lãnh đạo Ban'],['kythuat','Cán bộ kỹ thuật (mẫu)','g-tech','Phòng Kỹ thuật'],['ketoan','Kế toán (mẫu)','g-acc','Phòng Kế toán'],['giamsat','Tư vấn giám sát TV01 (mẫu)','g-site','Tư vấn giám sát']].map(([username,name,groupId,unit])=>({username,name,groupId,unit}));
      }
      const r=await api('POST','/api/auth/setup',body,{auth:true});
      Store.initialized=true; Store.sampleUsers=!!body.sampleUsers; location.hash='tong-quan';
      await authDone(r);
    }catch(ex){ console.error(ex); err.style.color='var(--red)'; err.textContent=errText(ex); btn.disabled=false; }
  };
}
function renderLogin(){
  $('#root').innerHTML=`<div class="auth">${authArt()}<div class="box"><form id="login">
    <div class="form-head"><h2>Đăng nhập hệ thống</h2><p class="muted small">Sử dụng tài khoản do quản trị hệ thống cấp.</p></div>
    <div class="fld"><label for="lg_user">Tên đăng nhập</label><input id="lg_user" autocomplete="username" required></div>
    <div class="fld"><label for="lg_pw">Mật khẩu</label><input id="lg_pw" type="password" autocomplete="current-password" required></div>
    <div class="err" id="lg_err"></div>
    <button class="btn primary" type="submit" style="justify-content:center;padding:10px">Đăng nhập</button>
    <p class="small muted" style="margin:0">Quên mật khẩu: liên hệ quản trị hệ thống để đặt lại. ${Store.sampleUsers?'Tài khoản mẫu: lanhdao, kythuat, ketoan, giamsat (mật khẩu như tài khoản quản trị lúc khởi tạo).':''}</p>
  </form><p class="auth-foot">${brandFoot()}</p></div></div>`;
  $('#login').onsubmit=async e=>{
    e.preventDefault(); const err=$('#lg_err');
    const un=$('#lg_user').value.trim().toLowerCase(), pw=$('#lg_pw').value;
    const btn=$('#login button[type=submit]'); btn.disabled=true; err.textContent='';
    try{ const r=await api('POST','/api/auth/login',{username:un, password:pw},{auth:true}); await authDone(r); }
    catch(ex){ err.textContent=errText(ex); btn.disabled=false; }
  };
}
/* ===== Xác thực 2 lớp (bắt buộc với tài khoản quản trị) ===== */
async function authDone(r){
  if(r.mfa){ S.mfaStep=r; return renderMfa(); }
  if(r.recoveryCodes){ S.mfaStep={mfa:'codes', codes:r.recoveryCodes, user:r.user}; return renderMfa(); }
  S.mfaStep=null; S.user=r.user; S.mfa=r.recoveryLeft!=null?{enabled:true, required:true, recoveryLeft:r.recoveryLeft}:S.mfa;
  await Store.load(); render();
}
function authBox(inner){ $('#root').innerHTML=`<div class="auth">${authArt()}<div class="box">${inner}<p class="auth-foot">${brandFoot()}</p></div></div>`; }
const codeField=(label)=>`<div class="fld"><label for="mf_code">${label}</label><input id="mf_code" class="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]*" maxlength="7" required></div>`;
function recoveryText(codes, user){ return `MÃ KHÔI PHỤC XÁC THỰC 2 LỚP – PHẦN MỀM QLDA TTTS\r\nTài khoản: ${user}\r\nTạo lúc: ${fmtDT(new Date().toISOString())}\r\n\r\nMỗi mã chỉ dùng được một lần, khi không có điện thoại để lấy mã 6 số.\r\nCất giữ nơi an toàn, không chia sẻ cho người khác.\r\n\r\n${codes.map((c,i)=>String(i+1).padStart(2,' ')+'. '+c).join('\r\n')}\r\n`; }
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
  <button class="btn" data-act="chpw">${ic('key').replace('<svg','<svg width="16" height="16"')} Đổi mật khẩu</button>
  <button class="btn danger" data-act="logout">${ic('out').replace('<svg','<svg width="16" height="16"')} Đăng xuất</button></div></div>`);
};
ACT.logout=async()=>{ try{ await api('POST','/api/auth/logout',undefined,{auth:true}); }catch{} S.user=null; S.mfa=null; S.mfaStep=null; Store.clear(); closeModal(); S.sel={}; render(); };
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
const STATUS_COL = {'Chuẩn bị đầu tư':'var(--c3)','Đang lựa chọn nhà thầu':'var(--c4)','Đang thi công':'var(--c1)','Tạm dừng':'var(--red)','Hoàn thành':'var(--c2)','Đã quyết toán':'var(--c5)'};
VIEWS['tong-quan']=()=>{
  const ps=projects().filter(p=>!S.pid||p.id===S.pid); const pids=ps.map(p=>p.id);
  const cs=D('contracts').filter(c=>pids.includes(contractPid(c)));
  const tm=sum(ps,'tmdt'), cv=sum(cs,contractValue), done=sum(cs,c=>contractDone(c.id)), acc=sum(cs,c=>contractAcc(c.id)), paid=sum(cs,c=>contractPaid(c.id));
  const al=alerts(); const nb=al.filter(a=>a.lvl==='bad').length;
  const stats=catalog('Trạng thái dự án'); const extra=[...new Set(ps.map(p=>p.status))].filter(s=>!stats.includes(s));
  const donutItems=[...stats,...extra].map(s=>({label:s, value:ps.filter(p=>p.status===s).length, color:STATUS_COL[s]||'var(--c5)'})).filter(i=>i.value);
  const pk=D('packages').filter(k=>pids.includes(k.projectId) && D('schedule').some(s=>s.packageId===k.id)).sort(by('code'));
  const sc=sCurve(D('schedule').filter(s=>pids.includes(s.projectId)));
  const tasks=D('tasks').filter(t=>pids.includes(t.projectId) && t.status!=='Hoàn thành').sort(by('due')).slice(0,6);
  const pjRows=ps.map(p=>{ const c=D('contracts').filter(c=>contractPid(c)===p.id); return {...p, cv:sum(c,contractValue), paid:sum(c,x=>contractPaid(x.id)), prog:projProgress(p.id), exp:projExpected(p.id)}; });
  return `<div class="head"><div class="grow"><h1>Tổng quan tình hình thực hiện</h1><p>Số liệu đến ngày ${fmtDate(TODAY)}${S.pid?' · '+esc(projOf(S.pid)?.code):' · tất cả dự án được phân quyền'}</p></div></div>
  <div class="grid g5 kpis" style="grid-template-columns:repeat(5,minmax(0,1fr))">
    <div class="card kpi"><div class="eyebrow">Dự án</div><div class="v">${ps.length}</div><div class="s">${ps.filter(p=>p.status==='Đang thi công').length} đang thi công</div></div>
    <div class="card kpi"><div class="eyebrow">Tổng mức đầu tư</div><div class="v">${fmtTy(tm)}</div><div class="s">${D('packages').filter(k=>pids.includes(k.projectId)).length} gói thầu</div></div>
    <div class="card kpi"><div class="eyebrow">Giá trị hợp đồng</div><div class="v">${fmtTy(cv)}</div><div class="s">${cs.length} hợp đồng · thực hiện ${fmtP(pct(done,cv))}</div></div>
    <div class="card kpi"><div class="eyebrow">Đã giải ngân</div><div class="v">${fmtTy(paid)}</div><div class="s">${fmtP(pct(paid,tm))} tổng mức đầu tư</div></div>
    <div class="card kpi ${nb?'bad':al.length?'warn':''}"><div class="eyebrow">Cảnh báo</div><div class="v">${al.length}</div><div class="s">${nb} nghiêm trọng</div></div>
  </div>
  <div class="grid g3">
    <div class="card"><h2>Dự án theo trạng thái</h2>${donutItems.length?donut(donutItems, ps.length):emptyBox('Chưa có dự án.')}</div>
    <div class="card span2"><h2>Tiến độ gói thầu: kế hoạch và thực tế</h2>${pk.length?barChart({labels:pk.map(k=>k.code), series:[{name:'Kế hoạch đến nay',color:'var(--c5)',values:pk.map(k=>pkgExpected(k.id))},{name:'Thực tế',color:'var(--c1)',values:pk.map(k=>pkgProgress(k.id))}], max:100, fmt:v=>Math.round(v)+'%'}):emptyBox('Chưa có kế hoạch tiến độ.')}</div>
  </div>
  <div class="grid g2">
    <div class="card"><h2>Giá trị hợp đồng và thực hiện hợp đồng</h2>${cs.length?barChart({labels:cs.map(c=>(pkgOf(c.packageId)||{}).code||c.number), series:[{name:'Giá trị HĐ',color:'var(--c5)',values:cs.map(contractValue)},{name:'Thực hiện',color:'var(--c1)',values:cs.map(c=>contractDone(c.id))},{name:'Đã thanh toán',color:'var(--c2)',values:cs.map(c=>contractPaid(c.id))}], fmt:v=>fmtN(v/1e9,0)+' tỷ'}):emptyBox('Chưa có hợp đồng.')}</div>
    <div class="card"><h2>Khối lượng thực hiện, nghiệm thu và thanh toán</h2>${ps.length?barChart({labels:ps.map(p=>p.code), series:[{name:'Thực hiện',color:'var(--c1)',values:ps.map(p=>sum(D('contracts').filter(c=>contractPid(c)===p.id),c=>contractDone(c.id)))},{name:'Nghiệm thu',color:'var(--c3)',values:ps.map(p=>sum(D('contracts').filter(c=>contractPid(c)===p.id),c=>contractAcc(c.id)))},{name:'Thanh toán',color:'var(--c2)',values:ps.map(p=>sum(D('contracts').filter(c=>contractPid(c)===p.id),c=>contractPaid(c.id)))}], fmt:v=>fmtN(v/1e9,0)+' tỷ'}):''}</div>
  </div>
  <div class="grid g2">
    <div class="card"><h2>So sánh kế hoạch và thực tế (đường cong S)</h2>${sc?lineChart({labels:sc.labels, series:[{name:'Kế hoạch lũy kế',color:'var(--c5)',values:sc.plan,dash:true},{name:'Thực tế lũy kế',color:'var(--c1)',values:sc.act,area:true}]}):emptyBox('Chưa có kế hoạch tiến độ.')}</div>
    <div class="card"><div class="ch"><h2>Cảnh báo và việc cần xử lý</h2></div><div class="list">${al.slice(0,7).map(a=>`<div class="alert ${a.lvl==='bad'?'bad':''}"><span style="flex:1">${a.text}</span><a href="#${a.mod}" class="small">Xem</a></div>`).join('')||'<div class="alert info">Không có cảnh báo.</div>'}
      ${al.length>7?`<div class="small muted">Còn ${al.length-7} cảnh báo khác.</div>`:''}
      ${tasks.length?`<div class="eyebrow" style="margin-top:8px">Công việc đang mở</div>`+tasks.map(t=>`<div class="small" style="display:flex;gap:8px;justify-content:space-between"><span>${esc(t.name)} <span class="muted">· ${esc(t.assignee||'')}</span></span><span class="num ${t.due<TODAY?'':'muted'}" style="${t.due<TODAY?'color:var(--red)':''}">${fmtDate(t.due)}</span></div>`).join(''):''}</div></div>
  </div>
  <div class="card"><h2>Tình hình thực hiện các dự án</h2>${table([
    {h:'Mã',f:r=>`<span class="num" style="white-space:nowrap">${esc(r.code)}</span>`},{h:'Tên dự án',f:r=>`<a href="#du-an" data-act="open-project" data-id="${r.id}">${esc(r.name)}</a>`},{h:'Trạng thái',f:r=>statusPill(r.status)},
    {h:'Tổng mức đầu tư',r:1,f:r=>fmtTy(r.tmdt)},{h:'Giá trị HĐ',r:1,f:r=>fmtTy(r.cv)},{h:'Đã thanh toán',r:1,f:r=>fmtTy(r.paid)},
    {h:'Tiến độ thực tế / kế hoạch',f:r=>`<div style="min-width:160px">${progBar(r.prog, r.exp-r.prog>10?'warn':'')}<div class="small muted">Kế hoạch ${Math.round(r.exp)}%</div></div>`}], pjRows)}</div>`;
};
ACT['open-project']=(id)=>{ S.sel.project=id; S.tab.proj='info'; if(location.hash==='#du-an') render(); else location.hash='du-an'; };

/* ===== QUẢN LÝ DỰ ÁN (UC1–5) ===== */
const projFields=()=>[
  {key:'code',label:'Mã dự án',req:true},{key:'status',label:'Trạng thái',type:'select',options:()=>catalog('Trạng thái dự án'),req:true},
  {key:'name',label:'Tên dự án',req:true,full:true},
  {key:'group',label:'Nhóm dự án',type:'select',options:()=>catalog('Nhóm dự án')},{key:'phase',label:'Giai đoạn',type:'select',options:()=>catalog('Giai đoạn')},
  {key:'tmdt',label:'Tổng mức đầu tư (đồng)',type:'money',req:true},{key:'capital',label:'Nguồn vốn',type:'select',options:()=>catalog('Nguồn vốn')},
  {key:'start',label:'Thời gian bắt đầu',type:'date'},{key:'end',label:'Thời gian hoàn thành',type:'date'},
  {key:'owner',label:'Chủ đầu tư / Đại diện',def:BR.ownerDefault},{key:'location',label:'Địa điểm xây dựng'},
  {key:'desc',label:'Quy mô, mô tả',type:'textarea'}];
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
VIEWS['du-an']=()=>{
  const sel=S.sel.project && get('projects',S.sel.project);
  if(sel && pidOk(sel.id)) return projectDetail(sel);
  const q=S.f.pq||'', st=S.f.pst||'';
  const rows=projects().filter(p=>(!S.pid||p.id===S.pid) && has(p,q) && (!st||p.status===st)).map(p=>({...p, prog:projProgress(p.id), exp:projExpected(p.id), nk:D('packages').filter(k=>k.projectId===p.id).length}));
  return `<div class="head"><div class="grow"><h1>Danh sách dự án</h1><p>${rows.length} dự án · Tổng mức đầu tư ${fmtTy(sum(rows,'tmdt'))}</p></div>${can('du-an','edit')?`<button class="btn primary" data-act="add-project">+ Thêm dự án</button>`:''}</div>
  <div class="toolbar"><input type="search" placeholder="Tìm theo mã, tên, địa điểm…" data-f="pq" value="${esc(q)}" aria-label="Tìm dự án"><select data-f="pst" aria-label="Trạng thái">${opts(catalog('Trạng thái dự án'),st,'Mọi trạng thái')}</select></div>
  ${table([{h:'Mã',f:r=>`<span class="num" style="white-space:nowrap">${esc(r.code)}</span>`},{h:'Tên dự án',f:r=>`<b style="font-weight:600">${esc(r.name)}</b><div class="small muted">${esc(r.group||'')} · ${esc(r.phase||'')}</div>`},{h:'Trạng thái',f:r=>statusPill(r.status)},
    {h:'Tổng mức đầu tư',r:1,f:r=>fmtTy(r.tmdt)},{h:'Gói thầu',r:1,f:r=>r.nk},{h:'Thời gian',f:r=>`<span class="num small">${fmtDate(r.start)} – ${fmtDate(r.end)}</span>`},
    {h:'Tiến độ',f:r=>`<div style="min-width:130px">${progBar(r.prog, r.exp-r.prog>10?'warn':'')}</div>`}], rows, {rowAct:'open-project', empty:'Không có dự án phù hợp.'})}`;
};
function projectDetail(p){
  const t=S.tab.proj||'info';
  const tabs=[['info','Thông tin chung'],['tasks','Công việc'],['legal','Hồ sơ pháp lý'],['status','Tình trạng thực hiện']];
  let body='';
  if(t==='info'){
    body=`<div class="grid g2"><div class="card"><dl class="kv">
      <dt>Mã dự án</dt><dd class="num">${esc(p.code)}</dd><dt>Nhóm dự án</dt><dd>${esc(p.group||'—')}</dd><dt>Giai đoạn</dt><dd>${esc(p.phase||'—')}</dd><dt>Trạng thái</dt><dd>${statusPill(p.status)}</dd>
      <dt>Tổng mức đầu tư</dt><dd class="num">${fmtVND(p.tmdt)} đồng</dd><dt>Nguồn vốn</dt><dd>${esc(p.capital||'—')}</dd><dt>Chủ đầu tư</dt><dd>${esc(p.owner||'—')}</dd>
      <dt>Địa điểm</dt><dd>${esc(p.location||'—')}</dd><dt>Thời gian</dt><dd class="num">${fmtDate(p.start)} – ${fmtDate(p.end)}</dd><dt>Quyết định phê duyệt</dt><dd>${(()=>{ const l=findLegal(p.id,'','Quyết định phê duyệt dự án'); return l? `<span class="num">${esc(l.number)}</span> ngày ${fmtDate(l.date)}${l.issuer?' · '+esc(l.issuer):''}<div style="margin-top:4px">${attLinks(atts('legal',l.id))}</div>` : esc(p.decision||'—'); })()}</dd><dt>Quy mô</dt><dd>${esc(p.desc||'—')}</dd></dl></div>
      ${keyLegalCard(p)}
      <div class="card"><h2>Gói thầu thuộc dự án</h2>${table([{h:'Mã',f:r=>`<span class="num" style="white-space:nowrap">${esc(r.code)}</span>`},{h:'Tên gói thầu',k:'name'},{h:'Giá gói thầu',r:1,f:r=>fmtTy(r.estimate)},{h:'Trạng thái',f:r=>statusPill(r.status)}], D('packages').filter(k=>k.projectId===p.id).sort(by('code')), {rowAct:'open-pkg', empty:'Chưa có gói thầu.'})}</div></div>`;
  } else if(t==='tasks'){
    const rows=D('tasks').filter(x=>x.projectId===p.id).sort(by('due'));
    body=`<div class="card"><div class="ch"><h2>Công việc thuộc dự án</h2>${can('du-an','edit')?`<button class="btn primary sm" data-act="add-task" data-id="${p.id}">+ Thêm công việc</button>`:''}</div>
    ${table([{h:'Công việc',k:'name'},{h:'Phụ trách',k:'assignee'},{h:'Ưu tiên',f:r=>pill(r.priority||'—', r.priority==='Cao'?'warn':'')},{h:'Hạn',f:r=>`<span class="num" style="${r.due<TODAY&&r.status!=='Hoàn thành'?'color:var(--red);font-weight:600':''}">${fmtDate(r.due)}</span>`},{h:'Trạng thái',f:r=>statusPill(r.status)},{h:'Tệp',f:r=>attCell(atts('tasks',r.id))}], rows, {actions:r=>editBtns('du-an','tasks',r.id, r.status!=='Hoàn thành'&&can('du-an','edit')?`<button class="btn sm ghost" data-act="task-done" data-id="${r.id}">Hoàn thành</button>`:''), empty:'Chưa có công việc.'})}</div>`;
  } else if(t==='legal'){
    body=legalCard(D('legal').filter(l=>l.projectId===p.id && !l.packageId), p.id, null, 'du-an', 'Hồ sơ pháp lý dự án');
  } else {
    const ks=D('packages').filter(k=>k.projectId===p.id).sort(by('code')); const cs=D('contracts').filter(c=>contractPid(c)===p.id);
    const sc=sCurve(D('schedule').filter(s=>s.projectId===p.id)); const cv=sum(cs,contractValue), paid=sum(cs,c=>contractPaid(c.id));
    const tEl=p.start&&p.end? Math.min(100,pct(Math.max(0,days(p.start,TODAY)),days(p.start,p.end))):0;
    body=`<div class="grid g4"><div class="card kpi"><div class="eyebrow">Tiến độ thực tế</div><div class="v">${fmtP(projProgress(p.id))}</div><div class="s">Kế hoạch đến nay ${fmtP(projExpected(p.id))}</div></div>
      <div class="card kpi"><div class="eyebrow">Thời gian đã qua</div><div class="v">${fmtP(tEl)}</div><div class="s">Còn ${Math.max(0,days(TODAY,p.end||TODAY))} ngày</div></div>
      <div class="card kpi"><div class="eyebrow">Giá trị hợp đồng</div><div class="v">${fmtTy(cv)}</div><div class="s">${fmtP(pct(cv,p.tmdt))} TMĐT</div></div>
      <div class="card kpi"><div class="eyebrow">Đã giải ngân</div><div class="v">${fmtTy(paid)}</div><div class="s">${fmtP(pct(paid,p.tmdt))} TMĐT</div></div></div>
      <div class="grid g2"><div class="card"><h2>Đường cong S của dự án</h2>${sc?lineChart({labels:sc.labels, series:[{name:'Kế hoạch',color:'var(--c5)',values:sc.plan,dash:true},{name:'Thực tế',color:'var(--c1)',values:sc.act,area:true}]}):emptyBox('Chưa lập kế hoạch tiến độ.')}</div>
      <div class="card"><h2>Tình trạng từng gói thầu</h2>${table([{h:'Gói',k:'code'},{h:'Tiến độ',f:r=>`<div style="min-width:120px">${progBar(pkgProgress(r.id), pkgExpected(r.id)-pkgProgress(r.id)>10?'warn':'')}</div>`},{h:'KH đến nay',r:1,f:r=>fmtP(pkgExpected(r.id))},{h:'Trạng thái',f:r=>statusPill(r.status)}], ks, {rowAct:'open-pkg'})}</div></div>
      <div class="list">${alerts().filter(a=>{ return D('schedule').some(s=>s.projectId===p.id && a.text.includes(esc(s.name))) || cs.some(c=>a.text.includes(esc(c.number))); }).map(a=>`<div class="alert ${a.lvl==='bad'?'bad':''}">${a.text}</div>`).join('')}</div>`;
  }
  return `<div class="head"><div class="grow"><button class="btn ghost sm" data-act="back-project">← Danh sách dự án</button><h1 style="margin-top:8px">${esc(p.name)}</h1><p><span class="num">${esc(p.code)}</span> · ${statusPill(p.status)}</p></div>${can('du-an','edit')?`<button class="btn" data-act="edit-projects" data-id="${p.id}">Sửa thông tin</button><button class="btn ghost danger" data-act="del" data-col="projects" data-id="${p.id}">Xóa</button>`:''}</div>
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="proj" data-id="${k}">${l}</button>`).join('')}</div>${body}`;
}
const taskFields=()=>[{key:'name',label:'Tên công việc',req:true,full:true},{key:'assignee',label:'Đơn vị / người phụ trách'},{key:'due',label:'Hạn hoàn thành',type:'date',req:true},{key:'priority',label:'Mức ưu tiên',type:'select',options:['Cao','Trung bình','Thấp'],def:'Trung bình'},{key:'status',label:'Trạng thái',type:'select',options:['Chưa bắt đầu','Đang thực hiện','Hoàn thành','Tạm dừng'],def:'Chưa bắt đầu',req:true},{key:'note',label:'Ghi chú',type:'textarea'},{key:'att',label:'Văn bản giao việc, tài liệu liên quan',type:'attach',col:'tasks',kind:'Văn bản giao việc'}];
ACT['add-task']=(pid)=>openForm({title:'Thêm công việc', fields:taskFields(), onSave:v=>save('tasks',{...v, projectId:pid})});
ACT['edit-tasks']=(id)=>openForm({title:'Cập nhật công việc', fields:taskFields(), value:get('tasks',id), onSave:v=>save('tasks',v)});
ACT['task-done']=(id)=>{ const t=get('tasks',id); openForm({title:'Hoàn thành: '+t.name, narrow:true, submit:'Xác nhận hoàn thành', value:{...t, doneDate:TODAY},
  fields:[{key:'doneDate',label:'Ngày hoàn thành',type:'date',req:true,full:true},{key:'note',label:'Kết quả, ghi chú',type:'textarea'},{key:'att',label:'Tệp kết quả (văn bản, báo cáo, biên bản…)',type:'attach',col:'tasks',kind:'Kết quả',full:true}],
  onSave:v=>save('tasks',{...v, status:'Hoàn thành'})}); };

/* Hồ sơ pháp lý dùng chung cho dự án (UC4) và gói thầu (UC11) */
function legalCard(rows, pid, kid, mod, title){
  return `<div class="card"><div class="ch"><h2>${esc(title)}</h2>${can(mod,'edit')?`<button class="btn primary sm" data-act="add-legal" data-id="${pid}" data-k="${kid||''}" data-m="${mod}">+ Thêm hồ sơ</button>`:''}</div>
  ${table([{h:'Loại hồ sơ',k:'type'},{h:'Số hiệu',f:r=>`<span class="num">${esc(r.number)}</span>`},{h:'Ngày',f:r=>`<span class="num">${fmtDate(r.date)}</span>`},{h:'Cơ quan ban hành',k:'issuer'},{h:'Trích yếu',k:'title'},{h:'Hiệu lực đến',f:r=>r.validUntil?`<span class="num" style="${r.validUntil<TODAY?'color:var(--red);font-weight:600':r.validUntil<=addDays(TODAY,30)?'color:var(--amber);font-weight:600':''}">${fmtDate(r.validUntil)}</span>`:'<span class="muted small">—</span>'},{h:'Tệp',f:r=>attCell(atts('legal',r.id))}], rows.sort(by('date')), {actions:r=>editBtns(mod,'legal',r.id), empty:'Chưa có hồ sơ pháp lý.'})}</div>`;
}
const legalFields=()=>[{key:'type',label:'Loại hồ sơ',type:'select',options:()=>catalog('Loại hồ sơ pháp lý'),req:true},{key:'number',label:'Số hiệu văn bản',req:true},{key:'date',label:'Ngày ban hành',type:'date',req:true},{key:'issuer',label:'Cơ quan ban hành'},{key:'title',label:'Trích yếu nội dung',full:true,req:true},
  {key:'validUntil',label:'Hiệu lực đến (bảo lãnh, giấy phép… để cảnh báo trước 30 ngày)',type:'date'},{key:'att',label:'Tệp đính kèm (PDF, ảnh scan, Word, Excel…)',type:'attach',col:'legal'}];
ACT['add-legal']=(pid,el)=>openForm({title:'Thêm hồ sơ pháp lý', fields:legalFields(), value:{type:el.dataset.t||''}, onSave:v=>save('legal',{...v, projectId:pid, packageId:el.dataset.k||''})});
ACT['edit-legal']=(id)=>openForm({title:'Cập nhật hồ sơ pháp lý', fields:legalFields(), value:get('legal',id), onSave:v=>save('legal',v)});
/* Văn bản pháp lý chính của dự án (chủ trương, phê duyệt, điều chỉnh) kèm tệp, hiển thị ở Thông tin chung */
const KEY_LEGAL=['Quyết định chủ trương đầu tư','Quyết định phê duyệt dự án','Quyết định điều chỉnh dự án'];
function keyLegalCard(p){
  const rows=D('legal').filter(l=>l.projectId===p.id && !l.packageId && KEY_LEGAL.includes(l.type)).sort(by('date'));
  const ed=can('du-an','edit');
  return `<div class="card"><div class="ch"><h2>Văn bản pháp lý chính</h2>${ed?`<button class="btn sm" data-act="add-legal" data-id="${p.id}" data-k="" data-t="Quyết định chủ trương đầu tư">+ QĐ chủ trương</button><button class="btn sm" data-act="add-legal" data-id="${p.id}" data-k="" data-t="Quyết định điều chỉnh dự án">+ QĐ điều chỉnh</button>`:''}</div>
  ${table([{h:'Loại',k:'type'},{h:'Số hiệu',f:r=>`<span class="num">${esc(r.number)}</span>`},{h:'Ngày',f:r=>`<span class="num">${fmtDate(r.date)}</span>`},{h:'Tệp',f:r=>attCell(atts('legal',r.id))}], rows, {actions:r=>editBtns('du-an','legal',r.id), empty:'Chưa có quyết định chủ trương, phê duyệt hoặc điều chỉnh dự án.'})}</div>`;
}
