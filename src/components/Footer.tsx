"use client";

import Link from "next/link";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <footer className="bg-primary-dark text-gray-300 py-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6">
        
        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-3">{t("footer.brand")}</h2>
          <p className="text-sm mb-4">
            {t("footer.tagline")}
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
          <h3 className="font-bold text-white mb-3">{t("footer.quickLinks")}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-primary">{t("footer.aboutUs")}</Link></li>
            <li><Link href="/services" className="hover:text-primary">{t("footer.services")}</Link></li>
            <li><Link href="/contact" className="hover:text-primary">{t("footer.contact")}</Link></li>
            <li><Link href="/help" className="hover:text-primary">{t("footer.helpCenter")}</Link></li>
          </ul>
        </div>

        {/* For Cleaners */}
        <div>
          <h3 className="font-bold text-white mb-3">{t("footer.forCleaners")}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/auth/login?mode=register&role=cleaner" className="hover:text-primary">{t("footer.joinAsCleaner")}</Link></li>
            <li><Link href="/cleaner-dashboard" className="hover:text-primary">{t("navbar.dashboard")}</Link></li>
          </ul>
        </div>


        {/* Legal & Language */}
        <div>
          <h3 className="font-bold text-white mb-3">{t("footer.legal")}</h3>
          <ul className="space-y-2 text-sm mb-4">
            <li><Link href="/terms" className="hover:text-primary">{t("footer.terms")}</Link></li>
            <li><Link href="/privacy" className="hover:text-primary">{t("footer.privacy")}</Link></li>
          </ul>

          {/* Language Switcher */}
          <div className="mt-4">
            <h4 className="font-bold text-white mb-2 text-sm">{t("footer.language")}</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  language === "en"
                    ? "bg-primary text-white font-semibold"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {t("footer.english")}
              </button>
              <button
                onClick={() => setLanguage("fi")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  language === "fi"
                    ? "bg-primary text-white font-semibold"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {t("footer.finnish")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="mt-8 border-t border-gray-700 pt-4 text-center text-sm text-gray-400">
        {t("footer.copyright")}
      </div>
    </footer>
  );
}
