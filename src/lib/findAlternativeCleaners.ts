/**
 * Alternative Cleaner Finder Utility
 * Finds available cleaners when a booking request is rejected or expires
 */

import type { AlternativeCleaner } from "../types/booking";

interface FindAlternativeCleanersParams {
  originalCleanerId: string;
  serviceType: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  duration: number;
  location: string;
  db: FirebaseFirestore.Firestore; // Pass db instance from caller
}

interface Cleaner {
  id: string;
  name?: string;
  username?: string;
  email: string;
  photoUrl?: string;
  pricePerHour: number;
  rating?: number;
  location: string;
  services: string[];
  schedule?: Record<string, Array<{ start: string; end: string }>>;
  exceptions?: Array<{ date: string; start: string; end: string }>;
  status: string;
}

interface Booking {
  cleanerId: string;
  date: string;
  start: string;
  end: string;
  status: string;
}

/**
 * Finds alternative cleaners who are available for the same time slot
 * @returns Array of alternative cleaners, sorted by rating then price
 */
export async function findAlternativeCleaners(
  params: FindAlternativeCleanersParams
): Promise<AlternativeCleaner[]> {
  const { originalCleanerId, serviceType, date, start, end, duration, location, db } = params;

  try {
    console.log(`🔍 Finding alternatives for ${serviceType} on ${date} ${start}-${end} in ${location}`);

    // Step 1: Query cleaners with same service and location (exclude original cleaner)
    const cleanersRef = db.collection("cleaners");
    const cleanersQuery = await cleanersRef
      .where("status", "==", "approved")
      .where("location", "==", location)
      .where("services", "array-contains", serviceType)
      .get();

    const potentialCleaners: Cleaner[] = cleanersQuery.docs
      .filter((doc) => doc.id !== originalCleanerId) // Exclude original cleaner
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Cleaner[];

    console.log(`📋 Found ${potentialCleaners.length} potential cleaners`);

    if (potentialCleaners.length === 0) {
      return [];
    }

    // Step 2: Check availability for each cleaner
    const availableCleaners: AlternativeCleaner[] = [];

    for (const cleaner of potentialCleaners) {
      const isAvailable = await checkCleanerAvailability(
        cleaner,
        date,
        start,
        end,
        db
      );

      if (isAvailable) {
        availableCleaners.push({
          id: cleaner.id,
          name: cleaner.name || cleaner.username || "Cleaner",
          username: cleaner.username,
          email: cleaner.email,
          photoUrl: cleaner.photoUrl,
          pricePerHour: cleaner.pricePerHour,
          rating: cleaner.rating,
          nextAvailable: "Available for this slot",
          bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/book/${cleaner.id}?date=${date}&start=${start}&duration=${duration}`,
        });
      }
    }

    console.log(`✅ Found ${availableCleaners.length} available alternatives`);

    // Step 3: Sort by rating (desc), then price (asc)
    availableCleaners.sort((a, b) => {
      if (a.rating && b.rating) {
        if (b.rating !== a.rating) {
          return b.rating - a.rating; // Higher rating first
        }
      }
      return a.pricePerHour - b.pricePerHour; // Lower price first
    });

    // Step 4: Return top 5
    return availableCleaners.slice(0, 5);
  } catch (error) {
    console.error("❌ Error finding alternative cleaners:", error);
    return [];
  }
}

/**
 * Check if a cleaner is available for a specific time slot
 */
async function checkCleanerAvailability(
  cleaner: Cleaner,
  date: string,
  start: string,
  end: string,
  db: FirebaseFirestore.Firestore
): Promise<boolean> {
  try {
    // Check if within weekly schedule
    const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const schedule = cleaner.schedule?.[dayOfWeek];

    if (!schedule || schedule.length === 0) {
      return false; // Not working this day
    }

    // Check if time slot fits within any schedule slot
    const fitsSchedule = schedule.some((slot) => {
      return start >= slot.start && end <= slot.end;
    });

    if (!fitsSchedule) {
      return false;
    }

    // Check for exceptions (blocked dates)
    if (cleaner.exceptions) {
      const hasException = cleaner.exceptions.some((exception) => {
        if (exception.date !== date) return false;
        // Check if requested time overlaps with exception
        return !(end <= exception.start || start >= exception.end);
      });

      if (hasException) {
        return false;
      }
    }

    // Check for booking conflicts
    const bookingsRef = db.collection("bookings");
    const bookingsQuery = await bookingsRef
      .where("cleanerId", "==", cleaner.id)
      .where("date", "==", date)
      .where("status", "in", ["confirmed", "pending_acceptance"]) // Include pending requests
      .get();

    const hasConflict = bookingsQuery.docs.some((doc) => {
      const booking = doc.data() as Booking;
      // Check if time slots overlap
      return !(end <= booking.start || start >= booking.end);
    });

    if (hasConflict) {
      return false;
    }

    return true; // Available!
  } catch (error) {
    console.error(`❌ Error checking availability for cleaner ${cleaner.id}:`, error);
    return false;
  }
}
