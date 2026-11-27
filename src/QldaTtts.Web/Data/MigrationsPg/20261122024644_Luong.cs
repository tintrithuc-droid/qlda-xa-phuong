using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.MigrationsPg
{
    /// <inheritdoc />
    public partial class Luong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PayProfiles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EmployeeId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    BaseSalary = table.Column<decimal>(type: "numeric(18,0)", nullable: false),
                    InsuranceSalary = table.Column<decimal>(type: "numeric(18,0)", nullable: true),
                    Allowances = table.Column<string>(type: "text", nullable: true),
                    NoInsurance = table.Column<bool>(type: "boolean", nullable: false),
                    FlatTax = table.Column<bool>(type: "boolean", nullable: false),
                    FromMonth = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Payslips",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EmployeeId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Month = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    Bonus = table.Column<decimal>(type: "numeric(18,0)", nullable: false),
                    Deduction = table.Column<decimal>(type: "numeric(18,0)", nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Data = table.Column<string>(type: "text", nullable: true),
                    Net = table.Column<decimal>(type: "numeric(18,0)", nullable: true),
                    LockedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LockedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payslips", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PayProfiles_EmployeeId",
                table: "PayProfiles",
                column: "EmployeeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payslips_Month_EmployeeId",
                table: "Payslips",
                columns: new[] { "Month", "EmployeeId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PayProfiles");

            migrationBuilder.DropTable(
                name: "Payslips");
        }
    }
}
