"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useLanguage } from "../../../../../context/LanguageContext";

export default function StripeOnboardingSuccessPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const updateStripeStatus = async (userId: string) => {
      try {
        // Verify the Stripe account status with Stripe API
        const statusResponse = await fetch("/api/stripe/check-account-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cleanerId: userId }),
        });

        if (!statusResponse.ok) {
          throw new Error("Failed to verify Stripe account status");
        }

        const statusData = await statusResponse.json();

        // Only mark as fully connected if charges and payouts are enabled
        const isFullyConnected = statusData.connected === true;

        // Update cleaner document with verified status
        const cleanerRef = doc(db, "cleaners", userId);
        await updateDoc(cleanerRef, {
          stripeAccountStatus: isFullyConnected ? "active" : "pending",
          stripeConnected: isFullyConnected,
          stripeOnboardingCompletedAt: new Date().toISOString(),
        });

        // Update sessionStorage to mark Stripe as connected (if fully connected)
        if (typeof window !== "undefined") {
          const savedData = sessionStorage.getItem("cleanerSetupData");
          if (savedData) {
            const data = JSON.parse(savedData);
            data.stripeConnected = isFullyConnected;
            sessionStorage.setItem("cleanerSetupData", JSON.stringify(data));
          }
          // Set step to 5 (verification)
          sessionStorage.setItem("cleanerSetupStep", "5");
        }

        // Show warning if not fully connected
        if (!isFullyConnected) {
          setError(t('stripeSuccess.incompleteSetup') || "Stripe setup incomplete. Please complete all required information.");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error updating Stripe status:", err);
        setError(t('stripeSuccess.failedToUpdate'));
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        updateStripeStatus(currentUser.uid);
      } else {
        setError(t('stripeSuccess.notAuthenticated'));
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600"></div>
          <p className="text-lg mt-4 text-gray-600">{t('stripeSuccess.completingSetup')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ {t('stripeSuccess.error')}</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href="/cleaner/setup"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {t('stripeSuccess.backToSetup')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">✅ {t('stripeSuccess.paymentSetupComplete')}</h2>
      <p className="text-gray-600 mb-6">
        {t('stripeSuccess.bankConnected')}
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>{t('stripeSuccess.next')}</strong> {t('stripeSuccess.completeVerification')}
        </p>
      </div>

      <button
        onClick={() => router.push("/cleaner/setup")}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
      >
        {t('stripeSuccess.continueToVerification')} →
      </button>
    </div>
  );
}
