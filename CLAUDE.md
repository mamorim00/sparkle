# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sparkle is a cleaning service marketplace built with Next.js 15, Firebase, and Stripe. It connects customers with professional cleaners, handles bookings, payments, and automated review requests.

**Deployment**: Vercel (Next.js app) + Firebase Functions (backend tasks)

## Commands

### Development
```bash
npm run dev          # Start Next.js dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Firebase Functions
```bash
cd functions
npm install                              # Install function dependencies
firebase deploy --only functions         # Deploy all functions
firebase functions:log                   # View function logs
firebase functions:secrets:set KEY_NAME  # Set secret environment variables
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Maps**: Mapbox GL JS (via react-map-gl)
- **Auth**: Firebase Authentication
- **Database**: Firestore (europe-north2)
- **Storage**: Firebase Storage
- **Payments**: Stripe Checkout
- **Email**: Resend (via Firebase Functions)
- **Hosting**: Vercel (Next.js) + Firebase Functions (scheduled tasks)

### Key Architectural Patterns

#### Hybrid Firebase Architecture
The app uses **two Firebase implementations**:

1. **Client-side Firebase** (`src/lib/firebase.ts`):
   - Marked with `"use client"`
   - Used in React components for real-time data
   - Auth, Firestore queries, Storage

2. **Server-side Firebase Admin** (API routes + Functions):
   - Used in `/api/*` routes and `functions/src/index.ts`
   - Full admin privileges
   - Requires service account credentials

#### Dual Backend System
- **Next.js API Routes** (`src/app/api/*/route.ts`): Handle Stripe checkout, review submissions, validation
- **Firebase Cloud Functions** (`functions/src/index.ts`): Background jobs (scheduled review emails, cleaner availability updates)

### Data Model (Firestore Collections)

#### Core Collections
- **`cleaners`**: Cleaner profiles with schedule, pricing, availability cache, and location data
  - Pre-calculated fields: `nextAvailable2h`, `nextAvailable6h` (updated by Cloud Functions)
  - Location fields: `zipcode`, `coordinates: { lat, lng }`, `location` (city name)
  - Schedule stored as: `{ monday: [{start, end}], tuesday: [...], ... }`
  - Exceptions: Array of blocked time slots with dates

- **`bookings`**: Customer bookings
  - Fields: `cleanerId`, `userId`, `date` (YYYY-MM-DD), `start`, `end`, `userEmail`, `userName`
  - Triggers Cloud Functions to update cleaner availability

- **`users`**: User profiles and preferences

#### Review System Collections (Recently Added)
- **`reviews`**: Customer reviews (rating 1-5 + optional comment)
- **`reviewRequests`**: Tracks review email status
  - Contains unique `token` for non-login review access
  - Fields: `emailSent`, `reviewSubmitted`, `bookingId`, `cleanerId`

### Routing Structure

#### Public Pages
- `/` - Homepage
- `/cleaners` - Browse all cleaners
- `/book/[cleanerId]` - Book a specific cleaner (with availability calendar)
- `/checkout` - Stripe checkout flow
- `/success` - Payment success page
- `/review/[token]` - Public review submission (no login required)

#### Authenticated Pages
- `/user/bookings` - User's booking history
- `/cleaner-dashboard` - Cleaner's dashboard
- `/cleaner/setup` - Multi-step cleaner onboarding (4 steps)
- `/cleaner/profile` - Edit cleaner profile
- `/admin/dashboard` - Admin panel

#### API Routes
- `/api/create-checkout-session` - Creates Stripe Checkout session
- `/api/get-checkout-session` - Retrieves session details
- `/api/submit-review` - Submit review (validates token, updates cleaner rating)
- `/api/validate-review-token` - Validates review token before showing form

### Firebase Functions

Located in `functions/src/index.ts`:

1. **`onCleanerUpdate`**: Firestore trigger
   - Runs when cleaner document changes
   - Recalculates next available slots for 2h and 6h bookings

2. **`onBookingChange`**: Firestore trigger
   - Runs when booking is created/updated
   - Updates cleaner's availability cache

3. **`sendReviewEmails`**: Scheduled function
   - Runs daily at 10:00 AM (Europe/Helsinki)
   - Finds bookings from previous day
   - Creates `reviewRequests` with unique tokens
   - Sends HTML emails via Resend API

### Environment Variables

#### Vercel (Next.js App)
Required in Vercel dashboard for API routes:
```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

#### Firebase Functions
Set via `firebase functions:secrets:set`:
```
RESEND_API_KEY
RESEND_FROM_EMAIL
APP_URL
```

#### Client-side (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_MAPBOX_TOKEN       # Get from https://account.mapbox.com/access-tokens/
```

### Booking Flow

1. User browses cleaners at `/cleaners`
2. Clicks cleaner → redirected to `/book/[cleanerId]`
3. **Availability Calculation**:
   - Page shows pre-calculated "Next Available" time from Firestore cache
   - Dynamically loads 5 days at a time with available slots
   - Filters out booked times by querying `bookings` collection
   - Uses `MAX_SEARCH_LIMIT` (90 days) to prevent infinite search
4. User selects slot → redirected to `/checkout`
5. Checkout creates Stripe session via `/api/create-checkout-session`
6. Payment success → booking stored in Firestore
7. Next day at 10 AM → Cloud Function sends review email

