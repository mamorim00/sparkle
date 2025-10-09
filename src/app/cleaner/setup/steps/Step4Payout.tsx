"use client";

import { useState } from "react";

interface Step4PayoutProps {
  onNext: (data: { stripeConnected: boolean }) => void;
  onBack: () => void;
  initialData: { cleanerId?: string; email?: string; name?: string };
}

export default function Step4Payout({ onNext, onBack, initialData }: Step4PayoutProps) {
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
        throw new Error("Failed to create Stripe account");
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
        throw new Error("Failed to create onboarding link");
      }

      const { url } = await onboardingRes.json();

      // Redirect to Stripe onboarding
      window.location.href = url;
    } catch (err) {
      console.error("Error connecting Stripe:", err);
      setError(err instanceof Error ? err.message : "Failed to connect Stripe");
      setLoading(false);
    }
  };

  const handleSkipForNow = () => {
    onNext({ stripeConnected: false });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Step 4: Payment Setup</h2>
      <p className="text-gray-600 mb-6">
        Connect your bank account to receive payments. You&apos;ll earn 85% of each booking (we keep a 15% service fee).
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-lg mb-3">💰 How Payments Work</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>You receive <strong>85%</strong> of each booking amount</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Automatic payouts after job completion</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Secure payments via Stripe</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Track your earnings in your dashboard</span>
          </li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> You&apos;ll be redirected to Stripe to securely connect your bank account.
          This takes about 2-3 minutes.
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
            ✓ Stripe account created! Redirecting to complete onboarding...
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
              Setting up Stripe...
            </>
          ) : (
            <>Connect Bank Account</>
          )}
        </button>

        <button
          onClick={handleSkipForNow}
          disabled={loading}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
          Skip for Now (Setup Later)
        </button>

        <button
          onClick={onBack}
          disabled={loading}
          className="text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
