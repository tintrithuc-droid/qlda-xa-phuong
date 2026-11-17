using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.MigrationsPg
{
    /// <inheritdoc />
    public partial class NangCapTheoTTTS : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OrgId",
                table: "Users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "PaymentPlans",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractorIds",
                table: "Packages",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "JointVenture",
                table: "Packages",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phase",
                table: "Packages",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupervisorIds",
                table: "Packages",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "LegalDocuments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Contracts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Section",
                table: "BoqItems",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Assignee",
                table: "ApprovalLogs",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssigneeName",
                table: "ApprovalLogs",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "Due",
                table: "ApprovalLogs",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Route",
                table: "ApprovalLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Step",
                table: "ApprovalLogs",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Organizations",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Kind = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    ShortName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    TaxCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Representative = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    RepTitle = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    BankAccount = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BankName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CertNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CertGrade = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CertDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Field = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    ContactName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organizations", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Organizations");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OrgId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "PaymentPlans");

            migrationBuilder.DropColumn(
                name: "ContractorIds",
                table: "Packages");

            migrationBuilder.DropColumn(
                name: "JointVenture",
                table: "Packages");

            migrationBuilder.DropColumn(
                name: "Phase",
                table: "Packages");

            migrationBuilder.DropColumn(
                name: "SupervisorIds",
                table: "Packages");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "LegalDocuments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "Section",
                table: "BoqItems");

            migrationBuilder.DropColumn(
                name: "Assignee",
                table: "ApprovalLogs");

            migrationBuilder.DropColumn(
                name: "AssigneeName",
                table: "ApprovalLogs");

            migrationBuilder.DropColumn(
                name: "Due",
                table: "ApprovalLogs");

            migrationBuilder.DropColumn(
                name: "Route",
                table: "ApprovalLogs");

            migrationBuilder.DropColumn(
                name: "Step",
                table: "ApprovalLogs");
        }
    }
}
