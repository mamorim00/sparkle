"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, HelpCircle, MessageCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function HelpCenterPage() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = ["bookingPayment", "forCustomers", "forCleaners", "accountTechnical"];

  const faqs = faqCategories.map((categoryKey) => {
    const questionCount = categoryKey === "bookingPayment" || categoryKey === "forCustomers" || categoryKey === "forCleaners" || categoryKey === "accountTechnical" ? 4 : 0;
    const questions = Array.from({ length: questionCount }, (_, i) => ({
      question: t(`helpPage.${categoryKey}.q${i + 1}`),
      answer: t(`helpPage.${categoryKey}.a${i + 1}`),
    }));

    return {
      category: t(`helpPage.${categoryKey}`),
      questions,
    };
  });

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Filter FAQs based on search
  const filteredFaqs = faqs.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <HelpCircle className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">{t('helpPage.title')}</h1>
          <p className="text-xl mb-8">
            {t('helpPage.subtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('helpPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:ring-2 focus:ring-blue-300 outline-none"
            />
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="max-w-5xl mx-auto py-16 px-6">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {t('helpPage.noResultsFound')} &quot;{searchQuery}&quot;. {t('helpPage.tryDifferent')}{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">
                {t('helpPage.contactUs')}
              </Link>
              .
            </p>
          </div>
        ) : (
          filteredFaqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-600 rounded"></span>
                {category.category}
              </h2>

              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const globalIndex = categoryIndex * 100 + faqIndex;
                  const isOpen = openFaq === globalIndex;

                  return (
                    <div
                      key={faqIndex}
                      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                    >
                      <button
                        onClick={() => toggleFaq(globalIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-blue-600 flex-shrink-0 transition-transform ${
                            isOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Contact CTA */}
      <section className="bg-blue-50 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <MessageCircle className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('helpPage.stillNeedHelp')}
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {t('helpPage.supportTeamReady')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 hover:shadow-xl transition-all shadow-lg"
            >
              {t('helpPage.contactSupport')}
            </Link>
            <a
              href="mailto:hello@sparkle.example"
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 hover:shadow-lg transition-all"
            >
              {t('helpPage.emailUsBtn')}
            </a>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-5xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          {t('helpPage.quickLinks')}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/services"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:border-blue-300 transition-all text-center border-2 border-gray-200"
          >
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {t('helpPage.ourServices')}
            </h3>
            <p className="text-gray-600 text-sm">
              {t('helpPage.learnAboutServices')}
            </p>
          </Link>
          <Link
            href="/terms"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:border-blue-300 transition-all text-center border-2 border-gray-200"
          >
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {t('helpPage.termsOfService')}
            </h3>
            <p className="text-gray-600 text-sm">
              {t('helpPage.readTerms')}
            </p>
          </Link>
          <Link
            href="/privacy"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:border-blue-300 transition-all text-center border-2 border-gray-200"
          >
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {t('helpPage.privacyPolicy')}
            </h3>
            <p className="text-gray-600 text-sm">
              {t('helpPage.howWeProtect')}
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
