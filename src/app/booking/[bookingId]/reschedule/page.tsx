"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useLanguage } from "../../../../context/LanguageContext";

interface Booking {
  id: string;
  userId: string;
  cleanerId: string;
  cleanerName: string;
  date: string;
  start: string;
  end: string;
  duration: number;
  cleaningType: string;
  amount: number;
  status: string;
}

export default function RescheduleBookingPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [user, setUser] = useState<User | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newDate, setNewDate] = useState("");
  const [newStart, setNewStart] = useState("");

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

        if (data.userId !== userId) {
          alert(t('reschedule.noAccess'));
          router.push("/");
          return;
        }

        if (data.status !== "confirmed") {
          alert(t('reschedule.onlyConfirmed'));
          router.push(`/booking/${bookingId}`);
          return;
        }

        setBooking(data);
        setNewDate(data.date);
        setNewStart(data.start);
      } else {
        alert(t('reschedule.notFound'));
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      alert(t('reschedule.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour < 18) {
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }
    return slots;
  };

  const calculateEndTime = (start: string, durationHours: number) => {
    const [hours, minutes] = start.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + durationHours * 60;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
  };

  const handleReschedule = async () => {
    if (!booking || !user || !newDate || !newStart) {
      alert(t('reschedule.selectDateTime'));
      return;
    }

    // Check if date is at least 24 hours away
    const newDateTime = new Date(`${newDate}T${newStart}`);
    const now = new Date();
    const hoursUntilBooking = (newDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      alert(t('reschedule.must24Hours'));
      return;
    }

    setSaving(true);
    try {
      const newEnd = calculateEndTime(newStart, booking.duration);

      // Call reschedule API
      const response = await fetch("/api/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          newDate,
          newStart,
          newEnd,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(t('reschedule.success'));
        router.push(`/booking/${bookingId}`);
      } else {
        alert(`${t('reschedule.failed')}: ${data.message || t('reschedule.unknownError')}`);
        setSaving(false);
      }
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      alert(t('reschedule.failedTryAgain'));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-lg mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user || !booking) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('reschedule.notFoundTitle')}</h2>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {t('reschedule.goToHome')}
        </Link>
      </div>
    );
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // Tomorrow
  const minDateString = minDate.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/booking/${bookingId}`} className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block">
            ← {t('reschedule.backToDetails')}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('reschedule.title')}</h1>
          <p className="text-gray-600">{booking.cleaningType} with {booking.cleanerName}</p>
        </div>

        {/* Current Booking Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">{t('reschedule.currentBooking')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-blue-800">
              <Calendar className="w-4 h-4" />
              <span>{new Date(booking.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="w-4 h-4" />
              <span>{booking.start} - {booking.end}</span>
            </div>
          </div>
        </div>

        {/* Rescheduling Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('reschedule.selectNewDateTime')}</h3>

          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reschedule.newDate')}
              </label>
              <input
                type="date"
                value={newDate}
                min={minDateString}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900"
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reschedule.newStartTime')}
              </label>
              <select
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900"
              >
                <option value="">{t('reschedule.selectTime')}</option>
                {generateTimeSlots().map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} - {calculateEndTime(slot, booking.duration)} ({booking.duration}h {t('common.service')})
                  </option>
                ))}
              </select>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">{t('reschedule.reschedulingPolicy')}</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{t('reschedule.must24HoursPolicy')}</li>
                    <li>{t('reschedule.subjectToAvailability')}</li>
                    <li>{t('reschedule.cleanerNotified')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Preview */}
            {newDate && newStart && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 mb-1">{t('reschedule.newBookingTime')}</p>
                    <p className="text-green-800">
                      {new Date(newDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-green-800">
                      {newStart} - {calculateEndTime(newStart, booking.duration)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Link
                href={`/booking/${bookingId}`}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold text-center"
              >
                {t('reschedule.cancelBtn')}
              </Link>
              <button
                onClick={handleReschedule}
                disabled={!newDate || !newStart || saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saving ? t('reschedule.saving') : t('reschedule.confirmReschedule')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
