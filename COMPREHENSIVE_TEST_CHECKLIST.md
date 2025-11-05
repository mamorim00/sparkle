# Comprehensive Test Checklist - Sparkle v2.0 (Ticket System Update)

**Version**: 2.0
**Date**: January 2025
**Deployed Commit**: a33f86a
**Major Changes**: Ticket/Dispute System, Phone Auth Support, Search/Filter Improvements

---

## 1. AUTHENTICATION & USER MANAGEMENT

### Email/Password Authentication
- [ ] Register new user with email and password
- [ ] Login with existing email credentials
- [ ] Incorrect password shows error
- [ ] Password strength validation works
- [ ] Email format validation works
- [ ] User can logout successfully
- [ ] After logout, cannot access protected pages
- [ ] Login redirects to intended page (if coming from protected route)

### Phone Authentication
- [ ] Register with phone number (with reCAPTCHA)
- [ ] Verify OTP code works
- [ ] Invalid OTP shows error
- [ ] Phone number format validation works
- [ ] User document created without email field (phone auth)
- [ ] Cleaner document can be created with phone auth (no email required)
- [ ] Phone users can access all features

### Google OAuth
- [ ] Register with Google account
- [ ] Login with existing Google account
- [ ] User profile populated with Google data
- [ ] Can logout after Google login
- [ ] Cleaner profile can be created after Google auth

### Protected Routes
- [ ] Unauthenticated users redirected to login from /user/bookings
- [ ] Unauthenticated users redirected to login from /support
- [ ] Unauthenticated users redirected to login from /cleaner-dashboard
- [ ] Unauthenticated users redirected to login from /admin/dashboard
- [ ] Non-admin users cannot access /admin/dashboard
- [ ] After login, user redirected back to intended page

---

## 2. HOMEPAGE & SEARCH

### Homepage
- [ ] Homepage loads without errors
- [ ] Hero section displays correctly
- [ ] Service cards display (Quick Clean, Deep Clean, Move In/Out)
- [ ] Location selector shows "Helsinki"
- [ ] Clicking location selector opens popup
- [ ] Location popup shows "More locations coming soon"
- [ ] "How It Works" section visible
- [ ] "Why Choose Sparkle" section visible
- [ ] Footer displays correctly and stays at bottom

### Search Functionality
- [ ] Clicking service card (e.g., "Quick Clean") redirects to /cleaners page
- [ ] Selected service filter applied on cleaners page
- [ ] Search query parameter persists in URL (?service=quick-clean)
- [ ] No modal popup appears (old behavior removed)

---

## 3. CLEANERS PAGE & FILTERING

### Cleaners Listing
- [ ] All approved cleaners display
- [ ] Cleaner cards show: photo, name, rating, price, services
- [ ] "Next Available" time displays correctly
- [ ] Clicking "Book Now" redirects to booking page
- [ ] Empty state shows if no cleaners available

### Modern Sidebar Filters (Desktop)
- [ ] Sidebar visible on desktop (>768px width)
- [ ] Price range slider works (€0 - €100)
- [ ] Price values update as slider moves
- [ ] Cleaners filter by selected price range
- [ ] Rating filter buttons work (All, 4+, 4.5+, 5 Stars)
- [ ] Cleaners filter by minimum rating
- [ ] Multiple filters work together (price + rating)
- [ ] Filter count updates in real-time

### Mobile Filters
- [ ] Sidebar hidden on mobile (<768px width)
- [ ] Floating filter button appears (bottom-right)
- [ ] Clicking filter button opens slide-out sidebar
- [ ] Mobile sidebar slides in from left
- [ ] Close button (X) closes sidebar
- [ ] Clicking backdrop closes sidebar
- [ ] Filters work same as desktop on mobile

### Search on Cleaners Page
- [ ] Search box filters by cleaner name
- [ ] Search filters by service type
- [ ] Search works with other filters (price, rating)
- [ ] Clear search returns all cleaners

---

## 4. BOOKING FLOW

### Cleaner Profile & Availability
- [ ] Booking page shows cleaner details
- [ ] Calendar displays available dates
- [ ] Booked time slots are grayed out
- [ ] Available time slots are clickable
- [ ] "Next Available 2h" shows correct time
- [ ] "Next Available 6h" shows correct time
- [ ] Cannot select past dates
- [ ] Cannot select booked time slots

### Checkout Process
- [ ] Guest checkout works (no account required)
- [ ] Registered user checkout works
- [ ] Service type selection works (Quick, Deep, Move In/Out)
- [ ] Price calculates correctly based on duration
- [ ] Duration selector works (2h, 4h, 6h, etc.)
- [ ] Customer name and email captured
- [ ] Stripe checkout session created successfully
- [ ] Redirected to Stripe payment page

