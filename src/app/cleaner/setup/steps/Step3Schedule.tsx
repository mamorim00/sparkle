"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import CleanerDashboard from "@/app/cleaner-dashboard/page";

// Your types
interface ScheduleItem {
  date: string;
  start: string;
  end: string;
}

interface CleanerProfile {
  username: string;
  photoUrl: string;
  pricePerHour: number;
  phone: string;
  schedule: ScheduleItem[];
}

interface Step3ScheduleProps {
  onBack: () => void;
  onNext: (data: { schedule: ScheduleItem[] }) => void;
  cleanerData: CleanerProfile;
}

export default function Step3Schedule({ onBack, onNext, cleanerData }: Step3ScheduleProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleNext = () => {
    const scheduleData = {
      schedule: cleanerData.schedule || [],
    };
    onNext(scheduleData);
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
        You can now see your dashboard and edit your profile or schedule.
      </p>

      {/* Replace with your real dashboard/schedule form */}
      <CleanerDashboard />

      <div className="flex justify-between mt-4">
        <button
          onClick={onBack}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          Back
        </button>

        <button
          onClick={handleNext}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Continue to Verification
        </button>
      </div>
    </div>
  );
}
