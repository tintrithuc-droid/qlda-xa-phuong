#!/usr/bin/env python3
"""Gắn lại tệp e-work vào đúng bản ghi và sửa dữ liệu đầu kỳ cho xã thuê bao trithuc (chạy trên máy chủ .22, chỉ dùng thư viện chuẩn).
  python3 gan_lai.py thu   : dựng bản sao CSDL <db>_thu, chạy toàn bộ trên bản sao, báo cáo, xóa bản sao. Không đụng CSDL thật, không chép tệp.
  python3 gan_lai.py that  : chạy trên CSDL thật (đã sao lưu trước), chép tệp trùng nội dung cho các hồ sơ dùng chung.
Kết quả ở thư mục ./ketqua/: bao-cao.txt, tep-chua-co-tren-may-chu.csv, tep-may-chu-khong-khop.csv, lenh.sql"""
import sys, os, json, csv, io, re, subprocess, uuid, datetime, collections, shutil
MODE = sys.argv[1] if len(sys.argv) > 1 else 'thu'
assert MODE in ('thu', 'that')
HERE = os.path.dirname(os.path.abspath(__file__))
DIRAPP = '/opt/qlda-thue-bao'; MA = 'trithuc'
FILES = f'{DIRAPP}/du-lieu/xa/{MA}/files'
OUTD = os.path.join(HERE, 'ketqua'); os.makedirs(OUTD, exist_ok=True)
DC = os.environ['QLDA_DC'].split() if os.environ.get('QLDA_DC') else ['docker', 'compose', '--project-directory', DIRAPP, '-p', 'qlda-thue-bao', 'exec', '-T', 'db']
FILES = os.environ.get('QLDA_FILES', FILES)
def psql(db, sql=None, stdin=None, csvout=False):
    cmd = DC + ['psql', '-U', 'qlda_quantri', '-d', db, '-v', 'ON_ERROR_STOP=1', '-X', '-q']
    if sql is not None: cmd += ['-Atc', sql] if not csvout else ['-c', sql]
    r = subprocess.run(cmd, input=stdin, capture_output=True, text=True)
    if r.returncode: raise SystemExit('LỖI psql: ' + r.stderr[-3000:])
    return r.stdout
def q(db, sql):  # trả về danh sách dict
    out = psql(db, f"\\copy ({sql}) to stdout with csv header", csvout=True)
    return list(csv.DictReader(io.StringIO(out)))
LIVE = os.environ.get('QLDA_DB') or psql('qlda_nentang', f"select \"DbName\" from tenants where \"Code\"='{MA}'").strip()
ADMDB = os.environ.get('QLDA_ADMDB', 'qlda_nentang')
assert LIVE, 'không thấy CSDL của xã'
DB = LIVE
if MODE == 'thu':
    DB = LIVE + '_thu'
    psql(ADMDB, f'drop database if exists "{DB}"'); psql(ADMDB, f'create database "{DB}"')
    dump = subprocess.run(DC + ['pg_dump', '-U', 'qlda_quantri', '--no-owner', LIVE], capture_output=True, text=True, check=True).stdout
    psql(DB, stdin=dump)
print('CSDL làm việc:', DB)
plan = json.load(open(os.path.join(HERE, 'plan.json'), encoding='utf-8'))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
S = lambda v: 'NULL' if v is None or v == '' else "'" + str(v).replace("'", "''") + "'"
nid = lambda p: p + '-' + uuid.uuid4().hex[:20]

