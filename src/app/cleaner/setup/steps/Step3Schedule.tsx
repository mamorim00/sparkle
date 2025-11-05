"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import CleanerAvailability, { CleanerScheduleRef } from "@/components/CleanerAvailability";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const scheduleRef = useRef<CleanerScheduleRef>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleNext = async () => {
    // Save the schedule before proceeding
    if (scheduleRef.current) {
      try {
        await scheduleRef.current.saveSchedule();
      } catch (error) {
        console.error("Error saving schedule:", error);
        // Still continue even if save fails, user can save later
      }
    }

    const scheduleData = {
      schedule: cleanerData.schedule || [],
    };
    onNext(scheduleData);
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">{t('cleanerSetup.step3.pleaseLogin')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">{t('cleanerSetup.step3.title')}</h2>
      <p className="text-gray-600 mb-6">
        {t('cleanerSetup.step3.description')}
      </p>

      {/* Schedule Management Component */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <CleanerAvailability ref={scheduleRef} cleanerId={user.uid} />
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
        >
          ← {t('common.back')}
        </button>

        <button
          onClick={handleNext}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {t('cleanerSetup.step3.continueToVerification')} →
        </button>
      </div>
    </div>
  );
}
