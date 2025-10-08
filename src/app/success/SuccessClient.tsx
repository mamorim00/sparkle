"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

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

          await setDoc(bookingRef, {
            id: data.id,
            amount: data.amount_total / 100,
            currency: data.currency,
            userId: data.metadata.userId || null,
            cleanerId: data.metadata.cleanerId,
            serviceId: data.metadata.serviceId || null,
            date: data.metadata.date,
            start: data.metadata.start, // ✅ Use start
            end: data.metadata.end,     // ✅ Use end
            duration: data.metadata.duration,
            cleaningType: data.metadata.cleaningType,
            status: "confirmed",
            createdAt: new Date().toISOString(),
            customerEmail: data.customer_details?.email || null,
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