# ---------- đọc dữ liệu hiện có ----------
P = {r['Code']: r['Id'] for r in q(DB, 'select "Id","Code" from "Projects"')}
PK = {(r['ProjectId'], r['Code']): r for r in q(DB, 'select "Id","ProjectId","Code","Name","Type" from "Packages"')}
SC = collections.defaultdict(list)
for r in q(DB, 'select "Id","ProjectId","PackageId","Name","Progress","PlanEnd","ActualEnd","History" from "ScheduleItems"'): SC[(r['ProjectId'], r['PackageId'], r['Name'])].append(r)
CT = {r['Number']: r for r in q(DB, 'select "Id","Number","ProjectId","PackageId" from "Contracts"')}
PAY = {r['Number']: r for r in q(DB, 'select p."Id",p."Number",c."ProjectId" from "Payments" p join "Contracts" c on c."Id"=p."ContractId"')}
OLDL = {r['Id']: r for r in q(DB, 'select "Id","ProjectId","Number","UpdatedBy","UpdatedAt" from "LegalDocuments"')}
ATT = q(DB, 'select a."Id",a."Collection",a."RecordId",a."ProjectId",a."FileName",a."Size",a."FileId",a."UploadedBy",a."UploadedAt",s."RelPath",s."ContentType" from "Attachments" a left join "StoredFiles" s on s."Id"=a."FileId" where a."DeletedAt" is null and a."Collection"=\'legal\'')
TASKS0 = int(psql(DB, 'select count(*) from "ProjectTasks"').strip())
rep = []; R = lambda *a: rep.append(' '.join(str(x) for x in a))
R('Ngày chạy (UTC):', now, '| chế độ:', MODE, '| CSDL:', DB)
R('Hiện có: hồ sơ pháp lý', len(OLDL), '| tệp gắn hồ sơ pháp lý', len(ATT), '| công việc', TASKS0)
OTHER = {r['RecordId'] for r in q(DB, 'select distinct "RecordId" from "ApprovalLogs" where "Collection"=\'legal\'')}
def tsx(v): return datetime.datetime.fromisoformat(v[:19]) if v else None
dk = [tsx(r['UpdatedAt']) for r in OLDL.values() if r['Id'].startswith('dk-') and r['UpdatedAt']]
t0 = min(dk) if dk else None
edited = [r for r in OLDL.values() if not r['Id'].startswith('dk-') or r['Id'] in OTHER or not t0 or not r['UpdatedAt'] or tsx(r['UpdatedAt']) > t0 + datetime.timedelta(minutes=30)]
R('Hồ sơ pháp lý đã có người sửa hoặc trình duyệt sau khi nạp (giữ nguyên):', len(edited))
keepLegal = {r['Id'] for r in edited}

# ---------- khớp tệp kế hoạch với tệp trên máy chủ: tên tệp + dung lượng ----------
def szfmt(n):
    n = int(n); out = set()
    for unit, div in (('KB', 1024), ('MB', 1024 ** 2), ('GB', 1024 ** 3)):
        v = n / div
        for x in (v - 0.05, v, v + 0.05):
            s = ('%.1f' % x).rstrip('0').rstrip('.') if x >= 0 else ''
            out.add(s + ' ' + unit)
    out.add(str(n) + ' B'); return out
byName = collections.defaultdict(list)
for a in ATT: byName[a['FileName'].lower()].append(a)
used = {}; copies = []; missing = []; assign = []
for f in plan['files']:
    pid = P.get(f['projectCode'])
    nm = re.split(r'[\\/]', f.get('local') or '')[-1] or f['name']
    pool = byName.get(nm.lower(), []) or byName.get(f['name'].lower(), [])
    cands = [a for a in pool if f['size'] in szfmt(a['Size'])] or pool
    if not cands: missing.append(f); continue
    free = [a for a in cands if a['Id'] not in used]
    free.sort(key=lambda a: (a['ProjectId'] != pid,))
    if free: a = free[0]; used[a['Id']] = f; assign.append((a, f, False))
    else: assign.append((cands[0], f, True))
unmatched = [a for a in ATT if a['Id'] not in used]
R('Tệp trong kế hoạch:', len(plan['files']), '| khớp tệp trên máy chủ:', len(assign) - sum(1 for x in assign if x[2]), '| cần nhân bản (trùng tên, cùng nội dung, dùng cho nhiều hồ sơ):', sum(1 for x in assign if x[2]), '| chưa có trên máy chủ:', len(missing))
R('Tệp trên máy chủ không khớp kế hoạch (giữ nguyên chỗ cũ):', len(unmatched))

