# Sparkle Payment & Money Flow Documentation

## Overview

Sparkle uses a **two-phase payment system** with Stripe's manual capture feature to ensure both customers and cleaners are protected. Payments are authorized upfront but only captured after cleaner acceptance.

---

## Payment Architecture

### Key Components

1. **Stripe Checkout Session** - Customer payment authorization
2. **Payment Intent (Manual Capture)** - Holds funds without charging
3. **Booking Status System** - Controls payment capture/cancellation
4. **Firebase Cloud Functions** - Automated payment processing
5. **Cleaner Accept/Reject API** - Triggers payment capture/refund

---

## Money Flow Scenarios

### 📊 Scenario 1: Successful Booking (Happy Path)

```
┌─────────────┐
│  Customer   │
└──────┬──────┘
       │ 1. Selects cleaner & time slot
       │ 2. Completes Stripe Checkout
       ▼
┌─────────────────────────────────┐
│   Stripe Payment Intent         │
│   capture_method: "manual"      │
│   Status: requires_capture      │
└──────┬──────────────────────────┘
       │ 3. Payment AUTHORIZED (not charged)
       │    - €100 held on customer's card
       ▼
┌─────────────────────────────────┐
│   Firestore Booking Document    │
│   status: "pending_acceptance"  │
│   paymentIntentId: "pi_xxx"     │
│   paymentCaptured: false        │
│   amount: €100                  │
└──────┬──────────────────────────┘
       │ 4. Email sent to cleaner
       │    "New Booking Request"
       ▼
┌─────────────┐
│   Cleaner   │ ⏰ Has 24h OR 6h before service
└──────┬──────┘
       │ 5. Clicks "Accept Request"
       ▼
┌─────────────────────────────────┐
│   /api/bookings/respond         │
│   Action: ACCEPT                │
└──────┬──────────────────────────┘
       │ 6. stripe.paymentIntents.capture(paymentIntentId)
       │    - €100 CHARGED to customer
       │    - €85 (85%) → Cleaner's Stripe Connect account
       │    - €15 (15%) → Platform fee (held in main account)
       ▼
┌─────────────────────────────────┐
│   Firestore Booking Updated     │
│   status: "confirmed"           │
│   paymentCaptured: true         │
│   acceptedAt: timestamp         │
└─────────────────────────────────┘
       │ 7. Confirmation emails sent
       │    - Customer: "Booking Confirmed!"
       │    - Cleaner: "You have a new job"
       ▼
    ✅ SERVICE DAY
       │
       ▼ Service completed
┌─────────────────────────────────┐
│   Booking marked "completed"    │
│   - Cleaner receives payout     │
│   - Platform keeps 15% fee      │
└─────────────────────────────────┘
```

**Money Breakdown:**
- **Customer pays**: €100.00 (authorized immediately, charged on acceptance)
- **Cleaner receives**: €85.00 (85% of booking amount)
- **Platform fee**: €15.00 (15% of booking amount)

---

### ❌ Scenario 2: Cleaner Rejects Request

```
┌─────────────┐
│  Customer   │
└──────┬──────┘
       │ 1. Creates booking request
       │ 2. Payment AUTHORIZED (€100 held)
       ▼
┌─────────────────────────────────┐
│   Booking: pending_acceptance   │
│   paymentIntentId: "pi_xxx"     │
└──────┬──────────────────────────┘
       │ 3. Cleaner receives notification
       ▼
┌─────────────┐
│   Cleaner   │
└──────┬──────┘
       │ 4. Clicks "Reject Request"
       │    (with optional reason)
       ▼
┌─────────────────────────────────┐
│   /api/bookings/respond         │
│   Action: REJECT                │
└──────┬──────────────────────────┘
       │ 5. stripe.paymentIntents.cancel(paymentIntentId)
       │    - Payment authorization CANCELLED
       │    - €100 RELEASED (not charged)
       │    - Customer's card hold removed
       ▼
┌─────────────────────────────────┐
│   Firestore Booking Updated     │
│   status: "rejected"            │
│   rejectedAt: timestamp         │
│   rejectionReason: "reason"     │
│   refundStatus: "full"          │
└─────────────────────────────────┘
       │ 6. Email sent to customer
       │    "Booking request rejected"
       │    + Alternative cleaner suggestions
       ▼
    💰 NO MONEY CHARGED
```

**Money Breakdown:**
- **Customer charged**: €0.00 (authorization released)
- **Cleaner receives**: €0.00
- **Platform fee**: €0.00

---

### ⏰ Scenario 3: Request Expires (No Response)

