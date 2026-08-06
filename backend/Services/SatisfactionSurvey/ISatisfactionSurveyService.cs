using System;
using System.Threading;
using System.Threading.Tasks;
using backend.DTO.Ticket;

namespace backend.Services.SatisfactionSurvey;

public interface ISatisfactionSurveyService
{
    Task<SatisfactionSurveyDto?> SubmitSurveyAsync(
        Guid ticketId,
        CreateSatisfactionSurveyDto dto,
        Guid userId,
        CancellationToken cancellationToken);

    Task<SatisfactionSurveyDto?> GetSurveyByTicketIdAsync(
        Guid ticketId,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken);

        Task<List<TeamSatisfactionStatsDto>> GetTeamSatisfactionStatsAsync(CancellationToken cancellationToken);
}