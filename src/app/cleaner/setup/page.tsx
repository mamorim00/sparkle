"use client";

import { useState } from "react";
import Step1Profile from "./steps/Step1Profile";
import Step2Price from "./steps/Step2Price";
import Step3Schedule from "./steps/Step3Schedule";

export default function CleanerSetupPage() {
  const [step, setStep] = useState(1);
  const [cleanerData, setCleanerData] = useState({
    name: "",
    photoUrl: "",
    pricePerHour: 0,
  });

  const goNext = (data: Partial<typeof cleanerData>) => {
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
        <Step3Schedule onBack={goBack} cleanerData={cleanerData} />
      )}
    </div>
  );
}
