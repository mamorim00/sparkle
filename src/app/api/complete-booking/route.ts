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

    // Verify booking is confirmed
    if (booking?.status !== "confirmed") {
      return NextResponse.json(
        { error: "Only confirmed bookings can be marked as completed" },
        { status: 400 }
      );
    }

    // Update booking status to completed
    await bookingRef.update({
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    // Get customer info for response
    const customerEmail = booking?.customerEmail || "";
    const totalAmount = booking?.amount || 0;

    return NextResponse.json({
      success: true,
      message: "Booking marked as completed",
      reminderMessage: `Remember to send your invoice to ${customerEmail} for €${totalAmount.toFixed(2)}`,
      customerEmail,
      totalAmount,
    });
  } catch (error) {
    console.error("Error completing booking:", error);
    return NextResponse.json(
      { error: "Failed to complete booking" },
      { status: 500 }
    );
  }
}
