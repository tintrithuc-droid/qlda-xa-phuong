// Chụp màn hình minh họa cho bộ HDSD, có khung đỏ đánh số thứ tự thao tác.
// node shots.js  (máy chủ chạy ở 127.0.0.1:5080 với CSDL trống)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const BASE = 'http://127.0.0.1:5080', PW = 'Admin2026';
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const DESK = { viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1.5, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' };
const MOB = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' };
let b;

async function newPage(opts) { const c = await b.newContext(opts); const p = await c.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message)); return p; }
async function login(p, u) {
  await p.goto(BASE + '/'); await p.waitForSelector('#login,#app', { timeout: 20000 });
  if (await p.$('#login')) { await p.fill('#lg_user', u); await p.fill('#lg_pw', PW); await p.click('#login button[type=submit]'); await p.waitForSelector('#app', { timeout: 20000 }); }
  await wait(400);
}
async function go(p, r) { await closeModal(p); await p.evaluate(r => { location.hash = r; scrollTo(0, 0); }, r); await wait(500); }
async function closeModal(p) { for (let i = 0; i < 3 && await p.$('#ov:not([hidden])'); i++) { const c = await p.$('#ov [data-close]'); if (c) await c.click(); else await p.keyboard.press('Escape'); await wait(200); } }
async function tab(p, label) { await p.click(`.content [data-act=tab]:text-is("${label}")`); await wait(350); }
async function click(p, sel, text) { const els = await p.$$(sel); for (const e of els) { if (!text || (await e.innerText()).includes(text)) { await e.click(); await wait(400); return; } } throw new Error('Không thấy ' + sel + ' ' + (text || '')); }

// a: [{sel, text?, nth?, n}] → khung đỏ + số
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
async function clearAnn(p) { await p.evaluate(() => document.querySelectorAll('.hd-ann').forEach(x => x.remove())); }
// clip: undefined = khung nhìn; 'full' = cả trang; selector = vùng phần tử (+ lề 18px)
async function shot(p, name, clip, a) {
  if (a) await ann(p, a);
  const file = path.join(OUT, name + '.png');
  if (clip === 'full') await p.screenshot({ path: file, fullPage: true });
  else if (clip) {
    const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const x = e.getBoundingClientRect(); return { x: x.left + scrollX, y: x.top + scrollY, w: x.width, h: x.height }; }, clip);
    if (!r) throw new Error('Không thấy vùng ' + clip);
    const m = 18; await p.screenshot({ path: file, fullPage: true, clip: { x: Math.max(0, r.x - m), y: Math.max(0, r.y - m), width: r.w + 2 * m, height: r.h + 2 * m } });
  } else await p.screenshot({ path: file });
  await clearAnn(p); console.log('✓', name);
}
async function scrollTo(p, sel, text) { await p.evaluate(([s, t]) => { const e = [...document.querySelectorAll(s)].find(e => !t || e.innerText.includes(t)); if (e) e.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); }, [sel, text]); await wait(300); }
module.exports={get b(){return b}, set b(v){b=v}, newPage, login, go, closeModal, tab, click, ann, shot, scrollTo, wait, MOB, DESK, BASE, PW, OUT};
