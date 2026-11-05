/* Trang quản lý thuê bao: tạo xã, gia hạn, tạm khóa/mở, cấp mã khởi tạo, thống kê sử dụng */
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '';
const fmtTime = d => d ? new Date(d).toLocaleString('vi-VN') : '';
const isoDate = d => d ? String(d).slice(0, 10) : '';
const size = b => b == null ? '' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : b < 1073741824 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1073741824).toFixed(2) + ' GB';
const S = { me: null, base: '', version: '', tenants: [], logs: [], tab: 'xa', q: '' };

async function api(method, url, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-QLDA': '1' }, body: body === undefined ? undefined : JSON.stringify(body), credentials: 'same-origin' });
  let data = null; try { data = await r.json(); } catch { }
  if (r.status === 401 && S.me && !url.endsWith('/login')) { S.me = null; render(); }
  if (!r.ok) throw new Error((data && data.message) || ('Lỗi máy chủ (' + r.status + ').'));
  return data;
}
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 3500); }
function closeDlg() { $('#dlg').hidden = true; $('#dlg').innerHTML = ''; }
function dlg(title, body, foot) {
  const o = $('#dlg'); o.hidden = false;
  o.innerHTML = `<div class="dlg" role="dialog" aria-modal="true"><header><h3>${title}</h3><button class="btn sm" data-x>Đóng</button></header><div class="body">${body}</div>${foot ? `<footer>${foot}</footer>` : ''}</div>`;
  o.querySelector('[data-x]').onclick = closeDlg;
  o.onclick = e => { if (e.target === o) closeDlg(); };
  return o;
}

async function init() {
  try { const m = await api('GET', '/api/portal/me'); S.me = m.user; S.base = m.baseDomain; S.version = m.version; }
  catch (e) { $('#root').innerHTML = `<div class="empty">Không kết nối được máy chủ: ${esc(e.message)}</div>`; return; }
  if (S.me) await load();
  render();
}
async function load() {
  S.tenants = await api('GET', '/api/portal/tenants');
  if (S.tab === 'log') S.logs = await api('GET', '/api/portal/logs');
}
function render() { S.me ? renderMain() : renderLogin(); }

/* ---------- Đăng nhập ---------- */
function renderLogin(step) {
  step = step || {};
  $('#root').innerHTML = `<div class="login"><form id="lg" autocomplete="off">
    <h2>Quản lý thuê bao</h2><p class="muted small" style="margin:0 0 8px">Phần mềm Quản lý dự án xã/phường – dành cho quản trị nền tảng.</p>
    <div class="fld"><label for="u">Tên đăng nhập</label><input id="u" autocomplete="username" required value="${esc(step.u || '')}" ${step.mfa ? 'readonly' : ''}></div>
    <div class="fld"><label for="p">Mật khẩu</label><input id="p" type="password" autocomplete="current-password" required value="${esc(step.p || '')}" ${step.mfa ? 'readonly' : ''}></div>
    ${step.mfa === 'enroll' ? `<p class="small">Lần đầu đăng nhập: mở ứng dụng xác thực (Google Authenticator, Microsoft Authenticator…) và quét mã dưới đây, hoặc nhập khóa <span class="code">${esc(step.secret)}</span>.</p><div class="qr">${step.qrSvg}</div>` : ''}
    ${step.mfa ? `<div class="fld"><label for="c">Mã xác thực 6 số</label><input id="c" inputmode="numeric" autocomplete="one-time-code" maxlength="7" required></div>` : ''}
    <div class="err" id="e"></div>
    <button class="btn primary" style="width:100%;justify-content:center;padding:10px">${step.mfa ? 'Xác nhận' : 'Đăng nhập'}</button>
  </form></div>`;
  (step.mfa ? $('#c') : $('#u')).focus();
  $('#lg').onsubmit = async e => {
    e.preventDefault(); const btn = e.submitter; btn.disabled = true; $('#e').textContent = '';
    const body = { username: $('#u').value.trim(), password: $('#p').value };
    if (step.mfa) { body.code = $('#c').value.trim(); body.ticket = step.ticket || null; }
    try {
      const r = await api('POST', '/api/portal/login', body);
      if (r.mfa) return renderLogin({ u: body.username, p: body.password, ...r });
      S.me = r.user; await load(); render();
    } catch (ex) { $('#e').textContent = ex.message; btn.disabled = false; }
  };
}

