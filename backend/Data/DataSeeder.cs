using backend.Entities;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await SeedTicketStatusesAsync(context);
        await SeedTicketPrioritiesAsync(context);
        await SeedImpactLevelsAsync(context);
        await SeedUrgencyLevelsAsync(context);
        await SeedTicketCategoriesAsync(context);

        await SafeSaveChangesAsync(context);

        try
        {
            var ticketStatuses = await context.TicketStatuses.ToListAsync();

            foreach (var status in ticketStatuses)
            {
                status.IsInitial = status.Name == "Open";
            }

            await SafeSaveChangesAsync(context);
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine("[DataSeeder Warning] TicketStatuses tablosu bulunamadı, işlem atlandı.");
        }

        await SeedTicketSubCategoriesAsync(context);
        await SeedRolesAsync(context);
        await SeedResolutionCategoriesAsync(context);
        await SeedDepartmentsAsync(context);

        await SafeSaveChangesAsync(context);

        await SeedTeamsAsync(context);

        await SafeSaveChangesAsync(context);

        await AssignTicketCategoriesToTeamsAsync(context);

        await SafeSaveChangesAsync(context);
    }

    private static async Task SafeSaveChangesAsync(AppDbContext context)
    {
        try
        {
            await context.SaveChangesAsync();
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine($"[DataSeeder Warning] Tablo henüz mevcut değil: {ex.MessageText}");
        }
    }

    private static async Task SeedTicketStatusesAsync(AppDbContext context)
    {
        try
        {
            var existingNames = await context.TicketStatuses
                .Select(x => x.Name)
                .ToListAsync();

            var statuses = new List<TicketStatus>();

            if (!existingNames.Contains("Open"))
            {
                statuses.Add(new TicketStatus
                {
                    Id = Guid.NewGuid(),
                    Name = "Open",
                    Description = "The ticket has been created and is awaiting processing.",
                    IsInitial = true,
                    IsClosed = false,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("In Progress"))
            {
                statuses.Add(new TicketStatus
                {
                    Id = Guid.NewGuid(),
                    Name = "In Progress",
                    Description = "Work on the ticket is currently in progress.",
                    IsInitial = false,
                    IsClosed = false,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Waiting for User"))
            {
                statuses.Add(new TicketStatus
                {
                    Id = Guid.NewGuid(),
                    Name = "Waiting for User",
                    Description = "Additional information or action is required from the user.",
                    IsInitial = false,
                    IsClosed = false,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("On Hold"))
            {
                statuses.Add(new TicketStatus
                {
                    Id = Guid.NewGuid(),
                    Name = "On Hold",
                    Description = "Work on the ticket has been temporarily suspended.",
                    IsInitial = false,
                    IsClosed = false,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Resolved"))
            {
                statuses.Add(new TicketStatus
                {
                    Id = Guid.NewGuid(),
                    Name = "Resolved",
                    Description = "A resolution has been provided for the ticket.",
                    IsInitial = false,
                    IsClosed = false,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Closed"))
            {
                statuses.Add(new TicketStatus
                {
                    Id = Guid.NewGuid(),
                    Name = "Closed",
                    Description = "The ticket has been closed.",
                    IsInitial = false,
                    IsClosed = true,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Cancelled"))
            {
                statuses.Add(new TicketStatus
                {
                    Id = Guid.NewGuid(),
                    Name = "Cancelled",
                    Description = "The ticket has been cancelled.",
                    IsInitial = false,
                    IsClosed = true,
                    IsActive = true
                });
            }

            if (statuses.Count > 0)
            {
                await context.TicketStatuses.AddRangeAsync(statuses);
            }
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine("[DataSeeder Warning] TicketStatuses tablosu bulunamadı.");
        }
    }

    private static async Task SeedTicketPrioritiesAsync(AppDbContext context)
    {
        try
        {
            var existingNames = await context.TicketPriorities
                .Select(x => x.Name)
                .ToListAsync();

            var priorities = new List<TicketPriority>();

            if (!existingNames.Contains("Low"))
            {
                priorities.Add(new TicketPriority
                {
                    Id = Guid.NewGuid(),
                    Name = "Low",
                    ResponseTime = TimeSpan.FromHours(8),
                    ResolutionTime = TimeSpan.FromDays(3)
                });
            }

            if (!existingNames.Contains("Medium"))
            {
                priorities.Add(new TicketPriority
                {
                    Id = Guid.NewGuid(),
                    Name = "Medium",
                    ResponseTime = TimeSpan.FromHours(4),
                    ResolutionTime = TimeSpan.FromDays(2)
                });
            }

            if (!existingNames.Contains("High"))
            {
                priorities.Add(new TicketPriority
                {
                    Id = Guid.NewGuid(),
                    Name = "High",
                    ResponseTime = TimeSpan.FromHours(2),
                    ResolutionTime = TimeSpan.FromHours(12)
                });
            }

            if (!existingNames.Contains("Critical"))
            {
                priorities.Add(new TicketPriority
                {
                    Id = Guid.NewGuid(),
                    Name = "Critical",
                    ResponseTime = TimeSpan.FromMinutes(30),
                    ResolutionTime = TimeSpan.FromHours(4)
                });
            }

            if (priorities.Count > 0)
            {
                await context.TicketPriorities.AddRangeAsync(priorities);
            }
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine("[DataSeeder Warning] TicketPriorities tablosu bulunamadı.");
        }
    }

    private static async Task SeedImpactLevelsAsync(AppDbContext context)
    {
        try
        {
            var existingNames = await context.ImpactLevels
                .Select(x => x.Name)
                .ToListAsync();

            var impactLevels = new List<ImpactLevel>();

            if (!existingNames.Contains("Individual"))
            {
                impactLevels.Add(new ImpactLevel
                {
                    Id = Guid.NewGuid(),
                    Name = "Individual",
                    Order = 1,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Departmental"))
            {
                impactLevels.Add(new ImpactLevel
                {
                    Id = Guid.NewGuid(),
                    Name = "Departmental",
                    Order = 2,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Multiple Departments"))
            {
                impactLevels.Add(new ImpactLevel
                {
                    Id = Guid.NewGuid(),
                    Name = "Multiple Departments",
                    Order = 3,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Organization-Wide"))
            {
                impactLevels.Add(new ImpactLevel
                {
                    Id = Guid.NewGuid(),
                    Name = "Organization-Wide",
                    Order = 4,
                    IsActive = true
                });
            }

            if (impactLevels.Count > 0)
            {
                await context.ImpactLevels.AddRangeAsync(impactLevels);
            }
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine("[DataSeeder Warning] ImpactLevels tablosu bulunamadı.");
        }
    }

    private static async Task SeedUrgencyLevelsAsync(AppDbContext context)
    {
        try
        {
            var existingNames = await context.UrgencyLevels
                .Select(x => x.Name)
                .ToListAsync();

            var urgencyLevels = new List<UrgencyLevel>();

            if (!existingNames.Contains("Low"))
            {
                urgencyLevels.Add(new UrgencyLevel
                {
                    Id = Guid.NewGuid(),
                    Name = "Low",
                    Order = 1,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Normal"))
            {
                urgencyLevels.Add(new UrgencyLevel
                {
                    Id = Guid.NewGuid(),
                    Name = "Normal",
                    Order = 2,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("High"))
            {
                urgencyLevels.Add(new UrgencyLevel
                {
                    Id = Guid.NewGuid(),
                    Name = "High",
                    Order = 3,
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Urgent"))
            {
                urgencyLevels.Add(new UrgencyLevel
                {
                    Id = Guid.NewGuid(),
                    Name = "Urgent",
                    Order = 4,
                    IsActive = true
                });
            }

            if (urgencyLevels.Count > 0)
            {
                await context.UrgencyLevels.AddRangeAsync(urgencyLevels);
            }
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine("[DataSeeder Warning] UrgencyLevels tablosu bulunamadı.");
        }
    }

    private static async Task SeedTicketCategoriesAsync(AppDbContext context)
    {
        try
        {
            var existingNames = await context.TicketCategories
                .Select(x => x.Name)
                .ToListAsync();

            var categories = new List<TicketCategory>();

            if (!existingNames.Contains("Software"))
            {
                categories.Add(new TicketCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "Software",
                    Description = "Software and application-related issues.",
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Hardware"))
            {
                categories.Add(new TicketCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "Hardware",
                    Description = "Computer and hardware-related issues.",
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Network / Internet"))
            {
                categories.Add(new TicketCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "Network / Internet",
                    Description = "Network, internet, and connectivity-related issues.",
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Email / Account Access"))
            {
                categories.Add(new TicketCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "Email / Account Access",
                    Description = "Email, password, and account access-related issues.",
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Printer / Peripheral"))
            {
                categories.Add(new TicketCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "Printer / Peripheral",
                    Description = "Printer, scanner, and peripheral device-related issues.",
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Access Request"))
            {
                categories.Add(new TicketCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "Access Request",
                    Description = "Requests for access to systems, applications, and folders.",
                    IsActive = true
                });
            }

            if (!existingNames.Contains("Other"))
            {
                categories.Add(new TicketCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "Other",
                    Description = "Other technical support requests.",
                    IsActive = true
                });
            }

            if (categories.Count > 0)
            {
                await context.TicketCategories.AddRangeAsync(categories);
            }
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine("[DataSeeder Warning] TicketCategories tablosu bulunamadı.");
        }
    }

    private static async Task SeedTicketSubCategoriesAsync(AppDbContext context)
    {
        await AddSubCategoriesAsync(
            context,
            "Software",
            [
                ("Installation", "A request to install new software."),
                ("Application Error", "An application error, malfunction, or crash."),
                ("Update", "A request to update installed software."),
                ("License", "A software activation or licensing issue.")
            ]);

        await AddSubCategoriesAsync(
            context,
            "Hardware",
            [
                ("Desktop Computer", "An issue affecting a desktop computer."),
                ("Laptop", "An issue affecting a laptop computer."),
                ("Monitor", "A monitor or display-related issue."),
                ("Keyboard / Mouse", "A keyboard or mouse-related issue."),
                ("Storage", "A disk, drive, or storage-related issue.")
            ]);

        await AddSubCategoriesAsync(
            context,
            "Network / Internet",
            [
                ("No Connection", "No network or internet connection is available."),
                ("Slow Connection", "The network or internet connection is unusually slow."),
                ("Wi-Fi", "A wireless network connection issue."),
                ("VPN", "A virtual private network connection issue."),
                ("Shared Folder", "An issue accessing a shared network folder.")
            ]);

        await AddSubCategoriesAsync(
            context,
            "Email / Account Access",
            [
                ("Password Reset", "A request to reset a user password."),
                ("Account Locked", "The user account has been locked."),
                ("Email Delivery", "An issue sending or receiving email messages."),
                ("Mailbox", "A mailbox capacity, availability, or access issue."),
                ("Multi-Factor Authentication", "A multi-factor authentication issue.")
            ]);

        await AddSubCategoriesAsync(
            context,
            "Printer / Peripheral",
            [
                ("Printer Offline", "The printer appears to be offline or unavailable."),
                ("Print Quality", "An issue affecting the quality of printed documents."),
                ("Scanner", "A scanner-related issue."),
                ("Driver", "A device driver installation or compatibility issue.")
            ]);

        await AddSubCategoriesAsync(
            context,
            "Access Request",
            [
                ("Application Access", "A request for access to an application."),
                ("Folder Access", "A request for access to a file or folder."),
                ("Permission Change", "A request to modify an existing permission."),
                ("New Account", "A request to create a new user account.")
            ]);

        await AddSubCategoriesAsync(
            context,
            "Other",
            [
                ("General Support", "A general technical support request."),
                ("Information Request", "A request for technical information or guidance.")
            ]);
    }

    private static async Task AddSubCategoriesAsync(
        AppDbContext context,
        string categoryName,
        IEnumerable<(string Name, string Description)> subCategories)
    {
        try
        {
            var category = await context.TicketCategories
                .FirstOrDefaultAsync(x => x.Name == categoryName);

            if (category is null)
            {
                return;
            }

            var existingNames = await context.TicketSubCategories
                .Where(x => x.CategoryId == category.Id)
                .Select(x => x.Name)
                .ToListAsync();

            var records = subCategories
                .Where(x => !existingNames.Contains(x.Name))
                .Select(x => new TicketSubCategory
                {
                    Id = Guid.NewGuid(),
                    CategoryId = category.Id,
                    Name = x.Name,
                    Description = x.Description,
                    IsActive = true
                })
                .ToList();

            if (records.Count > 0)
            {
                await context.TicketSubCategories.AddRangeAsync(records);
            }
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine("[DataSeeder Warning] TicketSubCategories tablosu bulunamadı.");
        }
    }

    private static async Task SeedRolesAsync(AppDbContext context)
    {
        try
        {
            var existingNames = await context.Roles
                .Select(x => x.Name)
                .ToListAsync();

            var roles = new List<Role>();

            if (!existingNames.Contains("Admin"))
            {
                roles.Add(new Role
                {
                    Id = Guid.NewGuid(),
                    Name = "Admin",
                    Description = "Has full administrative access to the system.",
                    IsActive = true
                });
            }

            if (!existingNames.Contains("SupportAgent"))
            {
                roles.Add(new Role
                {
                    Id = Guid.NewGuid(),
                    Name = "SupportAgent",
                    Description = "Can assign, update, process, and resolve tickets.",
                    IsActive = true
                });
            }

            if (!existingNames.Contains("TeamLeader"))
            {
                roles.Add(new Role
                {
                    Id = Guid.NewGuid(),
                    Name = "TeamLeader",
                    Description = "Can view and assign tickets that belong to teams they actively lead.",
                    IsActive = true
                });
            }

            if (!existingNames.Contains("User"))
            {
                roles.Add(new Role
                {
                    Id = Guid.NewGuid(),
                    Name = "User",
                    Description = "Can create tickets and track their own requests.",
                    IsActive = true
                });
            }

            if (roles.Count > 0)
            {
                await context.Roles.AddRangeAsync(roles);
            }
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine("[DataSeeder Warning] Roles tablosu bulunamadı.");
        }
    }

    private static async Task SeedResolutionCategoriesAsync(AppDbContext context)
    {
        try
        {
            var existingNames = await context.ResolutionCategories
                .Select(x => x.Name)
                .ToListAsync();

            var categories = new List<ResolutionCategory>();

            AddResolutionCategory(
                categories,
                existingNames,
                "Fixed",
                "The underlying cause of the issue was successfully fixed."
            );

            AddResolutionCategory(
                categories,
                existingNames,
                "Workaround",
                "A temporary workaround was provided."
            );

            AddResolutionCategory(
                categories,
                existingNames,
                "User Error",
                "The issue was caused by an incorrect user action."
            );

            AddResolutionCategory(
                categories,
                existingNames,
                "Duplicate",
                "The ticket reports the same issue as another existing ticket."
            );

            AddResolutionCategory(
                categories,
                existingNames,
                "Cannot Reproduce",
                "The reported issue could not be reproduced."
            );

            AddResolutionCategory(
                categories,
                existingNames,
                "No Action Required",
                "No technical action was required to resolve the ticket."
            );

            if (categories.Count > 0)
            {
                await context.ResolutionCategories.AddRangeAsync(categories);
            }
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine("[DataSeeder Warning] ResolutionCategories tablosu henüz veritabanında yok, atlandı.");
        }
    }

    private static void AddResolutionCategory(
        ICollection<ResolutionCategory> categories,
        ICollection<string> existingNames,
        string name,
        string description)
    {
        if (existingNames.Contains(name))
        {
            return;
        }

        categories.Add(new ResolutionCategory
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            IsActive = true
        });
    }

    private static async Task SeedDepartmentsAsync(AppDbContext context)
    {
        try
        {
            var existingNames = await context.Departments
                .Select(x => x.Name)
                .ToListAsync();

            var departments = new List<Department>();

            AddDepartment(
                departments,
                existingNames,
                "Information Technology",
                "IT",
                "The department responsible for information technology services."
            );

            AddDepartment(
                departments,
                existingNames,
                "Software",
                "SW",
                "The department responsible for software development."
            );

            AddDepartment(
                departments,
                existingNames,
                "Human Resources",
                "HR",
                "The department responsible for human resources operations."
            );

            AddDepartment(
                departments,
                existingNames,
                "Finance",
                "FIN",
                "The department responsible for finance and accounting."
            );

            AddDepartment(
                departments,
                existingNames,
                "Sales",
                "SALES",
                "The department responsible for sales operations."
            );

            AddDepartment(
                departments,
                existingNames,
                "Operations",
                "OPS",
                "The department responsible for operational processes."
            );

            if (departments.Count > 0)
            {
                await context.Departments.AddRangeAsync(departments);
            }
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine("[DataSeeder Warning] Departments tablosu bulunamadı.");
        }
    }

    private static void AddDepartment(
        ICollection<Department> departments,
        ICollection<string> existingNames,
        string name,
        string code,
        string description)
    {
        if (existingNames.Contains(name))
        {
            return;
        }

        departments.Add(new Department
        {
            Name = name,
            Code = code,
            Description = description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static async Task SeedTeamsAsync(AppDbContext context)
    {
        try
        {
            var informationTechnologyDepartment =
                await context.Departments.FirstOrDefaultAsync(
                    x => x.Name == "Information Technology");

            if (informationTechnologyDepartment is null)
            {
                return;
            }

            var existingNames = await context.Teams
                .Select(x => x.Name)
                .ToListAsync();

            var teams = new List<Team>();

            AddTeam(
                teams,
                existingNames,
                informationTechnologyDepartment.Id,
                "Service Desk",
                "The first-level team responsible for handling user support requests."
            );

            AddTeam(
                teams,
                existingNames,
                informationTechnologyDepartment.Id,
                "Software Support",
                "The team responsible for software and application support."
            );

            AddTeam(
                teams,
                existingNames,
                informationTechnologyDepartment.Id,
                "Hardware Support",
                "The team responsible for computer and hardware support."
            );

            AddTeam(
                teams,
                existingNames,
                informationTechnologyDepartment.Id,
                "Network Support",
                "The team responsible for network, internet, Wi-Fi, and VPN support."
            );

            if (teams.Count > 0)
            {
                await context.Teams.AddRangeAsync(teams);
            }
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine("[DataSeeder Warning] Teams tablosu bulunamadı.");
        }
    }

    private static void AddTeam(
        ICollection<Team> teams,
        ICollection<string> existingNames,
        int departmentId,
        string name,
        string description)
    {
        if (existingNames.Contains(name))
        {
            return;
        }

        teams.Add(new Team
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            DepartmentId = departmentId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static async Task AssignTicketCategoriesToTeamsAsync(
        AppDbContext context)
    {
        try
        {
            var teamIdsByName = await context.Teams
                .Where(team => team.IsActive)
                .ToDictionaryAsync(team => team.Name, team => team.Id);

            var categoryTeamNames = new Dictionary<string, string>
            {
                ["Software"] = "Software Support",
                ["Hardware"] = "Hardware Support",
                ["Network / Internet"] = "Network Support",
                ["Email / Account Access"] = "Service Desk",
                ["Printer / Peripheral"] = "Service Desk",
                ["Access Request"] = "Service Desk",
                ["Other"] = "Service Desk"
            };

            var categories = await context.TicketCategories
                .Where(category =>
                    category.IsActive &&
                    category.DefaultTeamId == null)
                .ToListAsync();

            foreach (var category in categories)
            {
                if (categoryTeamNames.TryGetValue(
                        category.Name,
                        out var teamName) &&
                    teamIdsByName.TryGetValue(teamName, out var teamId))
                {
                    category.DefaultTeamId = teamId;
                }
            }
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            Console.WriteLine(
                "[DataSeeder Warning] Category-team assignments could not be created because a required table was not found.");
        }
    }
}
