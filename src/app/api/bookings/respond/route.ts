import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import type { AcceptBookingRequest, RejectBookingRequest } from "../../../../types/booking";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-09-30.clover",
});

/**
 * POST /api/bookings/respond
 * Handles cleaner's accept or reject actions on booking requests
 *
 * Body should include:
 * - action: "accept" | "reject"
 * - bookingId: string
 * - cleanerId: string
 * - reason?: string (for rejection)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, bookingId, cleanerId, reason } = body;

    if (!action || !bookingId || !cleanerId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      return await acceptBooking({ bookingId, cleanerId });
    } else if (action === "reject") {
      return await rejectBooking({ bookingId, cleanerId, reason });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Booking response error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * Accept a booking request
 * - Verifies cleaner authorization
 * - Captures the Stripe payment
 * - Updates booking status to "confirmed"
 */
async function acceptBooking(request: AcceptBookingRequest) {
  const { bookingId, cleanerId } = request;
  const db = getAdminDb();

  try {
    // Get booking
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = bookingSnap.data();

    // Verify cleaner is authorized
    if (booking?.cleanerId !== cleanerId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: You are not the assigned cleaner" },
        { status: 403 }
      );
    }

    // Check if booking is in correct status
    if (booking?.status !== "pending_acceptance") {
      return NextResponse.json(
        { success: false, message: `Cannot accept booking with status: ${booking?.status}` },
        { status: 400 }
      );
    }

    // Check if request has expired
    const now = new Date();
    const expiresAt = new Date(booking.requestExpiresAt);
    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, message: "This booking request has expired" },
        { status: 400 }
      );
    }

    // Capture the payment with Stripe
    if (!booking.paymentIntentId) {
      throw new Error("Missing payment intent ID");
    }

    console.log(`💳 Capturing payment for booking ${bookingId}...`);

    const paymentIntent = await stripe.paymentIntents.capture(booking.paymentIntentId);

    console.log(`✅ Payment captured: ${paymentIntent.id}, status: ${paymentIntent.status}`);

    // Update booking status
    await bookingRef.update({
      status: "confirmed",
      acceptedAt: new Date().toISOString(),
      paymentCaptured: true,
    });

    console.log(`✅ Booking ${bookingId} accepted by cleaner ${cleanerId}`);

    const updatedBooking = {
      ...booking,
      id: bookingId,
      status: "confirmed",
      acceptedAt: new Date().toISOString(),
      paymentCaptured: true,
    };

    // TODO: Send confirmation emails to customer and cleaner

    return NextResponse.json(
      {
        success: true,
        message: "Booking accepted successfully",
        booking: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`❌ Error accepting booking ${bookingId}:`, error);
    throw error;
  }
}

/**
 * Reject a booking request
 * - Verifies cleaner authorization
 * - Cancels/refunds the Stripe payment
 * - Updates booking status to "rejected"
 * - Finds alternative cleaners
 */
async function rejectBooking(request: RejectBookingRequest) {
  const { bookingId, cleanerId, reason } = request;
  const db = getAdminDb();

  try {
    // Get booking
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = bookingSnap.data();

    // Verify cleaner is authorized
    if (booking?.cleanerId !== cleanerId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: You are not the assigned cleaner" },
        { status: 403 }
      );
    }

    // Check if booking is in correct status
    if (booking?.status !== "pending_acceptance") {
      return NextResponse.json(
        { success: false, message: `Cannot reject booking with status: ${booking?.status}` },
        { status: 400 }
      );
    }

    // Cancel the payment intent (auto-refund)
    if (!booking.paymentIntentId) {
      throw new Error("Missing payment intent ID");
    }

    console.log(`🔄 Canceling payment for booking ${bookingId}...`);

    const paymentIntent = await stripe.paymentIntents.cancel(booking.paymentIntentId);

    console.log(`✅ Payment cancelled: ${paymentIntent.id}, status: ${paymentIntent.status}`);

    // Update booking status
    await bookingRef.update({
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason || "Cleaner rejected the request",
      refundStatus: "full",
      refundedAt: new Date().toISOString(),
    });

    console.log(`✅ Booking ${bookingId} rejected by cleaner ${cleanerId}`);

    // TODO: Find alternative cleaners using findAlternativeCleaners utility
    // TODO: Send rejection email to customer with alternatives

    return NextResponse.json(
      {
        success: true,
        message: "Booking rejected. Customer has been refunded.",
        alternativeCleaners: [], // TODO: populate with alternatives
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`❌ Error rejecting booking ${bookingId}:`, error);
    throw error;
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
