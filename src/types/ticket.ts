export type TicketType = "dispute" | "refund" | "complaint" | "technical" | "other";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "cleaner" | "admin";
  message: string;
  timestamp: string;
  attachments?: string[];
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;

  // Ticket details
  type: TicketType;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;

  // Related entities (optional)
  bookingId?: string;
  cleanerId?: string;
  cleanerName?: string;

  // Messages thread
  messages: TicketMessage[];

  // Admin fields
  assignedTo?: string; // Admin user ID
  adminNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string; // Admin user ID

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketData {
  type: TicketType;
  subject: string;
  description: string;
  priority: TicketPriority;
  bookingId?: string;
  cleanerId?: string;
  cleanerName?: string;
}
