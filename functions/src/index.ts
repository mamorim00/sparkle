import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Assuming Cleaner type and helper functions (time conversion, weekday, findNextAvailable) are defined elsewhere
// interface Cleaner { /* ... */ }
// function findNextAvailable(...) { /* ... */ }

// Trigger when a cleaner document is created or updated
// FIXED: Changed functions.firestore.document.onWrite to functions.firestore.onDocumentWrite
export const onCleanerUpdate = functions.firestore.onDocumentWritten("cleaners/{cleanerId}", async (event) => {
  // Access params directly on the event object
const cleanerId = event.params.cleanerId;
if (!cleanerId) return;

  // Note: 'Cleaner' type casting is assumed to be defined elsewhere
  const after = event.data?.after?.data as any; // Using 'any' as 'Cleaner' is not defined here
  if (!after) return;

  const bookingsSnap = await db.collection("bookings")
    .where("cleanerId", "==", cleanerId)
    .where("end", ">", new Date())
    .get();
  const bookings = bookingsSnap.docs.map(d => d.data());

  // Note: findNextAvailable is assumed to be defined elsewhere
  const next2h = await (globalThis as any).findNextAvailable(after, bookings, 2);
  const next6h = await (globalThis as any).findNextAvailable(after, bookings, 6);

  await db.collection("cleaners").doc(cleanerId).set({
    nextAvailable2h: next2h ? admin.firestore.Timestamp.fromDate(new Date(next2h)) : null,
    nextAvailable6h: next6h ? admin.firestore.Timestamp.fromDate(new Date(next6h)) : null
  }, { merge: true });
});

// Trigger when a booking is created or updated
// FIXED: Changed functions.firestore.document.onWrite to functions.firestore.onDocumentWrite
export const onBookingChange = functions.firestore.onDocumentWritten("bookings/{bookingId}", async (event) => {
    const data = event.data?.after?.data() || event.data?.before?.data();
    if (!data) return;
    
    // Now that 'data' is the actual object, you can safely access its properties.
    // Optional chaining on 'data' itself is technically redundant after the 'if (!data) return;', 
    // but is harmless if you want to keep it.
    const cleanerId = data.cleanerId; 
    // OR: const cleanerId = (data as any).cleanerId; // If 'data' type isn't fully defined
    if (!cleanerId) return;

  const cleanerDoc = await db.collection("cleaners").doc(cleanerId).get();
  // Note: 'Cleaner' type casting is assumed to be defined elsewhere
  const cleaner = cleanerDoc.data() as any; // Using 'any' as 'Cleaner' is not defined here
  if (!cleaner) return;

  const bookingsSnap = await db.collection("bookings")
    .where("cleanerId", "==", cleanerId)
    .where("end", ">", new Date())
    .get();
  const bookings = bookingsSnap.docs.map(d => d.data());

  // Note: findNextAvailable is assumed to be defined elsewhere
  const next2h = await (globalThis as any).findNextAvailable(cleaner, bookings, 2);
  const next6h = await (globalThis as any).findNextAvailable(cleaner, bookings, 6);

  await db.collection("cleaners").doc(cleanerId).set({
    nextAvailable2h: next2h ? admin.firestore.Timestamp.fromDate(new Date(next2h)) : null,
    nextAvailable6h: next6h ? admin.firestore.Timestamp.fromDate(new Date(next6h)) : null
  }, { merge: true });
});