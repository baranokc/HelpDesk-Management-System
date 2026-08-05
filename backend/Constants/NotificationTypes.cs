namespace backend.Constants;

public static class NotificationTypes
{
    public const string TicketCreated = "TicketCreated";
    public const string TicketAssigned = "TicketAssigned";
    public const string CommentAdded = "CommentAdded";
    public const string TicketStatusChanged = "TicketStatusChanged";
    public const string TicketResolved = "TicketResolved";
    public const string TicketClosed = "TicketClosed";
    public const string SlaFirstResponseDueSoon = "SlaFirstResponseDueSoon";
    public const string SlaResolutionDueSoon = "SlaResolutionDueSoon";
    public const string SlaFirstResponseBreached = "SlaFirstResponseBreached";
    public const string SlaResolutionBreached = "SlaResolutionBreached";
}
