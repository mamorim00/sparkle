"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from "firebase/auth";
import { auth } from "../../lib/firebase";
import { Zap, Lock, User as UserIcon, Mail, Phone, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

// --- Interfaces ---
type BookingDetails = {
  cleanerId: string;
  cleanerName: string;
  date: string;
  start: string;
  end: string;
  duration: number;
  cleaningType: string;
  totalPrice: number;
  formattedPrice: string;
} | null;

type ContactData = { name: string; email: string; phone: string };
type AuthData = { email: string; password: string; name: string };

// --- Helper function ---
const addHours = (time: string, hours: number) => {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h + hours, m, 0, 0);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const getBookingDetails = (params: URLSearchParams): BookingDetails => {
  const cleanerId = params.get("cleanerId");
  const cleanerName = params.get("cleanerName");
  const date = params.get("date");
  const start = params.get("start");
  const typeName = params.get("type");
  const durationStr = params.get("duration");
  const totalPriceStr = params.get("totalPrice");

  if (!cleanerId || !cleanerName || !date || !start || !typeName || !durationStr || !totalPriceStr) {
    return null;
  }

  const totalPrice = parseFloat(totalPriceStr);
  const duration = parseInt(durationStr, 10);

  if (isNaN(totalPrice) || isNaN(duration) || totalPrice <= 0) return null;

  return {
    cleanerId,
    cleanerName,
    date,
    start,
    end: addHours(start, duration),
    duration,
    cleaningType: typeName,
    totalPrice,
    formattedPrice: `€${totalPrice.toFixed(2)}`,
  };
};

// --- Component ---
export default function CheckoutClient() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"guest" | "login" | "register">("guest");
  const [showPassword, setShowPassword] = useState(false);

  const [contactData, setContactData] = useState<ContactData>({ name: "", email: "", phone: "" });
  const [authData, setAuthData] = useState<AuthData>({ email: "", password: "", name: "" });
  const [error, setError] = useState("");

  const bookingDetails = useMemo<BookingDetails>(() => getBookingDetails(searchParams), [searchParams]);

  // Prefill guest data from URL
  useEffect(() => {
    if (!currentUser) {
      const nameParam = searchParams.get("userName");
      const emailParam = searchParams.get("userEmail");
      setContactData({
        name: nameParam || "",
        email: emailParam || "",
        phone: "",
      });
    }
  }, [searchParams, currentUser]);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setCurrentUser(user);
      if (user) {
        setContactData({
          name: user.displayName || "",
          email: user.email || "",
          phone: user.phoneNumber || "",
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Auth handlers ---
  const handleRegister = async () => {
    setError("");
    if (!authData.name || !authData.email || !authData.password) {
      setError(t('checkout.fillAllFields'));
      return;
    }
    if (authData.password.length < 6) {
      setError(t('checkout.passwordLength'));
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
      await updateProfile(userCredential.user, { displayName: authData.name });
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    }
  };

  const handleLogin = async () => {
    setError("");
    if (!authData.email || !authData.password) {
      setError(t('checkout.provideEmailPassword'));
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, authData.email, authData.password);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    }
  };

  // --- Checkout handler ---
  const handleCheckout = async () => {
    if (!bookingDetails) {
      setError(t('checkout.bookingDataMissing'));
      return;
    }

    if (!currentUser && (!contactData.name.trim() || !contactData.email.trim())) {
      setError(t('checkout.provideNameEmail'));
      return;
    }

    setError("");
    setLoading(true);

    const checkoutPayload = {
      totalAmount: bookingDetails.totalPrice,
      bookingDetails: {
        cleanerId: bookingDetails.cleanerId,
        cleanerName: bookingDetails.cleanerName,
        date: bookingDetails.date,
        start: bookingDetails.start,
        end: bookingDetails.end,
        duration: bookingDetails.duration,
        cleaningType: bookingDetails.cleaningType,
      },
      userId: currentUser ? currentUser.uid : null,
      userName: currentUser ? (currentUser.displayName || currentUser.email) : contactData.name,
      userEmail: currentUser ? currentUser.email : contactData.email,
      userPhone: currentUser ? currentUser.phoneNumber : contactData.phone || "",
    };

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      });

      const parsed = await response.json();
      if (parsed.error) throw new Error(parsed.error);
      if (!parsed.url) throw new Error("Checkout URL missing from server response.");

      window.location.href = parsed.url;
    } catch (err: unknown) {
      setError(`Payment failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-indigo-600"></div>
        <p className="text-lg mt-4 text-gray-600">{t('checkout.preparingCheckout')}</p>
      </div>
    </div>
  );

  if (!bookingDetails) return (
    <div className="max-w-md mx-auto p-6 mt-10 bg-red-50 border border-red-200 rounded-xl">
      <h1 className="text-xl font-bold text-red-700">{t('checkout.bookingError')}</h1>
      <p className="text-red-500 mt-2">{t('checkout.couldNotLoad')}</p>
      <button onClick={() => router.back()} className="mt-4 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition">
        {t('checkout.goBack')}
      </button>
    </div>
  );

  const isButtonDisabled = loading || (!currentUser && (!contactData.name.trim() || !contactData.email.trim()));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 md:p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          <Zap className="w-7 h-7 mr-3 text-indigo-600" /> {t('checkout.title')}
        </h1>

        {/* Order Summary */}
        <section className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4 text-lg">{t('checkout.orderSummary')}</h2>
          <div className="space-y-2 text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('checkout.cleaner')}:</span>
              <span className="font-medium">{bookingDetails.cleanerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('checkout.date')}:</span>
              <span className="font-medium">{bookingDetails.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('checkout.time')}:</span>
              <span className="font-medium">{bookingDetails.start} - {bookingDetails.end}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('checkout.service')}:</span>
              <span className="font-medium">{bookingDetails.cleaningType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('checkout.duration')}:</span>
              <span className="font-medium">{bookingDetails.duration} {t('common.hours')}</span>
            </div>
            <div className="pt-3 mt-3 border-t border-gray-300 flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">{t('checkout.total')}:</span>
              <span className="text-2xl font-bold text-indigo-600">{bookingDetails.formattedPrice}</span>
            </div>
          </div>
        </section>

        {/* Auth/Guest Section */}
        {currentUser ? (
          <section className="mb-8 p-6 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('checkout.loggedInAs')}</h3>
                <p className="text-sm text-gray-600">{currentUser.displayName || currentUser.email}</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-8">
            {/* Mode Toggle Buttons */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  setAuthMode("guest");
                  setError("");
                }}
                className={`flex-1 py-2.5 px-4 rounded-md font-semibold transition-all ${
                  authMode === "guest"
                    ? "bg-white text-gray-900 shadow-md"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {t('checkout.continueAsGuest')}
              </button>
              <button
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                }}
                className={`flex-1 py-2.5 px-4 rounded-md font-semibold transition-all ${
                  authMode === "login"
                    ? "bg-white text-gray-900 shadow-md"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {t('checkout.login')}
              </button>
              <button
                onClick={() => {
                  setAuthMode("register");
                  setError("");
                }}
                className={`flex-1 py-2.5 px-4 rounded-md font-semibold transition-all ${
                  authMode === "register"
                    ? "bg-white text-gray-900 shadow-md"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {t('checkout.register')}
              </button>
            </div>

            {/* Guest Form */}
            {authMode === "guest" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.fullName')} *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={contactData.name}
                      onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                      placeholder={t('checkout.enterName')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.emailAddress')} *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={contactData.email}
                      onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                      placeholder={t('checkout.emailPlaceholder')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.phoneOptional')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={contactData.phone}
                      onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                      placeholder={t('checkout.phonePlaceholder')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            {authMode === "login" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.emailAddress')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={authData.email}
                      onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                      placeholder={t('checkout.emailPlaceholder')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authData.password}
                      onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                      placeholder={t('checkout.enterPassword')}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  {t('checkout.login')}
                </button>
              </div>
            )}

            {/* Register Form */}
            {authMode === "register" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.fullName')}</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={authData.name}
                      onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                      placeholder={t('checkout.enterName')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.emailAddress')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={authData.email}
                      onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                      placeholder={t('checkout.emailPlaceholder')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authData.password}
                      onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                      placeholder={t('checkout.passwordPlaceholder')}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleRegister}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  {t('checkout.createAccount')}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={isButtonDisabled}
          className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 active:bg-indigo-800 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {t('checkout.processing')}
            </span>
          ) : (
            <>
              {t('checkout.payNow')}
              <Lock className="w-5 h-5 ml-2" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          {t('checkout.securedByStripe')}
        </p>
      </div>
    </div>
  );
}