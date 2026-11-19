-- Bản 1.8.3, riêng xã trithuc: lập danh mục nhà thầu từ hợp đồng, đánh dấu 4 đơn vị thành viên hệ sinh thái,
-- gắn nhà thầu cho gói thầu; gói liên danh gắn các thành viên theo hồ sơ hợp đồng, QĐ phê duyệt KQLCNT.
-- Chạy lại nhiều lần vẫn cho cùng kết quả (không tạo trùng, không ghi đè gói đã chọn nhà thầu).
BEGIN;
CREATE TEMP TABLE nt_moi(ten text, viet_tat text, mst text, dia_chi text, dai_dien text, chuc_vu text, thanh_vien bool) ON COMMIT DROP;
-- 1) Nhà thầu làm riêng: lấy theo tên trên hợp đồng (bỏ tên liên danh)
INSERT INTO nt_moi(ten, thanh_vien)
SELECT DISTINCT ON (lower(regexp_replace(btrim("Contractor"),'\s+',' ','g'))) regexp_replace(btrim("Contractor"),'\s+',' ','g'), false
FROM "Contracts" WHERE coalesce(btrim("Contractor"),'')<>'' AND "Contractor" !~* '^\s*liên\s+danh'
ORDER BY lower(regexp_replace(btrim("Contractor"),'\s+',' ','g')), 1;
-- 2) Thành viên các liên danh (theo tệp hợp đồng, QĐ phê duyệt KQLCNT, hóa đơn trên kho tệp)
INSERT INTO nt_moi VALUES
 ('Công ty TNHH Tích hợp Hệ thống ITECH','ITECH','0313165962','03 đường số 16 KDC Hương Lộ 5, phường An Lạc, TP. Hồ Chí Minh','Nguyễn Thành Lộc','Tổng Giám đốc',false),
 ('Công ty Cổ phần Công nghệ Lưu trữ - Số hóa HT','HT','0103916764',null,null,null,false),
 ('Công ty Cổ phần Lưu trữ An Hưng','An Hưng',null,'Số 30 ngõ 42 phố Yên Hòa, Hà Nội',null,null,false),
 ('Công ty Cổ phần Công nghệ Cyber Eye','Cyber Eye',null,null,null,null,false),
 ('Công ty Cổ phần Phát triển Công nghệ Hành chính','ADDJ','0106019307',null,null,null,false),
 ('Công ty Cổ phần Kỹ thuật chất lượng cao Tây Hồ','Tây Hồ',null,null,null,null,false),
 ('Công ty Cổ phần Công nghệ Phần mềm và Nội dung số OSP','OSP',null,null,null,null,false),
 ('Trung tâm Lưu trữ quốc gia II','TTLTQG II',null,null,null,null,false),
 ('Công ty Công nghệ số Vạn Xuân','Vạn Xuân',null,null,null,null,false);
INSERT INTO "Organizations" ("Id","Kind","Name","ShortName","TaxCode","Address","Representative","RepTitle","Active","Member","UpdatedAt","UpdatedBy")
SELECT 'dk-nt-'||substr(md5(lower(ten)),1,16), 'nt', ten, viet_tat, mst, dia_chi, dai_dien, chuc_vu, true, false, now(), 'admin' FROM nt_moi t
WHERE NOT EXISTS (SELECT 1 FROM "Organizations" o WHERE o."Kind"='nt' AND lower(regexp_replace(btrim(o."Name"),'\s+',' ','g'))=lower(t.ten));
-- 3) Đơn vị thành viên hệ sinh thái; bổ sung MST, địa chỉ Tri Thức theo hợp đồng liên danh Itech - Tri Thức (chỉ điền ô đang trống)
UPDATE "Organizations" o SET "Member"=true, "ShortName"=coalesce(nullif(o."ShortName",''),m.s), "UpdatedAt"=now(), "UpdatedBy"='admin'
FROM (VALUES ('công ty cổ phần tin học tri thức','Tri Thức'),('công ty tnhh chuyển đổi số 365','CDS365'),
             ('công ty tnhh tin học thái dương','Thái Dương'),('công ty tnhh công nghệ tin học bình định','Bình Định')) m(k,s)
