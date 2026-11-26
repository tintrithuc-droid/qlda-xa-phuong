-- Tri Thức (qlda_x_trithuc), 20/11/2026, anh Trí chọn "Ban GĐ kiểm tra thay tạm": nhóm Kế toán chưa có tài khoản,
-- nên thêm nhóm Ban Giám đốc (g-lead) vào bước "Kế toán kiểm tra" của hồ sơ thanh toán và phụ lục hợp đồng.
-- Khi đã có tài khoản kế toán: bỏ g-lead khỏi bước này ở Trình duyệt hồ sơ > Thiết lập quy trình (hoặc chạy lại quy_trinh_mau_trithuc.sql).
-- Chỉ đổi bảng Settings (khóa workflow.xa); chạy lại không thêm trùng.
begin;
with cur as (select "Value"::jsonb c from "Settings" where "Key"='workflow.xa'),
fx as (select k, (select jsonb_agg(case when st->>'key'='ketoan' and not (st->'groups' ? 'g-lead') then jsonb_set(st,'{groups}',(st->'groups')||'["g-lead"]'::jsonb) else st end order by i)
                  from jsonb_array_elements(cur.c->'flows'->k->'steps') with ordinality t(st,i)) steps
       from cur, unnest(array['payments','addenda']) k),
nv as (select jsonb_set(jsonb_set(cur.c, '{flows,payments,steps}', (select steps from fx where k='payments')), '{flows,addenda,steps}', (select steps from fx where k='addenda')) v from cur)
update "Settings" set "Value"=nv.v::text, "UpdatedAt"=now() at time zone 'utc', "UpdatedBy"='Quản trị hệ thống' from nv where "Key"='workflow.xa';
insert into "AuditLogs"("Id","Ts","Username","Fullname","Action","Module","Target","UpdatedAt","UpdatedBy")
values ('wfk-'||left(md5(random()::text),16), now() at time zone 'utc', 'admin', 'Quản trị hệ thống', 'Cập nhật', 'Quy trình duyệt',
  'Bước Kế toán kiểm tra (thanh toán, phụ lục): Ban Giám đốc xử lý thay tạm khi chưa có tài khoản kế toán', now() at time zone 'utc', 'Quản trị hệ thống');
select k, (select string_agg((st->>'label')||' '||(st->'groups')::text, ' -> ') from jsonb_array_elements(v->'flows'->k->'steps') st) buoc
from "Settings", lateral (select "Value"::jsonb v) x, unnest(array['payments','addenda']) k where "Key"='workflow.xa';
commit;
