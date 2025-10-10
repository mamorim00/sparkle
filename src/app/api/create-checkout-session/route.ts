import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% commission

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-09-30.clover",
    });

    const body = await req.json();
    const {
      totalAmount,
      bookingDetails,
      userId,
      userName,
      userEmail,
    } = body;

    if (
      !totalAmount ||
      !bookingDetails ||
      !bookingDetails.cleanerId ||
      !bookingDetails.date ||
      !bookingDetails.start ||
      !bookingDetails.end
    ) {
      return NextResponse.json(
        { error: "Invalid or incomplete booking data." },
        { status: 400 }
      );
    }

    // Fetch cleaner's Stripe Connect account and name using Admin SDK
    const db = getAdminDb();
    const cleanerDoc = await db.collection("cleaners").doc(bookingDetails.cleanerId).get();
    const cleanerData = cleanerDoc.exists ? cleanerDoc.data() : null;

    const cleanerStripeAccountId = cleanerData?.stripeAccountId || null;
    const cleanerName = cleanerData?.name || cleanerData?.username || bookingDetails.cleanerName || "Cleaner";

    const lineItems = [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `${bookingDetails.cleaningType} with ${bookingDetails.cleanerName}`,
            description: `Scheduled for ${bookingDetails.date} from ${bookingDetails.start} to ${bookingDetails.end}`,
          },
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1,
      },
    ];

    // Calculate platform fee (15%)
    const platformFeeAmount = Math.round(totalAmount * 100 * PLATFORM_FEE_PERCENTAGE);
    const cleanerAmount = Math.round(totalAmount * 100 * (1 - PLATFORM_FEE_PERCENTAGE));

    // Build session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      customer_email: userEmail || undefined,
      metadata: {
        userId: userId || null,
        guestName: userName,
        cleanerId: bookingDetails.cleanerId,
        cleanerName: cleanerName,
        date: bookingDetails.date,
        start: bookingDetails.start,
        end: bookingDetails.end,
        duration: bookingDetails.duration,
        cleaningType: bookingDetails.cleaningType,
        platformFee: (platformFeeAmount / 100).toString(),
        cleanerAmount: (cleanerAmount / 100).toString(),
      },
    };

    // If cleaner has Stripe Connect, use destination charges
    if (cleanerStripeAccountId) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: cleanerStripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("Stripe Checkout Session Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
