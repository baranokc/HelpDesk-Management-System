using System.Text.Json.Serialization;

namespace backend.DTO.Ticket;

public class CreateSatisfactionSurveyDto
{
    private int _communicationRating;
    private int _solutionRating;
    private int _speedRating;

    [JsonPropertyName("communicationRating")]
    public int CommunicationRating
    {
        get => _communicationRating;
        set => _communicationRating = value > 0 ? value : _communicationRating;
    }

    [JsonPropertyName("solutionRating")]
    public int SolutionRating
    {
        get => _solutionRating;
        set => _solutionRating = value > 0 ? value : _solutionRating;
    }

    [JsonPropertyName("speedRating")]
    public int SpeedRating
    {
        get => _speedRating;
        set => _speedRating = value > 0 ? value : _speedRating;
    }

    [JsonPropertyName("comment")]
    public string Comment { get; set; } = string.Empty;

    // Frontend'den gelebilecek alternatif JSON key isimleri için yedek bağlayıcılar:
    [JsonPropertyName("communication")]
    public int CommunicationAlias
    {
        set => _communicationRating = value > 0 ? value : _communicationRating;
    }

    [JsonPropertyName("solutionQuality")]
    public int SolutionQualityAlias
    {
        set => _solutionRating = value > 0 ? value : _solutionRating;
    }

    [JsonPropertyName("responseSpeed")]
    public int ResponseSpeedAlias
    {
        set => _speedRating = value > 0 ? value : _speedRating;
    }
}