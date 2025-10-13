"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Cleaner {
  id: string;
  name: string;
  photoUrl: string;
  rating?: number;
  location: string;
  pricePerHour: number;
  nextAvailable2h?: Timestamp | null;
  nextAvailable6h?: Timestamp | null;
}

interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  serviceDuration: number; // 2 or 6 hours
  location: string;
}

export default function ServiceBookingModal({
  isOpen,
  onClose,
  serviceId,
  serviceName,
  serviceDuration,
  location,
}: ServiceBookingModalProps) {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const fetchCleaners = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "cleaners"),
          where("status", "==", "approved"),
          where("location", "==", location),
          where("services", "array-contains", serviceId)
        );
        const snapshot = await getDocs(q);

        const data: Cleaner[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Cleaner[];

        // Sort by next available time for the selected duration
        const sortedCleaners = data
          .filter((cleaner) => {
            // Only include cleaners who have availability data
            const availField = serviceDuration === 2 ? cleaner.nextAvailable2h : cleaner.nextAvailable6h;
            return availField !== null && availField !== undefined;
          })
          .sort((a, b) => {
            const aTime = serviceDuration === 2 ? a.nextAvailable2h : a.nextAvailable6h;
            const bTime = serviceDuration === 2 ? b.nextAvailable2h : b.nextAvailable6h;

            if (!aTime) return 1;
            if (!bTime) return -1;

            const aDate = aTime.toDate();
            const bDate = bTime.toDate();

            return aDate.getTime() - bDate.getTime();
          });

        setCleaners(sortedCleaners);
      } catch (err) {
        console.error("Error fetching cleaners:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCleaners();
  }, [isOpen, location, serviceDuration, serviceId]);

  const formatAvailability = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return "Not available";

    const date = timestamp.toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const comparisonDate = new Date(date);
    comparisonDate.setHours(0, 0, 0, 0);

    const timeOptions: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };

    if (comparisonDate.getTime() === today.getTime()) {
      return `Today at ${date.toLocaleTimeString([], timeOptions)}`;
    } else if (comparisonDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow at ${date.toLocaleTimeString([], timeOptions)}`;
    } else {
      const dateOptions: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
      return `${date.toLocaleDateString([], dateOptions)} at ${date.toLocaleTimeString([], timeOptions)}`;
    }
  };

  const handleBookCleaner = (cleanerId: string) => {
    router.push(`/book/${cleanerId}?service=${serviceId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{serviceName}</h2>
            <p className="text-blue-100 text-sm mt-1">
              {serviceDuration} hour service • Select your cleaner
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
              <p className="text-gray-600 mt-4">Finding available cleaners...</p>
            </div>
          ) : cleaners.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">
                No cleaners available for {serviceDuration}-hour bookings in {location}
              </p>
              <button
                onClick={onClose}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Try another service
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Showing {cleaners.length} cleaner{cleaners.length !== 1 ? "s" : ""} sorted by earliest availability
              </p>

              {cleaners.map((cleaner, index) => {
                const availability = serviceDuration === 2 ? cleaner.nextAvailable2h : cleaner.nextAvailable6h;
                const isTopChoice = index === 0;

                return (
                  <div
                    key={cleaner.id}
                    className={`relative border rounded-xl p-5 hover:shadow-lg transition-all ${
                      isTopChoice ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {isTopChoice && (
                      <div className="absolute -top-3 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        ⚡ Earliest Available
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {/* Photo */}
                      <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
                        <Image
                          src={cleaner.photoUrl}
                          alt={cleaner.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cleaner.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          {cleaner.rating !== undefined && (
                            <span className="text-yellow-500 text-sm font-medium">
                              ★ {cleaner.rating.toFixed(1)}
                            </span>
                          )}
                          <span className="text-gray-600 text-sm">
                            €{cleaner.pricePerHour}/hour
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatAvailability(availability)}
                          </span>
                        </div>
                      </div>

                      {/* Book Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleBookCleaner(cleaner.id)}
                          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                            isTopChoice
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Can&apos;t find what you&apos;re looking for?{" "}
            <button
              onClick={() => {
                router.push(`/cleaners?service=${serviceId}`);
                onClose();
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View all cleaners
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
