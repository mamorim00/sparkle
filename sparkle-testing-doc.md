# Sparkle Testing Checklist

**Version 0 published yay!** 💕

This is a summary of the things I think are the most important to test in the platform polished by ai to make the checklist. The idea is to test the V0 of the Sparkle platform to verify all features are working correctly. Please go through each section and check off items as you test them.

---

## 🎯 Testing Goals

- Verify all customer-facing features work end-to-end
- Ensure cleaner onboarding and dashboard function properly
- Test booking, payment, and cancellation flows
- Check mobile responsiveness and design quality
- Identify any bugs or UX issues

**Estimated Time:** 45-60 minutes for full testing (according to GPT from the number of items and it does not have to be done at once)

---

## 🚀 Before You Start

### Setup Checklist
- [ ] Open the app in your browser: https://sparkle-jade.vercel.app
- [ ] Clear browser cache (Cmd+Shift+Delete on Mac, Ctrl+Shift+Delete on Windows)
- [ ] Have a test email ready 
- [ ] Optional: Open browser DevTools (F12) to check for console errors
- [ ] Test on desktop first

### Test Credentials
**Stripe Test Card:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

---

## 📝 Testing Sections

### 1️⃣ Homepage Experience

**What to test:** Initial user experience and service discovery

#### Hero Section
- [ ] **Search Bar:** Type "deep clean" and verify dropdown shows matching services
- [ ] **Service Selection:** Click a service from dropdown - modal should open
- [ ] **Modal:** Verify cleaners appear in the modal with photos and prices

#### Service Cards
- [ ] **All 8 Services Visible:** Simple Clean, Deep Clean, Move-Out, Office, Window, Carpet, Post-Construction, Laundry
- [ ] **Card Click:** Click any service card - modal opens with available cleaners
- [ ] **Icons & Text:** All service descriptions are readable and icons display

#### Featured Cleaners
- [ ] **Cleaner Cards:** At least a few cleaners show up (with photos, names, ratings)
- [ ] **"View All" Button:** Navigates to `/cleaners` page

#### Navigation
- [ ] **Logo Click:** Returns to homepage
- [ ] **All Menu Links:** Work and navigate correctly
- [ ] **Mobile Menu:** On mobile, hamburger menu appears and works

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---

### 2️⃣ Customer Registration & Login

**What to test:** Account creation and authentication

#### Create Customer Account
1. [ ] Go to **Login** page
2. [ ] Click **"Register"** toggle at the top
3. [ ] **Visual Check:** All text is clearly readable (dark blue, not light gray)
4. [ ] Fill in:
   - Username: `YourNameTestCustomer1`
   - Email: `youremail+customer@gmail.com`
   - Password: `Whatever`
5. [ ] Click **"Register"**
6. [ ] **Success:** Should redirect to homepage

#### Login Test
1. [ ] Log out
2. [ ] Go to Login page
3. [ ] Enter the credentials you just created
4. [ ] **Buttons Visible:** All buttons are blue and clearly visible (not gray)
5. [ ] Click **"Login"**
6. [ ] Successfully logs in and redirects to homepage

#### Password Reset
1. [ ] Click **"Forgot your password?"** (should be visible in blue)
2. [ ] Enter your email
3. [ ] **Success Message:** Green background with confirmation message
4. [ ] *(Optional)* Check email for reset link if email service 

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---

### 3️⃣ Browse & Book a Service (Customer Flow)

**What to test:** The core booking experience

#### Find a Cleaner
1. [ ] Go to **Browse Cleaners** page (`/cleaners`)
2. [ ] **All Cleaners Show:** Cards display with photos, names, prices
3. [ ] **Filter by Service:** Select a service type - list updates
4. [ ] Click on a cleaner card

