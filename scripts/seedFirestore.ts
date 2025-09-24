import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

// 🔹 Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAADWJD71NRBBK-L1Se6TeMol2PSJaqhIE",
    authDomain: "sparkle-86740.firebaseapp.com",
    projectId: "sparkle-86740",
    storageBucket: "sparkle-86740.firebasestorage.app",
    messagingSenderId: "629067342348",
    appId: "1:629067342348:web:f0489076391bf457780429",
    measurementId: "G-RTWZSCCVZ0"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔹 Demo data
const demoCleaners = [
  {
    id: "cleaner1",
    name: "Jane Doe",
    email: "jane@example.com",
    photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 4.8,
    location: "Helsinki",
    pricePerHour: 25,
    schedule: {
      monday: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "18:00" }],
      tuesday: [{ start: "10:00", end: "15:00" }],
      wednesday: [],
      thursday: [{ start: "09:00", end: "12:00" }],
      friday: [{ start: "13:00", end: "17:00" }],
      saturday: [],
      sunday: [],
    },
    exceptions: [
      { date: "2025-09-25", start: "09:00", end: "13:00" },
      { date: "2025-09-28", start: "14:00", end: "18:00" },
    ],
  },
  {
    id: "cleaner2",
    name: "John Smith",
    email: "john@example.com",
    photoUrl: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 4.5,
    location: "Espoo",
    pricePerHour: 20,
    schedule: {
      monday: [{ start: "08:00", end: "12:00" }],
      tuesday: [{ start: "12:00", end: "16:00" }],
      wednesday: [{ start: "09:00", end: "17:00" }],
      thursday: [],
      friday: [{ start: "10:00", end: "14:00" }],
      saturday: [{ start: "09:00", end: "12:00" }],
      sunday: [],
    },
    exceptions: [{ date: "2025-09-27", start: "12:00", end: "16:00" }],
  },
];

const demoBookings = [
  {
    id: "booking1",
    cleanerId: "cleaner1",
    customerId: "customer1",
    date: "2025-09-26",
    start: "09:00",
    end: "10:00",
    status: "confirmed",
  },
  {
    id: "booking2",
    cleanerId: "cleaner1",
    customerId: "customer2",
    date: "2025-09-26",
    start: "14:00",
    end: "15:00",
    status: "pending",
  },
  {
    id: "booking3",
    cleanerId: "cleaner2",
    customerId: "customer3",
    date: "2025-09-27",
    start: "12:00",
    end: "13:00",
    status: "confirmed",
  },
];

// 🔹 Seed function
async function seedFirestore() {
  try {
    // Seed cleaners
    for (const cleaner of demoCleaners) {
      await setDoc(doc(db, "cleaners", cleaner.id), cleaner);
      console.log("Added cleaner:", cleaner.name);
    }

    // Seed bookings
    for (const booking of demoBookings) {
      await setDoc(doc(db, "bookings", booking.id), booking);
      console.log("Added booking:", booking.id);
    }

    console.log("✅ Firestore seeded successfully!");
  } catch (error) {
    console.error("Error seeding Firestore:", error);
  }
}

// Run
seedFirestore();
