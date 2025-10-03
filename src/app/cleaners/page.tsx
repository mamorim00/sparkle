"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import CleanerCard from "../../components/CleanerCard";
import { useLocation } from "../../context/LocationContext";
import { useSearchParams } from "next/navigation";

interface Cleaner {
  id: string;
  name: string;
  photoUrl: string;
  rating: number;
  location: string;
  pricePerHour: number;
  status: string;
  service: string[]; // array of service IDs
  nextAvailable2h: string | null;
  nextAvailable6h: string | null;
}

interface Service {
  id: string;   // Firestore-friendly slug
  name: string; // display name
}

const DEFAULT_IMAGE = "/images/default-cleaner.png";

const ALL_SERVICES: Service[] = [
  { id: "simple-clean", name: "Simple Clean" },
  { id: "deep-clean", name: "Deep Clean" },
  { id: "move-out-clean", name: "Move-Out Clean" },
];

export default function CleanersPage() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const { location } = useLocation();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("service") || "";

  // helper to display friendly name in UI
  const getServiceName = (id: string) => {
    return ALL_SERVICES.find((s) => s.id === id)?.name || id;
  };

  useEffect(() => {
    const fetchCleaners = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, "cleaners"),
          where("location", "==", location),
          where("status", "==", "approved")
        );

        // filter by service ID if provided
        if (serviceId) {
          q = query(
            collection(db, "cleaners"),
            where("location", "==", location),
            where("status", "==", "approved"),
            where("services", "array-contains", serviceId)
          );
        }

        const querySnapshot = await getDocs(q);
        const data: Cleaner[] = querySnapshot.docs.map((doc) => {
          const cleanerData = doc.data() as Omit<Cleaner, "id" | "photoUrl"> & {
            photoUrl?: string;
          };
          return {
            id: doc.id,
            ...cleanerData,
            photoUrl: cleanerData.photoUrl || DEFAULT_IMAGE,
          };
        });
        setCleaners(data);
      } catch (err) {
        console.error("Error fetching cleaners:", err);
        setCleaners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCleaners();
  }, [location, serviceId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-primary-light">
        <p className="text-gray-700 text-lg">Loading cleaners...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-light py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Available Cleaners in {location}
        </h1>

        {/* Filter Dropdown */}
        <div className="flex justify-center mb-6">
          <select
            value={serviceId}
            onChange={(e) =>
              window.location.assign(`/cleaners?service=${e.target.value}`)
            }
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800"
          >
            <option value="">All Services</option>
            {ALL_SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {cleaners.length === 0 ? (
          <p className="text-center text-gray-700">
            No cleaners available in {location} for{" "}
            {serviceId ? getServiceName(serviceId) : "any service"}.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {cleaners.map((cleaner) => (
              <CleanerCard
                key={cleaner.id}
                id={cleaner.id}
                name={cleaner.name}
                photoUrl={cleaner.photoUrl}
                rating={cleaner.rating}
                location={cleaner.location}
                pricePerHour={cleaner.pricePerHour}
                nextAvailable2h={cleaner.nextAvailable2h}
                nextAvailable6h={cleaner.nextAvailable6h}
                selectedDuration={2}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
