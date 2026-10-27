using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Ts = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Username = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Fullname = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Action = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Module = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Target = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Ip = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BoqItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ContractId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Qty = table.Column<double>(type: "float", nullable: true),
                    Price = table.Column<decimal>(type: "decimal(20,0)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoqItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Catalogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Catalogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ConstructionDiaries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ProjectId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    PackageId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: true),
                    Shift = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Weather = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Workers = table.Column<int>(type: "int", nullable: true),
                    Machines = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Works = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Issues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Supervisor = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ByName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Photos = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConstructionDiaries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ConstructionItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ProjectId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Structure = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Area = table.Column<double>(type: "float", nullable: true),
                    Floors = table.Column<int>(type: "int", nullable: true),
                    Progress = table.Column<double>(type: "float", nullable: true),
                    Desc = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConstructionItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContractAddenda",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ContractId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Number = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ValueChange = table.Column<decimal>(type: "decimal(20,0)", nullable: true),
                    DaysChange = table.Column<int>(type: "int", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractAddenda", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Contracts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    PackageId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ProjectId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Number = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Contractor = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    SignDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Value = table.Column<decimal>(type: "decimal(20,0)", nullable: true),
                    Start = table.Column<DateOnly>(type: "date", nullable: true),
                    End = table.Column<DateOnly>(type: "date", nullable: true),
                    Ctype = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Guarantee = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AdvanceRate = table.Column<double>(type: "float", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contracts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LegalDocuments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ProjectId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    PackageId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Type = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Number = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: true),
                    Issuer = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FileName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    FileSize = table.Column<long>(type: "bigint", nullable: true),
                    AssetId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Url = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegalDocuments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModelFiles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    FileKey = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ProjectId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ItemId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Format = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Version = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: true),
                    By = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Size = table.Column<long>(type: "bigint", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssetId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Url = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelFiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Packages",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ProjectId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Method = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Estimate = table.Column<decimal>(type: "decimal(20,0)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Duration = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Packages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PaymentPlans",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ContractId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Phase = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PlanDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(20,0)", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ContractId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Number = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: true),
                    Kind = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(20,0)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PaidDate = table.Column<DateOnly>(type: "date", nullable: true),
                    FileName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    FileSize = table.Column<long>(type: "bigint", nullable: true),
                    AssetId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Url = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Group = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Tmdt = table.Column<decimal>(type: "decimal(20,0)", nullable: true),
                    Capital = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Owner = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Location = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Start = table.Column<DateOnly>(type: "date", nullable: true),
                    End = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Phase = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Decision = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Desc = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProjectTasks",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ProjectId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Assignee = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Due = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Priority = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DoneDate = table.Column<DateOnly>(type: "date", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectTasks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ScheduleItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ProjectId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    PackageId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ItemId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PlanStart = table.Column<DateOnly>(type: "date", nullable: true),
                    PlanEnd = table.Column<DateOnly>(type: "date", nullable: true),
                    ActualStart = table.Column<DateOnly>(type: "date", nullable: true),
                    ActualEnd = table.Column<DateOnly>(type: "date", nullable: true),
                    Progress = table.Column<double>(type: "float", nullable: true),
                    Weight = table.Column<double>(type: "float", nullable: true),
                    History = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduleItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StoredFiles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Size = table.Column<long>(type: "bigint", nullable: false),
                    RelPath = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    UploadedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoredFiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserGroups",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Desc = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Admin = table.Column<bool>(type: "bit", nullable: false),
                    Perms = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Scope = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Username = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    GroupId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Active = table.Column<bool>(type: "bit", nullable: false),
                    Sample = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FailedCount = table.Column<int>(type: "int", nullable: false),
                    LockoutUntil = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastLogin = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VolumeEntries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    BoqId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ContractId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: true),
                    Period = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DoneQty = table.Column<double>(type: "float", nullable: true),
                    AcceptedQty = table.Column<double>(type: "float", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VolumeEntries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Ts",
                table: "AuditLogs",
                column: "Ts");

            migrationBuilder.CreateIndex(
                name: "IX_BoqItems_ContractId",
                table: "BoqItems",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_Catalogs_Type",
                table: "Catalogs",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_ConstructionDiaries_PackageId_Date",
                table: "ConstructionDiaries",
                columns: new[] { "PackageId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_PackageId",
                table: "Contracts",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_Packages_ProjectId",
                table: "Packages",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ContractId",
                table: "Payments",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_Code",
                table: "Projects",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleItems_PackageId",
                table: "ScheduleItems",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VolumeEntries_BoqId",
                table: "VolumeEntries",
                column: "BoqId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "BoqItems");

            migrationBuilder.DropTable(
                name: "Catalogs");

            migrationBuilder.DropTable(
                name: "ConstructionDiaries");

            migrationBuilder.DropTable(
                name: "ConstructionItems");

            migrationBuilder.DropTable(
                name: "ContractAddenda");

            migrationBuilder.DropTable(
                name: "Contracts");

            migrationBuilder.DropTable(
                name: "LegalDocuments");

            migrationBuilder.DropTable(
                name: "ModelFiles");

            migrationBuilder.DropTable(
                name: "Packages");

            migrationBuilder.DropTable(
                name: "PaymentPlans");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "Projects");

            migrationBuilder.DropTable(
                name: "ProjectTasks");

            migrationBuilder.DropTable(
                name: "ScheduleItems");

            migrationBuilder.DropTable(
                name: "StoredFiles");

            migrationBuilder.DropTable(
                name: "UserGroups");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "VolumeEntries");
        }
    }
}
