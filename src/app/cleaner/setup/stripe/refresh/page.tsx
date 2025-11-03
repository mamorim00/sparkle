"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useLanguage } from "../../../../../context/LanguageContext";

export default function StripeOnboardingRefreshPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const refreshOnboarding = async (userId: string) => {
      try {
        // Get cleaner's Stripe account ID
        const cleanerRef = doc(db, "cleaners", userId);
        const cleanerSnap = await getDoc(cleanerRef);
        const cleanerData = cleanerSnap.data();

        if (!cleanerData?.stripeAccountId) {
          setError(t('stripeRefresh.noStripeAccount'));
          setLoading(false);
          return;
        }

        // Create a new onboarding link
        const res = await fetch("/api/stripe/create-onboarding-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: cleanerData.stripeAccountId }),
        });

        if (!res.ok) {
          throw new Error(t('stripeRefresh.failedToRefresh'));
        }

        const { url } = await res.json();

        // Redirect to Stripe onboarding
        window.location.href = url;
      } catch (err) {
        console.error("Error refreshing onboarding:", err);
        setError(err instanceof Error ? err.message : t('stripeRefresh.failedToRefresh'));
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        refreshOnboarding(currentUser.uid);
      } else {
        setError(t('stripeRefresh.notAuthenticated'));
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-lg mt-4 text-gray-600">{t('stripeRefresh.refreshingOnboarding')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ {t('stripeRefresh.error')}</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <a
          href="/cleaner/setup"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {t('stripeRefresh.backToSetup')}
        </a>
      </div>
    );
  }

  return null;
}
