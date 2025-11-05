"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import CleanerCard from "../components/CleanerCard";
import ServiceBookingModal from "../components/ServiceBookingModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocation } from "../context/LocationContext";
import { useLanguage } from "../context/LanguageContext";
import { SERVICES, type Service } from "../lib/constants";
import { ChevronLeft, ChevronRight, Sparkles, Shield, Clock, Award } from "lucide-react";

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
  const { t } = useLanguage();
  const router = useRouter();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);

  // search state
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredServices, setFilteredServices] = useState<Service[]>(ALL_SERVICES.slice(0, 3));
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // slider state
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 400;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [cleaners]);

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
      setFilteredServices(ALL_SERVICES.slice(0, 3));
    } else {
      const filtered = ALL_SERVICES.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 3);
      setFilteredServices(filtered);
    }
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-white text-neutral">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-accent-50 via-white to-accent-100 py-20 md:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent-light/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">{t('home.heroTitle')}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-primary-dark tracking-tight leading-tight">
            {t('home.heroMainTitle')}<br/>
            <span className="text-accent">{t('home.heroMainTitleHighlight')}</span>
          </h1>

          <p className="text-xl md:text-2xl mb-12 text-neutral-light font-light max-w-3xl mx-auto">
            {t('home.heroSubtitle')}
          </p>

          {/* Autocomplete Search */}
          <div className="relative flex justify-center max-w-2xl mx-auto mb-8">
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
                placeholder={t('home.searchPlaceholder')}
                className="w-full px-6 py-5 pr-14 rounded-2xl border-2 border-gray-200 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-neutral text-lg transition-all hover:shadow-xl"
              />

              {/* Search Icon */}
              <div className="absolute top-1/2 right-5 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-6 h-6 text-accent"
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
                <ul className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                  {filteredServices.map((service) => (
                    <li
                      key={service.id}
                      onClick={() => handleSelectService(service.id)}
                      className="px-6 py-3 cursor-pointer hover:bg-accent-50 text-left text-neutral transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      {service.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-neutral-light">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              <span>{t('home.verifiedCleaners')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              <span>{t('home.topRatedService')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              <span>{t('home.sameDayAvailable')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-primary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-dark mb-4 tracking-tight">
              {t('home.whatWeDo')}
            </h2>
            <p className="text-lg text-neutral-light max-w-2xl mx-auto">
              {t('home.whatWeDoSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-accent-50 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-primary-dark mb-3">
                {t('home.professionalCleaners')}
              </h3>
              <p className="text-neutral-light leading-relaxed">
                {t('home.professionalCleanersDesc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-accent-50 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-primary-dark mb-3">
                {t('home.flexibleScheduling')}
              </h3>
              <p className="text-neutral-light leading-relaxed">
                {t('home.flexibleSchedulingDesc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-accent-50 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-primary-dark mb-3">
                {t('home.satisfactionGuaranteed')}
              </h3>
              <p className="text-neutral-light leading-relaxed">
                {t('home.satisfactionGuaranteedDesc')}
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link
              href="/cleaners"
              className="inline-flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-accent-dark hover:text-white active:bg-accent-dark transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {t('home.exploreAllServices')}
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-primary-dark mb-14 text-center tracking-tight">
          {t('home.popularServices')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ALL_SERVICES.map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceCardClick(service)}
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-accent/30 transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-xl bg-accent-50 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-dark mb-2">
                    {t(`services.${service.id}.name`)}
                  </h3>
                  <p className="text-sm text-neutral-light leading-relaxed">
                    {t(`services.${service.id}.description`)}
                  </p>
                  <p className="text-xs text-accent font-semibold mt-2">
                    {service.durationHours} {t('common.hours')} {t('common.service')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Cleaners - Slider */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-primary-dark mb-14 text-center tracking-tight">
          {t('home.popularCleaners')}
        </h2>

        {loading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-accent"></div>
            <p className="mt-4 text-neutral-light text-lg">{t('common.loading')}</p>
          </div>
        ) : cleaners.length === 0 ? (
          <p className="text-center text-neutral-light text-lg">{t('home.noCleanersYet')}</p>
        ) : (
          <>
            {/* Slider Container */}
            <div className="relative">
              {/* Left Arrow */}
              {canScrollLeft && (
                <button
                  onClick={() => scroll("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white hover:bg-gray-50 text-accent rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Slider */}
              <div
                ref={sliderRef}
                onScroll={checkScroll}
                className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {cleaners.map((cleaner) => (
                  <div key={cleaner.id} className="flex-none w-[340px]">
                    <CleanerCard
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
                  </div>
                ))}
              </div>

              {/* Right Arrow */}
              {canScrollRight && (
                <button
                  onClick={() => scroll("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white hover:bg-gray-50 text-accent rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/cleaners"
                className="inline-flex items-center gap-2 bg-accent text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-accent-dark hover:text-white active:bg-accent-dark transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {t('home.viewAllCleaners')}
                <ChevronRight className="w-5 h-5" />
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