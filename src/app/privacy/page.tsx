"use client";

import Link from "next/link";
import { Shield, Lock, Eye, AlertCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();

  const getArrayTranslation = (key: string): string[] => {
    const value = t(key);
    return Array.isArray(value) ? value : [];
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-green-700 to-green-900 text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <Shield className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">{t('privacyPage.title')}</h1>
          <p className="text-gray-200">
            {t('privacyPage.subtitle')}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-8 bg-white my-8 rounded-xl shadow-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-4 rounded-lg border border-green-200">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p>
            {t('privacyPage.lastUpdated')} <strong>January 2025</strong>
          </p>
        </div>

      <section className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed">
          {t('privacyPage.intro')}
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          {t('privacyPage.section1')}
        </h2>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            {getArrayTranslation('privacyPage.section1Items').map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          {t('privacyPage.section2')}
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          {getArrayTranslation('privacyPage.section2Items').map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          {t('privacyPage.section3')}
        </h2>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4">
          <p className="text-gray-700">
            <strong><Lock className="inline w-4 h-4 mr-1" />{t('privacyPage.section3Warning')}</strong>
          </p>
        </div>
        <p className="text-gray-700 mb-2">{t('privacyPage.section3Text')}</p>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          {getArrayTranslation('privacyPage.section3Items').map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          {t('privacyPage.section4')}
        </h2>
        <p className="text-gray-700">
          {t('privacyPage.section4Text')}
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          {t('privacyPage.section5')}
        </h2>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <ul className="space-y-2 text-gray-700">
            {getArrayTranslation('privacyPage.section5Items').map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Eye className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          {t('privacyPage.section6')}
        </h2>
        <p className="text-gray-700">
          {t('privacyPage.section6Text')}
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          {t('privacyPage.section7')}
        </h2>
        <p className="text-gray-700">
          {t('privacyPage.section7Text')}
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          {t('privacyPage.section8')}
        </h2>
        <p className="text-gray-700">
          {t('privacyPage.section8Text')}
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          {t('privacyPage.section9')}
        </h2>
        <p className="text-gray-700">
          {t('privacyPage.section9Text')}
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded"></span>
          {t('privacyPage.section10')}
        </h2>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <p className="text-gray-700 mb-4">
            {t('privacyPage.section10Text')}
          </p>
          <ul className="space-y-2 text-gray-700">
            <li><strong>{t('privacyPage.email')}</strong> <a href="mailto:hello@sparkle.example" className="text-blue-600 hover:underline">hello@sparkle.example</a></li>
            <li><strong>{t('privacyPage.phone')}</strong> +123 456 7890</li>
            <li><strong>{t('privacyPage.address')}</strong> 123 Sparkle Street, Helsinki, Finland</li>
          </ul>
        </div>
      </section>

      <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
        <p>{t('privacyPage.footerCopyright').replace('{year}', new Date().getFullYear().toString())}</p>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <Link href="/terms" className="text-blue-600 hover:underline">{t('privacyPage.footerTerms')}</Link>
          <Link href="/help" className="text-blue-600 hover:underline">{t('privacyPage.footerHelp')}</Link>
          <Link href="/contact" className="text-blue-600 hover:underline">{t('privacyPage.footerContact')}</Link>
        </div>
      </footer>
    </div>
    </main>
  );
}
