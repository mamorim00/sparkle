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
  cancelledAt?: string;
  cancelledBy?: string;
  rescheduledAt?: string;
  originalDate?: string;
  originalStart?: string;
  originalEnd?: string;
  paymentIntentId?: string;
  stripeSessionId?: string;
  createdVia?: "webhook" | "client";
  refundAmount?: number;
  refundStatus?: RefundStatus;
  refundedAt?: string;
}

export type BookingStatus = "confirmed" | "cancelled" | "completed";
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
