using backend.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using System.Security.Claims;
using System.Text.Json;

namespace backend.Data;

public class AppDbContext : DbContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        IHttpContextAccessor httpContextAccessor)
        : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public DbSet<Department> Departments { get; set; }
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Team> Teams { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<TeamMember> TeamMembers { get; set; } = null!;
    public DbSet<TeamMemberShift> TeamMemberShifts { get; set; } = null!;
    public DbSet<TeamMemberLeave> TeamMemberLeaves { get; set; } = null!;
    public DbSet<TeamChatMessage> TeamChatMessages { get; set; } = null!;
    public DbSet<UserRole> UserRoles { get; set; } = null!;
    public DbSet<Ticket> Tickets { get; set; } = null!;
    public DbSet<TicketAssignment> TicketAssignments { get; set; } = null!;
    public DbSet<TicketAttachment> TicketAttachments { get; set; } = null!;
    public DbSet<TicketCategory> TicketCategories { get; set; } = null!;
    public DbSet<TicketComment> TicketComments { get; set; } = null!;
    public DbSet<TicketPriority> TicketPriorities { get; set; } = null!;
    public DbSet<TicketStatus> TicketStatuses { get; set; } = null!;
    public DbSet<TicketStatusHistory> TicketStatusHistories { get; set; } = null!;
    public DbSet<TicketSubCategory> TicketSubCategories { get; set; } = null!;
    public DbSet<UrgencyLevel> UrgencyLevels { get; set; } = null!;
    public DbSet<Asset> Assets { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<AssetAssignment> AssetAssignments { get; set; } = null!;
    public DbSet<AssetStatus> AssetStatuses { get; set; } = null!;
    public DbSet<AssetType> AssetTypes { get; set; } = null!;
    public DbSet<ImpactLevel> ImpactLevels { get; set; } = null!;
    public DbSet<TicketHistory> TicketHistories { get; set; } = null!;
    public DbSet<ResolutionCategory> ResolutionCategories { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<SlaPolicy> SlaPolicies { get; set; } = null!;
    public DbSet<SlaRecord> SlaRecords { get; set; } = null!;
    public DbSet<SlaPause> SlaPauses { get; set; } = null!;
    public DbSet<SlaCalendar> SlaCalendars { get; set; } = null!;
    public DbSet<SlaWorkingPeriod> SlaWorkingPeriods { get; set; } = null!;
    public DbSet<SlaHoliday> SlaHolidays { get; set; } = null!;
    public DbSet<SatisfactionSurvey> SatisfactionSurveys { get; set; } = null!;
    public DbSet<FaqItem> FaqItems { get; set; } = null!;
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; } = null!;

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var httpContext = _httpContextAccessor.HttpContext;

        Guid? userId = null;
        string? ipAddress = null;

        if (httpContext != null)
        {
            if (httpContext.User?.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                                  httpContext.User.FindFirstValue("sub");
                if (Guid.TryParse(userIdClaim, out var parsedId))
                {
                    userId = parsedId;
                }
            }

            ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            if (ipAddress == "::1") ipAddress = "127.0.0.1";
        }

        ChangeTracker.DetectChanges();
        var auditEntries = new List<AuditLog>();

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog ||
                entry.Entity is PasswordResetToken ||
                entry.Entity is TeamChatMessage ||
                entry.State == EntityState.Detached ||
                entry.State == EntityState.Unchanged)
                continue;

            var auditEntry = new AuditLog
            {
                UserId = userId,
                EntityName = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            };

            var primaryKey = entry.Metadata.FindPrimaryKey();
            var primaryKeyProperty = primaryKey?.Properties.FirstOrDefault();
            if (primaryKeyProperty != null)
            {
                var keyValue = entry.Property(primaryKeyProperty.Name).CurrentValue;
                if (keyValue is Guid gVal)
                {
                    auditEntry.EntityId = gVal;
                }
                else if (keyValue != null && Guid.TryParse(keyValue.ToString(), out var parsedGuid))
                {
                    auditEntry.EntityId = parsedGuid;
                }
            }

            var oldValues = new Dictionary<string, object>();
            var newValues = new Dictionary<string, object>();

            foreach (var property in entry.Properties)
            {
                if (property.IsTemporary) continue;

                string propertyName = property.Metadata.Name;

                if (entry.Entity is User && propertyName == nameof(User.PasswordHash))
                    continue;

                if (property.Metadata.IsPrimaryKey())
                {
                    if (auditEntry.EntityId == null && property.CurrentValue != null)
                    {
                        if (Guid.TryParse(property.CurrentValue.ToString(), out var pkGuid))
                        {
                            auditEntry.EntityId = pkGuid;
                        }
                    }
                    continue;
                }

                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.Action = "CREATE";
                        newValues[propertyName] = property.CurrentValue ?? "";
                        break;

                    case EntityState.Deleted:
                        auditEntry.Action = "DELETE";
                        oldValues[propertyName] = property.OriginalValue ?? "";
                        break;

                    case EntityState.Modified:
                        if (property.IsModified)
                        {
                            auditEntry.Action = "UPDATE";
                            oldValues[propertyName] = property.OriginalValue ?? "";
                            newValues[propertyName] = property.CurrentValue ?? "";
                        }
                        break;
                }
            }

            auditEntry.OldValues = oldValues.Count == 0 ? null : JsonSerializer.Serialize(oldValues);
            auditEntry.NewValues = newValues.Count == 0 ? null : JsonSerializer.Serialize(newValues);

            if (!string.IsNullOrEmpty(auditEntry.Action))
            {
                auditEntries.Add(auditEntry);
            }
        }

        var result = await base.SaveChangesAsync(cancellationToken);

        if (auditEntries.Count > 0)
        {
            foreach (var audit in auditEntries)
            {
                base.Add(audit);
            }
            await base.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserRole>()
            .HasKey(ur => new { ur.UserId, ur.RoleId });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.Property(token => token.TokenHash)
                .HasMaxLength(64)
                .IsRequired();

            entity.HasOne(token => token.User)
                .WithMany()
                .HasForeignKey(token => token.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(token => token.TokenHash).IsUnique();
            entity.HasIndex(token => new { token.UserId, token.ExpiresAt, token.UsedAt });
        });
        
        modelBuilder.Entity<User>()
            .HasOne(u => u.Manager)
            .WithMany(u => u.DirectReports)
            .HasForeignKey(u => u.ManagerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<UserRole>()
        .Property(ur => ur.AssignedAt)
        .HasDefaultValueSql("NOW()");

        modelBuilder.Entity<TeamMember>()
            .HasOne(tm => tm.Team)
            .WithMany(t => t.TeamMembers)
            .HasForeignKey(tm => tm.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.User)
            .WithMany(u => u.TeamMembers)
            .HasForeignKey(tm => tm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TeamMember>()
            .HasIndex(tm => new
            {
                tm.TeamId,
                tm.RoleInTeam,
                tm.IsActive
            })
            .HasDatabaseName("IX_TeamMembers_OneActiveLeaderPerTeam")
            .IsUnique()
            .HasFilter("\"IsActive\" = TRUE AND \"RoleInTeam\" = 2");

        modelBuilder.Entity<TeamMemberShift>(entity =>
        {
            entity.ToTable(
                "TeamMemberShift",
                table => table.HasCheckConstraint(
                    "CK_TeamMemberShift_StartBeforeEnd",
                    "\"StartTime\" < \"EndTime\""));

            entity.HasOne(shift => shift.TeamMember)
                .WithMany(member => member.Shifts)
                .HasForeignKey(shift => shift.TeamMemberId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(shift => new
                {
                    shift.TeamMemberId,
                    shift.DayOfWeek
                })
                .IsUnique();
        });

        modelBuilder.Entity<TeamMemberLeave>(entity =>
        {
            entity.ToTable(
                "TeamMemberLeave",
                table => table.HasCheckConstraint(
                    "CK_TeamMemberLeave_DateRange",
                    "\"StartDate\" <= \"EndDate\""));

            entity.Property(leave => leave.Reason)
                .HasMaxLength(500);

            entity.HasOne(leave => leave.TeamMember)
                .WithMany(member => member.Leaves)
                .HasForeignKey(leave => leave.TeamMemberId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(leave => leave.CreatedBy)
                .WithMany()
                .HasForeignKey(leave => leave.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(leave => new
                {
                    leave.TeamMemberId,
                    leave.StartDate,
                    leave.EndDate
                });
        });

        modelBuilder.Entity<TeamChatMessage>(entity =>
        {
            entity.Property(message => message.Content)
                .HasMaxLength(2000)
                .IsRequired();

            entity.HasOne(message => message.Team)
                .WithMany(team => team.ChatMessages)
                .HasForeignKey(message => message.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(message => message.Sender)
                .WithMany(user => user.TeamChatMessages)
                .HasForeignKey(message => message.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(message => new
                {
                    message.TeamId,
                    message.CreatedAt
                });
        });

        modelBuilder.Entity<Team>()
            .HasOne(t => t.Lead)
            .WithMany()
            .HasForeignKey(t => t.LeadId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Team>()
            .HasOne(team => team.SlaCalendar)
            .WithMany(calendar => calendar.Teams)
            .HasForeignKey(team => team.SlaCalendarId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.HasSequence<long>("TicketNumberSequence")
            .StartsAt(1)
            .IncrementsBy(1);

        modelBuilder.Entity<Ticket>()
            .HasIndex(x => x.TicketNumber)
            .IsUnique();

        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.CreatedBy)
            .WithMany(u => u.CreatedTickets)
            .HasForeignKey(t => t.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TicketCategory>()
            .HasOne(category => category.DefaultTeam)
            .WithMany(team => team.TicketCategories)
            .HasForeignKey(category => category.DefaultTeamId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(notification => notification.Type)
                .HasMaxLength(50);
            entity.Property(notification => notification.Title)
                .HasMaxLength(150);
            entity.Property(notification => notification.Message)
                .HasMaxLength(500);

            entity.HasOne(notification => notification.User)
                .WithMany(user => user.Notifications)
                .HasForeignKey(notification => notification.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(notification => notification.Ticket)
                .WithMany()
                .HasForeignKey(notification => notification.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(notification =>
                new { notification.UserId, notification.CreatedAt });
            entity.HasIndex(notification =>
                new { notification.UserId, notification.IsRead });
        });

        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.AssignedTo)
            .WithMany(u => u.AssignedTickets)
            .HasForeignKey(t => t.AssignedToId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Team)
            .WithMany(team => team.Tickets)
            .HasForeignKey(t => t.TeamId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TicketAssignment>(entity =>
        {
            entity.HasOne(ta => ta.AssignedByTeamMember)
                .WithMany(tm => tm.AssignmentsCreated)
                .HasForeignKey(ta => ta.AssignedById)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ta => ta.AssignedToTeamMember)
                .WithMany(tm => tm.AssignmentsReceived)
                .HasForeignKey(ta => ta.AssignedToId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.ResolvedBy)
            .WithMany(u => u.ResolvedTickets)
            .HasForeignKey(t => t.ResolvedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SlaPolicy>(entity =>
        {
            entity.ToTable("SlaPolicy");

            entity.HasOne(policy => policy.Priority)
                .WithMany(priority => priority.SlaPolicies)
                .HasForeignKey(policy => policy.PriorityId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(policy => policy.PriorityId)
                .HasDatabaseName("IX_SlaPolicy_OneActivePerPriority")
                .IsUnique()
                .HasFilter("\"IsActive\" = TRUE");
        });

        modelBuilder.Entity<SlaRecord>(entity =>
        {
            entity.ToTable("SlaRecord");

            entity.HasOne(record => record.Ticket)
                .WithMany(ticket => ticket.SlaRecords)
                .HasForeignKey(record => record.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(record => record.SlaPolicy)
                .WithMany(policy => policy.SlaRecords)
                .HasForeignKey(record => record.SlaPolicyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(record => record.SlaCalendar)
                .WithMany(calendar => calendar.SlaRecords)
                .HasForeignKey(record => record.SlaCalendarId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SlaCalendar>(entity =>
        {
            entity.ToTable("SlaCalendar");

            entity.Property(calendar => calendar.Name)
                .HasMaxLength(100);

            entity.Property(calendar => calendar.TimeZoneId)
                .HasMaxLength(100);

            entity.HasIndex(calendar => calendar.IsDefault)
                .HasDatabaseName("IX_SlaCalendar_OneActiveDefault")
                .IsUnique()
                .HasFilter("\"IsDefault\" = TRUE AND \"IsActive\" = TRUE");
        });

        modelBuilder.Entity<SlaWorkingPeriod>(entity =>
        {
            entity.ToTable(
                "SlaWorkingPeriod",
                table => table.HasCheckConstraint(
                    "CK_SlaWorkingPeriod_StartBeforeEnd",
                    "\"StartTime\" < \"EndTime\""));

            entity.HasOne(period => period.SlaCalendar)
                .WithMany(calendar => calendar.WorkingPeriods)
                .HasForeignKey(period => period.SlaCalendarId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(period => new
                {
                    period.SlaCalendarId,
                    period.DayOfWeek,
                    period.StartTime,
                    period.EndTime
                })
                .IsUnique();

        });

        modelBuilder.Entity<SlaHoliday>(entity =>
        {
            entity.ToTable("SlaHoliday");

            entity.Property(holiday => holiday.Name)
                .HasMaxLength(150);

            entity.HasOne(holiday => holiday.SlaCalendar)
                .WithMany(calendar => calendar.Holidays)
                .HasForeignKey(holiday => holiday.SlaCalendarId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(holiday => new
                {
                    holiday.SlaCalendarId,
                    holiday.Date
                })
                .IsUnique();
        });

        modelBuilder.Entity<SlaPause>(entity =>
        {
            entity.ToTable("SlaPause");

            entity.HasOne(pause => pause.SlaRecord)
                .WithMany(record => record.Pauses)
                .HasForeignKey(pause => pause.SlaRecordId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pause => pause.PausedBy)
                .WithMany()
                .HasForeignKey(pause => pause.PausedById)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Department>().HasData(
            new Department { Id = 1, Name = "Software" },
            new Department { Id = 2, Name = "Human Resources" },
            new Department { Id = 3, Name = "Information Technologies(IT)"},
            new Department { Id = 4, Name = "Customer Services"}
        );
    }
}
