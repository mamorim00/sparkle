# MVP Testing Checklist - "Book Now, Pay Later" System

**Testing Date**: ___________
**Tester**: ___________
**Version**: MVP v1.0

---

## Pre-Testing Setup

### Environment Checks
- [ ] Local development server running (`npm run dev`)
- [ ] Firebase project configured
- [ ] Firestore accessible
- [ ] Resend API key configured
- [ ] Test email account accessible
- [ ] Test cleaner account created
- [ ] Test customer account created (optional, can test as guest)

### Test Data Required
- **Test Cleaner**:
  - Email: _____________
  - Phone: _____________
  - Cleaner ID: _____________

- **Test Customer**:
  - Name: _____________
  - Email: _____________
  - Phone: _____________

---

## Part 1: Customer Booking Flow

### 1.1 Browse Cleaners
- [ ] Navigate to `/cleaners` page
- [ ] Verify cleaners are displayed with:
  - [ ] Name and photo
  - [ ] Price per hour
  - [ ] Rating
  - [ ] "Book Now" button
- [ ] Click on a test cleaner

**Expected**: Redirects to `/book/[cleanerId]` page

---

### 1.2 Select Time Slot
- [ ] Date picker displays correctly
- [ ] Available time slots load (may take a few seconds)
- [ ] Select a date (tomorrow or later)
- [ ] Select an available 2-hour time slot
- [ ] Verify price calculation shows: `€[hourly_rate] x 2 hours = €[total]`
- [ ] Click "Continue to Checkout"

**Expected**: Redirects to `/checkout` with booking details pre-filled

**Notes**: _____________________________________________

---

### 1.3 Checkout Page (MVP Flow)
- [ ] Booking summary displays correctly:
  - [ ] Cleaner name
  - [ ] Date and time
  - [ ] Duration (2 hours)
  - [ ] Total price
- [ ] Customer details form is visible
- [ ] Button says **"Confirm Booking"** (NOT "Pay with Stripe")
- [ ] Fill in customer details:
  - [ ] Name: _____________
  - [ ] Email: _____________
  - [ ] Phone: _____________ (optional)
- [ ] Footer message states: "The cleaner will send you an invoice after confirming"
- [ ] Click **"Confirm Booking"**

**Expected**:
- Loading spinner appears briefly
- Redirects to `/success?booking_id=[ID]`

**Notes**: _____________________________________________

---

### 1.4 Success Page
- [ ] Page loads successfully
- [ ] Header shows **"⏳ Booking Request Sent!"**
- [ ] Yellow info box displays:
  - **"Awaiting Cleaner Confirmation"**
  - Message: "The cleaner will be notified and will confirm your booking soon. You'll receive an email with further instructions and an invoice."
- [ ] Booking details section shows:
  - [ ] Cleaner name
  - [ ] Service type
  - [ ] Date and time
  - [ ] Status: **"Pending Confirmation"** (in yellow)
  - [ ] **No amount shown** (or shows service value without payment details)
- [ ] Confirmation email mention: "Confirmation sent to [email]"

**Expected**: No payment details displayed for MVP bookings

**Notes**: _____________________________________________

---

## Part 2: Email Notifications

### 2.1 Customer Email
Wait 1-2 minutes for Firebase Function to trigger.

- [ ] Customer receives email at the address provided
- [ ] Email subject contains "Booking Request"
- [ ] Email body includes:
  - [ ] Booking details (date, time, cleaner name)
  - [ ] Status: "Pending cleaner confirmation"
  - [ ] Message about waiting for cleaner confirmation
  - [ ] "No payment required yet" or similar messaging

**Expected**: Customer is informed that payment will be requested after service

**Email Received?**: ⬜ Yes ⬜ No
**Time Received**: _____________
**Notes**: _____________________________________________

---

### 2.2 Cleaner Email
- [ ] Cleaner receives email (check test cleaner email inbox)
- [ ] Email subject contains "New Booking Request"
- [ ] Email body includes:
  - [ ] Customer name and contact info
  - [ ] Date, time, duration
  - [ ] Service value: €______
  - [ ] Message: "Service Value (invoice client after service)"
  - [ ] **✅ Accept Request** button (green)
  - [ ] **❌ Reject Request** button (red)
  - [ ] **💬 Reply on WhatsApp** button (if cleaner has phone)