/* ---------- Màn hình chính ---------- */
function statusBadge(t) {
  if (t.status === 'tam-khoa') return '<span class="badge red">Tạm khóa</span>';
  if (t.status === 'dang-tao') return '<span class="badge gray">Đang tạo</span>';
  if (t.ready === 'Failed') return '<span class="badge red">Lỗi nâng cấp</span>';
  if (t.ready === 'Upgrading' || t.ready === 'Pending') return '<span class="badge violet">Đang nâng cấp</span>';
  if (t.expired) return '<span class="badge amber">Hết hạn</span>';
  return '<span class="badge green">Đang hoạt động</span>';
}
function expiry(t) {
  if (!t.expiresAt) return '<span class="muted">Không giới hạn</span>';
  const d = t.daysLeft, cls = d < 0 ? 'red' : d <= 30 ? 'amber' : 'gray';
  return `${fmtDate(t.expiresAt)} <span class="badge ${cls}">${d < 0 ? 'quá ' + (-d) + ' ngày' : 'còn ' + d + ' ngày'}</span>`;
}
function renderMain() {
  const T = S.tenants, q = S.q.toLowerCase();
  const count = f => T.filter(f).length;
  const list = T.filter(t => !q || (t.code + ' ' + t.name + ' ' + (t.hosts || '') + ' ' + (t.contact || '')).toLowerCase().includes(q));
  $('#root').innerHTML = `
  <div class="top"><div class="mark">TT</div><div><h1>Quản lý thuê bao – QLDA xã/phường</h1><div class="sub">Tên miền dịch vụ: ${esc(S.base)} · phiên bản ${esc(S.version)}</div></div>
    <div class="sp"></div><span class="who hide-sm">${esc(S.me.name || S.me.username)}</span>
    <button class="btn sm" id="pw">Đổi mật khẩu</button><button class="btn sm" id="out">Đăng xuất</button></div>
  <div class="wrap">
    <div class="tabs"><button class="tab ${S.tab === 'xa' ? 'on' : ''}" data-tab="xa">Danh sách xã/phường</button><button class="tab ${S.tab === 'log' ? 'on' : ''}" data-tab="log">Nhật ký nền tảng</button></div>
    ${S.tab === 'xa' ? `
    <div class="cards">
      <div class="card"><div class="n">${T.length}</div><div class="l">Tổng số đơn vị thuê</div></div>
      <div class="card" style="--c:var(--green)"><div class="n">${count(t => t.status === 'hoat-dong' && !t.expired)}</div><div class="l">Đang hoạt động</div></div>
      <div class="card" style="--c:var(--amber)"><div class="n">${count(t => t.status === 'hoat-dong' && t.daysLeft != null && t.daysLeft >= 0 && t.daysLeft <= 30)}</div><div class="l">Sắp hết hạn (30 ngày)</div></div>
      <div class="card" style="--c:var(--red)"><div class="n">${count(t => t.expired || t.status === 'tam-khoa')}</div><div class="l">Hết hạn / tạm khóa</div></div>
      <div class="card" style="--c:var(--violet)"><div class="n">${count(t => t.setupPending)}</div><div class="l">Chờ xã khởi tạo tài khoản</div></div>
    </div>
    <div class="panel">
      <div class="bar"><input type="search" id="q" placeholder="Tìm theo mã, tên xã, tên miền, người liên hệ…" value="${esc(S.q)}"><span class="sp" style="flex:1"></span>
        <button class="btn" id="reload">Làm mới</button><button class="btn primary" id="add">+ Thêm xã/phường</button></div>
      ${list.length ? `<div style="overflow:auto"><table><thead><tr><th>Mã</th><th>Tên đơn vị</th><th class="hide-sm">Địa chỉ truy cập</th><th>Trạng thái</th><th>Hạn sử dụng</th><th class="hide-sm">Phiên bản</th><th></th></tr></thead><tbody>
        ${list.map(t => `<tr><td class="code">${esc(t.code)}</td><td><b>${esc(t.name)}</b>${t.setupPending ? '<div class="small" style="color:var(--violet)">Chờ khởi tạo tài khoản quản trị</div>' : ''}${t.contact ? `<div class="small muted">${esc(t.contact)}</div>` : ''}</td>
          <td class="hide-sm small"><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.url.replace('https://', ''))}</a>${t.hosts ? `<div class="muted">${esc(t.hosts)}</div>` : ''}</td>
          <td>${statusBadge(t)}</td><td class="small">${expiry(t)}</td><td class="hide-sm small muted">${esc(t.appVersion || '')}</td>
          <td><button class="btn sm" data-open="${esc(t.code)}">Chi tiết</button></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="empty">${T.length ? 'Không có đơn vị phù hợp.' : 'Chưa có xã/phường nào. Bấm “Thêm xã/phường” để cấp đơn vị đầu tiên.'}</div>`}
    </div>` : `
    <div class="panel"><div style="overflow:auto"><table><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Thao tác</th><th>Đối tượng</th><th class="hide-sm">IP</th></tr></thead><tbody>
      ${S.logs.map(l => `<tr><td class="small">${fmtTime(l.ts + 'Z')}</td><td>${esc(l.username || '')}</td><td>${esc(l.action)}</td><td class="small">${esc(l.target || '')}</td><td class="hide-sm small muted">${esc(l.ip || '')}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Chưa có nhật ký.</td></tr>'}
    </tbody></table></div></div>`}
  </div>`;
  $('#out').onclick = async () => { await api('POST', '/api/portal/logout').catch(() => { }); S.me = null; render(); };
  $('#pw').onclick = changePassword;
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = async () => { S.tab = b.dataset.tab; await load().catch(e => toast(e.message)); renderMain(); });
  if (S.tab !== 'xa') return;
  $('#q').oninput = e => { S.q = e.target.value; const pos = e.target.selectionStart; renderMain(); const i = $('#q'); i.focus(); i.setSelectionRange(pos, pos); };
  $('#reload').onclick = async () => { await load().catch(e => toast(e.message)); renderMain(); toast('Đã cập nhật danh sách.'); };
  $('#add').onclick = () => editTenant(null);
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openTenant(b.dataset.open));
}

