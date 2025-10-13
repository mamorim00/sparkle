import * as admin from "firebase-admin";

// Singleton instance
let adminDb: admin.firestore.Firestore | null = null;

export function getAdminDb(): admin.firestore.Firestore {
  if (adminDb) {
    return adminDb;
  }

  // Only initialize if credentials are available
  if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error("Firebase Admin credentials not configured. Please set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in your environment variables.");
  }

  // Initialize Firebase Admin if not already initialized
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }

  adminDb = admin.firestore();
  return adminDb;
}