### Review System Flow

1. **Trigger**: Firebase Scheduler runs `sendReviewEmails` daily
2. **Create Request**: Function queries bookings from yesterday, creates `reviewRequest` with unique token
3. **Send Email**: Resend API sends HTML email with link: `${APP_URL}/review/${token}`
4. **User Access**: Clicking link opens `/review/[token]` page
5. **Validation**: Page calls `/api/validate-review-token` to verify token
6. **Submission**: User submits rating → `/api/submit-review` stores review and updates cleaner's average rating

### Authentication Patterns

- **Guest Checkout**: Supported (email + name only, no account required)
- **Authenticated Users**: Firebase Auth with email/password
- **Checkout Page**: Shows login/register/guest tabs
- **Protected Routes**: Use Firebase auth state (`onAuthStateChanged`)

### Map Feature

#### Overview
The cleaners listing page (`/cleaners`) includes an interactive Mapbox map that displays cleaner locations based on their zipcode.

#### Components
- **MapView** (`src/components/MapView.tsx`): Main map component using `react-map-gl`
  - Displays cleaners as markers with profile photos and ratings
  - Shows popup with cleaner details on marker click
  - Syncs with filters (service type, price, rating)
  - Auto-adjusts bounds to fit all visible cleaners

#### Layout Strategy
- **Desktop (≥1024px)**: Split screen - Map (50%) on left, scrollable cleaner cards (50%) on right
- **Mobile/Tablet (<1024px)**: Toggle button to switch between map view and list view
- **Interaction**: Hovering over cards highlights corresponding map markers

#### Cleaner Location Flow
1. **During Signup** (`/cleaner/setup`):
   - Step 1: Cleaner enters zipcode
   - Validation: Zipcode format validated and geocoded in real-time
   - Geocoding: Mapbox Geocoding API converts zipcode → `{ lat, lng }` coordinates
   - Storage: Saves `zipcode`, `coordinates`, and `location` (city name) to Firestore

2. **On Cleaners Page**:
   - Fetches cleaners with coordinates from Firestore
   - Displays as markers on map
   - Filters apply to both map and list views simultaneously

#### Geocoding Utility
- **File**: `src/lib/geocoding.ts`
- **Functions**:
  - `geocodeZipcode(zipcode, country?)`: Convert zipcode to coordinates
  - `reverseGeocode(coordinates)`: Convert coordinates to address
  - `validateZipcode(zipcode, country?)`: Validate European zipcode formats
- **API**: Uses Mapbox Geocoding API (included in Mapbox token, 50k free requests/month)

## Important Notes

### Firebase Functions v2
- Uses `firebase-functions/v2` API
- Secrets managed via `firebase functions:secrets:set` (not `config:set`)
- Parameters accessed via `functions.params.defineString("KEY_NAME").value()`
- Scheduled functions use `functions.scheduler.onSchedule()`

### Firestore Triggers
- Use `functions.firestore.onDocumentWritten()` (not `.onWrite()`)
- Event structure: `event.data.after`, `event.data.before`, `event.params`

### Availability Optimization
- Cleaner availability is **pre-calculated** and cached in cleaner documents
- Reduces client-side computation and Firestore reads
- Updated automatically by Cloud Functions on booking changes

### Stripe Integration
- Booking metadata stored in Stripe session
- Success webhook should create booking in Firestore (verify if implemented)

### Review Token Security
- Tokens are one-time use (checked via `reviewSubmitted` flag)
- No expiration currently implemented (consider adding 30-day TTL)

### Development Workflow
1. Changes to Next.js app → Push to git → Auto-deploys to Vercel
2. Changes to Firebase Functions → Run `firebase deploy --only functions`
3. Environment variable changes → Update in Vercel dashboard and redeploy

## Common Tasks

### Add New API Route
1. Create `src/app/api/route-name/route.ts`
2. Export async `POST` or `GET` functions
3. If needs Firebase Admin, initialize in route file (check if already initialized)
4. Add required env vars to Vercel if needed

### Add New Firebase Function
1. Edit `functions/src/index.ts`
2. Export function with `functions.*` API
3. Deploy: `firebase deploy --only functions:functionName`
4. Set secrets if needed: `firebase functions:secrets:set SECRET_NAME`

### Update Cleaner Availability Logic
1. Edit availability calculation in `functions/src/index.ts`
2. Update `onCleanerUpdate` and `onBookingChange` functions
3. Note: Frontend reads from cached `nextAvailable2h` and `nextAvailable6h` fields

### Modify Email Template
1. Edit HTML template in `sendReviewRequestEmail()` in `functions/src/index.ts`
2. Redeploy functions
3. Test by creating a booking with yesterday's date manually in Firestore

## File Organization

```
src/
├── app/
│   ├── (routes)/           # Page components
│   ├── api/                # API routes (Next.js)
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/             # Reusable React components
├── context/               # React context providers
├── lib/
│   ├── firebase.ts        # Client-side Firebase initialization
│   └── slots.tsx          # Availability calculation utilities
└── styles/                # Additional stylesheets

functions/
└── src/
    └── index.ts           # All Firebase Cloud Functions
```

## Firestore Security

- Rules defined in `firestore.rules`
- Location: europe-north2
- Indexes defined in `firestore.indexes.json` (create when Firebase prompts)
