import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { Resend } from "resend";

admin.initializeApp();
const db = admin.firestore();

// Initialize Resend with secret
const resendApiKey = functions.params.defineSecret("RESEND_API_KEY");
let resend: Resend;

// --- INTERFACES ---
interface TimeSlot {
  start: string;
  end: string;
}

interface Booking {
  date: string;
  start: string;
  end: string;
}

interface Cleaner {
  schedule: Record<string, TimeSlot[]>;
  exceptions?: (TimeSlot & { date: string })[];
}

// --- HELPER FUNCTIONS ---
const MAX_SEARCH_DAYS = 90;

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const getWeekdayName = (date: Date): string => {
  return date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
};

const generateAvailableSlots = (slots: TimeSlot[], durationHours: number): string[] => {
  const result: string[] = [];
  const requiredMinutes = durationHours * 60;

  for (const slot of slots) {
    if (!slot.start || !slot.end) continue;
    const startMinutes = timeToMinutes(slot.start);
    const endMinutes = timeToMinutes(slot.end);
    if (endMinutes - startMinutes < requiredMinutes) continue;

    let current = startMinutes;
    while (current + requiredMinutes <= endMinutes) {
      result.push(minutesToTime(current));
      current += 60; // Check every hour
    }
  }

  return result;
};

/**
 * Find the next available time slot for a cleaner
 * @param cleaner - Cleaner data with schedule and exceptions
 * @param bookings - All future bookings for this cleaner
 * @param durationHours - Duration of the service (2 or 6 hours)
 * @returns ISO string of next available time or null
 */
const findNextAvailable = async (
  cleaner: Cleaner,
  bookings: Booking[],
  durationHours: number
): Promise<string | null> => {
  const today = new Date();
  const now = today.getTime();

  for (let dayOffset = 0; dayOffset < MAX_SEARCH_DAYS; dayOffset++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + dayOffset);
    checkDate.setHours(0, 0, 0, 0);

    const dayKey = checkDate.toISOString().slice(0, 10);
    const weekday = getWeekdayName(checkDate);

    // Get schedule for this weekday
    let weekdaySlots = cleaner.schedule?.[weekday] || [];

    // Remove exceptions for this date
    const exceptions = cleaner.exceptions?.filter(ex => ex.date === dayKey) || [];
    weekdaySlots = weekdaySlots.filter(
      ws => !exceptions.some(ex => ex.start === ws.start && ex.end === ws.end)
    );

    if (weekdaySlots.length === 0) continue;

    // Get bookings for this date
    const dayBookings = bookings.filter(b => b.date === dayKey);

    // Generate all possible slots
    const possibleSlots = generateAvailableSlots(weekdaySlots, durationHours);

    // Check each slot
    for (const slotStart of possibleSlots) {
      const slotStartMinutes = timeToMinutes(slotStart);
      const slotEndMinutes = slotStartMinutes + durationHours * 60;

      // Create full datetime for this slot
      const slotDateTime = new Date(checkDate);
      slotDateTime.setHours(Math.floor(slotStartMinutes / 60), slotStartMinutes % 60, 0, 0);

      // Skip if slot is in the past
      if (slotDateTime.getTime() <= now) continue;

      // Check if slot conflicts with any booking
      const hasConflict = dayBookings.some(booking => {
        const bookingStart = timeToMinutes(booking.start);
        const bookingEnd = timeToMinutes(booking.end);
        return bookingStart < slotEndMinutes && bookingEnd > slotStartMinutes;
      });

      if (!hasConflict) {
        return slotDateTime.toISOString();
      }
    }
  }

  return null;
};

// --- CLOUD FUNCTIONS ---

/**
 * Trigger when a cleaner document is created or updated
 * Updates nextAvailable2h and nextAvailable6h fields
 */