### Payment & Confirmation
- [ ] Test card payment succeeds (4242 4242 4242 4242)
- [ ] Redirected to success page after payment
- [ ] Booking created in Firestore
- [ ] Booking ID displayed on success page
- [ ] Confirmation email sent to customer
- [ ] Cleaner availability updated after booking
- [ ] Platform fee calculated correctly (15%)

---

## 5. USER DASHBOARD

### User Bookings Page
- [ ] User can view all their bookings
- [ ] Bookings display: date, time, cleaner, service type, status
- [ ] Upcoming bookings section works
- [ ] Past bookings section works
- [ ] Booking status color-coded correctly (confirmed, completed, cancelled)
- [ ] Clicking booking shows details

### Booking Management
- [ ] User can cancel upcoming booking
- [ ] Cancellation refund calculated correctly (based on time until booking)
- [ ] Cancelled booking status updates
- [ ] User can reschedule booking (if feature enabled)
- [ ] Cannot cancel past bookings

---

## 6. CLEANER FEATURES

### Cleaner Registration
- [ ] Cleaner can register via /cleaner/setup
- [ ] Step 1: Basic info (name, email/phone, bio)
- [ ] Step 2: Services and pricing
- [ ] Step 3: Schedule/availability
- [ ] Step 4: Business documents upload (ID, insurance)
- [ ] Progress bar shows completion
- [ ] Stripe Connect onboarding initiated
- [ ] Cleaner status set to "pending" after registration
- [ ] Cannot access cleaner features until approved

### Cleaner Dashboard
- [ ] Cleaner can view their bookings
- [ ] Upcoming bookings visible
- [ ] Past bookings visible
- [ ] Booking details display correctly
- [ ] Can mark bookings as completed
- [ ] Earnings summary visible

### Cleaner Profile Management
- [ ] Cleaner can edit profile at /cleaner/profile
- [ ] Can update bio and description
- [ ] Can update services offered
- [ ] Can update pricing
- [ ] Can update availability schedule
- [ ] Can add exceptions (blocked dates)
- [ ] Changes save successfully

---

## 7. TICKET/DISPUTE SYSTEM (NEW FEATURE)

### User Ticket Submission
- [ ] "Support" link visible in navbar (logged-in users only)
- [ ] Support link not visible when logged out
- [ ] Clicking "Support" navigates to /support page
- [ ] Support page loads correctly
- [ ] Ticket form displays all fields:
  - Type dropdown (complaint, dispute, refund, technical, other)
  - Priority dropdown (low, medium, high, urgent)
  - Subject field (max 100 chars)
  - Description textarea (max 1000 chars)
  - Optional booking ID field
- [ ] Character counter shows for description (X/1000)
- [ ] Cannot submit with empty subject
- [ ] Cannot submit with empty description
- [ ] Submit button shows loading spinner while submitting
- [ ] Success message appears after submission
- [ ] Form resets after successful submission
- [ ] New ticket appears in "My Tickets" panel immediately

### User Ticket Viewing
- [ ] "My Tickets" panel displays on right side (desktop)
- [ ] User sees only their own tickets
- [ ] Tickets display: subject, description (truncated), status, priority
- [ ] Status color-coded correctly:
  - Open: Red
  - In Progress: Yellow
  - Resolved: Green
  - Closed: Gray
- [ ] Priority color-coded correctly:
  - Urgent: Red
  - High: Orange
  - Medium: Yellow
  - Low: Blue
- [ ] Ticket type displays (dispute, refund, etc.)
- [ ] Creation date displays
- [ ] Message count displays (if messages exist)
- [ ] Empty state shows if no tickets ("No tickets yet")

### Admin Ticket Management
- [ ] Admin can access "Tickets" tab in dashboard
- [ ] Badge shows open ticket count on tab
- [ ] Stats dashboard displays:
  - Open Tickets count (red)
  - In Progress count (yellow)
  - Resolved count (green)
  - Total Tickets count (gray)
