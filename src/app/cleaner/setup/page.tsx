"use client";

import { useState } from "react";
import Step1Profile from "./steps/Step1Profile";
import Step2Price from "./steps/Step2Price";
import Step3Schedule from "./steps/Step3Schedule";
import Step4Verification from "./steps/Step4Verification";

// Schedule and profile types
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
  businessId?: string;
  insuranceCertificateUrl?: string;
  otherDocsUrl?: string;
}

export default function CleanerSetupPage() {
  const [step, setStep] = useState(1);
  const [cleanerData, setCleanerData] = useState<CleanerProfile>({
    username: "",
    photoUrl: "",
    pricePerHour: 0,
    phone: "",
    schedule: [],
    businessId: "",
    insuranceCertificateUrl: "",
    otherDocsUrl: "",
  });

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
        <Step4Verification onBack={goBack} cleanerData={cleanerData} />
      )}
    </div>
  );
}
