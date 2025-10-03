"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import CleanerCard from "../../components/CleanerCard";
import { useLocation } from "../../context/LocationContext";

interface Cleaner {
  id: string;
  name: string;
  photoUrl: string; // ✅ always string now
  rating: number;
  location: string;
  pricePerHour: number;
  status: string;
  nextAvailable2h: string | null; // if you added this prop
  nextAvailable6h: string | null; 
}

const DEFAULT_IMAGE = "/images/default-cleaner.png"; // <- put this in public/images

export default function CleanersPage() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const { location } = useLocation();

  useEffect(() => {
    const fetchCleaners = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "cleaners"),
          where("location", "==", location),
          where("status", "==", "approved") // ✅ only approved cleaners
        );

        const querySnapshot = await getDocs(q);
        const data: Cleaner[] = querySnapshot.docs.map((doc) => {
          const cleanerData = doc.data() as Omit<Cleaner, "id" | "photoUrl"> & { photoUrl?: string };
          return {
            id: doc.id,
            ...cleanerData,
            photoUrl: cleanerData.photoUrl || DEFAULT_IMAGE, // ✅ fallback ensures string
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
  }, [location]);

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

        {cleaners.length === 0 ? (
          <p className="text-center text-gray-700">
            No cleaners available in {location}. More locations coming soon!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {cleaners.map((cleaner) => (
              <CleanerCard
                key={cleaner.id}
                id={cleaner.id}
                name={cleaner.name}
                photoUrl={cleaner.photoUrl} // ✅ always string now
                rating={cleaner.rating}
                location={cleaner.location}
                pricePerHour={cleaner.pricePerHour}
                nextAvailable2h={cleaner.nextAvailable2h}
                nextAvailable6h={cleaner.nextAvailable6h}
                selectedDuration={2} // or 6 depending on the page
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
