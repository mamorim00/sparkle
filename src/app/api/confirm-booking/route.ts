import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

/**
 * Handles booking confirmations from cleaners via email links or dashboard
 * Accepts: token (confirmation token), action (accept|reject), method (email|dashboard|whatsapp)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, action, method, cleanerId } = body;

    if (!token || !action || !method) {
      return NextResponse.json(
        { error: "Missing required parameters: token, action, method" },
        { status: 400 }
      );
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Find booking by confirmation token
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("confirmationToken", "==", token)
      .limit(1)
      .get();

    if (bookingsSnapshot.empty) {
      return NextResponse.json(
        { error: "Invalid or expired confirmation token" },
        { status: 404 }
      );
    }

    const bookingDoc = bookingsSnapshot.docs[0];
    const bookingData = bookingDoc.data();
    const bookingId = bookingDoc.id;

    // Verify the booking belongs to the cleaner (if cleanerId provided)
    if (cleanerId && bookingData.cleanerId !== cleanerId) {
      return NextResponse.json(
        { error: "This booking does not belong to you" },
        { status: 403 }
      );
    }

    // Check if booking is still pending
    if (bookingData.status !== "pending_cleaner_confirmation") {
      return NextResponse.json(
        {
          error: `Booking has already been ${bookingData.status}`,
          currentStatus: bookingData.status,
        },
        { status: 400 }
      );
    }

    // Check if request has expired
    const now = new Date();
    const expiresAt = new Date(bookingData.requestExpiresAt);
    if (now > expiresAt) {
      return NextResponse.json(
        { error: "This booking request has expired" },
        { status: 400 }
      );
    }

    // Update booking based on action
    const updateData: Record<string, unknown> = {
      confirmationMethod: method,
      cleanerConfirmedAt: new Date().toISOString(),
    };

    if (action === "accept") {
      updateData.status = "confirmed";
      console.log(`✅ Cleaner accepted booking ${bookingId} via ${method}`);
    } else {
      updateData.status = "rejected";
      updateData.rejectionReason = "Cleaner declined the booking";
      console.log(`❌ Cleaner rejected booking ${bookingId} via ${method}`);
    }

    await db.collection("bookings").doc(bookingId).update(updateData);

    return NextResponse.json({
      success: true,
      action: action,
      bookingId: bookingId,
      message: action === "accept"
        ? "Booking confirmed successfully! Customer will be notified."
        : "Booking declined. Customer will be notified."
    }, { status: 200 });

  } catch (error) {
    console.error("Booking Confirmation Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET handler for email link confirmations
 * URL format: /api/confirm-booking?token=xxx&action=accept&method=email
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");
    const action = searchParams.get("action");
    const method = searchParams.get("method") || "email";

    if (!token || !action) {
      return NextResponse.json(
        { error: "Missing required parameters: token, action" },
        { status: 400 }
      );
    }

    // Call the POST handler logic
    const response = await POST(
      new NextRequest(req.url, {
        method: "POST",
        body: JSON.stringify({ token, action, method }),
        headers: { "Content-Type": "application/json" },
      })
    );

    const data = await response.json();

    // Redirect to a confirmation page
    if (response.status === 200) {
      const redirectUrl = action === "accept"
        ? `/cleaner-dashboard?confirmed=true&booking=${data.bookingId}`
        : `/cleaner-dashboard?rejected=true&booking=${data.bookingId}`;
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    } else {
      // Redirect to error page
      return NextResponse.redirect(
        new URL(`/cleaner-dashboard?error=${encodeURIComponent(data.error)}`, req.url)
      );
    }
  } catch (error) {
    console.error("GET Confirmation Error:", error);
    return NextResponse.redirect(
      new URL("/cleaner-dashboard?error=confirmation_failed", req.url)
    );
  }
}
