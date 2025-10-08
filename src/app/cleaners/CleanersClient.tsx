"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import CleanerCard from "../../components/CleanerCard";
import { useLocation } from "../../context/LocationContext";

interface Cleaner {
  id: string;
  name: string;
  photoUrl: string;
  rating: number;
  location: string;
  pricePerHour: number;
  status: string;
  service: string[];
  nextAvailable2h: string | null;
  nextAvailable6h: string | null;
}

interface Service {
  id: string;
  name: string;
}



const DEFAULT_IMAGE = "/images/default-cleaner.png";
const ALL_SERVICES: Service[] = [
  { id: "simple-clean", name: "Simple Clean" },
  { id: "deep-clean", name: "Deep Clean" },
  { id: "move-out-clean", name: "Move-Out Clean" },
  { id: "office-clean", name: "Office Clean" },
  { id: "post-construction-clean", name: "Post-Construction Clean" },
  { id: "carpet-cleaning", name: "Carpet Cleaning" },
  { id: "window-cleaning", name: "Window Cleaning" },
  { id: "laundry-service", name: "Laundry Service" },
];

export default function CleanersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { location } = useLocation();

  const [serviceId, setServiceId] = useState<string>("");
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);

  // Set serviceId from URL params
  useEffect(() => {
    const id = searchParams.get("service") || "";
    setServiceId(id);
  }, [searchParams]);

  // Fetch cleaners from Firestore
  useEffect(() => {
    if (!location) return;

    const fetchCleaners = async () => {
      setLoading(true);
      try {
        const conditions = [
          where("location", "==", location),
          where("status", "==", "approved"),
        ];
        if (serviceId) conditions.push(where("services", "array-contains", serviceId));

        const q = query(collection(db, "cleaners"), ...conditions);
        const snapshot = await getDocs(q);

        const data: Cleaner[] = snapshot.docs.map((doc) => {
          const cleanerData = doc.data() as Omit<Cleaner, "id" | "photoUrl"> & {
            photoUrl?: string;
          };
          return { id: doc.id, ...cleanerData, photoUrl: cleanerData.photoUrl || DEFAULT_IMAGE };
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

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/cleaners?service=${e.target.value}`);
  };

  if (loading) return <p className="text-center">Loading cleaners...</p>;

  return (
    <div className="min-h-screen bg-primary-light py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Available Cleaners in {location}
        </h1>

        <div className="flex justify-center mb-6">
          <select
            value={serviceId}
            onChange={handleServiceChange}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800"
          >
            <option value="">All Services</option>
            {ALL_SERVICES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {cleaners.length === 0 ? (
          <p className="text-center text-gray-700">
            No cleaners available in {location} for{" "}
            {serviceId ? ALL_SERVICES.find(s => s.id === serviceId)?.name : "any service"}.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {cleaners.map((cleaner) => (
              <CleanerCard key={cleaner.id} {...cleaner} selectedDuration={2} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}