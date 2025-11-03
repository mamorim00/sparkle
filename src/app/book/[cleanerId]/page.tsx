"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { SERVICES, PRICE_MULTIPLIERS, MAX_SEARCH_DAYS } from "../../../lib/constants";
import { useLanguage } from "../../../context/LanguageContext";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp, // Import Timestamp for cleaner interface typing
} from "firebase/firestore";

// --- INTERFACES & CONSTANTS ---
interface TimeSlot {
  start: string;
  end: string;
}

interface Cleaner {
  id: string;
  name: string;
  photoUrl: string;
  rating?: number;
  location: string;
  pricePerHour: number;
  schedule: Record<string, TimeSlot[]>;
  exceptions: (TimeSlot & { date: string })[];
  // ADDED: Pre-calculated availability fields
  nextAvailable2h?: Timestamp | null; 
  nextAvailable6h?: Timestamp | null;
}

// Cleaning type with price multiplier
interface CleaningType {
  id: string;
  name: string;
  durationHours: number;
  priceMultiplier: number;
}

// Map services to cleaning types with price multipliers
const CLEANING_TYPES: CleaningType[] = SERVICES.map((service) => ({
  id: service.id,
  name: service.name,
  durationHours: service.durationHours,
  priceMultiplier: PRICE_MULTIPLIERS[service.id] || 1,
}));



// --- HELPER FUNCTIONS (Modified) ---