export const onCleanerUpdate = functions.firestore.onDocumentWritten(
  "cleaners/{cleanerId}",
  async (event) => {
    const cleanerId = event.params.cleanerId;
    if (!cleanerId) return;

    const after = event.data?.after?.data() as Cleaner | undefined;
    if (!after) return;

    try {
      // Get all future bookings for this cleaner
      const bookingsSnap = await db
        .collection("bookings")
        .where("cleanerId", "==", cleanerId)
        .where("status", "==", "confirmed")
        .get();

      const bookings: Booking[] = bookingsSnap.docs.map(d => d.data() as Booking);

      // Calculate next available for 2h and 6h services
      const next2h = await findNextAvailable(after, bookings, 2);
      const next6h = await findNextAvailable(after, bookings, 6);

      // Update cleaner document
      await db.collection("cleaners").doc(cleanerId).set(
        {
          nextAvailable2h: next2h ? admin.firestore.Timestamp.fromDate(new Date(next2h)) : null,
          nextAvailable6h: next6h ? admin.firestore.Timestamp.fromDate(new Date(next6h)) : null,
        },
        { merge: true }
      );

      console.log(`✅ Updated availability for cleaner ${cleanerId}`);
    } catch (error) {
      console.error(`❌ Error updating cleaner ${cleanerId}:`, error);
    }
  }
);

/**
 * Trigger when a booking is created or updated
 * Updates the associated cleaner's availability
 */
export const onBookingChange = functions.firestore.onDocumentWritten(
  "bookings/{bookingId}",
  async (event) => {
    const data = event.data?.after?.data() || event.data?.before?.data();
    if (!data) return;

    const cleanerId = data.cleanerId;
    if (!cleanerId) return;

    try {
      // Get cleaner data
      const cleanerDoc = await db.collection("cleaners").doc(cleanerId).get();
      const cleaner = cleanerDoc.data() as Cleaner | undefined;
      if (!cleaner) return;

      // Get all future bookings for this cleaner
      const bookingsSnap = await db
        .collection("bookings")
        .where("cleanerId", "==", cleanerId)
        .where("status", "==", "confirmed")
        .get();

      const bookings: Booking[] = bookingsSnap.docs.map(d => d.data() as Booking);

      // Calculate next available for 2h and 6h services
      const next2h = await findNextAvailable(cleaner, bookings, 2);
      const next6h = await findNextAvailable(cleaner, bookings, 6);

      // Update cleaner document
      await db.collection("cleaners").doc(cleanerId).set(
        {
          nextAvailable2h: next2h ? admin.firestore.Timestamp.fromDate(new Date(next2h)) : null,
          nextAvailable6h: next6h ? admin.firestore.Timestamp.fromDate(new Date(next6h)) : null,
        },
        { merge: true }
      );

      console.log(`✅ Updated availability for cleaner ${cleanerId} after booking change`);
    } catch (error) {
      console.error(`❌ Error updating cleaner after booking change:`, error);
    }
  }
);

/**
 * Send booking confirmation emails to customer and cleaner
 * Triggered when a new booking is created
 */
