// Dựng bộ HDSD .docx theo vai trò. Chạy 2 lượt: lượt 1 lấy số trang từ PDF, lượt 2 ghi mục lục tĩnh có số trang.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const D = require('docx');
const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle,
  ShadingType, HeadingLevel, LevelFormat, Header, Footer, PageNumber, PositionalTab, PositionalTabAlignment, PositionalTabLeader,
  PositionalTabRelativeTo, Bookmark, InternalHyperlink, VerticalAlign, TableLayoutType, PageBreak } = D;
const { ROLES, build } = require('./content');

const DIR = __dirname, SHOTS = path.join(DIR, 'shots'), OUT = path.join(DIR, 'out');
fs.mkdirSync(OUT, { recursive: true });
const FONT = 'Times New Roman', NAVY = '0D2A57', RED = 'C8102E', GREY = 'BFC5CE', TXT = 9071; // vùng chữ 16 cm ≈ 9070 DXA
const DATE = '08.11.2026', DATE_VN = '08/11/2026', MONTH = 'tháng 11 năm 2026';
const TT = 'Công ty CP Tin học Tri Thức';
// Lịch sử thay đổi theo vai trò: [ngày, nội dung]; phiên bản tài liệu = dòng cuối, số V trong tên tệp = số dòng
const hist = role => role.hist.map((h, i) => [h[2] || '1.' + i, h[0], h[1]]);
const verNo = role => hist(role).slice(-1)[0][0];
const vFile = role => 'V' + (role.v || role.hist.length);

const pngSize = f => { const b = fs.readFileSync(f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), buf: b }; };
const cm2px = cm => Math.round(cm * 37.795);

// **đậm** và (1) → số chú giải màu đỏ
function runs(text, base = {}) {
  const out = [];
  text.split(/(\*\*[^*]+\*\*)/).forEach(part => {
    if (!part) return;
    const bold = part.startsWith('**');
    const t = bold ? part.slice(2, -2) : part;
    t.split(/(\(\d{1,2}\))/).forEach(s => {
      if (!s) return;
      if (/^\(\d{1,2}\)$/.test(s)) out.push(new TextRun({ ...base, text: s, bold: true, color: RED }));
      else out.push(new TextRun({ ...base, text: s, bold: bold || base.bold }));
    });
  });
  return out;
}

const thin = { style: BorderStyle.SINGLE, size: 4, color: GREY };
const borders = { top: thin, bottom: thin, left: thin, right: thin };
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };

function cell(children, width, opt = {}) {
  return new TableCell({ children, width: { size: width, type: WidthType.DXA }, borders: opt.borders || borders,
    shading: opt.fill ? { fill: opt.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: opt.margins || { top: 30, bottom: 30, left: 100, right: 100 }, verticalAlign: opt.va || VerticalAlign.CENTER,
    columnSpan: opt.span });
}
const cp = (text, opt = {}) => new Paragraph({ alignment: opt.align, spacing: { before: 0, after: 0, line: 250 }, keepNext: opt.keep,
  children: runs(text, { size: opt.size || 24, bold: opt.bold, color: opt.color, italics: opt.italics }) });

// cột cuối bù cho tổng bề rộng đúng bằng vùng chữ
const fitW = W => { const t = W.reduce((a, b) => a + b, 0); return t === TXT ? W : [...W.slice(0, -1), W[W.length - 1] + TXT - t]; };
function table(widths, rows, opt = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, alignment: opt.align || AlignmentType.CENTER,
    layout: TableLayoutType.FIXED, borders: opt.borders, rows });
}

function imageBox(name, wcm, maxHcm = 20) {
  const f = path.join(SHOTS, name + '.png');
  if (!fs.existsSync(f)) throw new Error('Thiếu ảnh ' + name);
  const s = pngSize(f);
  let w = cm2px(wcm), h = Math.round(w * s.h / s.w);
  if (h > cm2px(maxHcm)) { h = cm2px(maxHcm); w = Math.round(h * s.w / s.h); }
  return { h: h * 0.75, par: new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, keepLines: true, spacing: { before: 120, after: 0 },
    children: [new ImageRun({ type: 'png', data: s.buf, transformation: { width: w, height: h }, altText: { title: name, description: name, name: 'shot-' + name } })] }) };
}

