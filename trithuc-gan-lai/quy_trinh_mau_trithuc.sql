-- Tri Thức (qlda_x_trithuc), 20/11/2026, anh Trí duyệt (đề xuất lưu vết, mục F): quy trình duyệt mẫu cho công ty tư vấn.
--   Hồ sơ thanh toán:          Cán bộ lập -> Kế toán kiểm tra (2 ngày làm việc) -> Ban Giám đốc duyệt (2 ngày)
--   Đợt nghiệm thu sản phẩm:   Cán bộ lập -> Ban Giám đốc duyệt (2 ngày)
--   Phụ lục hợp đồng:          Cán bộ lập -> Kế toán kiểm tra (2 ngày) -> Ban Giám đốc duyệt (2 ngày)
-- Thay quy trình 1 bước đang có (g-lead, g-tech duyệt) của 3 loại này; nghiệm thu bàn giao, kế hoạch tiến độ giữ nguyên.
-- Nhắc trước hạn 1 ngày; bước Kế toán trễ 2 ngày thì báo Ban Giám đốc. Ngày nghỉ lễ 2027 có ngày cố định (Tết Nguyên đán, Giỗ Tổ quản trị bổ sung khi có thông báo).
-- Chỉ đổi thiết lập quy trình (bảng Settings, khóa workflow.xa); hồ sơ đã duyệt, đã thanh toán giữ nguyên. Các loại hồ sơ khác giữ thiết lập đang có.
begin;
do $$ begin
  if not exists(select 1 from "UserGroups" where "Id"='g-acc' or "Name"='Kế toán') or not exists(select 1 from "UserGroups" where "Id"='g-lead' or "Name" in ('Ban Giám đốc','Lãnh đạo Ban')) then
    raise exception 'Không thấy nhóm Kế toán hoặc Ban Giám đốc'; end if; end $$;
-- Nhóm theo mã cố định (g-acc Kế toán, g-lead Ban Giám đốc; tên nhóm có thể đã đổi), không có mã thì tìm theo tên
with g as (select (select "Id" from "UserGroups" where "Id"='g-acc' or "Name"='Kế toán' order by ("Id"='g-acc') desc limit 1) kt,
                  (select "Id" from "UserGroups" where "Id"='g-lead' or "Name" in ('Ban Giám đốc','Lãnh đạo Ban') order by ("Id"='g-lead') desc limit 1) ld),
cur as (select coalesce((select "Value"::jsonb from "Settings" where "Key"='workflow.xa'), '{"flows":{},"projects":{},"assignedOnly":true,"noSelfReview":true}'::jsonb) v),
st as (select
  jsonb_build_object('key','ketoan','label','Kế toán kiểm tra','verb','Kiểm tra đạt','groups',jsonb_build_array(g.kt),'users','[]'::jsonb,'returnTo','author',
    'dueDays',2,'remindDays',1,'escalateDays',2,'escalateGroups',jsonb_build_array(g.ld),'escalateUsers','[]'::jsonb,'noteRequired',false) kt,
  jsonb_build_object('key','approve','label','Ban Giám đốc duyệt','verb','Duyệt','groups',jsonb_build_array(g.ld),'users','[]'::jsonb,'returnTo','author',
    'dueDays',2,'remindDays',1,'escalateDays',0,'escalateGroups','[]'::jsonb,'escalateUsers','[]'::jsonb,'noteRequired',false) ld
  from g),
nv as (select jsonb_set(jsonb_set(jsonb_set(jsonb_set(cur.v,
    '{flows,payments}', jsonb_build_object('enabled',true,'steps',jsonb_build_array(st.kt, st.ld))),
    '{flows,vbatches}', jsonb_build_object('enabled',true,'steps',jsonb_build_array(st.ld))),
    '{flows,addenda}',  jsonb_build_object('enabled',true,'steps',jsonb_build_array(st.kt, st.ld))),
    '{holidays}', (select to_jsonb(array(select distinct h from unnest(array(select jsonb_array_elements_text(coalesce(cur.v->'holidays','[]'::jsonb)))
      || array['2027-01-01','2027-04-30','2027-05-01','2027-09-02']) h order by h)))) v
  from cur, st)
insert into "Settings"("Key","Value","UpdatedAt","UpdatedBy") select 'workflow.xa', nv.v::text, now() at time zone 'utc', 'Quản trị hệ thống' from nv
on conflict ("Key") do update set "Value"=excluded."Value", "UpdatedAt"=excluded."UpdatedAt", "UpdatedBy"=excluded."UpdatedBy";

insert into "AuditLogs"("Id","Ts","Username","Fullname","Action","Module","Target","UpdatedAt","UpdatedBy")
values ('wfm-'||left(md5(random()::text),16), now() at time zone 'utc', 'admin', 'Quản trị hệ thống', 'Cập nhật', 'Quy trình duyệt',
  'Quy trình mẫu Tri Thức: thanh toán, phụ lục (Kế toán kiểm tra, Ban Giám đốc duyệt); đợt nghiệm thu (Ban Giám đốc duyệt)', now() at time zone 'utc', 'Quản trị hệ thống');

select k, v->'flows'->k->>'enabled' bat, jsonb_array_length(v->'flows'->k->'steps') so_buoc from "Settings", lateral (select "Value"::jsonb v) x, unnest(array['payments','vbatches','addenda']) k where "Key"='workflow.xa';
commit;
