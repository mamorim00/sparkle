"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import CleanerCard from "../components/CleanerCard";
import Link from "next/link";
import Image from "next/image";
import { useLocation } from "../context/LocationContext";
import { useRouter } from "next/navigation";

interface Cleaner {
  id: string;
  name: string;
  photoUrl: string;
  rating: number;
  location: string;
  pricePerHour: number;
  nextAvailable2h: string | null;
  nextAvailable6h: string | null;
}

interface Service {
  id: string;
  name: string;
  imageUrl: string;
}



const ALL_SERVICES: Service[] = [
  { id: "simple-clean", name: "Simple Clean", imageUrl: "/images/simple.jpg" },
  { id: "deep-clean", name: "Deep Clean", imageUrl: "/images/deep-clean.jpg" },
  { id: "move-out-clean", name: "Move-Out Clean", imageUrl: "/images/move-out-clean.jpg" },
];

export default function HomePage() {
  const { location } = useLocation();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);

  // search state
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredServices, setFilteredServices] = useState<Service[]>(ALL_SERVICES.slice(0, 5));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  // fetch featured cleaners
  useEffect(() => {
    const fetchFeaturedCleaners = async () => {
      try {
        const q = query(
          collection(db, "cleaners"),
          where("status", "==", "approved"),
          where("location", "==", location),
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
  }, [location]);

  // filter services for autocomplete dropdown
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredServices(ALL_SERVICES.slice(0, 5));
    } else {
      const filtered = ALL_SERVICES.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5);
      setFilteredServices(filtered);
    }
  }, [searchTerm]);

  // helper to get service ID from name
  const getServiceIdFromName = (name: string) => {
    const service = ALL_SERVICES.find((s) => s.name.toLowerCase() === name.toLowerCase());
    return service?.id;
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    const serviceId = getServiceIdFromName(searchTerm);
    if (serviceId) {
      router.push(`/cleaners?service=${serviceId}`);
    } else {
      router.push("/cleaners"); // fallback
    }
  };

  const handleSelectService = (serviceName: string) => {
    setSearchTerm(serviceName);
    setDropdownOpen(false);
  };

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

          {/* Autocomplete Search */}
          <div className="relative flex flex-col sm:flex-row justify-center gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="What service do you need?"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-primary-light focus:outline-none focus:ring-2 focus:ring-accent text-gray-800"
              />

              {dropdownOpen && filteredServices.length > 0 && (
                <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                  {filteredServices.map((service) => (
                    <li
                      key={service.id}
                      onClick={() => handleSelectService(service.name)}
                      className="px-4 py-2 cursor-pointer hover:bg-primary-light text-left"
                    >
                      {service.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition"
            >
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
          {ALL_SERVICES.map((service) => (
            <div
              key={service.id}
              onClick={() => router.push(`/cleaners?service=${encodeURIComponent(service.name)}`)}
              className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition cursor-pointer"
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
            </div>
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
                  nextAvailable2h={cleaner.nextAvailable2h}
                  nextAvailable6h={cleaner.nextAvailable6h}
                  selectedDuration={2}
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
    </main>
  );
}