# ---------- dựng câu lệnh ----------
sql = ['BEGIN;']; err = collections.Counter(); copyOps = []
mark = psql(DB, 'select "ToStatus" from "ApprovalLogs" where "Collection"=\'legal\' and "Action"=\'Số liệu đầu kỳ\' limit 1').strip()
def stamp(col, rid, pid, what):
    sql.append(f'INSERT INTO "ApprovalLogs" ("Id","Collection","RecordId","ProjectId","Target","Action","FromStatus","ToStatus","Note","By","ByName","At","UpdatedAt","UpdatedBy") VALUES ({S(nid("apr"))},{S(col)},{S(rid)},{S(pid)},{S(what)},\'Số liệu đầu kỳ\',NULL,{S(mark or None)},{S(what + " (chuyển lại từ e-work 19/11/2026)")},\'admin\',\'Quản trị hệ thống\',{S(now)},{S(now)},\'admin\');')
# hồ sơ pháp lý mới
newL = {}
for k in plan['legal']:
    pid = P.get(k['projectCode'])
    if not pid: err['hồ sơ: không thấy dự án'] += 1; continue
    kid = PK.get((pid, k['packageCode']), {}).get('Id') if k['packageCode'] else None
    if k['packageCode'] and not kid: err['hồ sơ: không thấy gói (để trống gói)'] += 1
    i = nid('dk-pl'); newL[k['key']] = (i, pid)
    sql.append(f'INSERT INTO "LegalDocuments" ("Id","ProjectId","PackageId","Type","Number","Date","Title","UpdatedAt","UpdatedBy") VALUES ({S(i)},{S(pid)},{S(kid)},{S(k["type"])},{S(k["number"])},{S(k["date"])},{S(k["title"])},{S(now)},\'admin\');')
# đích của từng tệp
def target(f):
    pid = P.get(f['projectCode'])
    if f['col'] == 'legal':
        x = newL.get(f['key']); return ('legal', x[0], x[1]) if x else None
    if f['col'] == 'schedule':
        kid = PK.get((pid, f['packageCode']), {}).get('Id'); r = SC.get((pid, kid, f['schedName']))
        return ('schedule', r[0]['Id'], pid) if r else None
    if f['col'] == 'contracts':
        r = CT.get(f['number']); return ('contracts', r['Id'], r['ProjectId']) if r else None
    if f['col'] == 'payments':
        r = PAY.get(f['number']); return ('payments', r['Id'], r['ProjectId']) if r else None
moved = collections.Counter()
for a, f, dup in assign:
    t = target(f)
    if not t:
        err['tệp: không thấy bản ghi đích ' + f['col'] + ' → đưa về hồ sơ pháp lý riêng'] += 1
        pid = P.get(f['projectCode']); i = nid('dk-pl'); kid = PK.get((pid, f['packageCode']), {}).get('Id') if f['packageCode'] else None
        sql.append(f'INSERT INTO "LegalDocuments" ("Id","ProjectId","PackageId","Type","Number","Date","Title","UpdatedAt","UpdatedBy") VALUES ({S(i)},{S(pid)},{S(kid)},{S(f.get("kind") or "Văn bản khác")},\'(chưa nhập số)\',NULL,{S(re.sub(r"[-_]+", " ", re.sub(r"\.[^.]+$", "", f["name"])))},{S(now)},\'admin\');')
        t = ('legal', i, pid)
    col, rid, pid = t; kind = f.get('kind') or 'Tệp đính kèm'; ref = f.get('ref') or 'Chuyển từ e-work'
    if not dup:
        sql.append(f'UPDATE "Attachments" SET "Collection"={S(col)},"RecordId"={S(rid)},"ProjectId"={S(pid)},"Kind"={S(kind)},"Ref"={S(ref)} WHERE "Id"={S(a["Id"])};')
    else:
        fid = 'f' + uuid.uuid4().hex; ext = os.path.splitext(a['RelPath'] or '')[1]; rel = '2026/11/' + fid + ext
        copyOps.append((os.path.join(FILES, a['RelPath']), os.path.join(FILES, rel)))
        sql.append(f'INSERT INTO "StoredFiles" ("Id","FileName","ContentType","Size","RelPath","UploadedBy","UploadedAt") VALUES ({S(fid)},{S(a["FileName"])},{S(a["ContentType"])},{a["Size"]},{S(rel)},\'admin\',{S(now)});')
        sql.append(f'INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt") VALUES ({S("att-" + uuid.uuid4().hex[:20])},{S(col)},{S(rid)},{S(pid)},{S(kind)},{S(ref)},{S(fid)},{S(a["FileName"])},{S(a["ContentType"])},{a["Size"]},\'TRI THUC\',{S(now)});')
    moved[col] += 1
