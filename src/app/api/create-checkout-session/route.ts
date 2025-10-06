import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-09-30.clover", // latest stable
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      totalAmount,
      bookingDetails,
      userId,
      userName,
      userEmail,
      userPhone,
    } = body;

    if (!totalAmount || !bookingDetails) {
      return NextResponse.json(
        { error: "Invalid booking data." },
        { status: 400 }
      );
    }

    const lineItems = [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Cleaning Booking",
            description: `Cleaning with ${bookingDetails.cleanerName} on ${bookingDetails.date} at ${bookingDetails.start}`,
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
        cancel_url: `${req.headers.get("origin")}/cancel`,
        customer_email: userEmail || undefined,
        metadata: {
          userId: userId || "",
          userName: userName || "",
          userPhone: userPhone || "",
          bookingDetails: JSON.stringify(bookingDetails), // 🔑 add this
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


