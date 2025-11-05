"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CleanerSchedule from "@/components/CleanerAvailability";
import { useLanguage } from "@/context/LanguageContext";

// Define types for schedule items and cleaner profile
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
  stripeAccountId?: string;
  stripeConnected?: boolean;
}

export default function CleanerProfilePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [disconnectingStripe, setDisconnectingStripe] = useState(false);
  const [profile, setProfile] = useState<CleanerProfile>({
    username: "",
    photoUrl: "",
    pricePerHour: 0,
    phone: "",
    schedule: [],
    stripeConnected: false,
    stripeAccountId: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const cleanerRef = doc(db, "cleaners", firebaseUser.uid);
        const snap = await getDoc(cleanerRef);
        if (snap.exists()) {
          setProfile(snap.data() as CleanerProfile);

          // Check Stripe status if account exists
          if (snap.data().stripeAccountId) {
            checkStripeStatus(firebaseUser.uid);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const cleanerRef = doc(db, "cleaners", user.uid);
    await setDoc(
      cleanerRef,
      {
        ...profile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setSaving(false);
    alert(t('cleanerProfile.profileUpdated'));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const file = e.target.files[0];
    const fileRef = ref(storage, `cleaners/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    setProfile((prev) => ({ ...prev, photoUrl: url }));
    await updateProfile(user, { photoURL: url });
  };

  const checkStripeStatus = async (cleanerId: string) => {
    setCheckingStatus(true);
    try {
      const response = await fetch("/api/stripe/check-account-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleanerId }),
      });

      if (response.ok) {
        // API updates Firestore, so refresh profile data to get updated status
        const cleanerRef = doc(db, "cleaners", cleanerId);
        const snap = await getDoc(cleanerRef);
        if (snap.exists()) {
          setProfile(snap.data() as CleanerProfile);
        }
      }
    } catch (error) {
      console.error("Error checking Stripe status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!user) return;
    setConnectingStripe(true);

    try {
      // If account already exists, create new onboarding link
      if (profile.stripeAccountId) {
        const onboardingRes = await fetch("/api/stripe/create-onboarding-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: profile.stripeAccountId }),
        });

        if (onboardingRes.ok) {
          const { url } = await onboardingRes.json();
          window.location.href = url;
          return;
        }
      }

      // Create new Stripe Connect account
      const createAccountRes = await fetch("/api/stripe/create-connect-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanerId: user.uid,
          email: user.email,
          name: profile.username || user.displayName,
        }),
      });

      if (!createAccountRes.ok) {
        throw new Error("Failed to create Stripe account");
      }

      const { accountId } = await createAccountRes.json();

      // Create onboarding link
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
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      alert("Failed to connect Stripe. Please try again or contact support.");
      setConnectingStripe(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!user) return;

    const confirmed = confirm(
      "Are you sure you want to disconnect your Stripe account? You will no longer receive payments for completed jobs until you reconnect."
    );

    if (!confirmed) return;

    setDisconnectingStripe(true);

    try {
      const response = await fetch("/api/stripe/disconnect-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleanerId: user.uid }),
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect Stripe account");
      }

      // Refresh profile data
      const cleanerRef = doc(db, "cleaners", user.uid);
      const snap = await getDoc(cleanerRef);
      if (snap.exists()) {
        setProfile(snap.data() as CleanerProfile);
      }

      alert("Stripe account disconnected successfully. You can reconnect anytime.");
    } catch (error) {
      console.error("Error disconnecting Stripe:", error);
      alert("Failed to disconnect Stripe. Please try again or contact support.");
    } finally {
      setDisconnectingStripe(false);
    }
  };

  if (loading) return <p>{t('cleanerProfile.loading')}</p>;
  if (!user) return <p>{t('cleanerProfile.pleaseLogin')}</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">{t('cleanerProfile.title')}</h1>

      {/* Profile Editing Section */}
      <div className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-xl font-semibold">{t('cleanerProfile.profileInfo')}</h2>

        <label className="block mb-1 font-semibold">{t('cleanerProfile.name')}</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          value={profile.username}
          onChange={(e) =>
            setProfile((prev) => ({ ...prev, username: e.target.value }))
          }
        />

        <label className="block mb-1 font-semibold">{t('cleanerProfile.phone')}</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          value={profile.phone}
          onChange={(e) =>
            setProfile((prev) => ({ ...prev, phone: e.target.value }))
          }
        />

        <label className="block mb-1 font-semibold">{t('cleanerProfile.pricePerHour')}</label>
        <input
          type="number"
          className="w-full border px-3 py-2 rounded"
          value={profile.pricePerHour}
          onChange={(e) =>
            setProfile((prev) => ({
              ...prev,
              pricePerHour: Number(e.target.value),
            }))
          }
        />

        <label className="block mb-1 font-semibold">{t('cleanerProfile.profilePhoto')}</label>
        <input type="file" onChange={handlePhotoChange} />
        {profile.photoUrl && (
          <Image
            src={profile.photoUrl}
            alt="Profile"
            width={128}
            height={128}
            className="w-32 h-32 mt-2 rounded-full object-cover"
          />
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {saving ? t('cleanerProfile.saving') : t('cleanerProfile.saveChanges')}
        </button>
      </div>

      {/* Stripe Connection Section */}
      <div className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-xl font-semibold">Payment Settings</h2>

        <div className={`p-4 rounded-lg border-2 ${profile.stripeConnected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {profile.stripeConnected ? (
                  <>
                    <span className="text-2xl">✓</span>
                    <h3 className="font-semibold text-green-900">Stripe Connected</h3>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">⚠️</span>
                    <h3 className="font-semibold text-yellow-900">Stripe Not Connected</h3>
                  </>
                )}
              </div>

              {profile.stripeConnected ? (
                <p className="text-sm text-green-800">
                  Your bank account is connected and you can receive payouts for completed jobs.
                  {profile.stripeAccountId && (
                    <span className="block mt-1 text-xs text-green-700">
                      Account ID: {profile.stripeAccountId.substring(0, 20)}...
                    </span>
                  )}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-yellow-800 font-medium">
                    You need to connect your bank account to receive payments for completed jobs.
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc">
                    <li>Receive 85% of each booking amount</li>
                    <li>Automatic payouts after job completion</li>
                    <li>Secure payments through Stripe</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleConnectStripe}
              disabled={connectingStripe || disconnectingStripe}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                profile.stripeConnected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {connectingStripe ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Connecting to Stripe...
                </>
              ) : profile.stripeConnected ? (
                <>Update Stripe Connection</>
              ) : (
                <>Connect Bank Account Now</>
              )}
            </button>

            {profile.stripeAccountId && (
              <button
                onClick={() => user && checkStripeStatus(user.uid)}
                disabled={checkingStatus || connectingStripe || disconnectingStripe}
                className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent"></div>
                  </>
                ) : (
                  <>Check Status</>
                )}
              </button>
            )}
          </div>

          {profile.stripeConnected && (
            <button
              onClick={handleDisconnectStripe}
              disabled={disconnectingStripe || connectingStripe}
              className="mt-3 w-full px-6 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {disconnectingStripe ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                  Disconnecting...
                </>
              ) : (
                <>Disconnect Stripe Account</>
              )}
            </button>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> You&apos;ll be redirected to Stripe to securely connect your bank account.
            After completing the setup, you&apos;ll be returned to this page.
          </p>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">{t('cleanerProfile.manageSchedule')}</h2>
        <CleanerSchedule cleanerId={user.uid} />
      </div>
    </div>
  );
}
