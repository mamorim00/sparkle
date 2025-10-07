// lib/firebase.ts
"use client"; // ensure this file is treated as client-side

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize app lazily (only in browser)
const app = typeof window !== "undefined" ? (!getApps().length ? initializeApp(firebaseConfig) : getApp()) : undefined;

// Export instances, assert non-null for TypeScript
export const auth: Auth = app ? getAuth(app) : ({} as Auth);
export const db: Firestore = app ? getFirestore(app) : ({} as Firestore);
