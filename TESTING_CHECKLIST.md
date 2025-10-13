# Sparkle App Testing Checklist

**Version:** 1.0
**Last Updated:** January 2025
**Testers:** Co-founders

---

## 📋 Pre-Testing Setup

- [ ] Open the application in your browser
- [ ] Clear browser cache and cookies
- [ ] Test in both desktop and mobile views
- [ ] Have a test email ready (can create multiple Gmail aliases with +1, +2, etc.)

---

## 🏠 Homepage Tests

### Hero Section
- [ ] Search bar is visible and styled correctly
- [ ] Type a service name (e.g., "deep clean") in search bar
- [ ] Verify dropdown appears with matching services
- [ ] Click on a service from dropdown - modal should open
- [ ] Verify modal shows available cleaners for that service

### Popular Services Section
- [ ] All 8 service cards are visible
- [ ] Each card shows service name, description, and duration
- [ ] Click on a service card - modal should open
- [ ] In modal, "Book Now" button responds without lag
- [ ] Modal closes properly when clicking X or outside

### Popular Cleaners Section
- [ ] At least some cleaners are displayed (if none, check location setting)
- [ ] Each cleaner card shows photo, name, rating, and price
- [ ] Click "View All Cleaners" button navigates to cleaners page

### Footer
- [ ] Footer stays at bottom of page (even with minimal content)
- [ ] All footer links are clickable
- [ ] Social media icons are present

---

## 🔐 Authentication Flow

### Registration (Customer)
- [ ] Navigate to `/auth/login`
- [ ] Click "Register" toggle
- [ ] Page shows "Registering as Customer"
- [ ] All text is clearly readable (dark blue, not gray)
- [ ] Enter username, email, and password
- [ ] Submit form
- [ ] Verify account is created
- [ ] Should redirect to homepage

### Registration (Cleaner)
- [ ] Go to `/auth/login?mode=register&role=cleaner`
- [ ] Page shows "Registering as Cleaner"
- [ ] All text and buttons are clearly visible (blue colors)
- [ ] Fill out registration form
- [ ] Submit form
- [ ] Should redirect to `/cleaner/setup` (4-step onboarding)

### Login
- [ ] Navigate to `/auth/login`
- [ ] Enter valid credentials
- [ ] All buttons are visible with blue styling
- [ ] Click Login
- [ ] Redirects to appropriate dashboard based on role

### Password Reset
- [ ] Click "Forgot your password?" link (visible in blue)
- [ ] Enter email address
- [ ] Verify success message appears in green background
- [ ] Check email for reset link (if email is configured)

---

## 👷 Cleaner Onboarding (4 Steps)

### Step 1: Basic Info
- [ ] Enter name, phone, bio
- [ ] Upload profile photo
- [ ] Click "Next" to proceed

### Step 2: Services
- [ ] Select at least one service type
- [ ] Set hourly rate for each service
- [ ] Verify you can select multiple services
- [ ] Click "Next"

### Step 3: Schedule
- [ ] Set availability for each day of the week
- [ ] Add multiple time slots per day
- [ ] Set location/service area
- [ ] Click "Next"

### Step 4: Payment (Stripe Connect)
- [ ] Click "Connect with Stripe"
- [ ] Complete Stripe onboarding (use test mode)
- [ ] Verify redirect back to success page
- [ ] Click "Go to Dashboard"

---

## 🧹 Cleaner Dashboard

### Navigation
- [ ] Access `/cleaner-dashboard`
- [ ] All menu items are accessible
- [ ] Stats cards show correct data

### View Bookings
- [ ] Navigate to "My Jobs" / Bookings
- [ ] Tabs work: Upcoming, Completed, Cancelled
- [ ] Each booking card shows:
  - Customer name and contact info
  - Date and time
  - Earnings highlighted in green
  - "Today's Job" badge (if applicable)
- [ ] Email and phone links work
- [ ] Booking ID is visible

### Edit Profile
- [ ] Navigate to Profile settings
- [ ] Update services, schedule, or rates
- [ ] Save changes
- [ ] Verify changes persist after refresh

