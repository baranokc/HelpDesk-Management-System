using backend.Data;
using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {

        if (!await context.TicketStatuses.AnyAsync())
        {
            await context.TicketStatuses.AddRangeAsync(
                new TicketStatus { Id = Guid.NewGuid(), Name = "Open", IsInitial = true, IsActive = true },
                new TicketStatus { Id = Guid.NewGuid(), Name = "In Progress", IsInitial = false, IsActive = true },
                new TicketStatus { Id = Guid.NewGuid(), Name = "Resolved", IsInitial = false, IsActive = true },
                new TicketStatus { Id = Guid.NewGuid(), Name = "Closed", IsInitial = false, IsActive = true }
            );
        }

        if (!await context.TicketPriorities.AnyAsync())
        {
            await context.TicketPriorities.AddRangeAsync(
                new TicketPriority { Id = Guid.NewGuid(), Name = "Low" },
                new TicketPriority { Id = Guid.NewGuid(), Name = "Medium" },
                new TicketPriority { Id = Guid.NewGuid(), Name = "High" },
                new TicketPriority { Id = Guid.NewGuid(), Name = "Critical" }
            );
        }

        if (!await context.ImpactLevels.AnyAsync())
        {
            await context.ImpactLevels.AddRangeAsync(
                new ImpactLevel { Id = Guid.NewGuid(), Name = "Individual" },
                new ImpactLevel { Id = Guid.NewGuid(), Name = "Departmental" },
                new ImpactLevel { Id = Guid.NewGuid(), Name = "Organization-Wide" }
            );
        }

        if (!await context.UrgencyLevels.AnyAsync())
        {
            await context.UrgencyLevels.AddRangeAsync(
                new UrgencyLevel { Id = Guid.NewGuid(), Name = "Low" },
                new UrgencyLevel { Id = Guid.NewGuid(), Name = "Normal" },
                new UrgencyLevel { Id = Guid.NewGuid(), Name = "High" }
            );
        }


        if (!await context.TicketCategories.AnyAsync())
        {
            await context.TicketCategories.AddRangeAsync(
                new TicketCategory { Id = Guid.NewGuid(), Name = "Software" },
                new TicketCategory { Id = Guid.NewGuid(), Name = "Hardware" },
                new TicketCategory { Id = Guid.NewGuid(), Name = "Network / Internet" },
                new TicketCategory { Id = Guid.NewGuid(), Name = "Email / Account Access" }
            );
        }

        await context.SaveChangesAsync();
    }
}
    