```
┌─────────────┐
│  Customer   │
└──────┬──────┘
       │ 1. Creates booking request
       │ 2. Payment AUTHORIZED (€100 held)
       ▼
┌─────────────────────────────────┐
│   Booking: pending_acceptance   │
│   requestExpiresAt: timestamp   │
│   paymentIntentId: "pi_xxx"     │
└──────┬──────────────────────────┘
       │ 3. Cleaner receives notification
       │    BUT DOES NOT RESPOND
       ▼
    ⏰ TIME PASSES
       │ Expiration conditions:
       │ - 24 hours from creation, OR
       │ - 6 hours before service
       │ (whichever comes first)
       ▼
┌─────────────────────────────────┐
│   Cloud Function (every 10min)  │
│   expireBookingRequests()       │
└──────┬──────────────────────────┘
       │ 4. Detects expired request
       │ 5. stripe.paymentIntents.cancel(paymentIntentId)
       │    - Payment authorization CANCELLED
       │    - €100 RELEASED (not charged)
       ▼
┌─────────────────────────────────┐
│   Firestore Booking Updated     │
│   status: "expired"             │
│   refundStatus: "full"          │
│   refundedAt: timestamp         │
└─────────────────────────────────┘
       │ 6. Email sent to customer
       │    "Request expired - Full refund"
       │    + Link to browse other cleaners
       ▼
    💰 NO MONEY CHARGED
```

**Money Breakdown:**
- **Customer charged**: €0.00 (authorization released automatically)
- **Cleaner receives**: €0.00
- **Platform fee**: €0.00

---

### 🔄 Scenario 4: Customer Cancels After Acceptance

```
┌─────────────┐
│  Customer   │
└──────┬──────┘
       │ 1. Booking confirmed (payment captured)
       │ 2. Customer cancels later
       ▼
┌─────────────────────────────────┐
│   /api/bookings/cancel          │
└──────┬──────────────────────────┘
       │ 3. Calculate refund amount
       │    - >24h before service: 100% refund
       │    - <24h before service: 50% refund
       ▼
┌─────────────────────────────────┐
│   stripe.refunds.create()       │
│   amount: depends on timing     │
└──────┬──────────────────────────┘
       │ 4a. IF CANCELLED >24H BEFORE:
       │     - Refund: €100 (100%)
       │     - Cleaner receives: €0
       │     - Platform keeps: €0
       │
       │ 4b. IF CANCELLED <24H BEFORE:
       │     - Refund: €50 (50%)
       │     - Cleaner receives: €42.50 (85% of €50)
       │     - Platform keeps: €7.50 (15% of €50)
       ▼
┌─────────────────────────────────┐
│   Firestore Booking Updated     │
│   status: "cancelled"           │
│   cancelledAt: timestamp        │
│   refundAmount: amount          │
│   refundStatus: "full"/"partial"│
└─────────────────────────────────┘
       │ 5. Cancellation emails sent
       ▼
    💰 REFUND PROCESSED (5-10 days)
```

**Money Breakdown (>24h cancellation):**
- **Customer refund**: €100.00 (100%)
- **Cleaner receives**: €0.00
- **Platform keeps**: €0.00

**Money Breakdown (<24h cancellation):**
- **Customer refund**: €50.00 (50%)
- **Cleaner receives**: €42.50 (85% of remaining €50)
- **Platform keeps**: €7.50 (15% of remaining €50)

---

## Payment States & Transitions

### Booking Status Lifecycle

```
CUSTOMER CREATES BOOKING
         ↓
    pending_acceptance
    (payment authorized)
         ↓
    ┌────┴────┐
    │         │
ACCEPT    REJECT/EXPIRE
    │         │
    ↓         ↓
confirmed   rejected/expired
(captured)  (released)
    ↓
completed/cancelled
```

### Payment Intent States

| Booking Status | Payment Intent State | Money Status |
|---------------|---------------------|--------------|
| `pending_acceptance` | `requires_capture` | Authorized (held) |
| `confirmed` | `succeeded` | Captured (charged) |
| `rejected` | `canceled` | Released (not charged) |
| `expired` | `canceled` | Released (not charged) |
| `cancelled` (>24h) | `refunded` | Refunded (100%) |
| `cancelled` (<24h) | `refunded` | Partial refund (50%) |

---

## Technical Implementation Details

### 1. Payment Authorization (Stripe Checkout)

**File**: `src/app/api/create-checkout-session/route.ts`

```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",
  payment_intent_data: {
    capture_method: "manual", // 🔑 KEY: Don't charge immediately
    metadata: {
      needsCleanerAcceptance: "true",
      cleanerId: bookingDetails.cleanerId,
      // ... other booking metadata
    },
  },
  // ... rest of session config
});
```

