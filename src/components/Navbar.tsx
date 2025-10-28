"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useLocation } from "../context/LocationContext";
import { ChevronDown, Calendar, LifeBuoy, LogOut, User as UserIcon, Briefcase, Bell } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const { location, setLocation } = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Fetch user role from Firestore
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const role = userDoc.data().role || "customer";
            setUserRole(role);

            // If cleaner, fetch pending requests count
            if (role === "cleaner") {
              fetchPendingRequestsCount(currentUser.uid);
            }
          } else {
            setUserRole("customer");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole("customer");
        }
      } else {
        setUser(null);
        setUserRole(null);
        setPendingRequestsCount(0);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchPendingRequestsCount = async (cleanerId: string) => {
    try {
      const q = query(
        collection(db, "bookings"),
        where("cleanerId", "==", cleanerId),
        where("status", "==", "pending_acceptance")
      );
      const snapshot = await getDocs(q);
      setPendingRequestsCount(snapshot.size);
    } catch (error) {
      console.error("Error fetching pending requests count:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowUserMenu(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLocationSelect = (loc: string) => {
    setLocation(loc);
    setShowLocationPopup(false);
  };

  const closeUserMenu = () => {
    setShowUserMenu(false);
  };

  return (
    <>
      <nav className="bg-primary-dark text-white shadow px-6 py-4 flex justify-between items-center relative">
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

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative">
              {/* User Menu Button */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-primary-light text-neutral px-4 py-2 rounded hover:bg-primary transition"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {user.displayName || user.email?.split("@")[0] || "User"}
                </span>
                {pendingRequestsCount > 0 && userRole === "cleaner" && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingRequestsCount}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-30"
                    onClick={closeUserMenu}
                  />

                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-40">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {user.email || user.phoneNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        {userRole === "cleaner" ? "Cleaner Account" : "Customer Account"}
                      </p>
                    </div>

                    {/* Menu Items - Customer */}
                    {userRole === "customer" && (
                      <>
                        <Link
                          href="/user/bookings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeUserMenu}
                        >
                          <Calendar className="w-4 h-4 text-gray-600" />
                          My Bookings
                        </Link>
                        <Link
                          href="/support"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeUserMenu}
                        >
                          <LifeBuoy className="w-4 h-4 text-gray-600" />
                          Support Center
                        </Link>
                      </>
                    )}

                    {/* Menu Items - Cleaner */}
                    {userRole === "cleaner" && (
                      <>
                        <Link
                          href="/cleaner-dashboard"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeUserMenu}
                        >
                          <Briefcase className="w-4 h-4 text-gray-600" />
                          Dashboard
                        </Link>
                        <Link
                          href="/cleaner/requests"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors relative"
                          onClick={closeUserMenu}
                        >
                          <Bell className="w-4 h-4 text-gray-600" />
                          <span>Booking Requests</span>
                          {pendingRequestsCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                              {pendingRequestsCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/cleaner/bookings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeUserMenu}
                        >
                          <Calendar className="w-4 h-4 text-gray-600" />
                          My Bookings
                        </Link>
                        <Link
                          href="/cleaner/profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeUserMenu}
                        >
                          <UserIcon className="w-4 h-4 text-gray-600" />
                          My Profile
                        </Link>
                        <Link
                          href="/support"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeUserMenu}
                        >
                          <LifeBuoy className="w-4 h-4 text-gray-600" />
                          Support Center
                        </Link>
                      </>
                    )}

                    {/* Menu Items - Admin */}
                    {userRole === "admin" && (
                      <>
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeUserMenu}
                        >
                          <Briefcase className="w-4 h-4 text-gray-600" />
                          Admin Dashboard
                        </Link>
                        <Link
                          href="/user/bookings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeUserMenu}
                        >
                          <Calendar className="w-4 h-4 text-gray-600" />
                          My Bookings
                        </Link>
                        <Link
                          href="/support"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeUserMenu}
                        >
                          <LifeBuoy className="w-4 h-4 text-gray-600" />
                          Support Center
                        </Link>
                      </>
                    )}

                    {/* Logout */}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="bg-primary-light text-neutral px-4 py-2 rounded hover:bg-primary transition"
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