- [ ] Expiration time: "You have 24 hours to respond"

**Expected**: Cleaner has three ways to respond (email links, dashboard, WhatsApp)

**Email Received?**: ⬜ Yes ⬜ No
**Time Received**: _____________
**Notes**: _____________________________________________

---

## Part 3: Cleaner Dashboard

### 3.1 Dashboard Stats
- [ ] Login as test cleaner
- [ ] Navigate to `/cleaner-dashboard`
- [ ] Dashboard loads successfully
- [ ] **Pending Requests** card shows **1** (or current count)
- [ ] Stats are correct:
  - Pending Requests: _____
  - Upcoming Bookings: _____
  - Completed Jobs: _____
  - Total Earnings: €_____

**Expected**: New booking appears in pending count

**Notes**: _____________________________________________

---

### 3.2 Cleaner Requests Page
- [ ] Click "Booking Requests" card or navigate to `/cleaner/requests`
- [ ] Test booking appears in the list
- [ ] Booking card displays:
  - [ ] Cleaning type
  - [ ] Status: "Pending" (yellow badge)
  - [ ] Expiration countdown (e.g., "Expires in 23 hours")
  - [ ] Customer name and email
  - [ ] Customer phone (if provided)
  - [ ] Date and time
  - [ ] Duration: 2 hours
  - [ ] **Service Value**: €______
  - [ ] Green box: "💰 Service Value: €XX.XX"
  - [ ] Message: "Send invoice to customer after completing the service"
  - [ ] **"Accept Booking"** button (green)
  - [ ] **"Decline"** button (red)

**Expected**: All booking details are accurate

**Notes**: _____________________________________________

---

### 3.3 Cleaner Bookings Page
- [ ] Navigate to `/cleaner/bookings`
- [ ] Test booking appears under **"Pending Requests"** tab
- [ ] Booking displays with same details as requests page
- [ ] Filter tabs work correctly:
  - [ ] Pending Requests (1)
  - [ ] Upcoming (0)
  - [ ] Past (0)

**Expected**: Booking is categorized correctly

**Notes**: _____________________________________________

---

## Part 4: Cleaner Confirmation Flow

### Test Path A: Accept via Dashboard

#### 4.1 Accept Booking
- [ ] On `/cleaner/requests` page
- [ ] Click **"Accept Booking"** button
- [ ] Loading spinner appears on button
- [ ] Success alert/notification appears
- [ ] Booking disappears from pending list

**Expected**: Confirmation succeeds without errors

**Notes**: _____________________________________________

---

#### 4.2 Verify Status Changes
- [ ] Navigate to `/cleaner/bookings`
- [ ] Booking now appears under **"Upcoming"** tab
- [ ] Status changed to **"Confirmed"** (blue/green badge)
- [ ] **Pending Requests** count decreased by 1
- [ ] Booking ID: _____________ (note for later verification)

**Expected**: Booking moved to upcoming

**Notes**: _____________________________________________

---

### Test Path B: Accept via Email Link (Alternative Test)

**Note**: If you already tested Path A, skip this and go to 4.3. Otherwise:

- [ ] Open cleaner email
- [ ] Click **"✅ Accept Request"** button in email
- [ ] Browser opens confirmation page
- [ ] Success message displays
- [ ] Booking status updates to "confirmed"

**Expected**: One-click acceptance works from email

**Notes**: _____________________________________________

---

### 4.3 Customer Notification (Status Change)
**Note**: This is a future enhancement - may not be implemented yet.

- [ ] Customer receives "Booking Confirmed" email
- [ ] Email includes:
  - [ ] Confirmation message
  - [ ] Service details
  - [ ] Reminder about invoice after service

**Expected**: Customer is notified of confirmation

**Email Received?**: ⬜ Yes ⬜ No ⬜ Not Implemented Yet
**Notes**: _____________________________________________

---

## Part 5: Customer Bookings View

### 5.1 User Bookings Page
- [ ] Login as test customer (or guest if no account)
- [ ] Navigate to `/user/bookings`
- [ ] Page loads successfully
- [ ] Stats show:
  - Awaiting Confirmation: _____ (should be 0 if confirmed)
  - Upcoming: _____ (should be 1 if confirmed)
  - Total: _____
  - Total Spent: €0.00 (no payment yet in MVP)

**Expected**: Booking appears correctly categorized

**Notes**: _____________________________________________

