-- Bản 1.8.6, dữ liệu riêng của trithuc (anh Trí duyệt 20/11/2026):
--  1. Đơn vị dùng lĩnh vực dự án CNTT, chuyển đổi số, đổi mới sáng tạo (như khi Quản trị chọn trong Thông tin đơn vị).
--  2. Danh mục mặc định cho dự án CNTT: thêm giá trị còn thiếu, xếp lại thứ tự; giá trị chỉ dùng cho xây dựng
--     bị bỏ nếu chưa bản ghi nào dùng, giá trị đang dùng giữ lại ở cuối danh sách.
--  3. Dự án đã hoàn thành (Hoàn thành, Đã bàn giao đưa vào sử dụng, Đang quyết toán, Đã quyết toán):
--     đầu việc tiến độ chưa đủ để 100%, công việc chưa xong chuyển Hoàn thành.
-- Chạy lại nhiều lần không đổi thêm gì. Chạy sau khi máy chủ đã lên 1.8.6 (cần cột Projects.Field).
\set ON_ERROR_STOP on
begin;

-- 1. Lĩnh vực dự án của đơn vị
insert into "Settings"("Key","Value","UpdatedAt","UpdatedBy") values ('branding','{"field":"cntt"}', now() at time zone 'utc', 'Quản trị hệ thống')
on conflict ("Key") do update set "Value"=(coalesce(nullif("Settings"."Value",''),'{}')::jsonb || '{"field":"cntt"}')::text, "UpdatedAt"=now() at time zone 'utc'
where coalesce(("Settings"."Value"::jsonb)->>'field','')<>'cntt';

-- 2. Danh mục mặc định cho dự án CNTT
create temp table _cat(type text, value text, ord int) on commit drop;
insert into _cat values
 ('Loại dự án','Đầu tư ứng dụng CNTT',1),('Loại dự án','Thuê dịch vụ CNTT',2),('Loại dự án','Mua sắm thiết bị, phần mềm',3),('Loại dự án','Nhiệm vụ chuyển đổi số',4),('Loại dự án','Nhiệm vụ KH&CN, đổi mới sáng tạo',5),('Loại dự án','Nhiệm vụ khác',6),
 ('Lĩnh vực','Chuyển đổi số',1),('Lĩnh vực','Ứng dụng CNTT',2),('Lĩnh vực','Chính quyền số',3),('Lĩnh vực','Dữ liệu, CSDL',4),('Lĩnh vực','An toàn thông tin',5),('Lĩnh vực','Đổi mới sáng tạo',6),('Lĩnh vực','Khoa học và công nghệ',7),
 ('Trạng thái dự án','Chuẩn bị đầu tư',1),('Trạng thái dự án','Đang lựa chọn nhà thầu',2),('Trạng thái dự án','Đang triển khai',3),('Trạng thái dự án','Đang thực hiện',4),('Trạng thái dự án','Tạm dừng',5),('Trạng thái dự án','Hoàn thành',6),('Trạng thái dự án','Đã bàn giao đưa vào sử dụng',7),('Trạng thái dự án','Đang quyết toán',8),('Trạng thái dự án','Đã quyết toán',9),
 ('Hồ sơ dự án','Báo cáo nghiên cứu khả thi',1),('Hồ sơ dự án','Báo cáo kinh tế - kỹ thuật',2),('Hồ sơ dự án','Đề cương và dự toán chi tiết',3),('Hồ sơ dự án','Không yêu cầu (mua sắm, nhiệm vụ)',4),
 ('Loại gói thầu','Tư vấn',1),('Loại gói thầu','Phi tư vấn',2),('Loại gói thầu','Thuê dịch vụ CNTT',3),('Loại gói thầu','Mua sắm hàng hóa, thiết bị CNTT',4),('Loại gói thầu','Phần mềm',5),('Loại gói thầu','Hỗn hợp',6),
 ('Loại nghiệm thu, bàn giao','Nghiệm thu giai đoạn triển khai',1),('Loại nghiệm thu, bàn giao','Vận hành thử',2),('Loại nghiệm thu, bàn giao','Nghiệm thu hoàn thành',3),('Loại nghiệm thu, bàn giao','Bàn giao đưa vào sử dụng',4),
 ('Đơn vị tính','Gói',1),('Đơn vị tính','Bộ',2),('Đơn vị tính','Hệ thống',3),('Đơn vị tính','Bản quyền',4),('Đơn vị tính','Người dùng',5),('Đơn vị tính','Tháng',6),('Đơn vị tính','Năm',7),('Đơn vị tính','Ngày công',8),('Đơn vị tính','Trang',9),('Đơn vị tính','Hồ sơ',10),('Đơn vị tính','Cái',11);