R('Tệp sẽ gắn vào:', dict(moved))
# xóa hồ sơ pháp lý cũ không còn tệp (trừ hồ sơ đã có người sửa, hồ sơ còn giữ tệp không khớp)
holding = {a['RecordId'] for a in unmatched}
dropL = [i for i in OLDL if i not in keepLegal and i not in holding]
for i in dropL:
    sql.append(f'DELETE FROM "ApprovalLogs" WHERE "Collection"=\'legal\' AND "RecordId"={S(i)};')
    sql.append(f'DELETE FROM "LegalDocuments" WHERE "Id"={S(i)};')
R('Hồ sơ pháp lý cũ sẽ xóa (tự sinh khi nạp, đã chuyển tệp đi):', len(dropL), '| giữ lại:', len(OLDL) - len(dropL))
# công việc e-work → phân hệ Công việc; bỏ đầu việc tiến độ tương ứng
delS = set(); nt = 0
for t in plan['tasks']:
    pid = P.get(t['projectCode'])
    if not pid: err['công việc: không thấy dự án'] += 1; continue
    i = nid('dk-cv'); nt += 1
    sql.append(f'INSERT INTO "ProjectTasks" ("Id","ProjectId","Name","Assignee","Due","Status","Priority","Note","DoneDate","UpdatedAt","UpdatedBy") VALUES ({S(i)},{S(pid)},{S(t["name"])},{S(t["assignee"])},{S(t["due"])},{S(t["status"])},{S(t["priority"])},{S(t["note"])},{S(t["doneDate"])},{S(now)},\'admin\');')
    if t['schedName']:
        kid = PK.get((pid, t['packageCode']), {}).get('Id'); rs = SC.get((pid, kid, t['schedName']), [])
        if rs: delS.add(rs[0]['Id'])
        else: err['công việc: không thấy đầu việc tiến độ cũ'] += 1
hasAttS = {r['RecordId'] for r in q(DB, 'select "RecordId" from "Attachments" where "Collection"=\'schedule\' and "DeletedAt" is null')}
for i in delS:
    if i in hasAttS: err['đầu việc có tệp, giữ lại'] += 1; continue
    sql.append(f'DELETE FROM "ApprovalLogs" WHERE "Collection"=\'schedule\' AND "RecordId"={S(i)};')
    sql.append(f'DELETE FROM "ScheduleItems" WHERE "Id"={S(i)};')
R('Công việc thêm vào phân hệ Công việc:', nt, '| đầu việc tiến độ bỏ đi (vốn là công việc):', len(delS))
# gói tự sinh "Công việc thực hiện của Tri Thức"
nsp = 0
for x in plan['synthPkgs']:
    pid = P.get(x['projectCode']); k = PK.get((pid, x['packageCode']))
    if not k or not k['Name'].startswith('Công việc thực hiện'): continue
    nsp += 1
    sql.append(f'DELETE FROM "ApprovalLogs" WHERE "Collection"=\'packages\' AND "RecordId"={S(k["Id"])} AND NOT EXISTS (SELECT 1 FROM "ScheduleItems" WHERE "PackageId"={S(k["Id"])}) AND NOT EXISTS (SELECT 1 FROM "Contracts" WHERE "PackageId"={S(k["Id"])}) AND NOT EXISTS (SELECT 1 FROM "LegalDocuments" WHERE "PackageId"={S(k["Id"])});')
    sql.append(f'DELETE FROM "Packages" WHERE "Id"={S(k["Id"])} AND NOT EXISTS (SELECT 1 FROM "ScheduleItems" WHERE "PackageId"={S(k["Id"])}) AND NOT EXISTS (SELECT 1 FROM "Contracts" WHERE "PackageId"={S(k["Id"])}) AND NOT EXISTS (SELECT 1 FROM "LegalDocuments" WHERE "PackageId"={S(k["Id"])});')
