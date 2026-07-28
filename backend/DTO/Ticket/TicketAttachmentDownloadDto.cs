namespace backend.DTO.Ticket;

public class TicketAttachmentDownloadDto
{
    public string PhysicalPath { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public string FileName { get; set; } = string.Empty;
}
