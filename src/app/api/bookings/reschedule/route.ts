import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { Booking, RescheduleBookingResponse } from "../../../../types/booking";

export const dynamic = "force-dynamic";

/**
 * Reschedule Booking API
 * Updates booking date and time
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, newDate, newStart, newEnd } = body;

    if (!bookingId || !newDate || !newStart || !newEnd) {
      return NextResponse.json<RescheduleBookingResponse>(
        { success: false, message: "Missing required fields: bookingId, newDate, newStart, newEnd" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json<RescheduleBookingResponse>(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = bookingSnap.data() as Booking;

    // Verify booking status
    if (booking.status !== "confirmed") {
      return NextResponse.json<RescheduleBookingResponse>(
        { success: false, message: `Cannot reschedule booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Check if new date is in the future
    const newBookingDate = new Date(`${newDate}T${newStart}`);
    const now = new Date();

    if (newBookingDate <= now) {
      return NextResponse.json<RescheduleBookingResponse>(
        { success: false, message: "New booking time must be in the future" },
        { status: 400 }
      );
    }

    // Check if new booking is at least 24 hours away
    const hoursUntilBooking = (newBookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilBooking < 24) {
      return NextResponse.json<RescheduleBookingResponse>(
        { success: false, message: "New booking time must be at least 24 hours from now" },
        { status: 400 }
      );
    }

    // TODO: Check cleaner availability for new slot
    // Query bookings collection for conflicts:
    // const conflictingBookings = await db.collection("bookings")
    //   .where("cleanerId", "==", booking.cleanerId)
    //   .where("date", "==", newDate)
    //   .where("status", "==", "confirmed")
    //   .get();
    // Check if new slot overlaps with any existing bookings

    console.log(`Rescheduling booking ${bookingId}: ${booking.date} ${booking.start} → ${newDate} ${newStart}`);

    // Update booking
    const updateData = {
      originalDate: booking.originalDate || booking.date,
      originalStart: booking.originalStart || booking.start,
      originalEnd: booking.originalEnd || booking.end,
      date: newDate,
      start: newStart,
      end: newEnd,
      rescheduledAt: new Date().toISOString(),
    };

    await bookingRef.update(updateData);

    console.log(`✅ Booking ${bookingId} rescheduled successfully`);

    // TODO: Trigger availability recalculation for the cleaner
    // TODO: Send rescheduling notification emails to customer and cleaner

    const updatedBooking = {
      ...booking,
      ...updateData,
    };

    return NextResponse.json<RescheduleBookingResponse>(
      {
        success: true,
        message: `Booking rescheduled successfully to ${newDate} at ${newStart}`,
        booking: updatedBooking,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Booking rescheduling error:", error);
    return NextResponse.json<RescheduleBookingResponse>(
      {
        success: false,
        message: `Failed to reschedule booking: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}

// Prevent GET requests
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
