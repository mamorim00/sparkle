import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { Booking, CancelBookingResponse } from "../../../../types/booking";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-09-30.clover",
});

/**
 * Cancel Booking API
 * Handles booking cancellations with Stripe refunds
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json<CancelBookingResponse>(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json<CancelBookingResponse>(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = bookingSnap.data() as Booking;

    // Verify booking status
    if (booking.status !== "confirmed") {
      return NextResponse.json<CancelBookingResponse>(
        { success: false, message: `Cannot cancel booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Check if service date is in the future
    const serviceDate = new Date(booking.date);
    const now = new Date();

    if (serviceDate <= now) {
      return NextResponse.json<CancelBookingResponse>(
        { success: false, message: "Cannot cancel a booking for a past date" },
        { status: 400 }
      );
    }

    // Calculate hours until service
    const bookingDateTime = new Date(`${booking.date}T${booking.start}`);
    const hoursUntilService = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Calculate refund amount based on cancellation policy
    let refundAmount = booking.amount;
    let refundPercentage = 100;

    if (hoursUntilService < 24) {
      // Within 24 hours: 50% refund
      refundAmount = booking.amount * 0.5;
      refundPercentage = 50;
    }

    console.log(`Cancelling booking ${bookingId}: ${hoursUntilService.toFixed(1)}h until service, ${refundPercentage}% refund`);

    // Process Stripe refund
    let refund: Stripe.Refund | null = null;
    try {
      // The booking ID is the Stripe session ID
      // We need to retrieve the payment intent from the session
      const session = await stripe.checkout.sessions.retrieve(bookingId, {
        expand: ["payment_intent"],
      });

      if (!session.payment_intent) {
        throw new Error("No payment intent found for this booking");
      }

      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id;

      // Create refund
      refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: "requested_by_customer",
        metadata: {
          bookingId: bookingId,
          refundPercentage: refundPercentage.toString(),
          hoursUntilService: hoursUntilService.toFixed(2),
        },
      });

      console.log(`✅ Stripe refund created: ${refund.id} for €${refundAmount.toFixed(2)}`);

    } catch (stripeError) {
      console.error("❌ Stripe refund error:", stripeError);
      return NextResponse.json<CancelBookingResponse>(
        {
          success: false,
          message: `Failed to process refund: ${stripeError instanceof Error ? stripeError.message : "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    // Update booking in Firestore
    const updateData = {
      status: "cancelled" as const,
      cancelledAt: new Date().toISOString(),
      cancelledBy: booking.userId || "guest",
      refundAmount: refundAmount,
      refundStatus: "full" as const,
      refundId: refund?.id || null,
    };

    // If partial refund, update refund status
    if (refundPercentage < 100) {
      updateData.refundStatus = "partial" as const;
    }

    await bookingRef.update(updateData);

    console.log(`✅ Booking ${bookingId} cancelled successfully`);

    // TODO: Trigger availability recalculation for the cleaner
    // TODO: Send cancellation emails to customer and cleaner

    const updatedBooking = {
      ...booking,
      ...updateData,
    };

    return NextResponse.json<CancelBookingResponse>(
      {
        success: true,
        message: `Booking cancelled successfully. Refund of €${refundAmount.toFixed(2)} (${refundPercentage}%) will be processed within 5-7 business days.`,
        refundAmount: refundAmount,
        booking: updatedBooking,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Booking cancellation error:", error);
    return NextResponse.json<CancelBookingResponse>(
      {
        success: false,
        message: `Failed to cancel booking: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}

// Prevent GET requests
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
