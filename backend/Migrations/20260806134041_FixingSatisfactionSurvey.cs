using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FixingSatisfactionSurvey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SlaCalendarId",
                table: "Teams",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "RemainingFirstResponseTime",
                table: "SlaRecord",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "RemainingResolutionTime",
                table: "SlaRecord",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SlaCalendarId",
                table: "SlaRecord",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<double>(
                name: "Rating",
                table: "SatisfactionSurveys",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateTable(
                name: "SlaCalendar",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TimeZoneId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlaCalendar", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TeamMemberLeave",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TeamMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamMemberLeave", x => x.Id);
                    table.CheckConstraint("CK_TeamMemberLeave_DateRange", "\"StartDate\" <= \"EndDate\"");
                    table.ForeignKey(
                        name: "FK_TeamMemberLeave_TeamMembers_TeamMemberId",
                        column: x => x.TeamMemberId,
                        principalTable: "TeamMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TeamMemberLeave_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TeamMemberShift",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TeamMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamMemberShift", x => x.Id);
                    table.CheckConstraint("CK_TeamMemberShift_StartBeforeEnd", "\"StartTime\" < \"EndTime\"");
                    table.ForeignKey(
                        name: "FK_TeamMemberShift_TeamMembers_TeamMemberId",
                        column: x => x.TeamMemberId,
                        principalTable: "TeamMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SlaHoliday",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SlaCalendarId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlaHoliday", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SlaHoliday_SlaCalendar_SlaCalendarId",
                        column: x => x.SlaCalendarId,
                        principalTable: "SlaCalendar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SlaWorkingPeriod",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SlaCalendarId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlaWorkingPeriod", x => x.Id);
                    table.CheckConstraint("CK_SlaWorkingPeriod_StartBeforeEnd", "\"StartTime\" < \"EndTime\"");
                    table.ForeignKey(
                        name: "FK_SlaWorkingPeriod_SlaCalendar_SlaCalendarId",
                        column: x => x.SlaCalendarId,
                        principalTable: "SlaCalendar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Teams_SlaCalendarId",
                table: "Teams",
                column: "SlaCalendarId");

            migrationBuilder.CreateIndex(
                name: "IX_SlaRecord_SlaCalendarId",
                table: "SlaRecord",
                column: "SlaCalendarId");

            migrationBuilder.CreateIndex(
                name: "IX_SlaCalendar_OneActiveDefault",
                table: "SlaCalendar",
                column: "IsDefault",
                unique: true,
                filter: "\"IsDefault\" = TRUE AND \"IsActive\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_SlaHoliday_SlaCalendarId_Date",
                table: "SlaHoliday",
                columns: new[] { "SlaCalendarId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SlaWorkingPeriod_SlaCalendarId_DayOfWeek_StartTime_EndTime",
                table: "SlaWorkingPeriod",
                columns: new[] { "SlaCalendarId", "DayOfWeek", "StartTime", "EndTime" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeamMemberLeave_CreatedById",
                table: "TeamMemberLeave",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_TeamMemberLeave_TeamMemberId_StartDate_EndDate",
                table: "TeamMemberLeave",
                columns: new[] { "TeamMemberId", "StartDate", "EndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_TeamMemberShift_TeamMemberId_DayOfWeek",
                table: "TeamMemberShift",
                columns: new[] { "TeamMemberId", "DayOfWeek" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_SlaRecord_SlaCalendar_SlaCalendarId",
                table: "SlaRecord",
                column: "SlaCalendarId",
                principalTable: "SlaCalendar",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Teams_SlaCalendar_SlaCalendarId",
                table: "Teams",
                column: "SlaCalendarId",
                principalTable: "SlaCalendar",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SlaRecord_SlaCalendar_SlaCalendarId",
                table: "SlaRecord");

            migrationBuilder.DropForeignKey(
                name: "FK_Teams_SlaCalendar_SlaCalendarId",
                table: "Teams");

            migrationBuilder.DropTable(
                name: "SlaHoliday");

            migrationBuilder.DropTable(
                name: "SlaWorkingPeriod");

            migrationBuilder.DropTable(
                name: "TeamMemberLeave");

            migrationBuilder.DropTable(
                name: "TeamMemberShift");

            migrationBuilder.DropTable(
                name: "SlaCalendar");

            migrationBuilder.DropIndex(
                name: "IX_Teams_SlaCalendarId",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_SlaRecord_SlaCalendarId",
                table: "SlaRecord");

            migrationBuilder.DropColumn(
                name: "SlaCalendarId",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "RemainingFirstResponseTime",
                table: "SlaRecord");

            migrationBuilder.DropColumn(
                name: "RemainingResolutionTime",
                table: "SlaRecord");

            migrationBuilder.DropColumn(
                name: "SlaCalendarId",
                table: "SlaRecord");

            migrationBuilder.AlterColumn<int>(
                name: "Rating",
                table: "SatisfactionSurveys",
                type: "integer",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision");
        }
    }
}
