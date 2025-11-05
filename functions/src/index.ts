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
 * Sends different emails based on booking status (pending_acceptance vs confirmed)
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
    const isPendingAcceptance = bookingData.status === "pending_acceptance";

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

      // Format expiration time if pending
      let expiresInHours = "";
      if (isPendingAcceptance && bookingData.requestExpiresAt) {
        const expiresAt = new Date(bookingData.requestExpiresAt);
        const hoursUntilExpiry = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
        expiresInHours = hoursUntilExpiry > 1 ? `${hoursUntilExpiry} hours` : "1 hour";
      }

      // --- Email to Customer ---
      const customerEmailHtml = isPendingAcceptance ? `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
              .label { font-weight: bold; color: #4b5563; }
              .value { color: #1f2937; }
              .pending-box { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f59e0b; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏳ Booking Request Sent!</h1>
                <p>Awaiting cleaner confirmation</p>
              </div>
              <div class="content">
                <p>Hi ${customerName},</p>
                <p>Thank you for your payment! Your booking request has been sent to <strong>${bookingData.cleanerName}</strong> and is awaiting their confirmation.</p>

                <div class="pending-box">
                  <strong>⚠️ Important:</strong><br/>
                  <p style="margin: 10px 0 0 0;">
                    This booking requires cleaner acceptance within <strong>${expiresInHours}</strong>.
                    You'll receive an email once the cleaner confirms or if the request expires.
                    Your payment is held securely and will only be charged if accepted.
                  </p>
                </div>

                <div class="booking-card">
                  <h2 style="margin-top: 0; color: #f59e0b;">Request Details</h2>
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
                    <span class="label">Amount (held):</span>
                    <span class="value">€${bookingData.amount.toFixed(2)}</span>
                  </div>
                </div>

                <p><strong>What happens next:</strong></p>
                <ul>
                  <li>The cleaner will review your request</li>
                  <li>You'll receive a confirmation email if accepted</li>
                  <li>If rejected or expired, you'll receive a full refund automatically</li>
                  <li>You can cancel anytime before acceptance for a full refund</li>
                </ul>

                <p>Questions? Contact us at support@sparkle.com</p>

                <div class="footer">
                  <p>Thank you for choosing Sparkle!</p>
                  <p>Booking ID: ${bookingId}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      ` : `
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
      const cleanerEmailHtml = isPendingAcceptance ? `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
              .label { font-weight: bold; color: #4b5563; }
              .value { color: #1f2937; }
              .urgent-box { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f59e0b; }
              .highlight { background: #d1fae5; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; font-weight: bold; }
              .button-secondary { background: #ef4444; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 New Booking Request!</h1>
                <p>Action required - Please respond</p>
              </div>
              <div class="content">
                <p>Hi ${cleanerData.username || cleanerData.name},</p>
                <p>You have received a new booking request from a customer. <strong>Please review and respond within ${expiresInHours}.</strong></p>

                <div class="urgent-box">
                  <strong>⚠️ Action Required:</strong><br/>
                  <p style="margin: 10px 0 0 0;">
                    You must accept or reject this request within <strong>${expiresInHours}</strong>.
                    If you don't respond in time, the request will expire automatically and the customer will be fully refunded.
                  </p>
                </div>

                <div class="booking-card">
                  <h2 style="margin-top: 0; color: #f59e0b;">Request Details</h2>
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
                  <strong>💰 Potential Earnings:</strong> €${bookingData.cleanerAmount.toFixed(2)} (you receive 85%)
                </div>

                <div style="text-align: center; margin: 20px 0;">
                  <a href="${process.env.APP_URL || 'http://localhost:3000'}/cleaner/requests" class="button">
                    Accept Request
                  </a>
                  <a href="${process.env.APP_URL || 'http://localhost:3000'}/cleaner/requests" class="button button-secondary">
                    Reject Request
                  </a>
                </div>

                <p><strong>Before accepting:</strong></p>
                <ul>
                  <li>Confirm you're available at this date and time</li>
                  <li>Make sure you can provide the requested service</li>
                  <li>Check if you have necessary cleaning supplies</li>
                  <li>Consider the travel distance to the location</li>
                </ul>

                <div class="footer">
                  <p>Please respond promptly!</p>
                  <p>Booking ID: ${bookingId}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      ` : `
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
                  <strong>💰 Your Earnings:</strong> €${bookingData.cleanerAmount.toFixed(2)}
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

      // Send both emails with appropriate subject lines
      const customerSubject = isPendingAcceptance
        ? `⏳ Booking Request Sent - Awaiting Confirmation`
        : `✨ Booking Confirmed - ${formattedDate}`;

      const cleanerSubject = isPendingAcceptance
        ? `🔔 New Booking Request - Action Required (${expiresInHours})`
        : `🎉 New Booking - ${formattedDate}`;

      const results = await Promise.allSettled([
        resend.emails.send({
          from: "Sparkle <bookings@resend.dev>",
          to: customerEmail,
          subject: customerSubject,
          html: customerEmailHtml,
        }),
        resend.emails.send({
          from: "Sparkle <bookings@resend.dev>",
          to: cleanerEmail,
          subject: cleanerSubject,
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

/**
 * Send cancellation notification emails to customer and cleaner
 * Triggered when a booking status changes to "cancelled"
 */
export const sendCancellationEmails = functions.firestore.onDocumentUpdated(
  {
    document: "bookings/{bookingId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    // Initialize Resend with the secret
    if (!resend) {
      resend = new Resend(resendApiKey.value());
    }

    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    if (!beforeData || !afterData) return;

    // Only send emails if booking was just cancelled
    if (beforeData.status !== "cancelled" && afterData.status === "cancelled") {
      const bookingId = event.params.bookingId;
      const bookingData = afterData;

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

        // Calculate refund amount
        const refundAmount = bookingData.refundAmount || 0;
        const refundPercentage = bookingData.refundAmount
          ? Math.round((bookingData.refundAmount / bookingData.amount) * 100)
          : 0;

        // --- Email to Customer ---
        const customerEmailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444; }
                .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
                .label { font-weight: bold; color: #4b5563; }
                .value { color: #1f2937; }
                .refund-box { background: #dcfce7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #10b981; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🚫 Booking Cancelled</h1>
                  <p>Your booking has been cancelled</p>
                </div>
                <div class="content">
                  <p>Hi ${customerName},</p>
                  <p>Your booking has been cancelled. Here are the details:</p>

                  <div class="booking-card">
                    <h2 style="margin-top: 0; color: #ef4444;">Cancelled Booking</h2>
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
                      <span class="label">Original Amount:</span>
                      <span class="value">€${bookingData.amount.toFixed(2)}</span>
                    </div>
                  </div>

                  ${refundAmount > 0 ? `
                  <div class="refund-box">
                    <strong>💰 Refund Information</strong><br/>
                    <p style="margin: 10px 0 0 0;">
                      You will receive a refund of <strong>€${refundAmount.toFixed(2)}</strong> (${refundPercentage}% of the booking amount).<br/>
                      The refund will be processed to your original payment method within 5-10 business days.
                    </p>
                  </div>
                  ` : ''}

                  <p>If you have any questions about this cancellation, please contact us at support@sparkle.com</p>

                  <div class="footer">
                    <p>We hope to serve you again soon!</p>
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
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
                .label { font-weight: bold; color: #4b5563; }
                .value { color: #1f2937; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⚠️ Booking Cancelled</h1>
                  <p>A customer has cancelled their booking</p>
                </div>
                <div class="content">
                  <p>Hi ${cleanerData.username || cleanerData.name},</p>
                  <p>Unfortunately, a booking has been cancelled. Here are the details:</p>

                  <div class="booking-card">
                    <h2 style="margin-top: 0; color: #f59e0b;">Cancelled Job</h2>
                    <div class="detail-row">
                      <span class="label">Service:</span>
                      <span class="value">${bookingData.cleaningType}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Customer:</span>
                      <span class="value">${customerName}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Date:</span>
                      <span class="value">${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Time:</span>
                      <span class="value">${bookingData.start} - ${bookingData.end}</span>
                    </div>
                  </div>

                  <p>This time slot is now available again in your calendar. You may receive new bookings for this time.</p>

                  <div class="footer">
                    <p>Thank you for your understanding</p>
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
            from: "Sparkle <bookings@resend.dev>",
            to: customerEmail,
            subject: `🚫 Booking Cancelled - ${formattedDate}`,
            html: customerEmailHtml,
          }),
          resend.emails.send({
            from: "Sparkle <bookings@resend.dev>",
            to: cleanerEmail,
            subject: `⚠️ Booking Cancelled - ${formattedDate}`,
            html: cleanerEmailHtml,
          }),
        ]);

        // Log results
        results.forEach((result, index) => {
          const recipient = index === 0 ? "customer" : "cleaner";
          if (result.status === "fulfilled") {
            console.log(`✅ Cancellation email sent to ${recipient}: ${result.value.data?.id}`);
          } else {
            console.error(`❌ Failed to send cancellation email to ${recipient}:`, result.reason);
          }
        });

        console.log(`✅ Cancellation emails sent for booking ${bookingId}`);
      } catch (error) {
        console.error("❌ Error sending cancellation emails:", error);
      }
    }
  }
);

/**
 * Send booking reminder emails 24 hours before the service
 * Scheduled to run daily at 10:00 AM Europe/Helsinki time
 */
export const sendBookingReminders = functions.scheduler.onSchedule(
  {
    schedule: "0 10 * * *", // Every day at 10:00 AM
    timeZone: "Europe/Helsinki",
    secrets: [resendApiKey],
  },
  async () => {
    // Initialize Resend with the secret
    if (!resend) {
      resend = new Resend(resendApiKey.value());
    }

    try {
      // Calculate tomorrow's date (24 hours from now)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateString = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD

      console.log(`🔍 Looking for bookings on ${tomorrowDateString}`);

      // Get all confirmed bookings for tomorrow
      const bookingsSnap = await db
        .collection("bookings")
        .where("date", "==", tomorrowDateString)
        .where("status", "==", "confirmed")
        .get();

      if (bookingsSnap.empty) {
        console.log("ℹ️ No bookings found for tomorrow");
        return;
      }

      console.log(`📧 Found ${bookingsSnap.size} bookings to send reminders for`);

      // Send reminders for each booking
      const emailPromises: Promise<unknown>[] = [];

      for (const bookingDoc of bookingsSnap.docs) {
        const bookingData = bookingDoc.data();
        const bookingId = bookingDoc.id;

        // Get cleaner details
        const cleanerDoc = await db.collection("cleaners").doc(bookingData.cleanerId).get();
        const cleanerData = cleanerDoc.data();

        if (!cleanerData) {
          console.error(`❌ Cleaner not found for booking ${bookingId}`);
          continue;
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
                .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6; }
                .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
                .label { font-weight: bold; color: #4b5563; }
                .value { color: #1f2937; }
                .reminder-box { background: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3b82f6; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔔 Reminder: Your Cleaning is Tomorrow!</h1>
                  <p>Get ready for your service</p>
                </div>
                <div class="content">
                  <p>Hi ${customerName},</p>
                  <p>This is a friendly reminder that your cleaning service is scheduled for <strong>tomorrow</strong>!</p>

                  <div class="booking-card">
                    <h2 style="margin-top: 0; color: #3b82f6;">Your Booking</h2>
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
                  </div>

                  <div class="reminder-box">
                    <strong>📋 Before the cleaner arrives:</strong>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                      <li>Ensure the cleaner has access to your property</li>
                      <li>Secure any valuable or fragile items</li>
                      <li>If you have pets, please secure them in a safe area</li>
                      <li>Have any specific cleaning instructions ready</li>
                    </ul>
                  </div>

                  <p>Need to make changes? Contact us at support@sparkle.com or cancel/reschedule from your bookings page.</p>

                  <div class="footer">
                    <p>Looking forward to serving you!</p>
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
                .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
                .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
                .label { font-weight: bold; color: #4b5563; }
                .value { color: #1f2937; }
                .reminder-box { background: #ede9fe; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #8b5cf6; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔔 Reminder: You Have a Job Tomorrow!</h1>
                  <p>Don't forget your cleaning appointment</p>
                </div>
                <div class="content">
                  <p>Hi ${cleanerData.username || cleanerData.name},</p>
                  <p>This is a reminder that you have a cleaning job scheduled for <strong>tomorrow</strong>!</p>

                  <div class="booking-card">
                    <h2 style="margin-top: 0; color: #8b5cf6;">Job Details</h2>
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

                  <div class="reminder-box">
                    <strong>✅ Preparation Checklist:</strong>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                      <li>Confirm you have all necessary cleaning supplies</li>
                      <li>Arrive on time at ${bookingData.start}</li>
                      <li>Contact the customer if you need any clarification</li>
                      <li>Be professional and courteous</li>
                    </ul>
                  </div>

                  <p><strong>Earnings:</strong> €${bookingData.amount.toFixed(2)}</p>

                  <p>If you have any issues or need to contact the customer, reply to this email or reach out via support@sparkle.com</p>

                  <div class="footer">
                    <p>Good luck with your job tomorrow!</p>
                    <p>Booking ID: ${bookingId}</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;

        // Add emails to promise array
        emailPromises.push(
          resend.emails.send({
            from: "Sparkle <bookings@resend.dev>",
            to: customerEmail,
            subject: `🔔 Reminder: Your Cleaning is Tomorrow - ${formattedDate}`,
            html: customerEmailHtml,
          })
        );

        emailPromises.push(
          resend.emails.send({
            from: "Sparkle <bookings@resend.dev>",
            to: cleanerEmail,
            subject: `🔔 Reminder: You Have a Job Tomorrow - ${formattedDate}`,
            html: cleanerEmailHtml,
          })
        );
      }

      // Send all emails
      const results = await Promise.allSettled(emailPromises);

      // Log results
      let successCount = 0;
      let failureCount = 0;
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          failureCount++;
          console.error(`❌ Failed to send reminder email:`, result.reason);
        }
      });

      console.log(`✅ Reminder emails sent: ${successCount} successful, ${failureCount} failed`);
    } catch (error) {
      console.error("❌ Error sending booking reminder emails:", error);
    }
  }
);

/**
 * Send rescheduling notification emails to customer and cleaner
 * Triggered when booking date or time is changed
 */
export const sendReschedulingEmails = functions.firestore.onDocumentUpdated(
  {
    document: "bookings/{bookingId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    // Initialize Resend with the secret
    if (!resend) {
      resend = new Resend(resendApiKey.value());
    }

    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    if (!beforeData || !afterData) return;

    // Only send emails if booking date or time changed (and not cancelled)
    const dateChanged = beforeData.date !== afterData.date;
    const timeChanged = beforeData.start !== afterData.start || beforeData.end !== afterData.end;
    const notCancelled = afterData.status !== "cancelled";

    if ((dateChanged || timeChanged) && notCancelled) {
      const bookingId = event.params.bookingId;
      const bookingData = afterData;

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

        // Format old date
        const oldBookingDate = new Date(beforeData.date);
        const oldFormattedDate = oldBookingDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Format new date
        const newBookingDate = new Date(bookingData.date);
        const newFormattedDate = newBookingDate.toLocaleDateString("en-US", {
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
                .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
                .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
                .label { font-weight: bold; color: #4b5563; }
                .value { color: #1f2937; }
                .old-value { color: #9ca3af; text-decoration: line-through; }
                .new-value { color: #8b5cf6; font-weight: bold; }
                .highlight-box { background: #ede9fe; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #8b5cf6; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔄 Booking Rescheduled</h1>
                  <p>Your booking has been updated</p>
                </div>
                <div class="content">
                  <p>Hi ${customerName},</p>
                  <p>Your booking has been successfully rescheduled. Here are the updated details:</p>

                  <div class="booking-card">
                    <h2 style="margin-top: 0; color: #8b5cf6;">Updated Booking Details</h2>
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
                      <span class="value">
                        ${dateChanged ? `<span class="old-value">${oldFormattedDate}</span> → <span class="new-value">${newFormattedDate}</span>` : newFormattedDate}
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Time:</span>
                      <span class="value">
                        ${timeChanged ? `<span class="old-value">${beforeData.start} - ${beforeData.end}</span> → <span class="new-value">${bookingData.start} - ${bookingData.end}</span>` : `${bookingData.start} - ${bookingData.end}`}
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Duration:</span>
                      <span class="value">${bookingData.duration} hours</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Amount:</span>
                      <span class="value">€${bookingData.amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div class="highlight-box">
                    <strong>✨ What's Changed:</strong>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                      ${dateChanged ? `<li>Date changed from ${oldFormattedDate} to ${newFormattedDate}</li>` : ''}
                      ${timeChanged ? `<li>Time changed from ${beforeData.start} - ${beforeData.end} to ${bookingData.start} - ${bookingData.end}</li>` : ''}
                    </ul>
                  </div>

                  <p>Please ensure you're available at the new date and time. If you have any concerns, contact us at support@sparkle.com</p>

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
                .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #06b6d4; }
                .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
                .label { font-weight: bold; color: #4b5563; }
                .value { color: #1f2937; }
                .old-value { color: #9ca3af; text-decoration: line-through; }
                .new-value { color: #06b6d4; font-weight: bold; }
                .highlight-box { background: #cffafe; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #06b6d4; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔄 Booking Rescheduled</h1>
                  <p>A customer has rescheduled their booking</p>
                </div>
                <div class="content">
                  <p>Hi ${cleanerData.username || cleanerData.name},</p>
                  <p>A customer has rescheduled their booking. Please update your calendar with the new date and time:</p>

                  <div class="booking-card">
                    <h2 style="margin-top: 0; color: #06b6d4;">Updated Job Details</h2>
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
                      <span class="value">
                        ${dateChanged ? `<span class="old-value">${oldFormattedDate}</span> → <span class="new-value">${newFormattedDate}</span>` : newFormattedDate}
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Time:</span>
                      <span class="value">
                        ${timeChanged ? `<span class="old-value">${beforeData.start} - ${beforeData.end}</span> → <span class="new-value">${bookingData.start} - ${bookingData.end}</span>` : `${bookingData.start} - ${bookingData.end}`}
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Duration:</span>
                      <span class="value">${bookingData.duration} hours</span>
                    </div>
                  </div>

                  <div class="highlight-box">
                    <strong>📅 Schedule Update:</strong>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                      ${dateChanged ? `<li>Date changed from ${oldFormattedDate} to ${newFormattedDate}</li>` : ''}
                      ${timeChanged ? `<li>Time changed from ${beforeData.start} - ${beforeData.end} to ${bookingData.start} - ${bookingData.end}</li>` : ''}
                      <li>Please confirm you can make the new time</li>
                    </ul>
                  </div>

                  <p><strong>Your Earnings:</strong> €${bookingData.amount.toFixed(2)}</p>

                  <p>If you have any conflicts with the new schedule, please contact support@sparkle.com immediately.</p>

                  <div class="footer">
                    <p>Thank you for your flexibility!</p>
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
            from: "Sparkle <bookings@resend.dev>",
            to: customerEmail,
            subject: `🔄 Booking Rescheduled - ${newFormattedDate}`,
            html: customerEmailHtml,
          }),
          resend.emails.send({
            from: "Sparkle <bookings@resend.dev>",
            to: cleanerEmail,
            subject: `🔄 Schedule Update - ${newFormattedDate}`,
            html: cleanerEmailHtml,
          }),
        ]);

        // Log results
        results.forEach((result, index) => {
          const recipient = index === 0 ? "customer" : "cleaner";
          if (result.status === "fulfilled") {
            console.log(`✅ Rescheduling email sent to ${recipient}: ${result.value.data?.id}`);
          } else {
            console.error(`❌ Failed to send rescheduling email to ${recipient}:`, result.reason);
          }
        });

        console.log(`✅ Rescheduling emails sent for booking ${bookingId}`);
      } catch (error) {
        console.error("❌ Error sending rescheduling emails:", error);
      }
    }
  }
);

/**
 * Automatically expire booking requests that haven't been accepted in time
 * Runs every 10 minutes to check for expired requests
 */
export const expireBookingRequests = functions.scheduler.onSchedule(
  {
    schedule: "*/10 * * * *", // Every 10 minutes
    timeZone: "Europe/Helsinki",
    secrets: [resendApiKey],
  },
  async () => {
    // Initialize Resend with the secret
    if (!resend) {
      resend = new Resend(resendApiKey.value());
    }

    try {
      const now = new Date().toISOString();

      console.log(`🔍 Checking for expired booking requests at ${now}`);

      // Get all pending_acceptance bookings
      const bookingsSnap = await db
        .collection("bookings")
        .where("status", "==", "pending_acceptance")
        .get();

      if (bookingsSnap.empty) {
        console.log("ℹ️ No pending requests to check");
        return;
      }

      console.log(`📋 Found ${bookingsSnap.size} pending requests to check`);

      let expiredCount = 0;
      const expiredBookings: { id: string; data: FirebaseFirestore.DocumentData }[] = [];

      // Check each booking for expiration
      for (const bookingDoc of bookingsSnap.docs) {
        const bookingData = bookingDoc.data();
        const bookingId = bookingDoc.id;

        if (!bookingData.requestExpiresAt) {
          console.log(`⚠️ Booking ${bookingId} missing requestExpiresAt field`);
          continue;
        }

        // Check if request has expired
        if (bookingData.requestExpiresAt <= now) {
          expiredBookings.push({ id: bookingId, data: bookingData });
          expiredCount++;
        }
      }

      if (expiredCount === 0) {
        console.log("✅ No expired requests found");
        return;
      }

      console.log(`⏰ Found ${expiredCount} expired requests to process`);

      // Process each expired booking
      for (const booking of expiredBookings) {
        try {
          const bookingRef = db.collection("bookings").doc(booking.id);
          const bookingData = booking.data;

          // Cancel the payment intent (auto-refunds customer)
          if (bookingData.paymentIntentId) {
            try {
              const stripe = (await import("stripe")).default;
              const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY || "", {
                apiVersion: "2025-09-30.clover",
              });

              await stripeClient.paymentIntents.cancel(bookingData.paymentIntentId, {
                cancellation_reason: "abandoned",
              });

              console.log(`💳 Cancelled payment for booking ${booking.id}`);
            } catch (stripeError) {
              console.error(`❌ Failed to cancel payment for booking ${booking.id}:`, stripeError);
            }
          }

          // Update booking status to expired
          await bookingRef.update({
            status: "expired",
            refundStatus: "full",
            refundedAt: new Date().toISOString(),
          });

          console.log(`✅ Marked booking ${booking.id} as expired`);

          // Get cleaner details for email
          const cleanerDoc = await db.collection("cleaners").doc(bookingData.cleanerId).get();
          const cleanerData = cleanerDoc.data();

          if (!cleanerData) {
            console.error(`❌ Cleaner not found for booking ${booking.id}`);
            continue;
          }

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

          // Send email to customer about expiration
          const customerEmailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                  .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
                  .label { font-weight: bold; color: #4b5563; }
                  .value { color: #1f2937; }
                  .refund-box { background: #dcfce7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #10b981; }
                  .alternatives-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                  .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
                  .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>⏰ Booking Request Expired</h1>
                    <p>Your booking request was not confirmed in time</p>
                  </div>
                  <div class="content">
                    <p>Hi ${customerName},</p>
                    <p>Unfortunately, your booking request has expired because the cleaner did not respond within the required timeframe.</p>

                    <div class="booking-card">
                      <h2 style="margin-top: 0; color: #f59e0b;">Expired Booking Request</h2>
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
                        <span class="label">Amount:</span>
                        <span class="value">€${bookingData.amount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div class="refund-box">
                      <strong>💰 Full Refund Processed</strong><br/>
                      <p style="margin: 10px 0 0 0;">
                        You will receive a <strong>full refund</strong> of €${bookingData.amount.toFixed(2)}.<br/>
                        The refund will be processed to your original payment method within 5-10 business days.
                      </p>
                    </div>

                    <h3 style="color: #667eea;">Book Another Cleaner</h3>
                    <p>We apologize for the inconvenience. You can browse our other available cleaners to find someone who can help you at your preferred time.</p>

                    <div style="text-align: center;">
                      <a href="${process.env.APP_URL || 'http://localhost:3000'}/cleaners" class="button">
                        Browse Available Cleaners
                      </a>
                    </div>

                    <p>If you have any questions, please contact us at support@sparkle.com</p>

                    <div class="footer">
                      <p>We apologize for the inconvenience!</p>
                      <p>Booking ID: ${booking.id}</p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;

          // Send email
          await resend.emails.send({
            from: "Sparkle <bookings@resend.dev>",
            to: customerEmail,
            subject: "⏰ Booking Request Expired - Full Refund Processed",
            html: customerEmailHtml,
          });

          console.log(`📧 Sent expiration email to customer for booking ${booking.id}`);
        } catch (error) {
          console.error(`❌ Error processing expired booking ${booking.id}:`, error);
        }
      }

      console.log(`✅ Processed ${expiredCount} expired booking requests`);
    } catch (error) {
      console.error("❌ Error in expireBookingRequests function:", error);
    }
  }
);

/**
 * Send approval/rejection emails to cleaners
 * Triggered when cleaner status changes
 */
export const sendCleanerStatusEmails = functions.firestore.onDocumentUpdated(
  {
    document: "cleaners/{cleanerId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    // Initialize Resend with the secret
    if (!resend) {
      resend = new Resend(resendApiKey.value());
    }

    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    if (!beforeData || !afterData) return;

    const cleanerId = event.params.cleanerId;
    const statusChanged = beforeData.status !== afterData.status;

    // Only send emails if status changed from pending to approved or rejected
    if (statusChanged && beforeData.status === "pending") {
      const cleanerData = afterData;
      const cleanerEmail = cleanerData.email;
      const cleanerName = cleanerData.username || cleanerData.name || "Cleaner";

      try {
        if (afterData.status === "approved") {
          // --- Approval Email ---
          const approvalEmailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .success-box { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
                  .steps-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                  .step { padding: 15px; margin: 10px 0; background: #f3f4f6; border-radius: 5px; border-left: 3px solid #10b981; }
                  .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                  .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 Congratulations!</h1>
                    <p>Your cleaner profile has been approved</p>
                  </div>
                  <div class="content">
                    <p>Hi ${cleanerName},</p>

                    <div class="success-box">
                      <h2 style="margin-top: 0; color: #10b981;">✨ Welcome to Sparkle!</h2>
                      <p style="margin: 10px 0 0 0; font-size: 16px;">
                        Your profile has been reviewed and <strong>approved</strong>! You're now officially part of the Sparkle cleaning community and can start receiving bookings.
                      </p>
                    </div>

                    <h3 style="color: #10b981;">What happens next?</h3>

                    <div class="steps-box">
                      <div class="step">
                        <strong>1. Your Profile is Live</strong><br/>
                        Customers can now find you when searching for cleaners in your area.
                      </div>

                      <div class="step">
                        <strong>2. Start Receiving Bookings</strong><br/>
                        You'll receive email notifications when customers book your services.
                      </div>

                      <div class="step">
                        <strong>3. Get Paid</strong><br/>
                        After completing each job, you'll earn 85% of the booking amount. Payouts are processed automatically.
                      </div>

                      <div class="step">
                        <strong>4. Build Your Reputation</strong><br/>
                        Provide excellent service to receive 5-star reviews and attract more customers.
                      </div>
                    </div>

                    <h3 style="color: #10b981;">Tips for Success:</h3>
                    <ul>
                      <li><strong>Keep your schedule updated</strong> - Ensure your availability is always current</li>
                      <li><strong>Respond promptly</strong> - Reply to customer messages quickly</li>
                      <li><strong>Arrive on time</strong> - Punctuality builds trust</li>
                      <li><strong>Be professional</strong> - Courteous service leads to great reviews</li>
                      <li><strong>Use quality supplies</strong> - Good tools make better results</li>
                    </ul>

                    <div style="text-align: center;">
                      <a href="${process.env.APP_URL || 'https://sparkle.com'}/cleaner-dashboard" class="button">
                        Go to Your Dashboard
                      </a>
                    </div>

                    <p>If you have any questions or need support, don't hesitate to reach out to us at support@sparkle.com</p>

                    <div class="footer">
                      <p>Good luck with your cleaning journey!</p>
                      <p>The Sparkle Team 💚</p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;

          await resend.emails.send({
            from: "Sparkle <hello@resend.dev>",
            to: cleanerEmail,
            subject: "🎉 Congratulations! Your Sparkle Profile is Approved",
            html: approvalEmailHtml,
          });

          console.log(`✅ Approval email sent to ${cleanerName} (${cleanerEmail})`);

        } else if (afterData.status === "rejected") {
          // --- Rejection Email ---
          const rejectionReason = afterData.rejectionReason || "We were unable to verify your information at this time.";

          const rejectionEmailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .info-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                  .action-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                  .button { display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                  .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Application Update</h1>
                    <p>Regarding your Sparkle cleaner application</p>
                  </div>
                  <div class="content">
                    <p>Hi ${cleanerName},</p>

                    <p>Thank you for your interest in joining Sparkle as a cleaner. After reviewing your application, we're unable to approve your profile at this time.</p>

                    <div class="info-box">
                      <strong>Reason:</strong><br/>
                      <p style="margin: 10px 0 0 0;">${rejectionReason}</p>
                    </div>

                    <h3 style="color: #f59e0b;">What You Can Do:</h3>

                    <div class="action-box">
                      <p><strong>1. Review the Requirements</strong></p>
                      <ul>
                        <li>Valid business ID or license</li>
                        <li>Proof of insurance coverage</li>
                        <li>Clear background check (if applicable)</li>
                        <li>Complete profile information</li>
                      </ul>

                      <p><strong>2. Reapply</strong></p>
                      <p>You're welcome to submit a new application once you've addressed the issues mentioned above. Make sure all documents are clear, valid, and up-to-date.</p>

                      <p><strong>3. Contact Support</strong></p>
                      <p>If you have questions about this decision or need clarification, please reach out to our support team at support@sparkle.com</p>
                    </div>

                    <div style="text-align: center;">
                      <a href="${process.env.APP_URL || 'https://sparkle.com'}/cleaner/setup" class="button">
                        Update Your Application
                      </a>
                    </div>

                    <p>We appreciate your understanding and hope to work with you in the future.</p>

                    <div class="footer">
                      <p>Best regards,</p>
                      <p>The Sparkle Team</p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;

          await resend.emails.send({
            from: "Sparkle <hello@resend.dev>",
            to: cleanerEmail,
            subject: "Update on Your Sparkle Application",
            html: rejectionEmailHtml,
          });

          console.log(`✅ Rejection email sent to ${cleanerName} (${cleanerEmail})`);
        }

        console.log(`✅ Status change email sent for cleaner ${cleanerId}`);
      } catch (error) {
        console.error(`❌ Error sending status change email for cleaner ${cleanerId}:`, error);
      }
    }
  }
);