function makeDoc(k, pages, FIT = {}, FIGS = []) {
  const role = ROLES[k], blocks = build(k);
  const numbering = [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }];
  let stepsN = 0, c1 = 0, c2 = 0, c3 = 0, fig = 0, tab = 0;
  const toc = [], body = [];
  const P = (children, opt = {}) => new Paragraph({ children, ...opt });
  const para = text => P(runs(text), { alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 567 }, spacing: { before: 40, after: 40, line: 300 } });
  const caption = (lbl, text, before = 80, keep = false) => P([new TextRun({ text: lbl + ' ', bold: true, italics: true, size: 24 }), new TextRun({ text, italics: true, size: 24 })],
    { alignment: AlignmentType.CENTER, spacing: { before, after: keep ? 100 : 160 }, keepLines: true, keepNext: keep });
  // chiều cao ước tính (pt) của bảng chú giải đi kèm hình, để hình + chú thích + chú giải luôn nằm cùng trang
  const legH = lg => !lg ? 0 : 18 + lg.legend.reduce((a, [, t]) => a + Math.ceil(t.replace(/\*\*/g, '').length / 86) * 13.2 + 6, 0) + 8;

  blocks.forEach((b, bi) => {
    const nextLeg = blocks[bi + 1] && blocks[bi + 1].legend ? blocks[bi + 1] : null;
    if (b.h1) {
      c1++; c2 = 0; c3 = 0; fig = 0; tab = 0;
      const id = `c${c1}`, text = `${c1}. ${b.h1}`;
      toc.push({ lvl: 1, text, id });
      body.push(P([new Bookmark({ id, children: [new TextRun(text)] })], { heading: HeadingLevel.HEADING_1, pageBreakBefore: true, keepNext: true }));
    } else if (b.h2) {
      c2++; c3 = 0;
      const id = `c${c1}_${c2}`, text = `${c1}.${c2}. ${b.h2}`;
      toc.push({ lvl: 2, text, id });
      body.push(P([new Bookmark({ id, children: [new TextRun(text)] })], { heading: HeadingLevel.HEADING_2, keepNext: true }));
    } else if (b.h3) {
      c3++;
      body.push(P([new TextRun(`${c1}.${c2}.${c3}. ${b.h3}`)], { heading: HeadingLevel.HEADING_3, keepNext: true }));
    } else if (b.p) body.push(para(b.p));
    else if (b.steps) {
      const ref = 'st' + (++stepsN);
      numbering.push({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: 'Bước %1.', alignment: AlignmentType.LEFT,
        style: { run: { bold: true, color: NAVY }, paragraph: { indent: { left: 1134, hanging: 1134 } } } }] });
      b.steps.forEach(s => body.push(P(runs(s), { numbering: { reference: ref, level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { before: 30, after: 30, line: 288 } })));
    } else if (b.bullets) b.bullets.forEach(s => body.push(P(runs(s), { numbering: { reference: 'bul', level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { before: 20, after: 20, line: 288 } })));
    else if (b.img) {
      fig++;
      const id = `${c1}.${fig}`, sc = FIT[id] || 1, im = imageBox(b.img, (b.w || 16) * sc, 17 * sc);
      FIGS.push({ id, h: im.h, leg: legH(nextLeg), w: (b.w || 16) * sc, min: im.h > (b.w || 16) * sc * 28.35 * 0.9 ? 9 : (b.w || 16) >= 14 ? 11 : 7.5 });
      body.push(im.par);
      body.push(caption(`Hình ${id}.`, b.cap, 80, !!nextLeg));
    } else if (b.imgs2) {
      const n = b.imgs2.length, id = `${c1}.${fig + 1}`, sc = FIT[id] || 1, wcm = (b.mobile ? (n > 2 ? 4.8 : 5.6) : 7.6) * sc, colW = Math.floor(TXT / n);
      let hmax = 0;
      const cells = b.imgs2.map((n, i) => { fig++; const im = imageBox(n, wcm, 12.5 * sc); hmax = Math.max(hmax, im.h);
        return cell([im.par, caption(`Hình ${c1}.${fig}.`, b.caps[i], 60)], i === n - 1 ? TXT - colW * (n - 1) : colW, { borders: noBorders, va: VerticalAlign.TOP, margins: { top: 0, bottom: 0, left: 40, right: 40 } }); });
      FIGS.push({ id, h: hmax, pair: true, leg: legH(nextLeg), w: wcm, min: b.mobile ? 4.1 : 6.4 });
      body.push(P([], { spacing: { before: 0, after: 0, line: 120 }, keepNext: true }));
      body.push(table([...Array(n - 1).fill(colW), TXT - colW * (n - 1)], [new TableRow({ cantSplit: true, children: cells })], { borders: noBorders }));
      if (nextLeg) body.push(P([new TextRun({ text: '', size: 8 })], { spacing: { before: 0, after: 0, line: 120 }, keepNext: true }));
    } else if (b.legend) {
      const W = [700, TXT - 700];
      const rows = [new TableRow({ tableHeader: true, cantSplit: true, children: [cell([cp('Số', { bold: true, align: AlignmentType.CENTER, color: 'FFFFFF', keep: true })], W[0], { fill: NAVY }), cell([cp('Ý nghĩa', { bold: true, color: 'FFFFFF', keep: true })], W[1], { fill: NAVY })] })];
      b.legend.forEach(([n, t], i) => { const keep = i < b.legend.length - 1; rows.push(new TableRow({ cantSplit: true, children: [
        cell([cp(String(n), { bold: true, color: RED, align: AlignmentType.CENTER, keep })], W[0], { fill: 'FBEAEC' }), cell([cp(t, { keep })], W[1])] })); });
      body.push(table(W, rows));
      body.push(P([new TextRun({ text: '', size: 12 })], { spacing: { before: 0, after: 80, line: 160 } }));
    } else if (b.table) {
      tab++;
      body.push(caption(`Bảng ${c1}.${tab}.`, b.cap || '', 120));
      const W = fitW(b.table.widths);
      const rows = [new TableRow({ tableHeader: true, children: b.table.head.map((h, i) => cell([cp(h, { bold: true, color: 'FFFFFF', align: AlignmentType.CENTER })], W[i], { fill: NAVY })) })];
      b.table.rows.forEach((r, ri) => rows.push(new TableRow({ cantSplit: true, children: r.map((v, i) => cell([cp(String(v), { align: W[i] <= 900 ? AlignmentType.CENTER : AlignmentType.LEFT })], W[i], { fill: ri % 2 ? 'F3F5F9' : undefined })) })));
      body.push(table(W, rows));
      body.push(P([new TextRun({ text: '', size: 12 })], { spacing: { before: 0, after: 80, line: 160 } }));
    } else if (b.code) {
      // khối lệnh: chữ đơn cách trên nền xám, mỗi dòng một đoạn
      const cb = { style: BorderStyle.SINGLE, size: 4, color: 'C9D1DE' };
      const lines = b.code.split('\n').map((l, i, a) => P([new TextRun({ text: l || ' ', font: 'Consolas', size: 21 })], { spacing: { before: 0, after: 0, line: 260 }, keepNext: i < a.length - 1 }));
      body.push(table([TXT], [new TableRow({ cantSplit: true, children: [cell(lines, TXT, { fill: 'F4F6FA', borders: { top: cb, bottom: cb, left: cb, right: cb }, margins: { top: 80, bottom: 80, left: 160, right: 120 } })] })]));
      body.push(P([new TextRun({ text: '', size: 12 })], { spacing: { before: 0, after: 80, line: 160 } }));
    } else if (b.note) {
      const nb = { style: BorderStyle.SINGLE, size: 6, color: '9DB4DA' };
      body.push(P([new TextRun({ text: '', size: 12 })], { spacing: { before: 0, after: 40, line: 160 }, keepNext: true }));
      body.push(table([TXT], [new TableRow({ cantSplit: true, children: [cell([P([new TextRun({ text: 'Lưu ý: ', bold: true, italics: true, color: NAVY }), ...runs(b.note, { italics: true })], { alignment: AlignmentType.JUSTIFIED, spacing: { line: 300 } })], TXT, { fill: 'EEF3FB', borders: { top: nb, bottom: nb, left: nb, right: nb }, margins: { top: 100, bottom: 100, left: 160, right: 160 } })] })]));
      body.push(P([new TextRun({ text: '', size: 12 })], { spacing: { before: 0, after: 80, line: 160 } }));
    } else throw new Error('Khối lạ: ' + JSON.stringify(b).slice(0, 80));
  });

  // ===== Bìa =====
  const drum = fs.readFileSync(path.join(DIR, 'drum.png'));
  const cv = (text, o = {}) => P([new TextRun({ text, bold: o.bold, size: o.size || 26, color: o.color, italics: o.italics })], { alignment: AlignmentType.CENTER, spacing: { before: o.before || 0, after: o.after || 0 } });
  const cover = [
    cv(role.top ? role.top[0] : 'ỦY BAN NHÂN DÂN XÃ/PHƯỜNG', { size: 26 }),
    cv(role.top ? role.top[1] : 'BAN QUẢN LÝ DỰ ÁN', { bold: true, size: 26 }),
    P([new TextRun({ text: '', size: 8 })], { alignment: AlignmentType.CENTER, indent: { left: 3600, right: 3600 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000', space: 1 } }, spacing: { after: 0 } }),
    P([new ImageRun({ type: 'png', data: drum, transformation: { width: cm2px(5.2), height: cm2px(5.2) }, altText: { title: 'Trống đồng', description: 'Hoa văn mặt trống đồng', name: 'drum' } })], { alignment: AlignmentType.CENTER, spacing: { before: 1300, after: 900 } }),
    cv('TÀI LIỆU', { bold: true, size: 32, color: NAVY }),
    cv('HƯỚNG DẪN SỬ DỤNG', { bold: true, size: 40, color: NAVY, after: 240 }),
    cv('PHẦN MỀM QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG', { bold: true, size: 28 }),
    cv(role.coverSub || 'BẢN DÙNG CHUNG CHO CÁC XÃ, PHƯỜNG', { size: 26, after: 600 }),
    P([new TextRun({ text: role.cover ? '' : 'Dành cho: ', size: 28 }), new TextRun({ text: role.cover || role.name.toUpperCase(), bold: true, size: 28, color: RED })], { alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
    cv('Phiên bản ' + verNo(role), { italics: true, size: 26, after: 2000 }),
    cv('Đơn vị thực hiện: Công ty Cổ phần Tin học Tri Thức', { size: 24 }),
    cv('Cần Thơ, ' + MONTH, { bold: true, size: 26, before: 200 }),
  ];

  // ===== Thông tin tài liệu =====
  const kv = rows => table([2800, TXT - 2800], rows.map(([a, b]) => new TableRow({ children: [cell([cp(a, { bold: true })], 2800, { fill: 'F3F5F9' }), cell([cp(b)], TXT - 2800)] })));
  const hdr = (W0, head, rows, W = fitW(W0)) => table(W, [new TableRow({ tableHeader: true, children: head.map((h, i) => cell([cp(h, { bold: true, color: 'FFFFFF', align: AlignmentType.CENTER })], W[i], { fill: NAVY })) }),
    ...rows.map(r => new TableRow({ children: r.map((v, i) => cell([cp(v, { align: i === 0 && W[i] < 1800 ? AlignmentType.CENTER : AlignmentType.LEFT })], W[i])) }))]);
  const title = t => P([new TextRun({ text: t, bold: true, size: 28, color: NAVY })], { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 200 } });
  const sub = t => P([new TextRun({ text: t, bold: true, size: 26 })], { spacing: { before: 280, after: 120 } });
  const info = [
    title('THÔNG TIN TÀI LIỆU'),
    kv([['Tên tài liệu', role.audience ? `Hướng dẫn sử dụng Phần mềm quản lý dự án đầu tư xây dựng – ${role.name.toLowerCase()}` : `Hướng dẫn sử dụng Phần mềm quản lý dự án đầu tư xây dựng – dành cho ${role.name}`],
      ['Mã tài liệu', `HDSD-QLDA-XP-${k.toUpperCase()}`], ['Phiên bản', verNo(role)], ['Ngày ban hành', DATE_VN],
      ['Đối tượng sử dụng', role.audience || `Cán bộ thuộc nhóm người dùng «${role.name}»`],
      ['Cơ quan sử dụng', role.org || 'Ban Quản lý dự án đầu tư xây dựng xã/phường'],
      ['Đơn vị soạn thảo', 'Công ty Cổ phần Tin học Tri Thức']]),
    sub('Lịch sử thay đổi'),
    hdr([1300, 1700, 4000, 2000], ['Phiên bản', 'Ngày', 'Nội dung thay đổi', 'Người thực hiện'], hist(role).map(([v, d, t]) => [v, d, t, TT])),
    sub('Thuật ngữ và từ viết tắt'),
    hdr([2000, 7000], ['Từ viết tắt', 'Ý nghĩa'], [['BQLDA', 'Ban Quản lý dự án đầu tư xây dựng xã/phường'], ['QLDA', 'Quản lý dự án'], ['HDSD', 'Hướng dẫn sử dụng'],
      ['GPMB', 'Giải phóng mặt bằng'], ['KBNN', 'Kho bạc Nhà nước'], ['TVGS', 'Tư vấn giám sát'], ['BOQ', 'Bảng khối lượng hợp đồng (Bill of Quantities)'], ['QTHT', 'Quản trị hệ thống'], ['Gantt', 'Biểu đồ tiến độ dạng thanh ngang theo thời gian'], ...(role.terms || [])]),
  ];

  // ===== Mục lục tĩnh (số trang từ lượt 1) =====
  const tocP = [title('MỤC LỤC')];
  toc.forEach(t => tocP.push(P([new InternalHyperlink({ anchor: t.id, children: [
      new TextRun({ text: t.text, bold: t.lvl === 1, size: 25 }),
      new TextRun({ text: '\t' + String(pages[t.id] || 0), bold: t.lvl === 1, size: 25 })] })],
    { tabStops: [{ type: D.TabStopType.RIGHT, position: 9060, leader: 'dot' }], indent: { left: t.lvl === 1 ? 0 : 400, right: 0 }, spacing: { before: t.lvl === 1 ? 100 : 0, after: 20, line: 264 } })));

  const header = new Header({ children: [P([new TextRun({ text: `HDSD Phần mềm QLDA đầu tư xây dựng – ${role.name}`, italics: true, size: 20, color: '5A6474' })],
    { alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY, space: 2 } } })] });
  const footer = new Footer({ children: [P([new TextRun({ children: [PageNumber.CURRENT], size: 22 })], { alignment: AlignmentType.CENTER })] });
  const margin = { top: 1134, bottom: 1134, left: 1701, right: 1134, header: 567, footer: 567 };
  const dbl = { style: BorderStyle.DOUBLE, size: 12, color: NAVY, space: 24 };

  return new Document({
    creator: 'Công ty Cổ phần Tin học Tri Thức', title: `HDSD Phần mềm QLDA đầu tư xây dựng – ${role.name}`,
    styles: {
      default: { document: { run: { font: FONT, size: 26 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true, color: NAVY }, paragraph: { spacing: { before: 0, after: 200 }, outlineLevel: 0, keepNext: true } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 26, bold: true }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 1, keepNext: true } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 26, bold: true, italics: true }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2, keepNext: true } },
      ],
    },
    numbering: { config: numbering },
    sections: [
      { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 },
          borders: { pageBorderTop: dbl, pageBorderBottom: dbl, pageBorderLeft: dbl, pageBorderRight: dbl, pageBorders: { display: 'allPages', offsetFrom: 'text' } } } },
        children: cover },
      { properties: { page: { size: { width: 11906, height: 16838 }, margin, pageNumbers: { start: 1 } } }, headers: { default: header }, footers: { default: footer },
        children: [...info, P([new PageBreak()]), ...tocP, ...body] },
    ],
  });
}

