"use client";

import Link from "next/link";
import { Shield, Lock, Eye, AlertCircle } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-green-700 to-green-900 text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <Shield className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-200">
            Your privacy is important to us. Learn how we protect your data.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-8 bg-white my-8 rounded-xl shadow-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-4 rounded-lg border border-green-200">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p>
            Last updated: <strong>January 2025</strong>
          </p>
        </div>

      <section className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed">
          Your privacy is important to us at <strong>Sparkle</strong>. This Privacy Policy explains how
          we collect, use, and protect your personal information when you use our website and services
          (the &quot;Site&quot; and &quot;Services&quot;).
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          1. Information We Collect
        </h2>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Personal information:</strong> name, email, phone number, address, payment details</li>
            <li><strong>Account information:</strong> username, password, profile photo</li>
            <li><strong>Usage data:</strong> pages visited, service requests, preferences</li>
            <li><strong>Device and log data:</strong> IP address, browser type, operating system</li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          2. How We Use Your Information
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>To provide and manage your bookings and cleaner profiles</li>
          <li>To communicate with you regarding services, updates, and promotions</li>
          <li>To improve our Services, website, and user experience</li>
          <li>To comply with legal obligations and prevent fraud or abuse</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          3. Sharing Your Information
        </h2>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4">
          <p className="text-gray-700">
            <strong><Lock className="inline w-4 h-4 mr-1" />We do not sell your personal data.</strong> Your information is never sold to third parties.
          </p>
        </div>
        <p className="text-gray-700 mb-2">We may share information with:</p>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Service providers who assist us in delivering our Services</li>
          <li>Independent contractors providing cleaning services</li>
          <li>Legal authorities if required by law or to protect rights and safety</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          4. Data Security
        </h2>
        <p className="text-gray-700">
          We implement reasonable technical and organizational measures to protect your personal data.
          However, no online transmission or storage is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          5. Your Rights
        </h2>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <Eye className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Access, update, or correct your personal information</span>
            </li>
            <li className="flex items-start gap-2">
              <Eye className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Request deletion of your personal data, subject to legal obligations</span>
            </li>
            <li className="flex items-start gap-2">
              <Eye className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Opt out of marketing communications by following the instructions in our emails</span>
            </li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          6. Cookies & Tracking
        </h2>
        <p className="text-gray-700">
          We use cookies and similar technologies to enhance your experience, analyze usage, and
          provide personalized content. You can manage cookies through your browser settings.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          7. Third-Party Links
        </h2>
        <p className="text-gray-700">
          Our Site may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          8. Children's Privacy
        </h2>
        <p className="text-gray-700">
          Sparkle does not knowingly collect personal information from children under 18. If we learn we have inadvertently collected such data, we will take steps to delete it.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          9. Changes to This Policy
        </h2>
        <p className="text-gray-700">
          We may update this Privacy Policy periodically. Changes will be posted on this page with a revised &quot;Last updated&quot; date.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          10. Contact Us
        </h2>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <p className="text-gray-700 mb-4">
            For questions or concerns regarding your privacy, contact us:
          </p>
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
          <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
          <Link href="/help" className="text-blue-600 hover:underline">Help Center</Link>
          <Link href="/contact" className="text-blue-600 hover:underline">Contact Us</Link>
        </div>
      </footer>
    </div>
    </main>
  );
}
