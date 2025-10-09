"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

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
    platformFee?: string;
    cleanerAmount?: string;
  };
}

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<StripeSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get("session_id");
    if (id) setSessionId(id);
    else setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    if (!sessionId) return;

    const fetchSessionAndSaveBooking = async () => {
      try {
        const res = await fetch(`/api/get-checkout-session?session_id=${sessionId}`);
        if (!res.ok) throw new Error("Network response not ok");
        const data: StripeSession = await res.json();
        setSession(data);

        if (data && data.id && data.metadata?.cleanerId) {
          const bookingRef = doc(db, "bookings", data.id);

          // Fetch cleaner data to get cleaner name and email
          const cleanerRef = doc(db, "cleaners", data.metadata.cleanerId);
          const cleanerSnap = await getDoc(cleanerRef);
          const cleanerData = cleanerSnap.exists() ? cleanerSnap.data() : null;

          await setDoc(bookingRef, {
            id: data.id,
            amount: data.amount_total / 100,
            platformFee: data.metadata.platformFee ? parseFloat(data.metadata.platformFee) : (data.amount_total / 100) * 0.15,
            cleanerAmount: data.metadata.cleanerAmount ? parseFloat(data.metadata.cleanerAmount) : (data.amount_total / 100) * 0.85,
            currency: data.currency,
            userId: data.metadata.userId || null,
            cleanerId: data.metadata.cleanerId,
            cleanerName: cleanerData?.name || cleanerData?.username || "Cleaner",
            serviceId: data.metadata.serviceId || null,
            date: data.metadata.date,
            start: data.metadata.start, // ✅ Use start
            end: data.metadata.end,     // ✅ Use end
            duration: data.metadata.duration,
            cleaningType: data.metadata.cleaningType,
            status: "confirmed",
            payoutStatus: "pending",
            createdAt: new Date().toISOString(),
            customerEmail: data.customer_details?.email || (data.metadata.guestName ? `${data.metadata.guestName}@guest.sparkle.com` : "guest@sparkle.com"),
            customerName: data.metadata.guestName || data.customer_details?.name || "Guest",
          });

          console.log("✅ Booking saved to Firestore!");
        } else {
          console.error("❌ Failed to save booking: Missing cleanerId in metadata.");
        }
      } catch (err) {
        console.error("Failed to load session or save booking", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndSaveBooking();
  }, [sessionId]);

  if (loading) return <p className="text-center">Loading booking details...</p>;
  if (!session) return <p className="text-center text-red-500">Could not retrieve session details.</p>;

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful 🎉</h1>
      <p className="mb-2">
        Thank you for your booking, <b>{session.metadata?.guestName || session.customer_details?.name || ""}</b>!
      </p>
      <p className="mb-2">
        We have received your payment of <b>{(session.amount_total / 100).toFixed(2)} {session.currency.toUpperCase()}</b>.
      </p>
      <p className="mb-2">
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
