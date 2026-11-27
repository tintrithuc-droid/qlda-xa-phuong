-- Tri Thức (qlda_x_trithuc), 20/11/2026, rà soát lần cuối theo e-work trước khi vận hành (anh Trí yêu cầu).
-- 1) Gắn văn bản hợp đồng, phụ lục hợp đồng vào đúng hợp đồng của từng gói thầu (mục "Bản hợp đồng đã ký").
--    Tệp lấy từ hồ sơ pháp lý, bước tiến độ, hồ sơ thanh toán của chính gói đó; chỉ thêm liên kết, tệp gốc giữ nguyên chỗ cũ.
--    Chọn tệp: tên có HĐ/hợp đồng/PLHD, khớp số hợp đồng nếu có; bỏ hóa đơn, thư mời, biên bản thương thảo, dự thảo, bảo lãnh,
--    tệp của dịch vụ khác (giám sát/kiểm thử/QLDA...) hoặc của nhà thầu khác.
-- 2) Tệp hợp đồng đã gắn ở hợp đồng nhưng xếp loại "Hồ sơ gói thầu, hợp đồng" -> chuyển sang "Hợp đồng đã ký" để hiện ở trang gói thầu.
-- 3) Gỡ 1 tệp gắn nhầm: 0808_HD-Chinh-ly-tai-lieu.pdf (HĐ 0808 của DA049-TV03) đang nằm ở hợp đồng DA048-TV09 (xóa mềm, phục hồi được).
-- 4) DA051-TV03 (Tư vấn QLDA chuẩn bị đầu tư): e-work ghi đơn vị tư vấn là Tri Thức, gói chưa có nhà thầu -> điền.
-- Khớp theo mã dự án + mã gói + tên tệp (không dùng dung lượng, không dùng mã bản ghi); chạy lại không nhân đôi.
-- Bản 2: bỏ các liên kết sai đã đối chiếu nội dung (DA008-TV01/TV02, DA032-TV01, DA034-TV03, DA045-TV02, HD.pdf ở DA045, tệp Wi-Fi ở DA036-TV04, hóa đơn 20 ở DA051-TV01);
--   DA045-TV03, TV05 dùng bản ký HD__2026...; DA051-TV01 gắn 5-99_hd-lap-bcktkt_sh-2-snv.pdf.
begin;
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA012' AND a."FileName"='4-hd_loa-tttm.docx' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV01' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA012' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA033' AND a."FileName"='6-hd-lap-kh-thue.docx' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV02' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA033' AND k."Code"='TV02' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA033' AND a."FileName"='28-09-2026-hd-tu-van-lap-e-hsmt-ban-ky.pdf' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV05' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA033' AND k."Code"='TV05' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA034' AND a."FileName"='6-hd-lap-bcnckt.docx' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV02' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA034' AND k."Code"='TV02' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA034' AND a."FileName"='20-07-2026-hop-dong-dich-vu-tu-van-v1-ban-ky.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA034' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA034' AND a."FileName"='25-06-2026-hop-dong-dich-vu-tu-van-v1-ban-ky.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV05' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA034' AND k."Code"='TV05' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA036' AND a."FileName"='4-hd-ttra-bcnckt.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV01' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA036' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA036' AND a."FileName"='4-hd-td-hsmt-thai-duong-100826.doc' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV02' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA036' AND k."Code"='TV02' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA036' AND a."FileName"='hop-dong-giam-sat-loa.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV03' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA036' AND k."Code"='TV03' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA036' AND a."FileName"='7-hd-tv-lap-hsmt-loa-v1.doc' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA036' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA037' AND a."FileName"='HD.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV01' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA037' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
UPDATE "Attachments" SET "Kind"='Hợp đồng đã ký',"Ref"='Văn bản hợp đồng' WHERE "Collection"='contracts' AND "RecordId"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA040' AND k."Code"='TV01' LIMIT 1) AND "FileName"='113_hd-tham-tra-bcktkt_cltl-snnmt__20260527111638.pdf' AND "DeletedAt" IS NULL;
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA040' AND a."FileName"='PLHD_Dieu-chinh-Tham-tra-BCKTKT-SNNMT-12112025.docx' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV01' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA040' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
UPDATE "Attachments" SET "Kind"='Hợp đồng đã ký',"Ref"='Văn bản hợp đồng' WHERE "Collection"='contracts' AND "RecordId"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA040' AND k."Code"='TV02' LIMIT 1) AND "FileName"='112_hd-lap-bcktkt_cltl-snnmt__20260527111352.pdf' AND "DeletedAt" IS NULL;
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA040' AND a."FileName"='PLHD_Dieu-chinh-Lap-BCKTKT-SNNMT-12112025.docx' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV02' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA040' AND k."Code"='TV02' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA040' AND a."FileName"='02_hd-lap-hsmt_cltl-snnmt.pdf' AND a."Collection"='payments' AND a."DeletedAt" IS NULL AND k."Code"='TV03' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA040' AND k."Code"='TV03' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
UPDATE "Attachments" SET "Kind"='Hợp đồng đã ký',"Ref"='Văn bản hợp đồng' WHERE "Collection"='contracts' AND "RecordId"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA040' AND k."Code"='TV06' LIMIT 1) AND "FileName"='2101_hd-tham-dinh-hsmt_cltl-snnmt.pdf' AND "DeletedAt" IS NULL;
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA041' AND a."FileName"='5-37_hd_goithietbi_tanbinh.pdf' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV01' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA041' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA045' AND a."FileName"='4-hd_1012.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV01' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA045' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA045' AND a."FileName"='BINHDINH-HD-TV-LAP-BCKTKT-NONGLAM-5122024.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV03' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA045' AND k."Code"='TV03' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA045' AND a."FileName"='HD__20260528162744.pdf' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV03' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA045' AND k."Code"='TV03' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA045' AND a."FileName"='6-hd-lap-hsmt-cds365-dhnl.doc' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA045' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
UPDATE "Attachments" SET "Kind"='Hợp đồng đã ký',"Ref"='Phụ lục hợp đồng' WHERE "Collection"='contracts' AND "RecordId"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA045' AND k."Code"='TV05' LIMIT 1) AND "FileName"='7-plhd_thay-doi-thong-tin-hop-dong.docx' AND "DeletedAt" IS NULL;
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA045' AND a."FileName"='Phu-luc-dieu-chinh-HD.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV05' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA045' AND k."Code"='TV05' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA045' AND a."FileName"='HD__20260523140856.pdf' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV05' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA045' AND k."Code"='TV05' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
UPDATE "Attachments" SET "Kind"='Hợp đồng đã ký',"Ref"='Văn bản hợp đồng' WHERE "Collection"='contracts' AND "RecordId"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA045' AND k."Code"='TV06' LIMIT 1) AND "FileName"='hd-dhnl-lien-danh-itech-trithuc-25072025-trang-in.pdf' AND "DeletedAt" IS NULL;
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA045' AND a."FileName"='HD-thi-cong.pdf' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV06' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA045' AND k."Code"='TV06' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
UPDATE "Attachments" SET "Kind"='Hợp đồng đã ký',"Ref"='Văn bản hợp đồng' WHERE "Collection"='contracts' AND "RecordId"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA046' AND k."Code"='TV01' LIMIT 1) AND "FileName"='skhcn-hd-lap-hsmt-cds365-v2.doc' AND "DeletedAt" IS NULL;
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA046' AND a."FileName"='skhcn-hd-lap-hsmt-cds365-v3.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV01' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA046' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA047' AND a."FileName"='152_HD-Lap-HSMT_CLTL-2025.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV01' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA047' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
UPDATE "Attachments" SET "Kind"='Hợp đồng đã ký',"Ref"='Văn bản hợp đồng' WHERE "Collection"='contracts' AND "RecordId"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA047' AND k."Code"='TV02' LIMIT 1) AND "FileName"='3110_hd-chinh-ly-tai-lieu-2025-snv.pdf' AND "DeletedAt" IS NULL;
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA047' AND a."FileName"='plhd-thi-cong-de-an-chinh-ly-ct-cu.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV02' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA047' AND k."Code"='TV02' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA047' AND a."FileName"='0610_HD-Tham-dinh-HSMT_CLTL-2025.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV03' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA047' AND k."Code"='TV03' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA047' AND a."FileName"='1-plhd-thay-doi-thong-tin-cdt.docx' AND a."Collection"='schedule' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA047' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA047' AND a."FileName"='0-plhd_thay-doi-nguoi-dai-dien-chu-dau-tu.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA047' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA047' AND a."FileName"='160_HD-Quan-ly-du-an_CLTL-2025.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA047' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA048' AND a."FileName"='389_HD-Tham-dinh-gia_KLT.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV01' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA048' AND a."FileName"='59_hd-tham-tra-bcktkt_klt.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV02' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV02' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA048' AND a."FileName"='48_HD-lap-BCKTKT_KLT.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV03' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV03' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA048' AND a."FileName"='96_HD-Lap-HSMT_KLT.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA048' AND a."FileName"='139_HD-Giam-sat_KLT.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV05' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV05' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA048' AND a."FileName"='148_HD-Kiem-thu_KLT_002.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV06' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV06' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA048' AND a."FileName"='148_HD-Kiem-thu_KLT.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV06' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV06' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA048' AND a."FileName"='1706_HD-Tham-dinh-HSMT_KLT.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV07' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV07' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA048' AND a."FileName"='01_PL-dieu-chinh-QLDA_KLT.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV08' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV08' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA048' AND a."FileName"='6-hd-quan-ly-du-an_klt.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV08' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV08' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
UPDATE "Attachments" SET "DeletedAt"=now() at time zone 'utc',"DeletedBy"='Quản trị hệ thống (rà soát 20/11: tệp là HĐ 0808/HĐ/SNV.CT-LDCL của DA049-TV03)' WHERE "Collection"='contracts' AND "RecordId"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV09' LIMIT 1) AND "FileName"='0808_HD-Chinh-ly-tai-lieu.pdf' AND "DeletedAt" IS NULL;
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA048' AND a."FileName"='77_hd-trang-thiet-bi-luu-tru-snv-da-nen.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV09' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA048' AND k."Code"='TV09' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA049' AND a."FileName"='58_HD-Tham-tra-BCKTKT_CLTL.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV01' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA049' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA049' AND a."FileName"='50_HD-lap-BCKTKT_CLTLv1.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV02' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA049' AND k."Code"='TV02' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA049' AND a."FileName"='0808_HD-Chinh-ly-tai-lieu.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV03' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA049' AND k."Code"='TV03' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA049' AND a."FileName"='1006_HD-Tham-dinh-HSMT_CLTL.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA049' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA049' AND a."FileName"='135_HD-Giam-sat_CLTL.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV05' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA049' AND k."Code"='TV05' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA049' AND a."FileName"='29_hd-lap-hsmt_cltl-snv.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV06' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA049' AND k."Code"='TV06' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA049' AND a."FileName"='PLHD_thay-doi-thong-tin-hop-dong.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV07' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA049' AND k."Code"='TV07' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA049' AND a."FileName"='PLHD_thay-doi-phuong-thuc-thanh-toan.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV07' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA049' AND k."Code"='TV07' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA049' AND a."FileName"='79_HD-Quan-ly-du-an_CLTL.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV07' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA049' AND k."Code"='TV07' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
UPDATE "Attachments" SET "Kind"='Hợp đồng đã ký',"Ref"='Văn bản hợp đồng' WHERE "Collection"='contracts' AND "RecordId"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV01' LIMIT 1) AND "FileName"='2-06_hd-lap-bcktkt_so-hoa-ncc.pdf' AND "DeletedAt" IS NULL;
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='06_HD-Lap-BCKTKT_So-hoa-NCC.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV01' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='374_HD-Tham-dinh-gia_So-hoa-NCC.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV02' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV02' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='4_HD-Tham-tra-BCKTKT_So-hoa-NCC.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV03' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV03' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='PLHD_thay-doi-phuong-thuc-thanh-toan-v2.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='24_HD-Kiem-thu-PM_So-hoa-NCC.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='3005_HD-Tham-dinh-HSMT_So-hoa-NCC.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV05' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV05' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='236-01_plhd-so-hoa-ncc-snv.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV06' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV06' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='236-hop-dong-thi-cong.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV06' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV06' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='PLHD_thay-doi-thong-tin-chu-dau-tu-QLDA-TRITHUC.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV07' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV07' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='PLHD_thay-doi-phuong-thuc-thanh-toan-v2.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV07' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV07' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='01_PLHD-Quan-ly-du-an_So-hoa-NCC.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV07' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV07' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='6_HD-Quan-ly-du-an_So-hoa-NCC.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV07' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV07' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='78_HD-Lap-HSMT_So-hoa-NCC.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV08' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV08' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='01_PLHD-Giam-sat_So-hoa-NCC.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV09' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV09' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='PLHD_thay-doi-thong-tin-hop-dong_Giamsat-v1.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV09' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV09' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='02_PLHD_thay-doi-thong-tin-hop-dong_Giamsat-v1.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV09' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV09' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='PLHD_thay-doi-thong-tin-hop-dong.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV09' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV09' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA050' AND a."FileName"='HD-Giam-sat-thi-cong_So-hoa-NCC.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV09' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA050' AND k."Code"='TV09' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='5-99_hd-lap-bcktkt_sh-2-snv.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV01' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='5-2412_hd-tham-tra-bcktkt_sh-d2-snv.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV02' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV02' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='PLHD.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='0-1-plhd_thay-doi-chuc-vu-nguoi-dai-dien-cdt-280425.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='04_HD-TV-Giam-sat_SH-GD2.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV04' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV04' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
UPDATE "Attachments" SET "Kind"='Hợp đồng đã ký',"Ref"='Văn bản hợp đồng' WHERE "Collection"='contracts' AND "RecordId"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV05' LIMIT 1) AND "FileName"='259_HD-QLDA_SH-d2.pdf' AND "DeletedAt" IS NULL;
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='PL01-Thay-doi-thong-tin-CDT_SH-d2.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV05' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV05' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='0-plhd_thay-doi-nguoi-dai-dien-chu-dau-tu-23-6.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV05' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV05' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='PLHD_thay-doi-thong-tin-chu-dau-tu-QLDA-TRITHUC.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV05' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV05' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='5-259_hd-qlda_sh-d2.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV05' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV05' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='45-01_PLHD-So-hoa-GD2_001.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV06' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV06' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='10-9-plhd-thi-cong-lso-hoa-_-gd2.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV06' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV06' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='45_hd-so-hoa-gd2-snv.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV06' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV06' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='6-03_hd-tham-dinh-hsmt_sh-d2-snv.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV07' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV07' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Phụ lục hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='0-plhd_thay-doi-nguoi-dai-dien-chu-dau-tu-090425.docx' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV08' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV08' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);
INSERT INTO "Attachments" ("Id","Collection","RecordId","ProjectId","Kind","Ref","FileId","FileName","ContentType","Size","UploadedBy","UploadedAt")
 SELECT 'att-'||substr(md5(random()::text||clock_timestamp()::text),1,20),'contracts',t."Id",t."ProjectId",'Hợp đồng đã ký','Văn bản hợp đồng',a."FileId",a."FileName",a."ContentType",a."Size",'Quản trị hệ thống',now() at time zone 'utc'
 FROM "Contracts" t, LATERAL (SELECT a.* FROM "Attachments" a JOIN "Projects" p ON p."Id"=a."ProjectId"
   LEFT JOIN "LegalDocuments" l ON a."Collection"='legal' AND l."Id"=a."RecordId" LEFT JOIN "ScheduleItems" s ON a."Collection"='schedule' AND s."Id"=a."RecordId"
   LEFT JOIN "Payments" pm ON a."Collection"='payments' AND pm."Id"=a."RecordId" LEFT JOIN "Contracts" c2 ON c2."Id"=pm."ContractId"
   LEFT JOIN "Contracts" c3 ON a."Collection"='contracts' AND c3."Id"=a."RecordId"
   LEFT JOIN "Packages" k ON k."Id"=coalesce(l."PackageId",s."PackageId",c2."PackageId",c3."PackageId")
   WHERE p."Code"='DA051' AND a."FileName"='6-15_hd-lap-hsmt_sh-d2-snv.pdf' AND a."Collection"='legal' AND a."DeletedAt" IS NULL AND k."Code"='TV08' ORDER BY a."UploadedAt" LIMIT 1) a
 WHERE t."Id"=(SELECT c."Id" FROM "Contracts" c JOIN "Packages" k ON k."Id"=c."PackageId" JOIN "Projects" p ON p."Id"=c."ProjectId" WHERE p."Code"='DA051' AND k."Code"='TV08' LIMIT 1) AND NOT EXISTS (SELECT 1 FROM "Attachments" x WHERE x."Collection"='contracts' AND x."RecordId"=t."Id" AND x."FileId"=a."FileId" AND x."DeletedAt" IS NULL);

