"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function UserBookingsPage() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setBookings(data.reservations || []);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!user) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4">My Bookings</h2>

      {bookings.length > 0 ? (
        <ul className="space-y-4">
          {bookings.map((b, i) => (
            <li key={i} className="border p-3 rounded">
              <p><strong>Service:</strong> {b.service}</p>
              <p><strong>Date:</strong> {b.date}</p>
              <p><strong>Status:</strong> {b.status}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have no bookings yet.</p>
      )}

      <Link href="/" className="block text-primary mt-4 underline">
        ← Back to Home
      </Link>
    </div>
  );
}
