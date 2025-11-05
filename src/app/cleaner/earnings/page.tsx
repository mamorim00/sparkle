"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { DollarSign, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";

interface Booking {
  id: string;
  amount: number;
  platformFee: number;
  cleanerAmount: number;
  date: string;
  start: string;
  end: string;
  cleaningType: string;
  customerName: string;
  status: "confirmed" | "cancelled" | "completed";
  payoutStatus: "pending" | "paid";
  transferId?: string;
  transferDate?: string;
  createdAt: string;
}

export default function CleanerEarningsPage() {
  const { t } = useLanguage();
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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-lg mt-4 text-gray-600">{t('cleanerEarnings.loadingEarnings')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('cleanerEarnings.pleaseLogIn')}</h2>
        <p className="text-gray-600 mb-6">{t('cleanerEarnings.needLoggedInCleaner')}</p>
        <Link
          href="/auth/login"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {t('cleanerEarnings.goToLogin')}
        </Link>
      </div>
    );
  }

  // Calculate earnings
  const completedBookings = bookings.filter(b => b.status === "completed");
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.cleanerAmount || 0), 0);
  const pendingPayouts = completedBookings
    .filter(b => b.payoutStatus === "pending" || !b.transferId)
    .reduce((sum, b) => sum + (b.cleanerAmount || 0), 0);
  const paidOut = completedBookings
    .filter(b => b.payoutStatus === "paid" && b.transferId)
    .reduce((sum, b) => sum + (b.cleanerAmount || 0), 0);
  const totalPlatformFees = completedBookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('cleanerEarnings.title')}</h1>
          <p className="text-gray-600">{t('cleanerEarnings.subtitle')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('cleanerEarnings.totalEarned')}</span>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">€{totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{completedBookings.length} {t('cleanerEarnings.completedJobs')}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('cleanerEarnings.pendingPayout')}</span>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">€{pendingPayouts.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{t('cleanerEarnings.awaitingPayout')}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('cleanerEarnings.paidOut')}</span>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">€{paidOut.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{t('cleanerEarnings.received')}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('cleanerEarnings.platformFees')}</span>
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-600">€{totalPlatformFees.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{t('cleanerEarnings.commission')}</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-lg mb-3 text-blue-900">💰 {t('cleanerEarnings.howPayoutsWork')}</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>{t('cleanerEarnings.youEarnPercent')} <strong>85%</strong> {t('cleanerEarnings.ofEachBooking')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>{t('cleanerEarnings.payoutsProcessed')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>{t('cleanerEarnings.moneyTransferred')}</span>
            </li>
          </ul>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('cleanerEarnings.earningsBreakdown')}</h2>

          {completedBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t('cleanerEarnings.noCompletedBookings')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('cleanerEarnings.date')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('cleanerEarnings.service')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('cleanerEarnings.customer')}</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('cleanerEarnings.total')}</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('cleanerEarnings.platformFee')}</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('cleanerEarnings.yourEarning')}</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">{t('cleanerEarnings.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {completedBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{booking.start} - {booking.end}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">{booking.cleaningType}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{booking.customerName}</td>
                      <td className="py-4 px-4 text-sm text-right font-medium text-gray-900">
                        €{booking.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-sm text-right text-gray-600">
                        -€{(booking.platformFee || booking.amount * 0.15).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-sm text-right font-bold text-green-600">
                        €{(booking.cleanerAmount || booking.amount * 0.85).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {booking.payoutStatus === "paid" && booking.transferId ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            {t('cleanerEarnings.paid')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3" />
                            {t('cleanerEarnings.pending')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Link href="/cleaner-dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            ← {t('cleanerEarnings.backToDashboard')}
          </Link>
          <Link href="/cleaner/bookings" className="text-blue-600 hover:text-blue-700 font-medium">
            {t('cleanerEarnings.viewAllJobs')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
