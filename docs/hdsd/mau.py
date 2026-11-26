# Tạo tệp mẫu (văn bản PDF, ảnh hiện trường, logo, video) dùng khi chụp ảnh HDSD: python3 mau.py
# Ghi vào /tmp/hdsd-mau/ và /tmp/hdsd-them/ (shots.js đọc từ hai thư mục này).
import os, subprocess
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

M, T = '/tmp/hdsd-mau/', '/tmp/hdsd-them/'
os.makedirs(M, exist_ok=True); os.makedirs(T, exist_ok=True)
FD = '/usr/share/fonts/truetype/dejavu/'
pdfmetrics.registerFont(TTFont('DV', FD + 'DejaVuSerif.ttf')); pdfmetrics.registerFont(TTFont('DVB', FD + 'DejaVuSerif-Bold.ttf'))

DOCS = {
  'QD-phe-duyet-du-an-so-1245-QD-UBND.pdf': ('QUYẾT ĐỊNH', 'Phê duyệt dự án đầu tư xây dựng', 'Số: 1245/QĐ-UBND'),
  'QD-chu-truong-dau-tu-so-312-QD-UBND.pdf': ('NGHỊ QUYẾT', 'Quyết định chủ trương đầu tư dự án', 'Số: 312/QĐ-UBND'),
  'Giay-phep-xay-dung.pdf': ('GIẤY PHÉP XÂY DỰNG', 'Cấp cho Ban Quản lý dự án đầu tư xây dựng xã', 'Số: 86/GPXD'),
  'QD-phe-duyet-KHLCNT.pdf': ('QUYẾT ĐỊNH', 'Phê duyệt kế hoạch lựa chọn nhà thầu', 'Số: 58/QĐ-BQL'),
  'QD-phe-duyet-KQLCNT-XL01.pdf': ('QUYẾT ĐỊNH', 'Phê duyệt kết quả lựa chọn nhà thầu gói XL01', 'Số: 97/QĐ-BQL'),
  'Hop-dong-XL01-da-ky.pdf': ('HỢP ĐỒNG THI CÔNG XÂY DỰNG', 'Gói thầu XL01: Thi công xây dựng công trình', 'Số: 15/2025/HĐXD'),
  'Bao-lanh-thuc-hien-hop-dong.pdf': ('THƯ BẢO LÃNH', 'Bảo lãnh thực hiện hợp đồng', 'Số: BL 0215/2025'),
  'Bao-lanh-tam-ung.pdf': ('THƯ BẢO LÃNH', 'Bảo lãnh tiền tạm ứng hợp đồng', 'Số: BL 0216/2025'),
  'Bien-ban-nghiem-thu-dot-1.pdf': ('BIÊN BẢN NGHIỆM THU', 'Nghiệm thu khối lượng hoàn thành đợt 1', 'Số: 01/BBNT'),
  'Ho-so-de-nghi-thanh-toan-dot-1.pdf': ('GIẤY ĐỀ NGHỊ THANH TOÁN', 'Thanh toán khối lượng hoàn thành đợt 1', 'Số: 01/ĐNTT'),
  'Uy-nhiem-chi-KBNN.pdf': ('GIẤY RÚT VỐN ĐẦU TƯ', 'Kho bạc Nhà nước khu vực', 'Số: 125/RV'),
  'Trang-nhat-ky-da-ky.pdf': ('NHẬT KÝ THI CÔNG', 'Trang nhật ký đã có chữ ký các bên', 'Trang 46'),
  'Bao-cao-tuan-44.pdf': ('BÁO CÁO TUẦN', 'Tình hình thi công tuần 44', 'Tuần 44/2026'),
  'QD-giao-ke-hoach-von-2026.pdf': ('QUYẾT ĐỊNH', 'Giao kế hoạch vốn đầu tư công năm 2026', 'Số: 15/QĐ-UBND'),
  'Phuong-an-boi-thuong.pdf': ('QUYẾT ĐỊNH', 'Phê duyệt phương án bồi thường, hỗ trợ, tái định cư', 'Số: 210/QĐ-UBND'),
  'Bien-ban-ban-giao-dua-vao-su-dung.pdf': ('BIÊN BẢN BÀN GIAO', 'Bàn giao công trình đưa vào sử dụng', 'Số: 02/BBBG'),
  'Bao-cao-quyet-toan.pdf': ('BÁO CÁO QUYẾT TOÁN', 'Quyết toán dự án hoàn thành', 'Năm 2026'),
}
for fn, (t, sub, no) in DOCS.items():
    c = canvas.Canvas(M + fn, pagesize=A4); w, h = A4
    c.setFont('DVB', 11); c.drawCentredString(w / 2, h - 60, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')
    c.setFont('DV', 11); c.drawCentredString(w / 2, h - 76, 'Độc lập - Tự do - Hạnh phúc')
    c.setFont('DV', 11); c.drawCentredString(w / 2, h - 110, no)
    c.setFont('DVB', 16); c.drawCentredString(w / 2, h - 150, t)
    c.setFont('DV', 12); c.drawCentredString(w / 2, h - 172, sub)
    c.setFont('DV', 10)
    for i in range(18): c.line(70, h - 220 - i * 22, w - 70, h - 220 - i * 22)
    c.drawString(70, 110, '(Tài liệu mẫu minh họa)'); c.save()

def photo(fn, top, bot, label):
    im = Image.new('RGB', (1280, 960), top); d = ImageDraw.Draw(im)
    for y in range(480, 960): d.line([(0, y), (1280, y)], fill=tuple(int(bot[i] * (1 - (y - 480) / 900)) for i in range(3)))
    d.rectangle([300, 420, 980, 760], fill=(150, 150, 150)); d.rectangle([340, 300, 420, 760], fill=(120, 120, 120)); d.rectangle([860, 300, 940, 760], fill=(120, 120, 120))
    d.text((40, 880), label, fill=(255, 255, 255), font=ImageFont.truetype(FD + 'DejaVuSans-Bold.ttf', 40))
    im.save(M + fn, quality=85)
photo('Anh-hien-truong-mong-M1.jpg', (170, 200, 230), (160, 130, 90), 'Móng M1')
photo('Anh-hien-truong-cot-truc-A.jpg', (190, 210, 235), (140, 120, 95), 'Cột trục A')

lg = Image.new('RGBA', (512, 512), (0, 0, 0, 0)); d = ImageDraw.Draw(lg)
d.ellipse([16, 16, 496, 496], fill=(13, 42, 87)); d.ellipse([60, 60, 452, 452], outline=(255, 205, 0), width=14)
d.text((256, 256), 'QLDA', anchor='mm', fill=(255, 255, 255), font=ImageFont.truetype(FD + 'DejaVuSans-Bold.ttf', 110))
lg.save(T + 'Logo-don-vi-mau.png')

subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0x0D2A57:s=1280x720:d=9', '-vf',
  "drawtext=fontfile=" + FD + "DejaVuSans-Bold.ttf:text='Ghi nhật ký thi công':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2-40,"
  "drawtext=fontfile=" + FD + "DejaVuSans.ttf:text='%{eif\\:t+1\\:d}/9':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h/2)+60",
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', T + 'Video-ghi-nhat-ky-thi-cong.mp4'], check=True)
# Tệp Excel minh họa nhập kế hoạch tiến độ và khối lượng nghiệm thu (shots-v17.js); có sẵn dòng lỗi, dòng cảnh báo
import openpyxl
def xlsx(fn, rows):
    wb = openpyxl.Workbook(); ws = wb.active
    for r in rows: ws.append(list(r))
    wb.save(T + fn)
xlsx('Ke-hoach-tien-do-XL01.xlsx', [
    ('Tên công việc', 'Ngày bắt đầu', 'Ngày kết thúc', 'Trọng số (%)', 'Mã hạng mục công trình'),
    ('Thảm bê tông nhựa đoạn Km2+100 – Km3+400', '15/11/2026', '31/01/2027', 12, None),
    ('Lắp đặt hệ thống chiếu sáng nhánh rẽ', '01/12/2026', '28/02/2027', 6, None),
    ('Hoàn trả mặt bằng, vệ sinh công trường', '20/02/2027', '10/02/2027', 2, None),
    ('Sơn kẻ vạch, lắp biển báo', '01/03/2027', '31/03/2027', None, None)])
xlsx('Khoi-luong-nghiem-thu-XL01.xlsx', [
    ('Mã hiệu', 'Nội dung công việc (để đối chiếu)', 'Khối lượng thực hiện trong kỳ', 'Khối lượng nghiệm thu', 'Ngày', 'Đợt', 'Số biên bản / ghi chú'),
    ('AD.23', 'Mặt đường bê tông nhựa chặt 12,5', 1800, 1800, None, None, None),
    ('AF.82', 'Cống BTCT D600', 320, 300, None, None, None),
    ('AB.65', 'Đắp lề đất K95', 150, 260, None, None, None),
    ('AX.99', 'Hạng mục không có trong hợp đồng', 10, 10, None, None, None),
    ('AF.82', 'Cống BTCT D600 (ghi lặp)', 20, 20, None, None, None)])
print('Đã tạo', len(os.listdir(M)), 'tệp mẫu và', len(os.listdir(T)), 'tệp bổ sung')
