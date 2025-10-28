# Social Authentication Setup Guide

This guide will walk you through setting up Google, Apple, and Phone authentication for the Sparkle application.

---

## Overview

Sparkle now supports **4 authentication methods**:
1. ✉️ **Email/Password** (Traditional)
2. 🔍 **Google Sign-In**
3. 🍎 **Apple Sign-In**
4. 📱 **Phone Authentication** (SMS)

---

## Prerequisites

- Firebase project already set up
- Firebase Authentication enabled
- Access to Firebase Console
- For Apple: Apple Developer account (for production)

---

## 1. Google Sign-In Setup

### Step 1: Enable Google Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your Sparkle project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google**
5. Toggle **Enable**
6. Add your **Support email** (required)
7. Click **Save**

### Step 2: Configure OAuth Consent Screen (For Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Fill in the required information:
   - **App name**: Sparkle
   - **User support email**: your email
   - **App domain**: your domain (e.g., sparkle.com)
   - **Authorized domains**: Add your production domain
5. Add scopes: `email`, `profile`
6. Save and continue

### Step 3: Test Google Sign-In

```bash
# Start your development server
npm run dev

# Navigate to: http://localhost:3000/auth/login
# Click "Continue with Google"
# Should open Google login popup
```

**Expected Behavior**:
- ✅ Google popup opens
- ✅ User can select Google account
- ✅ User is redirected to appropriate dashboard
- ✅ User document created in Firestore

---

## 2. Apple Sign-In Setup

### Step 1: Enable Apple Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your Sparkle project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Apple**
5. Toggle **Enable**
6. Click **Save**

### Step 2: Configure Apple Developer Account (Production Only)

**Note**: For development/testing, Firebase handles Apple Sign-In automatically. For production, you need:

