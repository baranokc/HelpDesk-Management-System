using System.Text;
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
        public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 10000)
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

        // 🌟 EXPORT EXCEL ENDPOINT'İ (Frontend'deki 404 hatasını çözen metod)
        [HttpGet("export")]
        public async Task<IActionResult> ExportAuditLogs()
        {
            var logs = await _context.AuditLogs
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.CreatedAt,
                    UserName = a.User != null ? (a.User.Username ?? a.User.Email) : "Sistem / Anonim",
                    UserEmail = a.User != null ? a.User.Email : "",
                    a.Action,
                    a.EntityName,
                    a.EntityId,
                    a.IpAddress,
                    a.OldValues,
                    a.NewValues
                })
                .ToListAsync();

            var builder = new StringBuilder();
            // Excel kolon başlıkları
            builder.AppendLine("Tarih;Kullanici;Email;Islem;Hedef Varlik;Hedef ID;IP Adresi;Eski Degerler;Yeni Degerler");

            foreach (var log in logs)
            {
                var date = log.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                var userName = CleanCsvField(log.UserName);
                var userEmail = CleanCsvField(log.UserEmail);
                var action = CleanCsvField(log.Action);
                var entityName = CleanCsvField(log.EntityName);
                var entityId = CleanCsvField(log.EntityId.ToString());
                var ip = CleanCsvField(log.IpAddress);
                var oldVal = CleanCsvField(log.OldValues);
                var newVal = CleanCsvField(log.NewValues);

                builder.AppendLine($"{date};{userName};{userEmail};{action};{entityName};{entityId};{ip};{oldVal};{newVal}");
            }

            // Türkçe karakterlerin Excel'de bozuk görünmemesi için UTF-8 BOM ekliyoruz
            var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(builder.ToString())).ToArray();

            return File(
                bytes, 
                "text/csv", 
                $"AuditLogs_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv"
            );
        }

        // Metin içindeki tırnak, yeni satır veya noktalı virgül gibi karakterleri temizler
        private static string CleanCsvField(string? field)
        {
            if (string.IsNullOrEmpty(field)) return "";
            var cleaned = field.Replace("\"", "\"\"").Replace("\r", " ").Replace("\n", " ");
            return $"\"{cleaned}\"";
        }
    }
}