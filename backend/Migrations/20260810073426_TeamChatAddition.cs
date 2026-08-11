using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class TeamChatAddition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "TeamId",
                table: "TeamChatMessages",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<int>(
                name: "Audience",
                table: "TeamChatMessages",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_TeamChatMessages_Audience_CreatedAt",
                table: "TeamChatMessages",
                columns: new[] { "Audience", "CreatedAt" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_TeamChatMessages_Audience",
                table: "TeamChatMessages",
                sql: "(\"Audience\" = 0 AND \"TeamId\" IS NOT NULL) OR (\"Audience\" = 1 AND \"TeamId\" IS NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TeamChatMessages_Audience_CreatedAt",
                table: "TeamChatMessages");

            migrationBuilder.DropCheckConstraint(
                name: "CK_TeamChatMessages_Audience",
                table: "TeamChatMessages");

            migrationBuilder.DropColumn(
                name: "Audience",
                table: "TeamChatMessages");

            migrationBuilder.AlterColumn<Guid>(
                name: "TeamId",
                table: "TeamChatMessages",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
