using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Controllers;

    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    Id = u.Id,
                    Name = u.Name,
                    LastName = u.LastName,
                    Email = u.Email,
                    Role = u.Role
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateUserRole(string id, [FromBody] UpdateRoleDto dto)
        {
            if (!Guid.TryParse(id, out var userGuid))
            {
                return BadRequest("Invalid User ID format.");
            }

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userGuid);

            if (user == null)
                return NotFound("User not found.");

            // Rol atama işlemleri...
            var roleEntity = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == dto.NewRole);

            if (roleEntity == null)
                return BadRequest("Invalid role name.");

            user.Role = roleEntity;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        public class UpdateRoleDto
        {
            public string NewRole { get; set; } = string.Empty;
        }
    }
