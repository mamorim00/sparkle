"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface Step4PayoutProps {
  onNext: (data: { stripeConnected: boolean }) => void;
  onBack: () => void;
  initialData: { cleanerId?: string; email?: string; name?: string };
}

export default function Step4Payout({ onNext, onBack, initialData }: Step4PayoutProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);

  const handleConnectStripe = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 1: Create Connect account
      const createAccountRes = await fetch("/api/stripe/create-connect-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanerId: initialData.cleanerId,
          email: initialData.email,
          name: initialData.name,
        }),
      });

      if (!createAccountRes.ok) {
        throw new Error(t('cleanerSetup.step4.failedCreateAccount'));
      }

      const { accountId } = await createAccountRes.json();
      setAccountCreated(true);

      // Step 2: Create onboarding link
      const onboardingRes = await fetch("/api/stripe/create-onboarding-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (!onboardingRes.ok) {
        throw new Error(t('cleanerSetup.step4.failedOnboardingLink'));
      }

      const { url } = await onboardingRes.json();

      // Redirect to Stripe onboarding
      window.location.href = url;
    } catch (err) {
      console.error("Error connecting Stripe:", err);
      setError(err instanceof Error ? err.message : t('cleanerSetup.step4.failedConnectStripe'));
      setLoading(false);
    }
  };

  const handleSkipForNow = () => {
    onNext({ stripeConnected: false });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('cleanerSetup.step4.title')}</h2>
      <p className="text-gray-600 mb-6">
        {t('cleanerSetup.step4.description')}
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-lg mb-3">{t('cleanerSetup.step4.howPaymentsWork')}</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>{t('cleanerSetup.step4.receive85')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>{t('cleanerSetup.step4.automaticPayouts')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>{t('cleanerSetup.step4.securePayments')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>{t('cleanerSetup.step4.trackEarnings')}</span>
          </li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>{t('cleanerSetup.step4.note')}:</strong> {t('cleanerSetup.step4.redirectNote')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {accountCreated && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            ✓ {t('cleanerSetup.step4.accountCreated')}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={handleConnectStripe}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              {t('cleanerSetup.step4.settingUpStripe')}
            </>
          ) : (
            <>{t('cleanerSetup.step4.connectBankAccount')}</>
          )}
        </button>

        <button
          onClick={handleSkipForNow}
          disabled={loading}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
          {t('cleanerSetup.step4.skipForNow')}
        </button>

        <button
          onClick={onBack}
          disabled={loading}
          className="text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          ← {t('common.back')}
        </button>
      </div>
    </div>
  );
}
