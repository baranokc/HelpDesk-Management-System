using backend.Entities;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Department> Departments { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Team> Teams { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<TeamMember> TeamMembers { get; set; } = null!;
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
    public DbSet<AssetAssignment> AssetAssignments { get; set; } = null!;
    public DbSet<AssetStatus> AssetStatuses { get; set; } = null!;
    public DbSet<AssetType> AssetTypes { get; set; } = null!;
    public DbSet<ImpactLevel> ImpactLevels { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<UserRole>()
            .HasKey(ur => new { ur.UserId, ur.RoleId });

        modelBuilder.Entity<Ticket>()
        .HasOne(t => t.CreatedBy)
        .WithMany()
        .HasForeignKey(t => t.CreatedById)
        .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
        .HasOne(t => t.AssignedTo)
        .WithMany()
        .HasForeignKey(t => t.AssignedToId)
        .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
        .HasOne(t => t.AssignedTo)
        .WithMany()
        .HasForeignKey(t => t.AssignedToId)
        .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
        .HasOne(t => t.Team)
        .WithMany()
        .HasForeignKey(t => t.TeamId);

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
    }
}

