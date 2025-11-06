# Stripe Setup Guide for Sparkle

This guide will help you set up Stripe webhooks and ensure all environment variables are configured correctly.

## Current Status

✅ **Local Environment** - Stripe keys are configured in `.env.local`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Configured (test mode)
- `STRIPE_SECRET_KEY`: Configured (test mode)
- `STRIPE_WEBHOOK_SECRET`: Configured

⚠️ **Production (Vercel)** - Need to verify environment variables are set

---

## Step 1: Configure Vercel Environment Variables

You need to add these environment variables to your Vercel project:

### Go to Vercel Dashboard:
1. Visit https://vercel.com/dashboard
2. Select your `sparkle` project
3. Go to **Settings** → **Environment Variables**

### Add these variables:

#### For Next.js API Routes (Server-side):
```
STRIPE_SECRET_KEY=sk_test_PASTE_YOUR_STRIPE_SECRET_KEY_HERE

STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXX (see Step 2 for production webhook secret)
```

#### For Firebase Admin (if not already set):
```
FIREBASE_PROJECT_ID=sparkle-86740
FIREBASE_CLIENT_EMAIL=<your-service-account-email>
FIREBASE_PRIVATE_KEY=<your-service-account-private-key>
```

> **Note**: For production, replace test keys with live keys from Stripe Dashboard

---

## Step 2: Set Up Stripe Webhook (Production)

### A. Get Your Vercel Deployment URL

Run this command to check your current deployment:
```bash
vercel inspect
```

Or check in Vercel dashboard under **Deployments** → look for your production URL (e.g., `sparkle.vercel.app`)

### B. Create Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard**:
   - Test mode: https://dashboard.stripe.com/test/webhooks
   - Live mode: https://dashboard.stripe.com/webhooks

2. **Click "Add endpoint"**

3. **Enter your endpoint URL**:
   ```
   https://YOUR-VERCEL-URL.vercel.app/api/webhooks/stripe
   ```

   Example: `https://sparkle.vercel.app/api/webhooks/stripe`

4. **Select events to listen to**:
   - Click "Select events"
   - Search for and check: `checkout.session.completed`
   - Click "Add events"

5. **Click "Add endpoint"**

6. **Copy the Signing Secret**:
   - After creating, you'll see the webhook details
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)
   - Add this to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### C. Update Vercel Environment Variable

1. Go back to Vercel Dashboard → Settings → Environment Variables
2. Update `STRIPE_WEBHOOK_SECRET` with the new production webhook secret
3. Redeploy your app (or it will auto-deploy on next push)

---

## Step 3: Test Webhook Locally (Development)

For local testing, you can use Stripe CLI to forward webhooks:

### Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from https://stripe.com/docs/stripe-cli
```

### Login to Stripe:
```bash
stripe login
```

### Forward webhooks to local server:
```bash
# Start your Next.js dev server first
npm run dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret like `whsec_xxxxx`. Update your `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Test the webhook:
```bash
# Trigger a test checkout.session.completed event
stripe trigger checkout.session.completed
```

Check your terminal for webhook logs.

---

## Step 4: Verify Webhook is Working

### In Stripe Dashboard:
1. Go to **Webhooks** → Click your webhook endpoint
2. Look at **Recent deliveries** section
3. You should see events with:
   - ✅ Green checkmark = Success (200 response)
   - ❌ Red X = Failed (check error message)

### Expected Flow:
1. Customer completes payment
2. Stripe sends `checkout.session.completed` event to your webhook
3. Your webhook creates booking in Firestore with status `pending_acceptance`
4. Cleaner accepts booking in dashboard
5. Your API captures the payment via `/api/bookings/respond`

### Common Issues:

**Webhook returns 500 error:**
- Check Vercel logs: `vercel logs`
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify Firebase Admin credentials are set in Vercel

**Webhook signature verification fails:**
- Wrong `STRIPE_WEBHOOK_SECRET` (test vs live mode)
- Using old/revoked webhook secret

**Booking not created:**
- Check metadata is being passed correctly in checkout session
- Verify webhook is receiving the event (check Recent deliveries)

---

## Step 5: Test Stripe Connect for Cleaners

### Create Test Cleaner Account:
1. Go to your app: `/cleaner/setup`
2. Complete Steps 1-3
3. On Step 4 (Payout), click "Connect Bank Account"
4. You'll be redirected to Stripe onboarding

### In Test Mode (Stripe provides test accounts):
1. Fill in test data (use `000000000` for routing number, etc.)
2. Complete onboarding
3. Return to your app
4. Go to `/cleaner/profile`
5. Click "Check Status" to verify connection
6. Should show ✓ "Stripe Connected"

### Verify Payment Flow:
1. Create a test booking as a customer
2. Cleaner should see it in `/cleaner-dashboard` as "Pending"
3. Cleaner accepts the booking
4. Check Stripe Dashboard → **Payments** → Should see captured payment
5. Check **Connect** → **Accounts** → Should see cleaner's account with platform fee

---

## Step 6: Monitor and Debug

### Vercel Logs:
```bash
vercel logs --follow
```

### Stripe Webhook Logs:
- Dashboard → Webhooks → Click endpoint → Recent deliveries
- Click individual events to see request/response

### Firestore:
- Check `bookings` collection for status changes
- Check `cleaners` collection for Stripe account status

### Test Payment Flow:
Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

---

## Environment Variables Checklist

### Local (.env.local):
- [x] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [x] `STRIPE_SECRET_KEY`
- [x] `STRIPE_WEBHOOK_SECRET` (for local testing with Stripe CLI)
- [x] Firebase public keys (NEXT_PUBLIC_FIREBASE_*)

### Vercel (Production):
- [ ] `STRIPE_SECRET_KEY` (live key for production)
- [ ] `STRIPE_WEBHOOK_SECRET` (from webhook endpoint)
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY`

### Firebase Functions:
Already configured via `firebase functions:secrets:set`:
- [x] `RESEND_API_KEY`
- [x] `RESEND_FROM_EMAIL`
- [x] `APP_URL`

---

## Quick Start Commands

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, forward webhooks (for local testing)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 3. Test webhook
stripe trigger checkout.session.completed

# 4. Deploy to Vercel
git add .
git commit -m "Update Stripe configuration"
git push

# 5. View deployment logs
vercel logs --follow
```

---

## Need Help?

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe API Docs: https://stripe.com/docs/api
- Stripe Connect Docs: https://stripe.com/docs/connect
- Webhook Testing: https://stripe.com/docs/webhooks/test

For issues with payment capture, check:
- `/api/webhooks/stripe/route.ts` - Creates booking
- `/api/bookings/respond/route.ts` - Captures payment on acceptance