1. **Apple Developer Account** ($99/year)
2. Go to [Apple Developer](https://developer.apple.com)
3. Navigate to **Certificates, Identifiers & Profiles**
4. Create a new **App ID**:
   - Description: Sparkle
   - Bundle ID: com.sparkle.app (or your domain)
   - Enable **Sign In with Apple** capability
5. Create a **Service ID**:
   - Description: Sparkle Web
   - Identifier: com.sparkle.app.web
   - Enable **Sign In with Apple**
   - Configure:
     - **Primary App ID**: Select your App ID
     - **Domains**: Add your domain (e.g., sparkle.com)
     - **Return URLs**: Add Firebase OAuth redirect URL
       ```
       https://your-project-id.firebaseapp.com/__/auth/handler
       ```
6. Create a **Key** for Sign In with Apple:
   - Key Name: Sparkle Auth Key
   - Enable **Sign In with Apple**
   - Download the `.p8` key file (IMPORTANT: Save this securely!)

### Step 3: Add Apple Configuration to Firebase (Production)

1. In Firebase Console → Authentication → Sign-in method → Apple
2. Enter your **Service ID**
3. Upload your **OAuth code flow** configuration:
   - Team ID: Found in Apple Developer account
   - Key ID: From the key you created
   - Private Key: Content of the .p8 file
4. Save

### Step 4: Test Apple Sign-In

```bash
# Start your development server
npm run dev

# Navigate to: http://localhost:3000/auth/login
# Click "Continue with Apple"
# Should open Apple login popup
```

**Expected Behavior**:
- ✅ Apple popup opens
- ✅ User can sign in with Apple ID
- ✅ User is redirected to appropriate dashboard
- ✅ User document created in Firestore

---

## 3. Phone Authentication Setup

### Step 1: Enable Phone Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your Sparkle project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Phone**
5. Toggle **Enable**
6. Click **Save**

### Step 2: Configure reCAPTCHA (Automatic)

Firebase automatically handles reCAPTCHA for phone authentication:
- **Development**: Uses invisible reCAPTCHA
- **Production**: May require visible reCAPTCHA for suspicious activity

**No additional configuration needed** - reCAPTCHA is automatically initialized in the code.

### Step 3: Test Phone Authentication

```bash
# Start your development server
npm run dev

# Navigate to: http://localhost:3000/auth/login
# Click "Continue with Phone"
# Enter phone number with country code: +1234567890
# Click "Send Verification Code"
# Check your phone for SMS with 6-digit code
# Enter code and verify
```

**Expected Behavior**:
- ✅ Phone number input appears
- ✅ SMS sent to phone (in production - test mode in dev)
- ✅ Code verification works
- ✅ User is redirected to appropriate dashboard
- ✅ User document created in Firestore

### Step 4: Testing Phone Auth (Development)

**For Development Testing**, Firebase provides **test phone numbers**:

1. Go to Firebase Console → Authentication → Sign-in method → Phone
2. Scroll to **Phone numbers for testing**
3. Add test phone numbers:
   - Phone: `+1 650-555-3434`
   - Code: `123456`
4. In your app, use the test phone number and test code

**Important**: Test phone numbers bypass SMS sending and always accept the specified code.

---

## 4. Firebase Security Rules Update

Update your Firestore security rules to handle social auth users:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Cleaners collection
    match /cleaners/{cleanerId} {
      allow read: if true; // Public read for browsing
      allow write: if request.auth != null && request.auth.uid == cleanerId;
    }

    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if request.auth != null &&
                     (request.auth.uid == resource.data.userId ||
                      request.auth.uid == resource.data.cleanerId);
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
                       (request.auth.uid == resource.data.userId ||
                        request.auth.uid == resource.data.cleanerId);
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## 5. Environment Variables (Optional)

No additional environment variables are needed for social auth. Firebase handles everything through the SDK initialization.

**Existing variables remain the same**:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 6. Testing Checklist

### Google Sign-In Testing

- [ ] Click "Continue with Google" button
- [ ] Google popup opens
- [ ] Can select Google account
- [ ] Successfully signed in
- [ ] User document created in Firestore (`users` collection)
- [ ] User redirected to correct page (customer → home, cleaner → setup)
- [ ] Can sign out and sign in again
- [ ] Existing user can sign in (second time)

### Apple Sign-In Testing

- [ ] Click "Continue with Apple" button
- [ ] Apple popup opens
- [ ] Can sign in with Apple ID
- [ ] Successfully signed in
- [ ] User document created in Firestore
- [ ] User redirected to correct page
- [ ] Can sign out and sign in again
- [ ] Existing user can sign in

### Phone Authentication Testing

- [ ] Click "Continue with Phone" button
- [ ] Phone number input appears
- [ ] Enter phone number with country code
- [ ] Click "Send Verification Code"
- [ ] Receive SMS with 6-digit code (or use test code in dev)
- [ ] Enter verification code
- [ ] Successfully verified
- [ ] User document created in Firestore
- [ ] User redirected to correct page
- [ ] Can sign out and sign in again
- [ ] Existing user can sign in with same number

---

## 7. User Flow Examples

### New Customer Signs Up with Google

```
1. User visits /auth/login
2. Clicks "Continue with Google"
3. Selects Google account
4. Firebase creates user with Google UID
5. App creates user document in Firestore:
   {
     uid: "google_uid_xxx",
     email: "user@gmail.com",
     username: "John Doe",
     role: "customer",
     photoURL: "https://google.com/photo.jpg",
     reservations: [],
     createdAt: timestamp
   }
6. User redirected to "/" (home page)
```

### Existing Cleaner Signs In with Apple

```
1. Cleaner visits /auth/login?role=cleaner
2. Clicks "Continue with Apple"
3. Signs in with Apple ID
4. Firebase returns existing user
5. App checks Firestore for cleaner document
6. Cleaner document exists → redirect to /cleaner-dashboard
```

### Customer Signs In with Phone (First Time)

```
1. User visits /auth/login
2. Clicks "Continue with Phone"
3. Enters phone: +1234567890
4. Clicks "Send Verification Code"
5. Firebase sends SMS with code
6. User enters code: 123456
7. Firebase verifies code
8. App creates user document:
   {
     uid: "phone_uid_xxx",
     phone: "+1234567890",
     username: "+1234567890",
     role: "customer",
     email: "",
     reservations: [],
     createdAt: timestamp
   }
9. User redirected to "/" (home page)
```

---

## 8. Troubleshooting

### Google Sign-In Issues

**Problem**: Google popup doesn't open
- **Solution**: Check if popup blockers are enabled. Allow popups for localhost/your domain.

**Problem**: "Unauthorized domain" error
- **Solution**: Add your domain to Firebase Console → Authentication → Settings → Authorized domains

**Problem**: User created but no Firestore document
- **Solution**: Check browser console for errors. Verify Firestore security rules allow writes.

### Apple Sign-In Issues

**Problem**: "Invalid configuration" error
- **Solution**: Ensure Apple Sign-In is enabled in Firebase Console.

**Problem**: Works on localhost but not production
- **Solution**: Configure Apple Service ID with your production domain and return URLs.

**Problem**: "Sign In with Apple is not available for this account"
- **Solution**: Ensure your Apple ID has Two-Factor Authentication enabled.

### Phone Authentication Issues

**Problem**: "reCAPTCHA verification failed"
- **Solution**:
  - Clear browser cache
  - Ensure JavaScript is enabled
  - Check if reCAPTCHA is blocked by browser extensions

**Problem**: "Invalid phone number format"
- **Solution**: Always include country code (e.g., `+1` for US, `+44` for UK)

**Problem**: SMS not received
- **Solution**:
  - Check phone number is correct
  - Wait 1-2 minutes for SMS delivery
  - Try resending code
  - Use test phone numbers for development

**Problem**: "Too many requests" error
- **Solution**: Firebase limits SMS sends to prevent abuse. Wait before trying again or use test phone numbers.

---

## 9. Production Deployment Checklist

Before going live, ensure:

### Google
- [ ] OAuth consent screen configured in Google Cloud Console
- [ ] Production domain added to authorized domains
- [ ] Terms of Service and Privacy Policy links added
- [ ] App verified (if required for production)

### Apple
- [ ] Apple Developer account created ($99/year)
- [ ] App ID created with Sign In with Apple capability
- [ ] Service ID created and configured
- [ ] Key file (.p8) downloaded and stored securely
- [ ] Firebase configured with Apple credentials
- [ ] Production domain added to Apple configuration

### Phone
- [ ] Firebase Blaze plan activated (required for SMS in production)
- [ ] SMS quota monitored (Firebase has usage limits)
- [ ] Phone numbers for testing removed (keep only in dev)
- [ ] Consider implementing rate limiting for SMS sends

### General
- [ ] All authentication methods tested in production
- [ ] Firestore security rules deployed
- [ ] Error logging configured (Sentry, LogRocket, etc.)
- [ ] User onboarding flow tested for all auth methods
- [ ] Sign-out functionality tested
- [ ] Account deletion/data export tested (GDPR compliance)

---

## 10. Cost Considerations

### Google Sign-In
- **Cost**: FREE ✅
- No usage limits

### Apple Sign-In
- **Cost**: FREE ✅ (but requires $99/year Apple Developer account for production)
- No usage limits

### Phone Authentication
- **Firebase Free Plan (Spark)**:
  - Up to 10 SMS verifications per day
  - Only works in test mode

- **Firebase Paid Plan (Blaze)**:
  - Pay per SMS sent
  - Pricing varies by country
  - US/Canada: ~$0.01 per SMS
  - Europe: ~$0.02 per SMS
  - Asia: ~$0.04 per SMS

**Recommendation**: Start with Google/Apple Sign-In (free) and enable Phone auth later when budget allows.

---

## 11. Security Best Practices

1. **Enable Multi-Factor Authentication (MFA)** for sensitive operations
2. **Rate limit authentication attempts** to prevent brute force
3. **Monitor authentication logs** for suspicious activity
4. **Keep Firebase SDK updated** for latest security patches
5. **Never expose Firebase private keys** in client-side code
6. **Use HTTPS only** in production
7. **Implement email verification** for email/password signups
8. **Add honeypot fields** to prevent bot registrations

---

## 12. Support Resources

- **Firebase Authentication Docs**: https://firebase.google.com/docs/auth
- **Google Sign-In Docs**: https://firebase.google.com/docs/auth/web/google-signin
- **Apple Sign-In Docs**: https://firebase.google.com/docs/auth/web/apple
- **Phone Auth Docs**: https://firebase.google.com/docs/auth/web/phone-auth
- **Firebase Console**: https://console.firebase.google.com
- **Apple Developer**: https://developer.apple.com
- **Google Cloud Console**: https://console.cloud.google.com

---

## Quick Start Commands

```bash
# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Deploy Firebase rules
firebase deploy --only firestore:rules
```

---

**Last Updated**: January 2025
**Version**: 1.0
**Maintained By**: Sparkle Development Team
