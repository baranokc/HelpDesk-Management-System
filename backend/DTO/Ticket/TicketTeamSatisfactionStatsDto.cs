using System;

namespace backend.DTO.Ticket;

public class TeamSatisfactionStatsDto
{
    public Guid TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public double AverageRating { get; set; }
    public double AverageCommunicationRating { get; set; }
    public double AverageSolutionRating { get; set; }
    public int TotalSurveysCount { get; set; }
}