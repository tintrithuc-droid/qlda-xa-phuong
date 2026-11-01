# Đóng gói bản demo chạy trên máy cá nhân (Windows, SQLite)

```bash
dotnet publish src/QldaTtts.Web -c Release -r win-x64 --self-contained -p:DebugType=none -o QLDA_Demo/app
rm -rf QLDA_Demo/app/App_Data QLDA_Demo/app/appsettings.Development.json
cp deploy/demo/*.bat QLDA_Demo/
```

Chép 6 PDF HDSD vào `src/QldaTtts.Web/hdsd` trước khi publish. Kèm `HUONG_DAN_CHAY_DEMO.docx`, nén `QLDA_Demo.zip`.
Hai tệp .bat phải giữ xuống dòng CRLF.
