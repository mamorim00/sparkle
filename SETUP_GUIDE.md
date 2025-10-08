# Complete Setup Guide for Review System

Follow these steps exactly to set up the automated review system.

---

## Part 1: Get Firebase Admin SDK Credentials

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your **Sparkle** project

### Step 2: Create Service Account
1. Click the **⚙️ gear icon** (top left) → **Project settings**
2. Click the **Service accounts** tab
3. Click **Generate new private key** button
4. Click **Generate key** in the confirmation popup
5. A JSON file will download automatically - **Save this file securely!**

### Step 3: Open the JSON File
Open the downloaded JSON file in a text editor. It looks like this:

```json
{
  "type": "service_account",
  "project_id": "sparkle-xxxxx",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhki...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@sparkle-xxxxx.iam.gserviceaccount.com",
  ...
}
```

You'll need these **3 values**:
- `project_id`
- `private_key` (the entire string including BEGIN/END)
- `client_email`

---

## Part 2: Add Environment Variables to Vercel

### Step 4: Open Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **Sparkle** project
3. Click **Settings** tab (top navigation)
4. Click **Environment Variables** in the left sidebar

### Step 5: Add Variable 1 - Project ID
1. Click **Add New** (or similar button)
2. Fill in:
   - **Key**: `FIREBASE_PROJECT_ID`
   - **Value**: Copy and paste the `project_id` from your JSON file
     - Example: `sparkle-abc123`
   - **Environment**: Select **All** (Production, Preview, Development)
3. Click **Save**

### Step 6: Add Variable 2 - Client Email
1. Click **Add New** again
2. Fill in:
   - **Key**: `FIREBASE_CLIENT_EMAIL`
   - **Value**: Copy and paste the `client_email` from your JSON file
     - Example: `firebase-adminsdk-xxxxx@sparkle-xxxxx.iam.gserviceaccount.com`
   - **Environment**: Select **All**
3. Click **Save**

### Step 7: Add Variable 3 - Private Key
⚠️ **This one is tricky - follow carefully:**

1. Click **Add New** again
2. Fill in:
   - **Key**: `FIREBASE_PRIVATE_KEY`
   - **Value**: Copy the **ENTIRE** `private_key` from your JSON file
     - Include `-----BEGIN PRIVATE KEY-----` at the start
     - Include `-----END PRIVATE KEY-----` at the end
     - Include all the `\n` characters (they should remain as text `\n`, not actual line breaks)
     - The value should look like: `"-----BEGIN PRIVATE KEY-----\nMIIEvgIBAD...\n-----END PRIVATE KEY-----\n"`
   - **Environment**: Select **All**
3. Click **Save**

### Step 8: Redeploy Your Vercel App
After adding all three variables:

**Option A - Trigger via Git:**
```bash
git add .
git commit -m "Add review system"
git push
```

**Option B - Manual redeploy in Vercel:**
1. Go to **Deployments** tab in Vercel
2. Find the latest deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Check "Use existing Build Cache" option
6. Click **Redeploy**

---

## Part 3: Set Up Resend

### Step 9: Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Click **Sign Up** (top right)
3. Enter your email and create a password
4. Verify your email

### Step 10: Get API Key
1. After logging in, you'll see the dashboard
2. Click **API Keys** in the left sidebar
3. Click **Create API Key** button
4. Fill in:
   - **Name**: `Sparkle Production`
   - **Permission**: Full access (default)
5. Click **Add**
6. **IMPORTANT**: Copy the API key that appears - you won't see it again!
   - It starts with `re_`
   - Example: `re_123abc456def789`

### Step 11: Add Your Domain to Resend
⚠️ **You MUST verify your domain to send emails**

1. Click **Domains** in the left sidebar
2. Click **Add Domain** button
3. Enter your domain (without `www`)
   - Example: `yourdomain.com` (not `www.yourdomain.com`)
4. Click **Add**

### Step 12: Add DNS Records
Resend will show you DNS records to add. You need to add these to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

1. Log in to where you bought your domain
2. Find DNS settings
3. Add the **3 records** Resend shows you:
   - **TXT record** for SPF
   - **TXT record** for DKIM
   - **MX record** (if you want to receive emails)

**Example DNS records you'll add:**

| Type | Name | Value |
|------|------|-------|
| TXT | @ | `v=spf1 include:resend.com ~all` |
| TXT | resend._domainkey | `p=MIGfMA0GCSqGSIb3...` (long value) |

4. Click **Verify** in Resend after adding records
5. Wait a few minutes for DNS to propagate
6. Once verified, you'll see a ✅ green checkmark

---

## Part 4: Configure Firebase Functions

### Step 13: Install Firebase CLI (if needed)
Open your terminal and run:

```bash
npm install -g firebase-tools
```

### Step 14: Login to Firebase
```bash
firebase login
```

This will open a browser window - log in with your Google account.

### Step 15: Navigate to Your Project
```bash
cd /Users/amorimm1/Documents/random/sparkle/sparkleapp/sparkle
```

