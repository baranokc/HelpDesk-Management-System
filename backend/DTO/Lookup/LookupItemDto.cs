namespace backend.DTO.Lookup;

public class LookupItemDto<TId>
{
    public TId ItemId { get; set; } = default!;
    public string Name { get; set; } = string.Empty;
}