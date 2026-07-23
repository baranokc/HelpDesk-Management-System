namespace  backend.Entities;

public class TicketAttachment
{
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; } = long.Empty;

    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;
    public Guid? TicketCommentId { get; set; }
    public TicketComment? TicketComment { get; set; } 
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public Guid UploaderID { get; set; }
    public User Uploader { get; set; } = null!;

}