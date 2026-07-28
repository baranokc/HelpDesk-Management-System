namespace backend.DTO.Lookup;

public class TeamMemberLookupDto
{
    public Guid TeamMemberId { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string RoleInTeam { get; set; } = string.Empty;
}