WHERE o."Kind"='nt' AND lower(regexp_replace(btrim(o."Name"),'\s+',' ','g'))=m.k AND NOT o."Member";
UPDATE "Organizations" SET "TaxCode"=coalesce(nullif("TaxCode",''),'0304363608'), "Address"=coalesce(nullif("Address",''),'An Phú Plaza, 117-119 Lý Chính Thắng, phường Xuân Hòa, TP. Hồ Chí Minh'),
  "Representative"=coalesce(nullif("Representative",''),'Đỗ Cao Trí'), "RepTitle"=coalesce(nullif("RepTitle",''),'Giám đốc')
WHERE "Kind"='nt' AND lower("Name")='công ty cổ phần tin học tri thức' AND coalesce("TaxCode",'')='';
-- 4) Gói liên danh: thành viên (đứng đầu trước), tên liên danh lấy theo hợp đồng
CREATE TEMP TABLE ld(da text, goi text, tv text[]) ON COMMIT DROP;
INSERT INTO ld VALUES
 ('DA045','TV06',ARRAY['Công ty TNHH Tích hợp Hệ thống ITECH','Công ty Cổ phần Tin học Tri Thức']),
 ('DA049','TV03',ARRAY['Công ty Cổ phần Công nghệ Lưu trữ - Số hóa HT','Công ty Cổ phần Lưu trữ An Hưng']),
 ('DA050','TV06',ARRAY['Công ty Cổ phần Công nghệ Lưu trữ - Số hóa HT','Công ty Cổ phần Công nghệ Cyber Eye']),
 ('DA051','TV06',ARRAY['Công ty Cổ phần Phát triển Công nghệ Hành chính','Công ty Cổ phần Công nghệ Lưu trữ - Số hóa HT']),
 ('DA048','TV09',ARRAY['Công ty Cổ phần Kỹ thuật chất lượng cao Tây Hồ','Công ty Cổ phần Công nghệ Phần mềm và Nội dung số OSP']),
 ('DA047','TV02',ARRAY['Công ty Cổ phần Lưu trữ An Hưng','Trung tâm Lưu trữ quốc gia II','Công ty Công nghệ số Vạn Xuân']);
UPDATE "Packages" p SET
  "ContractorIds"=(SELECT json_agg(o."Id" ORDER BY x.n)::text FROM unnest(ld.tv) WITH ORDINALITY x(ten,n) JOIN "Organizations" o ON o."Kind"='nt' AND lower(o."Name")=lower(x.ten)),
  "JointVenture"=(SELECT regexp_replace(btrim(c."Contractor"),'\s+',' ','g') FROM "Contracts" c WHERE c."PackageId"=p."Id" LIMIT 1),
  "UpdatedAt"=now(), "UpdatedBy"='admin'
FROM ld JOIN "Projects" pr ON pr."Code"=ld.da
WHERE p."ProjectId"=pr."Id" AND p."Code"=ld.goi AND coalesce(p."ContractorIds",'[]') IN ('[]','');
-- 4b) Tỷ lệ liên danh theo hồ sơ (hợp đồng, biên bản thương thảo, biên bản nghiệm thu)
CREATE TEMP TABLE tl(da text, goi text, ten text, tl numeric) ON COMMIT DROP;
INSERT INTO tl VALUES
 ('DA045','TV06','Công ty TNHH Tích hợp Hệ thống ITECH',41.8),('DA045','TV06','Công ty Cổ phần Tin học Tri Thức',58.2),
 ('DA049','TV03','Công ty Cổ phần Công nghệ Lưu trữ - Số hóa HT',80),('DA049','TV03','Công ty Cổ phần Lưu trữ An Hưng',20),
 ('DA050','TV06','Công ty Cổ phần Công nghệ Lưu trữ - Số hóa HT',69.3),('DA050','TV06','Công ty Cổ phần Công nghệ Cyber Eye',30.7),
 ('DA051','TV06','Công ty Cổ phần Phát triển Công nghệ Hành chính',70),('DA051','TV06','Công ty Cổ phần Công nghệ Lưu trữ - Số hóa HT',30),
 ('DA048','TV09','Công ty Cổ phần Kỹ thuật chất lượng cao Tây Hồ',75.56),('DA048','TV09','Công ty Cổ phần Công nghệ Phần mềm và Nội dung số OSP',24.44),
 ('DA047','TV02','Công ty Cổ phần Lưu trữ An Hưng',40),('DA047','TV02','Trung tâm Lưu trữ quốc gia II',30),('DA047','TV02','Công ty Công nghệ số Vạn Xuân',30);
