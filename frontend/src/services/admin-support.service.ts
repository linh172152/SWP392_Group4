import { API_BASE_URL } from "../config/api";
import authFetch from "./apiClient";

export interface SupportTicket {
  ticket_id: string;
  ticket_number?: string;
  title?: string;
  subject?: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  user_id: string;
  assigned_to?: string | null;
  assigned_to_staff_id?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  user?: {
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  assigned_staff?: {
    user_id: string;
    full_name: string;
    email: string;
  } | null;
  replies?: SupportReply[];
  _count?: {
    replies: number;
  };
}

export interface SupportReply {
  reply_id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  user?: {
    user_id: string;
    full_name: string;
    email: string;
  };
}

export interface GetTicketsParams {
  page?: number;
  limit?: number;
  status?: "open" | "in_progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
  assigned_to?: string;
  search?: string;
}

export interface AssignTicketData {
  staff_id: string;
}

export interface ReplyTicketData {
  message: string;
}

export interface UpdateTicketStatusData {
  status: "open" | "in_progress" | "resolved" | "closed";
  resolution_note?: string;
}

/**
 * Get all support tickets (Admin only)
 */
export async function getAdminTickets(params?: GetTicketsParams) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.priority) query.set("priority", params.priority);
  if (params?.category) query.set("category", params.category);
  // Map assigned_to to assigned parameter expected by backend
  if (params?.assigned_to) {
    if (params.assigned_to === "assigned") {
      query.set("assigned", "true");
    } else if (params.assigned_to === "unassigned") {
      query.set("assigned", "false");
    } else {
      query.set("assigned", params.assigned_to);
    }
  }
  if (params?.search) query.set("search", params.search);

  const url = `${API_BASE_URL}/admin/support${
    query.toString() ? `?${query.toString()}` : ""
  }`;
  const res = await authFetch(url);
  return res;
}

/**
 * Get ticket details with replies (Admin only)
 */
export async function getAdminTicketDetails(ticketId: string) {
  const url = `${API_BASE_URL}/admin/support/${ticketId}`;
  const res = await authFetch(url);
  return res;
}

/**
 * Assign ticket to staff member (Admin only)
 */
export async function assignTicket(ticketId: string, data: AssignTicketData) {
  const url = `${API_BASE_URL}/admin/support/${ticketId}/assign`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res;
}

/**
 * Reply to support ticket as admin
 */
export async function replyToTicket(ticketId: string, data: ReplyTicketData) {
  const url = `${API_BASE_URL}/admin/support/${ticketId}/reply`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res;
}

/**
 * Update ticket status (Admin only)
 */
export async function updateTicketStatus(
  ticketId: string,
  data: UpdateTicketStatusData
) {
  const url = `${API_BASE_URL}/admin/support/${ticketId}/status`;
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res;
}

export default {
  getAdminTickets,
  getAdminTicketDetails,
  assignTicket,
  replyToTicket,
  updateTicketStatus,
};
