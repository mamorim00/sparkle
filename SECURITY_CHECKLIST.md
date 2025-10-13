# 🔒 Security Quick Reference Checklist

## 🚨 CRITICAL - Deploy Updated Firestore Rules NOW!

The Firestore rules have been updated to allow public read access to bookings (needed for availability checking).

### Deploy Secure Rules Immediately:

```bash
# 1. Make sure you're in the project directory
cd /Users/amorimm1/Documents/random/sparkle/sparkleapp/sparkle

# 2. Login to Firebase (if not already)
firebase login

# 3. Deploy the new secure rules
firebase deploy --only firestore:rules

# 4. Verify deployment
# Go to: Firebase Console > Firestore Database > Rules
# You should see the new rules with isSignedIn(), isOwner(), etc.
```

**Expected output:**
```
✔  firestore: released rules firestore.rules to cloud.firestore
✔  Deploy complete!
```

---

## ✅ Environment Variables Security

### Local Development (.env.local)
- [x] File exists: `.env.local`
- [x] Listed in `.gitignore`
- [x] Not committed to Git
- [x] Contains all required variables
- [ ] **ACTION:** Never commit this file!

### Production (Vercel)
- [ ] **TODO:** Set environment variables in Vercel Dashboard
- [ ] Navigate to: Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Add these secrets:
  ```
  STRIPE_SECRET_KEY=sk_live_xxx
  STRIPE_WEBHOOK_SECRET=whsec_xxx
  FIREBASE_CLIENT_EMAIL=xxx
  FIREBASE_PRIVATE_KEY=xxx
  ```
- [ ] Click "Save" and redeploy

---

## 🔐 Admin Access Setup

### Add Your Admin UID

1. **Get your Firebase Auth UID:**
   - Create an account in your app
   - Go to: Firebase Console → Authentication → Users
   - Copy your UID (looks like: `AbCdEf123456...`)

2. **Update Firestore rules:**
   - Open: `firestore.rules`
   - Find the `isAdmin()` function (line 21)
   - Add your UID:
   ```javascript
   function isAdmin() {
     return isSignedIn() && request.auth.uid in [
       'YOUR_UID_HERE',  // ← Replace with your actual UID
     ];
   }
   ```

3. **Deploy updated rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 🧪 Test Your Security

### Test Firestore Rules

```bash
# Option 1: Manual testing
# - Try accessing data while logged out (should fail)
# - Try modifying another user's data (should fail)
# - Try reading your own data (should succeed)

# Option 2: Firebase Emulator (advanced)
firebase emulators:start --only firestore
```

### Test Stripe Webhook

```bash
# Local testing with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Make a test booking and verify:
# 1. Webhook receives event
# 2. Signature is verified
# 3. Booking is created in Firestore
```

---

## 📋 Security Audit Checklist

Run this checklist every month:

### Code Security
- [ ] No hardcoded secrets in code
  ```bash
  git grep -E "(sk_live|sk_test|whsec_)" -- "*.ts" "*.tsx" "*.js"
  ```
- [ ] No private keys in Git history
  ```bash
  git log -S "BEGIN PRIVATE KEY"
  ```
- [ ] `.env.local` is in `.gitignore`
  ```bash
  cat .gitignore | grep ".env"
  ```

### Firebase Security
- [ ] Firestore rules deployed
- [ ] No `allow read, write: if true;` rules
- [ ] Admin UIDs are correct
- [ ] Service account key is secure

### Stripe Security
- [ ] Webhook signature verification enabled
- [ ] Using `sk_live_` in production
- [ ] Webhook secret is unique per environment
- [ ] 2FA enabled on Stripe account

### Vercel Security
- [ ] Environment variables set
- [ ] No secrets in build logs
- [ ] 2FA enabled on account
- [ ] Deployment protection enabled

---

## 🚨 Emergency Response

### If Secrets Are Exposed:

**Immediate Actions (< 1 hour):**

1. **Revoke Stripe keys:**
   - Go to: Stripe Dashboard → Developers → API Keys
   - Click "Revoke" on exposed key
   - Generate new key

2. **Revoke Firebase service account:**
   - Go to: Firebase Console → Project Settings → Service Accounts
   - Delete compromised key
   - Generate new private key

3. **Update production:**
   - Update Vercel environment variables
   - Redeploy application

4. **Remove from Git:**
   ```bash
   # If you committed secrets, remove from history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all

   git push origin --force --all
   ```

5. **Monitor:**
   - Check Stripe dashboard for unauthorized charges
   - Review Firestore audit logs
   - Monitor application logs

---

## 📊 Quick Security Status

### Current Status:

#### ✅ SECURE:
- Environment files in `.gitignore`
- No hardcoded secrets in code
- API routes use server-side secrets
- Webhook signature verification implemented
- `.env.example` template created

#### 🚨 ACTION REQUIRED:
- [ ] **CRITICAL:** Deploy Firestore security rules
- [ ] **IMPORTANT:** Set production environment variables in Vercel
- [ ] **RECOMMENDED:** Add your admin UID to Firestore rules
- [ ] **RECOMMENDED:** Enable 2FA on all accounts (Firebase, Stripe, Vercel)

---

## 🔗 Quick Links

- **Firebase Console:** https://console.firebase.google.com
- **Firestore Rules:** Firebase Console → Firestore Database → Rules
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Security Documentation:** Read `SECURITY.md` for details

---

## ✅ Completion Checklist

Mark these as done:

- [ ] Deployed Firestore security rules
- [ ] Added admin UID to rules
- [ ] Set Vercel environment variables
- [ ] Tested login and data access
- [ ] Verified webhook works
- [ ] Enabled 2FA on Firebase
- [ ] Enabled 2FA on Stripe
- [ ] Enabled 2FA on Vercel
- [ ] Reviewed SECURITY.md documentation
- [ ] Scheduled monthly security reviews

---

**NEXT STEP:** Deploy Firestore rules immediately!

```bash
firebase deploy --only firestore:rules
```