#### Booking Page
1. [ ] **URL:** Should be `/book/[cleanerId]`
2. [ ] **Select Service:** Dropdown shows available services
3. [ ] **Select Duration:** Choose 2h or 6h option
4. [ ] **Calendar Loads:** Shows next 5 days
5. [ ] **Available Slots:** Appear in order of days
7. [ ] **"Load More":** Shows additional days (up to 90 days)
8. [ ] Click an available time slot

#### Booking Details
1. [ ] **Selection Confirms:** Selected time shows in summary
2. [ ] **Price Breakdown:**
   - Base service price
   - Platform fee (15%)
   - Total amount
3. [ ] Click **"Proceed to Checkout"**

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---

### 4️⃣ Checkout & Payment

**What to test:** Payment processing via Stripe

#### Checkout Page
1. [ ] **Three Tabs:** Login, Register, Guest
2. [ ] **Guest Checkout:** 
   - Enter name: `Test Customer`
   - Enter email: `test@example.com`
   - Phone (optional)
3. [ ] **Booking Summary:** Shows cleaner, service, date, time, price
4. [ ] Click **"Pay Now"** or **"Proceed to Payment"**

#### Stripe Checkout
1. [ ] **Redirects to Stripe:** Stripe-hosted payment page loads
2. [ ] **Card Details:**
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
3. [ ] **Email:** Auto-filled or enter test email
4. [ ] Click **"Pay"**

#### Success Page
1. [ ] **Redirects to Success:** URL is `/success?session_id=...`
2. [ ] **Loading State:** Brief loading message appears
3. [ ] **Booking Details Show:**
   - "Payment Successful" message
   - Cleaner name
   - Service type
   - Date and time
   - Status: Confirmed
   - Booking ID
4. [ ] **Confirmation Email:** Check if it's the correct email. This is configured but since we don't have a domain it only sends a test email to my email

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---

### 5️⃣ Manage Bookings (Customer)

**What to test:** Viewing and managing existing bookings

#### View Bookings List
1. [ ] Go to **My Bookings** (`/user/bookings`) there is no menu for that yet so navigate to https://sparkle-jade.vercel.app/user/bookings while logged in
2. [ ] **All Bookings Show:** The booking you just created appears
3. [ ] **Booking Info:**
   - Cleaner name and photo
   - Service type
   - Date and time
   - Amount paid
   - Status badge (Confirmed/Cancelled/Completed)
4. [ ] Click on a booking

#### Booking Details Page
1. [ ] **Full Details Display:**
   - Booking ID
   - Complete booking information
   - Cleaner contact info (clickable email)
   - Pricing breakdown
2. [ ] **Action Buttons Available:**
   - "Cancel Booking" (if future booking)
   - "Reschedule Booking" (if future booking)

#### Cancel a Booking
1. [ ] Click **"Cancel Booking"**
2. [ ] **Warning Message:** Shows cancellation policy
   - Full refund if >24 hours away
   - Partial refund if <24 hours
3. [ ] **Confirmation Prompt:** "Are you sure?" message
4. [ ] Click **"Confirm Cancellation"**
5. [ ] **Success Message:** Refund amount displayed
6. [ ] **Status Changes:** Booking status → "Cancelled"
7. [ ] **Stripe Refund:** Check Stripe dashboard (test mode) for refund

#### Reschedule a Booking *(Create a new booking to test this)*
1. [ ] Make another test booking for tomorrow
2. [ ] Go to booking details
3. [ ] Click **"Reschedule Booking"**
4. [ ] **Calendar Shows:** Available slots for the same cleaner
5. [ ] Select a new date/time
6. [ ] **Preview Shows:** Original vs. new time
7. [ ] Click **"Confirm Reschedule"**
8. [ ] **Success:** Redirects back with updated details
9. [ ] **Shows Notice:** "Rescheduled from [original date]"

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---

### 6️⃣ Cleaner Registration & Onboarding

**What to test:** Becoming a service provider

