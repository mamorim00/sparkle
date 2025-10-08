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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, rating, comment } = body;

    if (!token || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Invalid request. Token and rating (1-5) are required." },
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

    const reviewRequestDoc = querySnapshot.docs[0];
    const reviewRequest = reviewRequestDoc.data();

    // Check if review already submitted
    if (reviewRequest.reviewSubmitted) {
      return NextResponse.json(
        { error: "Review has already been submitted for this booking." },
        { status: 400 }
      );
    }

    // Create the review
    const reviewData = {
      bookingId: reviewRequest.bookingId,
      cleanerId: reviewRequest.cleanerId,
      userId: reviewRequest.userId || null,
      userEmail: reviewRequest.userEmail,
      userName: reviewRequest.userName,
      rating,
      comment: comment || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const reviewRef = await db.collection("reviews").add(reviewData);

    // Mark review request as submitted
    await reviewRequestDoc.ref.update({
      reviewSubmitted: true,
      reviewId: reviewRef.id,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update cleaner's average rating
    await updateCleanerRating(reviewRequest.cleanerId);

    return NextResponse.json(
      { success: true, message: "Review submitted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting review:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function updateCleanerRating(cleanerId: string) {
  const reviewsSnapshot = await db
    .collection("reviews")
    .where("cleanerId", "==", cleanerId)
    .get();

  if (reviewsSnapshot.empty) return;

  const ratings = reviewsSnapshot.docs.map((doc) => doc.data().rating);
  const averageRating =
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  const totalReviews = ratings.length;

  await db.collection("cleaners").doc(cleanerId).update({
    rating: averageRating,
    totalReviews,
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
