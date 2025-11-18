/**
 * Booking-related TypeScript interfaces
 * Used across the application for type safety
 */

export interface Booking {
  id: string;
  userId: string | null;
  cleanerId: string;
  cleanerName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceId?: string;
  cleaningType: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  duration: number;
  amount: number;
  platformFee: number;
  cleanerAmount: number;
  currency: string;
  status: BookingStatus;
  payoutStatus: PayoutStatus;
  createdAt: string;

  // Acceptance/Rejection fields (for request system)
  requestExpiresAt?: string; // ISO timestamp for when request expires
  acceptedAt?: string; // when cleaner accepted
  rejectedAt?: string; // when cleaner rejected
  rejectionReason?: string; // optional reason for rejection

  // MVP-specific fields (Book now, pay later)
  confirmationToken?: string; // Token for cleaner confirmation
  confirmationMethod?: string | null; // How cleaner confirmed (email/dashboard/whatsapp)
  cleanerConfirmedAt?: string | null; // When cleaner confirmed
  cleanerInvoiced?: boolean; // Whether cleaner sent invoice to customer
  clientPaid?: boolean; // Whether customer paid the invoice

  // Cancellation fields
  cancelledAt?: string;
  cancelledBy?: string;
  refundAmount?: number;
  refundStatus?: RefundStatus;
  refundedAt?: string;
  refundId?: string | null; // Stripe refund ID

  // Rescheduling fields
  rescheduledAt?: string;
  originalDate?: string;
  originalStart?: string;
  originalEnd?: string;

  // Completion fields
  completedAt?: string;

  // Payment tracking
  paymentIntentId?: string;
  stripeSessionId?: string;
  createdVia?: "webhook" | "client";
  paymentCaptured?: boolean; // Whether payment has been captured (manual capture)
}

export type BookingStatus =
  | "pending_acceptance"           // Customer paid (Stripe), awaiting cleaner acceptance
  | "pending_cleaner_confirmation" // MVP: No payment yet, awaiting cleaner confirmation
  | "confirmed"                    // Cleaner accepted, booking confirmed
  | "completed"                    // Service completed
  | "cancelled"                    // Cancelled by customer or cleaner
  | "rejected"                     // Cleaner rejected the request
  | "expired";                     // Request expired (cleaner didn't respond in time)

export type PayoutStatus = "pending" | "paid" | "failed";
export type RefundStatus = "none" | "pending" | "partial" | "full" | "failed";

export interface CancelBookingRequest {
  bookingId: string;
}

export interface CancelBookingResponse {
  success: boolean;
  message: string;
  refundAmount?: number;
  booking?: Booking;
}

export interface RescheduleBookingRequest {
  bookingId: string;
  newDate: string;
  newStart: string;
  newEnd: string;
}

export interface RescheduleBookingResponse {
  success: boolean;
  message: string;
  booking?: Booking;
}

export interface AcceptBookingRequest {
  bookingId: string;
  cleanerId: string; // verify cleaner is authorized
}

export interface AcceptBookingResponse {
  success: boolean;
  message: string;
  booking?: Booking;
}

export interface RejectBookingRequest {
  bookingId: string;
  cleanerId: string; // verify cleaner is authorized
  reason?: string;
}

export interface RejectBookingResponse {
  success: boolean;
  message: string;
  alternativeCleaners?: AlternativeCleaner[];
}

export interface AlternativeCleaner {
  id: string;
  name: string;
  username?: string;
  email: string;
  photoUrl?: string;
  pricePerHour: number;
  rating?: number;
  nextAvailable: string; // ISO timestamp or "Available for this slot"
  bookingUrl: string; // Direct link to book with this cleaner
}