/* ---------- Thêm / sửa ---------- */
function slug(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/^(xa|phuong|thi tran|dac khu)\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}
function editTenant(t) {
  const isNew = !t; t = t || {};
  const o = dlg(isNew ? 'Thêm xã/phường thuê dịch vụ' : 'Sửa thông tin ' + esc(t.name), `<form id="tf" autocomplete="off">
    <div class="grid2">
      <div class="fld"><label>Tên đơn vị</label><input id="f_name" required placeholder="ví dụ: xã Tân Hòa" value="${esc(t.name || '')}"></div>
      <div class="fld"><label>Mã xã (tên miền con)</label><input id="f_code" required ${isNew ? '' : 'readonly'} class="code" placeholder="tan-hoa" value="${esc(t.code || '')}">
        <div class="small muted" id="f_url">${isNew ? '' : esc(t.url)}</div></div>
      <div class="fld"><label>Hạn sử dụng (để trống = không giới hạn)</label><input id="f_exp" type="date" value="${isoDate(t.expiresAt)}"></div>
      <div class="fld"><label>Người liên hệ của xã</label><input id="f_contact" placeholder="Họ tên, chức vụ, điện thoại" value="${esc(t.contact || '')}"></div>
    </div>
    <div class="fld"><label>Tên miền riêng của xã (nếu có, cách nhau bởi dấu phẩy)</label><input id="f_hosts" placeholder="qlda.tanhoa.cantho.gov.vn" value="${esc(t.hosts || '')}">
      <div class="small muted">Xã trỏ tên miền này (bản ghi A) về địa chỉ IP của máy chủ; chứng chỉ HTTPS được cấp tự động.</div></div>
    <div class="fld"><label>Ghi chú (hợp đồng, gói dịch vụ…)</label><textarea id="f_note" rows="3">${esc(t.note || '')}</textarea></div>
    <div class="err" id="f_err"></div></form>`,
    `<button class="btn" data-x2>Hủy</button><button class="btn primary" id="f_ok">${isNew ? 'Tạo xã và cơ sở dữ liệu' : 'Lưu'}</button>`);
  o.querySelector('[data-x2]').onclick = closeDlg;
  const showUrl = () => { const c = $('#f_code').value.trim(); $('#f_url').textContent = c ? 'Địa chỉ: https://' + c + '.' + S.base : ''; };
  if (isNew) {
    let touched = false;
    $('#f_code').oninput = () => { touched = true; showUrl(); };
    $('#f_name').oninput = () => { if (!touched) { $('#f_code').value = slug($('#f_name').value); showUrl(); } };
  }
  $('#f_ok').onclick = async () => {
    const body = { code: $('#f_code').value.trim().toLowerCase(), name: $('#f_name').value.trim(), expiresAt: $('#f_exp').value || null,
      contact: $('#f_contact').value.trim(), hosts: $('#f_hosts').value.trim(), note: $('#f_note').value };
    if (!body.name) return $('#f_err').textContent = 'Vui lòng nhập tên đơn vị.';
    const btn = $('#f_ok'); btn.disabled = true; $('#f_err').style.color = 'var(--muted)';
    $('#f_err').textContent = isNew ? 'Đang tạo cơ sở dữ liệu và khởi tạo cấu trúc, mất khoảng 10–30 giây…' : '';
    try {
      if (isNew) { const r = await api('POST', '/api/portal/tenants', body); await load(); renderMain(); showToken(r.tenant, r.setupToken, r.setupUrl); }
      else { await api('PUT', '/api/portal/tenants/' + t.code, body); await load(); renderMain(); closeDlg(); toast('Đã lưu.'); }
    } catch (e) { $('#f_err').style.color = 'var(--red)'; $('#f_err').textContent = e.message; btn.disabled = false; }
  };
}

