using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.Migrations
{
    /// <inheritdoc />
    public partial class CongViecMocQuyMo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(name: "Scale", table: "ProjectTasks", type: "int", nullable: true);
            migrationBuilder.AddColumn<int>(name: "Share", table: "ProjectTasks", type: "int", nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Scale", table: "ProjectTasks");
            migrationBuilder.DropColumn(name: "Share", table: "ProjectTasks");
        }
    }
}
