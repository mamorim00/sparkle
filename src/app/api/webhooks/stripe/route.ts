import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-09-30.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

/**
 * Stripe Webhook Handler
 * Handles checkout.session.completed events to create bookings server-side
 * This ensures bookings are created even if the user's browser closes after payment
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("❌ Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : "Unknown error"}` },
        { status: 400 }
      );
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("✅ Received checkout.session.completed event:", session.id);

      // Create booking in Firestore
      await createBookingFromSession(session);

      return NextResponse.json({ received: true, sessionId: session.id }, { status: 200 });
    }

    // Return 200 for unhandled event types (Stripe requires 200 response)
    console.log(`ℹ️ Unhandled event type: ${event.type}`);
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    return NextResponse.json(
      { error: `Webhook handler failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

/**
 * Creates a booking document in Firestore from a Stripe checkout session
 * Implements idempotency to prevent duplicate bookings
 */
async function createBookingFromSession(session: Stripe.Checkout.Session) {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(session.id);

  try {
    // Check if booking already exists (idempotency)
    const existingBooking = await bookingRef.get();
    if (existingBooking.exists) {
      console.log(`ℹ️ Booking ${session.id} already exists, skipping creation`);
      return;
    }

    // Validate required metadata
    const metadata = session.metadata;
    if (!metadata || !metadata.cleanerId || !metadata.date || !metadata.start || !metadata.end) {
      throw new Error(`Missing required metadata in session ${session.id}: ${JSON.stringify(metadata)}`);
    }

    // Get customer details
    // Priority: 1) Stripe session email, 2) Metadata email (from checkout form), 3) Generate from name
    console.log("📧 Email resolution debug:", {
      sessionEmail: session.customer_details?.email,
      metadataEmail: metadata.guestEmail,
      guestName: metadata.guestName,
    });

    const customerEmail = session.customer_details?.email ||
      metadata.guestEmail ||
      (metadata.guestName ? `${metadata.guestName.replace(/\s+/g, '')}@guest.sparkle.com` : "guest@sparkle.com");
    const customerName = metadata.guestName || session.customer_details?.name || "Guest";

    console.log("✅ Final email to use:", customerEmail);

    // Get cleaner name from metadata (preferred) or fetch from Firestore as fallback
    let cleanerName = metadata.cleanerName || "Cleaner";

    // If cleanerName not in metadata, fetch from Firestore
    if (!metadata.cleanerName) {
      const cleanerRef = db.collection("cleaners").doc(metadata.cleanerId);
      const cleanerSnap = await cleanerRef.get();
      const cleanerData = cleanerSnap.exists ? cleanerSnap.data() : null;
      cleanerName = cleanerData?.name || cleanerData?.username || "Cleaner";
    }

    // Calculate fees
    const amountTotal = session.amount_total || 0;
    const amount = amountTotal / 100; // Convert from cents to euros
    const platformFee = metadata.platformFee
      ? parseFloat(metadata.platformFee)
      : amount * 0.15;
    const cleanerAmount = metadata.cleanerAmount
      ? parseFloat(metadata.cleanerAmount)
      : amount * 0.85;

    // Create booking document
    const bookingData = {
      id: session.id,
      userId: metadata.userId || null,
      cleanerId: metadata.cleanerId,
      cleanerName: cleanerName,
      customerName: customerName,
      customerEmail: customerEmail,
      serviceId: metadata.serviceId || null,
      cleaningType: metadata.cleaningType || "Standard Cleaning",
      date: metadata.date,
      start: metadata.start,
      end: metadata.end,
      duration: metadata.duration ? Number(metadata.duration) : 2,
      amount: amount,
      platformFee: platformFee,
      cleanerAmount: cleanerAmount,
      currency: session.currency || "eur",
      status: "confirmed",
      payoutStatus: "pending",
      createdAt: new Date().toISOString(),
      createdVia: "webhook", // Track that this was created by webhook
    };

    await bookingRef.set(bookingData);

    console.log(`✅ Booking ${session.id} created successfully for cleaner ${metadata.cleanerId}`);

  } catch (error) {
    console.error(`❌ Failed to create booking for session ${session.id}:`, error);
    throw error; // Re-throw to return 500 status to Stripe
  }
}

// Prevent GET requests
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
