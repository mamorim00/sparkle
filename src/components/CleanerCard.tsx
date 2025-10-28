"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";

// --- Helper Function for Formatting Time ---
const formatAvailability = (date: Date) => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  const isToday = now.toDateString() === date.toDateString();
  const isTomorrow = tomorrow.toDateString() === date.toDateString();

  const timePart = date.toLocaleTimeString(undefined, timeOptions);

  if (isToday) return `Today at ${timePart}`;
  if (isTomorrow) return `Tomorrow at ${timePart}`;

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  const datePart = date.toLocaleDateString(undefined, dateOptions);
  return `${datePart} at ${timePart}`;
};

interface CleanerCardProps {
  id: string;
  name: string;
  photoUrl: string;
  rating?: number;
  reviewCount?: number;
  location: string;
  pricePerHour: number;
  verified?: boolean;
  nextAvailable2h?: string | Timestamp | null;
  nextAvailable6h?: string | Timestamp | null;
  selectedDuration: number; // 2 or 6
}

export default function CleanerCard({
  id,
  name,
  photoUrl,
  rating = 0,
  reviewCount = 0,
  location,
  pricePerHour,
  verified = true,
  nextAvailable2h,
  nextAvailable6h,
  selectedDuration,
}: CleanerCardProps) {
  const router = useRouter();

  const handleBookNow = () => {
    router.push(`/book/${id}?duration=${selectedDuration}`);
  };

  // Convert Firestore Timestamp or ISO string to Date
  const parseDate = (value: string | Timestamp | null | undefined) => {
    if (!value) return null;
    if (value instanceof Timestamp) return value.toDate();
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const nextAvailableDate =
    selectedDuration === 2 ? parseDate(nextAvailable2h) :
    selectedDuration === 6 ? parseDate(nextAvailable6h) :
    null;

  // Check if the next available time is in the past
  const now = new Date();
  const isInPast = nextAvailableDate && nextAvailableDate.getTime() <= now.getTime();

  // If time is in the past, treat as not available
  const formattedTime = (nextAvailableDate && !isInPast) ? formatAvailability(nextAvailableDate) : "Not available soon";

  const renderStars = (rating: number, reviewCount: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {Array(fullStars).fill(0).map((_, i) => <span key={`full-${i}`} className="text-amber-400">★</span>)}
        {halfStar && <span className="text-amber-400">☆</span>}
        {Array(emptyStars).fill(0).map((_, i) => <span key={`empty-${i}`} className="text-gray-300">★</span>)}
        <span className="ml-1.5 text-gray-600 text-sm font-medium">
          {rating > 0 ? rating.toFixed(1) : 'No reviews yet'}
        </span>
        {reviewCount > 0 && (
          <span className="ml-1 text-gray-500 text-xs">
            ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col overflow-hidden border border-gray-200">
      {/* Image Container with proper aspect ratio */}
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        <Image
          src={photoUrl}
          alt={name}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Name and Verified Badge */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {name}
            </h3>
            {verified && (
              <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>

          {/* Location */}
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </p>

          {/* Rating */}
          <div>{renderStars(rating, reviewCount)}</div>

          {/* Price */}
          <p className="text-xl font-bold text-gray-900">{pricePerHour}€<span className="text-sm font-normal text-gray-500">/hour</span></p>

          {/* Availability */}
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Next Available
            </p>
            <p className={`text-sm font-semibold ${(nextAvailableDate && !isInPast) ? 'text-green-600' : 'text-gray-400'}`}>
              {formattedTime}
            </p>
          </div>
        </div>

        {/* Book Button */}
        <button
          onClick={handleBookNow}
          className="mt-4 w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 font-semibold text-sm"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}