**Result**: Payment authorized but NOT charged. Funds held on customer's card for up to 7 days (Stripe limit).

---

### 2. Payment Capture (Cleaner Accepts)

**File**: `src/app/api/bookings/respond/route.ts`

```typescript
// When cleaner accepts
const paymentIntent = await stripe.paymentIntents.capture(
  booking.paymentIntentId
);

// Update booking
await bookingRef.update({
  status: "confirmed",
  acceptedAt: new Date().toISOString(),
  paymentCaptured: true,
});
```

**Result**: €100 charged to customer, split sent to cleaner's Stripe Connect account.

---

### 3. Payment Cancellation (Reject/Expire)

**File**: `src/app/api/bookings/respond/route.ts` & `functions/src/index.ts`

```typescript
// When cleaner rejects OR request expires
const paymentIntent = await stripe.paymentIntents.cancel(
  booking.paymentIntentId,
  {
    cancellation_reason: "requested_by_customer" // or "abandoned"
  }
);

// Update booking
await bookingRef.update({
  status: "rejected", // or "expired"
  rejectedAt: new Date().toISOString(),
  refundStatus: "full",
});
```

**Result**: Authorization cancelled, no charge to customer.

---

### 4. Refund Processing (Customer Cancellation)

**File**: `src/app/api/bookings/cancel/route.ts`

```typescript
// Calculate refund percentage
const hoursUntilService = getHoursUntilService(booking);
const refundPercentage = hoursUntilService >= 24 ? 1.0 : 0.5;
const refundAmount = booking.amount * refundPercentage;

// Process refund
const refund = await stripe.refunds.create({
  payment_intent: booking.paymentIntentId,
  amount: Math.round(refundAmount * 100), // Convert to cents
  reason: "requested_by_customer",
});

// Update booking
await bookingRef.update({
  status: "cancelled",
  cancelledAt: new Date().toISOString(),
  refundAmount: refundAmount,
  refundStatus: refundPercentage === 1.0 ? "full" : "partial",
  refundId: refund.id,
});
```

**Result**: Refund issued based on cancellation timing.

---

## Money Flow Timeline

### Typical Successful Booking Timeline

| Time | Event | Money Status |
|------|-------|--------------|
| T+0min | Customer completes checkout | €100 authorized |
| T+5min | Booking created, cleaner notified | €100 held |
| T+2h | Cleaner accepts request | €100 captured → €85 to cleaner, €15 platform fee |
| T+24h | Service day approaches | Money already settled |
| T+48h | Service completed | Booking marked complete |
| T+7 days | Payout to cleaner | €85 transferred to cleaner's bank |

### Request Expiration Timeline (No Response)

| Time | Event | Money Status |
|------|-------|--------------|
| T+0min | Customer completes checkout | €100 authorized |
| T+5min | Booking created, cleaner notified | €100 held |
| T+24h | Cleaner doesn't respond | €100 still held |
| T+24h + 1min | Expiration function runs | Authorization cancelled |
| T+24h + 2min | Customer refund email sent | €0 charged, €100 released |

---

## Security & Compliance

### PCI Compliance
✅ **Sparkle is PCI compliant** - All card data is handled by Stripe. We never touch or store card information.

### Payment Security
- ✅ All payments use Stripe's secure infrastructure
- ✅ 3D Secure (SCA) supported for European customers
- ✅ Manual capture ensures cleaner verification before charging
- ✅ Payment intents stored with bookings for audit trail

### Fraud Prevention
- ✅ Payment authorization holds for verification
- ✅ Cleaner approval required before money moves
- ✅ Automatic expiration prevents indefinite holds
- ✅ Webhook signatures verified for all Stripe events

---

## Payout Schedule

### Cleaner Payouts
- **Timing**: 2-7 business days after booking completion (Stripe standard)
- **Method**: Direct deposit to cleaner's linked bank account
- **Amount**: 85% of booking amount (€85 from €100 booking)
- **Currency**: EUR (configurable per cleaner location)

### Platform Revenue
- **Timing**: Immediate (retained at payment capture)
- **Amount**: 15% of booking amount (€15 from €100 booking)
- **Method**: Remains in platform's main Stripe account

---

## Webhook Events & Money Flow

### Key Stripe Webhook Events

| Event | Trigger | Action | Money Impact |
|-------|---------|--------|--------------|
| `checkout.session.completed` | Customer completes payment | Create booking with `pending_acceptance` | €100 authorized |
| `payment_intent.succeeded` | Payment captured | Update booking to `confirmed` | €100 charged |
| `payment_intent.canceled` | Request rejected/expired | Update booking status | €100 released |
| `charge.refunded` | Customer cancels | Update refund status | €X refunded |