---

### 5.2 Booking Card Display
Check the booking card displays:
- [ ] Cleaning type
- [ ] Cleaner name
- [ ] Date and time
- [ ] Duration
- [ ] Service amount
- [ ] **Status badge**:
  - If confirmed: "✓ Confirmed" (blue/green)
  - If still pending: "⏳ Awaiting Cleaner Confirmation" (orange)
- [ ] **Payment indicator**:
  - If pending: "Pay after service" (blue text)
  - If confirmed: May show amount

**Expected**: All info accurate, payment clearly marked as "after service"

**Notes**: _____________________________________________

---

### 5.3 Booking Detail Page
- [ ] Click on the booking card
- [ ] Redirects to `/booking/[bookingId]`
- [ ] Page loads successfully
- [ ] Status badge shows correct status
- [ ] **Service Details** section displays:
  - [ ] Date (formatted nicely)
  - [ ] Time (start - end)
  - [ ] Cleaner name
  - [ ] Customer name and email
- [ ] **Payment Details** section:
  - [ ] Shows "Service Amount: €XX.XX"
  - [ ] **For MVP bookings**: Blue info box shows:
    - "💳 Payment After Service"
    - "No payment required yet. The cleaner will send you an invoice after completing the service."
  - [ ] Platform fee and cleaner amount **hidden** (since platformFee = 0)
  - [ ] Payment status: "pending"
  - [ ] Booked on: [timestamp]

**Expected**: Payment section clearly indicates invoice will come later

**Notes**: _____________________________________________

---

## Part 6: Edge Cases & Error Handling

### 6.1 Expired Booking
**Note**: This test requires waiting 24 hours or manually updating Firestore

- [ ] Create a test booking
- [ ] Wait 24 hours OR manually set `requestExpiresAt` to past date in Firestore
- [ ] Wait for Firebase Function to run (scheduled at 10:00 AM Helsinki time)
- [ ] Verify booking status changes to **"expired"**
- [ ] Customer receives expiration email
- [ ] Email states: "No charges made" (for MVP flow)

**Expected**: Expiration flow works without payment refunds

**Tested?**: ⬜ Yes ⬜ No ⬜ Skipped (requires 24h wait)
**Notes**: _____________________________________________

---

### 6.2 Reject Booking
- [ ] Create a new test booking
- [ ] Cleaner clicks **"Decline"** button (or reject link in email)
- [ ] Confirmation prompt appears
- [ ] Confirm rejection
- [ ] Booking status changes to **"rejected"**
- [ ] Booking removed from cleaner's pending list
- [ ] Customer can see rejection in their bookings list

**Expected**: Rejection handled cleanly

**Tested?**: ⬜ Yes ⬜ No
**Notes**: _____________________________________________

---

### 6.3 No Cleaner Profile Error
- [ ] Logout
- [ ] Try to access `/cleaner/requests` without being logged in
- [ ] Should redirect to login
- [ ] Login with a non-cleaner account
- [ ] Try to access `/cleaner/requests` again
- [ ] Error message: "No cleaner profile found. Please complete your cleaner setup."
- [ ] "Go to Dashboard" button works

**Expected**: Proper error handling for non-cleaners

**Notes**: _____________________________________________

---

### 6.4 Invalid Booking ID
- [ ] Navigate to `/booking/invalid-booking-id-123`
- [ ] Page shows error: "Booking Not Found"
- [ ] Message: "This booking does not exist or you don't have permission to view it."
- [ ] "Back to My Bookings" link works

**Expected**: Graceful error for invalid bookings

**Notes**: _____________________________________________

---

## Part 7: WhatsApp Integration (Optional)

### 7.1 WhatsApp Link Generation
**Only if cleaner has phone number configured**

- [ ] Open cleaner email
- [ ] **💬 Reply on WhatsApp** button is present
- [ ] Click WhatsApp button
- [ ] Opens WhatsApp (web or app) with pre-filled message
- [ ] Message includes:
  - [ ] Booking ID
  - [ ] Date and time
  - [ ] Prompt to confirm booking

**Expected**: WhatsApp deep link works correctly

**Tested?**: ⬜ Yes ⬜ No ⬜ N/A (no phone configured)
**Notes**: _____________________________________________

---

## Part 8: Build & Deployment

### 8.1 Build Test
- [ ] Run `npm run build` in terminal
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] Only minor ESLint warnings (acceptable)

