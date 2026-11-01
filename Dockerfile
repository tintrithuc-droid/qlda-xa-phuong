# Phần mềm QLDA xã/phường: ảnh Docker chạy trên Linux (PostgreSQL), không cần bản quyền Windows/SQL Server.
# Dựng: docker build -t qlda-xa-phuong .   (chép PDF HDSD vào src/QldaTtts.Web/hdsd trước nếu muốn kèm sẵn)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY src/QldaTtts.Web/QldaTtts.Web.csproj src/QldaTtts.Web/
RUN dotnet restore src/QldaTtts.Web/QldaTtts.Web.csproj
COPY src/ src/
RUN dotnet publish src/QldaTtts.Web -c Release -o /out --no-restore -p:DebugType=none \
 && rm -f /out/appsettings.Development.json

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /out .
# App_Data: khóa bảo vệ dữ liệu (cần cho xác thực 2 lớp), tệp đính kèm, bản sao lưu → gắn volume để không mất khi cập nhật
RUN mkdir -p /app/App_Data/files /app/App_Data/backups /app/App_Data/keys && chown -R $APP_UID /app/App_Data
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    Database__Provider=PostgreSQL \
    Storage__FilesPath=/app/App_Data/files \
    Storage__BackupPath=/app/App_Data/backups \
    TZ=Asia/Ho_Chi_Minh
USER $APP_UID
VOLUME ["/app/App_Data"]
EXPOSE 8080
ENTRYPOINT ["dotnet", "QldaTtts.Web.dll"]