- [ ] All tickets display in list (not just admin's)
- [ ] Tickets sorted by creation date (newest first)
- [ ] Each ticket shows:
  - Subject
  - Description
  - User name and email
  - Status badge
  - Priority badge
  - Type
  - Creation date
  - Booking ID (if linked)
  - Message count

### Admin Ticket Actions
- [ ] "Start Working" button appears for "open" tickets
- [ ] Clicking "Start Working" changes status to "in_progress"
- [ ] "Mark Resolved" button appears for "in_progress" tickets
- [ ] Clicking "Mark Resolved" changes status to "resolved"
- [ ] "Close Ticket" button appears for open/in_progress tickets
- [ ] Clicking "Close Ticket" changes status to "closed"
- [ ] Priority dropdown works and updates ticket priority
- [ ] Stats update immediately after status change
- [ ] Badge count updates after resolving/closing tickets
- [ ] Resolved tickets show resolved timestamp

### Ticket Security
- [ ] Non-admin cannot access other users' tickets
- [ ] User cannot change ticket status (only admin)
- [ ] User cannot change priority (only admin)
- [ ] Cannot create ticket with invalid type
- [ ] Cannot create ticket with status other than "open"
- [ ] Firestore rules enforce security (test via console)

---

## 8. ADMIN DASHBOARD

### Admin Access
- [ ] Only users with role="admin" can access /admin/dashboard
- [ ] Non-admin users redirected to home
- [ ] Unauthenticated users redirected to login

### Overview Tab
- [ ] Key metrics display:
  - Total Bookings count
  - Total Revenue (€)
  - Platform Revenue (15% of total)
  - Active Cleaners count
- [ ] This month stats display correctly
- [ ] Booking status breakdown shows (Confirmed, Completed, Cancelled)
- [ ] Top Cleaners section displays (by booking count)
- [ ] Top cleaners show rating if available

### Cleaners Tab
- [ ] Pending cleaners section shows cleaners awaiting approval
- [ ] Pending cleaner cards display:
  - Username
  - Email
  - Business ID
  - Links to insurance certificate
  - Links to other documents
  - Rating (if exists)
- [ ] "Approve" button works
- [ ] Clicking approve moves cleaner to "Approved" section
- [ ] Approved cleaners section shows all approved cleaners
- [ ] Approved cleaner cards show booking count
- [ ] "Revert" button works (moves back to pending)

### Bookings Tab
- [ ] All bookings display in table
- [ ] Search filters by customer name, cleaner name, or service type
- [ ] Bookings show:
  - Booking ID (truncated)
  - Customer name and email
  - Cleaner name
  - Service type
  - Date and time
  - Amount
  - Status badge (color-coded)
- [ ] Table scrolls horizontally on mobile
- [ ] Empty state if no bookings

### Users Tab
- [ ] All users display in table
- [ ] Search filters by email or display name
- [ ] User stats display:
  - Total Users
  - Customers count
  - Cleaners count
- [ ] Users table shows:
  - Email
  - Display Name
  - Role badge (customer, cleaner, admin)
  - Join date
- [ ] Role badges color-coded correctly

### Tickets Tab
- [ ] See section 7 above for detailed ticket testing

---

## 9. REVIEW SYSTEM

### Review Request Email
- [ ] Review email sent 1 day after completed booking
- [ ] Email contains unique review token
- [ ] Email link navigates to /review/[token]
- [ ] Token validation works

### Review Submission
- [ ] Review page loads with booking details
- [ ] User can submit rating (1-5 stars)
- [ ] User can add optional comment
- [ ] Cannot submit review twice (token becomes invalid)
- [ ] Review saved to Firestore
- [ ] Cleaner's average rating updates
- [ ] Review appears on cleaner profile

---

## 10. STRIPE INTEGRATION

### Cleaner Stripe Connect
- [ ] Cleaner redirected to Stripe onboarding during setup
- [ ] Stripe account linked successfully
- [ ] Cleaner can access Stripe dashboard
- [ ] Payouts configured correctly

### Payment Processing
- [ ] Stripe checkout session created correctly
- [ ] Payment metadata includes booking details
- [ ] Webhook processes payment success
- [ ] Booking created after successful payment
- [ ] Platform fee deducted (15%)
- [ ] Cleaner receives 85% of booking amount

---

## 11. MOBILE RESPONSIVENESS

### General Mobile Testing
- [ ] Homepage displays correctly on mobile
- [ ] Navbar collapses or adjusts for mobile
- [ ] Service cards stack vertically
- [ ] Footer displays correctly on mobile

### Cleaners Page Mobile
- [ ] Cleaner cards display in single column
- [ ] Floating filter button visible (bottom-right)
- [ ] Filter sidebar slides in smoothly
- [ ] Filters work on mobile
- [ ] Close button accessible

### Booking Flow Mobile
- [ ] Calendar usable on mobile
- [ ] Time slot selection works on touch
- [ ] Checkout form displays correctly
- [ ] Payment flow works on mobile

### Dashboard Mobile
- [ ] Admin dashboard tabs accessible
- [ ] Tables scroll horizontally
- [ ] Cards stack vertically
- [ ] Actions (buttons) accessible

### Support Page Mobile
- [ ] Ticket form displays in single column
- [ ] "My Tickets" panel stacks below form
- [ ] All fields accessible and usable

---

## 12. PERFORMANCE & ERROR HANDLING

### Loading States
- [ ] Loading spinners appear during data fetching
- [ ] Skeleton screens display (if implemented)
- [ ] No blank screens during loading

### Error Handling
- [ ] Network errors display user-friendly messages
- [ ] Firestore permission errors handled gracefully
- [ ] Invalid routes show 404 page
- [ ] Form validation errors display clearly
- [ ] Payment failures show error messages

### Performance
- [ ] Page load times acceptable (<3 seconds)
- [ ] Images load quickly
- [ ] No console errors in browser
- [ ] No memory leaks (use Chrome DevTools)

---

## 13. EDGE CASES & BOUNDARY TESTING

### Authentication Edge Cases
- [ ] Expired session redirects to login
- [ ] Multiple logins in different tabs sync correctly
- [ ] Logout in one tab affects other tabs

### Booking Edge Cases
- [ ] Cannot book in the past
- [ ] Cannot book already taken slots
- [ ] Handles timezone correctly
- [ ] Max booking duration enforced
- [ ] Min booking duration enforced

### Ticket Edge Cases
- [ ] Very long descriptions don't break layout
- [ ] Tickets without booking ID display correctly
- [ ] Empty ticket list displays correctly
- [ ] Rapid status changes don't cause race conditions
- [ ] Special characters in subject/description handled

### Data Edge Cases
- [ ] User with no bookings sees empty state
- [ ] Cleaner with no reviews shows "No reviews yet"
- [ ] Admin dashboard with no data shows zeros
- [ ] Search with no results shows "No results found"

---

## 14. SECURITY TESTING

### Firestore Rules
- [ ] User cannot read other users' data
- [ ] User cannot update other users' bookings
- [ ] User cannot delete bookings
- [ ] User cannot approve cleaners (admin only)
- [ ] User cannot access admin collections
- [ ] User can only read their own tickets
- [ ] User cannot update ticket status (admin only)

### Authentication Security
- [ ] Password requirements enforced
- [ ] Account lockout after failed attempts (if implemented)
- [ ] Session timeout works correctly
- [ ] XSS protection in place (no script injection)

### API Security
- [ ] API routes validate authentication
- [ ] API routes validate user permissions
- [ ] No sensitive data exposed in client
- [ ] Environment variables not exposed

---

## 15. BROWSER COMPATIBILITY

Test on the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 16. REGRESSION TESTING (Pre-existing Features)

### Features to Verify Still Work
- [ ] Email confirmation sent after booking
- [ ] Review request emails sent after 24 hours
- [ ] Cleaner availability cache updates
- [ ] Firebase Cloud Functions still running
- [ ] Stripe webhooks processing correctly
- [ ] Image uploads to Firebase Storage work
- [ ] Date/time formatting consistent
- [ ] Currency formatting correct (€)
- [ ] Location context persists across pages

---

## 17. DEPLOYMENT VERIFICATION

### Production Environment
- [ ] Firestore rules deployed successfully
- [ ] Environment variables set correctly in Vercel
- [ ] Firebase Functions deployed and running
- [ ] Stripe webhooks configured correctly
- [ ] Domain SSL certificate valid
- [ ] No mixed content warnings (HTTP/HTTPS)

### Post-Deployment Checks
- [ ] No console errors on production
- [ ] Analytics tracking works (if implemented)
- [ ] Error tracking works (if implemented, e.g., Sentry)
- [ ] Database queries optimized (check Firestore usage)
- [ ] Firebase storage permissions correct

---

## PRIORITY TESTING ORDER

### Critical (Must Test First)
1. Authentication (all methods)
2. Booking flow end-to-end
3. Payment processing
4. Ticket system (user submission + admin management)
5. Admin dashboard access control

### High Priority
6. Cleaner registration and approval
7. User bookings page
8. Search and filtering
9. Mobile responsiveness
10. Firestore security rules

### Medium Priority
11. Review system
12. Cleaner dashboard
13. Email notifications
14. Edge cases
15. Performance testing

### Low Priority
16. Browser compatibility
17. Regression testing
18. UI polish
19. Analytics verification

---

## TESTING NOTES

### Test Accounts Needed
- Regular user account (email + password)
- Regular user account (phone number)
- Regular user account (Google OAuth)
- Cleaner account (pending approval)
- Cleaner account (approved)
- Admin account

### Test Data Needed
- Sample bookings (past, upcoming, cancelled)
- Sample tickets (various statuses and priorities)
- Sample cleaners (various ratings and prices)
- Sample reviews

### Test Tools
- Chrome DevTools (Console, Network, Performance)
- Firebase Console (Firestore, Authentication, Storage)
- Stripe Dashboard (Test mode)
- Mobile device or browser emulator

---

## ISSUES TO DOCUMENT

If any tests fail, document:
1. Test number and description
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Browser/device used
6. Screenshots or error messages
7. Priority (Critical, High, Medium, Low)

---

## SIGN-OFF

**Tested By**: _______________
**Date**: _______________
**Tests Passed**: ____ / ____
**Critical Issues Found**: ____
**Status**: ☐ Pass ☐ Pass with minor issues ☐ Fail

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________
