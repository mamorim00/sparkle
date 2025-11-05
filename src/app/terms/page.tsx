"use client";

import Link from "next/link";
import { FileText, AlertCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function TermsOfServicePage() {
  const { t } = useLanguage();

  const getArrayTranslation = (key: string): string[] => {
    const value = t(key);
    return Array.isArray(value) ? value : [];
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <FileText className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">{t('termsPage.title')}</h1>
          <p className="text-gray-300">
            {t('termsPage.subtitle')}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-8 bg-white my-8 rounded-xl shadow-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p>
            {t('termsPage.lastUpdated')} <strong>January 2025</strong>
          </p>
        </div>

      <section className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed">
          {t('termsPage.intro')}
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section1')}
        </h2>
        <p className="text-gray-700">{t('termsPage.section1Text')}</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section2')}
        </h2>
        <p className="text-gray-700">{t('termsPage.section2Text')}</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section3')}
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          {getArrayTranslation('termsPage.section3List').map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section4')}
        </h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-gray-700">
            <strong>{t('termsPage.section4Warning')}</strong>
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section5')}
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          {getArrayTranslation('termsPage.section5List').map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section6')}
        </h2>
        <p className="text-gray-700">{t('termsPage.section6Text')}</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section7')}
        </h2>
        <p className="text-gray-700">{t('termsPage.section7Text')}</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section8')}
        </h2>
        <p className="text-gray-700">{t('termsPage.section8Text')}</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section9')}
        </h2>
        <p className="text-gray-700">
          {t('termsPage.section9Text')} <Link href="/privacy" className="text-blue-600 hover:underline font-semibold">{t('termsPage.privacyPolicy')}</Link>.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section10')}
        </h2>
        <p className="text-gray-700">{t('termsPage.section10Text')}</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section11')}
        </h2>
        <p className="text-gray-700">{t('termsPage.section11Text')}</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded"></span>
          {t('termsPage.section12')}
        </h2>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <ul className="space-y-2 text-gray-700">
            <li><strong>{t('termsPage.email')}</strong> <a href="mailto:hello@sparkle.example" className="text-blue-600 hover:underline">hello@sparkle.example</a></li>
            <li><strong>{t('termsPage.phone')}</strong> +123 456 7890</li>
            <li><strong>{t('termsPage.address')}</strong> 123 Sparkle Street, Helsinki, Finland</li>
          </ul>
        </div>
      </section>

      <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
        <p>{t('termsPage.footerCopyright').replace('{year}', new Date().getFullYear().toString())}</p>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <Link href="/privacy" className="text-blue-600 hover:underline">{t('termsPage.footerPrivacy')}</Link>
          <Link href="/help" className="text-blue-600 hover:underline">{t('termsPage.footerHelp')}</Link>
          <Link href="/contact" className="text-blue-600 hover:underline">{t('termsPage.footerContact')}</Link>
        </div>
      </footer>
    </div>
    </main>
  );
}
