using System;
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
        if (dto.Rating < 1 || dto.Rating > 5 ||
            dto.CommunicationRating < 1 || dto.CommunicationRating > 5 ||
            dto.SolutionRating < 1 || dto.SolutionRating > 5 ||
            dto.SpeedRating < 1 || dto.SpeedRating > 5)
        {
            throw new ArgumentException("Ratings must be between 1 and 5.");
        }

        // 2. Bilet Kontrolü
        var ticket = await _context.Tickets
            .AsNoTracking()
            .Include(t => t.Status)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket is null) return null;

        // 3. Durum Kontrolü
        if (!string.Equals(ticket.Status.Name, "Resolved", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(ticket.Status.Name, "Closed", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Satisfaction survey can only be submitted for resolved or closed tickets.");
        }

        // 4. Tekrarlı Anket Kontrolü
        var existingSurvey = await _context.SatisfactionSurveys
            .AnyAsync(s => s.TicketId == ticketId, cancellationToken);

        if (existingSurvey)
        {
            throw new InvalidOperationException("A survey has already been submitted for this ticket.");
        }

        // 5. Kaydetme
        var survey = new Entities.SatisfactionSurvey
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            UserId = userId,
            Rating = dto.Rating,
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
}