UPDATE "Packages" k SET "ContractorIds"=jsonb_build_array(o."Id")::text, "UpdatedAt"=now() at time zone 'utc', "UpdatedBy"='Quản trị hệ thống'
 FROM "Projects" p, (SELECT "Id" FROM "Organizations" WHERE "Name"='Công ty Cổ phần Tin học Tri Thức' ORDER BY "Member" DESC NULLS LAST LIMIT 1) o
 WHERE p."Id"=k."ProjectId" AND p."Code"='DA051' AND k."Code"='TV03' AND coalesce(k."ContractorIds",'[]') IN ('','[]');

INSERT INTO "AuditLogs"("Id","Ts","Username","Fullname","Action","Module","Target","UpdatedAt","UpdatedBy")
VALUES ('rsc-'||left(md5(random()::text),16), now() at time zone 'utc', 'admin', 'Quản trị hệ thống', 'Cập nhật', 'Gói thầu, hợp đồng',
  'Rà soát theo e-work: gắn văn bản hợp đồng, phụ lục vào hợp đồng của các gói thầu; gỡ 1 tệp gắn nhầm; điền nhà thầu DA051-TV03', now() at time zone 'utc', 'Quản trị hệ thống');

select 'hop dong co ban HD da ky' k, count(distinct "RecordId") v from "Attachments" where "Collection"='contracts' and "Kind"='Hợp đồng đã ký' and "DeletedAt" is null
union all select 'tep ban HD da ky', count(*) from "Attachments" where "Collection"='contracts' and "Kind"='Hợp đồng đã ký' and "DeletedAt" is null
union all select 'tong hop dong', count(*) from "Contracts";
commit;
