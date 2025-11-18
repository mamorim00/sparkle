"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Check, X, Clock, Mail, Calendar, User as UserIcon } from "lucide-react";

interface BookingRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  cleaningType: string;
  date: string;
  start: string;
  end: string;
  duration: number;
  amount: number;
  status: string;
  createdAt: string;
  requestExpiresAt: string;
  confirmationToken: string;
}

export default function CleanerRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cleanerId, setCleanerId] = useState<string | null>(null);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Check authentication and get cleaner ID
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login?redirect=/cleaner/requests");
        return;
      }

      // Check if cleaner profile exists (document ID = user UID)
      const cleanerDocRef = doc(db, "cleaners", user.uid);
      const cleanerDoc = await getDoc(cleanerDocRef);

      if (!cleanerDoc.exists()) {
        // Try alternative: find by userId field
        const cleanersQuery = query(
          collection(db, "cleaners"),
          where("userId", "==", user.uid)
        );
        const cleanersSnapshot = await getDocs(cleanersQuery);

        if (cleanersSnapshot.empty) {
          setError("No cleaner profile found. Please complete your cleaner setup.");
          setLoading(false);
          return;
        }

        const altCleanerDoc = cleanersSnapshot.docs[0];
        setCleanerId(altCleanerDoc.id);
        await fetchPendingRequests(altCleanerDoc.id);
      } else {
        // Use user UID as cleaner ID (standard pattern)
        setCleanerId(user.uid);
        await fetchPendingRequests(user.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchPendingRequests = async (cleanerId: string) => {
    try {
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("cleanerId", "==", cleanerId),
        where("status", "==", "pending_cleaner_confirmation")
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingRequests: BookingRequest[] = [];

      for (const doc of bookingsSnapshot.docs) {
        const data = doc.data();

        // Check if not expired AND booking is in the future
        const now = new Date();
        const expiresAt = new Date(data.requestExpiresAt);
        const bookingDateTime = new Date(`${data.date}T${data.start}`);

        if (now < expiresAt && bookingDateTime > now) {
          bookingRequests.push({
            id: doc.id,
            ...data,
          } as BookingRequest);
        }
      }

      // Sort by creation date (newest first)
      bookingRequests.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRequests(bookingRequests);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load booking requests");
      setLoading(false);
    }
  };

  const handleConfirmation = async (bookingId: string, token: string, action: "accept" | "reject") => {
    if (!cleanerId) return;

    setConfirmingId(bookingId);
    setError("");

    try {
      const response = await fetch("/api/confirm-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          action: action,
          method: "dashboard",
          cleanerId: cleanerId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to confirm booking");
      }

      // Remove from list on success
      setRequests(prev => prev.filter(req => req.id !== bookingId));

      // Show success message
      alert(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-indigo-600"></div>
          <p className="text-lg mt-4 text-gray-600">Loading booking requests...</p>
        </div>
      </div>
    );
  }

  if (error && !requests.length) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-bold text-red-700">Error</h1>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={() => router.push("/cleaner-dashboard")}
            className="mt-4 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Requests</h1>
      <p className="text-gray-600 mb-8">Review and respond to customer booking requests</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Pending Requests</h2>
          <p className="text-gray-600">You don&apos;t have any booking requests at the moment.</p>
          <button
            onClick={() => router.push("/cleaner-dashboard")}
            className="mt-6 bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => {
            const expiresAt = new Date(request.requestExpiresAt);
            const hoursUntilExpiry = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));
            const bookingDate = new Date(request.date);
            const formattedDate = bookingDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{request.cleaningType}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Expires in {hoursUntilExpiry} hour{hoursUntilExpiry !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full font-medium">
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
                      <span><strong>Customer:</strong> {request.customerName}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Mail className="w-5 h-5 mr-2 text-gray-500" />
                      <span><strong>Email:</strong> {request.customerEmail}</span>
                    </div>
                    {request.customerPhone && (
                      <div className="flex items-center text-gray-700">
                        <span className="mr-2">📱</span>
                        <span><strong>Phone:</strong> {request.customerPhone}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                      <span><strong>Date:</strong> {formattedDate}</span>
                    </div>
                    <div className="text-gray-700">
                      <span><strong>Time:</strong> {request.start} - {request.end}</span>
                    </div>
                    <div className="text-gray-700">
                      <span><strong>Duration:</strong> {request.duration} hours</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 font-semibold text-lg">
                    💰 Service Value: €{request.amount.toFixed(2)}
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Send invoice to customer after completing the service
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleConfirmation(request.id, request.confirmationToken, "accept")}
                    disabled={confirmingId === request.id}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center disabled:bg-gray-400"
                  >
                    {confirmingId === request.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Accept Booking
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleConfirmation(request.id, request.confirmationToken, "reject")}
                    disabled={confirmingId === request.id}
                    className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center disabled:bg-gray-400"
                  >
                    {confirmingId === request.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <X className="w-5 h-5 mr-2" />
                        Decline
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
