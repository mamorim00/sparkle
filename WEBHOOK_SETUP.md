# Stripe Webhook Setup Guide

This guide explains how to set up and test the Stripe webhook endpoint for server-side booking creation.

## Overview

The webhook system ensures that bookings are created reliably even if a user's browser closes after completing payment. Instead of creating bookings client-side on the success page, Stripe sends a webhook event to our server when a payment completes.

**Flow:**
1. User completes payment on Stripe Checkout
2. Stripe sends `checkout.session.completed` event to `/api/webhooks/stripe`
3. Webhook verifies signature and creates booking in Firestore
4. Success page listens for the booking via real-time Firestore listener
5. User sees booking details once webhook completes

---

## Local Development Setup

### Prerequisites
- Stripe CLI installed: https://stripe.com/docs/stripe-cli
- Stripe account with test mode enabled

### Step 1: Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
curl -s https://packages.stripe.com/api/v1/installation/stripe-cli.sh | bash
```

**Windows:**
Download from: https://github.com/stripe/stripe-cli/releases/latest

### Step 2: Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate with your Stripe account.

### Step 3: Forward Webhooks to Local Server

Start your Next.js dev server:
```bash
npm run dev
```

In a **separate terminal**, run:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

You should see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Step 4: Update .env.local

Copy the webhook signing secret from the Stripe CLI output and add it to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Important:** Restart your Next.js dev server after updating `.env.local`

### Step 5: Test the Webhook

1. Start your Next.js app: `npm run dev`
2. In another terminal, run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Make a test booking using Stripe test card: `4242 4242 4242 4242`
4. Check the Stripe CLI terminal - you should see the webhook event logged
5. Check your app logs - you should see "✅ Booking created successfully"

### Testing with Stripe CLI

You can also trigger test events manually:

```bash
# Trigger a checkout.session.completed event
stripe trigger checkout.session.completed
```

**Note:** Manual triggers won't have proper metadata, so bookings won't be created. Use real checkout sessions for full testing.

---

## Production Setup

### Step 1: Deploy Your Application

Ensure your app is deployed to Vercel (or your hosting platform) and the webhook endpoint is accessible at:
```
https://your-domain.com/api/webhooks/stripe
```

### Step 2: Create Webhook in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
4. Select events to listen for:
   - ✅ `checkout.session.completed`
   - (Optional) `charge.refunded` for future cancellation handling
5. Click **"Add endpoint"**

### Step 3: Get Signing Secret

After creating the endpoint, Stripe will show you a **signing secret** starting with `whsec_`.

Copy this value.

### Step 4: Add to Production Environment Variables

**For Vercel:**
1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_xxxxxxxxxxxxx` (your production signing secret)
   - **Environment:** Production
3. Click **Save**
4. Redeploy your application

**For other platforms:**
Add the environment variable according to your platform's documentation.

### Step 5: Test Production Webhook

1. Make a real test booking in your production app
2. Check the Stripe Dashboard → Webhooks → Your Endpoint → Events
3. Verify the event was delivered successfully (200 status)
4. Check your Firestore database for the created booking

---

## Monitoring & Debugging

### Check Webhook Logs in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your endpoint
3. View the **"Events"** tab to see all webhook deliveries
4. Click on individual events to see request/response details

### Common Issues

#### ❌ "Webhook signature verification failed"

**Cause:** Wrong `STRIPE_WEBHOOK_SECRET` or request body was modified

**Solution:**
- Verify you're using the correct secret for your environment (test vs. production)
- Don't parse the request body before signature verification (our code uses `req.text()`)
- Restart your server after updating `.env.local`

#### ❌ "Booking not created by webhook within 15 seconds"

**Cause:** Webhook endpoint is not receiving events or failing

**Solution:**
- Check Stripe Dashboard → Webhooks → Events for errors
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check server logs for errors in `/api/webhooks/stripe`
- Ensure Firestore Admin SDK is configured correctly

#### ❌ "Missing required metadata in session"

**Cause:** Checkout session was created without required booking metadata

**Solution:**
- Verify `/api/create-checkout-session` is passing all required metadata:
  - `cleanerId`
  - `date`
  - `start`
  - `end`
  - `duration`
  - `cleaningType`

### View Webhook Logs

**Local Development:**
Check your Next.js server console - all webhook events are logged with emojis:
- ✅ Success messages
- ❌ Error messages
- ℹ️ Info messages

**Production (Vercel):**
1. Go to: Vercel Dashboard → Your Project → Logs
2. Filter by: `/api/webhooks/stripe`
3. Look for console.log output from the webhook handler

---

## Environment Variables Summary

### Local Development (.env.local)
```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx  # From: stripe listen --forward-to

# Firebase Admin
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx
```

### Production (Vercel)
```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx  # or pk_test_xxx
STRIPE_SECRET_KEY=sk_live_xxx  # or sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx  # From: Stripe Dashboard → Webhooks

# Firebase Admin
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_PROJECT_ID=xxx
```

---

## Code Reference

### Webhook Endpoint
**File:** `/src/app/api/webhooks/stripe/route.ts`
- Verifies webhook signature
- Creates booking in Firestore with idempotency
- Returns proper HTTP status codes

### Success Page
**File:** `/src/app/success/SuccessClient.tsx`
- Listens for webhook-created booking via Firestore real-time listener
- Shows loading state while waiting
- Displays booking details once created
- Has 15-second timeout with fallback message

### Checkout Session Creation
**File:** `/src/app/api/create-checkout-session/route.ts`
- Creates Stripe Checkout session with booking metadata
- Metadata is used by webhook to create booking

---

## Security Notes

1. **Always verify webhook signatures** - Prevents attackers from sending fake webhook events
2. **Use HTTPS in production** - Stripe requires HTTPS for production webhooks
3. **Keep secrets secure** - Never commit `.env.local` to version control
4. **Implement idempotency** - Prevents duplicate bookings if webhook is retried
5. **Validate metadata** - Ensures all required booking data is present

---

## Next Steps

### Optional Enhancements

1. **Add webhook for refunds:**
   ```typescript
   if (event.type === "charge.refunded") {
     // Update booking status to "cancelled"
   }
   ```

2. **Add webhook retry logic:**
   - Stripe automatically retries failed webhooks
   - Ensure your endpoint returns 200 even if booking already exists

3. **Add webhook event logging:**
   - Store webhook events in Firestore for audit trail
   - Helpful for debugging and compliance

4. **Add email notifications:**
   - Send confirmation email when booking is created
   - Use Firebase Functions or Resend API

---

## Questions?

- **Stripe Webhooks Docs:** https://stripe.com/docs/webhooks
- **Stripe CLI Docs:** https://stripe.com/docs/stripe-cli
- **Vercel Environment Variables:** https://vercel.com/docs/environment-variables

For issues with this implementation, check:
1. Server logs (Next.js console or Vercel logs)
2. Stripe Dashboard → Webhooks → Events
3. Firestore database for created bookings
