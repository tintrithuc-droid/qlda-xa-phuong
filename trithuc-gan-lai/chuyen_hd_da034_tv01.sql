-- Tri Thức (qlda_x_trithuc), 20/11/2026, anh Trí duyệt ("Chuyển nhé"): tệp 14-04-2026-hop-dong-dich-vu-tu-van-v1-ban-ky*.pdf
-- đang ở hồ sơ pháp lý dự án DA032 nhưng là HĐ 1404.TTBCKTKT/HĐDVTV/SKHCN-TD của DA034-TV01 -> chuyển sang mục Bản hợp đồng đã ký của DA034-TV01.
begin;
do $$ begin
  if (select count(*) from "Contracts" c join "Packages" k on k."Id"=c."PackageId" join "Projects" p on p."Id"=c."ProjectId" where p."Code"='DA034' and k."Code"='TV01')<>1
  then raise exception 'Không thấy đúng 1 hợp đồng DA034-TV01'; end if; end $$;
select a."Id", a."Collection", a."FileName", l."Type", l."Title" from "Attachments" a join "Projects" p on p."Id"=a."ProjectId"
  left join "LegalDocuments" l on a."Collection"='legal' and l."Id"=a."RecordId"
  where p."Code"='DA032' and a."FileName" like '14-04-2026-hop-dong-dich-vu-tu-van-v1-ban-ky%' and a."DeletedAt" is null;
update "Attachments" a set "Collection"='contracts', "RecordId"=t."Id", "ProjectId"=t."ProjectId", "Kind"='Hợp đồng đã ký', "Ref"='Văn bản hợp đồng'
  from (select c."Id", c."ProjectId" from "Contracts" c join "Packages" k on k."Id"=c."PackageId" join "Projects" p on p."Id"=c."ProjectId" where p."Code"='DA034' and k."Code"='TV01') t,
       "Projects" p0
  where p0."Id"=a."ProjectId" and p0."Code"='DA032' and a."Collection"='legal' and a."FileName" like '14-04-2026-hop-dong-dich-vu-tu-van-v1-ban-ky%' and a."DeletedAt" is null;
insert into "AuditLogs"("Id","Ts","Username","Fullname","Action","Module","Target","UpdatedAt","UpdatedBy")
values ('rsc-'||left(md5(random()::text),16), now() at time zone 'utc', 'admin', 'Quản trị hệ thống', 'Cập nhật', 'Gói thầu, hợp đồng',
  'Chuyển tệp HĐ 1404.TTBCKTKT (14-04-2026-hop-dong...ban-ky) từ hồ sơ pháp lý DA032 sang hợp đồng DA034-TV01', now() at time zone 'utc', 'Quản trị hệ thống');
select 'tep o DA034-TV01' k, count(*) from "Attachments" a join "Contracts" c on c."Id"=a."RecordId" join "Packages" k on k."Id"=c."PackageId" join "Projects" p on p."Id"=c."ProjectId"
  where a."Collection"='contracts' and a."Kind"='Hợp đồng đã ký' and a."DeletedAt" is null and p."Code"='DA034' and k."Code"='TV01';
commit;
