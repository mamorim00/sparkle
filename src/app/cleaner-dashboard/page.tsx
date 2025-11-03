"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import {
  Calendar,
  Bell,
  DollarSign,
  User,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface CleanerStats {
  pendingRequests: number;
  upcomingBookings: number;
  completedBookings: number;
  totalEarnings: number;
  status: string;
}

export default function CleanerDashboard() {
  const { t } = useLanguage();
  const [cleanerName, setCleanerName] = useState<string>("");
  const [stats, setStats] = useState<CleanerStats>({
    pendingRequests: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
    status: "pending",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchCleanerData(user.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchCleanerData = async (uid: string) => {
    try {
      // Fetch cleaner profile
      const cleanerDocRef = doc(db, "cleaners", uid);
      const cleanerDoc = await getDoc(cleanerDocRef);

      if (cleanerDoc.exists()) {
        const cleanerData = cleanerDoc.data();
        setCleanerName(cleanerData.username || "Cleaner");

        // Fetch cleaner stats
        const bookingsRef = collection(db, "bookings");

        // Pending requests
        const pendingQuery = query(
          bookingsRef,
          where("cleanerId", "==", uid),
          where("status", "==", "pending_acceptance")
        );
        const pendingSnapshot = await getDocs(pendingQuery);

        // Upcoming bookings (confirmed)
        const upcomingQuery = query(
          bookingsRef,
          where("cleanerId", "==", uid),
          where("status", "==", "confirmed")
        );
        const upcomingSnapshot = await getDocs(upcomingQuery);

        // Completed bookings
        const completedQuery = query(
          bookingsRef,
          where("cleanerId", "==", uid),
          where("status", "==", "completed")
        );
        const completedSnapshot = await getDocs(completedQuery);

        // Calculate total earnings
        let totalEarnings = 0;
        completedSnapshot.forEach((doc) => {
          const booking = doc.data();
          totalEarnings += booking.cleanerAmount || (booking.amount * 0.85);
        });

        setStats({
          pendingRequests: pendingSnapshot.size,
          upcomingBookings: upcomingSnapshot.size,
          completedBookings: completedSnapshot.size,
          totalEarnings,
          status: cleanerData.status || "pending",
        });
      }
    } catch (error) {
      console.error("Error fetching cleaner data:", error);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="text-lg mt-4 text-gray-600">{t('cleanerDashboard.loading')}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {t('cleanerDashboard.welcome')}, {cleanerName}!
            </h1>
            <p className="text-gray-600">{t('cleanerDashboard.subtitle')}</p>

            {/* Account Status Banner */}
            {stats.status === "pending" && (
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">{t('cleanerDashboard.accountPending')}</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {t('cleanerDashboard.accountPendingDescription')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stats.status === "approved" && (
              <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">{t('cleanerDashboard.accountActive')}</p>
                    <p className="text-xs text-green-700 mt-1">
                      {t('cleanerDashboard.accountActiveDescription')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pending Requests */}
            <Link
              href="/cleaner/requests"
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('cleanerDashboard.pendingRequests')}</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingRequests}</p>
                  {stats.pendingRequests > 0 && (
                    <p className="text-xs text-orange-600 mt-1 font-medium">{t('cleanerDashboard.actionRequired')}</p>
                  )}
                </div>
                <Bell className="w-10 h-10 text-orange-600 opacity-80" />
              </div>
            </Link>

            {/* Upcoming Bookings */}
            <Link
              href="/cleaner/bookings"
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('cleanerDashboard.upcomingBookings')}</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.upcomingBookings}</p>
                </div>
                <Calendar className="w-10 h-10 text-blue-600 opacity-80" />
              </div>
            </Link>

            {/* Completed Jobs */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('cleanerDashboard.completedJobs')}</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completedBookings}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600 opacity-80" />
              </div>
            </div>

            {/* Total Earnings */}
            <Link
              href="/cleaner/earnings"
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('cleanerDashboard.totalEarnings')}</p>
                  <p className="text-3xl font-bold text-green-600">€{stats.totalEarnings.toFixed(2)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-600 opacity-80" />
              </div>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Booking Requests */}
            <Link
              href="/cleaner/requests"
              className="bg-white p-6 rounded-xl shadow-sm border-2 border-orange-200 hover:border-orange-400 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('cleanerDashboard.bookingRequests')}</h3>
                  {stats.pendingRequests > 0 && (
                    <span className="inline-block bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                      {stats.pendingRequests} {t('cleanerDashboard.pending')}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {t('cleanerDashboard.bookingRequestsDescription')}
              </p>
            </Link>

            {/* My Bookings */}
            <Link
              href="/cleaner/bookings"
              className="bg-white p-6 rounded-xl shadow-sm border-2 border-blue-200 hover:border-blue-400 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('cleanerDashboard.myBookings')}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {t('cleanerDashboard.myBookingsDescription')}
              </p>
            </Link>

            {/* Availability & Schedule */}
            <Link
              href="/cleaner/profile"
              className="bg-white p-6 rounded-xl shadow-sm border-2 border-purple-200 hover:border-purple-400 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('cleanerDashboard.availabilityProfile')}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {t('cleanerDashboard.availabilityProfileDescription')}
              </p>
            </Link>

            {/* Earnings */}
            <Link
              href="/cleaner/earnings"
              className="bg-white p-6 rounded-xl shadow-sm border-2 border-green-200 hover:border-green-400 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('cleanerDashboard.earnings')}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {t('cleanerDashboard.earningsDescription')}
              </p>
            </Link>

            {/* Performance */}
            <Link
              href="/cleaner/profile"
              className="bg-white p-6 rounded-xl shadow-sm border-2 border-indigo-200 hover:border-indigo-400 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('cleanerDashboard.myProfile')}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {t('cleanerDashboard.myProfileDescription')}
              </p>
            </Link>

            {/* Support */}
            <Link
              href="/support"
              className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200 hover:border-gray-400 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('cleanerDashboard.supportCenter')}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {t('cleanerDashboard.supportCenterDescription')}
              </p>
            </Link>
          </div>

          {/* Recent Activity */}
          {stats.pendingRequests > 0 && (
            <div className="mt-8 bg-orange-50 border-l-4 border-orange-400 p-6 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-orange-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-orange-900 mb-2">
                    {t('cleanerDashboard.youHave')} {stats.pendingRequests} {t('cleanerDashboard.pendingBookingRequest')}{stats.pendingRequests !== 1 ? "s" : ""}
                  </h3>
                  <p className="text-sm text-orange-800 mb-4">
                    {t('cleanerDashboard.customersWaiting')}
                  </p>
                  <Link
                    href="/cleaner/requests"
                    className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm"
                  >
                    <Bell className="w-4 h-4" />
                    {t('cleanerDashboard.viewRequests')}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
