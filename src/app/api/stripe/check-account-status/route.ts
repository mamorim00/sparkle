import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

/**
 * Checks the actual status of a Stripe Connect account
 * Verifies charges_enabled, payouts_enabled, and details_submitted
 */
export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-09-30.clover",
    });

    const body = await req.json();
    const { cleanerId } = body;

    if (!cleanerId) {
      return NextResponse.json(
        { error: "Missing required field: cleanerId" },
        { status: 400 }
      );
    }

    // Get cleaner's Stripe account ID from Firestore
    const db = getAdminDb();
    const cleanerDoc = await db.collection("cleaners").doc(cleanerId).get();
    const cleanerData = cleanerDoc.exists ? cleanerDoc.data() : null;

    if (!cleanerData?.stripeAccountId) {
      return NextResponse.json(
        {
          success: true,
          connected: false,
          message: "No Stripe account found",
        },
        { status: 200 }
      );
    }

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(cleanerData.stripeAccountId);

    const isFullyOnboarded =
      account.charges_enabled &&
      account.payouts_enabled &&
      account.details_submitted;

    // Update Firestore with accurate status
    await db.collection("cleaners").doc(cleanerId).update({
      stripeConnected: isFullyOnboarded,
      stripeAccountStatus: isFullyOnboarded ? "active" : "pending",
      stripeChargesEnabled: account.charges_enabled,
      stripePayoutsEnabled: account.payouts_enabled,
      stripeDetailsSubmitted: account.details_submitted,
      stripeStatusLastChecked: new Date().toISOString(),
    });

    console.log(`✅ Stripe account status checked for cleaner ${cleanerId}:`, {
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      fullyOnboarded: isFullyOnboarded,
    });

    return NextResponse.json({
      success: true,
      connected: isFullyOnboarded,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requiresAction: !isFullyOnboarded,
    });
  } catch (error) {
    console.error("❌ Error checking Stripe account status:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
