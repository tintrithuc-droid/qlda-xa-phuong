// Hàm dùng chung khi chụp ảnh HDSD: khung đỏ đánh số, chụp vùng phần tử, mã TOTP.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const steps = {};
async function totp(secret) {
  while (Math.floor(Date.now() / 30000) <= (steps[secret] || 0)) await wait(1000);
  const step = steps[secret] = Math.floor(Date.now() / 30000);
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of secret) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(step));
  const h = crypto.createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
async function ann(p, a) {
  await p.evaluate(list => {
    document.querySelectorAll('.hd-ann').forEach(x => x.remove());
    for (const it of list) {
      let els = [...document.querySelectorAll(it.sel)].filter(e => e.offsetParent !== null || e.getClientRects().length);
      if (it.text) els = els.filter(e => e.innerText.includes(it.text));
      const e = els[it.nth || 0]; if (!e) { console.error('ANN MISS ' + it.sel + ' ' + (it.text || '')); continue; }
      const r = e.getBoundingClientRect(), pad = it.pad ?? 4;
      const box = document.createElement('div'); box.className = 'hd-ann';
      Object.assign(box.style, { position: 'absolute', left: (r.left + scrollX - pad) + 'px', top: (r.top + scrollY - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px', border: '2.5px solid #d92d20', borderRadius: '7px', zIndex: 9999, pointerEvents: 'none', boxShadow: '0 0 0 2px rgba(255,255,255,.7)' });
      const n = document.createElement('div'); n.className = 'hd-ann'; n.textContent = it.n;
      const pos = it.pos || 'tl'; const nx = pos.includes('r') ? r.right + scrollX + pad - 12 : r.left + scrollX - pad - 12; const ny = r.top + scrollY - pad - 12;
      Object.assign(n.style, { position: 'absolute', left: nx + 'px', top: ny + 'px', width: '26px', height: '26px', borderRadius: '50%', background: '#d92d20', color: '#fff', font: '700 14px/26px "Be Vietnam Pro",Arial', textAlign: 'center', zIndex: 10000, pointerEvents: 'none', boxShadow: '0 0 0 2px #fff' });
      document.body.append(box, n);
    }
  }, a);
}
// Đổi địa chỉ máy thử sang tên miền minh họa trước khi chụp (HD_REPLACE='[["cũ","mới"],...]')
const REPL = process.env.HD_REPLACE ? JSON.parse(process.env.HD_REPLACE) : [];
async function shot(p, name, clip, a) {
  const vp = p.viewportSize(), tall = typeof clip === 'string' && clip.startsWith('#ov') && vp.width > 1000;
  if (tall) { await p.setViewportSize({ width: vp.width, height: 1900 }); await wait(300); }
  if (a) await ann(p, a);
  if (REPL.length) await p.evaluate(pairs => {
    const rep = t => pairs.reduce((x, [a, b]) => x.split(a).join(b), t);
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const v = rep(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    document.querySelectorAll('input,textarea').forEach(e => { const v = rep(e.value); if (v !== e.value) e.value = v; });
  }, REPL);
  const file = path.join(OUT, name + '.png');
  if (clip === 'full') await p.screenshot({ path: file, fullPage: true });
  else if (clip) {
    const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const x = e.getBoundingClientRect(); return { x: x.left + scrollX, y: x.top + scrollY, w: x.width, h: x.height }; }, clip);
    if (!r) throw new Error('Không thấy vùng ' + clip);
    const m = 18; await p.screenshot({ path: file, fullPage: true, clip: { x: Math.max(0, r.x - m), y: Math.max(0, r.y - m), width: r.w + 2 * m, height: r.h + 2 * m } });
  } else await p.screenshot({ path: file });
  await p.evaluate(() => document.querySelectorAll('.hd-ann').forEach(x => x.remove())); if (tall) await p.setViewportSize(vp); console.log('✓', name);
}
module.exports = { OUT, wait, totp, ann, shot };
