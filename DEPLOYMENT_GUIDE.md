# 🚀 Deployment Guide - Quick Wins

## Build & Deployment Fixed! ✅

The TypeScript build errors have been resolved by updating `functions/tsconfig.json`.

---

## Quick Deployment Steps

### **Step 1: Set Up Resend API Key**

```bash
# Get your key from: https://resend.com/api-keys
# Then run:
cd functions
firebase functions:secrets:set RESEND_API_KEY
# Paste your key when prompted (starts with re_...)
```

### **Step 2: Install Dependencies**

```bash
# Make sure you're in the functions directory
cd functions

# Install dependencies (including resend)
npm install
```

### **Step 3: Build Functions**

```bash
# Build TypeScript to JavaScript
npm run build

# Expected output:
# > build
# > tsc
# (Should complete with no errors)
```

### **Step 4: Deploy to Firebase**

```bash
# Deploy all functions
firebase deploy --only functions

# OR deploy specific function
firebase deploy --only functions:sendBookingConfirmationEmails
```

### **Step 5: Add to Vercel** (for review emails)

```bash
# Option A: Via CLI
vercel env add RESEND_API_KEY

# Option B: Via Dashboard (easier)
# 1. Go to: https://vercel.com/[your-project]/settings/environment-variables
# 2. Add new:
#    - Name: RESEND_API_KEY
#    - Value: your_resend_key
#    - Environments: ✅ All (Production, Preview, Development)
```

---

## Troubleshooting Common Errors

### Error: "Cannot find module 'resend'"

**Fix:**
```bash
cd functions
npm install
npm run build
```

### Error: TypeScript Duplicate Identifier

**Fix:** Already fixed! The `tsconfig.json` now has:
```json
{
  "skipLibCheck": true,
  "types": ["node"],
  "exclude": ["node_modules", "../node_modules", "../../node_modules"]
}
```

### Error: "Secret RESEND_API_KEY not found"

**Fix:**
```bash
# List secrets
firebase functions:secrets:access RESEND_API_KEY

# If not found, set it:
firebase functions:secrets:set RESEND_API_KEY
```

### Error: Firebase deploy fails

**Fix:**
```bash
# Make sure you're logged in
firebase login

# Make sure you're in the right project
firebase projects:list
firebase use [your-project-id]

# Try deploying again
firebase deploy --only functions
```

---

## Verify Deployment

### 1. Check Functions in Firebase Console

```bash
# View deployed functions
firebase functions:list

# Expected output:
# ┌─────────────────────────────────┬────────┬──────────────┐
# │ Function                         │ Region │ Runtime      │
# ├─────────────────────────────────┼────────┼──────────────┤
# │ onBookingChange                  │ us-    │ nodejs22     │
# │ onCleanerUpdate                  │ central│              │
# │ sendBookingConfirmationEmails    │ 1      │              │
# └─────────────────────────────────┴────────┴──────────────┘
```

### 2. Test Email Sending

```bash
# View real-time logs
firebase functions:log --only sendBookingConfirmationEmails

# Create a test booking and watch logs
# Should see:
# ✅ Email sent to customer: [email_id]
# ✅ Email sent to cleaner: [email_id]
```

### 3. Check Resend Dashboard

- Go to: https://resend.com/emails
- You should see sent emails after creating a booking

---

## File Changes Summary

### Modified Files:
- ✅ `functions/package.json` - Added `resend` dependency
- ✅ `functions/tsconfig.json` - Fixed TypeScript config
- ✅ `functions/src/index.ts` - Added email function
- ✅ `src/app/user/bookings/page.tsx` - Fixed user bookings
- ✅ `src/app/cleaner/bookings/page.tsx` - Created cleaner bookings

### Created Files:
- ✅ `EMAIL_SETUP_GUIDE.md` - Email setup instructions
- ✅ `DEPLOYMENT_GUIDE.md` - This file

---

## Next Steps After Deployment

Once functions are deployed:

1. **Test booking flow**:
   - Create a booking through your app
   - Check both customer and cleaner receive emails
   - Verify emails look good on desktop and mobile

2. **Monitor logs**:
   ```bash
   firebase functions:log
   ```

3. **Check Resend usage**:
   - Free tier: 100 emails/day, 3,000/month
   - Monitor at: https://resend.com/overview

4. **Continue with Quick Wins**:
   - ⏳ Quick Win #4: Stripe webhook
   - ⏳ Quick Win #5: Review display

---

## Production Checklist

Before going live:

- [ ] Resend API key set in Firebase secrets
- [ ] Functions deployed successfully
- [ ] Test emails received for bookings
- [ ] Emails not going to spam
- [ ] Consider verifying custom domain in Resend
- [ ] Update email sender from `bookings@sparcklecleaning.com` to your domain

---

## Commands Reference

```bash
# Build
cd functions
npm install
npm run build

# Deploy
firebase deploy --only functions

# Logs
firebase functions:log
firebase functions:log --only sendBookingConfirmationEmails

# Secrets
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:access RESEND_API_KEY
firebase functions:secrets:destroy RESEND_API_KEY

# Testing locally (requires Firebase emulator)
npm run serve
```

---

**Status**: ✅ Ready to Deploy!
**Progress**: 3/5 Quick Wins Complete
