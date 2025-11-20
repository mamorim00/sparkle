"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { Calendar, Clock, DollarSign, User as UserIcon, CheckCircle } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";

interface Booking {
  id: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  start: string;
  end: string;
  cleaningType: string;
  amount: number;
  platformFee: number;
  cleanerAmount: number;
  currency: string;
  status: "pending_acceptance" | "pending_cleaner_confirmation" | "confirmed" | "cancelled" | "completed" | "rejected" | "expired";
  createdAt: string;
  duration: number;
  completedAt?: string;
  cancelledAt?: string;
  requestExpiresAt?: string;
  cleanerInvoiced?: boolean;
  invoicedAt?: string;
  cleanerId?: string;
}

type TabType = "requests" | "upcoming" | "completed" | "cancelled";

export default function CleanerBookingsPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const [mounted, setMounted] = useState(false);
  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);
  const [invoicingBookingId, setInvoicingBookingId] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchBookings(currentUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchBookings = async (cleanerId: string) => {
    setLoading(true);
    try {
      // Query without orderBy to avoid index requirement - we'll sort client-side
      const q = query(
        collection(db, "bookings"),
        where("cleanerId", "==", cleanerId)
      );

      const querySnapshot = await getDocs(q);
      const bookingsData: Booking[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Booking));

      // Sort client-side by date descending
      bookingsData.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    if (!user) return;

    setCompletingBookingId(bookingId);
    setCompletionMessage(null);

    try {
      const response = await fetch("/api/complete-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, cleanerId: user.uid }),
      });

      const data = await response.json();

      if (response.ok) {
        setCompletionMessage(data.reminderMessage);
        // Refresh bookings
        await fetchBookings(user.uid);
        // Auto-switch to completed tab
        setActiveTab("completed");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error completing booking:", error);
      alert("Failed to complete booking. Please try again.");
    } finally {
      setCompletingBookingId(null);
    }
  };

  const handleMarkInvoiced = async (bookingId: string) => {
    if (!user) return;

    setInvoicingBookingId(bookingId);

    try {
      const response = await fetch("/api/mark-invoiced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, cleanerId: user.uid }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh bookings to update UI
        await fetchBookings(user.uid);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error marking as invoiced:", error);
      alert("Failed to mark as invoiced. Please try again.");
    } finally {
      setInvoicingBookingId(null);
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

  const isToday = (dateString: string) => {
    if (!mounted) return false; // Don't show "today" badge during SSR
    const today = new Date().toISOString().split("T")[0];
    return dateString === today;
  };

  const getTimeUntil = (dateString: string, startTime: string) => {
    if (!mounted) return null; // Don't show time until during SSR
    const bookingDateTime = new Date(`${dateString}T${startTime}`);
    const now = new Date();
    const diff = bookingDateTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 0) return null;
    if (hours === 0) return t('cleanerBookings.startsSoon');
    if (hours < 24) return `${t('cleanerBookings.startsIn')} ${hours} ${hours !== 1 ? t('cleanerBookings.hours') : t('cleanerBookings.hour')}`;
    const days = Math.floor(hours / 24);
    if (days === 1) return t('cleanerBookings.tomorrow');
    return `${t('cleanerBookings.inDays')} ${days} ${t('cleanerBookings.days')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return "✓";
      case "completed":
        return "✔";
      case "cancelled":
        return "✕";
      default:
        return "○";
    }
  };

  // Categorize bookings
  // Use a stable "now" value to prevent hydration issues
  const now = mounted ? new Date() : new Date(0);

  // Pending requests awaiting acceptance (both old and new flow)
  const pendingRequests = bookings.filter((b) =>
    b.status === "pending_acceptance" || b.status === "pending_cleaner_confirmation"
  ).sort((a, b) => {
    const expiresA = new Date(a.requestExpiresAt || 0).getTime();
    const expiresB = new Date(b.requestExpiresAt || 0).getTime();
    return expiresA - expiresB; // Most urgent first
  });

  const upcomingBookings = bookings.filter((b) => {
    if (!mounted) return b.status === "confirmed"; // Before mount, show all confirmed
    const bookingDate = new Date(`${b.date}T${b.start}`);
    return bookingDate > now && b.status === "confirmed";
  }).sort((a, b) => new Date(`${a.date}T${a.start}`).getTime() - new Date(`${b.date}T${b.start}`).getTime());

  const completedBookings = bookings.filter((b) => {
    if (!mounted) return b.status === "completed"; // Before mount, show only completed status
    const bookingDate = new Date(`${b.date}T${b.start}`);
    return bookingDate <= now || b.status === "completed";
  }).sort((a, b) => new Date(`${b.date}T${b.start}`).getTime() - new Date(`${a.date}T${a.start}`).getTime());

  const cancelledBookings = bookings.filter((b) => b.status === "cancelled" || b.status === "rejected" || b.status === "expired")
    .sort((a, b) => new Date(`${b.date}T${b.start}`).getTime() - new Date(`${a.date}T${a.start}`).getTime());

  // Calculate earnings
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.cleanerAmount || b.amount * 0.85), 0);
  const thisWeekEarnings = mounted ? completedBookings.filter((b) => {
    const bookingDate = new Date(b.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return bookingDate >= weekAgo;
  }).reduce((sum, b) => sum + (b.cleanerAmount || b.amount * 0.85), 0) : 0;

  // Get active bookings based on tab
  const displayBookings = activeTab === "requests" ? pendingRequests
    : activeTab === "upcoming" ? upcomingBookings
    : activeTab === "completed" ? completedBookings
    : cancelledBookings;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-lg mt-4 text-gray-600">{t('cleanerBookings.loadingBookings')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('cleanerBookings.pleaseLogIn')}</h2>
        <p className="text-gray-600 mb-6">{t('cleanerBookings.needLoggedInCleaner')}</p>
        <Link
          href="/auth/login"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {t('cleanerBookings.goToLogin')}
        </Link>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('cleanerBookings.title')}</h1>
          <p className="text-gray-600">{t('cleanerBookings.subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('cleanerBookings.upcomingJobs')}</p>
                <p className="text-3xl font-bold text-blue-600">{upcomingBookings.length}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('cleanerBookings.completedJobs')}</p>
                <p className="text-3xl font-bold text-green-600">{completedBookings.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('cleanerBookings.thisWeek')}</p>
                <p className="text-3xl font-bold text-green-600">€{thisWeekEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('cleanerBookings.totalEarned')}</p>
                <p className="text-3xl font-bold text-green-600">€{totalEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab("requests")}
            className={`relative px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "requests"
                ? "bg-orange-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t('cleanerBookings.pendingRequests')} ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "upcoming"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t('cleanerBookings.upcoming')} ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "completed"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t('cleanerBookings.completed')} ({completedBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "cancelled"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t('cleanerBookings.cancelled')} ({cancelledBookings.length})
          </button>
        </div>

        {/* Completion Message Banner */}
        {completionMessage && (
          <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="text-2xl">📧</div>
            <div className="flex-1">
              <p className="font-semibold text-orange-900 mb-1">Invoice Reminder</p>
              <p className="text-orange-800">{completionMessage}</p>
            </div>
            <button
              onClick={() => setCompletionMessage(null)}
              className="text-orange-600 hover:text-orange-800 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Booking Cards */}
        {displayBookings.length > 0 ? (
          <div className="space-y-4">
            {displayBookings.map((booking) => {
              const timeUntil = getTimeUntil(booking.date, booking.start);
              const todayBooking = isToday(booking.date);

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all ${
                    todayBooking ? "border-4 border-yellow-400" : "border-2 border-blue-200"
                  }`}
                >
                  {/* Status and Time Badges */}
                  <div className="flex items-center flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)} {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Unknown'}
                    </span>
                    {todayBooking && (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-300">
                        📅 {t('cleanerBookings.todaysJob')}
                      </span>
                    )}
                    {timeUntil && activeTab === "upcoming" && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold border border-blue-300">
                        ⏰ {timeUntil}
                      </span>
                    )}
                    {booking.status === "completed" && !booking.cleanerInvoiced && (
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold border border-orange-300 animate-pulse">
                        📄 Invoice Pending
                      </span>
                    )}
                    {booking.cleanerInvoiced && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold border border-green-300">
                        ✓ Invoiced
                      </span>
                    )}
                  </div>

                  {/* Service Type Header */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{booking.cleaningType}</h3>

                  {/* Earnings Display - Prominent */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 mb-1 font-medium">💰 {t('cleanerBookings.yourEarnings')}</p>
                        <p className="text-3xl font-bold text-green-600">
                          €{(booking.cleanerAmount || booking.amount * 0.85).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 mb-1">{t('cleanerBookings.totalAmount')}</p>
                        <p className="text-lg font-semibold text-gray-700">€{booking.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{booking.duration}h {t('common.service')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">{t('cleanerBookings.customerDetails')}</p>
                    <div className="space-y-2">
                      <p className="text-gray-900 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold">{booking.customerName}</span>
                      </p>
                      <p className="text-gray-700 text-sm pl-6">{booking.customerEmail}</p>
                      {booking.customerPhone && (
                        <p className="text-gray-700 text-sm pl-6">📱 {booking.customerPhone}</p>
                      )}
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">{formatDate(booking.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">
                        {booking.start} - {booking.end}
                      </span>
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <a
                      href={`mailto:${booking.customerEmail}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                    >
                      📧 {t('cleanerBookings.emailCustomer')}
                    </a>
                    {booking.customerPhone ? (
                      <a
                        href={`tel:${booking.customerPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                      >
                        📱 {t('cleanerBookings.callCustomer')}
                      </a>
                    ) : (
                      <Link
                        href={`/booking/${booking.id}`}
                        className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold text-sm"
                      >
                        📋 {t('cleanerBookings.viewDetails')}
                      </Link>
                    )}
                  </div>

                  {/* Invoice Warning Banner for Completed Jobs */}
                  {booking.status === "completed" && !booking.cleanerInvoiced && (
                    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="text-2xl">⚠️</div>
                        <div className="flex-1">
                          <p className="font-semibold text-orange-900 mb-1">Invoice Reminder</p>
                          <p className="text-sm text-orange-800">
                            Remember to send your invoice to <strong>{booking.customerEmail}</strong> for €{booking.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkInvoiced(booking.id)}
                        disabled={invoicingBookingId === booking.id}
                        className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {invoicingBookingId === booking.id ? "Marking as Invoiced..." : "✓ Mark as Invoiced"}
                      </button>
                    </div>
                  )}

                  {/* Completion Button for Upcoming Jobs */}
                  {booking.status === "confirmed" && activeTab === "upcoming" && (
                    <div className="mb-4">
                      <button
                        onClick={() => handleCompleteBooking(booking.id)}
                        disabled={completingBookingId === booking.id}
                        className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {completingBookingId === booking.id ? "Completing..." : "✓ Mark as Completed"}
                      </button>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                    <span>{t('cleanerBookings.bookingId')}: {booking.id.slice(0, 8)}...</span>
                    <span>{t('cleanerBookings.bookedOn')} {new Date(booking.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State for Active Tab */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('cleanerBookings.no')} {activeTab === "requests" ? t('cleanerBookings.pendingRequests') : activeTab + " " + t('cleanerBookings.bookings')}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === "requests" && t('cleanerBookings.newRequestsAppear')}
              {activeTab === "upcoming" && t('cleanerBookings.upcomingJobsAppear')}
              {activeTab === "completed" && t('cleanerBookings.completedAppear')}
              {activeTab === "cancelled" && t('cleanerBookings.cancelledAppear')}
            </p>
            {activeTab === "requests" && (
              <Link
                href="/cleaner/profile"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                {t('cleanerBookings.viewYourProfile')}
              </Link>
            )}
          </div>
        )}

        {/* Overall Empty State */}
        {bookings.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('cleanerBookings.noBookingsYet')}</h3>
            <p className="text-gray-600 mb-6">{t('cleanerBookings.upcomingAppear')}</p>
            <Link
              href="/cleaner/profile"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              {t('cleanerBookings.viewYourProfile')}
            </Link>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Link href="/cleaner-dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            ← {t('cleanerBookings.backToDashboard')}
          </Link>
          <Link href="/cleaner/profile" className="text-blue-600 hover:text-blue-700 font-medium">
            {t('cleanerBookings.viewProfile')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
