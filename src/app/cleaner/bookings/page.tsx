"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { Calendar, Clock, DollarSign, User as UserIcon, CheckCircle } from "lucide-react";

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
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
  duration: number;
  completedAt?: string;
  cancelledAt?: string;
}

type TabType = "upcoming" | "completed" | "cancelled";

export default function CleanerBookingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

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
    const today = new Date().toISOString().split("T")[0];
    return dateString === today;
  };

  const getTimeUntil = (dateString: string, startTime: string) => {
    const bookingDateTime = new Date(`${dateString}T${startTime}`);
    const now = new Date();
    const diff = bookingDateTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 0) return null;
    if (hours === 0) return "Starting soon!";
    if (hours < 24) return `Starts in ${hours} hour${hours !== 1 ? "s" : ""}`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
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
  const now = new Date();
  const upcomingBookings = bookings.filter((b) => {
    const bookingDate = new Date(`${b.date}T${b.start}`);
    return bookingDate > now && b.status === "confirmed";
  }).sort((a, b) => new Date(`${a.date}T${a.start}`).getTime() - new Date(`${b.date}T${b.start}`).getTime());

  const completedBookings = bookings.filter((b) => {
    const bookingDate = new Date(`${b.date}T${b.start}`);
    return bookingDate <= now || b.status === "completed";
  }).sort((a, b) => new Date(`${b.date}T${b.start}`).getTime() - new Date(`${a.date}T${a.start}`).getTime());

  const cancelledBookings = bookings.filter((b) => b.status === "cancelled")
    .sort((a, b) => new Date(`${b.date}T${b.start}`).getTime() - new Date(`${a.date}T${a.start}`).getTime());

  // Calculate earnings
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.cleanerAmount || b.amount * 0.85), 0);
  const thisWeekEarnings = completedBookings.filter((b) => {
    const bookingDate = new Date(b.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return bookingDate >= weekAgo;
  }).reduce((sum, b) => sum + (b.cleanerAmount || b.amount * 0.85), 0);

  // Get active bookings based on tab
  const displayBookings = activeTab === "upcoming" ? upcomingBookings
    : activeTab === "completed" ? completedBookings
    : cancelledBookings;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-lg mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
        <p className="text-gray-600 mb-6">You need to be logged in as a cleaner to view your bookings.</p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Jobs</h1>
          <p className="text-gray-600">View and manage your cleaning appointments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Jobs</p>
                <p className="text-3xl font-bold text-blue-600">{upcomingBookings.length}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedBookings.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-3xl font-bold text-green-600">€{thisWeekEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earned</p>
                <p className="text-3xl font-bold text-green-600">€{totalEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "upcoming"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "completed"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Completed ({completedBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "cancelled"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Cancelled ({cancelledBookings.length})
          </button>
        </div>

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
                      {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    {todayBooking && (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-300">
                        📅 Today&apos;s Job
                      </span>
                    )}
                    {timeUntil && activeTab === "upcoming" && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold border border-blue-300">
                        ⏰ {timeUntil}
                      </span>
                    )}
                  </div>

                  {/* Service Type Header */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{booking.cleaningType}</h3>

                  {/* Earnings Display - Prominent */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 mb-1 font-medium">💰 Your Earnings:</p>
                        <p className="text-3xl font-bold text-green-600">
                          €{(booking.cleanerAmount || booking.amount * 0.85).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                        <p className="text-lg font-semibold text-gray-700">€{booking.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{booking.duration}h service</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Customer Details:</p>
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
                      📧 Email Customer
                    </a>
                    {booking.customerPhone ? (
                      <a
                        href={`tel:${booking.customerPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                      >
                        📱 Call Customer
                      </a>
                    ) : (
                      <Link
                        href={`/booking/${booking.id}`}
                        className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold text-sm"
                      >
                        📋 View Details
                      </Link>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                    <span>Booking ID: {booking.id.slice(0, 8)}...</span>
                    <span>Booked on {new Date(booking.createdAt).toLocaleDateString()}</span>
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
              No {activeTab} bookings
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === "upcoming" && "Your upcoming cleaning jobs will appear here"}
              {activeTab === "completed" && "Completed jobs will appear here once you finish them"}
              {activeTab === "cancelled" && "Cancelled bookings will appear here"}
            </p>
          </div>
        )}

        {/* Overall Empty State */}
        {bookings.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Your upcoming cleaning jobs will appear here</p>
            <Link
              href="/cleaner/profile"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              View Your Profile
            </Link>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Link href="/cleaner-dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Dashboard
          </Link>
          <Link href="/cleaner/profile" className="text-blue-600 hover:text-blue-700 font-medium">
            View Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
