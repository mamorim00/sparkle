"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { db } from "../../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";

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
}

interface CleaningType {
  name: string;
  durationHours: number;
  priceMultiplier: number;
}

const CLEANING_TYPES: CleaningType[] = [
  { name: "Simple Clean", durationHours: 2, priceMultiplier: 1 },
  { name: "Deep Clean", durationHours: 6, priceMultiplier: 2 },
];

// Helpers
const timeToMinutes = (time: string) => {
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
  end.setHours(h + hours, m);
  return `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
};
const generateAvailableSlots = (slots: TimeSlot[], durationHours: number) => {
  const result: string[] = [];
  const requiredMinutes = durationHours * 60;

  for (let slot of slots) {
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

export default function BookPage() {
  const params = useParams<{ cleanerId?: string }>();
  const cleanerId = params?.cleanerId ?? "";

  const [cleaner, setCleaner] = useState<Cleaner | null>(null);
  const [selectedCleaning, setSelectedCleaning] = useState<CleaningType>(CLEANING_TYPES[0]);
  const [guestName, setGuestName] = useState<string>("");
  const [days, setDays] = useState<Date[]>([]);
  const [slotsByDay, setSlotsByDay] = useState<Record<string, string[]>>({});

  // Fetch cleaner
  useEffect(() => {
    if (!cleanerId) return;
    const fetchCleaner = async () => {
      const docRef = doc(db, "cleaners", cleanerId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Cleaner;
        setCleaner({ ...data, id: cleanerId });
      }
    };
    fetchCleaner();
  }, [cleanerId]);

  // Initialize first 5 days
  useEffect(() => {
    const initDays: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      initDays.push(d);
    }
    setDays(initDays);
  }, []);

  // Fetch available slots for all loaded days
  useEffect(() => {
    if (!cleaner) return;
  
    const fetchSlots = async () => {
      const newSlots: Record<string, string[]> = {};
  
      for (let day of days) {
        const dayKey = day.toISOString().slice(0, 10);
        const weekday = getWeekdayName(day);
  
        // 1. Get base slots for the day
        let weekdaySlots = cleaner.schedule?.[weekday] || [];
  
        // 2. Remove exceptions
        const exceptions = cleaner.exceptions?.filter(ex => ex.date === dayKey) || [];
        weekdaySlots = weekdaySlots.filter(
          ws => !exceptions.some(ex => ex.start === ws.start && ex.end === ws.end)
        );
  
        // 3. Remove booked slots (check for overlaps)
        const bookingsRef = collection(db, "bookings");
        const q = query(
          bookingsRef,
          where("cleanerId", "==", cleanerId),
          where("date", "==", dayKey)
        );
        const bookedDocs = await getDocs(q);
        const bookedTimes = bookedDocs.docs.map(d => d.data()) as TimeSlot[];

        // Filter out overlapping booked times
        weekdaySlots = weekdaySlots.filter(ws => {
          const wsStart = timeToMinutes(ws.start);
          const wsEnd = timeToMinutes(ws.end);

          return !bookedTimes.some(bs => {
            const bsStart = timeToMinutes(bs.start);
            const bsEnd = timeToMinutes(bs.end);

            // Overlap occurs if the booking starts before slot ends AND booking ends after slot starts
            return bsStart < wsEnd && bsEnd > wsStart;
          });
        });

  
        // 4. Generate only valid slots for the selected cleaning type
        const validSlots = generateAvailableSlots(weekdaySlots, selectedCleaning.durationHours);
  
        newSlots[dayKey] = validSlots;
      }
  
      setSlotsByDay(newSlots);
    };
  
    fetchSlots();
  }, [cleaner, days, selectedCleaning, cleanerId]);
  

  const handleBook = async (dayKey: string, start: string) => {
    if (!cleaner) return;
    const end = addHours(start, selectedCleaning.durationHours);
    const totalPrice = cleaner.pricePerHour * selectedCleaning.durationHours * selectedCleaning.priceMultiplier;

    const proceed = confirm(
      `Booking: ${selectedCleaning.name}\nDate: ${dayKey}\nStart: ${start}\nEnd: ${end}\nTotal Price: €${totalPrice}\nProceed?`
    );
    if (!proceed) return;

    for (let i = 0; i < selectedCleaning.durationHours; i++) {
      const slotStart = addHours(start, i);
      const slotEnd = addHours(start, i + 1);
      await addDoc(collection(db, "bookings"), {
        cleanerId,
        guestName: guestName || "Guest",
        date: dayKey,
        start: slotStart,
        end: slotEnd,
        cleaningType: selectedCleaning.name,
        totalPrice,
        guest: true,
      });
    }

    alert("Booking confirmed!");
    setSlotsByDay(prev => ({
      ...prev,
      [dayKey]: prev[dayKey].filter(s => s !== start),
    }));
  };

  const loadMoreDays = () => {
    const newDays: Date[] = [];
    const lastDay = days[days.length - 1];
    for (let i = 1; i <= 5; i++) {
      const d = new Date(lastDay);
      d.setDate(lastDay.getDate() + i);
      newDays.push(d);
    }
    setDays(prev => [...prev, ...newDays]);
  };

  if (!cleaner) return <p>Loading...</p>;

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
          <p className="text-sm text-yellow-500">{cleaner.rating !== undefined ? `★ ${cleaner.rating.toFixed(1)}` : "No rating"}</p>
          <p className="font-semibold">{cleaner.pricePerHour}€ / hour</p>
        </div>
      </div>

      {/* Guest Name */}
      <input
        type="text"
        placeholder="Your name (optional)"
        value={guestName}
        onChange={e => setGuestName(e.target.value)}
        className="border p-2 rounded mb-4 w-full"
      />

      {/* Cleaning Type */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select Cleaning Type:</label>
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
        return (
          <div key={dayKey} className="mb-4">
            <h2 className="text-lg font-semibold mb-2">{day.toDateString()}</h2>
            <div className="grid grid-cols-2 gap-2">
              {slots.length > 0 ? (
                slots.map(start => (
                  <button
                    key={start}
                    onClick={() => handleBook(dayKey, start)}
                    className={`border p-2 rounded hover:bg-green-100 transition`}
                  >
                    {start} - {addHours(start, selectedCleaning.durationHours)}
                  </button>
                ))
              ) : (
                <p className="col-span-2 text-gray-500">No slots available</p>
              )}
            </div>
          </div>
        );
      })}

      <button
        onClick={loadMoreDays}
        className="w-full bg-primary text-white py-2 rounded hover:bg-green-600 transition"
      >
        Load more days
      </button>
    </div>
  );
}
