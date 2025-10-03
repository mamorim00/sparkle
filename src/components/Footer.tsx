import Link from "next/link";
import { FaFacebookF, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-gray-300 py-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6">
        
        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-3">Sparkle</h2>
          <p className="text-sm mb-4">
            Find trusted cleaners with ease in just a few clicks.
          </p>
          <div className="flex space-x-4">
            <Link href="https://facebook.com" target="_blank" className="hover:text-primary">
              <FaFacebookF size={18} />
            </Link>
            <Link href="https://instagram.com" target="_blank" className="hover:text-primary">
              <FaInstagram size={18} />
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-bold text-white mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
            <li><Link href="/services" className="hover:text-primary">Services</Link></li>
            <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link href="/auth/login" className="hover:text-primary">Login</Link></li>
          </ul>
        </div>

        {/* For Cleaners */}
        <div>
          <h3 className="font-bold text-white mb-3">For Cleaners</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/auth/login?mode=register&role=cleaner" className="hover:text-primary">Join as a Cleaner</Link></li>
            <li><Link href="/dashboard" className="hover:text-primary">Dashboard</Link></li>
            <li><Link href="/help" className="hover:text-primary">Help Center</Link></li>
          </ul>
        </div>
        

        {/* Legal */}
        <div>
          <h3 className="font-bold text-white mb-3">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="mt-8 border-t border-gray-700 pt-4 text-center text-sm text-gray-400">
        © 2025 Sparkle. All rights reserved.
      </div>
    </footer>
  );
}