export const sendBookingConfirmationEmails = functions.firestore.onDocumentCreated(
  {
    document: "bookings/{bookingId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    // Initialize Resend with the secret
    if (!resend) {
      resend = new Resend(resendApiKey.value());
    }

    const bookingData = event.data?.data();
    if (!bookingData) return;

    const bookingId = event.params.bookingId;

    try {
      // Get cleaner details
      const cleanerDoc = await db.collection("cleaners").doc(bookingData.cleanerId).get();
      const cleanerData = cleanerDoc.data();

      if (!cleanerData) {
        console.error("❌ Cleaner not found");
        return;
      }

      const cleanerEmail = cleanerData.email || `${bookingData.cleanerId}@sparkle.com`;
      const customerEmail = bookingData.customerEmail;
      const customerName = bookingData.customerName || "Valued Customer";

      // Format date for emails
      const bookingDate = new Date(bookingData.date);
      const formattedDate = bookingDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // --- Email to Customer ---
      const customerEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
              .label { font-weight: bold; color: #4b5563; }
              .value { color: #1f2937; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✨ Booking Confirmed!</h1>
                <p>Your cleaning is scheduled</p>
              </div>
              <div class="content">
                <p>Hi ${customerName},</p>
                <p>Great news! Your cleaning service has been confirmed. Here are your booking details:</p>

                <div class="booking-card">
                  <h2 style="margin-top: 0; color: #667eea;">Booking Details</h2>
                  <div class="detail-row">
                    <span class="label">Service:</span>
                    <span class="value">${bookingData.cleaningType}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Cleaner:</span>
                    <span class="value">${bookingData.cleanerName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Date:</span>
                    <span class="value">${formattedDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Time:</span>
                    <span class="value">${bookingData.start} - ${bookingData.end}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Duration:</span>
                    <span class="value">${bookingData.duration} hours</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Total Paid:</span>
                    <span class="value">€${bookingData.amount.toFixed(2)}</span>
                  </div>
                </div>

                <p><strong>What to expect:</strong></p>
                <ul>
                  <li>Your cleaner will arrive at the scheduled time</li>
                  <li>Please ensure access to your property</li>
                  <li>We'll send you a reminder 24 hours before</li>
                </ul>

                <p>Need to make changes? Contact us at support@sparkle.com</p>

                <div class="footer">
                  <p>Thank you for choosing Sparkle!</p>
                  <p>Booking ID: ${bookingId}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      // --- Email to Cleaner ---
      const cleanerEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
              .label { font-weight: bold; color: #4b5563; }
              .value { color: #1f2937; }
              .highlight { background: #d1fae5; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 New Booking!</h1>
                <p>You have a new cleaning job</p>
              </div>
              <div class="content">
                <p>Hi ${cleanerData.username || cleanerData.name},</p>
                <p>You have a new booking! Please review the details below:</p>

                <div class="booking-card">
                  <h2 style="margin-top: 0; color: #10b981;">Job Details</h2>
                  <div class="detail-row">
                    <span class="label">Service:</span>
                    <span class="value">${bookingData.cleaningType}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Customer:</span>
                    <span class="value">${customerName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Contact:</span>
                    <span class="value">${customerEmail}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Date:</span>
                    <span class="value">${formattedDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Time:</span>
                    <span class="value">${bookingData.start} - ${bookingData.end}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Duration:</span>
                    <span class="value">${bookingData.duration} hours</span>
                  </div>
                </div>

                <div class="highlight">
                  <strong>💰 Your Earnings:</strong> €${bookingData.amount.toFixed(2)}
                </div>

                <p><strong>Before the job:</strong></p>
                <ul>
                  <li>Confirm your availability</li>
                  <li>Arrive on time at ${bookingData.start}</li>
                  <li>Bring all necessary cleaning supplies</li>
                  <li>Contact the customer if needed</li>
                </ul>

                <div class="footer">
                  <p>Good luck with your cleaning!</p>
                  <p>Booking ID: ${bookingId}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      // Send both emails
      const results = await Promise.allSettled([
        resend.emails.send({
          from: "Sparkle <bookings@resend.dev>", // Change to your verified domain
          to: customerEmail,
          subject: `✨ Booking Confirmed - ${formattedDate}`,
          html: customerEmailHtml,
        }),
        resend.emails.send({
          from: "Sparkle <bookings@resend.dev>", // Change to your verified domain
          to: cleanerEmail,
          subject: `🎉 New Booking - ${formattedDate}`,
          html: cleanerEmailHtml,
        }),
      ]);

      // Log results
      results.forEach((result, index) => {
        const recipient = index === 0 ? "customer" : "cleaner";
        if (result.status === "fulfilled") {
          console.log(`✅ Email sent to ${recipient}: ${result.value.data?.id}`);
        } else {
          console.error(`❌ Failed to send email to ${recipient}:`, result.reason);
        }
      });

      console.log(`✅ Booking confirmation emails sent for booking ${bookingId}`);
    } catch (error) {
      console.error("❌ Error sending booking confirmation emails:", error);
    }
  }
);
