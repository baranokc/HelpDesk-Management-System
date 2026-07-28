using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddIsInitialToTicketStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "TicketNumberSequence");

            migrationBuilder.AddColumn<bool>(
                name: "IsInitial",
                table: "TicketStatuses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "EditedAt",
                table: "TicketComments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "TicketAttachments",
                type: "text",
                nullable: true);

            migrationBuilder.InsertData(
                table: "TicketStatuses",
                columns: new[] { "Id", "Description", "IsActive", "IsClosed", "IsInitial", "Name" },
                values: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), "", true, true, true, "Open" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_TicketNumber",
                table: "Tickets",
                column: "TicketNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tickets_TicketNumber",
                table: "Tickets");

            migrationBuilder.DeleteData(
                table: "TicketStatuses",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"));

            migrationBuilder.DropColumn(
                name: "IsInitial",
                table: "TicketStatuses");

            migrationBuilder.DropColumn(
                name: "EditedAt",
                table: "TicketComments");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "TicketAttachments");

            migrationBuilder.DropSequence(
                name: "TicketNumberSequence");
        }
    }
}
