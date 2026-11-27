using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.Migrations
{
    /// <inheritdoc />
    public partial class NhanNhiemVu : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Result",
                table: "Attendances",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResultAt",
                table: "Attendances",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaskIds",
                table: "Attendances",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaskNames",
                table: "Attendances",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Result",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "ResultAt",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "TaskIds",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "TaskNames",
                table: "Attendances");
        }
    }
}
