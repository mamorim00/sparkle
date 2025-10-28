"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import CleanerCard from "../components/CleanerCard";
import ServiceBookingModal from "../components/ServiceBookingModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocation } from "../context/LocationContext";
import { SERVICES, type Service } from "../lib/constants";

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

// Service icons mapped by service ID
const SERVICE_ICONS: Record<string, React.ReactNode> = {
  "simple-clean": (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  "deep-clean": (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  "move-out-clean": (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  "office-clean": (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  "window-cleaning": (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
    </svg>
  ),
  "carpet-cleaning": (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  "post-construction": (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  "laundry-service": (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

// Extend Service type to include icon
interface ServiceWithIcon extends Service {
  icon: React.ReactNode;
}

// Services with icons for the homepage
const ALL_SERVICES: ServiceWithIcon[] = SERVICES.map(service => ({
  ...service,
  icon: SERVICE_ICONS[service.id] || null,
}));

export default function HomePage() {
  const { location } = useLocation();
  const router = useRouter();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);

  // search state
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredServices, setFilteredServices] = useState<Service[]>(ALL_SERVICES.slice(0, 5));
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleSelectService = (serviceId: string) => {
    // Redirect to cleaners page with service filter
    router.push(`/cleaners?service=${serviceId}`);
  };

  const handleServiceCardClick = (service: Service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-white text-neutral">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-blue-50 to-primary py-28">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-primary-dark tracking-tight leading-tight">
            Find Trusted Cleaners
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-neutral font-light max-w-3xl mx-auto">
            Book professional cleaning services in just a few clicks
          </p>

          {/* Autocomplete Search */}
          <div className="relative flex justify-center max-w-2xl mx-auto">
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                placeholder="What service do you need?"
                className="w-full px-6 py-4 pr-12 rounded-2xl border-2 border-neutral-light/20 bg-white shadow-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-neutral text-lg transition-all"
              />

              {/* Search Icon */}
              <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-6 h-6 text-neutral-light"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.65" y1="16.65" x2="21" y2="21" />
                </svg>
              </div>

              {/* Dropdown */}
              {dropdownOpen && filteredServices.length > 0 && (
                <ul className="absolute left-0 right-0 mt-2 bg-white border border-neutral-light/20 rounded-2xl shadow-2xl z-10 max-h-60 overflow-y-auto">
                  {filteredServices.map((service) => (
                    <li
                      key={service.id}
                      onClick={() => handleSelectService(service.id)}
                      className="px-6 py-3 cursor-pointer hover:bg-indigo-50 text-left text-neutral transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      {service.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-primary-dark mb-14 text-center tracking-tight">
          Popular Services
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ALL_SERVICES.map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceCardClick(service)}
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                  <p className="text-xs text-blue-600 font-medium mt-2">
                    {service.durationHours} hour service
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Cleaners */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-primary-dark mb-14 text-center tracking-tight">
          Popular Cleaners
        </h2>

        {loading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-light border-t-accent"></div>
            <p className="mt-4 text-neutral text-lg">Loading cleaners...</p>
          </div>
        ) : cleaners.length === 0 ? (
          <p className="text-center text-neutral text-lg">No cleaners available yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
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

            <div className="mt-16 text-center">
              <Link
                href="/cleaners"
                className="inline-block
                          bg-blue-600 text-white
                          px-10 py-4 rounded-xl
                          text-lg font-semibold
                          hover:bg-blue-700
                          active:bg-blue-800
                          transition-all duration-200
                          shadow-md hover:shadow-lg
                          transform hover:-translate-y-0.5"
              >
                View All Cleaners
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Service Booking Modal */}
      {selectedService && (
        <ServiceBookingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          serviceId={selectedService.id}
          serviceName={selectedService.name}
          serviceDuration={selectedService.durationHours}
          location={location}
        />
      )}
    </div>
  );
}