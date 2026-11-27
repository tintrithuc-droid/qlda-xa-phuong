using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.MigrationsPg
{
    /// <inheritdoc />
    public partial class VanPhong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Attendances",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EmployeeId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    InAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    OutAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    InPlace = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    OutPlace = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    InLat = table.Column<double>(type: "double precision", nullable: true),
                    InLng = table.Column<double>(type: "double precision", nullable: true),
                    OutLat = table.Column<double>(type: "double precision", nullable: true),
                    OutLng = table.Column<double>(type: "double precision", nullable: true),
                    InIp = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    OutIp = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    Site = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    LateMinutes = table.Column<int>(type: "integer", nullable: false),
                    EarlyMinutes = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EworkId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    SyncedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attendances", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ManagerUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CheckinTime = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    EworkId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DepartmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Position = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Birthday = table.Column<DateOnly>(type: "date", nullable: true),
                    Gender = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Attendance = table.Column<bool>(type: "boolean", nullable: false),
                    IdNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    IdDate = table.Column<DateOnly>(type: "date", nullable: true),
                    IdPlace = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TaxCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    InsuranceNo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BankAccount = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BankName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ContractType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ContractNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ContractStart = table.Column<DateOnly>(type: "date", nullable: true),
                    ContractEnd = table.Column<DateOnly>(type: "date", nullable: true),
                    Dependents = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    EworkId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Requests",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EmployeeId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    FromAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ToAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Days = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    Hours = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(20,0)", nullable: true),
                    Place = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ApproverUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    ApproverName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DecidedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    DecisionNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EworkId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Requests", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_Date",
                table: "Attendances",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_EmployeeId_Date",
                table: "Attendances",
                columns: new[] { "EmployeeId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_UserId",
                table: "Employees",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Requests_EmployeeId",
                table: "Requests",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Requests_Status",
                table: "Requests",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Attendances");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropTable(
                name: "Requests");
        }
    }
}