-- giá trị đang dùng trong dữ liệu theo từng loại danh mục
create temp table _used(type text, value text) on commit drop;
insert into _used select distinct 'Loại dự án', "ProjectKind" from "Projects" where coalesce("ProjectKind",'')<>''
 union select distinct 'Lĩnh vực', "Field" from "Projects" where coalesce("Field",'')<>''
 union select distinct 'Trạng thái dự án', "Status" from "Projects" where coalesce("Status",'')<>''
 union select distinct 'Hồ sơ dự án', "ReportType" from "Projects" where coalesce("ReportType",'')<>''
 union select distinct 'Loại gói thầu', "Type" from "Packages" where coalesce("Type",'')<>''
 union select distinct 'Loại nghiệm thu, bàn giao', "Kind" from "Acceptances" where coalesce("Kind",'')<>''
 union select distinct 'Đơn vị tính', "Unit" from "BoqItems" where coalesce("Unit",'')<>'';

create temp table _ra(n text, c int) on commit drop;
with d as (delete from "Catalogs" c where c."Type" in (select distinct type from _cat)
   and not exists (select 1 from _cat x where x.type=c."Type" and x.value=c."Value")
   and not exists (select 1 from _used u where u.type=c."Type" and u.value=c."Value") returning 1)
insert into _ra select 'danh muc bo (khong dung)', count(*) from d;
with i as (insert into "Catalogs"("Id","Type","Value","Order","UpdatedAt","UpdatedBy")
   select 'cntt-'||left(md5(x.type||'|'||x.value),16), x.type, x.value, x.ord, now() at time zone 'utc', 'Quản trị hệ thống' from _cat x
   where not exists (select 1 from "Catalogs" c where c."Type"=x.type and c."Value"=x.value) returning 1)
insert into _ra select 'danh muc them', count(*) from i;
update "Catalogs" c set "Order"=x.ord from _cat x where x.type=c."Type" and x.value=c."Value" and c."Order"<>x.ord;
-- giá trị cũ còn dùng: xếp sau danh sách CNTT
update "Catalogs" c set "Order"=r.o from (
  select c2."Id", (select max(ord) from _cat x where x.type=c2."Type") + row_number() over (partition by c2."Type" order by c2."Order", c2."Value") o
  from "Catalogs" c2 where c2."Type" in (select distinct type from _cat) and not exists (select 1 from _cat x where x.type=c2."Type" and x.value=c2."Value")) r
where r."Id"=c."Id" and c."Order"<>r.o;

-- 3. Dự án đã hoàn thành: tiến độ 100%, công việc hoàn thành
create temp table _done on commit drop as select "Id" from "Projects" where "Status" in ('Hoàn thành','Đã bàn giao đưa vào sử dụng','Đang quyết toán','Đã quyết toán');
with s as (update "ScheduleItems" s set "Progress"=100,
     "ActualStart"=coalesce(s."ActualStart", s."PlanStart"), "ActualEnd"=coalesce(s."ActualEnd", s."PlanEnd", s."PlanStart"),
     "History"=(coalesce(nullif(s."History",''),'[]')::jsonb || jsonb_build_array(jsonb_build_object('date', to_char(coalesce(s."ActualEnd", s."PlanEnd", current_date),'YYYY-MM-DD'), 'progress',100, 'note','Dự án đã hoàn thành', 'by','Quản trị hệ thống')))::text,
     "UpdatedAt"=now() at time zone 'utc', "UpdatedBy"='Quản trị hệ thống'
   where s."ProjectId" in (select "Id" from _done) and coalesce(s."Progress",0)<100 returning 1)
insert into _ra select 'dau viec tien do len 100%', count(*) from s;
with t as (update "ProjectTasks" t set "Status"='Hoàn thành', "DoneDate"=coalesce(t."DoneDate", least(coalesce(t."Due", current_date), current_date)),
     "UpdatedAt"=now() at time zone 'utc', "UpdatedBy"='Quản trị hệ thống'
   where t."ProjectId" in (select "Id" from _done) and coalesce(t."Status",'')<>'Hoàn thành' returning 1)
insert into _ra select 'cong viec chuyen Hoan thanh', count(*) from t;

insert into "AuditLogs"("Id","Ts","Username","Fullname","Action","Module","Target","UpdatedAt","UpdatedBy")
select 'cntt-'||left(md5(random()::text),16), now() at time zone 'utc', 'admin', 'Quản trị hệ thống', 'Cập nhật dữ liệu', 'Quản trị hệ thống',
  'Lĩnh vực CNTT, danh mục mặc định, tiến độ dự án đã hoàn thành: '||string_agg(n||' '||c, '; '), now() at time zone 'utc', 'Quản trị hệ thống'
from _ra where c>0 having count(*)>0;

select n, c from _ra order by n;
select 'linh vuc', ("Value"::jsonb)->>'field' from "Settings" where "Key"='branding';
select 'du an hoan thanh con dau viec <100%', count(*) from "ScheduleItems" where "ProjectId" in (select "Id" from _done) and coalesce("Progress",0)<100;
select 'du an hoan thanh con cong viec chua xong', count(*) from "ProjectTasks" where "ProjectId" in (select "Id" from _done) and coalesce("Status",'')<>'Hoàn thành';
commit;
