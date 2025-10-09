import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-09-30.clover",
    });

    const body = await req.json();
    const { cleanerId, email, name } = body;

    if (!cleanerId || !email || !name) {
      return NextResponse.json(
        { error: "Missing required fields: cleanerId, email, name" },
        { status: 400 }
      );
    }

    // Create Express connected account
    const account = await stripe.accounts.create({
      type: "express",
      country: "IE", // Ireland - change if needed
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      individual: {
        email: email,
        first_name: name.split(" ")[0] || name,
        last_name: name.split(" ").slice(1).join(" ") || "",
      },
    });

    // Save account ID to Firestore using Admin SDK
    const db = getAdminDb();
    await db.collection("cleaners").doc(cleanerId).update({
      stripeAccountId: account.id,
      stripeAccountStatus: "pending",
      stripeAccountCreatedAt: new Date().toISOString(),
    });

    console.log(`✅ Created Stripe Connect account ${account.id} for cleaner ${cleanerId}`);

    return NextResponse.json({
      success: true,
      accountId: account.id,
    });
  } catch (error) {
    console.error("❌ Error creating Stripe Connect account:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
