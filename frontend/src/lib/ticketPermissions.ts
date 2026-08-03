import type { User } from "@/src/context/AuthContext";

interface TicketOwnership {
  createdById: string;
  assignedToId?: string | null;
  teamId?: string | null;
}

export function canManageTicket(
  user: User | null,
  ticket: TicketOwnership,
): boolean {
  if (!user) return false;

  switch (user.role) {
    case "Admin":
      return true;
    case "TeamLeader":
      return Boolean(ticket.teamId && user.ledTeamIds.includes(ticket.teamId),);
    case "SupportAgent":
      return ticket.createdById === user.id || ticket.assignedToId === user.id;
    case "User":
      return ticket.createdById === user.id;
    default:
      return false;
  }
}

export function getTicketViewLabel(role?: string): {
  title: string;
  description: string;
  navigationLabel: string;
} {
  switch (role) {
    case "Admin":
      return {
        title: "All Tickets",
        description: "View and manage every helpdesk request.",
        navigationLabel: "All Tickets",
      };
    case "SupportAgent":
      return {
        title: "My and Assigned Tickets",
        description: "View tickets you created or that are assigned to you.",
        navigationLabel: "My + Assigned",
      };
    case "TeamLeader":
      return {
        title: "My Team's Tickets",
        description: "View and assign tickets that belong to teams you lead.",
        navigationLabel: "My Team",
      };
    default:
      return {
        title: "My Tickets",
        description: "View and manage the helpdesk requests you created.",
        navigationLabel: "My Tickets",
      };
  }
}
