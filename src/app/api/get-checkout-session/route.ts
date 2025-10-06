import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    // Expand deeper into charges to get receipt_url
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent.payment_method", "payment_intent.charges.data.balance_transaction"],
    });

    // Safely pull the receipt_url from the first charge
    const charge = (session.payment_intent as any)?.charges?.data?.[0];
    const receiptUrl = charge?.receipt_url || null;

    return NextResponse.json({
      ...session,
      receipt_url: receiptUrl,
    });
  } catch (err: any) {
    console.error("Stripe session fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
