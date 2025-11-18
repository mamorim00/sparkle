# Email & WhatsApp Troubleshooting Guide

## Email Issues - Resend Configuration

### ✅ Current Status
- **Resend API Key**: Configured and working ✓
- **Functions Deployed**: Successfully deployed ✓
- **Email Domain**: `sparcklecleaning.com`

### Common Issues & Solutions

#### 1. **Emails Not Being Sent**

**Checklist:**
- [ ] Verify domain is added and verified in Resend dashboard: https://resend.com/domains
- [ ] Check that DNS records are configured (SPF, DKIM, DMARC)
- [ ] Ensure the "from" email matches your verified domain

**Check Domain Verification:**
```bash
# Log into Resend dashboard
open https://resend.com/domains
```

**Required DNS Records:**
Your domain `sparcklecleaning.com` needs these DNS records:

1. **SPF Record** (TXT):
   ```
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all
   ```

2. **DKIM Record** (provided by Resend):
   ```
   Name: resend._domainkey
   Value: (Get from Resend dashboard)
   ```

3. **DMARC Record** (TXT):
   ```
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:admin@sparcklecleaning.com
   ```

#### 2. **Check Firebase Function Logs**

View logs in Firebase Console:
```bash
open https://console.firebase.google.com/project/sparkle-86740/functions/logs
```

Or via CLI:
```bash
firebase functions:log
```

Look for errors like:
- `❌ Failed to send email`
- `401 Unauthorized`
- `Domain not verified`

#### 3. **Test Email Sending**

Run the test script:
```bash
cd functions
node test-resend.js
```

If successful, you'll see:
```
✅ Email sent successfully!
Result: { "data": { "id": "..." } }
```

#### 4. **Check Function Execution**

Monitor function executions:
```bash
# View real-time logs
firebase functions:log --only sendBookingConfirmationEmails

# Or check in console
open https://console.firebase.google.com/project/sparkle-86740/functions
```

---

## WhatsApp Integration

### How WhatsApp Links Work

The system generates WhatsApp deep links when:
1. A booking request is created
2. The cleaner has a phone number in their profile

### WhatsApp URL Format

```
https://wa.me/PHONE_NUMBER?text=MESSAGE
```

Example:
```
https://wa.me/1234567890?text=Hi!%20Regarding%20booking%20abc123...
```

### Testing WhatsApp Links

#### Option 1: Manual Test
1. Create a booking with the new flow
2. Check the cleaner's email
3. Look for the "Reply on WhatsApp" button
4. Click it - should open WhatsApp with pre-filled message

#### Option 2: Test in Browser
Open this URL (replace with real phone):
```
https://wa.me/351912345678?text=Test%20message%20from%20Sparkle
```

Should:
- On mobile: Open WhatsApp app
- On desktop: Open WhatsApp Web

#### Option 3: View Email HTML in Logs

Check Firebase logs to see the generated email HTML:
```bash
firebase functions:log | grep -A 50 "WhatsApp"
```

### Setting Up Cleaner Phone Number

Ensure cleaners have phone numbers in Firestore:

```javascript
// In Firestore console
cleaners/{cleanerId}
{
  phone: "+351912345678", // International format with +
  email: "cleaner@example.com",
  ...
}
```

**Important:** Phone must be in international format:
- ✅ `+351912345678`
- ✅ `+14155552671`
- ❌ `912345678` (missing country code)

### WhatsApp Link in Email Template

The email includes this section (only if cleaner has phone):

```html
<div style="text-align: center; margin: 20px 0; padding: 15px; background: #dcfce7; border-radius: 5px;">
  <p style="margin: 0 0 10px 0;"><strong>Or respond via WhatsApp:</strong></p>
  <a href="https://wa.me/PHONE?text=MESSAGE" style="...">
    💬 Reply on WhatsApp
  </a>
</div>
```

### Debugging WhatsApp

1. **Check if phone exists:**
   ```bash
   # In Firebase Console
   open https://console.firebase.google.com/project/sparkle-86740/firestore/data/cleaners
   ```

2. **Verify URL generation:**
   Add console.log in functions/src/index.ts:
   ```typescript
   console.log('WhatsApp URL:', whatsappUrl);
   ```

3. **Test the generated URL:**
   Copy from logs and paste in browser

---

## Testing the Complete Flow

### 1. Create a Test Booking

```javascript
// Use the /api/create-booking endpoint
fetch('https://your-app.vercel.app/api/create-booking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bookingDetails: {
      cleanerId: 'test-cleaner-id',
      cleanerName: 'Test Cleaner',
      date: '2025-11-20',
      start: '10:00',
      end: '12:00',
      duration: 2,
      cleaningType: 'Standard Cleaning',
      totalPrice: 50
    },
    userName: 'Test Customer',
    userEmail: 'customer@example.com',
    userPhone: '+351912345678'
  })
})
```

### 2. Check Emails Sent

Within seconds, check:
1. Customer receives: "⏳ Booking Request Sent!"
2. Cleaner receives: "🔔 New Booking Request!"

### 3. Check Email Content

Cleaner email should have:
- ✅ Accept Request button (links to email confirmation)
- ❌ Reject Request button
- 💬 Reply on WhatsApp button (if phone exists)

### 4. Test Confirmation Flow

Click "Accept Request" in email → Should:
1. Redirect to `/cleaner-dashboard?confirmed=true&booking=xxx`
2. Update booking status to `confirmed`
3. Send confirmation email to customer

---

## Quick Fixes

### Emails not sending?
```bash
# 1. Check Resend domain is verified
open https://resend.com/domains

# 2. Redeploy functions
cd functions && firebase deploy --only functions

# 3. Check logs
firebase functions:log | grep "email"
```

### WhatsApp not working?
```bash
# 1. Verify cleaner has phone
# Check Firestore: cleaners/{id}.phone

# 2. Test WhatsApp URL manually
open "https://wa.me/351912345678?text=Test"

# 3. Check function logs
firebase functions:log | grep "whatsapp"
```

### Need to test locally?
```bash
# Run functions emulator
firebase emulators:start --only functions

# Test with local endpoint
curl -X POST http://localhost:5001/sparkle-86740/us-central1/sendBookingConfirmationEmails
```

---

## Support Resources

- **Resend Docs**: https://resend.com/docs
- **Firebase Functions**: https://firebase.google.com/docs/functions
- **WhatsApp URL Scheme**: https://faq.whatsapp.com/1108537053479488
- **Firestore Console**: https://console.firebase.google.com/project/sparkle-86740/firestore

---

## Next Steps

1. ✅ Verify domain in Resend dashboard
2. ✅ Add DNS records for email authentication
3. ✅ Test booking creation
4. ✅ Verify emails are received
5. ✅ Test WhatsApp link on mobile
6. ✅ Test email confirmation links