#### Register as Cleaner
1. [ ] **New Incognito Window:** Open a private/incognito window
2. [ ] Go to: `/auth/login?mode=register&role=cleaner`
3. [ ] **Page Header:** Says "Registering as Cleaner"
4. [ ] **Visual Check:** All text and buttons are clearly visible (blue colors)
5. [ ] Fill in:
   - Username: `TestCleaner1`
   - Email: `youremail+cleaner@gmail.com`
   - Password: `TestPass123!`
6. [ ] Click **"Register"**
7. [ ] **Redirect:** Goes to `/cleaner/setup` (onboarding wizard)

#### Step 1: Basic Info
1. [ ] **Fields Present:**
   - Display name
   - Phone number
   - Bio/description (optional)
2. [ ] **Profile Photo:** Upload a test image
3. [ ] Fill in all required fields
4. [ ] Click **"Next"**

#### Step 2: Services & Pricing
1. [ ] **Service Checkboxes:** All 8 services available
2. [ ] Select at least 2 services (e.g., Simple Clean, Deep Clean)
3. [ ] **Set Hourly Rate:** Enter price per hour (e.g., €20)
4. [ ] **Can Select Multiple:** Check that multiple services can be selected
5. [ ] Click **"Next"**

#### Step 3: Availability Schedule
1. [ ] **Weekly Calendar:** Monday-Sunday grid
2. [ ] **Add Time Slots:** Click to add availability (e.g., Mon 9:00-17:00)
3. [ ] **Multiple Slots:** Can add multiple time ranges per day
4. [ ] **Location:** Set service area (e.g., Helsinki)
5. [ ] **Exception Dates:** *(Optional)* Mark specific days unavailable
6. [ ] Click **"Next"**

#### Step 4: Stripe Connect (Payout Setup)
1. [ ] **"Connect with Stripe" Button:** Blue and visible
2. [ ] Click the button
3. [ ] **Redirects to Stripe:** Opens Stripe Connect onboarding
4. [ ] **Fill Stripe Form:** Use test data (Stripe will accept test info in test mode)
5. [ ] **Complete Onboarding:** Follow Stripe's steps
6. [ ] **Return to App:** Redirects back to success page
7. [ ] **Confirmation:** "Stripe Connected Successfully" message
8. [ ] Click **"Go to Dashboard"**

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---


### 7️⃣ Cleaner Dashboard 

**What to test:** Service provider experience

#### Dashboard Overview
1. [ ] **URL:** `/cleaner-dashboard`
2. [ ] **Navigation Menu:** All items accessible
   - My Jobs/Bookings
   - Profile
   - Earnings
   - Schedule
3. [ ] **Stats Cards:** Show placeholder data (bookings, earnings, etc.)

#### View Bookings
1. [ ] Go to **"My Jobs"** or **"Bookings"** page
2. [ ] **Three Tabs:**
   - Upcoming (future bookings)
   - Completed (past bookings)
   - Cancelled
3. [ ] **Create Test Booking:** *(Switch back to customer account and book this cleaner)*
4. [ ] **Booking Card Shows:**
   - Customer name
   - Customer email (clickable mailto link)
   - Customer phone (clickable tel link)
   - Service type and duration
   - Date and time
   - **Earnings in Green:** Amount cleaner will receive (85% of total)
   - Booking ID
5. [ ] **"Today's Job" Badge:** If booking is today, special badge shows
6. [ ] **Email Link:** Click customer email - opens mail client
7. [ ] **Phone Link:** Click customer phone - initiates call (on mobile)

#### Edit Profile
1. [ ] Go to **Profile** settings
2. [ ] **Can Update:**
   - Services offered
   - Hourly rate
   - Availability schedule
   - Profile photo
3. [ ] Make a change and save
4. [ ] Refresh page - changes persist

#### Earnings Page
1. [ ] Go to **Earnings** page
2. [ ] **UI Present:** Page loads with earnings layout
3. [ ] *(Note: Real data integration may be pending)*

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---


NEXT TESTs (NOT READY YET)


### 8️⃣ Admin Approval System

**What to test:** Admin can approve/reject cleaners

