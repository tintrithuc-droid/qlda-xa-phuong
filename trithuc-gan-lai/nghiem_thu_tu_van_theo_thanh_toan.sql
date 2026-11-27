-- Tri Thức (qlda_x_trithuc), 20/11/2026, anh Trí duyệt: hợp đồng tư vấn đã thanh toán nhưng chưa khai báo sản phẩm
-- -> mỗi hợp đồng 1 sản phẩm bằng giá trị hợp đồng (sau phụ lục đã duyệt) và 1 đợt nghiệm thu "Đã duyệt"
-- bằng số đã thanh toán (không tính tạm ứng), không vượt giá trị hợp đồng.
-- Chỉ làm với hợp đồng chưa có sản phẩm và chưa có đợt nghiệm thu nào, nên chạy lại không tạo trùng.
begin;
create temp table _nt on commit drop as
with tv as (
  select c."Id", c."Value", k."Name" kname from "Contracts" c join "Packages" k on k."Id"=c."PackageId"
  where (k."Phase"='cb' or (k."Type" ~* 'tư vấn' and k."Type" !~* 'phi tư vấn'))
    and not exists(select 1 from "BoqItems" b where b."ContractId"=c."Id")
    and not exists(select 1 from "VolumeBatches" b where b."ContractId"=c."Id")),
v as (
  select tv.*, tv."Value" + coalesce((select sum(a."ValueChange") from "ContractAddenda" a where a."ContractId"=tv."Id" and coalesce(a."Status",'Đã duyệt')='Đã duyệt'),0) val,
    (select coalesce(sum(p."Amount"),0) from "Payments" p where p."ContractId"=tv."Id" and p."Status"='Đã thanh toán' and p."Kind"<>'Tạm ứng') paid,
    (select max(coalesce(p."PaidDate",p."Date")) from "Payments" p where p."ContractId"=tv."Id" and p."Status"='Đã thanh toán' and p."Kind"<>'Tạm ứng') ngay
  from tv)
select "Id" cid, kname, val, least(paid,val) acc, coalesce(ngay, current_date) ngay,
  'boq-nt'||left(md5("Id"||'boq'),12) bid, 'vba-nt'||left(md5("Id"||'vba'),12) vid, 'vol-nt'||left(md5("Id"||'vol'),12) lid
from v where paid>0 and val>0;

insert into "BoqItems"("Id","ContractId","Code","Name","Unit","Qty","Price","UpdatedAt","UpdatedBy")
select bid, cid, 'SP01', coalesce(nullif(kname,''),'Sản phẩm tư vấn theo hợp đồng'), 'Sản phẩm', 1, val, now() at time zone 'utc', 'Quản trị hệ thống' from _nt;

insert into "VolumeBatches"("Id","ContractId","Name","Number","Date","Note","Status","UpdatedAt","UpdatedBy")
select vid, cid, 'Đợt 1', null, ngay, 'Tạo ngày 20/11/2026 theo số đã thanh toán (không tính tạm ứng). Cần bổ sung số biên bản, tệp biên bản nghiệm thu và tách chi tiết sản phẩm nếu có.', 'Đã duyệt', now() at time zone 'utc', 'Quản trị hệ thống' from _nt;

insert into "VolumeEntries"("Id","BoqId","ContractId","Date","Period","DoneQty","AcceptedQty","Note","BatchId","UpdatedAt","UpdatedBy")
select lid, bid, cid, ngay, 'Đợt 1', acc::float8/val::float8, acc::float8/val::float8, null, vid, now() at time zone 'utc', 'Quản trị hệ thống' from _nt;

insert into "AuditLogs"("Id","Ts","Username","Fullname","Action","Module","Target","UpdatedAt","UpdatedBy")
select 'ntv-'||left(md5(random()::text),16), now() at time zone 'utc', 'admin', 'Quản trị hệ thống', 'Thêm mới', 'Quản trị hệ thống',
  'Sản phẩm và nghiệm thu tư vấn theo số đã thanh toán: '||count(*)||' hợp đồng, '||sum(acc)||' đồng', now() at time zone 'utc', 'Quản trị hệ thống'
from _nt having count(*)>0;

select 'hop dong tao nghiem thu' muc, count(*)::text sl from _nt
union all select 'tong gia tri nghiem thu', coalesce(sum(acc),0)::text from _nt
union all select 'nghiem thu du 100%', count(*) filter (where acc=val)::text from _nt;
commit;
