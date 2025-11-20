"use client";

import { useState, useEffect } from "react";
import { auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Step1Profile from "./steps/Step1Profile";
import Step2Price from "./steps/Step2Price";
import Step3Schedule from "./steps/Step3Schedule";
import Step4Payout from "./steps/Step4Payout";
import Step5Verification from "./steps/Step4Verification";

// Schedule and profile types
interface ScheduleItem {
  date: string;
  start: string;
  end: string;
}

interface CleanerProfile {
  username: string;
  name?: string;
  photoUrl: string;
  zipcode?: string;
  coordinates?: { lat: number; lng: number };
  location?: string;
  pricePerHour: number;
  phone: string;
  schedule: ScheduleItem[];
  services: string[];
  stripeConnected?: boolean;
  businessId?: string;
  insuranceCertificateUrl?: string;
  otherDocsUrl?: string;
}

export default function CleanerSetupPage() {
  const [step, setStep] = useState(() => {
    // Persist step in sessionStorage
    if (typeof window !== "undefined") {
      return parseInt(sessionStorage.getItem("cleanerSetupStep") || "1");
    }
    return 1;
  });
  const [user, setUser] = useState<{ uid: string; email: string | null; displayName: string | null } | null>(null);
  const [cleanerData, setCleanerData] = useState<CleanerProfile>(() => {
    // Persist cleaner data in sessionStorage
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("cleanerSetupData");
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      username: "",
      photoUrl: "",
      pricePerHour: 0,
      phone: "",
      schedule: [],
      services: [],
      stripeConnected: false,
      businessId: "",
      insuranceCertificateUrl: "",
      otherDocsUrl: "",
    };
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Save step and data to sessionStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cleanerSetupStep", step.toString());
      sessionStorage.setItem("cleanerSetupData", JSON.stringify(cleanerData));
    }
  }, [step, cleanerData]);

  const goNext = (data: Partial<CleanerProfile>) => {
    setCleanerData(prev => ({ ...prev, ...data }));
    setStep(step + 1);
  };

  const goBack = () => {
    setStep(step - 1);
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      {step === 1 && (
        <Step1Profile onNext={goNext} initialData={cleanerData} />
      )}
      {step === 2 && (
        <Step2Price onNext={goNext} onBack={goBack} initialData={cleanerData} />
      )}
      {step === 3 && (
        <Step3Schedule onNext={goNext} onBack={goBack} cleanerData={cleanerData} />
      )}
      {step === 4 && (
        <Step4Payout
          onNext={goNext}
          onBack={goBack}
          initialData={{
            cleanerId: user?.uid,
            email: user?.email || cleanerData.username,
            name: user?.displayName || cleanerData.username,
          }}
        />
      )}
      {step === 5 && (
        <Step5Verification onBack={goBack} cleanerData={cleanerData} />
      )}
    </div>
  );
}
