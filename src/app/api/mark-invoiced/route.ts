import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { bookingId, cleanerId } = await request.json();

    if (!bookingId || !cleanerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the booking
    const adminDb = getAdminDb();
    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = bookingDoc.data();

    // Verify this booking belongs to the cleaner
    if (booking?.cleanerId !== cleanerId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Verify booking is completed
    if (booking?.status !== "completed") {
      return NextResponse.json(
        { error: "Only completed bookings can be marked as invoiced" },
        { status: 400 }
      );
    }

    // Update cleanerInvoiced flag
    await bookingRef.update({
      cleanerInvoiced: true,
      invoicedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Booking marked as invoiced",
    });
  } catch (error) {
    console.error("Error marking booking as invoiced:", error);
    return NextResponse.json(
      { error: "Failed to mark booking as invoiced" },
      { status: 500 }
    );
  }
}
