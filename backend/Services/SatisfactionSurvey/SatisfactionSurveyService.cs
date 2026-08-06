using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using backend.Data;
using backend.DTO.Ticket;
using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.SatisfactionSurvey;

public class SatisfactionSurveyService : ISatisfactionSurveyService
{
    private readonly AppDbContext _context;

    public SatisfactionSurveyService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<SatisfactionSurveyDto?> SubmitSurveyAsync(
        Guid ticketId,
        CreateSatisfactionSurveyDto dto,
        Guid userId,
        CancellationToken cancellationToken)
    {
        // 1. Puan Doğrulaması (1-5 arası)
        if (dto.CommunicationRating < 1 || dto.CommunicationRating > 5 ||
            dto.SolutionRating < 1 || dto.SolutionRating > 5 ||
            dto.SpeedRating < 1 || dto.SpeedRating > 5)
        {
            throw new ArgumentException("Ratings must be between 1 and 5.");
        }

        // 2. Bilet Kontrolü
        var ticket = await _context.Tickets
            .Include(t => t.Status)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket is null) return null;

        // 3. Durum Kontrolü
        var statusValue = ticket.Status?.Name ?? ticket.Status?.ToString() ?? string.Empty;

        bool isEligible = string.Equals(statusValue, "Resolved", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(statusValue, "Closed", StringComparison.OrdinalIgnoreCase) ||
                         statusValue == "2" || statusValue == "3";

        if (!isEligible)
        {
            throw new InvalidOperationException($"Satisfaction survey can only be submitted for resolved or closed tickets. Current status in DB: '{statusValue}'");
        }

        // 4. Kullanıcı Var mı Kontrolü
        var userExists = await _context.Users.AnyAsync(u => u.Id == userId, cancellationToken);
        if (!userExists)
        {
            throw new InvalidOperationException($"User with ID '{userId}' was not found in database.");
        }

        // 5. Tekrarlı Anket Kontrolü
        var existingSurvey = await _context.SatisfactionSurveys
            .AnyAsync(s => s.TicketId == ticketId, cancellationToken);

        if (existingSurvey)
        {
            throw new InvalidOperationException("A survey has already been submitted for this ticket.");
        }

        // 6. Kaydetme
        try
        {
            var overallRating = CalculateOverallRating(
                dto.CommunicationRating,
                dto.SolutionRating,
                dto.SpeedRating);

            var survey = new Entities.SatisfactionSurvey
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                UserId = userId,
                Rating = overallRating,
                CommunicationRating = dto.CommunicationRating,
                SolutionRating = dto.SolutionRating,
                SpeedRating = dto.SpeedRating,
                Comment = dto.Comment ?? string.Empty,
                CreatedAt = DateTime.UtcNow
            };

            _context.SatisfactionSurveys.Add(survey);
            await _context.SaveChangesAsync(cancellationToken);

            return new SatisfactionSurveyDto
            {
                Id = survey.Id,
                TicketId = survey.TicketId,
                UserId = survey.UserId,
                Rating = survey.Rating,
                CommunicationRating = survey.CommunicationRating,
                SolutionRating = survey.SolutionRating,
                SpeedRating = survey.SpeedRating,
                Comment = survey.Comment,
                CreatedAt = survey.CreatedAt
            };
        }
        catch (DbUpdateException ex)
        {
            var innerMessage = ex.InnerException?.Message ?? ex.Message;
            throw new InvalidOperationException($"Database save error: {innerMessage}");
        }
    }

    public async Task<SatisfactionSurveyDto?> GetSurveyByTicketIdAsync(
        Guid ticketId,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken)
    {
        var survey = await _context.SatisfactionSurveys
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TicketId == ticketId, cancellationToken);

        if (survey is null) return null;

        return new SatisfactionSurveyDto
        {
            Id = survey.Id,
            TicketId = survey.TicketId,
            UserId = survey.UserId,
            Rating = survey.Rating,
            CommunicationRating = survey.CommunicationRating,
            SolutionRating = survey.SolutionRating,
            SpeedRating = survey.SpeedRating,
            Comment = survey.Comment,
            CreatedAt = survey.CreatedAt
        };
    }

    public async Task<List<TeamSatisfactionStatsDto>> GetTeamSatisfactionStatsAsync(
        CancellationToken cancellationToken)
    {
        var teams = await _context.Teams
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var surveys = await _context.SatisfactionSurveys
            .AsNoTracking()
            .Include(s => s.Ticket)
            .ToListAsync(cancellationToken);

        var stats = teams.Select(team =>
        {
            var teamSurveys = surveys
                .Where(s => s.Ticket != null && s.Ticket.TeamId == team.Id)
                .ToList();

            var count = teamSurveys.Count;

            return new TeamSatisfactionStatsDto
            {
                TeamId = team.Id,
                TeamName = team.Name,
                TotalSurveysCount = count,
                AverageRating = count > 0 ? Math.Round(teamSurveys.Average(s => s.Rating), 1) : 0,
                AverageCommunicationRating = count > 0 ? Math.Round(teamSurveys.Average(s => s.CommunicationRating), 1) : 0,
                AverageSolutionRating = count > 0 ? Math.Round(teamSurveys.Average(s => s.SolutionRating), 1) : 0,
                AverageSpeedRating = count > 0 ? Math.Round(teamSurveys.Average(s => s.SpeedRating), 1) : 0
            };
        })
        .OrderByDescending(t => t.AverageRating)
        .ToList();

        return stats;
    }

    private static double CalculateOverallRating(
        int communicationRating,
        int solutionRating,
        int speedRating)
    {
        return Math.Round(
            (communicationRating + solutionRating + speedRating) / 3.0,
            1,
            MidpointRounding.AwayFromZero);
    }
}
