# Email Setup Guide - Booking Confirmations

## Quick Win #3: Booking Confirmation Emails ✅

This guide will help you set up automated booking confirmation emails using Resend.

---

## Step 1: Get Your Resend API Key

1. Go to https://resend.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `re_...`)

---

## Step 2: Add API Key to Firebase Functions

### Option A: Using Firebase CLI (Recommended)

```bash
# Navigate to functions directory
cd functions

# Install dependencies first
npm install

# Set the Resend API key as a secret
firebase functions:secrets:set RESEND_API_KEY
# When prompted, paste your Resend API key (re_...)

# Go back to root
cd ..
```

### Option B: Using Firebase Console

1. Go to https://console.firebase.google.com
2. Select your project
3. Go to **Functions** → **Configuration**
4. Add secret: `RESEND_API_KEY` = `your_key_here`

---

## Step 3: Add API Key to Vercel (for review emails)

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Add environment variable
vercel env add RESEND_API_KEY

# When prompted:
# - What's the value? Paste your Resend API key
# - Environment: Select all (Production, Preview, Development)
```

### Option B: Using Vercel Dashboard (Easier!)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Fill in:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (re_...)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
6. Click **Save**

---

## Step 4: Verify Domain in Resend (Optional but Recommended)

### For Testing (Use Immediately)
- Use `bookings@resend.dev` as the sender (already configured)
- No setup needed!

### For Production (Better Deliverability)

1. Go to https://resend.com/domains
2. Click **Add Domain**
3. Enter your domain (e.g., `sparkle.com`)
4. Follow DNS setup instructions
5. Update the email sender in `functions/src/index.ts`:

```typescript
// Change this line (appears twice in the code):
from: "Sparkle <bookings@resend.dev>",

// To your verified domain:
from: "Sparkle <bookings@yourdomain.com>",
```

---

## Step 5: Deploy Functions

```bash
# Make sure you're in the project root
cd /path/to/sparkle

# Navigate to functions
cd functions

# Install dependencies (if not done yet)
npm install

# Build the TypeScript
npm run build

# Deploy to Firebase
firebase deploy --only functions

# Alternative: Deploy specific function only
firebase deploy --only functions:sendBookingConfirmationEmails
```

### Expected Output

```
✔  functions: Finished running predeploy script.
i  functions: preparing codebase for deployment
i  functions: ensuring required API firebasefunctions.googleapis.com is enabled...
✔  functions: required API firebasefunctions.googleapis.com is enabled
i  functions: uploading functions in group: default
i  functions: creating functions
✔  functions[sendBookingConfirmationEmails]: Successful create operation.
✔  Deploy complete!
```

---

## Step 6: Test It!

### Create a Test Booking

1. Go to your app
2. Book a cleaning service
3. Complete payment
4. Check your email! ✉️

### What Happens

When a booking is created in Firestore:
1. **Customer** receives: Booking confirmation with all details
2. **Cleaner** receives: New job notification with customer info

### Check Logs

```bash
# View Firebase Functions logs
firebase functions:log

# Look for:
# ✅ Email sent to customer: [email_id]
# ✅ Email sent to cleaner: [email_id]
```

---

## Troubleshooting

### Error: "Secret RESEND_API_KEY not found"

```bash
# List all secrets
firebase functions:secrets:access RESEND_API_KEY

# If not found, set it:
firebase functions:secrets:set RESEND_API_KEY
```

### Error: "Email not sent"

1. Check Resend dashboard: https://resend.com/emails
2. Verify API key is correct
3. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only sendBookingConfirmationEmails
   ```

### Emails Going to Spam

1. Verify your domain in Resend
2. Set up SPF/DKIM records
3. Use a real domain instead of resend.dev

### Rate Limits

**Resend Free Tier**:
- 100 emails/day
- 3,000 emails/month

For production, upgrade to Pro: https://resend.com/pricing

---

## Email Templates

The emails include:

### Customer Email ✨
- **Subject**: "✨ Booking Confirmed - [Date]"
- **Content**:
  - Booking details (service, cleaner, date, time)
  - Total amount paid
  - What to expect
  - Booking ID

### Cleaner Email 🎉
- **Subject**: "🎉 New Booking - [Date]"
- **Content**:
  - Job details (service, customer, contact)
  - Date and time
  - Earnings amount
  - Pre-job checklist
  - Booking ID

---

## Customizing Email Templates

Edit `functions/src/index.ts` lines 271-421:

```typescript
// Customize customer email
const customerEmailHtml = `...your HTML...`;

// Customize cleaner email
const cleanerEmailHtml = `...your HTML...`;
```

---

## Next Steps

After emails are working:
1. ✅ **Quick Win #4**: Implement Stripe webhook
2. ✅ **Quick Win #5**: Display reviews on profiles

---

**Status**: 🎉 3/5 Quick Wins Complete!

- ✅ User bookings page fixed
- ✅ Cleaner bookings page created
- ✅ Booking confirmation emails implemented
- ⏳ Stripe webhook (next)
- ⏳ Review display (next)
