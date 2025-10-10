"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User as UserIcon,
  Mail,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Ban,
} from "lucide-react";
import { Booking } from "../../../types/booking";

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [user, setUser] = useState<User | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchBooking();
      } else {
        // Allow viewing booking details without auth for guest bookings
        await fetchBooking();
      }
    });
    return () => unsubscribe();
  }, [bookingId]);

  const fetchBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        setError("Booking not found");
        return;
      }

      const bookingData = {
        id: bookingSnap.id,
        ...bookingSnap.data(),
      } as Booking;

      setBooking(bookingData);
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getHoursUntilService = () => {
    if (!booking) return 0;
    const bookingDateTime = new Date(`${booking.date}T${booking.start}`);
    const now = new Date();
    return (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  };

  const canCancel = () => {
    if (!booking || booking.status !== "confirmed") return false;
    const serviceDate = new Date(booking.date);
    return serviceDate > new Date();
  };

  const canReschedule = () => {
    if (!booking || booking.status !== "confirmed") return false;
    const serviceDate = new Date(booking.date);
    return serviceDate > new Date();
  };

  const handleCancel = async () => {
    if (!booking) return;

    const hoursUntil = getHoursUntilService();
    let confirmMessage = "Are you sure you want to cancel this booking?";

    if (hoursUntil < 24) {
      confirmMessage += "\n\n⚠️ Warning: Cancelling within 24 hours may result in a 50% refund only.";
    } else {
      confirmMessage += "\n\nYou will receive a full refund.";
    }

    if (!confirm(confirmMessage)) return;

    setCancelling(true);
    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `Booking cancelled successfully!\n\nRefund amount: €${data.refundAmount?.toFixed(2)}\nRefund will be processed within 5-7 business days.`
        );
        await fetchBooking(); // Refresh booking data
      } else {
        alert(`Failed to cancel booking: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again or contact support.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = () => {
    if (!booking) return null;

    const statusConfig = {
      confirmed: {
        icon: <CheckCircle className="w-5 h-5" />,
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Confirmed",
      },
      cancelled: {
        icon: <XCircle className="w-5 h-5" />,
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Cancelled",
      },
      completed: {
        icon: <CheckCircle className="w-5 h-5" />,
        color: "bg-gray-100 text-gray-800 border-gray-200",
        label: "Completed",
      },
    };

    const config = statusConfig[booking.status];

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${config.color}`}>
        {config.icon}
        <span className="font-semibold">{config.label}</span>
      </div>
    );
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

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
        <p className="text-gray-600 mb-6">{error || "This booking does not exist or you don't have permission to view it."}</p>
        <Link
          href="/user/bookings"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Back to My Bookings
        </Link>
      </div>
    );
  }

  const hoursUntilService = getHoursUntilService();
  const isUpcoming = hoursUntilService > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/user/bookings"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Bookings
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{booking.cleaningType}</h1>
              <p className="text-gray-600">Booking ID: {booking.id}</p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Cancellation Warning */}
          {booking.status === "confirmed" && isUpcoming && hoursUntilService < 24 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Within 24-hour cancellation window</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Cancelling now may result in a 50% refund. Free cancellation is available up to 24 hours before the service.
                </p>
              </div>
            </div>
          )}

          {/* Rescheduled Notice */}
          {booking.rescheduledAt && booking.originalDate && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Rescheduled:</strong> Originally booked for {formatDate(booking.originalDate)} at {booking.originalStart} - {booking.originalEnd}
              </p>
            </div>
          )}
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Service Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold text-gray-900">{formatDate(booking.date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold text-gray-900">
                  {booking.start} - {booking.end} ({booking.duration}h)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserIcon className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Cleaner</p>
                <p className="font-semibold text-gray-900">{booking.cleanerName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold text-gray-900">{booking.customerName}</p>
                <p className="text-sm text-gray-600">{booking.customerEmail}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Service Amount</span>
              <span className="font-semibold text-gray-900">€{booking.amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Platform Fee (15%)</span>
              <span className="font-semibold text-gray-900">€{booking.platformFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Cleaner Receives (85%)</span>
              <span className="font-semibold text-gray-900">€{booking.cleanerAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mt-2">
              <span className="font-bold text-gray-900">Total Paid</span>
              <span className="font-bold text-2xl text-gray-900">€{booking.amount.toFixed(2)}</span>
            </div>

            {booking.refundAmount && booking.refundAmount > 0 && (
              <div className="flex justify-between items-center py-2 text-green-600">
                <span className="font-semibold">Refund Amount</span>
                <span className="font-bold">€{booking.refundAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-3 space-y-2 text-sm text-gray-600">
              <p>
                <strong>Payment Status:</strong> {booking.payoutStatus}
              </p>
              <p>
                <strong>Currency:</strong> {booking.currency.toUpperCase()}
              </p>
              <p>
                <strong>Booked on:</strong> {new Date(booking.createdAt).toLocaleString()}
              </p>
              {booking.cancelledAt && (
                <p className="text-red-600">
                  <strong>Cancelled on:</strong> {new Date(booking.cancelledAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {booking.status === "confirmed" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              {canReschedule() && (
                <Link
                  href={`/booking/${booking.id}/reschedule`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reschedule Booking
                </Link>
              )}

              {canCancel() && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Ban className="w-5 h-5" />
                  {cancelling ? "Cancelling..." : "Cancel Booking"}
                </button>
              )}
            </div>

            {/* Cancellation Policy */}
            {canCancel() && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Free cancellation up to 24 hours before service</li>
                  <li>50% refund if cancelled within 24 hours of service</li>
                  <li>Refunds are processed within 5-7 business days</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Completed Status - Review Option */}
        {booking.status === "completed" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Completed</h3>
            <p className="text-gray-600 mb-4">We hope you enjoyed your cleaning service!</p>
            <button
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              onClick={() => alert("Review feature coming soon!")}
            >
              Leave a Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