// Helper functions (time conversion, etc.) remain unchanged
const timeToMinutes = (time?: string) => {
  if (!time) return 0; // fallback if undefined
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};
const addHours = (time: string, hours: number) => {
  const [h, m] = time.split(":").map(Number);
  const end = new Date();
  end.setHours(h + hours, m, 0, 0);
  return `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
};

const generateAvailableSlots = (slots: TimeSlot[], durationHours: number) => {
  const result: string[] = [];
  const requiredMinutes = durationHours * 60;
  for (const slot of slots) {
    if (!slot.start || !slot.end) continue; // skip invalid slots
    const startMinutes = timeToMinutes(slot.start);
    const endMinutes = timeToMinutes(slot.end);
    if (endMinutes - startMinutes < requiredMinutes) continue;
    let current = startMinutes;
    while (current + requiredMinutes <= endMinutes) {
      result.push(minutesToTime(current));
      current += 60;
    }
  }
  return result;
};


const getWeekdayName = (date: Date) => date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

// DELETED: getNextAvailableSlot is no longer needed

const formatAvailability = (isoDateString: string) => {
  const date = new Date(isoDateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const comparisonDate = new Date(date);
  comparisonDate.setHours(0, 0, 0, 0);

  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

  if (comparisonDate.getTime() === today.getTime()) {
    return `Today at ${date.toLocaleTimeString([], timeOptions)}`;
  } else if (comparisonDate.getTime() === tomorrow.getTime()) {
    return `Tomorrow at ${date.toLocaleTimeString([], timeOptions)}`;
  } else {
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return `${date.toLocaleDateString([], dateOptions)} at ${date.toLocaleTimeString([], timeOptions)}`;
  }
};


// --- COMPONENT START ---
export default function BookPage() {
  const { t } = useLanguage();
  const params = useParams<{ cleanerId?: string }>();
  const router = useRouter();
  const cleanerId = params?.cleanerId ?? "";

  // --- USER STATE (MUST BE INSIDE COMPONENT) ---
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const [cleaner, setCleaner] = useState<Cleaner | null>(null);
  const [selectedCleaning, setSelectedCleaning] = useState<CleaningType>(CLEANING_TYPES[0]);

  const [days, setDays] = useState<Date[]>([]);
  const [slotsByDay, setSlotsByDay] = useState<Record<string, string[]>>({});
  const [searchOffset, setSearchOffset] = useState(0);
  const DAYS_TO_LOAD = 5;

  // State now tracks the *relevant* pre-calculated time
  const [nextAvailableTime, setNextAvailableTime] = useState<string | null>(null);

  // Helper to extract the correct pre-calculated time based on duration
  const getNextAvailableTimeForDuration = useCallback((cleanerData: Cleaner, duration: number): string | null => {
      let timestamp: Timestamp | null | undefined;

      if (duration === 2) {
          timestamp = cleanerData.nextAvailable2h;
      } else if (duration === 6) {
          timestamp = cleanerData.nextAvailable6h;
      }

      if (timestamp) {
          // Convert Firestore Timestamp to ISO string
          return timestamp.toDate().toISOString();
      }
      return null;
  }, []);


  // 1. Fetch cleaner details
  useEffect(() => {
    if (!cleanerId) return;
    const fetchCleaner = async () => {
      const docRef = doc(db, "cleaners", cleanerId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Cleaner;
        setCleaner({ ...data, id: cleanerId });
        
        // 🚨 FIX: Set initial availability based on the default selectedCleaning
        setNextAvailableTime(getNextAvailableTimeForDuration(data, CLEANING_TYPES[0].durationHours));
      }
    };
    fetchCleaner();
  }, [cleanerId, getNextAvailableTimeForDuration]); // Dependency on helper


  // 2. Main function to search for available slots
  const searchForAvailableSlots = useCallback(async (startDayIndex: number) => {
    if (!cleaner) return;

    let daysFound = 0;
    const newDays: Date[] = [];
    const newSlots: Record<string, string[]> = {};
    const today = new Date();

    for (let i = startDayIndex; daysFound < DAYS_TO_LOAD && i < MAX_SEARCH_DAYS; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() + i);
        day.setHours(0, 0, 0, 0);

        const isToday = i === 0;

        const dayKey = day.toISOString().slice(0, 10);
        const weekday = getWeekdayName(day);

        let weekdaySlots = cleaner.schedule?.[weekday] || [];
        const exceptions = cleaner.exceptions?.filter(ex => ex.date === dayKey) || [];
        weekdaySlots = weekdaySlots.filter(
          ws => !exceptions.some(ex => ex.start === ws.start && ex.end === ws.end)
        );

        const bookingsRef = collection(db, "bookings");
        const q = query(
          bookingsRef,
          where("cleanerId", "==", cleanerId),
          where("date", "==", dayKey)
        );
        const bookedDocs = await getDocs(q);
        const bookedTimes = bookedDocs.docs.map(d => d.data()) as TimeSlot[];

        let validSlots = generateAvailableSlots(weekdaySlots, selectedCleaning.durationHours);

        validSlots = validSlots.filter(start => {
          const slotStart = timeToMinutes(start);
          const slotEnd = slotStart + selectedCleaning.durationHours * 60;
          if (isToday) {
             const currentTimeMinutes = new Date().getHours() * 60 + new Date().getMinutes();
             // Only include slots that start AFTER the current time
             if (slotStart < currentTimeMinutes) return false; 
          }
          return !bookedTimes.some(bs => {
            const bsStart = timeToMinutes(bs.start);
            const bsEnd = timeToMinutes(bs.end);
            return bsStart < slotEnd && bsEnd > slotStart;
          });
        });

        if (validSlots.length > 0) {
          newDays.push(day);
          newSlots[dayKey] = validSlots;
          daysFound++;
        }
        setSearchOffset(i + 1);
    }

    setDays(prevDays => startDayIndex === 0 ? newDays : [...prevDays, ...newDays]);
    setSlotsByDay(prevSlots => ({ ...prevSlots, ...newSlots })); // Removed nextAvailableTime calculation here

  }, [cleaner, cleanerId, selectedCleaning.durationHours]);


  // 3. Effect to run the initial search AND update availability when cleaning type changes
  useEffect(() => {
    if (cleaner) {
        // Reset slots and run search for the calendar view
        setDays([]);
        setSlotsByDay({});
        setSearchOffset(0);
        searchForAvailableSlots(0);
        
        // 🚨 FIX: Update the next available time based on the selected duration
        setNextAvailableTime(getNextAvailableTimeForDuration(cleaner, selectedCleaning.durationHours));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleaner, selectedCleaning.durationHours, getNextAvailableTimeForDuration]); // Reruns when cleaner or cleaning type changes


  // 4. Load More logic
  const loadMoreDays = () => {
    searchForAvailableSlots(searchOffset);
  };


  // 5. Handle Booking
  const handleBook = async (dayKey: string, start: string) => {
    if (!cleaner) return;
    const totalPrice = cleaner.pricePerHour * selectedCleaning.durationHours * selectedCleaning.priceMultiplier;

    const params: Record<string, string> = {
      cleanerId: cleaner.id,
      cleanerName: cleaner.name,
      date: dayKey,
      start,
      type: selectedCleaning.name,
      duration: selectedCleaning.durationHours.toString(),
      totalPrice: totalPrice.toFixed(2),
    };

    // Include user info if logged in
    if (user) {
      params.userId = user.uid;
      params.userEmail = user.email ?? "";
    }

    const searchParams = new URLSearchParams(params);
    router.push(`/checkout?${searchParams.toString()}`);
  };
  


  if (!cleaner) return <p>{t('bookCleaner.loading')}</p>;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Cleaner Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-20 h-20">
          <Image src={cleaner.photoUrl} alt={cleaner.name} fill className="rounded-full object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{cleaner.name}</h1>
          <p className="text-gray-500">{cleaner.location}</p>
          <p className="text-sm text-yellow-500">{cleaner.rating !== undefined ? `★ ${cleaner.rating.toFixed(1)}` : t('bookCleaner.noRating')}</p>
          <p className="font-semibold">{cleaner.pricePerHour}€ / {t('bookCleaner.hour')}</p>
          {nextAvailableTime ? (
             <p className="text-sm text-green-600 font-bold mt-1">
                 {t('bookCleaner.nextAvailable')} ({selectedCleaning.durationHours}h): {formatAvailability(nextAvailableTime)}
             </p>
          ) : (
             <p className="text-sm text-red-500 font-bold mt-1">
                 {t('bookCleaner.noAvailability', { days: MAX_SEARCH_DAYS })}
             </p>
          )}
        </div>
      </div>

      {/* Cleaning Type */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">{t('bookCleaner.selectCleaningType')}</label>
        <select
          value={selectedCleaning.name}
          onChange={e => setSelectedCleaning(CLEANING_TYPES.find(c => c.name === e.target.value) || CLEANING_TYPES[0])}
          className="border p-2 rounded w-full"
        >
          {CLEANING_TYPES.map(c => (
            <option key={c.name} value={c.name}>{c.name} ({c.durationHours}h)</option>
          ))}
        </select>
      </div>

      {/* Slots for each day */}
      {days.map(day => {
        const dayKey = day.toISOString().slice(0, 10);
        const slots = slotsByDay[dayKey] || [];
        if (slots.length === 0) return null;
        return (
          <div key={dayKey} className="mb-4">
            <h2 className="text-lg font-semibold mb-2">{day.toDateString()}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map(start => (
                  <button
                    key={start}
                    onClick={() => handleBook(dayKey, start)}
                    className={`border p-2 rounded hover:bg-green-100 transition`}
                  >
                    {start} - {addHours(start, selectedCleaning.durationHours)}
                  </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Message if no slots are found */}
      {days.length === 0 && searchOffset >= MAX_SEARCH_DAYS && (
          <div className="text-center py-4 text-gray-500">
              {t('bookCleaner.noSlotsFound', { days: MAX_SEARCH_DAYS })}
          </div>
      )}

      {/* Load more button */}
      {searchOffset < MAX_SEARCH_DAYS && (
        <button
          onClick={loadMoreDays}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition mt-4"
        >
          {t('bookCleaner.loadMoreDays')}
        </button>
      )}
    </div>
  );
}