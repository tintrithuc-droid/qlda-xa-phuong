using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QldaTtts.Web.Data.Migrations
{
    /// <inheritdoc />
    public partial class KpiHang : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Rank",
                table: "KpiSheets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RankBonus",
                table: "KpiSheets",
                type: "decimal(18,0)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rank",
                table: "KpiSheets");

            migrationBuilder.DropColumn(
                name: "RankBonus",
                table: "KpiSheets");
        }
    }
}
