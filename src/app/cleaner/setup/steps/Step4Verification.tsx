"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

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
}

// Extend CleanerProfile with optional verification fields
interface CleanerVerification extends CleanerProfile {
  businessId?: string;
  insuranceCertificateUrl?: string;
  otherDocsUrl?: string;
  status?: string;
}

interface Step4VerificationProps {
  onBack: () => void;
  cleanerData: CleanerProfile;
}

export default function Step4Verification({ onBack, cleanerData }: Step4VerificationProps) {
  const [user, setUser] = useState<User | null>(null);
  const [businessId, setBusinessId] = useState("");
  const [insuranceCertificate, setInsuranceCertificate] = useState<File | null>(null);
  const [otherDocs, setOtherDocs] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const uploadFile = async (file: File, path: string) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    let insuranceUrl = "";
    let otherDocsUrl = "";

    if (insuranceCertificate) {
      insuranceUrl = await uploadFile(
        insuranceCertificate,
        `cleaners/${user.uid}/insurance_${insuranceCertificate.name}`
      );
    }

    if (otherDocs) {
      otherDocsUrl = await uploadFile(
        otherDocs,
        `cleaners/${user.uid}/docs_${otherDocs.name}`
      );
    }

    const updatedData: CleanerVerification = {
      ...cleanerData,
      businessId,
      insuranceCertificateUrl: insuranceUrl,
      otherDocsUrl,
      status: "pending",
    };

    await setDoc(doc(db, "cleaners", user.uid), {
      ...updatedData,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    setSaving(false);
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
      <h2 className="text-xl font-bold mb-4">Step 4: Verification Documents</h2>
      <p className="text-sm mb-4">
        Please provide your business ID, insurance certificate, and other relevant documents.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Business ID</label>
          <input
            type="text"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="w-full border px-3 py-2 rounded mt-1"
            placeholder="Enter your Business ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Insurance Certificate</label>
          <input
            type="file"
            onChange={(e) => setInsuranceCertificate(e.target.files?.[0] || null)}
            className="w-full border px-3 py-2 rounded mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Other Documents</label>
          <input
            type="file"
            onChange={(e) => setOtherDocs(e.target.files?.[0] || null)}
            className="w-full border px-3 py-2 rounded mt-1"
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
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