---

## 🔍 Browse Cleaners (Customer Flow)

### Cleaners Page
- [ ] Navigate to `/cleaners`
- [ ] All approved cleaners are displayed
- [ ] Filter by service type works
- [ ] Search by name works
- [ ] Each cleaner card shows availability badge

### Book a Cleaner
- [ ] Click on a cleaner card
- [ ] Redirects to `/book/[cleanerId]`
- [ ] Service selection dropdown appears
- [ ] Select a service and duration
- [ ] Calendar shows next 5 days
- [ ] Available time slots are highlighted
- [ ] Booked slots are grayed out
- [ ] Click on an available slot
- [ ] Time and price summary updates

---

## 💳 Checkout Flow

### Checkout Page
- [ ] Selected time slot displays correctly
- [ ] Price breakdown shows:
  - Service amount
  - Platform fee (15%)
  - Total
- [ ] Three tabs visible: Login, Register, Guest
- [ ] Guest checkout allows name and email entry
- [ ] Logged-in users see pre-filled info
- [ ] Click "Proceed to Payment"
- [ ] Redirects to Stripe Checkout

### Stripe Payment
- [ ] Stripe Checkout page loads
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Expiry: any future date
- [ ] CVC: any 3 digits
- [ ] Complete payment

### Success Page
- [ ] Redirects to `/success?session_id=...`
- [ ] Shows "Payment Successful" message
- [ ] Displays booking details:
  - Cleaner name
  - Service type
  - Date and time
  - Status: Confirmed
- [ ] Confirmation email sent (check inbox)

---

## 📅 Booking Management (Customer)

### View Bookings
- [ ] Navigate to `/user/bookings`
- [ ] All bookings are listed
- [ ] Each booking shows:
  - Cleaner name and photo
  - Service details
  - Date and time
  - Amount paid
  - Status badge

### Cancel Booking
- [ ] Click on a booking to view details
- [ ] Click "Cancel Booking"
- [ ] Warning message displays cancellation policy:
  - Full refund if >24 hours away
  - 50% refund if <24 hours away
- [ ] Confirm cancellation
- [ ] Success message with refund amount
- [ ] Booking status changes to "Cancelled"

### Reschedule Booking
- [ ] Click on a confirmed booking
- [ ] Click "Reschedule Booking"
- [ ] Select new date (must be >24 hours from now)
- [ ] Select new time slot
- [ ] Preview shows new booking time
- [ ] Click "Confirm Reschedule"
- [ ] Redirects back to booking details
- [ ] Shows "Rescheduled" notice with original date

---

## ⭐ Review System

### Automatic Review Email
- [ ] Complete a booking (or set date to yesterday manually)
- [ ] Wait for daily Cloud Function (10 AM Helsinki time)
- [ ] Check email for review request
- [ ] Email contains unique review link

### Submit Review
- [ ] Click review link from email
- [ ] Redirects to `/review/[token]`
- [ ] No login required
- [ ] Select star rating (1-5)
- [ ] Optionally add written comment
- [ ] Submit review
- [ ] Success message displays
- [ ] Cleaner's average rating updates

---

## 📱 Responsive Design Tests

### Mobile View
- [ ] Test on phone or narrow browser window
- [ ] Navigation hamburger menu works
- [ ] All buttons are tappable (not too small)
- [ ] Forms are usable
- [ ] Cards stack vertically
- [ ] Footer stays at bottom

### Tablet View
- [ ] 2-column grid layouts display correctly
- [ ] Images scale properly
- [ ] Navigation is accessible

---

## 🎨 UI/UX Quality Checks

### Color & Contrast
- [ ] All text is readable (no gray on light backgrounds)
- [ ] Buttons are clearly visible (blue accent color)
- [ ] Interactive elements have hover states
- [ ] Error messages are in red with background
- [ ] Success messages are in green with background

### Typography
- [ ] Headings use proper hierarchy
- [ ] Body text is legible size
- [ ] No text overflow or cut-off

