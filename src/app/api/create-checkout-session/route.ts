import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

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
      userPhone,
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

    const session = await stripe.checkout.sessions.create({
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
        date: bookingDetails.date,
        start: bookingDetails.start,
        end: bookingDetails.end,
        duration: bookingDetails.duration,
        cleaningType: bookingDetails.cleaningType,
      },
    });

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
