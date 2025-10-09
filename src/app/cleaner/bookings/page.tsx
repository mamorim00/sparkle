"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { Calendar, Clock, DollarSign, User as UserIcon, CheckCircle } from "lucide-react";

interface Booking {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  date: string;
  start: string;
  end: string;
  cleaningType: string;
  amount: number;
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
  duration: number;
}

export default function CleanerBookingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

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
      const q = query(
        collection(db, "bookings"),
        where("cleanerId", "==", cleanerId),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
      const bookingsData: Booking[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Booking));

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
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
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

  // Separate upcoming and past bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingBookings = bookings.filter((b) => new Date(b.date) >= today && b.status === "confirmed");
  const pastBookings = bookings.filter((b) => new Date(b.date) < today || b.status !== "confirmed");
  const totalEarnings = bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Jobs</h1>
          <p className="text-gray-600">View and manage your cleaning appointments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-3xl font-bold text-blue-600">{upcomingBookings.length}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {bookings.filter(b => b.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
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

        {/* Upcoming Jobs */}
        {upcomingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Upcoming Jobs
            </h2>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/booking/${booking.id}`}
                  className="block bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{booking.cleaningType}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-700 flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{booking.customerName}</span>
                        </p>
                        <p className="text-gray-600 text-sm flex items-center gap-2 pl-6">
                          {booking.customerEmail}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">€{booking.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{booking.duration}h service</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
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

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Booked on {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                    <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Details →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Past Jobs */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-gray-600" />
              Past Jobs
            </h2>
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/booking/${booking.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{booking.cleaningType}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-700 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{booking.customerName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">€{booking.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{booking.duration}h service</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span>{formatDate(booking.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span>
                        {booking.start} - {booking.end}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
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