UPDATE "Packages" p SET "ContractorShares"=(SELECT json_object_agg(o."Id", tl.tl)::text FROM tl JOIN "Organizations" o ON o."Kind"='nt' AND lower(o."Name")=lower(tl.ten) WHERE tl.da=pr."Code" AND tl.goi=p."Code"),
  "UpdatedAt"=now(), "UpdatedBy"='admin'
FROM "Projects" pr WHERE p."ProjectId"=pr."Id" AND EXISTS (SELECT 1 FROM tl WHERE tl.da=pr."Code" AND tl.goi=p."Code") AND coalesce(p."ContractorShares",'') IN ('','{}');
-- 5) Gói làm riêng chưa chọn nhà thầu mà mọi hợp đồng của gói cùng một nhà thầu: chọn nhà thầu đó
UPDATE "Packages" p SET "ContractorIds"='["'||o."Id"||'"]', "UpdatedAt"=now(), "UpdatedBy"='admin'
FROM (SELECT "PackageId", min(lower(regexp_replace(btrim("Contractor"),'\s+',' ','g'))) k FROM "Contracts" GROUP BY 1
      HAVING count(DISTINCT lower(regexp_replace(btrim("Contractor"),'\s+',' ','g')))=1) c
JOIN "Organizations" o ON o."Kind"='nt' AND lower(regexp_replace(btrim(o."Name"),'\s+',' ','g'))=c.k
WHERE p."Id"=c."PackageId" AND coalesce(p."ContractorIds",'[]') IN ('[]','');
-- 6) Gói đã có hợp đồng mà chưa ghi trạng thái: đang thực hiện hợp đồng
UPDATE "Packages" p SET "Status"='Đang thực hiện hợp đồng', "UpdatedAt"=now(), "UpdatedBy"='admin'
WHERE coalesce(btrim(p."Status"),'')='' AND EXISTS (SELECT 1 FROM "Contracts" c WHERE c."PackageId"=p."Id");
-- Kiểm tra
SELECT 'nha thau trong danh muc' muc, count(*) FROM "Organizations" WHERE "Kind"='nt'
UNION ALL SELECT 'don vi thanh vien he sinh thai', count(*) FROM "Organizations" WHERE "Member"
UNION ALL SELECT 'goi co hop dong', count(DISTINCT "PackageId") FROM "Contracts"
UNION ALL SELECT 'goi lien danh da gan thanh vien', count(*) FROM "Packages" WHERE coalesce("JointVenture",'')<>''
UNION ALL SELECT 'goi lien danh co ty le', count(*) FROM "Packages" WHERE coalesce("ContractorShares",'') NOT IN ('','{}')
UNION ALL SELECT 'goi lien danh ty le khac 100 hoac thieu thanh vien', count(*) FROM "Packages" p WHERE coalesce("JointVenture",'')<>'' AND (coalesce(p."ContractorShares",'') IN ('','{}') OR (SELECT sum(value::numeric) FROM json_each_text(p."ContractorShares"::json))<>100 OR (SELECT count(*) FROM json_each_text(p."ContractorShares"::json))<>json_array_length(p."ContractorIds"::json))
UNION ALL SELECT 'goi co hop dong chua gan nha thau', count(*) FROM "Packages" p WHERE coalesce(p."ContractorIds",'[]') IN ('[]','') AND EXISTS (SELECT 1 FROM "Contracts" c WHERE c."PackageId"=p."Id")
UNION ALL SELECT 'goi co hop dong chua co trang thai', count(*) FROM "Packages" p WHERE coalesce(btrim(p."Status"),'')='' AND EXISTS (SELECT 1 FROM "Contracts" c WHERE c."PackageId"=p."Id")
UNION ALL SELECT 'gan toi don vi khong ton tai', count(*) FROM "Packages" p, json_array_elements_text(coalesce(nullif(p."ContractorIds",''),'[]')::json) x WHERE NOT EXISTS (SELECT 1 FROM "Organizations" o WHERE o."Id"=x)
UNION ALL SELECT 'hop dong lech nha thau cua goi', count(*) FROM "Contracts" c JOIN "Packages" p ON p."Id"=c."PackageId"
  WHERE lower(regexp_replace(btrim(c."Contractor"),'\s+',' ','g')) NOT IN (SELECT lower(o."Name") FROM json_array_elements_text(p."ContractorIds"::json) x JOIN "Organizations" o ON o."Id"=x UNION SELECT lower(coalesce(p."JointVenture",'')));
COMMIT;
