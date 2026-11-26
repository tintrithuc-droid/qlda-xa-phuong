using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.MigrationsPg
{
    /// <inheritdoc />
    public partial class XacNhanLuong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ConfirmedAt",
                table: "Payslips",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Feedback",
                table: "Payslips",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FeedbackAt",
                table: "Payslips",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FeedbackStatus",
                table: "Payslips",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RepliedAt",
                table: "Payslips",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RepliedBy",
                table: "Payslips",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reply",
                table: "Payslips",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConfirmedAt",
                table: "Payslips");

            migrationBuilder.DropColumn(
                name: "Feedback",
                table: "Payslips");

            migrationBuilder.DropColumn(
                name: "FeedbackAt",
                table: "Payslips");

            migrationBuilder.DropColumn(
                name: "FeedbackStatus",
                table: "Payslips");

            migrationBuilder.DropColumn(
                name: "RepliedAt",
                table: "Payslips");

            migrationBuilder.DropColumn(
                name: "RepliedBy",
                table: "Payslips");

            migrationBuilder.DropColumn(
                name: "Reply",
                table: "Payslips");
        }
    }
}
