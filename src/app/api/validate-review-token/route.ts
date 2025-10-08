import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required." },
        { status: 400 }
      );
    }

    // Find the review request by token
    const reviewRequestsRef = db.collection("reviewRequests");
    const querySnapshot = await reviewRequestsRef
      .where("token", "==", token)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: "Invalid or expired review link." },
        { status: 404 }
      );
    }

    const reviewRequest = querySnapshot.docs[0].data();

    // Check if review already submitted
    if (reviewRequest.reviewSubmitted) {
      return NextResponse.json(
        { error: "Review has already been submitted for this booking." },
        { status: 400 }
      );
    }

    // Return review request data for display
    return NextResponse.json(
      {
        cleanerName: reviewRequest.cleanerName || "your cleaner",
        userName: reviewRequest.userName,
        serviceDate: reviewRequest.serviceDate,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating review token:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
