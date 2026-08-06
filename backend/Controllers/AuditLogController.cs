using backend.Data;
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
        public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt);

            var totalCount = await query.CountAsync();
            var logs = await query
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
    }
}