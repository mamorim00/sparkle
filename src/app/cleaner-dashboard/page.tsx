"use client";

import CleanerSchedule from "../../components/CleanerAvailability";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function CleanerDashboard() {
  const [cleanerId, setCleanerId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCleanerId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-3xl font-bold mb-4 text-center">Cleaner Dashboard</h1>
        {cleanerId && <CleanerSchedule cleanerId={cleanerId} />}
      </div>
    </ProtectedRoute>
  );
}
