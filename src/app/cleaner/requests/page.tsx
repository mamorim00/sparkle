"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { Calendar, Clock, DollarSign, User as UserIcon, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import type { Booking } from "../../../types/booking";

export default function CleanerRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchPendingRequests(currentUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPendingRequests = async (cleanerId: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "bookings"),
        where("cleanerId", "==", cleanerId),
        where("status", "==", "pending_acceptance")
      );

      const querySnapshot = await getDocs(q);
      const requests: Booking[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Booking));

      // Sort by expiration time (most urgent first)
      requests.sort((a, b) => {
        const expiresA = new Date(a.requestExpiresAt || 0).getTime();
        const expiresB = new Date(b.requestExpiresAt || 0).getTime();
        return expiresA - expiresB;
      });

      setPendingRequests(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (booking: Booking) => {
    if (!user) return;

    setProcessingId(booking.id);
    try {
      const response = await fetch("/api/bookings/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          bookingId: booking.id,
          cleanerId: user.uid,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Booking accepted! The customer has been notified.");
        // Refresh the list
        await fetchPendingRequests(user.uid);
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error accepting booking:", error);
      alert("❌ Failed to accept booking. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedBooking) return;

    setProcessingId(selectedBooking.id);
    try {
      const response = await fetch("/api/bookings/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          bookingId: selectedBooking.id,
          cleanerId: user.uid,
          reason: rejectionReason || "Not available",
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Booking rejected. The customer has been refunded.");
        setShowRejectModal(false);
        setRejectionReason("");
        setSelectedBooking(null);
        // Refresh the list
        await fetchPendingRequests(user.uid);
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error rejecting booking:", error);
      alert("❌ Failed to reject booking. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedBooking(null);
    setRejectionReason("");
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return "Unknown";

    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isUrgent = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;
    return diff > 0 && diff < 2 * 60 * 60 * 1000; // Less than 2 hours
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-lg mt-4 text-gray-600">Loading pending requests...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
        <p className="text-gray-600 mb-6">You need to be logged in as a cleaner to view booking requests.</p>
        <Link
          href="/auth/login"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Requests</h1>
          <p className="text-gray-600">Review and respond to customer booking requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-3xl font-bold text-orange-600">{pendingRequests.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgent ({"<"}2h)</p>
                <p className="text-3xl font-bold text-red-600">
                  {pendingRequests.filter((r) => isUrgent(r.requestExpiresAt)).length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Potential Earnings</p>
                <p className="text-3xl font-bold text-green-600">
                  €{pendingRequests.reduce((sum, r) => sum + (r.cleanerAmount || 0), 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Requests List */}
        {pendingRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const timeRemaining = getTimeRemaining(request.requestExpiresAt);
              const urgent = isUrgent(request.requestExpiresAt);
              const isProcessing = processingId === request.id;

              return (
                <div
                  key={request.id}
                  className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all ${
                    urgent ? "border-red-400 bg-red-50" : "border-orange-300 bg-orange-50"
                  }`}
                >
                  {/* Status and Time Badges */}
                  <div className="flex items-center flex-wrap gap-2 mb-4">
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold border border-orange-300">
                      ⏳ Awaiting Response
                    </span>
                    {urgent ? (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold border border-red-300 animate-pulse">
                        🚨 URGENT - Expires in {timeRemaining}
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold border border-blue-300">
                        ⏰ Expires in {timeRemaining}
                      </span>
                    )}
                  </div>

                  {/* Service Type Header */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{request.cleaningType}</h3>

                  {/* Earnings Display - Prominent */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 mb-1 font-medium">💰 Your Earnings:</p>
                        <p className="text-3xl font-bold text-green-600">
                          €{(request.cleanerAmount || request.amount * 0.85).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                        <p className="text-lg font-semibold text-gray-700">€{request.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{request.duration}h service</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Customer Details:</p>
                    <div className="space-y-2">
                      <p className="text-gray-900 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold">{request.customerName}</span>
                      </p>
                      <p className="text-gray-700 text-sm pl-6">{request.customerEmail}</p>
                      {request.customerPhone && (
                        <p className="text-gray-700 text-sm pl-6">📱 {request.customerPhone}</p>
                      )}
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">{formatDate(request.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">
                        {request.start} - {request.end}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAccept(request)}
                      disabled={isProcessing}
                      className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {isProcessing ? "Processing..." : "Accept Booking"}
                    </button>
                    <button
                      onClick={() => openRejectModal(request)}
                      disabled={isProcessing}
                      className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-5 h-5" />
                      {isProcessing ? "Processing..." : "Reject"}
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 mt-4 border-t border-gray-200 text-xs text-gray-500">
                    <p>Request ID: {request.id.slice(0, 8)}...</p>
                    <p>Received: {new Date(request.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Requests</h3>
            <p className="text-gray-600 mb-6">
              You are all caught up! New booking requests will appear here.
            </p>
            <Link
              href="/cleaner/bookings"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              View My Bookings
            </Link>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Link href="/cleaner-dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Dashboard
          </Link>
          <Link href="/cleaner/bookings" className="text-blue-600 hover:text-blue-700 font-medium">
            View Confirmed Bookings →
          </Link>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reject Booking Request?</h2>
            <p className="text-gray-600 mb-4">
              The customer will be refunded and notified. You can optionally provide a reason:
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Not available at this time, schedule conflict..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={closeRejectModal}
                disabled={processingId !== null}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingId !== null}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400"
              >
                {processingId ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