### Step 16: Set Firebase Environment Variables
Run these commands **one by one**, replacing the values:

```bash
# Set Resend API Key (paste the key from Step 10)
firebase functions:secrets:set RESEND_API_KEY
# When prompted, paste your Resend API key (re_xxxxx)

# Set From Email (must match your verified domain)
firebase functions:secrets:set RESEND_FROM_EMAIL
# When prompted, enter: noreply@yourdomain.com

# Set Your App URL (your Vercel deployment URL)
firebase functions:secrets:set APP_URL
# When prompted, enter: https://your-app.vercel.app
```

**Example:**
```bash
$ firebase functions:secrets:set RESEND_API_KEY
? Enter a value for RESEND_API_KEY: re_abc123xyz789
✓ Created a new secret version projects/123/secrets/RESEND_API_KEY

$ firebase functions:secrets:set RESEND_FROM_EMAIL
? Enter a value for RESEND_FROM_EMAIL: noreply@sparkle-cleaning.com
✓ Created a new secret version

$ firebase functions:secrets:set APP_URL
? Enter a value for APP_URL: https://sparkle-cleaning.vercel.app
✓ Created a new secret version
```

---

## Part 5: Deploy Firebase Functions

### Step 17: Install Function Dependencies
```bash
cd functions
npm install
```

### Step 18: Deploy the Functions
```bash
firebase deploy --only functions
```

Wait for deployment to complete. You should see:
```
✓ functions[sendReviewEmails] Successful update operation.
✓ Deploy complete!
```

---

## Part 6: Test the System

### Step 19: Create a Test Booking (Manual Test)

1. Go to your Firebase Console
2. Navigate to **Firestore Database**
3. Create a test document in the `bookings` collection:

```json
{
  "cleanerId": "your-cleaner-id",
  "userId": "test-user-123",
  "userName": "Test User",
  "userEmail": "your-email@gmail.com",
  "date": "2025-10-07",  // Use yesterday's date
  "start": "10:00",
  "end": "12:00"
}
```

### Step 20: Manually Trigger the Function (Optional)

Open Firebase Functions logs:
```bash
firebase functions:log
```

Or wait until 10:00 AM the next day for automatic execution.

### Step 21: Check Review Email

1. Check your email inbox (the one you used in test booking)
2. You should receive an email titled: **"How was your cleaning service? ✨"**
3. Click **Leave a Review** button
4. Fill out the review form
5. Submit the review
6. Check Firestore for the new `reviews` document

---

## Troubleshooting

### ❌ Email Not Sending

**Check 1: Verify Domain in Resend**
- Go to Resend → Domains
- Make sure your domain has a ✅ green checkmark
- If not verified, check DNS records

**Check 2: Check Firebase Logs**
```bash
firebase functions:log --only sendReviewEmails
```

Look for errors like:
- `"Domain not verified"` → Verify domain in Resend
- `"Invalid API key"` → Check your RESEND_API_KEY secret

**Check 3: Verify Secrets Are Set**
```bash
firebase functions:secrets:access RESEND_API_KEY
firebase functions:secrets:access RESEND_FROM_EMAIL
firebase functions:secrets:access APP_URL
```

### ❌ Review Submission Failing

**Check 1: Vercel Environment Variables**
- Go to Vercel → Settings → Environment Variables
- Verify all 3 Firebase variables are set
- Redeploy if you just added them

**Check 2: Check API Route Logs**
- Go to Vercel → Deployments → Click latest → Functions tab
- Look for `/api/submit-review` errors

### ❌ Review Page Shows "Invalid Link"

**Cause**: Review request doesn't exist in Firestore

**Fix**:
1. Go to Firebase → Firestore
2. Check `reviewRequests` collection
3. Find document with matching token
4. Verify `reviewSubmitted` is `false`

---

## Summary Checklist

- [ ] Downloaded Firebase service account JSON
- [ ] Added 3 environment variables to Vercel (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)
- [ ] Redeployed Vercel app
- [ ] Created Resend account
- [ ] Got Resend API key
- [ ] Verified domain in Resend
- [ ] Set 3 Firebase secrets (RESEND_API_KEY, RESEND_FROM_EMAIL, APP_URL)
- [ ] Deployed Firebase functions
- [ ] Tested with a sample booking

---

## What Happens After Setup

1. **Daily at 10:00 AM** (Helsinki time):
   - Firebase function runs automatically
   - Checks for bookings from previous day
   - Sends review emails to customers

2. **Customer receives email**:
   - Clicks "Leave a Review" button
   - Opens review page (no login needed)
   - Submits rating and optional comment

3. **Review is stored**:
   - Saved to Firestore `reviews` collection
   - Cleaner's average rating is updated
   - Review request marked as completed

---

## Need Help?

- Resend docs: https://resend.com/docs
- Firebase Functions docs: https://firebase.google.com/docs/functions
- Vercel environment variables: https://vercel.com/docs/projects/environment-variables