### Spacing & Layout
- [ ] Consistent padding and margins
- [ ] Cards have proper shadows
- [ ] No elements overlap
- [ ] Footer always at bottom (sticky footer)

---

## 🔗 Navigation Tests

### Internal Links
- [ ] Logo in navbar goes to homepage
- [ ] All navbar menu items work
- [ ] Footer links navigate correctly
- [ ] Back buttons work as expected

### External Links
- [ ] Social media icons open in new tabs
- [ ] Stripe dashboard links work (for cleaners)
- [ ] Email links open mail client
- [ ] Phone links initiate calls on mobile

---

## 🐛 Edge Cases & Error Handling

### Authentication
- [ ] Try logging in with wrong password - error message clear
- [ ] Try registering with existing email - appropriate error
- [ ] Access protected routes without login - redirects to login

### Booking
- [ ] Try booking in the past - error message
- [ ] Try cancelling already cancelled booking - error
- [ ] Try rescheduling <24 hours away - warning message

### Forms
- [ ] Submit empty forms - validation errors show
- [ ] Enter invalid email format - error
- [ ] Upload large image - size limit enforced

### Network Issues
- [ ] Disable internet briefly - loading states show
- [ ] Re-enable - page recovers gracefully

---

## ⚡ Performance Checks

- [ ] Pages load within 3 seconds
- [ ] Images load without layout shift
- [ ] No lag when clicking buttons
- [ ] Search dropdown responds quickly
- [ ] Modal opens/closes smoothly
- [ ] No console errors (check browser DevTools)

---

## 🔒 Security Checks

### Data Protection
- [ ] User passwords are not visible in forms
- [ ] Payment info handled by Stripe (not stored in app)
- [ ] Personal data not exposed in URLs

### Authorization
- [ ] Customers cannot access cleaner dashboard
- [ ] Cleaners cannot access customer bookings
- [ ] Users can only edit their own data

---

## 📊 Firebase & Backend Tests

### Firestore Data
- [ ] New bookings appear in Firebase Console
- [ ] User documents created on registration
- [ ] Cleaner availability updates after booking
- [ ] Review data stored correctly

### Cloud Functions
- [ ] `sendReviewEmails` scheduled function runs daily
- [ ] `onCleanerUpdate` triggers when cleaner edits profile
- [ ] `onBookingChange` recalculates availability
- [ ] Check function logs in Firebase Console

---

## ✅ Final Checklist

### Critical Flows
- [ ] Complete customer registration → booking → payment → success
- [ ] Complete cleaner registration → setup → view bookings
- [ ] Cancel booking with refund
- [ ] Submit review via email link

### Documentation
- [ ] Review `CLAUDE.md` for project overview
- [ ] Check `.env.local.example` for required environment variables
- [ ] Verify Firebase rules are correctly set

### Deployment
- [ ] Vercel deployment succeeds
- [ ] Environment variables are set in Vercel dashboard
- [ ] Firebase Functions deployed separately
- [ ] Production URLs work correctly

---

## 🚨 Issues Found

**Track any issues discovered during testing:**

| # | Issue Description | Priority | Page/Feature | Status |
|---|-------------------|----------|--------------|--------|
| 1 |                   |          |              |        |
| 2 |                   |          |              |        |
| 3 |                   |          |              |        |

---

## 📝 Notes

- Use test Stripe card: `4242 4242 4242 4242` (any future date, any CVC)
- Test emails can use Gmail aliases: `youremail+test1@gmail.com`
- Check Firebase Console for backend data verification
- Review browser console for any JavaScript errors
- Test in both Chrome and Safari for compatibility

---

## 🎯 Success Criteria

**The app is ready for launch when:**

✅ All critical user flows work end-to-end
✅ No blocking bugs in authentication or payment
✅ All text is readable with proper styling
✅ Mobile experience is smooth
✅ Error messages are clear and helpful
✅ Performance is acceptable (<3s page loads)
✅ Email notifications are being sent
✅ Cleaner availability updates correctly

---

**Good luck with testing! 🚀**
