namespace backend.DTO.Ticket;
public class TicketAttachmentDto
{
    public Guid Id {get; set;}
    public string FileName {get; set;} = string.Empty;
    public string ContentType {get; set; } = string.Empty;
    public long FileSize {get; set;}
    public string DownloadUrl {get; set; } = string.Empty;
    public Guid? CommentId {get; set; }
    public Guid UploadedById {get; set; }
    public string? UploadedByName {get; set; }
    public DateTime UploadedAt {get; set; }
}