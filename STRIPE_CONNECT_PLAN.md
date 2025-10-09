# Stripe Connect Implementation Plan

## Overview
Implement Stripe Connect to pay cleaners automatically, with platform commission deduction.

## Commission Structure
- **Platform fee**: 15% of booking amount
- **Cleaner receives**: 85% of booking amount
- **Payout timing**: Automatic after job marked as "completed"

## Implementation Steps

### 1. Stripe Connect Account Setup (API)

**Create Connect account for cleaners during onboarding:**

```typescript
// src/app/api/stripe/create-connect-account/route.ts
import Stripe from 'stripe';

export async function POST(req: Request) {
  const { cleanerId, email, name } = await req.json();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Create Express connected account
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'IE', // Ireland
    email: email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    individual: {
      email: email,
      first_name: name.split(' ')[0],
      last_name: name.split(' ').slice(1).join(' '),
    },
  });

  // Save account ID to Firestore
  await db.collection('cleaners').doc(cleanerId).update({
    stripeAccountId: account.id,
    stripeAccountStatus: 'pending',
  });

  return Response.json({ accountId: account.id });
}
```

### 2. Stripe Connect Onboarding Link

**Allow cleaners to complete onboarding:**

```typescript
// src/app/api/stripe/create-onboarding-link/route.ts
export async function POST(req: Request) {
  const { accountId } = await req.json();

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: 'https://sparkle.com/cleaner/setup/stripe/refresh',
    return_url: 'https://sparkle.com/cleaner/setup/stripe/success',
    type: 'account_onboarding',
  });

  return Response.json({ url: accountLink.url });
}
```

### 3. Update Payment Flow with Transfers

**Modify checkout to use destination charges:**

```typescript
// src/app/api/create-checkout-session/route.ts
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: lineItems,
  mode: 'payment',
  payment_intent_data: {
    application_fee_amount: Math.round(totalAmount * 100 * 0.15), // 15% fee
    transfer_data: {
      destination: cleanerStripeAccountId, // From cleaner document
    },
  },
  success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/`,
});
```

### 4. Payout Trigger (Cloud Function)

**Automatically transfer money when job is completed:**

```typescript
// functions/src/index.ts
export const onBookingCompleted = functions.firestore.onDocumentUpdated(
  'bookings/{bookingId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    // Only trigger when status changes to completed
    if (before.status !== 'completed' && after.status === 'completed') {
      const cleanerDoc = await db.collection('cleaners').doc(after.cleanerId).get();
      const cleaner = cleanerDoc.data();

      // Create transfer to cleaner
      const transfer = await stripe.transfers.create({
        amount: Math.round(after.amount * 100 * 0.85), // 85% to cleaner
        currency: 'eur',
        destination: cleaner.stripeAccountId,
        transfer_group: after.id,
      });

      // Update booking with transfer ID
      await event.data.after.ref.update({
        transferId: transfer.id,
        transferDate: new Date().toISOString(),
      });
    }
  }
);
```

### 5. Cleaner Earnings Dashboard

**Show earnings, pending payouts, and payout history:**

```typescript
// src/app/cleaner/earnings/page.tsx
interface Earning {
  bookingId: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'pending' | 'paid';
  date: string;
}

// Fetch all completed bookings for cleaner
const completedBookings = await getDocs(
  query(
    collection(db, 'bookings'),
    where('cleanerId', '==', cleanerId),
    where('status', '==', 'completed')
  )
);

// Calculate totals
const totalEarnings = bookings.reduce((sum, b) => sum + b.amount * 0.85, 0);
const pendingPayouts = bookings
  .filter(b => !b.transferId)
  .reduce((sum, b) => sum + b.amount * 0.85, 0);
```

### 6. Admin Commission Tracking

**Track platform revenue:**

```typescript
// src/app/admin/financials/page.tsx
// Show all bookings with commission breakdown
// Total platform revenue = sum of all 15% fees
// Payouts made to cleaners
// Pending payouts
```

## Database Schema Updates

### Cleaners Collection
```typescript
{
  stripeAccountId: string;           // Connect account ID
  stripeAccountStatus: string;       // 'pending' | 'active' | 'rejected'
  onboardingCompletedAt: string;     // ISO timestamp
}
```

### Bookings Collection
```typescript
{
  amount: number;                    // Total amount
  platformFee: number;               // 15% commission
  cleanerAmount: number;             // 85% to cleaner
  transferId?: string;               // Stripe transfer ID
  transferDate?: string;             // When payout was made
  payoutStatus: 'pending' | 'paid';  // Payout status
}
```

## Test Mode Notes

✅ **You can implement everything in test mode without a business ID:**
- Use Stripe test API keys
- Create test connected accounts
- Test transfers with test cards
- No real money moves

🚀 **When ready for production:**
1. Activate Stripe account with business details
2. Complete tax forms
3. Switch to live API keys
4. Connected accounts will need real bank details

## Next Steps

1. Create Stripe Connect account creation API
2. Add Connect onboarding flow to cleaner setup
3. Update payment flow to use destination charges
4. Create earnings dashboard for cleaners
5. Add admin commission tracking
