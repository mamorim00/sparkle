"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import CleanerAvailability from "@/components/CleanerAvailability";

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
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">Step 3: Manage Your Availability</h2>
      <p className="text-gray-600 mb-6">
        Set your weekly schedule and add any blocked dates. You can always update this later from your dashboard.
      </p>

      {/* Schedule Management Component */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <CleanerAvailability cleanerId={user.uid} />
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
        >
          ← Back
        </button>

        <button
          onClick={handleNext}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue to Verification →
        </button>
      </div>
    </div>
  );
}
