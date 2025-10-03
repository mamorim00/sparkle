"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "../../lib/firebase";
import {
  Zap,
  Lock,
} from "lucide-react";

// Helper function to parse booking details from URL
const getBookingDetails = (params: URLSearchParams) => {
  const cleanerName = params.get("cleanerName");
  const date = params.get("date");
  const start = params.get("start");
  const typeName = params.get("type");
  const durationStr = params.get("duration");
  const totalPriceStr = params.get("totalPrice");

  if (
    !cleanerName ||
    !date ||
    !start ||
    !typeName ||
    !durationStr ||
    !totalPriceStr
  ) {
    return null;
  }

  const totalPrice = parseFloat(totalPriceStr);
  const duration = parseInt(durationStr, 10);

  if (isNaN(totalPrice) || isNaN(duration) || totalPrice <= 0) {
    return null;
  }

  return {
    cleanerName,
    date,
    start,
    duration,
    cleaningType: typeName,
    totalPrice,
    formattedPrice: `€${totalPrice.toFixed(2)}`,
  };
};

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guestData, setGuestData] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  const bookingDetails = useMemo(
    () => getBookingDetails(searchParams),
    [searchParams]
  );

  // Firebase Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        if (!user.isAnonymous) {
          setGuestData({
            name: user.displayName || "",
            email: user.email || "",
            phone: user.phoneNumber || "",
          });
        }
      } else {
        await signInAnonymously(auth);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCheckout = async () => {
    if (!bookingDetails) {
      setError("Booking data is missing. Please go back and try again.");
      return;
    }

    if (currentUser?.isAnonymous) {
      if (
        !guestData.name.trim() ||
        (!guestData.email.trim() && !guestData.phone.trim())
      ) {
        setError("Please provide your name and either an email or a phone number.");
        return;
      }
    }

    setError("");
    setLoading(true);

    const checkoutPayload = {
      totalAmount: bookingDetails.totalPrice,
      bookingDetails: {
        cleanerName: bookingDetails.cleanerName,
        date: bookingDetails.date,
        start: bookingDetails.start,
        duration: bookingDetails.duration,
        cleaningType: bookingDetails.cleaningType,
      },
      userId: currentUser?.uid,
      userName: currentUser?.isAnonymous
        ? guestData.name
        : currentUser?.displayName || currentUser?.email,
      userEmail: currentUser?.isAnonymous ? guestData.email : currentUser?.email,
      userPhone: currentUser?.isAnonymous
        ? guestData.phone
        : currentUser?.phoneNumber,
    };

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      });

      const { url, error } = await response.json();

      if (error) throw new Error(error);

      window.location.href = url;
    } catch (err: any) {
      setError(`Payment failed: ${err.message}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Preparing secure checkout...</p>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="max-w-md mx-auto p-6 mt-10 bg-red-50 border border-red-200 rounded-xl">
        <h1 className="text-xl font-bold text-red-700">Booking Error</h1>
        <p className="text-red-500 mt-2">
          Could not load booking details from the URL.
        </p>
      </div>
    );
  }

  const isButtonDisabled =
    loading ||
    (currentUser?.isAnonymous &&
      (!guestData.name.trim() ||
        (!guestData.email.trim() && !guestData.phone.trim())));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-indigo-600" /> Secure Checkout
        </h1>

        {/* Order Summary */}
        <section className="mb-6 border-b pb-4">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">
            Order Summary
          </h2>
          <div className="flex justify-between items-center pt-3 border-t mt-3">
            <span className="font-bold text-lg text-gray-800">Total Price</span>
            <span className="font-extrabold text-indigo-600 text-2xl">
              {bookingDetails.formattedPrice}
            </span>
          </div>
        </section>

        {/* Contact Section (simplified placeholder for your inputs) */}
        <section className="mb-6 bg-indigo-50 p-4 rounded-lg">
          {currentUser?.isAnonymous && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Name"
                className="w-full border rounded p-2"
                value={guestData.name}
                onChange={(e) =>
                  setGuestData({ ...guestData, name: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full border rounded p-2"
                value={guestData.email}
                onChange={(e) =>
                  setGuestData({ ...guestData, email: e.target.value })
                }
              />
              <input
                type="tel"
                placeholder="Phone"
                className="w-full border rounded p-2"
                value={guestData.phone}
                onChange={(e) =>
                  setGuestData({ ...guestData, phone: e.target.value })
                }
              />
            </div>
          )}
        </section>

        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400"
          disabled={isButtonDisabled}
        >
          {loading ? "Processing..." : "Pay Now with Stripe"}
          <Lock className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
