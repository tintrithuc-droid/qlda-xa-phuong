# Đo bố cục PDF: tìm hình bị đẩy sang trang sau để lại khoảng trống lớn ở trang trước.
import sys, json, re, subprocess, html
from PIL import Image
import io
pdf, figs, h1pages = sys.argv[1], json.loads(sys.argv[2]), set(json.loads(sys.argv[3]))
TOPLIM, BOT = 50.0, 785.0   # pt: dưới đường kẻ đầu trang; đáy vùng chữ
out = subprocess.run(['pdftotext', '-bbox', pdf, '-'], capture_output=True, text=True).stdout
pages = []
for pg in re.findall(r'<page[^>]*>(.*?)</page>', out, re.S):
    pages.append([(float(a), float(b), html.unescape(t)) for a, b, t in re.findall(r'<word xMin="[\d.]+" yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)">([^<]*)</word>', pg)])
# raster 36 dpi (0.5 px/pt)
import tempfile, glob, os
td = tempfile.mkdtemp()
subprocess.run(['pdftoppm', '-r', '36', '-gray', pdf, td + '/p'], check=True)
ims = sorted(glob.glob(td + '/p-*.pgm'))
def extent(i):
    im = Image.open(ims[i]); w, h = im.size; px = im.load(); k = h / 842.0
    rows = [y for y in range(int(TOPLIM * k), int(BOT * k) + 1) if any(px[x, y] < 200 for x in range(int(w*0.12), int(w*0.92), 1))]
    return (rows[0] / k, rows[-1] / k) if rows else (None, None)
ext = [extent(i) for i in range(len(ims))]
# vị trí chú thích "Hình x.y."
cap = {}
for i, ws in enumerate(pages):
    for j in range(len(ws) - 1):
        if ws[j][2] == 'Hình' and re.fullmatch(r'\d+\.\d+\.', ws[j+1][2]):
            cap.setdefault(ws[j+1][2][:-1], (i, ws[j][0]))
props, gaps = [], []
for f in figs:
    if f['id'] not in cap: continue
    p, y = cap[f['id']]
    if p in h1pages or p < 2: continue
    top = ext[p][0]; prevbot = ext[p-1][1]
    if top is None or prevbot is None: continue
    imgtop = y - 6 - f['h']
    offset = imgtop - top              # phần nội dung đứng trước ảnh trên trang mới (tiêu đề, bước…)
    free = BOT - prevbot - 4
    if offset > 70 or free < 90: continue
    leg = f.get('leg', 0)
    need = offset + f['h'] + 26 + leg
    if need <= free: continue
    s = (free - offset - 30 - leg - 12) / f['h']
    props.append({'id': f['id'], 'page': p, 'free': round(free), 'scale': round(s, 3), 'pair': f.get('pair', False), 'w': f.get('w', 16), 'min': f.get('min')})
# đuôi chương: trang cuối chương chỉ còn vài dòng → thu nhỏ hình lớn nhất ở trang trước để kéo phần đuôi lên
starts = sorted(h1pages)
for ci, st in enumerate(starts):
    L = (starts[ci + 1] - 1) if ci + 1 < len(starts) else len(ext) - 1
    if L - 1 < st or ext[L][0] is None: continue
    tail = ext[L][1] - ext[L][0] + 14
    if tail > 200: continue
    cands = [f for f in figs if f['id'] in cap and cap[f['id']][0] == L - 1]
    if not cands: continue
    need = tail - (BOT - ext[L-1][1]) + 16
    for f in sorted(cands, key=lambda f: -f['h']):
      s2 = (f['h'] - need) / f['h']
      props.append({'id': f['id'], 'page': L - 1, 'free': -round(need), 'scale': round(s2, 3), 'pair': f.get('pair', False), 'w': f.get('w', 16), 'min': f.get('min'), 'tail': True})
props.sort(key=lambda p: p['page'])
for i in range(2, len(ext) - 1):
    if ext[i][1] is not None and (i + 1) not in h1pages and BOT - ext[i][1] > 230:
        gaps.append({'page': i, 'free_cm': round((BOT - ext[i][1]) / 28.35, 1)})
print(json.dumps({'props': props, 'gaps': gaps}))
