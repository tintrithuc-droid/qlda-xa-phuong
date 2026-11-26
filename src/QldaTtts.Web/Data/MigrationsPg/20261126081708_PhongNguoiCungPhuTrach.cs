using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.MigrationsPg
{
    /// <inheritdoc />
    public partial class PhongNguoiCungPhuTrach : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeputyUserId",
                table: "Departments",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeputyUserId",
                table: "Departments");
        }
    }
}
