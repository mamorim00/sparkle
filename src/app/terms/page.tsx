"use client";

import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-8">
      <h1 className="text-3xl font-bold text-center">Sparkle — Terms of Service</h1>
      <p className="text-sm text-gray-500">Last updated: <strong>[Insert Date]</strong></p>

      <section className="prose prose-neutral">
        <p>
          Welcome to <strong>Sparkle</strong> (“we”, “us”, or “our”). These Terms of Service (“Terms”)
          govern your access to and use of our website and booking platform (the “Site”) and the
          cleaning services (the “Services”) offered through the Site. By accessing or using the
          Site or booking Services you agree to these Terms. If you do not agree, do not use the Site
          or Services.
        </p>

        <h2>1. Eligibility</h2>
        <p>You must be at least 18 years old and legally able to enter into contracts to use Sparkle.</p>

        <h2>2. Our Services</h2>
        <p>Sparkle provides residential and/or commercial cleaning services as described on the Site.</p>

        <h2>3. Bookings & Payments</h2>
        <ul>
          <li>All bookings must be made via the Site or official Sparkle channels.</li>
          <li>Payment is due at the time of booking unless otherwise indicated.</li>
          <li>Prices include taxes unless noted otherwise.</li>
          <li>We reserve the right to refuse or cancel bookings due to suspected fraud or unavailability.</li>
        </ul>

        <h2>4. Cancellation & Refund Policy</h2>
        <p>Review our cancellation policy on the booking page. Fees may apply for late cancellations.</p>

        <h2>5. Customer Responsibilities</h2>
        <ul>
          <li>Provide accurate booking information.</li>
          <li>Ensure a safe working environment for Sparkle staff.</li>
          <li>Keep animals secured and disclose hazards.</li>
          <li>Treat cleaning staff respectfully; violations may result in service suspension.</li>
        </ul>

        <h2>6. Independent Contractors</h2>
        <p>Some cleaning services may be provided by independent contractors. Sparkle is not liable for their actions beyond platform obligations.</p>

        <h2>7. Liability Limitations</h2>
        <p>Sparkle is not liable for indirect, incidental, or consequential damages. Total liability is limited to the amount paid for the booking.</p>

        <h2>8. Complaints & Service Issues</h2>
        <p>Contact us within 48 hours of the service to report any concerns.</p>

        <h2>9. Privacy</h2>
        <p>We collect and use your information according to our <Link href="/privacy">Privacy Policy</Link>.</p>

        <h2>10. Modifications to These Terms</h2>
        <p>We may update these Terms at any time. Continued use constitutes acceptance of changes.</p>

        <h2>11. Governing Law</h2>
        <p>These Terms are governed by the laws of [Your Country/Region]. Disputes fall under the courts in [Your City/Country].</p>

        <h2>12. Contact</h2>
        <ul>
          <li>Email: <a href="mailto:hello@sparkle.example">hello@sparkle.example</a></li>
          <li>Phone: [Insert phone number]</li>
          <li>Address: [Insert business address]</li>
        </ul>
      </section>

      <footer className="text-sm text-gray-600">
        <p>© {new Date().getFullYear()} Sparkle. All rights reserved.</p>
      </footer>
    </div>
  );
}
