"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface CleanerCardProps {
  id: string;
  name: string;
  photoUrl: string;
  rating?: number; // Optional
  location: string;
  pricePerHour: number;
  verified?: boolean; // Optional verified badge
}

export default function CleanerCard({
  id,
  name,
  photoUrl,
  rating = 0,
  location,
  pricePerHour,
  verified = true,
}: CleanerCardProps) {
  const router = useRouter();

  const handleBookNow = () => {
    router.push(`/book/${id}`);
  };

  // Render stars
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {Array(fullStars)
          .fill(0)
          .map((_, i) => (
            <span key={`full-${i}`} className="text-yellow-500">★</span>
          ))}
        {halfStar && <span className="text-yellow-500">☆</span>}
        {Array(emptyStars)
          .fill(0)
          .map((_, i) => (
            <span key={`empty-${i}`} className="text-gray-300">★</span>
          ))}
        <span className="ml-2 text-gray-700 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition flex flex-col overflow-hidden">
      {/* Image */}
      <div className="relative w-full h-44">
        <Image
          src={photoUrl}
          alt={name}
          fill
          className="object-cover"
        />
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center justify-between">
            {name}
            {verified && (
              <span className="ml-2 text-green-500 font-semibold text-sm">✔ Verified</span>
            )}
          </h3>
          <p className="text-sm text-primary-dark mt-1 flex items-center">
  <span className="mr-1">📍</span> {location}
      </p>


          {/* Rating */}
          <div className="mt-2">{renderStars(rating)}</div>

          {/* Price */}
          <p className="mt-2 text-gray-800 font-semibold">{pricePerHour}€ / hour</p>
        </div>

        {/* Action */}
        <button
          onClick={handleBookNow}
          className="mt-4 w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
