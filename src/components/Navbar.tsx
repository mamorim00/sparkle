"use client";

import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";
import { useLocation } from "../context/LocationContext";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [showLocationPopup, setShowLocationPopup] = useState(false);

  const { location, setLocation } = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleLocationSelect = (loc: string) => {
    setLocation(loc);
    setShowLocationPopup(false);
  };

  return (
    <>
      <nav className="bg-primary-dark text-white shadow px-6 py-4 flex justify-between items-center">

        <div className="flex items-center space-x-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Sparkle
          </Link>

          {/* Location Selector */}
          <button
            onClick={() => setShowLocationPopup(true)}
            className="bg-primary-light text-neutral px-3 py-1 rounded hover:bg-primary transition"
          >
            {location} ▼
          </button>
        </div>

        <div className="space-x-4">
          {user ? (
            <>
              <span className="text-gray-700">Hi, {user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="bg-primary-light text-neutral px-4 py-2 rounded hover:bg-primary-light transition"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Location Popup */}
      {showLocationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-primary-light rounded-xl p-6 w-80 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Select Location</h2>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleLocationSelect("Helsinki")}
                  className="w-full text-left px-4 py-2 rounded hover:bg-primary transition"
                >
                  Helsinki
                </button>
              </li>
              <li>
                <span className="block px-4 py-2 text-gray-500 cursor-not-allowed">
                  More locations coming soon...
                </span>
              </li>
            </ul>
            <div className="mt-4 text-right">
              <button
                onClick={() => setShowLocationPopup(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
