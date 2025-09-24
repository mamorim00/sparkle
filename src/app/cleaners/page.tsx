"use client";

import { useEffect, useState } from "react";
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
}

export default function CleanersPage() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const { location } = useLocation(); // get current location

  useEffect(() => {
    const fetchCleaners = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "cleaners"),
          where("location", "==", location)
        );
        const querySnapshot = await getDocs(q);
        const data: Cleaner[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Cleaner[];
        setCleaners(data);
      } catch (err) {
        console.error("Error fetching cleaners:", err);
        setCleaners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCleaners();
  }, [location]); // refetch when location changes

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
                photoUrl={cleaner.photoUrl}
                rating={cleaner.rating}
                location={cleaner.location}
                pricePerHour={cleaner.pricePerHour}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
