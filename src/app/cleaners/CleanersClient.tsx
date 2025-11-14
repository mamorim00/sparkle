"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import CleanerCard from "../../components/CleanerCard";
import { useLocation } from "../../context/LocationContext";
import { useLanguage } from "../../context/LanguageContext";
import { SERVICES_BASIC, DEFAULT_CLEANER_IMAGE } from "../../lib/constants";
import { X, SlidersHorizontal } from "lucide-react";

interface Cleaner {
  id: string;
  name: string;
  photoUrl: string;
  rating: number;
  reviewCount: number;
  location: string;
  pricePerHour: number;
  status: string;
  service: string[];
  nextAvailable2h: string | null;
  nextAvailable6h: string | null;
}


export default function CleanersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { location } = useLocation();
  const { t } = useLanguage();

  const [serviceId, setServiceId] = useState<string>("");
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          where("stripeConnected", "==", true),
        ];
        if (serviceId) conditions.push(where("services", "array-contains", serviceId));

        const q = query(collection(db, "cleaners"), ...conditions);
        const snapshot = await getDocs(q);

        const data: Cleaner[] = snapshot.docs.map((doc) => {
          const cleanerData = doc.data() as Omit<Cleaner, "id" | "photoUrl"> & {
            photoUrl?: string;
          };
          return { id: doc.id, ...cleanerData, photoUrl: cleanerData.photoUrl || DEFAULT_CLEANER_IMAGE };
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

  // Filter cleaners based on price and rating
  const filteredCleaners = useMemo(() => {
    return cleaners.filter((cleaner) => {
      const priceInRange = cleaner.pricePerHour >= priceRange[0] && cleaner.pricePerHour <= priceRange[1];
      // If minRating is 0 (all ratings), include cleaners with no rating
      // Otherwise, only filter by rating if the cleaner has a rating
      const ratingAboveMin = minRating === 0 ? true : (cleaner.rating || 0) >= minRating;
      return priceInRange && ratingAboveMin;
    });
  }, [cleaners, priceRange, minRating]);

  const handleResetFilters = () => {
    setPriceRange([0, 100]);
    setMinRating(0);
  };

  if (loading) return <p className="text-center py-20">{t('common.loading')}</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('cleanersPage.title')} {location}
          </h1>
          <p className="text-gray-600">
            {filteredCleaners.length} {filteredCleaners.length !== 1 ? t('cleanersPage.cleanersFound') : t('cleanersPage.cleanerFound')}
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <SlidersHorizontal className="w-6 h-6" />
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{t('cleanersPage.filters')}</h2>
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('cleanersPage.reset')}
                </button>
              </div>

              {/* Service Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t('cleanersPage.serviceType')}
                </label>
                <select
                  value={serviceId}
                  onChange={handleServiceChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">{t('cleanersPage.allServices')}</option>
                  {SERVICES_BASIC.map((s) => (
                    <option key={s.id} value={s.id}>
                      {t(`services.${s.id}.name`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t('cleanersPage.pricePerHour')}
                </label>
                <div className="space-y-4">
                  <div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>€{priceRange[0]}</span>
                      <span className="font-semibold text-gray-900">€{priceRange[1]}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t('cleanersPage.minimumRating')}
                </label>
                <div className="space-y-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${
                        minRating === rating
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {rating === 0 ? (
                          t('cleanersPage.allRatings')
                        ) : (
                          <>
                            {rating}
                            <span className="text-yellow-500">★</span>
                            <span className="text-gray-500">{t('cleanersPage.andUp')}</span>
                          </>
                        )}
                      </span>
                      {minRating === rating && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Sidebar - Overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
              <aside
                className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">{t('cleanersPage.filters')}</h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleResetFilters}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {t('cleanersPage.reset')}
                      </button>
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Service Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Service Type
                    </label>
                    <select
                      value={serviceId}
                      onChange={handleServiceChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">All Services</option>
                      {SERVICES_BASIC.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Price Per Hour
                    </label>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-sm text-gray-600 mt-2">
                          <span>€{priceRange[0]}</span>
                          <span className="font-semibold text-gray-900">€{priceRange[1]}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Minimum Rating
                    </label>
                    <div className="space-y-2">
                      {[0, 3, 4, 4.5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${
                            minRating === rating
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {rating === 0 ? (
                              "All Ratings"
                            ) : (
                              <>
                                {rating}
                                <span className="text-yellow-500">★</span>
                                <span className="text-gray-500">& up</span>
                              </>
                            )}
                          </span>
                          {minRating === rating && (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {t('cleanersPage.applyFilters')}
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1">
            {filteredCleaners.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('cleanersPage.noCleanersFound')}</h3>
                <p className="text-gray-600 mb-6">
                  {t('cleanersPage.tryAdjustingFilters')}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('cleanersPage.resetAllFilters')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCleaners.map((cleaner) => (
                  <CleanerCard key={cleaner.id} {...cleaner} selectedDuration={2} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}