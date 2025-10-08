"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-8">
      <h1 className="text-3xl font-bold text-center">Sparkle — Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated: <strong>[Insert Date]</strong></p>

      <section className="prose prose-neutral">
        <p>
          Your privacy is important to us at <strong>Sparkle</strong>. This Privacy Policy explains how
          we collect, use, and protect your personal information when you use our website and services
          (the "Site" and "Services").
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li>Personal information you provide: name, email, phone number, address, payment details.</li>
          <li>Account information: username, password, profile photo.</li>
          <li>Usage data: pages visited, service requests, preferences.</li>
          <li>Device and log data: IP address, browser type, operating system.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide and manage your bookings and cleaner profiles.</li>
          <li>To communicate with you regarding services, updates, and promotions.</li>
          <li>To improve our Services, website, and user experience.</li>
          <li>To comply with legal obligations and prevent fraud or abuse.</li>
        </ul>

        <h2>3. Sharing Your Information</h2>
        <p>
          We do not sell your personal data. We may share information with:
        </p>
        <ul>
          <li>Service providers who assist us in delivering our Services.</li>
          <li>Independent contractors providing cleaning services.</li>
          <li>Legal authorities if required by law or to protect rights and safety.</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          We implement reasonable technical and organizational measures to protect your personal data.
          However, no online transmission or storage is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2>5. Your Rights</h2>
        <ul>
          <li>Access, update, or correct your personal information.</li>
          <li>Request deletion of your personal data, subject to legal obligations.</li>
          <li>Opt out of marketing communications by following the instructions in our emails.</li>
        </ul>

        <h2>6. Cookies & Tracking</h2>
        <p>
          We use cookies and similar technologies to enhance your experience, analyze usage, and
          provide personalized content. You can manage cookies through your browser settings.
        </p>

        <h2>7. Third-Party Links</h2>
        <p>
          Our Site may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites.
        </p>

        <h2>8. Children’s Privacy</h2>
        <p>
          Sparkle does not knowingly collect personal information from children under 18. If we learn we have inadvertently collected such data, we will take steps to delete it.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. Changes will be posted on this page with a revised "Last updated" date.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          For questions or concerns regarding your privacy, contact us:
        </p>
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
