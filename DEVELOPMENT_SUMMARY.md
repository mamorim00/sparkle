# Sparkle - Development Summary

**Project**: Sparkle Cleaning Marketplace
**Type**: Two-sided marketplace connecting customers with professional cleaners
**Status**: Advanced MVP (75% Complete - Near Production Ready)
**Tech Stack**: Next.js 15, Firebase, Stripe
**Last Updated**: October 14, 2025

---

## Table of Contents

1. [Implemented Features](#1-implemented-features)
2. [Future Roadmap](#2-future-roadmap)
3. [Technical Architecture](#3-technical-architecture)
4. [Design System](#4-design-system)
5. [File Structure](#5-file-structure)
6. [Development Workflow](#6-development-workflow)
7. [Known Issues & Limitations](#7-known-issues--limitations)

---

## 1. Implemented Features

### 1.1 Customer Features

#### Service Discovery & Search
- **Homepage Service Search**: Autocomplete search bar for 8 different cleaning services
  - Simple Clean (2h)
  - Deep Clean (6h)
  - Move-Out Clean (2h)
  - Office Clean (6h)
  - Window Cleaning (2h)
  - Carpet Cleaning (6h)
  - Post-Construction (2h)
  - Laundry Service (2h)
- **Service Cards**: Visual service cards with icons, descriptions, and duration
- **Service Modal**: Click any service to see available cleaners filtered by that service
- **Location-Based Filtering**: Default location set to Helsinki with popup selector
- **Cleaner Discovery Page**: Browse all approved cleaners with filtering by:
  - Service type
  - Location
  - Availability (2h or 6h slots)

#### Booking Flow
- **Real-Time Availability Calendar**:
  - Shows next 5 days with available slots
  - "Load More" button to search up to 90 days ahead
  - Slots filtered by booking conflicts and past times
  - Dynamic slot generation based on cleaner's weekly schedule and exceptions
- **Next Available Display**: Pre-calculated next available times (2h and 6h) shown on cleaner cards
- **Guest Checkout Support**: Book without creating an account
- **Secure Checkout Page**:
  - Three modes: Guest, Login, Register
  - Guest form: Name, Email, Phone (optional)
  - Order summary with all booking details
  - Stripe integration for payments
- **Booking Confirmation**: Success page after payment with receipt link
- **Booking Persistence**: Bookings saved to Firestore after successful payment

#### Authentication
- **Firebase Auth Integration**: Email/password authentication
- **Multi-Mode Login**: Login, Register, or Guest checkout
- **Password Visibility Toggle**: User-friendly password input
- **Auto-Login After Registration**: Seamless registration flow
- **Password Reset**: "Forgot Password" functionality on login page
  - Sends password reset email via Firebase Auth
  - User-friendly error and success messages

### 1.2 Cleaner Features

#### Onboarding Wizard (5 Steps)
1. **Profile Setup** (Step 1)
   - Display name/username
   - Profile photo upload
   - Phone number
   - Service selection (multi-select from 8 services)

2. **Pricing** (Step 2)
   - Set hourly rate (€)
   - Location selection

3. **Schedule Management** (Step 3)
   - Weekly recurring schedule editor
   - Day-by-day time slot configuration
   - Exception dates (mark unavailable days)

4. **Payout Setup** (Step 4)
   - Stripe Connect integration
   - Onboarding link generation
   - Bank account connection via Stripe

5. **Verification Documents** (Step 5)
   - Business ID input
   - Insurance certificate upload
   - Additional documents upload
   - Submission for admin approval

#### Cleaner Dashboard
- **Schedule Editor**: Manage weekly availability and exceptions
- **Profile Management**: View and edit cleaner profile
- **Earnings Dashboard**: View earnings by booking (working)
  - Shows earnings per job
  - Total earnings summary
  - Filters by upcoming, completed, cancelled
- **Bookings Page**: View upcoming and past bookings (FULLY IMPLEMENTED)
  - Three tabs: Upcoming, Completed, Cancelled
  - "Today's Job" highlighting
  - Customer contact information (email/phone quick actions)
  - Booking details with earnings per job

#### Approval System
- **Pending Status**: New cleaners start as "pending"
- **Admin Review Required**: Cleaners must be approved by admin to appear in search
- **Approved Status**: Only approved cleaners visible to customers

### 1.3 Admin Features

#### Admin Dashboard
- **Cleaner Approval System**:
  - View all pending cleaners
  - View cleaner profile info: username, email, business ID
  - View uploaded documents (insurance, other docs) with direct links
  - Approve cleaners (status changes to "approved")
  - Revert approved cleaners back to pending
- **Two-Tab View**: Pending cleaners and approved cleaners
- **Document Verification**: Click to view uploaded certificates and documents

### 1.4 Backend & Infrastructure

#### Firebase Cloud Functions
- **onCleanerUpdate**: Triggered on cleaner document changes
  - Calculates next available 2h and 6h slots
  - Updates cleaner document with `nextAvailable2h` and `nextAvailable6h` timestamps
  - Searches up to 90 days ahead

- **onBookingChange**: Triggered on booking creation/update/deletion
  - Recalculates cleaner availability
  - Updates cleaner document with new next available times

- **sendBookingConfirmationEmails**: Triggered on new booking creation
  - Sends styled HTML email to customer with booking details
  - Sends styled HTML email to cleaner with job details and customer contact
  - Uses Resend API for email delivery
  - Emails include: service type, date, time, duration, price, booking ID

#### API Routes (Next.js)
- **POST /api/create-checkout-session**: Creates Stripe checkout session
  - Accepts booking details, user info, total amount
  - Fetches cleaner's Stripe Connect account ID
  - Calculates 15% platform fee
  - Creates destination charge if cleaner has Stripe Connect
  - Returns checkout URL

- **GET /api/get-checkout-session**: Retrieves completed Stripe session
  - Used on success page to fetch payment details
  - Returns session data including metadata

- **POST /api/stripe/create-connect-account**: Creates Stripe Connect account for cleaner
  - Called during cleaner onboarding
  - Returns account ID

- **POST /api/stripe/create-onboarding-link**: Generates Stripe onboarding URL
  - Allows cleaner to complete bank account setup
  - Returns onboarding link

#### Firebase Firestore Collections

**cleaners**: Cleaner profiles
```typescript
{
  id: string (uid)
  name: string
  username?: string
  email: string
  photoUrl: string
  phone: string
  pricePerHour: number
  location: string
  services: string[] // service IDs
  schedule: Record<string, TimeSlot[]> // weekday: [{ start, end }]
  exceptions: Array<{ date: string, start: string, end: string }>
  status: "pending" | "approved"
  rating?: number
  businessId?: string
  insuranceCertificateUrl?: string
  otherDocsUrl?: string
  stripeAccountId?: string
  stripeConnected?: boolean
  nextAvailable2h?: Timestamp | null
  nextAvailable6h?: Timestamp | null
  createdAt: string
}
```

**bookings**: Customer bookings
```typescript
{
  id: string (Stripe session ID)
  userId: string | null // null for guest bookings
  cleanerId: string
  cleanerName: string
  customerName: string
  customerEmail: string
  serviceId?: string
  cleaningType: string
  date: string (YYYY-MM-DD)
  start: string (HH:MM)
  end: string (HH:MM)
  duration: number (hours)
  amount: number (total paid)
  platformFee: number (15%)
  cleanerAmount: number (85%)
  currency: string
  status: "confirmed" | "cancelled" | "completed"
  payoutStatus: "pending" | "paid"
  createdAt: string
}
```

**users**: Customer data (minimal)
```typescript
{
  uid: string
  email: string
  displayName?: string
  createdAt: Timestamp
  role?: "customer" | "cleaner" | "admin"
}
```

#### Firebase Storage
- **cleaner-documents/**: Insurance certificates and business documents
- **cleaner-photos/**: Cleaner profile photos

### 1.5 Payment System

#### Stripe Integration
- **Checkout Sessions**: Standard Stripe Checkout for payments
- **Stripe Connect**: Enables payouts to cleaners
- **Platform Fee Model**: 15% commission on each booking
- **Destination Charges**: If cleaner has Connect account, payment automatically splits:
  - 85% to cleaner's connected account
  - 15% platform fee to main account
- **Guest Checkout**: Supports payments without Stripe customer account

### 1.6 Email Notifications ✅ RECENTLY IMPLEMENTED

#### Implemented (via Resend)
- **Booking Confirmation to Customer**:
  - Styled HTML email with gradient header (purple/blue theme)
  - Booking details card with all information
  - Service info, date, time, duration
  - Total amount paid
  - Booking ID for reference
  - "What to expect" section with bullet points
  - Support contact information

- **Booking Confirmation to Cleaner**:
  - Green-themed HTML email (professional look)
  - Job details card with customer information
  - Customer name and contact email for communication
  - Service type, date, time, duration
  - Earnings amount prominently displayed
  - "Before the job" preparation checklist
  - Booking ID for reference

- **Review Request Emails** (Automated):
  - Sent daily via scheduled Cloud Function
  - Token-based review submission (no login required)
  - Sent 1 day after service completion

#### Email Delivery & Reliability
- **Provider**: Resend (resend.com)
- **Sender**: bookings@sparcklecleaning.com (can be customized to verified domain)
- **Triggered by**: Cloud Function on new booking creation (`sendBookingConfirmationEmails`)
- **Error Handling**: Promise.allSettled to ensure both emails attempt sending
- **Guest Email Fix**: Emails now use actual guest email from checkout form
  - Stores `guestEmail` in Stripe metadata
  - Reliable fallback mechanism
  - Fixed operator precedence bug in webhook
- **Logging**: Console logs for debugging email flow
  - Tracks email through checkout → Stripe → webhook → confirmation

---

## 2. Future Roadmap

### 2.1 Critical Missing Features (Must Have for Production)

#### Booking Management ✅ MOSTLY COMPLETE
**Status**: Core functionality implemented, notifications still needed

**✅ Implemented**:
- Customer booking list (FIXED - queries `bookings` collection correctly)
  - Displays all user bookings with full details
  - Sorted by date, status filtering
- Cleaner booking list (WORKING)
  - Three tabs: Upcoming, Completed, Cancelled
  - Shows customer contact info
  - Displays earnings per job
- Booking details page (/booking/[bookingId]) (WORKING)
  - View full booking information
  - Booking status tracking
  - Customer/cleaner contact information
  - Cancel and reschedule options
- Booking cancellation functionality (WORKING)
  - Cancel button on booking details page
  - Cancellation policy enforcement (100% refund >24h, 50% <24h)
  - Automatic refund calculation based on time until service
  - Stripe refund API integration (working)
  - Booking status update to "cancelled"
- Booking rescheduling (WORKING)
  - Select new date/time with availability validation
  - Updates booking document
  - Triggers availability recalculation via Cloud Function
  - Validates new time slot is available

**⚠️ Still Missing**:
- Cancellation/rescheduling notification emails (customer + cleaner)

#### Stripe Webhook (CRITICAL)
**Problem**: Bookings created on client-side success page (unreliable)
- Create /api/webhooks/stripe/route.ts
- Handle webhook events:
  - `checkout.session.completed`: Create booking in Firestore
  - `charge.refunded`: Update booking status, handle partial refunds
  - `payment_intent.payment_failed`: Handle failed payments
- Verify webhook signature
- Move booking creation from SuccessClient to webhook
- Add idempotency to prevent duplicate bookings

#### Enhanced Notifications ✅ PARTIALLY COMPLETE
**✅ Implemented**:
- Booking confirmation emails (customer + cleaner)
- Review request emails (automated, token-based)
- Guest email handling (fixed via Stripe metadata)

**⚠️ Still Missing**:
- Booking reminder (24h before service)
  - Scheduled Cloud Function runs daily at 10:00 AM
  - Query bookings for tomorrow
  - Send reminder to customer and cleaner
- Cancellation notifications
  - Customer cancels: notify cleaner
  - Cleaner cancels: notify customer (rare case)
- Cleaner approval/rejection emails
  - Admin approves: welcome email with next steps
  - Admin rejects: reason and reapplication instructions
- Rescheduling notifications
  - Notify both parties when booking is rescheduled
- Payment receipts (optional)
  - Detailed invoice email after booking
  - Include payment method, platform fee breakdown

### 2.2 Important Features (Should Have)

#### Rating & Review System
**Current**: Review submission exists via email link
**Missing**:
- Display reviews on cleaner profile/card
- Average rating calculation
- Star rating visualization
- Review moderation dashboard for admin
- Cleaner response to reviews
- Review authenticity verification (only allow reviews from actual bookings)

#### Cleaner Earnings Dashboard
**Missing**:
- Total earnings (lifetime, monthly, weekly)
- Pending payouts
- Completed payouts
- Payout schedule display
- Booking history with earnings per job
- Platform fee breakdown
- Tax documentation (1099 forms, etc.)

#### Enhanced Admin Dashboard
**Missing**:
- Analytics:
  - Total bookings (daily, weekly, monthly)
  - Revenue trends
  - Top cleaners by bookings/ratings
  - Customer acquisition metrics
  - Churn rate tracking
- User management:
  - Ban users
  - Delete accounts
  - View user booking history
- Dispute resolution interface
- Financial reporting:
  - Platform revenue
  - Outstanding payouts
  - Refund tracking
- Service management:
  - Add/edit/remove services
  - Update service pricing multipliers
  - Service popularity metrics

#### Search & Discovery Improvements
**Missing**:
- Price range filter (€10-€50/hour)
- Rating filter (4+ stars, 5 stars only)
- Date/time availability search ("available tomorrow at 2pm")
- Sorting options:
  - Price (low to high, high to low)
  - Rating (highest first)
  - Next available (soonest first)
  - Distance (future feature)
- Cleaner profile page (/cleaner/[id])
  - Full bio/description
  - All reviews
  - Service list
  - Photo gallery
  - Availability calendar
  - Response time
  - Booking stats (jobs completed, years of experience)

#### Mobile Responsiveness Polish
**Needs Improvement**:
- Booking calendar UX on mobile (time slot buttons too small)
- Service selection touch targets
- Cleaner dashboard schedule editor (complex on small screens)
- Modal interactions on mobile
- Navigation menu (needs hamburger menu)

#### Trust & Safety Features
**Missing**:
- Background check verification badge display
- Insurance verification badge
- Identity verification (ID upload + selfie)
- Report/flag system for inappropriate behavior
- Terms of Service acceptance tracking
- Privacy policy acceptance
- Age verification (18+)
- Account suspension system

### 2.3 Nice-to-Have Features (Future)

#### Advanced Booking Features
- Recurring bookings (weekly/bi-weekly cleaning)
- Multi-cleaner team bookings for large jobs
- Instant booking vs request-to-book options
- Booking notes/special instructions
- Add-on services (e.g., inside fridge, oven, laundry)

#### Customer Engagement
- Favorite cleaners (save to profile)
- Booking history with re-book button
- Loyalty points program
- Referral program (refer a friend, both get discount)
- Gift cards/vouchers
- First-time user discount code

#### Messaging System
- In-app chat (customer ↔ cleaner)
- Pre-booking questions
- Service-specific instructions
- Photo sharing (before/after)
- Real-time notifications

#### Marketing Features
- Blog/content pages (cleaning tips, guides)
- SEO optimization (meta tags, structured data)
- Social proof section (testimonials slider)
- Promotional codes/discount system
- Seasonal campaigns
- Email marketing integration

#### Analytics & Optimization
- Google Analytics integration
- Conversion funnel tracking
- A/B testing framework
- Heatmap tracking (user behavior)
- Performance monitoring

---

## 3. Technical Architecture

### 3.1 Frontend Framework

#### Next.js 15.5.3
- **App Router**: Using Next.js App Router architecture
- **React 19.1.0**: Latest React with Server Components
- **TypeScript 5.9.2**: Full type safety
- **Turbopack**: Fast development mode (`npm run dev --turbopack`)

#### Key React Patterns
- Client Components: Marked with `"use client"` directive
- Server Components: Default for pages
- Hooks Used:
  - `useState`: Component state management
  - `useEffect`: Side effects (data fetching, auth listeners)
  - `useCallback`: Memoized functions for performance
  - `useMemo`: Memoized values
  - `useContext`: Global state (location)
  - `useRouter`: Navigation
  - `useParams`: Dynamic route parameters
  - `useSearchParams`: URL query parameters

### 3.2 Backend & Database

#### Firebase (Backend-as-a-Service)
- **Firebase Authentication**: Email/password auth
- **Cloud Firestore**: NoSQL document database
  - Real-time data sync
  - Offline support
  - Security rules configured
- **Cloud Storage**: File uploads (photos, documents)
  - CORS configured
  - Storage rules for access control
- **Cloud Functions (Gen 2)**: Serverless backend
  - Node.js 22 runtime
  - Event-driven triggers
  - Secrets management (RESEND_API_KEY)

#### Firebase Admin SDK
- **Server-Side Operations**: Used in API routes
- **Privileged Access**: Bypasses security rules
- **Service Account**: Configured with private key
- **File**: `/src/lib/firebaseAdmin.ts`

### 3.3 Payment Processing

#### Stripe (Payment Platform)
- **API Version**: `2025-09-30.clover`
- **Stripe Checkout**: Pre-built payment UI
- **Stripe Connect**: Marketplace payouts
- **Features Used**:
  - Checkout Sessions
  - Payment Intents
  - Destination Charges
  - Application Fee
  - Customer Portal (future)

#### Payment Flow
1. User clicks "Pay Now"
2. API creates Stripe Checkout Session with metadata
3. User redirected to Stripe-hosted payment page
4. User enters card details
5. On success, redirected to /success?session_id=xxx
6. Success page fetches session details
7. Booking created in Firestore
8. Cloud Function sends confirmation emails
9. (Future) Webhook creates booking server-side for reliability

### 3.4 Email Service

#### Resend
- **Provider**: resend.com
- **API Key**: Stored as Firebase secret
- **Rate Limits**: Free tier (100/day, 3,000/month)
- **Email Types**: Transactional emails
- **Templates**: HTML emails with inline CSS
- **Sender**: bookings@sparcklecleaning.com (customizable)

### 3.5 State Management

#### Local State (useState)
- Component-level state for UI
- Form inputs
- Loading states
- Error messages

#### Context API
- **LocationContext**: Global location selection
  - Default: Helsinki
  - Provider wraps entire app
  - Custom hook: `useLocation()`
  - File: `/src/context/LocationContext.tsx`

#### Firebase Realtime Listeners
- **Auth State**: `onAuthStateChanged()`
- **Firestore Snapshots**: Real-time data updates (not heavily used currently)

#### Session Storage
- **Cleaner Setup Wizard**: Persists form data between steps
  - Prevents data loss on page refresh
  - Cleared on completion

### 3.6 File Upload

#### Firebase Storage
- **Upload Flow**:
  1. User selects file
  2. File uploaded to Storage
  3. Download URL returned
  4. URL saved to Firestore document
- **Used For**:
  - Cleaner profile photos
  - Insurance certificates
  - Business documents

### 3.7 API Structure

#### Next.js API Routes (App Router)
```
/src/app/api/
├── create-checkout-session/route.ts (POST)
├── get-checkout-session/route.ts (GET)
└── stripe/
    ├── create-connect-account/route.ts (POST)
    └── create-onboarding-link/route.ts (POST)
```

**Route Handlers**:
- Export `POST`, `GET`, etc. as async functions
- Receive `NextRequest`, return `NextResponse`
- Access request body: `await req.json()`
- Return JSON: `NextResponse.json({ data })`

### 3.8 Routing

#### File-Based Routing (App Router)
```
/src/app/
├── page.tsx                    → /
├── about/page.tsx              → /about
├── admin/dashboard/page.tsx    → /admin/dashboard
├── auth/login/page.tsx         → /auth/login
├── book/[cleanerId]/page.tsx   → /book/:cleanerId
├── checkout/page.tsx           → /checkout
├── cleaner/
│   ├── bookings/page.tsx       → /cleaner/bookings
│   ├── earnings/page.tsx       → /cleaner/earnings
│   ├── profile/page.tsx        → /cleaner/profile
│   └── setup/page.tsx          → /cleaner/setup
├── cleaner-dashboard/page.tsx  → /cleaner-dashboard
├── cleaners/page.tsx           → /cleaners
├── privacy/page.tsx            → /privacy
├── success/page.tsx            → /success
├── terms/page.tsx              → /terms
└── user/bookings/page.tsx      → /user/bookings
```

#### Dynamic Routes
- `[cleanerId]`: Dynamic segment in URL
- `useParams()`: Access route parameters
- `searchParams`: URL query strings

### 3.9 Styling

#### Tailwind CSS 3.4.17
- **Utility-First**: No custom CSS files (minimal)
- **JIT Mode**: Just-In-Time compilation
- **PostCSS**: Processing pipeline
- **Configuration**: Custom theme in `tailwind.config.js`

### 3.10 Development Tools

#### ESLint 9
- **Config**: `eslint.config.mjs`
- **Next.js Config**: `eslint-config-next`
- **TypeScript Support**: `@typescript-eslint/parser`

#### TypeScript
- **Strict Mode**: Enabled
- **Config**: `tsconfig.json`
- **Type Safety**: Interfaces for all data structures

---

## 4. Design System

### 4.1 Color Palette

#### Primary Colors (Grays/Blues)
```javascript
// Tailwind Config Colors
primary: '#f8fafc'        // slate-50 - ultra light background
'primary-light': '#f1f5f9' // slate-100 - card backgrounds
'primary-dark': '#334155'  // slate-700 - dark headings

accent: '#3b82f6'          // blue-500 - primary buttons
'accent-dark': '#1e40af'   // blue-800 - button hover (darker)
'accent-light': '#60a5fa'  // blue-400 - lighter accents

highlight: '#fbbf24'       // amber-400 - CTAs/badges
neutral: '#1e293b'         // slate-800 - body text
'neutral-light': '#64748b' // slate-500 - secondary text
```

#### Background Colors (globals.css)
```css
--background: #a3bcd0      /* Muted blue (light mode) */
--foreground: #171717      /* Almost black text */

/* Dark mode */
--background: #2c3e50      /* Darker muted blue */
--foreground: #ededed      /* Off-white text */
```

#### Semantic Colors
- **Success/Approved**: Green-600 (#10b981)
- **Warning/Pending**: Yellow-500 (#f59e0b)
- **Error/Danger**: Red-600 (#dc2626)
- **Info**: Blue-500 (#3b82f6)

### 4.2 Typography

#### Fonts
- **Primary**: Arial, Helvetica, sans-serif (default body)
- **Headings**: Inherited, font-weight varies
- **Next.js Fonts**: Geist Sans, Geist Mono (configured but not heavily used)

#### Font Sizes (Tailwind Classes)
- **text-xs**: 0.75rem (12px) - Small labels
- **text-sm**: 0.875rem (14px) - Secondary text
- **text-base**: 1rem (16px) - Body text
- **text-lg**: 1.125rem (18px) - Large body
- **text-xl**: 1.25rem (20px) - Subheadings
- **text-2xl**: 1.5rem (24px) - Section titles
- **text-3xl**: 1.875rem (30px) - Page titles
- **text-4xl**: 2.25rem (36px) - Hero text
- **text-5xl**: 3rem (48px) - Large hero
- **text-7xl**: 4.5rem (72px) - Homepage hero

#### Font Weights
- **font-normal**: 400 - Body text
- **font-medium**: 500 - Labels, emphasis
- **font-semibold**: 600 - Subheadings, buttons
- **font-bold**: 700 - Headings, strong emphasis

### 4.3 Spacing Scale

#### Standard Spacing (Tailwind)
- **Padding/Margin**: `p-1` to `p-96` (0.25rem to 24rem)
- **Common Values**:
  - `p-4`: 1rem (16px) - Default padding
  - `p-6`: 1.5rem (24px) - Card padding
  - `gap-4`: 1rem (16px) - Flex/grid gaps
  - `space-y-4`: 1rem (16px) - Vertical spacing between children

#### Layout Spacing
- **Container**: `max-w-7xl mx-auto px-6` (standard page container)
- **Section Padding**: `py-20` (5rem / 80px) - Between sections
- **Card Padding**: `p-6` or `p-5` (1.5rem / 20px)

### 4.4 Border Radius

#### Rounded Corners
- **rounded**: 0.25rem (4px) - Default
- **rounded-lg**: 0.5rem (8px) - Buttons, inputs
- **rounded-xl**: 0.75rem (12px) - Cards
- **rounded-2xl**: 1rem (16px) - Modals, large cards
- **rounded-full**: 9999px - Circles, pills

### 4.5 Shadows

#### Box Shadows (Tailwind)
- **shadow-sm**: Subtle shadow for cards
- **shadow-md**: Medium shadow for cards
- **shadow-lg**: Large shadow for elevated cards
- **shadow-xl**: Extra large for modals
- **shadow-2xl**: Dramatic shadow for hero sections

### 4.6 Component Patterns

#### Buttons

**Primary Button** (Blue):
```jsx
className="bg-blue-600 text-white px-6 py-3 rounded-lg
           font-semibold hover:bg-blue-700 active:bg-blue-800
           transition-colors duration-200"
```

**Success Button** (Green):
```jsx
className="bg-green-600 text-white px-4 py-2 rounded
           hover:bg-green-700"
```

**Danger Button** (Red):
```jsx
className="bg-red-500 text-white px-4 py-2 rounded
           hover:bg-red-600"
```

**Disabled State**:
```jsx
className="disabled:bg-gray-400 disabled:cursor-not-allowed"
```

#### Cards

**Standard Card**:
```jsx
className="bg-white rounded-lg shadow-sm hover:shadow-lg
           transition-shadow duration-300 border border-gray-200 p-5"
```

**Highlighted Card** (Top Choice):
```jsx
className="border-green-500 bg-green-50 rounded-xl p-5"
```

#### Inputs

**Text Input**:
```jsx
className="w-full px-4 py-3 border border-gray-300 rounded-lg
           focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
```

**Input with Icon** (Left):
```jsx
<div className="relative">
  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
  <input className="w-full pl-10 pr-4 py-3 ..." />
</div>
```

#### Modals

**Modal Overlay**:
```jsx
className="fixed inset-0 bg-black bg-opacity-50 z-50
           flex items-center justify-center p-4"
```

**Modal Content**:
```jsx
className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh]
           overflow-hidden flex flex-col shadow-2xl"
```

#### Badges

**Verified Badge**:
```jsx
className="flex items-center gap-1 text-green-600 text-xs
           font-medium bg-green-50 px-2 py-1 rounded-full"
```

**Status Badge** (Pending):
```jsx
className="text-yellow-600 text-xs bg-yellow-50 px-2 py-1 rounded-full"
```

#### Loading States

**Spinner**:
```jsx
<div className="inline-block animate-spin rounded-full h-12 w-12
                border-4 border-gray-200 border-t-indigo-600"></div>
```

**Loading Text**:
```jsx
<p className="text-gray-600 mt-4">Loading...</p>
```

### 4.7 Icons

#### Icon Libraries
- **Lucide React** (v0.544.0): Primary icon library
  - Used in checkout page (Zap, Lock, User, Mail, Phone, Eye, EyeOff)
  - Tree-shakable, modern React icons

- **React Icons** (v5.5.0): Additional icons
  - Used throughout for various UI elements

- **Custom SVG Icons**: Inline SVGs for service icons
  - Cleaning-specific icons (broom, spray bottle, etc.)

#### Icon Usage Pattern
```jsx
import { Zap } from "lucide-react";

<Zap className="w-6 h-6 text-indigo-600" />
```

### 4.8 Responsive Design

#### Breakpoints (Tailwind Default)
- **sm**: 640px - Small devices
- **md**: 768px - Medium devices (tablets)
- **lg**: 1024px - Large devices (laptops)
- **xl**: 1280px - Extra large (desktops)
- **2xl**: 1536px - Ultra wide

#### Responsive Patterns
```jsx
// Grid: 1 col mobile, 2 col tablet, 3 col desktop
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"

// Text: Smaller on mobile, larger on desktop
className="text-5xl md:text-7xl"

// Padding: Less on mobile, more on desktop
className="py-16 md:py-28"
```

### 4.9 Animation & Transitions

#### Hover Effects
```jsx
className="transition-all duration-300 hover:shadow-xl
           hover:-translate-y-1"
```

#### Loading Animations
```jsx
className="animate-spin" // For spinners
```

#### Transition Classes
- **transition-colors**: Color transitions
- **transition-all**: All properties
- **duration-200**: 200ms duration
- **duration-300**: 300ms duration

---

## 5. File Structure

### 5.1 Project Root
```
/sparkle/
├── .firebase/              # Firebase deployment cache
├── .next/                  # Next.js build output (gitignored)
├── .vercel/                # Vercel deployment config
├── functions/              # Firebase Cloud Functions
├── node_modules/           # Dependencies
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── src/                    # Source code (main app)
├── .env.local              # Environment variables (gitignored)
├── .firebaserc             # Firebase project config
├── .gitignore
├── firebase.json           # Firebase config
├── firestore.indexes.json  # Firestore indexes
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS config
├── tsconfig.json           # TypeScript config
├── FEATURE_GAPS.md         # Feature planning doc
├── DEPLOYMENT_GUIDE.md     # Deployment instructions
├── EMAIL_SETUP_GUIDE.md    # Email setup guide
├── STRIPE_CONNECT_PLAN.md  # Stripe Connect plan
└── README.md               # Project README
```

### 5.2 Source Directory (/src)
```
/src/
├── app/                    # Next.js App Router (pages & API routes)
├── components/             # Reusable React components
├── context/                # React Context providers
├── lib/                    # Utility libraries & config
└── styles/                 # Global CSS (minimal)
```

### 5.3 App Directory (/src/app)
```
/src/app/
├── layout.tsx              # Root layout (Navbar, LocationProvider)
├── page.tsx                # Homepage (service search, featured cleaners)
├── globals.css             # Global CSS variables
│
├── about/
│   └── page.tsx            # About page
│
├── admin/
│   └── dashboard/
│       └── page.tsx        # Admin dashboard (cleaner approval)
│
├── api/                    # API routes
│   ├── create-checkout-session/
│   │   └── route.ts        # POST - Create Stripe session
│   ├── get-checkout-session/
│   │   └── route.ts        # GET - Fetch Stripe session
│   └── stripe/
│       ├── create-connect-account/
│       │   └── route.ts    # POST - Create Stripe Connect account
│       └── create-onboarding-link/
│           └── route.ts    # POST - Generate onboarding link
│
├── auth/
│   └── login/
│       └── page.tsx        # Login page
│
├── book/
│   └── [cleanerId]/
│       └── page.tsx        # Booking page (calendar, slots)
│
├── checkout/
│   ├── page.tsx            # Checkout wrapper
│   └── CheckoutClient.tsx  # Checkout form (guest/login/register)
│
├── cleaner/                # Cleaner-specific routes
│   ├── bookings/
│   │   └── page.tsx        # Cleaner's bookings list
│   ├── earnings/
│   │   └── page.tsx        # Earnings dashboard
│   ├── profile/
│   │   └── page.tsx        # Cleaner profile page
│   └── setup/              # Onboarding wizard
│       ├── page.tsx        # Setup wizard controller
│       ├── steps/
│       │   ├── Step1Profile.tsx     # Profile info & services
│       │   ├── Step2Price.tsx       # Pricing & location
│       │   ├── Step3Schedule.tsx    # Weekly schedule
│       │   ├── Step4Payout.tsx      # Stripe Connect
│       │   └── Step4Verification.tsx # Documents
│       └── stripe/
│           ├── success/
│           │   └── page.tsx  # Stripe onboarding success
│           └── refresh/
│               └── page.tsx  # Stripe onboarding refresh
│
├── cleaner-dashboard/
│   └── page.tsx            # Cleaner dashboard (schedule editor)
│
├── cleaners/
│   ├── page.tsx            # Browse all cleaners (wrapper)
│   └── CleanersClient.tsx  # Cleaners list with filters
│
├── privacy/
│   └── page.tsx            # Privacy policy
│
├── success/
│   ├── page.tsx            # Success page wrapper
│   └── SuccessClient.tsx   # Payment success (creates booking)
│
├── terms/
│   └── page.tsx            # Terms of service
│
└── user/
    └── bookings/
        └── page.tsx        # Customer's bookings list
```

### 5.4 Components (/src/components)
```
/src/components/
├── CleanerAvailability.tsx    # Schedule editor component
├── CleanerCard.tsx             # Cleaner card with booking button
├── ServiceBookingModal.tsx     # Modal to select cleaner for service
├── Navbar.tsx                  # Top navigation bar
└── Footer.tsx                  # Footer (if exists)
```

### 5.5 Context (/src/context)
```
/src/context/
└── LocationContext.tsx         # Global location state
```

### 5.6 Library (/src/lib)
```
/src/lib/
├── firebase.ts              # Firebase client SDK init
├── firebaseAdmin.ts         # Firebase Admin SDK init
├── constants.ts             # Services, multipliers, constants
└── slots.tsx                # Slot generation utilities (if used)
```

### 5.7 Firebase Functions (/functions)
```
/functions/
├── src/
│   └── index.ts             # Cloud Functions (availability, emails)
├── lib/                     # Compiled JS (gitignored)
├── package.json             # Functions dependencies
└── tsconfig.json            # TypeScript config
```

### 5.8 Public Assets (/public)
```
/public/
├── images/
│   ├── default-cleaner.png  # Default cleaner avatar
│   ├── deep-clean.jpg       # Service images
│   ├── simple.jpg
│   └── move-out-clean.jpg
├── file.svg                 # Icons
├── globe.svg
├── next.svg
├── vercel.svg
├── window.svg
├── index.html               # Firebase Hosting (optional)
└── 404.html                 # 404 page
```

### 5.9 Key Files to Know

#### Configuration Files
- **next.config.ts**: Next.js configuration (image domains, etc.)
- **tailwind.config.js**: Design system colors, theme extensions
- **tsconfig.json**: TypeScript compiler options
- **firebase.json**: Firebase hosting/functions config
- **firestore.rules**: Database security rules
- **storage.rules**: File upload security rules

#### Important Source Files
- **src/app/layout.tsx**: Root layout (Navbar, providers)
- **src/app/page.tsx**: Homepage (main entry point)
- **src/lib/constants.ts**: Service definitions (critical for consistency)
- **src/lib/firebase.ts**: Firebase client initialization
- **src/lib/firebaseAdmin.ts**: Firebase Admin (API routes)

#### Business Logic Files
- **src/app/book/[cleanerId]/page.tsx**: Core booking logic (slot generation, conflicts)
- **src/app/checkout/CheckoutClient.tsx**: Payment flow
- **src/app/success/SuccessClient.tsx**: Booking creation after payment
- **functions/src/index.ts**: Availability calculation, email sending

#### Component Files
- **src/components/CleanerCard.tsx**: Cleaner display card (used everywhere)
- **src/components/ServiceBookingModal.tsx**: Service selection modal
- **src/components/CleanerAvailability.tsx**: Schedule editor (complex)

---

## 6. Development Workflow

### 6.1 Getting Started

#### Prerequisites
- Node.js 22+ (required for Firebase Functions)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Vercel CLI (optional, for deployment)
- Stripe account (test mode)
- Resend account (email API)
- Firebase project created

#### Initial Setup
```bash
# Clone repository
git clone [repo-url]
cd sparkle

# Install dependencies
npm install

# Install Functions dependencies
cd functions
npm install
cd ..

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Login to Firebase
firebase login

# Select Firebase project
firebase use sparkle-86740  # Or your project ID
```

### 6.2 Environment Variables

#### Required Variables (.env.local)
```bash
# Firebase (Client SDK)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Firebase Admin (Server-Side)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### Firebase Secrets (Cloud Functions)
```bash
# Set Resend API key
firebase functions:secrets:set RESEND_API_KEY
# Enter your Resend API key when prompted
```

### 6.3 Development Commands

#### Start Development Server
```bash
npm run dev
# Server runs on http://localhost:3000
# With Turbopack for faster builds
```

#### Build for Production
```bash
npm run build
# Creates optimized production build in .next/
```

#### Start Production Server Locally
```bash
npm run start
# Must run 'npm run build' first
```

#### Lint Code
```bash
npm run lint
# Runs ESLint on all files
```

### 6.4 Firebase Functions Development

#### Build Functions
```bash
cd functions
npm run build
# Compiles TypeScript to JavaScript in lib/
```

#### Watch Mode (Auto-compile)
```bash
cd functions
npm run build:watch
# Watches for changes and recompiles
```

#### Serve Functions Locally (Emulator)
```bash
cd functions
npm run serve
# Starts Firebase emulators
# Functions run on http://localhost:5001
```

#### Deploy Functions
```bash
# From project root
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:sendBookingConfirmationEmails

# View logs
firebase functions:log
firebase functions:log --only sendBookingConfirmationEmails
```

### 6.5 Deployment

#### Deploy to Vercel (Frontend)
```bash
# Option 1: Via Vercel CLI
vercel
vercel --prod

# Option 2: Via GitHub integration
# Push to main branch → auto-deploys
git push origin main
```

#### Deploy to Firebase Hosting (Alternative)
```bash
npm run build
firebase deploy --only hosting
```

#### Deploy Everything (Firebase)
```bash
firebase deploy
# Deploys functions, hosting, firestore rules, storage rules
```

### 6.6 Database Management

#### Firestore Security Rules
```bash
# Deploy rules
firebase deploy --only firestore:rules

# Test rules in Firebase Console
# https://console.firebase.google.com/project/[project-id]/firestore/rules
```

#### Create Indexes
```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Or create manually in Firebase Console when errors occur
```

#### Firestore Console
- View data: https://console.firebase.google.com/project/[project-id]/firestore
- Add/edit documents manually
- Export data for backups

### 6.7 Testing Locally

#### Test Booking Flow
1. Start dev server: `npm run dev`
2. Go to http://localhost:3000
3. Select a service
4. Choose a cleaner
5. Select a time slot
6. Proceed to checkout
7. Use Stripe test card: `4242 4242 4242 4242`
8. Expiry: Any future date
9. CVC: Any 3 digits
10. Check Firestore for new booking
11. Check Resend dashboard for emails

#### Test Cleaner Onboarding
1. Go to http://localhost:3000/cleaner/setup
2. Complete all 5 steps
3. Upload documents to Firebase Storage
4. Check Firestore for cleaner document (status: "pending")
5. Go to http://localhost:3000/admin/dashboard
6. Approve cleaner
7. Cleaner now appears in search

### 6.8 Debugging

#### View Logs
```bash
# Next.js dev server logs
# Shown in terminal where 'npm run dev' is running

# Firebase Functions logs
firebase functions:log

# Follow logs in real-time
firebase functions:log --only sendBookingConfirmationEmails

# Browser console
# Open DevTools → Console tab
```

#### Common Issues

**Issue**: Firebase Admin error in API routes
- **Solution**: Check FIREBASE_PRIVATE_KEY is properly formatted with \n
- Verify FIREBASE_CLIENT_EMAIL is correct

**Issue**: Cleaner doesn't appear in search
- **Solution**: Check cleaner status is "approved" in Firestore
- Verify cleaner has at least one service in services array
- Check location matches selected location

**Issue**: Booking not created after payment
- **Solution**: Check Stripe session metadata
- Verify cleanerId is present
- Check browser console for errors
- Look at success page network requests

**Issue**: Emails not sending
- **Solution**: Verify RESEND_API_KEY is set in Firebase secrets
- Check Resend dashboard for errors
- Verify sender email is bookings@sparcklecleaning.com or verified domain
- Check Cloud Functions logs for errors

### 6.9 Git Workflow

#### Branching Strategy
```bash
# Main branch for production
git checkout main

# Create feature branch
git checkout -b feature/booking-cancellation

# Make changes, commit
git add .
git commit -m "Add booking cancellation feature"

# Push to remote
git push origin feature/booking-cancellation

# Create pull request on GitHub
# After review, merge to main
```

#### Commit Message Guidelines
- Use clear, descriptive messages
- Start with verb: "Add", "Fix", "Update", "Remove"
- Examples:
  - "Add booking cancellation feature"
  - "Fix cleaner availability calculation"
  - "Update checkout page UI"

### 6.10 Code Quality

#### TypeScript
- Always define interfaces for data structures
- Use strict type checking
- Avoid `any` type (use `unknown` if needed)
- Example:
```typescript
interface Booking {
  id: string;
  userId: string | null;
  cleanerId: string;
  date: string;
  // ... other fields
}
```

#### React Best Practices
- Use functional components with hooks
- Extract complex logic to custom hooks
- Memoize expensive calculations with `useMemo`
- Memoize callbacks with `useCallback`
- Use `useEffect` dependencies correctly

#### Code Organization
- Keep components small and focused
- Extract reusable logic to separate functions
- Use constants from `/src/lib/constants.ts`
- Don't duplicate service definitions

---

## 7. Known Issues & Limitations

### 7.1 Critical Issues

#### Booking Creation Reliability (PARTIAL - NEEDS TESTING)
- **Status**: Webhook exists but reliability untested
- **Issue**: Bookings created on both client-side and webhook (redundancy for safety)
- **Current**: Success page creates booking + webhook also creates booking
- **Risk**: Potential duplicate bookings (though session ID used as document ID)
- **Solution Required**: Test webhook reliability, potentially remove client-side creation
- **Priority**: MEDIUM (working but needs optimization)

#### ~~Customer Booking List Broken~~ ✅ FIXED
- **Status**: RESOLVED
- **Fixed**: Now queries `bookings` collection correctly
- **Implementation**: Queries by `userId`, ordered by date
- **File**: `/src/app/user/bookings/page.tsx`
- **Working**: Customers can now view all their bookings

### 7.2 Missing Core Features

#### ~~No Booking Cancellation~~ ✅ IMPLEMENTED
- **Status**: COMPLETE
- **Implemented**:
  - Cancellation UI (button on booking details page)
  - Cancellation policy (100% refund >24h, 50% refund <24h)
  - Stripe refund API integration (working)
  - Booking status updates
  - Refund tracking in Firestore
- **File**: `/src/app/api/bookings/cancel/route.ts`
- **Still Missing**: Email notifications for cancellations

#### ~~No Booking Management for Cleaners~~ ✅ IMPLEMENTED
- **Status**: FULLY WORKING
- **Implemented**:
  - Cleaner bookings list with three tabs
  - Upcoming jobs with "Today's Job" highlighting
  - Completed jobs history
  - Cancelled bookings tracking
  - Customer contact information
  - Earnings display per booking
- **File**: `/src/app/cleaner/bookings/page.tsx`

#### ~~No Webhook Implementation~~ ✅ PARTIALLY IMPLEMENTED
- **Status**: EXISTS but needs thorough testing
- **Implemented**: `/src/app/api/webhooks/stripe/route.ts`
- **Handles**: `checkout.session.completed` event
- **Features**: Signature verification, booking creation
- **Note**: Currently redundant with client-side creation for safety
- **Priority**: Test reliability and optimize

### 7.3 User Experience Issues

#### Mobile Booking Calendar
- **Issue**: Time slot buttons too small on mobile
- **Impact**: Difficult to tap correct slot on small screens
- **Solution Needed**: Larger touch targets, better spacing
- **Priority**: MEDIUM

#### ~~No Booking Details Page~~ ✅ IMPLEMENTED
- **Status**: WORKING
- **Implemented**: `/src/app/booking/[bookingId]/page.tsx`
- **Features**:
  - View full booking information
  - Cancel booking button
  - Reschedule booking button
  - Customer/cleaner contact information
  - Booking status display
  - Refund information (if cancelled)
- **Additional Page**: `/src/app/booking/[bookingId]/reschedule/page.tsx`
  - Select new date/time
  - Availability validation
  - Updates booking and triggers recalculation

#### Navigation Menu on Mobile
- **Issue**: No hamburger menu, all links in header
- **Impact**: Cluttered navigation on small screens
- **Priority**: LOW

### 7.4 Admin Dashboard Limitations

#### No Analytics
- **Issue**: Admin can't see business metrics
- **Missing**:
  - Total bookings
  - Revenue
  - Growth trends
  - Top cleaners
- **Priority**: MEDIUM

#### No User Management
- **Issue**: Can't ban or delete users
- **Impact**: No way to handle problematic users
- **Priority**: LOW

#### No Dispute Resolution
- **Issue**: No interface for handling customer complaints
- **Impact**: Requires manual intervention outside app
- **Priority**: MEDIUM

### 7.5 Technical Debt

#### No Automated Tests
- **Issue**: No unit tests, integration tests, or E2E tests
- **Impact**: Risk of regressions when adding features
- **Recommended**: Jest, React Testing Library, Cypress
- **Priority**: MEDIUM

#### No Error Boundaries
- **Issue**: Errors can crash entire app
- **Impact**: Poor error handling, bad UX
- **Solution**: Add React Error Boundaries
- **Priority**: LOW

#### No Monitoring/Logging
- **Issue**: No centralized error logging
- **Missing**: Sentry, LogRocket, or similar
- **Impact**: Hard to debug production issues
- **Priority**: MEDIUM

#### TypeScript strictness
- **Issue**: Some `any` types still exist
- **Impact**: Reduced type safety
- **Solution**: Gradual refactor to strict types
- **Priority**: LOW

### 7.6 Scalability Concerns

#### Availability Calculation Performance
- **Issue**: Cloud Functions search up to 90 days for each cleaner update
- **Impact**: Could be slow with many bookings
- **Solution**: Cache calculations, optimize queries
- **Priority**: LOW (not an issue at current scale)

#### No Database Indexes
- **Issue**: Some queries might be slow without proper indexes
- **Impact**: Slower page loads as data grows
- **Solution**: Add Firestore composite indexes
- **Priority**: MEDIUM

#### No Image Optimization
- **Issue**: Cleaner photos uploaded directly without optimization
- **Impact**: Slow page loads, higher storage costs
- **Solution**: Use Next.js Image Optimization or cloud service
- **Priority**: LOW

### 7.7 Security Concerns

#### No Rate Limiting
- **Issue**: API routes have no rate limiting
- **Impact**: Vulnerable to abuse
- **Solution**: Add rate limiting middleware
- **Priority**: MEDIUM

#### Firestore Security Rules Not Strict
- **Issue**: Rules might allow unintended access
- **Impact**: Potential data leakage
- **Solution**: Review and tighten security rules
- **Priority**: HIGH

#### No Email Verification
- **Issue**: Users can sign up with any email
- **Impact**: Fake accounts, spam
- **Solution**: Add email verification step
- **Priority**: MEDIUM

### 7.8 Feature Gaps Summary

#### ~~Missing~~ Customer Features → ✅ MOSTLY COMPLETE
- ✅ Booking cancellation (DONE)
- ✅ Booking rescheduling (DONE)
- ✅ View booking details (DONE)
- ✅ Booking history (DONE)
- ⚠️ Rate & review cleaners (submission works, display missing)
- ❌ Favorite cleaners
- ❌ Booking notes/special instructions

#### ~~Missing~~ Cleaner Features → ✅ MOSTLY COMPLETE
- ✅ View bookings list (WORKING)
- ✅ Earnings dashboard (WORKING - shows real data)
- ❌ Mark job as complete (auto-handled by status)
- ❌ Payout history (Stripe Connect needed)
- ❌ Customer messaging system

#### Missing Admin Features → ⚠️ BASIC ONLY
- ✅ Cleaner approval system (WORKING)
- ❌ Analytics dashboard
- ❌ User management
- ❌ Financial reporting
- ❌ Dispute resolution
- ❌ Service management

#### ~~Missing~~ Notifications → ✅ PARTIALLY COMPLETE
- ✅ Booking confirmation emails (DONE)
- ✅ Review request emails (DONE)
- ❌ Booking reminders (24h before)
- ❌ Cancellation emails
- ❌ Rescheduling emails
- ❌ Cleaner approval/rejection emails
- ❌ Payment receipt emails (optional)

---

## 8. Quick Reference

### 8.1 Important URLs

#### Development
- Homepage: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin/dashboard
- Cleaner Setup: http://localhost:3000/cleaner/setup
- Cleaner Dashboard: http://localhost:3000/cleaner-dashboard
- Browse Cleaners: http://localhost:3000/cleaners

#### External Services
- Firebase Console: https://console.firebase.google.com/project/sparkle-86740
- Stripe Dashboard: https://dashboard.stripe.com/test/dashboard
- Resend Dashboard: https://resend.com/emails
- Vercel Dashboard: https://vercel.com/[your-username]/sparkle

### 8.2 Service IDs (from constants.ts)

Use these IDs consistently throughout the app:
- `simple-clean` - Simple Clean (2h)
- `deep-clean` - Deep Clean (6h)
- `move-out-clean` - Move-Out Clean (2h)
- `office-clean` - Office Clean (6h)
- `window-cleaning` - Window Cleaning (2h)
- `carpet-cleaning` - Carpet Cleaning (6h)
- `post-construction` - Post-Construction (2h)
- `laundry-service` - Laundry Service (2h)

### 8.3 User Roles

- **customer**: Regular user who books cleaning services
- **cleaner**: Service provider (must be approved by admin)
- **admin**: Platform administrator (can approve cleaners)

*Note: Role system not fully implemented - relies on accessing specific routes*

### 8.4 Stripe Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Expired Card**: `4000 0000 0000 0069`

*Always use any future expiry date and any 3-digit CVC*

### 8.5 Firebase Collections

- **cleaners**: Cleaner profiles and settings
- **bookings**: Customer bookings
- **users**: Customer user data (minimal)
- **reviews**: Review data (structure not fully defined)

### 8.6 Common Firestore Queries

**Get approved cleaners in location**:
```typescript
const q = query(
  collection(db, "cleaners"),
  where("status", "==", "approved"),
  where("location", "==", "Helsinki")
);
```

**Get user's bookings**:
```typescript
const q = query(
  collection(db, "bookings"),
  where("userId", "==", userId),
  orderBy("date", "desc")
);
```

**Get cleaner's bookings**:
```typescript
const q = query(
  collection(db, "bookings"),
  where("cleanerId", "==", cleanerId),
  orderBy("date", "asc")
);
```

---

## 9. Getting Help

### 9.1 Documentation Links

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **Firebase**: https://firebase.google.com/docs
- **Firestore**: https://firebase.google.com/docs/firestore
- **Cloud Functions**: https://firebase.google.com/docs/functions
- **Stripe**: https://docs.stripe.com
- **Stripe Connect**: https://docs.stripe.com/connect
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Resend**: https://resend.com/docs

### 9.2 Project Documentation

- **FEATURE_GAPS.md**: Detailed feature gap analysis and roadmap
- **DEPLOYMENT_GUIDE.md**: Step-by-step deployment instructions
- **EMAIL_SETUP_GUIDE.md**: Email configuration guide
- **STRIPE_CONNECT_PLAN.md**: Stripe Connect implementation plan
- **README.md**: Basic project information

### 9.3 Contact & Support

For questions about this codebase, refer to:
1. Code comments in complex functions
2. TypeScript interfaces for data structures
3. Constants file (`/src/lib/constants.ts`) for service definitions
4. This document for architecture overview

---

## Summary

**Sparkle** is a two-sided marketplace connecting customers with professional cleaners. The app is now **75% complete** with substantial recent progress on core booking management and email systems.

**Key Strengths**:
- ✅ Complete booking management (view, cancel, reschedule)
- ✅ Real-time availability calculation
- ✅ Automated email notifications (confirmations, reviews)
- ✅ Multi-step cleaner onboarding
- ✅ Stripe Connect integration
- ✅ Professional design system with polished UI
- ✅ Type-safe with TypeScript
- ✅ Password reset functionality
- ✅ Help Center with FAQs

**Recent Major Progress** (Last 2 Weeks):
- ✅ Fixed customer booking list
- ✅ Implemented cleaner bookings dashboard
- ✅ Added booking cancellation with Stripe refunds
- ✅ Added booking rescheduling with validation
- ✅ Implemented booking confirmation emails
- ✅ Fixed guest email handling (Stripe metadata)
- ✅ Added password reset
- ✅ Created Help Center page
- ✅ Comprehensive testing checklist

**Remaining Critical Gaps**:
- ❌ Booking reminder emails (24h before service)
- ❌ Cancellation/rescheduling notification emails
- ⚠️ Review display on cleaner profiles (submission works)
- ⚠️ Stripe webhook testing and optimization
- ❌ Enhanced cleaner profile pages
- ❌ Advanced search filters

**Next Steps**: Focus on remaining notification emails and review display to reach production readiness (estimated 1-2 weeks).

**Production Readiness**: 75% complete → 85-90% needed for confident launch

---

**Document Version**: 2.0
**Last Updated**: October 14, 2025
**Maintained By**: Development Team
