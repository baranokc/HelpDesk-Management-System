using backend.DTO.Lookup;

namespace backend.Services.Lookup;

public interface ILookupService
{
    Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetCategoriesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetSubCategoriesAsync(Guid categoryId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetPrioritiesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetStatusesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetImpactLevelsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetUrgencyLevelsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetTeamsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TeamMemberLookupDto>> GetTeamMembersAsync(Guid teamId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LookupItemDto<int>>> GetDepartmentsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetRolesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetResolutionCategoriesAsync(CancellationToken cancellationToken = default);
    IReadOnlyCollection<EnumLookupItemDto> GetRequestTypes();
}
