"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import CleanerCard from "../components/CleanerCard";
import Link from "next/link";
import Image from "next/image";
import { useLocation } from "../context/LocationContext";

// inside HomePage


interface Cleaner {
  id: string;
  name: string;
  photoUrl: string;
  rating: number;
  location: string;
  pricePerHour: number;
}

interface Service {
  id: string;
  name: string;
  imageUrl: string;
}

const POPULAR_SERVICES: Service[] = [
  { id: "simple-clean", name: "Simple Clean", imageUrl: "/images/simple.jpg" },
  { id: "deep-clean", name: "Deep Clean", imageUrl: "/images/deep-clean.jpg" },
  { id: "move-out-clean", name: "Move-Out Clean", imageUrl: "/images/move-out-clean.jpg" },
];

export default function HomePage() {
  const { location } = useLocation(); 
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedCleaners = async () => {
      try {
        const q = query(
          collection(db, "cleaners"),
          where("status", "==", "approved"),
          where("location", "==", location), // <-- filter by selected location
          limit(6)
        );
        const querySnapshot = await getDocs(q);

        const data: Cleaner[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Cleaner[];

        setCleaners(data);
      } catch (err) {
        console.error("Error fetching cleaners:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCleaners();
  }, []);

  return (
    <main className="min-h-screen bg-primary text-gray-800 font-sans">
      {/* Hero Section */}
      <section className="bg-primary py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900">
            Find Trusted Cleaners
          </h1>
          <p className="text-lg md:text-2xl mb-8 text-gray-700">
            Book professional cleaning services in just a few clicks
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="What service do you need?"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-primary-light focus:outline-none focus:ring-2 focus:ring-accent text-gray-800"
            />
            <button className="bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
          Popular Services
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {POPULAR_SERVICES.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.id}`}
              className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition"
            >
              <div className="relative w-full h-56 sm:h-64">
                <Image
                  src={service.imageUrl}
                  alt={service.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-30 p-4 backdrop-blur-sm">
                <p className="text-white text-xl font-semibold">{service.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Cleaners */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
          Popular Cleaners
        </h2>

        {loading ? (
          <p className="text-center text-gray-700">Loading cleaners...</p>
        ) : cleaners.length === 0 ? (
          <p className="text-center text-gray-700">No cleaners available yet.</p>
        ) : (
          <>
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

            <div className="mt-12 text-center">
              <Link
                href="/cleaners"
                className="inline-block bg-accent text-white px-8 py-3 rounded-2xl font-semibold hover:bg-primary-dark transition"
              >
                View All Cleaners
              </Link>
            </div>
          </>
        )}
      </section>

      {/* How it works section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="p-6 bg-primary-light rounded-2xl shadow-md hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {step}. {step === 1 ? "Search a Service" : step === 2 ? "Book a Service" : "Get it Done"}
                </h3>
                <p className="text-gray-700">
                  {step === 1
                    ? "Type the service you need and browse trusted professionals."
                    : step === 2
                    ? "Select a cleaner and book instantly with secure payment."
                    : "Cleaner arrives on time and your space shines."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
