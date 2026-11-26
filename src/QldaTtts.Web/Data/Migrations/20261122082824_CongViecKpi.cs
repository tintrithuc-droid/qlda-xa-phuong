using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.Migrations
{
    /// <inheritdoc />
    public partial class CongViecKpi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Arising",
                table: "ProjectTasks",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArisingConfirmedAt",
                table: "ProjectTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssignedByUserId",
                table: "ProjectTasks",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssigneeUserId",
                table: "ProjectTasks",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Collaborators",
                table: "ProjectTasks",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EworkId",
                table: "ProjectTasks",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExtendCount",
                table: "ProjectTasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateOnly>(
                name: "OriginalDue",
                table: "ProjectTasks",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParentId",
                table: "ProjectTasks",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Quality",
                table: "ProjectTasks",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReopenCount",
                table: "ProjectTasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateOnly>(
                name: "StartDate",
                table: "ProjectTasks",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Arising",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "ArisingConfirmedAt",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "AssignedByUserId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "AssigneeUserId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "Collaborators",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "EworkId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "ExtendCount",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "OriginalDue",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "Quality",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "ReopenCount",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "ProjectTasks");
        }
    }
}
