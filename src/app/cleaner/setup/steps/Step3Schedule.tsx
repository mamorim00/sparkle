"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import CleanerDashboard from "@/app/cleaner-dashboard/page";

interface Step3ScheduleProps {
  onBack: () => void;
  cleanerData: any;
}

export default function Step3Schedule({ onBack, cleanerData }: Step3ScheduleProps) {
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleFinish = async () => {
    if (!user) return;

    setSaving(true);

    // Save the cleaner data and schedule in Firestore
    await setDoc(
      doc(db, "cleaners", user.uid),
      {
        ...cleanerData,
        status: "pending", // admin approval
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setSaving(false);

    // Redirect to cleaner profile page
    router.push("/cleaner/profile");
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Please log in to continue.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 3: Your Cleaner Dashboard</h2>
      <p className="text-sm mb-4">
        You can now see your real dashboard and edit your profile or schedule.
      </p>

      {/* Render your real dashboard */}
      <CleanerDashboard />

      <div className="flex justify-between mt-4">
        <button
          onClick={onBack}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          Back
        </button>

        <button
          onClick={handleFinish}
          disabled={saving}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Finish & Go to Profile"}
        </button>
      </div>
    </div>
  );
}
