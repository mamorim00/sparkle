import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { Resend } from "resend";

admin.initializeApp();
const db = admin.firestore();

// Get Firebase config values
const config = functions.params.defineString("RESEND_API_KEY");
const fromEmail = functions.params.defineString("RESEND_FROM_EMAIL");
const appUrl = functions.params.defineString("APP_URL");

// Assuming Cleaner type and helper functions (time conversion, weekday, findNextAvailable) are defined elsewhere
// interface Cleaner { /* ... */ }
// function findNextAvailable(...) { /* ... */ }

// Trigger when a cleaner document is created or updated
// FIXED: Changed functions.firestore.document.onWrite to functions.firestore.onDocumentWrite
export const onCleanerUpdate = functions.firestore.onDocumentWritten("cleaners/{cleanerId}", async (event) => {
  // Access params directly on the event object
const cleanerId = event.params.cleanerId;
if (!cleanerId) return;

  // Note: 'Cleaner' type casting is assumed to be defined elsewhere
  const after = event.data?.after?.data as any; // Using 'any' as 'Cleaner' is not defined here
  if (!after) return;

  const bookingsSnap = await db.collection("bookings")
    .where("cleanerId", "==", cleanerId)
    .where("end", ">", new Date())
    .get();
  const bookings = bookingsSnap.docs.map(d => d.data());

  // Note: findNextAvailable is assumed to be defined elsewhere
  const next2h = await (globalThis as any).findNextAvailable(after, bookings, 2);
  const next6h = await (globalThis as any).findNextAvailable(after, bookings, 6);

  await db.collection("cleaners").doc(cleanerId).set({
    nextAvailable2h: next2h ? admin.firestore.Timestamp.fromDate(new Date(next2h)) : null,
    nextAvailable6h: next6h ? admin.firestore.Timestamp.fromDate(new Date(next6h)) : null
  }, { merge: true });
});

// Trigger when a booking is created or updated
// FIXED: Changed functions.firestore.document.onWrite to functions.firestore.onDocumentWrite
export const onBookingChange = functions.firestore.onDocumentWritten("bookings/{bookingId}", async (event) => {
    const data = event.data?.after?.data() || event.data?.before?.data();
    if (!data) return;

    // Now that 'data' is the actual object, you can safely access its properties.
    // Optional chaining on 'data' itself is technically redundant after the 'if (!data) return;',
    // but is harmless if you want to keep it.
    const cleanerId = data.cleanerId;
    // OR: const cleanerId = (data as any).cleanerId; // If 'data' type isn't fully defined
    if (!cleanerId) return;

  const cleanerDoc = await db.collection("cleaners").doc(cleanerId).get();
  // Note: 'Cleaner' type casting is assumed to be defined elsewhere
  const cleaner = cleanerDoc.data() as any; // Using 'any' as 'Cleaner' is not defined here
  if (!cleaner) return;

  const bookingsSnap = await db.collection("bookings")
    .where("cleanerId", "==", cleanerId)
    .where("end", ">", new Date())
    .get();
  const bookings = bookingsSnap.docs.map(d => d.data());

  // Note: findNextAvailable is assumed to be defined elsewhere
  const next2h = await (globalThis as any).findNextAvailable(cleaner, bookings, 2);
  const next6h = await (globalThis as any).findNextAvailable(cleaner, bookings, 6);

  await db.collection("cleaners").doc(cleanerId).set({
    nextAvailable2h: next2h ? admin.firestore.Timestamp.fromDate(new Date(next2h)) : null,
    nextAvailable6h: next6h ? admin.firestore.Timestamp.fromDate(new Date(next6h)) : null
  }, { merge: true });
});

