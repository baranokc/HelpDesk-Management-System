using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.DTO.Ticket.Validator;
using backend.Services.Auth;
using backend.Services.Ticket;
using backend.Services.TicketAttachment;
using backend.Services.TicketComment;
using backend.Services.TicketHistory;
using backend.Services.TicketResolution;
using backend.Services.TicketStatus;
using backend.Services.TicketUnassignment;
using backend.Services.TicketAssignment;
using backend.Services.Lookup;
using backend.Hubs;
using backend.Services.Notification;
using backend.Services.TeamManagement;
using backend.Services.Category;
using backend.Services.Sla;
using backend.Services.Profile;
using backend.Services.TeamChat;
using Microsoft.OpenApi;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Http.Features;
using backend.Services.SatisfactionSurvey;
using backend.Services.Email;
using backend.Services.UserRoles;
using backend.Settings;

var builder = WebApplication.CreateBuilder(args);

// 🌟 CORS Ayarı: Tüm Origin'lere (NextJS dahil) tam izin veriyoruz
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJS", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) 
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddOpenApi();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<TicketCreateDtoValidator>();

var emailEnabled = builder.Configuration
    .GetValue<bool>("EmailSettings:Enabled");

if (emailEnabled)
{
    builder.Services
        .AddOptions<EmailSettings>()
        .Bind(builder.Configuration.GetSection(EmailSettings.SectionName))
        .ValidateDataAnnotations()
        .ValidateOnStart();

    builder.Services.AddScoped<IEmailService, SmtpEmailService>();
}
else
{
    builder.Services.AddScoped<IEmailService, DisabledEmailService>();
}

// 🌟 PostgreSQL URL Parsing (Render ve Canlı Ortam Dönüştürücüsü)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (!string.IsNullOrEmpty(connectionString) &&
    (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
     connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)))
{
    var databaseUri = new Uri(connectionString);
    var userInfo = databaseUri.UserInfo.Split(':', 2);
    var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
    var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
    var port = databaseUri.Port > 0 ? databaseUri.Port : 5432;
    var databaseName = databaseUri.AbsolutePath.TrimStart('/');

    connectionString = $"Server={databaseUri.Host};Port={port};Database={databaseName};User Id={username};Password={password};Ssl Mode=Require;Trust Server Certificate=true;";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 110L * 1024 * 1024;
});

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "HelpDesk API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT token değerini giriniz."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

builder.Services.AddScoped<ILookupService, LookupService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<ITicketAssignmentService, TicketAssignmentService>();
builder.Services.AddScoped<ITicketStatusService, TicketStatusService>();
builder.Services.AddScoped<ITicketCommentService, TicketCommentService>();
builder.Services.AddScoped<ITicketAttachmentService, TicketAttachmentService>();
builder.Services.AddScoped<ITicketUnassignmentService, TicketUnassignmentService>();
builder.Services.AddScoped<ITicketResolutionService, TicketResolutionService>();
builder.Services.AddScoped<ITicketHistoryService, TicketHistoryService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITeamManagementService, TeamManagementService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddSingleton<IBusinessTimeCalculator, BusinessTimeCalculator>();
builder.Services.AddScoped<ISlaService, SlaService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<ITeamChatService, TeamChatService>();
builder.Services.AddScoped<ISatisfactionSurveyService, SatisfactionSurveyService>();
builder.Services.AddScoped<IUserRoleService, UserRoleService>();
builder.Services.AddHostedService<SlaNotificationWorker>();

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(secretKey)
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrWhiteSpace(accessToken) &&
                (path.StartsWithSegments("/hubs/notifications") ||
                 path.StartsWithSegments("/hubs/team-chat")))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        },
        OnTokenValidated = async context =>
        {
            var userIdClaim =
                context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier) ??
                context.Principal?.FindFirstValue("sub");

            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                context.Fail("Invalid user identity.");
                return;
            }

            var db = context.HttpContext.RequestServices
                .GetRequiredService<AppDbContext>();

            var currentUser = await db.Users
                .AsNoTracking()
                .Where(user => user.Id == userId)
                .Select(user => new
                {
                    user.IsActive,
                    RoleName = user.Role != null
                        ? user.Role.Name
                        : null,
                    RoleIsActive = user.Role != null && user.Role.IsActive,
                    user.SessionVersion
                })
                .SingleOrDefaultAsync();

            if (currentUser is null ||
                !currentUser.IsActive ||
                !currentUser.RoleIsActive ||
                string.IsNullOrWhiteSpace(currentUser.RoleName))
            {
                context.Fail("The user account or role is inactive.");
                return;
            }

            var sessionVersionClaim = context.Principal?
                .FindFirstValue("session_version");

            if (!int.TryParse(sessionVersionClaim, out var sessionVersion) ||
                sessionVersion != currentUser.SessionVersion)
            {
                context.Fail("The user session is no longer valid.");
                return;
            }

            if (context.Principal?.Identity is not ClaimsIdentity identity)
            {
                context.Fail("Invalid claims identity.");
                return;
            }

            foreach (var roleClaim in identity
                .FindAll(ClaimTypes.Role)
                .ToList())
            {
                identity.RemoveClaim(roleClaim);
            }

            foreach (var teamClaim in identity
                .FindAll("led_team_ids")
                .ToList())
            {
                identity.RemoveClaim(teamClaim);
            }

            identity.AddClaim(new Claim(
                ClaimTypes.Role,
                currentUser.RoleName));

            if (currentUser.RoleName == backend.Constants.Roles.TeamLeader)
            {
                var ledTeamIds = await db.TeamMembers
                    .AsNoTracking()
                    .Where(teamMember =>
                        teamMember.UserId == userId &&
                        teamMember.RoleInTeam ==
                            backend.Entities.TeamMemberRole.TeamLeader &&
                        teamMember.IsActive &&
                        teamMember.Team.IsActive)
                    .Select(teamMember => teamMember.TeamId)
                    .Distinct()
                    .ToListAsync();

                identity.AddClaim(new Claim(
                    "led_team_ids",
                    string.Join(",", ledTeamIds)));
            }
        }
    };
});

builder.Services.AddAuthorization();

var avatarDirectory = Path.Combine(
    builder.Environment.WebRootPath ??
        Path.Combine(builder.Environment.ContentRootPath, "wwwroot"),
    "uploads",
    "avatars");
Directory.CreateDirectory(avatarDirectory);

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await context.Database.MigrateAsync();
    await DataSeeder.SeedAsync(context);

    var userRoleService = scope.ServiceProvider
        .GetRequiredService<IUserRoleService>();
    await userRoleService.SynchronizeRoleMappingsAsync();
}

app.UseRouting();
app.UseCors("AllowNextJS");

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000");
    }
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<TeamChatHub>("/hubs/team-chat");

app.Run();
