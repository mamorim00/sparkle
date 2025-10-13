import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-09-30.clover",
    });

    const body = await req.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: "Missing required field: accountId" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/cleaner/setup/stripe/refresh`,
      return_url: `${origin}/cleaner/setup/stripe/success`,
      type: "account_onboarding",
    });

    console.log(`✅ Created onboarding link for account ${accountId}`);

    return NextResponse.json({
      success: true,
      url: accountLink.url,
    });
  } catch (error) {
    console.error("❌ Error creating onboarding link:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