**File**: `src/app/api/webhooks/stripe/route.ts`

---

## Edge Cases & Error Handling

### 1. Payment Authorization Fails
**What happens**: Checkout session fails, booking not created
**Money impact**: €0 - Customer not charged
**User experience**: Error message, asked to try again

### 2. Cleaner Accepts But Capture Fails
**What happens**: Error logged, booking remains `pending_acceptance`
**Money impact**: €100 still authorized (can retry capture)
**User experience**: Cleaner sees error, can retry acceptance

### 3. Request Expires During Cleaner Action
**What happens**: API returns error "request has expired"
**Money impact**: €100 released (cancellation wins)
**User experience**: Cleaner sees "This request has expired"

### 4. Refund Fails
**What happens**: Error logged, booking marked for manual review
**Money impact**: €100 captured, refund pending
**User experience**: Customer contacted by support

---

## Database Schema (Payment Fields)

### Booking Document (Firestore)

```typescript
interface Booking {
  // ... other fields

  // Payment tracking
  amount: number;                    // €100.00
  platformFee: number;               // €15.00 (15%)
  cleanerAmount: number;             // €85.00 (85%)
  currency: string;                  // "eur"

  // Stripe references
  paymentIntentId?: string;          // "pi_xxx" (for capture/cancel)
  stripeSessionId?: string;          // "cs_xxx" (for reference)
  paymentCaptured?: boolean;         // true/false

  // Refund tracking
  refundAmount?: number;             // €100 or €50
  refundStatus?: RefundStatus;       // "none" | "pending" | "partial" | "full"
  refundId?: string | null;          // "re_xxx" (Stripe refund ID)
  refundedAt?: string;               // ISO timestamp

  // Status tracking
  status: BookingStatus;             // Controls payment flow
  payoutStatus: PayoutStatus;        // "pending" | "paid" | "failed"
}
```

---

## Monitoring & Logging

### Key Metrics to Monitor

1. **Authorization Success Rate**: % of successful payment authorizations
2. **Capture Success Rate**: % of successful captures when accepted
3. **Expiration Rate**: % of requests that expire without response
4. **Refund Rate**: % of bookings that result in refunds
5. **Average Time to Acceptance**: How long cleaners take to respond

### Cloud Function Logs

**Expiration Function** (`expireBookingRequests`):
```
🔍 Checking for expired booking requests at 2024-01-15T10:00:00Z
📋 Found 3 pending requests to check
⏰ Found 1 expired requests to process
💳 Cancelled payment for booking abc123
✅ Marked booking abc123 as expired
📧 Sent expiration email to customer for booking abc123
✅ Processed 1 expired booking requests
```

---

## FAQ

### Q: What if a customer's card declines during authorization?
**A**: Checkout fails immediately. No booking is created. Customer sees Stripe's error message and can try another card.

### Q: How long can a payment stay authorized?
**A**: Stripe allows up to 7 days. Our system expires requests after 24 hours or 6 hours before service, so we're well within this limit.

### Q: What if cleaner accepts but customer already cancelled?
**A**: The API checks booking status before capture. If already cancelled, acceptance fails with error message.

### Q: Can a customer get a full refund after cleaner accepts?
**A**: Yes, if they cancel >24 hours before service. <24 hours = 50% refund (cleaner still gets paid).

### Q: What if there's a dispute/chargeback?
**A**: Handled through Stripe's dispute system. Platform has metadata (booking details, service date, etc.) to contest fraudulent disputes.

### Q: How do we handle currency conversion for international cleaners?
**A**: Currently, all bookings are in EUR. Future: Stripe supports multi-currency payouts automatically.

---

## Testing Payment Flows

### Test Cards (Stripe Test Mode)

| Card Number | Behavior |
|-------------|----------|
| `4242 4242 4242 4242` | Successful authorization |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Always declines |
| `4000 0000 0000 0341` | Attaches but charge fails |

### Test Scenarios

1. **Happy Path**:
   - Use `4242...` card
   - Accept request immediately
   - Verify €100 captured

2. **Rejection**:
   - Use `4242...` card
   - Reject request
   - Verify €0 charged

3. **Expiration**:
   - Use `4242...` card
   - Wait for expiration (or manually trigger function)
   - Verify €0 charged

4. **Late Cancellation**:
   - Use `4242...` card
   - Accept request
   - Cancel <24h before service
   - Verify €50 refunded

---

## Contact & Support

For payment-related issues:
- **Customer Support**: support@sparkle.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Firebase Console**: https://console.firebase.google.com

---

**Last Updated**: January 2025
**Version**: 1.0
**Maintained By**: Sparkle Development Team
