# 🚀 Quick Start: Stripe Webhook Setup

Your local Stripe is already configured! Here's how to set up the production webhook.

## Your Production URL
Your app is deployed at: **Check in Vercel Dashboard or run `vercel inspect`**

---

## 3-Step Setup

### ✅ Step 1: Check Local Configuration

```bash
npm run stripe:check
```

This verifies all local Stripe keys are configured. You should see all green checkmarks.

---

### ⚡ Step 2: Set Up Stripe Webhook (Production)

1. **Go to Stripe Dashboard**:
   - Test webhooks: https://dashboard.stripe.com/test/webhooks
   - Live webhooks: https://dashboard.stripe.com/webhooks

2. **Click "Add endpoint"**

3. **Enter your webhook URL**:
   ```
   https://YOUR-VERCEL-URL.vercel.app/api/webhooks/stripe
   ```

   Find your URL with: `vercel ls` (use the production URL)

4. **Select events**:
   - Click "Select events"
   - Search for: `checkout.session.completed`
   - Check the box
   - Click "Add events"

5. **Save and copy signing secret**:
   - Click "Add endpoint"
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

---

### 🔐 Step 3: Configure Vercel Environment Variables

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your `sparkle` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables for **Production**:

```
STRIPE_SECRET_KEY=sk_test_PASTE_YOUR_STRIPE_SECRET_KEY_HERE

STRIPE_WEBHOOK_SECRET=whsec_PASTE_YOUR_WEBHOOK_SECRET_HERE

FIREBASE_PROJECT_ID=sparkle-86740
```

**Note**: For production, replace `sk_test_` with your live Stripe key.

5. **Redeploy**: Push to git or run `vercel --prod`

#### Option B: Using Vercel CLI

```bash
# Run the setup script (it will prompt you)
bash scripts/setup-vercel-env.sh
```

---

## 🧪 Test Your Setup

### Test Locally with Stripe CLI

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Forward webhooks to local
npm run stripe:listen
# Copy the webhook signing secret that appears (whsec_...)
# Update .env.local with this secret

# Terminal 3: Trigger test event
npm run stripe:trigger
```

You should see:
- Webhook event in Terminal 2
- Booking created in Firestore
- No errors in Terminal 1

### Test Production

1. **Make a test booking** on your live site
2. **Check Stripe Dashboard** → Webhooks → Recent deliveries
   - Look for ✅ green checkmark (success)
   - If ❌ red X, click to see error details
3. **Check Firestore** → `bookings` collection
   - Booking should be created with status `pending_acceptance`
4. **Login as cleaner** → Accept the booking
5. **Check Stripe Dashboard** → Payments
   - Payment should be captured

---

## 📊 Monitoring & Debugging

### View Vercel Logs
```bash
vercel logs --follow
```

### View Stripe Webhook Events
https://dashboard.stripe.com/test/webhooks (click your endpoint)

### Check Environment Variables
```bash
vercel env ls
```

### Common Issues

**❌ Webhook signature verification failed**
- Wrong `STRIPE_WEBHOOK_SECRET` (copy from webhook endpoint in Stripe Dashboard)
- Using test webhook secret with live keys (or vice versa)

**❌ Webhook returns 500 error**
- Missing Firebase Admin credentials in Vercel
- Check logs: `vercel logs`

**❌ Booking not created**
- Webhook not triggered (check Recent deliveries in Stripe)
- Missing metadata in checkout session

**❌ Payment not captured**
- Cleaner didn't accept booking
- Check `/api/bookings/respond` endpoint logs

---

## 🎯 Payment Flow Overview

```
1. Customer → Creates booking → Stripe Checkout
                                     ↓
2. Stripe → Authorizes payment (manual capture)
                                     ↓
3. Stripe → Sends webhook → /api/webhooks/stripe
                                     ↓
4. Webhook → Creates booking in Firestore (status: pending_acceptance)
                                     ↓
5. Cleaner → Views in dashboard → Accepts booking
                                     ↓
6. API → /api/bookings/respond → Captures payment
                                     ↓
7. Stripe → Transfers 85% to cleaner (if Stripe Connect is set up)
            Platform keeps 15%
```

---

## 💰 Stripe Connect for Cleaners

Cleaners need to connect their bank account to receive payouts:

1. **Cleaner goes to** `/cleaner/setup` (Step 4) or `/cleaner/profile`
2. **Clicks** "Connect Bank Account"
3. **Completes** Stripe onboarding (test data in test mode)
4. **Returns** to app → Status shows ✓ "Stripe Connected"
5. **Features** in profile:
   - "Check Status" - Verifies connection with Stripe
   - "Update Stripe Connection" - Re-opens onboarding
   - "Disconnect Stripe Account" - Removes connection

### Test Stripe Connect
Use Stripe test data:
- Routing number: `110000000`
- Account number: `000123456789`
- SSN: `000000000`

---

## 🔧 Useful Commands

```bash
# Check Stripe configuration
npm run stripe:check

# Test webhook locally
npm run stripe:listen

# Trigger test event
npm run stripe:trigger

# View Vercel deployments
vercel ls

# View production logs
vercel logs --follow

# Check env vars
vercel env ls

# Redeploy
vercel --prod
```

---

## 📚 More Help

- **Full guide**: `STRIPE_SETUP.md`
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Stripe Docs**: https://stripe.com/docs/webhooks

---

## ✅ Setup Checklist

- [x] Local Stripe keys configured (.env.local)
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook signing secret copied
- [ ] Environment variables added to Vercel
- [ ] Production deployment working
- [ ] Test booking created successfully
- [ ] Webhook shows ✅ in Stripe Dashboard
- [ ] Booking appears in Firestore
- [ ] Cleaner can accept booking
- [ ] Payment captured successfully

Need help? Check the logs or review `STRIPE_SETUP.md` for detailed troubleshooting.
