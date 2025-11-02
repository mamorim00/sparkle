"use client";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">{t('about.title')}</h1>
          <p className="text-xl leading-relaxed">
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-6xl mx-auto py-16 px-6 grid md:grid-cols-2 gap-10">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-3xl font-bold mb-6 text-blue-700 flex items-center gap-2">
            <span className="w-2 h-10 bg-blue-600 rounded"></span>
            {t('about.mission')}
          </h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            {t('about.missionText1')}
          </p>
          <p className="text-gray-700 leading-relaxed">
            {t('about.missionText2')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg rounded-xl p-8 border-2 border-blue-200">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">{t('about.howItWorks')}</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <span className="text-gray-700">{t('about.step1')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <span className="text-gray-700">{t('about.step2')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <span className="text-gray-700">{t('about.step3')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <span className="text-gray-700">{t('about.step4')}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-gray-900">{t('about.valuesTitle')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white border-2 border-blue-200 rounded-xl shadow-lg hover:shadow-xl hover:border-blue-400 transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{t('about.trustSafety')}</h3>
              <p className="text-gray-700">{t('about.trustSafetyDesc')}</p>
            </div>
            <div className="p-8 bg-white border-2 border-blue-200 rounded-xl shadow-lg hover:shadow-xl hover:border-blue-400 transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{t('about.qualityService')}</h3>
              <p className="text-gray-700">{t('about.qualityServiceDesc')}</p>
            </div>
            <div className="p-8 bg-white border-2 border-blue-200 rounded-xl shadow-lg hover:shadow-xl hover:border-blue-400 transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{t('about.community')}</h3>
              <p className="text-gray-700">{t('about.communityDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white text-center py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">{t('about.ctaTitle')}</h2>
          <p className="text-xl mb-8">{t('about.ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cleaners"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 hover:shadow-xl transition-all shadow-lg"
            >
              {t('about.bookCleaner')}
            </Link>
            <Link
              href="/auth/login?mode=register&role=cleaner"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
            >
              {t('about.joinAsCleaner')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
