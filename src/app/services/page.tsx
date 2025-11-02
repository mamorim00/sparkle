"use client";

import Link from "next/link";
import { Sparkles, Home, Building2, Clock, CheckCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function ServicesPage() {
  const { t } = useLanguage();
  const services = [
    {
      icon: <Home className="w-12 h-12 text-blue-600" />,
      title: "Standard House Cleaning",
      description: "Regular cleaning to keep your home fresh and tidy",
      features: [
        "Dusting all surfaces",
        "Vacuuming & mopping floors",
        "Kitchen & bathroom cleaning",
        "Trash removal",
      ],
      duration: "2-4 hours",
      price: "From €50",
    },
    {
      icon: <Sparkles className="w-12 h-12 text-blue-600" />,
      title: "Deep Cleaning",
      description: "Thorough top-to-bottom cleaning for your entire home",
      features: [
        "Everything in standard cleaning",
        "Inside appliances (oven, fridge)",
        "Baseboards & window sills",
        "Behind furniture",
      ],
      duration: "4-8 hours",
      price: "From €120",
    },
    {
      icon: <Building2 className="w-12 h-12 text-blue-600" />,
      title: "Move-In / Move-Out",
      description: "Complete cleaning for transitions",
      features: [
        "All rooms deep cleaned",
        "Inside all cabinets & closets",
        "Window cleaning (inside)",
        "Detailed bathroom & kitchen",
      ],
      duration: "5-10 hours",
      price: "From €150",
    },
    {
      icon: <Clock className="w-12 h-12 text-blue-600" />,
      title: "Recurring Cleaning",
      description: "Regular scheduled cleaning service",
      features: [
        "Weekly, bi-weekly, or monthly",
        "Same cleaner each visit",
        "Customizable cleaning checklist",
        "Discounted rates",
      ],
      duration: "2-4 hours",
      price: "From €45/visit",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">{t('servicesPage.title')}</h1>
          <p className="text-xl mb-8">
            {t('servicesPage.subtitle')}
          </p>
          <Link
            href="/cleaners"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 hover:shadow-xl transition-all shadow-lg"
          >
            {t('servicesPage.bookNow')}
          </Link>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto py-16 px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('servicesPage.whatWeOffer')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('servicesPage.whatWeOfferDesc')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl hover:border-blue-300 transition-all border-2 border-gray-100"
            >
              <div className="mb-4">{service.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-6">{service.description}</p>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {t('servicesPage.whatsIncluded')}
                </h4>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-gray-700"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">{t('servicesPage.duration')}</p>
                  <p className="font-semibold text-gray-900">
                    {service.duration}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{t('servicesPage.startingAt')}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {service.price}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            {t('servicesPage.howItWorks')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('servicesPage.step1Title')}</h3>
              <p className="text-gray-600">
                {t('servicesPage.step1Desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('servicesPage.step2Title')}</h3>
              <p className="text-gray-600">
                {t('servicesPage.step2Desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('servicesPage.step3Title')}</h3>
              <p className="text-gray-600">
                {t('servicesPage.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">{t('servicesPage.ctaTitle')}</h2>
          <p className="text-xl mb-8">
            {t('servicesPage.ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cleaners"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 hover:shadow-xl transition-all shadow-lg"
            >
              {t('servicesPage.browseCleaners')}
            </Link>
            <Link
              href="/contact"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
            >
              {t('servicesPage.contactUs')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
