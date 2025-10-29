"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "../../lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

// Updated interface with start/end instead of time
interface StripeSession {
  id: string;
  amount_total: number;
  currency: string;
  customer_details?: { email?: string; name?: string };
  receipt_url?: string;
  metadata?: {
    serviceId?: string;
    cleanerId?: string;
    userId?: string;
    date?: string;
    start?: string;
    end?: string;
    duration?: number;
    cleaningType?: string;
    guestName?: string;
    guestEmail?: string;
    platformFee?: string;
    cleanerAmount?: string;
  };
}

interface Booking {
  id: string;
  amount: number;
  cleanerName: string;
  date: string;
  start: string;
  end: string;
  cleaningType: string;
  status: string;
}

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<StripeSession | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const bookingFoundRef = useRef(false);

  useEffect(() => {
    const id = searchParams.get("session_id");
    if (id) setSessionId(id);
    else setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    if (!sessionId) return;

    let unsubscribe: (() => void) | null = null;
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;

    const fetchSessionAndWaitForBooking = async () => {
      try {
        // Fetch Stripe session details
        const res = await fetch(`/api/get-checkout-session?session_id=${sessionId}`);
        if (!res.ok) throw new Error("Network response not ok");
        const data: StripeSession = await res.json();
        setSession(data);

        // Listen for booking creation by webhook using real-time listener
        const bookingRef = doc(db, "bookings", sessionId);

        // Set up real-time listener for booking document
        unsubscribe = onSnapshot(
          bookingRef,
          (docSnap) => {
            if (docSnap.exists() && !bookingFoundRef.current) {
              bookingFoundRef.current = true;
              const bookingData = docSnap.data() as Booking;
              setBooking(bookingData);
              setLoading(false);
              console.log("✅ Booking received from webhook:", bookingData);

              // Clear timeout if booking is found
              if (pollTimeout) {
                clearTimeout(pollTimeout);
                pollTimeout = null;
              }
            }
          },
          (error) => {
            console.error("Error listening to booking:", error);
            setBookingError("Failed to load booking details");
            setLoading(false);
          }
        );

        // Also do an initial check in case the booking was already created
        const bookingSnap = await getDoc(bookingRef);
        if (bookingSnap.exists() && !bookingFoundRef.current) {
          bookingFoundRef.current = true;
          const bookingData = bookingSnap.data() as Booking;
          setBooking(bookingData);
          setLoading(false);
          console.log("✅ Booking already exists:", bookingData);
          return; // Don't set timeout if already exists
        }

        // Set timeout to stop waiting after 15 seconds
        pollTimeout = setTimeout(() => {
          if (!bookingFoundRef.current) {
            console.warn("⚠️ Booking not created by webhook within 15 seconds");
            setBookingError("Booking is being processed. Please check your email for confirmation.");
            setLoading(false);
          }
        }, 15000);

      } catch (err) {
        console.error("Failed to load session or booking", err);
        setBookingError("Failed to load booking details");
        setLoading(false);
      }
    };

    fetchSessionAndWaitForBooking();

    // Cleanup function
    return () => {
      if (unsubscribe) unsubscribe();
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [sessionId]); // Don't include booking to avoid infinite loop

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <div className="animate-pulse">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Processing your booking...</h1>
          <p className="mb-2">Please wait while we confirm your booking.</p>
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <p className="text-center text-red-500">Could not retrieve session details.</p>;
  }

  if (bookingError) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful 🎉</h1>
        <p className="mb-2">
          Thank you for your payment, <b>{session.metadata?.guestName || session.customer_details?.name || ""}</b>!
        </p>
        <p className="mb-4 text-yellow-600">
          {bookingError}
        </p>
        <p className="mb-2">
          We have received your payment of <b>{(session.amount_total / 100).toFixed(2)} {session.currency.toUpperCase()}</b>.
        </p>
        <p className="mb-2">
          A confirmation email will be sent to <b>{session.customer_details?.email}</b>.
        </p>
        {session.receipt_url && (
          <a
            href={session.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            View Receipt
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful 🎉</h1>
      <p className="mb-2">
        Thank you for your booking, <b>{session.metadata?.guestName || session.customer_details?.name || ""}</b>!
      </p>
      <p className="mb-2">
        We have received your payment of <b>{(session.amount_total / 100).toFixed(2)} {session.currency.toUpperCase()}</b>.
      </p>

      {booking && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Booking Details</h2>
          <div className="text-left space-y-2">
            <p><strong>Cleaner:</strong> {booking.cleanerName}</p>
            <p><strong>Service:</strong> {booking.cleaningType}</p>
            <p><strong>Date:</strong> {booking.date}</p>
            <p><strong>Time:</strong> {booking.start} - {booking.end}</p>
            <p><strong>Status:</strong> <span className="text-green-600 font-semibold">{booking.status}</span></p>
          </div>
        </div>
      )}

      <p className="mb-2 mt-4">
        A confirmation has been sent to <b>{session.customer_details?.email}</b>.
      </p>
      {session.receipt_url && (
        <a
          href={session.receipt_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          View Receipt
        </a>
      )}
    </div>
  );
}
