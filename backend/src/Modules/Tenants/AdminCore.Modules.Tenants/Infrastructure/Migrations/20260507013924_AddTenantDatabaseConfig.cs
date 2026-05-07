using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdminCore.Modules.Tenants.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantDatabaseConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConnectionString",
                schema: "tenants",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DatabaseProvider",
                schema: "tenants",
                table: "Tenants",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConnectionString",
                schema: "tenants",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "DatabaseProvider",
                schema: "tenants",
                table: "Tenants");
        }
    }
}
