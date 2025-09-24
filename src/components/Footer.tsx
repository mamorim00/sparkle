// src/components/Footer.tsx
import Link from "next/link";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-gray-700">
        {/* Logo & Tagline */}
        <div>
          <Link href="/" className="text-2xl font-bold text-emerald-600">
            Sparkle
          </Link>
          <p className="mt-2 text-sm text-gray-500">
            Connecting you with trusted cleaners for a spotless home or office.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-emerald-600">About Us</Link></li>
            <li><Link href="/services" className="hover:text-emerald-600">Services</Link></li>
            <li><Link href="/contact" className="hover:text-emerald-600">Contact</Link></li>
            <li><Link href="/auth/login" className="hover:text-emerald-600">Login</Link></li>
          </ul>
        </div>

        {/* For Cleaners */}
        <div>
          <h3 className="font-semibold mb-3">For Cleaners</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/auth/signup" className="hover:text-emerald-600">Join as a Cleaner</Link></li>
            <li><Link href="/dashboard" className="hover:text-emerald-600">Dashboard</Link></li>
            <li><Link href="/help" className="hover:text-emerald-600">Help Center</Link></li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="font-semibold mb-3">Follow Us</h3>
          <div className="flex space-x-4">
            <Link href="https://facebook.com" target="_blank" className="text-gray-500 hover:text-emerald-600">
              <FaFacebook size={20} />
            </Link>
            <Link href="https://instagram.com" target="_blank" className="text-gray-500 hover:text-emerald-600">
              <FaInstagram size={20} />
            </Link>
            <Link href="https://twitter.com" target="_blank" className="text-gray-500 hover:text-emerald-600">
              <FaTwitter size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 mt-6">
        <div className="container mx-auto px-4 py-4 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} Sparkle. All rights reserved.</p>
          <div className="space-x-4 mt-2 md:mt-0">
            <Link href="/privacy" className="hover:text-emerald-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-emerald-600">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
