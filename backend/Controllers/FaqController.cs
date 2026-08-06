using backend.Data;
using backend.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    public class ReorderFaqItemDto
    {
        public Guid Id { get; set; }
        public int DisplayOrder { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class FaqsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FaqsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetActiveFaqs()
        {
            var faqs = await _context.FaqItems
                .Where(f => f.IsActive)
                .OrderBy(f => f.DisplayOrder)
                .ThenByDescending(f => f.CreatedAt)
                .ToListAsync();

            return Ok(faqs);
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllFaqsForAdmin()
        {
            var faqs = await _context.FaqItems
                .OrderBy(f => f.DisplayOrder)
                .ThenByDescending(f => f.CreatedAt)
                .ToListAsync();

            return Ok(faqs);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateFaq([FromBody] FaqItem faq)
        {
            _context.FaqItems.Add(faq);
            await _context.SaveChangesAsync();
            return Ok(faq);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateFaq(Guid id, [FromBody] FaqItem updatedFaq)
        {
            var faq = await _context.FaqItems.FindAsync(id);
            if (faq == null) return NotFound();

            faq.Question = updatedFaq.Question;
            faq.Answer = updatedFaq.Answer;
            faq.Category = updatedFaq.Category;
            faq.IsActive = updatedFaq.IsActive;
            faq.DisplayOrder = updatedFaq.DisplayOrder;

            await _context.SaveChangesAsync();
            return Ok(faq);
        }

        [HttpPut("reorder")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReorderFaqs([FromBody] List<ReorderFaqItemDto> items)
        {
            foreach (var item in items)
            {
                var faq = await _context.FaqItems.FindAsync(item.Id);
                if (faq != null)
                {
                    faq.DisplayOrder = item.DisplayOrder;
                }
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteFaq(Guid id)
        {
            var faq = await _context.FaqItems.FindAsync(id);
            if (faq == null) return NotFound();

            _context.FaqItems.Remove(faq);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}