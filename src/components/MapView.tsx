"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

export interface CleanerMapData {
  id: string;
  name: string;
  photoUrl: string;
  rating: number;
  reviewCount: number;
  location: string;
  pricePerHour: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  nextAvailable2h: string | null;
  nextAvailable6h: string | null;
  service: string[];
}

interface MapViewProps {
  cleaners: CleanerMapData[];
  onMarkerClick?: (cleanerId: string) => void;
  selectedCleanerId?: string | null;
  className?: string;
}

export default function MapView({
  cleaners,
  onMarkerClick,
  selectedCleanerId,
  className = "",
}: MapViewProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [popupInfo, setPopupInfo] = useState<CleanerMapData | null>(null);
  const [viewport, setViewport] = useState({
    latitude: 60.1699, // Helsinki default
    longitude: 24.9384,
    zoom: 11,
  });

  const mapRef = useRef<any>(null);

  // Calculate map bounds based on cleaner locations
  useEffect(() => {
    if (cleaners.length === 0) return;

    const validCleaners = cleaners.filter(
      (c) => c.coordinates?.lat && c.coordinates?.lng
    );

    if (validCleaners.length === 0) return;

    if (validCleaners.length === 1) {
      // If only one cleaner, center on them
      const cleaner = validCleaners[0];
      setViewport({
        latitude: cleaner.coordinates.lat,
        longitude: cleaner.coordinates.lng,
        zoom: 12,
      });
      return;
    }

    // Calculate bounds
    const lats = validCleaners.map((c) => c.coordinates.lat);
    const lngs = validCleaners.map((c) => c.coordinates.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    setViewport({
      latitude: centerLat,
      longitude: centerLng,
      zoom: 11,
    });

    // Fit bounds with padding
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: 50,
          duration: 1000,
        }
      );
    }
  }, [cleaners]);

  // Handle selected cleaner (from card click)
  useEffect(() => {
    if (!selectedCleanerId) return;

    const selectedCleaner = cleaners.find((c) => c.id === selectedCleanerId);
    if (selectedCleaner && selectedCleaner.coordinates) {
      setViewport({
        latitude: selectedCleaner.coordinates.lat,
        longitude: selectedCleaner.coordinates.lng,
        zoom: 14,
      });
      setPopupInfo(selectedCleaner);
    }
  }, [selectedCleanerId, cleaners]);

  const handleMarkerClick = useCallback(
    (cleaner: CleanerMapData) => {
      setPopupInfo(cleaner);
      if (onMarkerClick) {
        onMarkerClick(cleaner.id);
      }
    },
    [onMarkerClick]
  );

  // Format ISO timestamp to readable format
  const formatAvailableTime = (isoString: string | null): string | null => {
    if (!isoString) return null;

    try {
      const date = new Date(isoString);
      const now = new Date();

      // Check if date is valid
      if (isNaN(date.getTime())) return null;

      // Calculate time difference
      const diffMs = date.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // If in the past or more than 7 days away, don't show
      if (diffMs < 0 || diffDays > 7) return null;

      // Format based on time difference
      if (diffHours < 1) {
        return "Available now";
      } else if (diffHours < 24) {
        return `Available in ${diffHours}h`;
      } else if (diffDays === 1) {
        return "Available tomorrow";
      } else {
        return `Available in ${diffDays} days`;
      }
    } catch (e) {
      return null;
    }
  };

  if (!mapboxToken) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center p-4">
          <p className="text-gray-600">Map not available</p>
          <p className="text-sm text-gray-500 mt-2">
            NEXT_PUBLIC_MAPBOX_TOKEN is not set
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Map
        ref={mapRef}
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        mapboxAccessToken={mapboxToken}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {/* Navigation controls */}
        <NavigationControl position="top-right" />

        {/* Cleaner markers */}
        {cleaners
          .filter((cleaner) => cleaner.coordinates?.lat && cleaner.coordinates?.lng)
          .map((cleaner) => (
            <Marker
              key={cleaner.id}
              latitude={cleaner.coordinates.lat}
              longitude={cleaner.coordinates.lng}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(cleaner);
              }}
            >
              <div
                className={`cursor-pointer transition-transform hover:scale-110 ${
                  selectedCleanerId === cleaner.id ? "scale-125" : ""
                }`}
              >
                {/* Custom marker icon */}
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full border-3 overflow-hidden shadow-lg ${
                      selectedCleanerId === cleaner.id
                        ? "border-blue-500 ring-4 ring-blue-300"
                        : "border-white"
                    }`}
                  >
                    <img
                      src={cleaner.photoUrl}
                      alt={cleaner.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </Marker>
          ))}

        {/* Popup when marker is clicked */}
        {popupInfo && (
          <Popup
            latitude={popupInfo.coordinates.lat}
            longitude={popupInfo.coordinates.lng}
            anchor="top"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            className="cleaner-popup"
          >
            <div className="p-2 min-w-[200px]">
              <div className="flex items-start gap-3">
                <img
                  src={popupInfo.photoUrl}
                  alt={popupInfo.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{popupInfo.name}</h3>
                  {popupInfo.rating && popupInfo.rating > 0 ? (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <span>⭐ {popupInfo.rating.toFixed(1)}</span>
                      <span>({popupInfo.reviewCount || 0})</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">New cleaner</p>
                  )}
                  <p className="text-xs text-gray-500">{popupInfo.location}</p>
                  <p className="text-sm font-bold text-green-600 mt-1">
                    €{popupInfo.pricePerHour}/hr
                  </p>
                  {formatAvailableTime(popupInfo.nextAvailable2h) && (
                    <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                      {formatAvailableTime(popupInfo.nextAvailable2h)}
                    </p>
                  )}
                  <a
                    href={`/book/${popupInfo.id}`}
                    className="inline-block mt-2 bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600 transition-colors"
                  >
                    Book Now
                  </a>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