R('Gói tự sinh "Công việc thực hiện của Tri Thức" sẽ bỏ:', nsp)
# loại gói thi công
for x in plan['pkgType']:
    k = PK.get((P.get(x['projectCode']), x['packageCode']))
    if k: sql.append(f'UPDATE "Packages" SET "Type"={S(x["type"])},"UpdatedAt"={S(now)} WHERE "Id"={S(k["Id"])};')
    else: err['loại gói: không thấy gói'] += 1
R('Gói thi công đổi loại:', len(plan['pkgType']))
# lịch sử tiến độ: điểm 100% ở đúng ngày bước kết thúc
nh = 0
for h in plan['stepHist']:
    pid = P.get(h['projectCode']); kid = PK.get((pid, h['packageCode']), {}).get('Id'); rs = SC.get((pid, kid, h['name']), [])
    if not rs: err['lịch sử: không thấy bước'] += 1; continue
    d = min(h['date'], '2026-11-18'); hist = json.dumps([dict(date=d, progress=h['progress'], note='Số liệu đầu kỳ (theo ngày trên e-work)', by='Quản trị hệ thống')], ensure_ascii=False)
    sql.append(f'UPDATE "ScheduleItems" SET "History"={S(hist)},"ActualEnd"=COALESCE("ActualEnd",{S(d if h["progress"] >= 100 else None)}) WHERE "Id"={S(rs[0]["Id"])};'); nh += 1
R('Bước có lịch sử tiến độ đặt lại theo ngày thật:', nh)
sql.append('COMMIT;')
for k, v in err.items(): R('  Lưu ý:', k, v)
open(os.path.join(OUTD, 'lenh.sql'), 'w', encoding='utf-8').write('\n'.join(sql))
with open(os.path.join(OUTD, 'tep-chua-co-tren-may-chu.csv'), 'w', encoding='utf-8-sig', newline='') as fh:
    w = csv.writer(fh); w.writerow(['ma', 'ten_tep', 'dung_luong', 'tep_tren_may_anh_Tri', 'du_an', 'goi', 'dich']); [w.writerow([f['ma'], f['name'], f['size'], f['local'], f['projectCode'], f['packageCode'], f['col']]) for f in missing]
with open(os.path.join(OUTD, 'tep-may-chu-khong-khop.csv'), 'w', encoding='utf-8-sig', newline='') as fh:
    w = csv.writer(fh); w.writerow(['ten_tep', 'dung_luong', 'ho_so']); [w.writerow([a['FileName'], a['Size'], OLDL.get(a['RecordId'], {}).get('Number')]) for a in unmatched]
# ---------- thực hiện ----------
if MODE == 'that':
    for s, d in copyOps:
        os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy2(s, d); st = os.stat(s); os.chown(d, st.st_uid, st.st_gid)
psql(DB, stdin='\n'.join(sql))
# ---------- kiểm tra sau khi chạy ----------
chk = psql(DB, '''select 'hồ sơ pháp lý', count(*) from "LegalDocuments" union all
 select 'công việc', count(*) from "ProjectTasks" union all select 'đầu việc tiến độ', count(*) from "ScheduleItems" union all select 'gói', count(*) from "Packages" union all
 select 'tệp ' || "Collection", count(*) from "Attachments" where "DeletedAt" is null group by "Collection" union all
 select 'tệp trỏ tới bản ghi không tồn tại', count(*) from "Attachments" a where a."DeletedAt" is null and a."Collection"='legal' and not exists (select 1 from "LegalDocuments" l where l."Id"=a."RecordId") union all
 select 'tệp lệch dự án với bản ghi', count(*) from "Attachments" a join "LegalDocuments" l on l."Id"=a."RecordId" where a."Collection"='legal' and a."DeletedAt" is null and coalesce(a."ProjectId",'')<>coalesce(l."ProjectId",'') union all
 select 'hồ sơ pháp lý không ngày', count(*) from "LegalDocuments" where "Date" is null''')
R('--- Sau khi chạy ---'); R(chk.replace('|', ': '))
if MODE == 'thu': psql(ADMDB, f'drop database "{DB}"'); R('Đã xóa bản sao thử.')
open(os.path.join(OUTD, 'bao-cao.txt'), 'w', encoding='utf-8').write('\n'.join(rep) + '\n')
print('\n'.join(rep))