function showToken(t, token, url) {
  const msg = `Kính gửi ${t.name},\n\nĐơn vị đã được cấp phần mềm Quản lý dự án tại địa chỉ:\n${t.url}\n\nLần đầu sử dụng, cán bộ quản trị của đơn vị mở đường dẫn sau để tạo tài khoản quản trị:\n${url}\n(Mã khởi tạo: ${token}, dùng một lần, hiệu lực 30 ngày.)\n\nTài khoản quản trị bắt buộc bật xác thực 2 lớp bằng ứng dụng Google Authenticator hoặc Microsoft Authenticator trên điện thoại.`;
  const o = dlg('Đã cấp đơn vị: ' + esc(t.name), `
    <p>Mã khởi tạo chỉ hiện <b>một lần</b>. Gửi cho cán bộ quản trị của xã qua kênh tin cậy.</p>
    <div class="section">Mã khởi tạo</div><div class="token">${esc(token)}</div>
    <div class="section">Nội dung gửi xã</div><div class="box" id="msg">${esc(msg)}</div>`,
    `<button class="btn" id="cp">Chép nội dung</button><button class="btn primary" data-x2>Xong</button>`);
  o.querySelector('[data-x2]').onclick = closeDlg;
  $('#cp').onclick = () => navigator.clipboard.writeText(msg).then(() => toast('Đã chép nội dung.'), () => toast('Không chép được, hãy bôi đen và chép thủ công.'));
}