function toPdf(docx) {
  execSync(`python3 "${path.join(DIR, 'fixids.py')}" "${docx}"`);
  execSync(`cd "${OUT}" && soffice --headless --convert-to pdf "${path.basename(docx)}" >/dev/null 2>&1`);
  return docx.replace(/\.docx$/, '.pdf');
}
function pageMap(pdf, toc) {
  const txt = execSync(`pdftotext -layout "${pdf}" -`).toString().split('\f');
  const map = {}; let from = 0;
  // bỏ qua trang mục lục: dòng tiêu đề trong nội dung không có số trang ở cuối
  for (const t of toc) {
    for (let i = from; i < txt.length; i++) {
      const lines = txt[i].split('\n').map(s => s.trim());
      if (lines.some(l => l === t.text)) { map[t.id] = i; from = i; break; } // trang PDF i (0 = bìa) → số trang hiển thị i
    }
  }
  return map;
}

function h1Pages(pages) { return Object.entries(pages).filter(([id]) => /^c\d+$/.test(id)).map(([, p]) => p); }
function tocOf(k) {
  const toc = []; let a = 0, b2 = 0;
  build(k).forEach(b => { if (b.h1) { a++; b2 = 0; toc.push({ id: `c${a}`, text: `${a}. ${b.h1}` }); } else if (b.h2) { b2++; toc.push({ id: `c${a}_${b2}`, text: `${a}.${b2}. ${b.h2}` }); } });
  return toc;
}
(async () => {
  const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ROLES).filter(k => k !== 'dt');
  for (const k of keys) {
    const fn = path.join(OUT, `${DATE} - HDSD Phan mem QLDA Xa Phuong - ${ROLES[k].file} - ${vFile(ROLES[k])}.docx`);
    const toc = tocOf(k), FIT = {}, log = [];
    let pages = {}, rep;
    // dàn trang: thu nhỏ hình bị đẩy sang trang sau (mỗi lượt sửa hình sớm nhất) cho tới khi không còn
    for (let pass = 0; pass < 30; pass++) {
      const FIGS = [];
      fs.writeFileSync(fn, await Packer.toBuffer(makeDoc(k, pages, FIT, FIGS)));
      const pdf = toPdf(fn);
      pages = pageMap(pdf, toc);
      rep = JSON.parse(execSync(`python3 "${path.join(DIR, 'measure.py')}" "${pdf}" '${JSON.stringify(FIGS)}' '${JSON.stringify(h1Pages(pages))}'`).toString());
      const ok = rep.props.filter(p => !(FIT[p.id] && p.scale > 0.97)).filter(p => p.scale < 1 && p.scale * p.w >= (p.min || 7.5));
      if (!ok.length) break;
      const p = ok[0]; FIT[p.id] = (FIT[p.id] || 1) * p.scale; log.push(`${p.id}×${FIT[p.id].toFixed(2)}`);
    }
    // lượt cuối: ghi số trang vào mục lục
    fs.writeFileSync(fn, await Packer.toBuffer(makeDoc(k, pages, FIT, [])));
    const pdf = toPdf(fn), chk = pageMap(pdf, toc), diff = toc.filter(t => chk[t.id] !== pages[t.id]).length;
    const n = execSync(`pdfinfo "${pdf}" | grep Pages`).toString().trim().replace(/\s+/g, ' ');
    console.log(k, n, '| thu nhỏ:', log.join(' ') || '-', '| lệch mục lục:', diff, '| trang còn trống nhiều:', JSON.stringify(rep.gaps), '| không sửa được:', JSON.stringify(rep.props));
  }
})();
