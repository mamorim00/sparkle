"use client";

import Link from "next/link";
import { FileText, AlertCircle } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <FileText className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-300">
            Please read these terms carefully before using Sparkle
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-8 bg-white my-8 rounded-xl shadow-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p>
            Last updated: <strong>January 2025</strong>
          </p>
        </div>

      <section className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed">
          Welcome to <strong>Sparkle</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms of Service (&quot;Terms&quot;)
          govern your access to and use of our website and booking platform (the &quot;Site&quot;) and the
          cleaning services (the &quot;Services&quot;) offered through the Site. By accessing or using the
          Site or booking Services you agree to these Terms. If you do not agree, do not use the Site
          or Services.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          1. Eligibility
        </h2>
        <p className="text-gray-700">You must be at least 18 years old and legally able to enter into contracts to use Sparkle.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          2. Our Services
        </h2>
        <p className="text-gray-700">Sparkle provides residential and/or commercial cleaning services as described on the Site.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          3. Bookings & Payments
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>All bookings must be made via the Site or official Sparkle channels.</li>
          <li>Payment is due at the time of booking unless otherwise indicated.</li>
          <li>Prices include taxes unless noted otherwise.</li>
          <li>We reserve the right to refuse or cancel bookings due to suspected fraud or unavailability.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          4. Cancellation & Refund Policy
        </h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-gray-700">
            <strong>Important:</strong> Review our cancellation policy on the booking page. Fees may apply for late cancellations.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          5. Customer Responsibilities
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Provide accurate booking information.</li>
          <li>Ensure a safe working environment for Sparkle staff.</li>
          <li>Keep animals secured and disclose hazards.</li>
          <li>Treat cleaning staff respectfully; violations may result in service suspension.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          6. Independent Contractors
        </h2>
        <p className="text-gray-700">Some cleaning services may be provided by independent contractors. Sparkle is not liable for their actions beyond platform obligations.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          7. Liability Limitations
        </h2>
        <p className="text-gray-700">Sparkle is not liable for indirect, incidental, or consequential damages. Total liability is limited to the amount paid for the booking.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          8. Complaints & Service Issues
        </h2>
        <p className="text-gray-700">Contact us within 48 hours of the service to report any concerns.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          9. Privacy
        </h2>
        <p className="text-gray-700">
          We collect and use your information according to our <Link href="/privacy" className="text-blue-600 hover:underline font-semibold">Privacy Policy</Link>.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          10. Modifications to These Terms
        </h2>
        <p className="text-gray-700">We may update these Terms at any time. Continued use constitutes acceptance of changes.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          11. Governing Law
        </h2>
        <p className="text-gray-700">These Terms are governed by the laws of Finland. Disputes fall under the courts in Helsinki, Finland.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          12. Contact
        </h2>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <ul className="space-y-2 text-gray-700">
            <li><strong>Email:</strong> <a href="mailto:hello@sparkle.example" className="text-blue-600 hover:underline">hello@sparkle.example</a></li>
            <li><strong>Phone:</strong> +123 456 7890</li>
            <li><strong>Address:</strong> 123 Sparkle Street, Helsinki, Finland</li>
          </ul>
        </div>
      </section>

      <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
        <p>© {new Date().getFullYear()} Sparkle. All rights reserved.</p>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
          <Link href="/help" className="text-blue-600 hover:underline">Help Center</Link>
          <Link href="/contact" className="text-blue-600 hover:underline">Contact Us</Link>
        </div>
      </footer>
    </div>
    </main>
  );
}
