namespace backend.DTO.Common;
public class PagedResultDto<T>
{
    public IReadOnlyCollection<T> Items {get; set; } = [];
    public int PageNumber {get; set; }
    public int PageSize {get; set; }
    public int TotalCount {get; set; }
    public int TotalPages {get; set; }
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
    public PagedResultDto () {}
    public PagedResultDto (List<T> items, int pageNumber, int pageSize, int totalCount, int totalPages)
    {
        Items = items;
        PageNumber = pageNumber;
        PageSize = pageSize;
        TotalCount = totalCount;
        TotalPages = totalPages;
    }
}