ADMIN ACCOUNT DETAILS: 

#### Access Admin Dashboard
1. [ ] **Ask for Admin Access:** Verify your account has admin role
2. [ ] Go to `/admin/dashboard`
3. [ ] **Two Tabs:**
   - Pending Cleaners
   - Approved Cleaners

#### Pending Cleaners
1. [ ] **Cleaner Card Shows:**
   - Username
   - Email
   - Business ID (if provided)
   - Services offered
   - "View Documents" link
2. [ ] Click **"View Documents"**
3. [ ] **Documents Display:**
   - Insurance certificate
   - Other uploaded documents
   - Links open files in new tab
4. [ ] Click **"Approve"** button
5. [ ] **Status Changes:** Cleaner moves to "Approved" tab
6. [ ] **Cleaner Visible:** Now appears in customer search

#### Approved Cleaners
1. [ ] Switch to **"Approved"** tab
2. [ ] Approved cleaner appears
3. [ ] Click **"Revert to Pending"**
4. [ ] **Status Changes:** Moves back to pending
5. [ ] **No Longer Visible:** Cleaner removed from customer search

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---

### 9️⃣ Review System *(If Implemented)*

**What to test:** Customers can leave reviews for cleaners

#### Automatic Review Email
1. [ ] **Complete a Booking:** Finish a test booking (or manually set date to yesterday in Firebase)
2. [ ] **Wait for Email:** Daily Cloud Function runs at 10 AM Helsinki time
3. [ ] **Email Received:** "How was your cleaning service?" email
4. [ ] Email contains unique review link

#### Submit Review
1. [ ] Click review link from email
2. [ ] **Redirects to:** `/review/[token]`
3. [ ] **No Login Required:** Can submit without logging in
4. [ ] **Star Rating:** Click 1-5 stars
5. [ ] **Comment (Optional):** Add written feedback
6. [ ] Click **"Submit Review"**
7. [ ] **Success Message:** "Thank you for your review!"
8. [ ] **Rating Updates:** Cleaner's average rating updates on their profile

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---

### 🔟 Mobile Responsiveness

**What to test:** App works well on mobile devices

#### Test on Mobile (or resize browser to 375px width)
1. [ ] **Homepage:**
   - [ ] Search bar usable
   - [ ] Service cards stack vertically
   - [ ] Images don't overflow
2. [ ] **Navigation:**
   - [ ] Hamburger menu appears
   - [ ] Menu opens/closes smoothly
   - [ ] All links accessible
3. [ ] **Booking Calendar:**
   - [ ] Time slots are tappable (not too small)
   - [ ] Date navigation works
   - [ ] No horizontal scroll
4. [ ] **Forms:**
   - [ ] Input fields full width
   - [ ] Buttons large enough to tap
   - [ ] Keyboard doesn't break layout
5. [ ] **Cards:**
   - [ ] Cleaner cards readable
   - [ ] Booking cards display well
   - [ ] No text cut off

#### Tablet View (768px width)
1. [ ] **2-Column Grids:** Display correctly
2. [ ] **Navigation:** Works without hamburger menu
3. [ ] **Images:** Scale proportionally

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---

### 1️⃣1️⃣ Design & UI Quality

**What to test:** Professional appearance and usability

