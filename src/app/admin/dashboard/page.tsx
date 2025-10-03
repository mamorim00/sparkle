"use client";

import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";

interface Cleaner {
  id: string;
  username: string;
  email: string;
  status: string;
  rating?: number;
}

export default function AdminDashboard() {
  const [pendingCleaners, setPendingCleaners] = useState<Cleaner[]>([]);
  const [approvedCleaners, setApprovedCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCleaners = async () => {
    setLoading(true);
    try {
      const cleanersRef = collection(db, "cleaners");

      // Pending
      const pendingQuery = query(cleanersRef, where("status", "==", "pending"));
      const pendingSnap = await getDocs(pendingQuery);
      const pendingData = pendingSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Cleaner[];
      setPendingCleaners(pendingData);

      // Approved
      const approvedQuery = query(cleanersRef, where("status", "==", "approved"));
      const approvedSnap = await getDocs(approvedQuery);
      const approvedData = approvedSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Cleaner[];
      setApprovedCleaners(approvedData);
    } catch (err) {
      console.error("Error fetching cleaners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, []);

  // Approve a cleaner
  const approveCleaner = async (id: string) => {
    try {
      const cleanerRef = doc(db, "cleaners", id);
      await updateDoc(cleanerRef, { status: "approved" });
      await fetchCleaners();
    } catch (err) {
      console.error("Error approving cleaner:", err);
    }
  };

  // Revert approved cleaner back to pending
  const revertCleaner = async (id: string) => {
    try {
      const cleanerRef = doc(db, "cleaners", id);
      await updateDoc(cleanerRef, { status: "pending" });
      await fetchCleaners();
    } catch (err) {
      console.error("Error reverting cleaner:", err);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Pending Cleaners */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Pending Cleaners</h2>
        {loading ? (
          <p>Loading pending cleaners...</p>
        ) : pendingCleaners.length === 0 ? (
          <p>No pending cleaners to approve.</p>
        ) : (
          <div className="space-y-4">
            {pendingCleaners.map(cleaner => (
              <div key={cleaner.id} className="p-4 border rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">{cleaner.username}</p>
                  <p className="text-sm text-gray-600">{cleaner.email}</p>
                </div>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={() => approveCleaner(cleaner.id)}
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved Cleaners */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Approved Cleaners</h2>
        {loading ? (
          <p>Loading approved cleaners...</p>
        ) : approvedCleaners.length === 0 ? (
          <p>No approved cleaners yet.</p>
        ) : (
          <div className="space-y-4">
            {approvedCleaners.map(cleaner => (
              <div key={cleaner.id} className="p-4 border rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">{cleaner.username}</p>
                  <p className="text-sm text-gray-600">{cleaner.email}</p>
                  <p className="text-sm text-gray-600">
                    Rating: {cleaner.rating ?? "Not rated yet"}
                  </p>
                </div>
                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  onClick={() => revertCleaner(cleaner.id)}
                >
                  Revert to Pending
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
