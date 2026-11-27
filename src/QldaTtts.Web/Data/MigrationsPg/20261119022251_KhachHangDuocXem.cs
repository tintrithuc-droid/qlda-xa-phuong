using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.MigrationsPg
{
    /// <inheritdoc />
    public partial class KhachHangDuocXem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AssignedOnly",
                table: "UserGroups",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ViewerIds",
                table: "Projects",
                type: "text",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignedOnly",
                table: "UserGroups");

            migrationBuilder.DropColumn(
                name: "ViewerIds",
                table: "Projects");
        }
    }
}