#### Visual Design
- [ ] **Colors:**
  - Primary blue (#3b82f6) used for buttons and accents
  - Text is dark and readable (not light gray)
  - Status badges are color-coded (green=confirmed, red=cancelled)
- [ ] **Typography:**
  - Headings are bold and clear
  - Body text is readable size
  - No text overflow or cut-off
- [ ] **Spacing:**
  - Cards have consistent padding
  - Sections have proper margins
  - No cramped layouts
- [ ] **Shadows & Borders:**
  - Cards have subtle shadows
  - Hover effects work on buttons
  - No elements overlap

#### Interactivity
- [ ] **Button Hover States:** Background changes on hover
- [ ] **Loading States:** Spinners show during async operations
- [ ] **Error Messages:** Red background with clear text
- [ ] **Success Messages:** Green background with confirmation
- [ ] **Smooth Transitions:** Modals, dropdowns animate smoothly

#### Footer
- [ ] **Sticky Footer:** Always at bottom even with little content
- [ ] **Links Work:** All footer links navigate correctly
- [ ] **Social Icons:** Present and clickable

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---

### 1️⃣2️⃣ Edge Cases & Error Handling

**What to test:** App handles errors gracefully

#### Authentication Errors
- [ ] **Wrong Password:** Clear error message
- [ ] **Existing Email:** "Email already in use" message
- [ ] **Protected Routes:** Redirects to login if not authenticated

#### Booking Errors
- [ ] **Past Date:** Cannot select yesterday's date
- [ ] **Double Booking:** Same time slot not bookable twice
- [ ] **Cancel Cancelled Booking:** Shows error

#### Form Validation
- [ ] **Empty Fields:** "This field is required" errors
- [ ] **Invalid Email:** "Please enter a valid email"
- [ ] **Weak Password:** Minimum requirements enforced
- [ ] **Large File Upload:** Size limit error (if >5MB)

#### Network Issues
- [ ] **Slow Connection:** Loading spinners appear
- [ ] **Failed Request:** User-friendly error message
- [ ] **Retry Button:** Allows user to retry action

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---

### 1️⃣3️⃣ Performance & Console Check

**What to test:** App is fast and error-free

#### Speed Test
- [ ] **Homepage Loads:** Within 3 seconds
- [ ] **Search Results:** Instant or <1 second
- [ ] **Page Transitions:** Smooth, no lag
- [ ] **Image Loading:** Progressive, no layout shift
- [ ] **Modal Open/Close:** Instant response

#### Browser Console (F12)
- [ ] **No Red Errors:** Check console for JavaScript errors
- [ ] **No 404s:** All resources load successfully
- [ ] **No Warnings:** *(Minor warnings acceptable)*

**✅ Section Complete** | **❌ Issues Found:** ___________________________

---

## 🐛 Bug Report Template

If you find any issues, please report them using this format:

### Issue #1
- **Page/Feature:** [e.g., Checkout page]
- **What Happened:** [Description of the bug]
- **Expected Behavior:** [What should have happened]
- **Steps to Reproduce:**
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- **Priority:** High / Medium / Low
- **Screenshots:** [If applicable]

### Issue #2
*(Repeat for each issue found)*

---

## 📊 Testing Summary

### Stats
- **Total Test Items:** ~150
- **Items Completed:** _____ / 150
- **Bugs Found:** _____
- **Critical Issues:** _____
- **Time Spent:** _____ minutes

### Overall Assessment
**Ready for Launch?** ☐ Yes | ☐ No | ☐ Needs Minor Fixes

**Comments:**
```
[Add your overall feedback here]
```

---

## ✅ Launch Readiness Criteria

The app is ready for launch when:

- ✅ All critical user flows work end-to-end
- ✅ No blocking bugs in authentication or payment
- ✅ All text is readable with proper styling
- ✅ Mobile experience is smooth
- ✅ Error messages are clear and helpful
- ✅ Performance is acceptable (<3s page loads)
- ✅ Payment processing works reliably
- ✅ Cleaner availability updates correctly

---

## 🎯 What's Next?

After testing, we'll prioritize any issues found and decide:
1. **Must Fix Before Launch:** Critical bugs blocking users
2. **Fix in First Update:** Important but not blocking
3. **Future Enhancement:** Nice-to-have improvements

**Thank you for your thorough testing! Your feedback is invaluable.** 🙏

---

**Questions or Need Help?**
- Check the browser console (F12) for error details
- Take screenshots of any issues
- Note the URL where issues occur
- Contact: [Your Contact Info]

**Testing Version:** 1.0
**Date:** [Current Date]