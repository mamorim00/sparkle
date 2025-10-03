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

  const formattedTime = nextAvailableDate ? formatAvailability(nextAvailableDate) : "Not available soon";

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {Array(fullStars).fill(0).map((_, i) => <span key={`full-${i}`} className="text-yellow-500">★</span>)}
        {halfStar && <span className="text-yellow-500">☆</span>}
        {Array(emptyStars).fill(0).map((_, i) => <span key={`empty-${i}`} className="text-gray-300">★</span>)}
        <span className="ml-2 text-gray-700 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition flex flex-col overflow-hidden">
      <div className="relative w-full h-44 sm:h-52 md:h-60 border-2 border-gray-200 rounded-t-xl overflow-hidden">
  <Image
    src={photoUrl}
    alt={name}
    fill
    className="object-cover object-center"
  />
</div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center justify-between">
            {name}
            {verified && <span className="ml-2 text-green-500 font-semibold text-sm">✔ Verified</span>}
          </h3>
          <p className="text-sm text-primary-dark mt-1 flex items-center">
            <span className="mr-1">📍</span> {location}
          </p>

          <div className="mt-2">{renderStars(rating)}</div>
          <p className="mt-2 text-gray-800 font-semibold">{pricePerHour}€ / hour</p>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">Next Available</p>
            <p className={`text-sm font-bold ${nextAvailableDate ? 'text-green-600' : 'text-red-500'}`}>
              {formattedTime}
            </p>
          </div>
        </div>

        <button
          onClick={handleBookNow}
          className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
