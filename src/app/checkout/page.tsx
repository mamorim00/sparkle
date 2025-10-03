import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient'; // We will create this component next

// The loading fallback will be shown while the client component and its hooks are preparing.
const CheckoutPageFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <p className="text-lg">Loading your order...</p>
  </div>
);

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutPageFallback />}>
      <CheckoutClient />
    </Suspense>
  );
}