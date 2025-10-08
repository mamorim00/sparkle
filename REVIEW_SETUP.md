# Review System Setup Guide

This guide explains how to set up the automated review request system for Sparkle.

## Overview

The review system automatically sends email requests to customers the day after their cleaning service. Customers can leave reviews via a unique, non-login link.

## Components

1. **Review Data Model** (`src/types/review.ts`)
   - `Review`: Stores customer reviews
   - `ReviewRequest`: Tracks review email requests

2. **API Endpoints**
   - `/api/submit-review` - Handles review submissions
   - `/api/validate-review-token` - Validates review tokens

3. **Review Page** (`src/app/review/[token]/page.tsx`)
   - Public page accessible via unique token
   - No login required
   - Star rating (1-5) and optional comment

4. **Firebase Cloud Function** (`functions/src/index.ts`)
   - `sendReviewEmails` - Scheduled function that runs daily at 10:00 AM
   - Checks for bookings from the previous day
   - Sends review request emails

## Environment Variables

### For Next.js App (`.env.local`)

Add these Firebase Admin SDK credentials for API routes:

\`\`\`
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
\`\`\`

### For Firebase Functions

Set these using Firebase CLI:

\`\`\`bash
# Set Resend API key
firebase functions:config:set resend.api_key="YOUR_RESEND_API_KEY"

# Set sender email (must be verified in Resend)
firebase functions:config:set resend.from_email="noreply@yourdomain.com"

# Set your app URL
firebase functions:config:set app.url="https://yourdomain.com"
\`\`\`

Then update your functions code to access them:
- \`process.env.RESEND_API_KEY\` → Use Firebase config
- \`process.env.RESEND_FROM_EMAIL\` → Use Firebase config
- \`process.env.APP_URL\` → Use Firebase config

## Resend Setup

1. **Sign up for Resend**
   - Go to [resend.com](https://resend.com)
   - Create an account

2. **Get API Key**
   - Navigate to API Keys section
   - Create a new API key
   - Copy and save it securely

3. **Verify Domain**
   - Add your domain in Resend dashboard
   - Add DNS records as instructed
   - Verify domain ownership

4. **Set From Email**
   - Use format: `noreply@yourdomain.com`
   - Must be from a verified domain

## Firestore Collections

The system creates these collections:

### `reviews`
\`\`\`typescript
{
  bookingId: string;
  cleanerId: string;
  userId?: string | null;
  userEmail: string;
  userName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Timestamp;
}
\`\`\`

### `reviewRequests`
\`\`\`typescript
{
  bookingId: string;
  cleanerId: string;
  cleanerName: string;
  userId?: string | null;
  userEmail: string;
  userName: string;
  serviceDate: string; // YYYY-MM-DD
  token: string; // Unique token
  emailSent: boolean;
  emailSentAt?: Timestamp | null;
  reviewSubmitted: boolean;
  reviewId?: string; // Set after review submitted
  submittedAt?: Timestamp;
  createdAt: Timestamp;
}
\`\`\`

## Firestore Indexes

You may need to create these composite indexes:

1. **reviewRequests**
   - Fields: `bookingId` (Ascending), `token` (Ascending)

2. **reviews**
   - Fields: `cleanerId` (Ascending), `createdAt` (Descending)

Create indexes when Firebase prompts you with index creation links in the logs.

## Deploying Firebase Functions

\`\`\`bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy functions
firebase deploy --only functions
\`\`\`

## Testing

### Test Review Email Manually

You can trigger the email function manually for testing:

\`\`\`bash
# Create a test booking with yesterday's date
# Then call the function
firebase functions:shell
> sendReviewEmails()
\`\`\`

### Test Review Submission

1. Create a review request in Firestore manually with a test token
2. Navigate to: `http://localhost:3000/review/YOUR_TEST_TOKEN`
3. Submit a review
4. Check Firestore for the new review document

## How It Works

1. **Booking Created**: Customer books a cleaning service
   - Booking data stored in `bookings` collection

2. **Day After Service**: Scheduled function runs at 10:00 AM
   - Queries bookings from previous day
   - Creates `reviewRequest` document with unique token
   - Sends email with review link to customer

3. **Customer Clicks Link**: Opens review page
   - No login required
   - Token validates against `reviewRequests` collection

4. **Customer Submits Review**:
   - Creates `review` document
   - Marks `reviewRequest` as submitted
   - Updates cleaner's average rating

## Scheduled Function Schedule

The `sendReviewEmails` function runs on this schedule:
- **Cron**: `0 10 * * *`
- **Time**: 10:00 AM daily
- **Timezone**: Europe/Helsinki

To change the schedule, edit the `schedule` parameter in `functions/src/index.ts`:

\`\`\`typescript
export const sendReviewEmails = functions.scheduler.onSchedule({
  schedule: "0 10 * * *", // Modify this cron expression
  timeZone: "Europe/Helsinki", // Change timezone if needed
}, async () => {
  // ... function code
});
\`\`\`

## Troubleshooting

### Emails Not Sending

1. Check Firebase Functions logs:
   \`\`\`bash
   firebase functions:log
   \`\`\`

2. Verify Resend API key is set correctly
3. Ensure sender email domain is verified in Resend
4. Check Resend dashboard for delivery status

### Reviews Not Submitting

1. Check browser console for errors
2. Verify Firebase Admin SDK credentials in `.env.local`
3. Check API route logs in Vercel/deployment platform

### Token Invalid

1. Verify token exists in `reviewRequests` collection
2. Check that `reviewSubmitted` is `false`
3. Ensure token hasn't expired (no expiration currently implemented)

## Future Enhancements

Consider adding:
- Token expiration (e.g., 30 days)
- Review reminder emails (if not submitted after 7 days)
- Display reviews on cleaner profile pages
- Review moderation system
- Response to reviews from cleaners
- Review analytics dashboard
