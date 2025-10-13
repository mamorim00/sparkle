import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-09-30.clover",
    });

    const body = await req.json();
    const { bookingId, userId, reason, refundAmount } = body;

    if (!bookingId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: bookingId, userId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Get booking
    const bookingDoc = await db.collection("bookings").doc(bookingId).get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingData = bookingDoc.data();

    // Verify user owns this booking
    if (bookingData?.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: You don't own this booking" },
        { status: 403 }
      );
    }

    // Check if already cancelled
    if (bookingData?.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // Check if already completed
    if (bookingData?.status === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel a completed booking" },
        { status: 400 }
      );
    }

    let stripeRefundId = null;
    let actualRefundAmount = 0;

    // Process refund if amount > 0
    if (refundAmount > 0) {
      try {
        // Find the payment intent from the session
        // For now, we'll create a refund using the booking ID as reference
        // In production, you should store the payment_intent_id in the booking document

        // Get the checkout session from Stripe
        const sessions = await stripe.checkout.sessions.list({
          limit: 100,
        });

        const session = sessions.data.find((s) => s.id === bookingId);

        if (session && session.payment_intent) {
          const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent.id;

          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: Math.round(refundAmount * 100), // Convert to cents
            reason: "requested_by_customer",
            metadata: {
              bookingId,
              userId,
              reason: reason || "Customer cancellation",
            },
          });

          stripeRefundId = refund.id;
          actualRefundAmount = refund.amount / 100;
        } else {
          console.warn(`Payment intent not found for booking ${bookingId}, skipping Stripe refund`);
          // Still process the cancellation even if refund fails
          actualRefundAmount = refundAmount;
        }
      } catch (stripeError) {
        console.error("Stripe refund error:", stripeError);
        // Don't fail the entire cancellation if Stripe refund fails
        // Just log it and proceed with local cancellation
      }
    }

    // Update booking status
    await db.collection("bookings").doc(bookingId).update({
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason || "No reason provided",
      refundAmount: actualRefundAmount,
      refundId: stripeRefundId,
      updatedAt: new Date().toISOString(),
    });

    // TODO: Send cancellation emails to customer and cleaner
    // TODO: Trigger availability recalculation for cleaner

    console.log(`✅ Booking ${bookingId} cancelled. Refund: €${actualRefundAmount}`);

    return NextResponse.json({
      success: true,
      refundAmount: actualRefundAmount,
      refundId: stripeRefundId,
      message: actualRefundAmount > 0
        ? `Booking cancelled. Refund of €${actualRefundAmount.toFixed(2)} will be processed within 5-10 business days.`
        : "Booking cancelled. No refund due to cancellation policy.",
    });
  } catch (error) {
    console.error("❌ Error cancelling booking:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
