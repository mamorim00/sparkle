"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      try {
        const res = await fetch(`/api/get-checkout-session?session_id=${sessionId}`);
        const data = await res.json();
        setSession(data);
      } catch (err) {
        console.error("Failed to load session", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading) return <p className="text-center">Loading...</p>;

  if (!session) return <p className="text-center text-red-500">No session found.</p>;

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful 🎉</h1>
      <p className="mb-2">Thank you for your booking!</p>
      <p className="mb-2">We have received your payment of <b>{session.amount_total / 100} {session.currency.toUpperCase()}</b>.</p>
      <p className="mb-2">A confirmation email has been sent to <b>{session.customer_details?.email}</b>.</p>

      <a
  href={session.receipt_url}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
>
  {session.receipt_url ? "View Receipt" : "No Receipt Available"}
</a>
    </div>
  );
}
