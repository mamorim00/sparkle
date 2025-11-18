import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Creates a booking without Stripe payment processing
 * For MVP version where cleaners invoice clients directly
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingDetails,
      userId,
      userName,
      userEmail,
      userPhone,
    } = body;

    console.log("📝 Booking data received:", {
      userId,
      userName,
      userEmail,
    });

    // Validate required booking details
    if (
      !bookingDetails ||
      !bookingDetails.cleanerId ||
      !bookingDetails.date ||
      !bookingDetails.start ||
      !bookingDetails.end ||
      !bookingDetails.totalPrice
    ) {
      return NextResponse.json(
        { error: "Invalid or incomplete booking data." },
        { status: 400 }
      );
    }

    // Validate user contact info
    if (!userName || !userEmail) {
      return NextResponse.json(
        { error: "Customer name and email are required." },
        { status: 400 }
      );
    }

    // Fetch cleaner details using Admin SDK
    const db = getAdminDb();
    const cleanerDoc = await db.collection("cleaners").doc(bookingDetails.cleanerId).get();
    const cleanerData = cleanerDoc.exists ? cleanerDoc.data() : null;

    if (!cleanerData) {
      return NextResponse.json(
        { error: "Cleaner not found." },
        { status: 404 }
      );
    }

    const cleanerName = cleanerData.name || cleanerData.username || bookingDetails.cleanerName || "Cleaner";

    // Generate unique booking ID and confirmation token
    const bookingId = crypto.randomBytes(16).toString("hex");
    const confirmationToken = crypto.randomBytes(32).toString("hex");

    // Calculate request expiration time (24 hours from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Create booking document
    const bookingData = {
      id: bookingId,
      userId: userId || null,
      cleanerId: bookingDetails.cleanerId,
      cleanerName: cleanerName,
      cleanerEmail: cleanerData.email || null,
      cleanerPhone: cleanerData.phone || null,
      customerName: userName,
      customerEmail: userEmail,
      customerPhone: userPhone || null,
      cleaningType: bookingDetails.cleaningType || "Standard Cleaning",
      date: bookingDetails.date,
      start: bookingDetails.start,
      end: bookingDetails.end,
      duration: bookingDetails.duration || 2,
      amount: bookingDetails.totalPrice,
      platformFee: 0, // Calculated after service in MVP
      cleanerAmount: 0, // Calculated after service in MVP
      currency: "eur",
      status: "pending_cleaner_confirmation",
      payoutStatus: "pending", // Will be updated when cleaner is paid
      confirmationToken: confirmationToken,
      confirmationMethod: null, // Will be set when cleaner confirms
      cleanerConfirmedAt: null,
      cleanerInvoiced: false,
      clientPaid: false,
      createdAt: new Date().toISOString(),
      createdVia: "direct", // Not via Stripe webhook
      requestExpiresAt: expiresAt.toISOString(),
    };

    // Save booking to Firestore
    const bookingRef = db.collection("bookings").doc(bookingId);
    await bookingRef.set(bookingData);

    console.log(`✅ Booking ${bookingId} created successfully for cleaner ${bookingDetails.cleanerId}`);

    // Return success with booking ID
    return NextResponse.json({
      success: true,
      bookingId: bookingId,
      message: "Booking created successfully. Awaiting cleaner confirmation."
    }, { status: 200 });

  } catch (error) {
    console.error("Booking Creation Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