/* ---------- Chi tiết, thao tác ---------- */
async function openTenant(code) {
  const t = S.tenants.find(x => x.code === code); if (!t) return;
  const o = dlg(esc(t.name) + ' ' + statusBadge(t), `
    <div class="grid2 small">
      <div><span class="muted">Mã xã:</span> <span class="code">${esc(t.code)}</span></div>
      <div><span class="muted">Địa chỉ:</span> <a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.url)}</a></div>
      <div><span class="muted">Hạn sử dụng:</span> ${expiry(t)}</div>
      <div><span class="muted">Tên miền riêng:</span> ${esc(t.hosts || '—')}</div>
      <div><span class="muted">Liên hệ:</span> ${esc(t.contact || '—')}</div>
      <div><span class="muted">Ngày cấp:</span> ${fmtDate(t.createdAt + 'Z')}</div>
      <div><span class="muted">Phiên bản dữ liệu:</span> ${esc(t.appVersion || '—')}</div>
      <div><span class="muted">Cập nhật:</span> ${fmtTime(t.updatedAt ? t.updatedAt + 'Z' : null)} ${esc(t.updatedBy || '')}</div>
    </div>
    ${t.status === 'tam-khoa' && t.lockReason ? `<p class="small"><b>Lý do tạm khóa:</b> ${esc(t.lockReason)}</p>` : ''}
    ${t.lastError || t.readyError ? `<p class="small" style="color:var(--red)"><b>Lỗi nâng cấp:</b> ${esc(t.readyError || t.lastError)}</p>` : ''}
    ${t.note ? `<div class="section">Ghi chú</div><div class="small" style="white-space:pre-wrap">${esc(t.note)}</div>` : ''}
    <div class="section">Tình hình sử dụng</div><div id="st" class="small muted">Đang tải…</div>
    <div class="section">Thao tác</div>
    <div class="actions">
      <button class="btn" id="a_edit">Sửa thông tin, gia hạn</button>
      ${t.status === 'tam-khoa' ? '<button class="btn" id="a_unlock">Mở lại</button>' : '<button class="btn danger" id="a_lock">Tạm khóa</button>'}
      ${t.setupPending ? '<button class="btn" id="a_token">Cấp lại mã khởi tạo</button>' : ''}
      <button class="btn" id="a_2fa">Đặt lại xác thực 2 lớp cho một tài khoản</button>
      ${t.ready !== 'Ready' ? '<button class="btn" id="a_up">Chạy lại nâng cấp</button>' : ''}
    </div>`);
  const act = async (fn, okMsg) => { try { await fn(); await load(); renderMain(); closeDlg(); if (okMsg) toast(okMsg); } catch (e) { toast(e.message); } };
  $('#a_edit').onclick = () => editTenant(t);
  if ($('#a_lock')) $('#a_lock').onclick = () => {
    const reason = prompt('Lý do tạm khóa (hiển thị cho người dùng của xã), ví dụ: Đơn vị chưa gia hạn hợp đồng.', 'Dịch vụ đang tạm dừng.');
    if (reason === null) return;
    act(() => api('POST', `/api/portal/tenants/${code}/lock`, { reason }), 'Đã tạm khóa ' + t.name + '.');
  };
  if ($('#a_unlock')) $('#a_unlock').onclick = () => act(() => api('POST', `/api/portal/tenants/${code}/unlock`), 'Đã mở lại ' + t.name + '.');
  if ($('#a_token')) $('#a_token').onclick = async () => {
    if (!confirm('Cấp mã khởi tạo mới? Mã cũ sẽ hết hiệu lực.')) return;
    try { const r = await api('POST', `/api/portal/tenants/${code}/setup-token`); showToken(t, r.setupToken, r.setupUrl); } catch (e) { toast(e.message); }
  };
  $('#a_2fa').onclick = () => {
    const u = prompt('Tên đăng nhập cần đặt lại xác thực 2 lớp (theo yêu cầu bằng văn bản của xã). Thao tác được ghi vào nhật ký của xã.');
    if (!u) return;
    act(() => api('POST', `/api/portal/tenants/${code}/reset-2fa`, { username: u }), 'Đã đặt lại. Lần đăng nhập sau tài khoản sẽ quét mã QR mới.');
  };
  if ($('#a_up')) $('#a_up').onclick = () => act(() => api('POST', `/api/portal/tenants/${code}/upgrade`), 'Đã nâng cấp xong.');
  try {
    const s = await api('GET', `/api/portal/tenants/${code}/stats`);
    const st = o.querySelector('#st'); if (!st) return;
    st.classList.remove('muted');
    st.innerHTML = `<div class="stats">
      <div class="stat"><b>${s.users}</b><span>tài khoản (${s.activeUsers30} dùng trong 30 ngày)</span></div>
      <div class="stat"><b>${s.projects}</b><span>dự án</span></div>
      <div class="stat"><b>${s.files}</b><span>tệp đính kèm</span></div>
      <div class="stat"><b>${size(s.dbSize)}</b><span>cơ sở dữ liệu</span></div>
      <div class="stat"><b>${size(s.filesSize)}</b><span>kho tệp</span></div>
      <div class="stat"><b>${size(s.backupSize)}</b><span>bản sao lưu trong phần mềm</span></div></div>
      <div class="muted">Đăng nhập gần nhất: ${s.lastLogin ? fmtTime(s.lastLogin + 'Z') : 'chưa có'} · Sao lưu gần nhất: ${s.lastBackup ? fmtTime(s.lastBackup + 'Z') : 'chưa có'}</div>`;
  } catch (e) { const st = o.querySelector('#st'); if (st) st.textContent = e.message; }
}

function changePassword() {
  const o = dlg('Đổi mật khẩu quản trị nền tảng', `<div class="fld"><label>Mật khẩu hiện tại</label><input id="p0" type="password" autocomplete="current-password"></div>
    <div class="fld"><label>Mật khẩu mới (tối thiểu 10 ký tự, có chữ và số)</label><input id="p1" type="password" autocomplete="new-password"></div>
    <div class="fld"><label>Nhập lại mật khẩu mới</label><input id="p2" type="password" autocomplete="new-password"></div><div class="err" id="pe"></div>`,
    `<button class="btn" data-x2>Hủy</button><button class="btn primary" id="pok">Đổi mật khẩu</button>`);
  o.querySelector('[data-x2]').onclick = closeDlg;
  $('#pok').onclick = async () => {
    if ($('#p1').value !== $('#p2').value) return $('#pe').textContent = 'Hai lần nhập mật khẩu không khớp.';
    try { await api('POST', '/api/portal/password', { old: $('#p0').value, password: $('#p1').value }); closeDlg(); S.me = null; render(); toast('Đã đổi mật khẩu, vui lòng đăng nhập lại.'); }
    catch (e) { $('#pe').textContent = e.message; }
  };
}

init();
