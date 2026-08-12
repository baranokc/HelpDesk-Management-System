using backend.Data;
using backend.Entities;
using backend.Services.AuditLog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditLogsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10000,
            [FromQuery] DateTimeOffset? from = null,
            [FromQuery] DateTimeOffset? to = null)
        {
            var validationResult = ValidateRequest(page, pageSize, from, to);
            if (validationResult is not null)
            {
                return validationResult;
            }

            var query = ApplyDateRange(
                _context.AuditLogs.AsNoTracking(),
                from,
                to);

            var totalCount = await query.CountAsync();
            var logs = await query
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    a.Id,
                    a.UserId,
                    UserName = a.User != null ? (a.User.Username ?? a.User.Email) : "Sistem / Anonim",
                    UserEmail = a.User != null ? a.User.Email : null,
                    a.Action,
                    a.EntityName,
                    a.EntityId,
                    a.OldValues,
                    a.NewValues,
                    a.IpAddress,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                items = logs
            });
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportAuditLogs(
            [FromQuery] DateTimeOffset? from = null,
            [FromQuery] DateTimeOffset? to = null)
        {
            if (from.HasValue && to.HasValue && from.Value > to.Value)
            {
                return BadRequest(new
                {
                    message = "The start date and time cannot be later than the end date and time."
                });
            }

            var logs = await ApplyDateRange(
                    _context.AuditLogs.AsNoTracking(),
                    from,
                    to)
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AuditLogExcelRow
                {
                    CreatedAt = a.CreatedAt,
                    UserName = a.User != null ? (a.User.Username ?? a.User.Email) : "Sistem / Anonim",
                    UserEmail = a.User != null ? a.User.Email : "",
                    Action = a.Action,
                    EntityName = a.EntityName,
                    EntityId = a.EntityId,
                    IpAddress = a.IpAddress,
                    OldValues = a.OldValues,
                    NewValues = a.NewValues
                })
                .ToListAsync();

            var bytes = AuditLogExcelExporter.CreateWorkbook(logs);
            var fromPart = from?.UtcDateTime.ToString("yyyyMMdd_HHmmss") ?? "Beginning";
            var toPart = to?.UtcDateTime.ToString("yyyyMMdd_HHmmss") ?? "Now";

            return File(
                bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"AuditLogs_{fromPart}_{toPart}.xlsx"
            );
        }

        private BadRequestObjectResult? ValidateRequest(
            int page,
            int pageSize,
            DateTimeOffset? from,
            DateTimeOffset? to)
        {
            if (page < 1)
            {
                return BadRequest(new { message = "Page must be greater than zero." });
            }

            if (pageSize < 1 || pageSize > 10000)
            {
                return BadRequest(new { message = "Page size must be between 1 and 10000." });
            }

            if (from.HasValue && to.HasValue && from.Value > to.Value)
            {
                return BadRequest(new
                {
                    message = "The start date and time cannot be later than the end date and time."
                });
            }

            return null;
        }

        private static IQueryable<AuditLog> ApplyDateRange(
            IQueryable<AuditLog> query,
            DateTimeOffset? from,
            DateTimeOffset? to)
        {
            if (from.HasValue)
            {
                var fromUtc = from.Value.UtcDateTime;
                query = query.Where(log => log.CreatedAt >= fromUtc);
            }

            if (to.HasValue)
            {
                var toUtc = to.Value.UtcDateTime;
                query = query.Where(log => log.CreatedAt <= toUtc);
            }

            return query;
        }
    }
}
