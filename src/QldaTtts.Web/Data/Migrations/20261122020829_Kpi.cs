using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.Migrations
{
    /// <inheritdoc />
    public partial class Kpi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EworkArchive",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    TableName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RowKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EworkUserId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Period = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    Data = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EworkArchive", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KpiSheets",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    EmployeeId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Month = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: false),
                    WorkScore = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    ProjectScore = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    ManagerRating = table.Column<int>(type: "int", nullable: true),
                    ManagerNote = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    RatedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    EmployeeNote = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    WorkFinal = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    AttendanceFinal = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    Total = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    Grade = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    LockedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LockedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KpiSheets", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EworkArchive_EworkUserId",
                table: "EworkArchive",
                column: "EworkUserId");

            migrationBuilder.CreateIndex(
                name: "IX_EworkArchive_TableName_RowKey",
                table: "EworkArchive",
                columns: new[] { "TableName", "RowKey" });

            migrationBuilder.CreateIndex(
                name: "IX_KpiSheets_Month_EmployeeId",
                table: "KpiSheets",
                columns: new[] { "Month", "EmployeeId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EworkArchive");

            migrationBuilder.DropTable(
                name: "KpiSheets");
        }
    }
}
