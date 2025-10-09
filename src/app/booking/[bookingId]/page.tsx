"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import {
  Calendar,
  Clock,
  DollarSign,
  User as UserIcon,
  MapPin,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit
} from "lucide-react";

interface Booking {
  id: string;
  userId: string;
  cleanerId: string;
  cleanerName: string;
  customerName: string;
  customerEmail: string;
  date: string;
  start: string;
  end: string;
  duration: number;
  cleaningType: string;
  amount: number;
  platformFee: number;
  cleanerAmount: number;
  status: "confirmed" | "cancelled" | "completed";
  payoutStatus?: "pending" | "paid";
  createdAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
  refundId?: string;
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [user, setUser] = useState<User | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchBooking(currentUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [bookingId]);

  const fetchBooking = async (userId: string) => {
    setLoading(true);
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (bookingSnap.exists()) {
        const data = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;

        // Check if user has access to this booking
        if (data.userId !== userId && data.cleanerId !== userId) {
          alert("You don't have access to this booking");
          router.push("/");
          return;
        }

        setBooking(data);
      } else {
        alert("Booking not found");
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      alert("Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const canCancel = () => {
    if (!booking || booking.status !== "confirmed") return false;

    // Check if booking is at least 24 hours away
    const bookingDateTime = new Date(`${booking.date}T${booking.start}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursUntilBooking >= 24;
  };

  const calculateRefund = () => {
    if (!booking) return 0;

    const bookingDateTime = new Date(`${booking.date}T${booking.start}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Full refund if cancelled 24+ hours before
    if (hoursUntilBooking >= 24) {
      return booking.amount;
    }

    // No refund if less than 24 hours
    return 0;
  };

  const handleCancelBooking = async () => {
    if (!booking || !user) return;

    setCancelling(true);
    try {
      const refundAmount = calculateRefund();

      // Call cancellation API
      const response = await fetch("/api/cancel-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          userId: user.uid,
          reason: cancellationReason || "No reason provided",
          refundAmount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel booking");
      }

      const result = await response.json();

      // Update local state
      setBooking({
        ...booking,
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancellationReason: cancellationReason || "No reason provided",
        refundAmount: result.refundAmount || 0,
        refundId: result.refundId,
      });

      setShowCancelModal(false);
      alert(`Booking cancelled successfully! ${result.refundAmount > 0 ? `Refund of €${result.refundAmount.toFixed(2)} will be processed.` : ""}`);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert(error instanceof Error ? error.message : "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-lg mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to view booking details.</p>
        <Link
          href="/auth/login"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  const isCustomer = user.uid === booking.userId;
  const isCleaner = user.uid === booking.cleanerId;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={isCustomer ? "/user/bookings" : "/cleaner/bookings"} className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block">
            ← Back to {isCustomer ? "My Bookings" : "My Jobs"}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Details</h1>
          <p className="text-gray-600">Booking ID: {booking.id.slice(0, 8)}...</p>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          {booking.status === "confirmed" && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 border-2 border-blue-200 font-semibold">
              <CheckCircle className="w-5 h-5" />
              Confirmed
            </span>
          )}
          {booking.status === "completed" && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 border-2 border-green-200 font-semibold">
              <CheckCircle className="w-5 h-5" />
              Completed
            </span>
          )}
          {booking.status === "cancelled" && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-800 border-2 border-red-200 font-semibold">
              <XCircle className="w-5 h-5" />
              Cancelled
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Service Information */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{booking.cleaningType}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Date</span>
                </div>
                <p className="text-lg pl-7">{formatDate(booking.date)}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Time</span>
                </div>
                <p className="text-lg pl-7">{booking.start} - {booking.end}</p>
                <p className="text-sm text-gray-600 pl-7">{booking.duration} hour service</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isCustomer ? "Cleaner Information" : "Customer Information"}
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 font-medium">
                  {isCustomer ? booking.cleanerName : booking.customerName}
                </span>
              </div>
              {isCustomer && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">Contact through platform</span>
                </div>
              )}
              {isCleaner && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${booking.customerEmail}`} className="text-blue-600 hover:text-blue-700">
                    {booking.customerEmail}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Service Amount</span>
                <span className="font-semibold text-gray-900">€{booking.amount.toFixed(2)}</span>
              </div>

              {isCleaner && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Platform Fee (15%)</span>
                    <span className="text-gray-600">-€{(booking.platformFee || booking.amount * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-gray-900 font-semibold">Your Earnings</span>
                    <span className="text-green-600 font-bold text-lg">€{(booking.cleanerAmount || booking.amount * 0.85).toFixed(2)}</span>
                  </div>
                  {booking.payoutStatus && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Payout Status</span>
                      <span className={booking.payoutStatus === "paid" ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                        {booking.payoutStatus === "paid" ? "Paid" : "Pending"}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="text-xs text-gray-500 pt-2">
                Booked on {new Date(booking.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            </div>
          </div>

          {/* Cancellation Information */}
          {booking.status === "cancelled" && (
            <div className="p-6 bg-red-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Cancellation Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Cancelled on</span>
                  <span className="text-gray-900">{booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleDateString() : "N/A"}</span>
                </div>
                {booking.cancellationReason && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Reason</span>
                    <span className="text-gray-900">{booking.cancellationReason}</span>
                  </div>
                )}
                {booking.refundAmount !== undefined && (
                  <div className="flex justify-between font-semibold pt-2 border-t border-red-200">
                    <span className="text-gray-900">Refund Amount</span>
                    <span className="text-green-600">€{booking.refundAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {booking.status === "confirmed" && (
            <div className="p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                {isCustomer && (
                  <>
                    <button
                      onClick={() => router.push(`/booking/${booking.id}/reschedule`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                      <Edit className="w-5 h-5" />
                      Reschedule Booking
                    </button>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      disabled={!canCancel()}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-5 h-5" />
                      Cancel Booking
                    </button>
                  </>
                )}
                {isCleaner && booking.status === "confirmed" && new Date(booking.date) < new Date() && (
                  <button
                    onClick={async () => {
                      if (confirm("Mark this job as completed?")) {
                        await updateDoc(doc(db, "bookings", booking.id), { status: "completed" });
                        setBooking({ ...booking, status: "completed" });
                      }
                    }}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>

              {!canCancel() && isCustomer && booking.status === "confirmed" && (
                <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Cancellations must be made at least 24 hours before the scheduled time for a full refund.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Booking</h3>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">Are you sure you want to cancel this booking?</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-900">Refund: €{calculateRefund().toFixed(2)}</p>
                <p className="text-blue-700 text-xs mt-1">
                  {calculateRefund() === booking.amount
                    ? "Full refund (24+ hours notice)"
                    : "No refund (less than 24 hours notice)"}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                rows={3}
                placeholder="Let us know why you're cancelling..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