**Expected**: Clean build with no errors

**Build Status**: ⬜ Success ⬜ Failed
**Error Details**: _____________________________________________

---

### 8.2 Deployment (if applicable)
- [ ] Deploy to staging/production environment
- [ ] Verify deployed site loads
- [ ] Test booking creation on live site
- [ ] Verify Firebase Functions are triggered
- [ ] Check email delivery works in production

**Deployed?**: ⬜ Yes ⬜ No
**Environment**: _____________
**Notes**: _____________________________________________

---

## Part 9: Data Verification

### 9.1 Firestore Data Structure
- [ ] Open Firebase Console → Firestore
- [ ] Navigate to `bookings` collection
- [ ] Find test booking document
- [ ] Verify fields exist and are correct:
  - [ ] `id`: (string)
  - [ ] `status`: "pending_cleaner_confirmation" or "confirmed"
  - [ ] `amount`: (number)
  - [ ] `platformFee`: 0
  - [ ] `cleanerAmount`: 0
  - [ ] `payoutStatus`: "pending"
  - [ ] `confirmationToken`: (string)
  - [ ] `requestExpiresAt`: (ISO timestamp)
  - [ ] `createdVia`: "direct"
  - [ ] `customerName`, `customerEmail`: (strings)
  - [ ] `cleanerId`, `cleanerName`: (strings)
  - [ ] `date`, `start`, `end`, `duration`: (correct values)

**Expected**: All fields match MVP specification

**Notes**: _____________________________________________

---

## Part 10: Performance & UX

### 10.1 Loading Times
- [ ] Cleaners list loads in < 3 seconds
- [ ] Checkout page loads instantly
- [ ] Success page loads in < 2 seconds
- [ ] Dashboard loads in < 3 seconds

**Notes**: _____________________________________________

---

### 10.2 Mobile Responsiveness
Test on mobile device or browser DevTools:

- [ ] `/cleaners` page looks good on mobile
- [ ] `/book/[cleanerId]` page is usable on mobile
- [ ] `/checkout` form is easy to fill on mobile
- [ ] `/success` page displays well on mobile
- [ ] `/cleaner/requests` page works on mobile
- [ ] Cleaner email buttons work on mobile
- [ ] WhatsApp link opens correctly on mobile

**Expected**: All pages mobile-friendly

**Device Tested**: _____________
**Notes**: _____________________________________________

---

### 10.3 Browser Compatibility
Test on multiple browsers:

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Issues Found**: _____________________________________________

---

## Summary & Sign-Off

### Critical Issues Found
List any blocking issues that prevent MVP launch:

1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Non-Critical Issues
List minor issues to fix later:

1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Overall Status
- [ ] ✅ **PASS** - Ready for production
- [ ] ⚠️ **PASS WITH WARNINGS** - Can launch with minor issues
- [ ] ❌ **FAIL** - Requires fixes before launch

---

### Test Coverage Summary

| Component | Tested | Passed | Notes |
|-----------|--------|--------|-------|
| Customer Booking Flow | ⬜ | ⬜ | |
| Email Notifications | ⬜ | ⬜ | |
| Cleaner Dashboard | ⬜ | ⬜ | |
| Cleaner Confirmation | ⬜ | ⬜ | |
| Customer Bookings View | ⬜ | ⬜ | |
| Edge Cases | ⬜ | ⬜ | |
| WhatsApp Integration | ⬜ | ⬜ | |
| Build & Deployment | ⬜ | ⬜ | |
| Data Structure | ⬜ | ⬜ | |
| Performance & UX | ⬜ | ⬜ | |

---

**Tester Signature**: _____________
**Date Completed**: _____________
**Approved By**: _____________
**Date**: _____________

---

## Quick Test Script (5-Minute Smoke Test)

For rapid testing after code changes:

1. ⬜ Create a booking as customer
2. ⬜ Verify success page shows "pending confirmation"
3. ⬜ Check cleaner email received
4. ⬜ Login as cleaner and see pending request
5. ⬜ Accept booking
6. ⬜ Verify status changed to "confirmed"
7. ⬜ Check customer bookings page shows confirmed booking
8. ⬜ Run `npm run build` - should pass

**Time Taken**: _____ minutes
**Result**: ⬜ Pass ⬜ Fail

---

**End of Testing Checklist**
