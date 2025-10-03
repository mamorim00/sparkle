const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  setDoc,
  doc
} = require("firebase/firestore");

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAADWJD71NRBBK-L1Se6TeMol2PSJaqhIE",
  authDomain: "sparkle-86740.firebaseapp.com",
  projectId: "sparkle-86740",
  storageBucket: "sparkle-86740.firebasestorage.app",
  messagingSenderId: "629067342348",
  appId: "1:629067342348:web:f0489076391bf457780429",
  measurementId: "G-RTWZSCCVZ0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MAX_SEARCH_DAYS = 90;

function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function addHours(time, hours) {
  const [h, m] = time.split(":").map(Number);
  const end = new Date();
  end.setHours(h + hours, m, 0, 0);
  return `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
}

function getWeekdayName(date) {
  return date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
}

function findNextSlot(schedule, exceptions, bookings, durationHours) {
  const now = new Date();

  for (let i = 0; i < MAX_SEARCH_DAYS; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() + i);
    const dayKey = day.toISOString().slice(0, 10);
    const weekday = getWeekdayName(day);

    let slots = schedule[weekday] || [];
    // Remove exceptions
    slots = slots.filter(s => !exceptions.some(ex => ex.date === dayKey && ex.start === s.start && ex.end === s.end));

    // Remove booked slots
    const bookedTimes = bookings
      .filter(b => b.date === dayKey)
      .map(b => ({ start: timeToMinutes(b.start), end: timeToMinutes(b.end) }));

    const durationMinutes = durationHours * 60;

    for (const s of slots) {
      let startMin = timeToMinutes(s.start);
      const endMin = timeToMinutes(s.end);

      while (startMin + durationMinutes <= endMin) {
        const overlap = bookedTimes.some(b => startMin < b.end && startMin + durationMinutes > b.start);
        const nowMin = i === 0 ? now.getHours() * 60 + now.getMinutes() : 0;
        if (!overlap && startMin >= nowMin) {
          return `${dayKey}T${minutesToTime(startMin)}:00Z`;

        }
        startMin += 60; // check every 1h increment
      }
    }
  }

  return null;
}

async function backfill() {
  const cleanersSnap = await getDocs(collection(db, "cleaners"));

  for (const cleanerDoc of cleanersSnap.docs) {
    const cleanerId = cleanerDoc.id;
    const data = cleanerDoc.data();
    const schedule = data.schedule || {};
    const exceptions = data.exceptions || [];

    // fetch bookings for next 90 days
    const bookingsSnap = await getDocs(
      query(collection(db, "bookings"), where("cleanerId", "==", cleanerId))
    );
    const bookings = bookingsSnap.docs.map(d => d.data());

    const next2h = findNextSlot(schedule, exceptions, bookings, 2);
    const next6h = findNextSlot(schedule, exceptions, bookings, 6);

    await setDoc(
      doc(db, "cleaners", cleanerId),
      { nextAvailable2h: next2h ? Timestamp.fromDate(new Date(next2h)) : null,
        nextAvailable6h: next6h ? Timestamp.fromDate(new Date(next6h)) : null
      },
      { merge: true }
    );

    console.log(`✅ ${cleanerId} -> 2h: ${next2h}, 6h: ${next6h}`);
  }

  console.log("Backfill complete ✅");
}

backfill().catch(err => console.error(err));
