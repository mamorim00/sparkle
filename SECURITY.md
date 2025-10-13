# 🔒 Security Guide - Sparkle Cleaning App

## Table of Contents
1. [Environment Variables Security](#environment-variables-security)
2. [Firestore Security Rules](#firestore-security-rules)
3. [API Security](#api-security)
4. [Deployment Security](#deployment-security)
5. [Security Checklist](#security-checklist)
6. [Incident Response](#incident-response)

---

## Environment Variables Security

### ✅ What's Protected

All sensitive credentials are stored in `.env.local` which is:
- ✅ Listed in `.gitignore` (never committed to Git)
- ✅ Server-side only (not exposed to browser)
- ✅ Properly separated (public vs. secret keys)

### 🔑 Environment Variable Types

#### **Public Variables** (NEXT_PUBLIC_* prefix)
These are exposed to the browser and are safe to be public:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

**Note:** Firebase API keys are intended to be public. They are protected by Firestore Security Rules.

#### **Secret Variables** (No prefix - Server-side only)
These are NEVER exposed to the browser:
```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

### 🚨 Critical Security Rules

1. **NEVER commit `.env.local` to Git**
   ```bash
   # Always verify it's in .gitignore
   cat .gitignore | grep .env
   ```

2. **NEVER hardcode secrets in code**
   ```typescript
   // ❌ WRONG
   const apiKey = "sk_test_12345..."

   // ✅ CORRECT
   const apiKey = process.env.STRIPE_SECRET_KEY
   ```

3. **Rotate credentials if exposed**
   - If you accidentally commit secrets, immediately:
     1. Revoke the exposed credentials
     2. Generate new credentials
     3. Update production environment
     4. Remove from Git history using `git filter-branch`

---

## Firestore Security Rules

### 🛡️ Current Security Model

Our Firestore rules follow the **principle of least privilege**:

#### **Users Collection**
- ✅ Users can only read/update their own profile
- ✅ Email validation enforced
- ❌ Cannot modify `userId` or `createdAt` after creation
- ❌ Deletion requires admin privileges

#### **Cleaners Collection**
- ✅ Public read access (for browsing cleaners)
- ✅ Cleaners can only create/update their own profile
- ✅ Email validation enforced
- ❌ Cannot modify `userId` or `createdAt`
- ❌ Deletion requires admin privileges

#### **Bookings Collection** (MOST CRITICAL)
- ✅ **Public read access** - Anyone can read bookings to check availability
- ❌ **NO client-side creation** (only via webhook)
- ✅ Users can update specific fields (status, dates) for cancellation/rescheduling
- ❌ Cannot delete bookings (admin only)

**Why bookings are publicly readable:**
- Users need to see booked time slots BEFORE logging in
- Enables the booking page to show availability without authentication
- Sensitive customer data (name, email, phone) should be filtered client-side when displaying to non-owners

**Why bookings can't be created client-side:**
- Prevents users from creating fake bookings without payment
- Ensures all bookings go through Stripe checkout
- Maintains payment integrity

#### **Reviews Collection**
- ✅ Public read access
- ✅ Users can create reviews with rating 1-5
- ✅ Users can edit their own reviews within 24 hours
- ✅ Users can delete their own reviews
- ❌ Cannot modify core fields (userId, cleanerId, bookingId)

#### **Review Requests Collection**
- ✅ Anyone can read (for email link access)
- ❌ No client-side creation (only Firebase Functions)
- ✅ Can update to mark as submitted

### 🔐 Admin Access

To add admin users, edit `firestore.rules`:

```javascript
function isAdmin() {
  return isSignedIn() && request.auth.uid in [
    'YOUR_ADMIN_USER_UID_HERE',  // Add your Firebase Auth UID
  ];
}
```

**How to get your UID:**
1. Create an account in your app
2. Go to Firebase Console > Authentication
3. Copy your UID
4. Add it to the admin list
5. Deploy updated rules: `firebase deploy --only firestore:rules`

### 📝 Deploying Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Test rules locally (requires Firebase Emulator Suite)
firebase emulators:start --only firestore
```

---

## API Security

### 🔒 API Route Protection

All API routes in `/src/app/api/*` implement security:

#### **Stripe Webhook** (`/api/webhooks/stripe`)
- ✅ Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`
- ✅ Rejects unsigned requests
- ✅ Idempotency checks (prevents duplicate bookings)
- ✅ Server-side only (uses Firebase Admin SDK)

```typescript
// Signature verification
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

#### **Booking Cancellation** (`/api/bookings/cancel`)
- ✅ Validates booking ownership
- ✅ Checks booking status
- ✅ Processes Stripe refunds securely
- ✅ Updates booking status atomically

#### **Booking Rescheduling** (`/api/bookings/reschedule`)
- ✅ Validates booking ownership
- ✅ Enforces 24-hour notice requirement
- ✅ Validates new time slot
- ✅ Stores original booking history

### 🚫 What's Blocked

- ❌ Client-side booking creation (must use webhook)
- ❌ Direct Firestore writes to sensitive fields
- ❌ Unsigned webhook requests
- ❌ Unauthorized access to other users' data

---

## Deployment Security

### 🌐 Vercel Production

**Environment Variables Setup:**

1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following **Production** variables:

```
STRIPE_SECRET_KEY=sk_live_xxx  (or sk_test_xxx for testing)
STRIPE_WEBHOOK_SECRET=whsec_xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx
```

3. Click **Save** and redeploy

**Important:**
- ✅ Use `sk_live_` keys for production
- ✅ Use separate webhook secrets for production vs. development
- ✅ Never use test keys in production

### 🔧 Firebase Production

**Service Account Setup:**

1. Go to: Firebase Console → Project Settings → Service Accounts
2. Click **Generate New Private Key**
3. Save the JSON file securely (DO NOT commit to Git)
4. Copy `client_email` and `private_key` to Vercel environment variables

**Firestore Rules Deployment:**

```bash
# Deploy production rules
firebase deploy --only firestore:rules --project production
```

---

## Security Checklist

### ✅ Before First Deployment

- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Confirm no secrets in Git history
- [ ] Deploy Firestore security rules
- [ ] Set up Stripe webhook in production
- [ ] Add webhook secret to Vercel environment
- [ ] Test webhook signature verification
- [ ] Add your UID to admin list in Firestore rules
- [ ] Enable 2FA on Firebase account
- [ ] Enable 2FA on Vercel account
- [ ] Enable 2FA on Stripe account

### ✅ Monthly Security Review

- [ ] Review Firestore audit logs
- [ ] Check for unusual API activity
- [ ] Rotate Stripe API keys
- [ ] Review admin user list
- [ ] Update dependencies: `npm audit fix`
- [ ] Review Vercel deployment logs
- [ ] Check for exposed secrets: `git log -S "sk_live"`

### ✅ After Code Changes

- [ ] Test Firestore rules locally
- [ ] Verify no new secrets in code
- [ ] Check API route authorization
- [ ] Test webhook signature verification
- [ ] Review client-side data access

---

## Incident Response

### 🚨 If Secrets Are Exposed

**Immediate Actions (within 1 hour):**

1. **Revoke compromised credentials:**
   - Stripe: Dashboard → Developers → API Keys → Revoke
   - Firebase: Console → Service Accounts → Delete key
   - Generate new credentials immediately

2. **Update production environment:**
   - Vercel: Update environment variables
   - Redeploy application

3. **Remove from Git history:**
   ```bash
   # Use BFG Repo-Cleaner or git filter-branch
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all

   git push origin --force --all
   ```

4. **Monitor for abuse:**
   - Check Stripe dashboard for unauthorized charges
   - Review Firestore activity logs
   - Monitor Vercel deployment logs

### 📧 Contact Information

- **Firebase Support:** Firebase Console → Support
- **Stripe Support:** https://support.stripe.com
- **Vercel Support:** https://vercel.com/support

---

## Security Best Practices

### 🎯 Development

1. **Use environment-specific keys:**
   - Development: `sk_test_xxx`
   - Production: `sk_live_xxx`

2. **Never log sensitive data:**
   ```typescript
   // ❌ WRONG
   console.log('API Key:', process.env.STRIPE_SECRET_KEY)

   // ✅ CORRECT
   console.log('Stripe request initiated')
   ```

3. **Validate all user input:**
   ```typescript
   if (!isValidEmail(email)) {
     return { error: 'Invalid email format' }
   }
   ```

### 🔒 Production

1. **Enable HTTPS everywhere** (Vercel does this automatically)
2. **Use Content Security Policy (CSP)** headers
3. **Enable CORS only for your domain**
4. **Rate limit API endpoints** (consider Vercel rate limiting)
5. **Monitor for suspicious activity**

### 📱 Client-Side

1. **Never trust client input:**
   ```typescript
   // Always validate server-side
   export async function POST(req: NextRequest) {
     const { amount } = await req.json()
     // Recalculate amount server-side, don't trust client
   }
   ```

2. **Minimize sensitive data in browser:**
   - Don't store payment info in localStorage
   - Don't expose user IDs in URLs when unnecessary
   - Use session storage for temporary data only

---

## Questions?

If you discover a security vulnerability, please:
1. **DO NOT** open a public GitHub issue
2. Email: security@yourdomain.com (replace with your email)
3. Include: Description, steps to reproduce, potential impact

---

**Last Updated:** 2025-10-10
**Next Review:** 2025-11-10
