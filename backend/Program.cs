using System.Text;
using backend.Data;
using backend.DTO.Ticket.Validator;
using backend.DTO.Services.TicketAssignment;
using backend.Services.Auth;
using backend.Services.Ticket;
using backend.Services.TicketAttachment;
using backend.Services.TicketComment;
using backend.Services.TicketHistory;
using backend.Services.TicketResolution;
using backend.Services.TicketStatus;
using backend.Services.TicketUnassignment;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FluentValidation;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<TicketCreateDtoValidator>();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddControllers();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITicketService, TicketService>();

builder.Services.AddScoped<ITicketStatusService, TicketStatusService>();
builder.Services.AddScoped<ITicketAssignmentService, TicketAssignmentService>();

builder.Services.AddScoped<ITicketCommentService, TicketCommentService>();
builder.Services.AddScoped<ITicketAttachmentService, TicketAttachmentService>();
builder.Services.AddScoped<ITicketUnassignmentService, TicketUnassignmentService>();
builder.Services.AddScoped<ITicketResolutionService, TicketResolutionService>();
builder.Services.AddScoped<ITicketHistoryService, TicketHistoryService>();

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
});

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