// Scheduled function to send review request emails
// Runs daily at 10:00 AM to check for completed bookings from yesterday
export const sendReviewEmails = functions.scheduler.onSchedule({
  schedule: "0 10 * * *", // Daily at 10:00 AM
  timeZone: "Europe/Helsinki",
}, async (event) => {
  // Initialize Resend with API key from params
  const resend = new Resend(config.value());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  console.log(`Checking for bookings on ${yesterdayStr} to send review requests...`);

  try {
    // Find all bookings from yesterday
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("date", "==", yesterdayStr)
      .get();

    if (bookingsSnapshot.empty) {
      console.log("No bookings found for yesterday.");
      return;
    }

    const promises = bookingsSnapshot.docs.map(async (bookingDoc) => {
      const booking = bookingDoc.data();
      const bookingId = bookingDoc.id;

      // Check if review request already exists
      const existingReviewRequest = await db
        .collection("reviewRequests")
        .where("bookingId", "==", bookingId)
        .limit(1)
        .get();

      if (!existingReviewRequest.empty) {
        console.log(`Review request already exists for booking ${bookingId}`);
        return;
      }

      // Generate unique token for review link
      const token = generateReviewToken();

      // Get cleaner details
      const cleanerDoc = await db.collection("cleaners").doc(booking.cleanerId).get();
      const cleaner = cleanerDoc.data();

      // Create review request document
      const reviewRequest = {
        bookingId,
        cleanerId: booking.cleanerId,
        cleanerName: cleaner?.name || "your cleaner",
        userId: booking.userId || null,
        userEmail: booking.userEmail,
        userName: booking.userName,
        serviceDate: booking.date,
        token,
        emailSent: false,
        emailSentAt: null,
        reviewSubmitted: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("reviewRequests").add(reviewRequest);

      // Send email
      const reviewUrl = `${appUrl.value()}/review/${token}`;

      await sendReviewRequestEmail({
        to: booking.userEmail,
        userName: booking.userName,
        cleanerName: cleaner?.name || "your cleaner",
        serviceDate: booking.date,
        reviewUrl,
        resend,
        fromEmail: fromEmail.value(),
      });

      // Update review request to mark email as sent
      const reviewRequestDoc = await db
        .collection("reviewRequests")
        .where("token", "==", token)
        .limit(1)
        .get();

      if (!reviewRequestDoc.empty) {
        await reviewRequestDoc.docs[0].ref.update({
          emailSent: true,
          emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      console.log(`Review request email sent to ${booking.userEmail} for booking ${bookingId}`);
    });

    await Promise.all(promises);
    console.log(`Processed ${bookingsSnapshot.size} bookings for review requests.`);
  } catch (error) {
    console.error("Error sending review emails:", error);
    throw error;
  }
});

// Helper function to generate unique review token
function generateReviewToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Helper function to send review request email
async function sendReviewRequestEmail(params: {
  to: string;
  userName: string;
  cleanerName: string;
  serviceDate: string;
  reviewUrl: string;
  resend: Resend;
  fromEmail: string;
}) {
  const { to, userName, cleanerName, serviceDate, reviewUrl, resend, fromEmail } = params;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #4F46E5;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 16px 32px;
            background-color: #4F46E5;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #4338CA;
          }
          .button-container {
            text-align: center;
          }
          .footer {
            text-align: center;
            font-size: 14px;
            color: #666;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
          }
          .stars {
            font-size: 32px;
            text-align: center;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ How was your cleaning service?</h1>
          </div>

          <div class="content">
            <p>Hi ${userName},</p>

            <p>Thank you for choosing Sparkle! We hope you enjoyed your cleaning service with <strong>${cleanerName}</strong> on ${new Date(serviceDate).toLocaleDateString()}.</p>

            <p>We'd love to hear about your experience! Your feedback helps us maintain the highest quality standards and helps other customers make informed decisions.</p>

            <div class="stars">⭐⭐⭐⭐⭐</div>

            <div class="button-container">
              <a href="${reviewUrl}" class="button">Leave a Review</a>
            </div>

            <p style="font-size: 14px; color: #666; text-align: center;">
              This link is unique to your booking and doesn't require a login.
            </p>
          </div>

          <div class="footer">
            <p>Thank you for using Sparkle!</p>
            <p style="font-size: 12px; color: #999;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "How was your cleaning service? ✨",
      html: emailHtml,
    });

    console.log(`Review request email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send review request email to ${to}:`, error);
    throw error;
  }
}
