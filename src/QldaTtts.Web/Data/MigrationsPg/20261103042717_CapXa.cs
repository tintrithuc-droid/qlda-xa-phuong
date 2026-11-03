using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.MigrationsPg
{
    /// <inheritdoc />
    public partial class CapXa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BoardRole",
                table: "Projects",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DecisionMaker",
                table: "Projects",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MgmtForm",
                table: "Projects",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProjectKind",
                table: "Projects",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReportType",
                table: "Projects",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Acceptances",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ProjectId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    PackageId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Kind = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Number = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: true),
                    Content = table.Column<string>(type: "text", nullable: true),
                    Result = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Receiver = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    WarrantyMonths = table.Column<int>(type: "integer", nullable: true),
                    WarrantyUntil = table.Column<DateOnly>(type: "date", nullable: true),
                    WarrantyGuaranteeUntil = table.Column<DateOnly>(type: "date", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Acceptances", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CapitalPlans",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ProjectId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Kind = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Source = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(20,0)", nullable: true),
                    Number = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: true),
                    TargetQ1 = table.Column<double>(type: "double precision", nullable: true),
                    TargetQ2 = table.Column<double>(type: "double precision", nullable: true),
                    TargetQ3 = table.Column<double>(type: "double precision", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CapitalPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Clearances",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ProjectId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Households = table.Column<int>(type: "integer", nullable: true),
                    Area = table.Column<double>(type: "double precision", nullable: true),
                    Budget = table.Column<decimal>(type: "numeric(20,0)", nullable: true),
                    Number = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PlanDate = table.Column<DateOnly>(type: "date", nullable: true),
                    HouseholdsPaid = table.Column<int>(type: "integer", nullable: true),
                    AmountPaid = table.Column<decimal>(type: "numeric(20,0)", nullable: true),
                    HandedArea = table.Column<double>(type: "double precision", nullable: true),
                    HandoverDue = table.Column<DateOnly>(type: "date", nullable: true),
                    HandoverDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Issues = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clearances", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Settlements",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ProjectId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CompletedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Deadline = table.Column<DateOnly>(type: "date", nullable: true),
                    SubmittedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ProposedValue = table.Column<decimal>(type: "numeric(20,0)", nullable: true),
                    AuditedValue = table.Column<decimal>(type: "numeric(20,0)", nullable: true),
                    ApprovedValue = table.Column<decimal>(type: "numeric(20,0)", nullable: true),
                    Number = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ApprovalDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ClosedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Settlements", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Acceptances_ProjectId",
                table: "Acceptances",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_CapitalPlans_ProjectId_Year",
                table: "CapitalPlans",
                columns: new[] { "ProjectId", "Year" });

            migrationBuilder.CreateIndex(
                name: "IX_Clearances_ProjectId",
                table: "Clearances",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Settlements_ProjectId",
                table: "Settlements",
                column: "ProjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Acceptances");

            migrationBuilder.DropTable(
                name: "CapitalPlans");

            migrationBuilder.DropTable(
                name: "Clearances");

            migrationBuilder.DropTable(
                name: "Settlements");

            migrationBuilder.DropColumn(
                name: "BoardRole",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "DecisionMaker",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "MgmtForm",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ProjectKind",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ReportType",
                table: "Projects");
        }
    }
}
