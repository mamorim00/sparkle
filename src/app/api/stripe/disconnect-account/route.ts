import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

/**
 * Disconnects a Stripe Connect account
 * NOTE: This doesn't delete the Stripe account, it just removes the connection
 * The cleaner can reconnect the same account later if needed
 */
export async function POST(req: NextRequest) {
  try {
    // Stripe instance not needed for disconnect - we just update Firestore
    // If you want to delete the account from Stripe, uncomment the stripe.accounts.del() call below
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    //   apiVersion: "2025-09-30.clover",
    // });

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
        { success: false, message: "No Stripe account found to disconnect" },
        { status: 404 }
      );
    }

    const accountId = cleanerData.stripeAccountId;

    // Optional: Delete the Stripe account entirely (uncomment if you want this behavior)
    // WARNING: This is irreversible and the cleaner will need to create a new account
    // await stripe.accounts.del(accountId);

    // Update Firestore to remove Stripe connection
    await db.collection("cleaners").doc(cleanerId).update({
      stripeConnected: false,
      stripeAccountStatus: "disconnected",
      stripeDisconnectedAt: new Date().toISOString(),
      // Keep stripeAccountId in case they want to reconnect
      // If you want to fully remove it, uncomment the line below:
      // stripeAccountId: null,
    });

    console.log(`✅ Stripe account ${accountId} disconnected for cleaner ${cleanerId}`);

    return NextResponse.json({
      success: true,
      message: "Stripe account disconnected successfully",
    });
  } catch (error) {
    console.error("❌ Error disconnecting Stripe account:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
