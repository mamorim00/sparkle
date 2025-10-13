"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, HelpCircle, MessageCircle } from "lucide-react";

export default function HelpCenterPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "Booking & Payment",
      questions: [
        {
          question: "How do I book a cleaning service?",
          answer:
            "Simply browse our available cleaners, select your preferred cleaner, choose a time slot that works for you, and complete the secure payment process. You'll receive an instant confirmation via email.",
        },
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through our secure Stripe payment gateway.",
        },
        {
          question: "Can I cancel or reschedule my booking?",
          answer:
            "Yes! You can cancel or reschedule up to 24 hours before your scheduled service for a full refund. Cancellations within 24 hours receive a 50% refund.",
        },
        {
          question: "How much does a cleaning service cost?",
          answer:
            "Pricing varies by service type and duration. Standard cleanings start at €50, deep cleans at €120, and move-in/move-out services at €150. Browse our cleaners to see exact pricing.",
        },
      ],
    },
    {
      category: "For Customers",
      questions: [
        {
          question: "Are your cleaners insured and vetted?",
          answer:
            "Yes, all our cleaners go through a verification process and are encouraged to carry their own insurance. We also collect reviews from customers to maintain quality standards.",
        },
        {
          question: "What should I prepare before the cleaner arrives?",
          answer:
            "Please ensure the cleaner has access to your home, secure any pets, remove valuable items, and let us know of any specific areas you'd like us to focus on.",
        },
        {
          question: "What if I'm not satisfied with the cleaning?",
          answer:
            "Contact us within 48 hours of your service, and we'll work with you to resolve the issue. This may include a re-clean or partial refund depending on the situation.",
        },
        {
          question: "Do I need to provide cleaning supplies?",
          answer:
            "Most cleaners bring their own basic supplies, but it's best to confirm with your specific cleaner. You can discuss preferences during booking or via the contact buttons.",
        },
      ],
    },
    {
      category: "For Cleaners",
      questions: [
        {
          question: "How do I become a Sparkle cleaner?",
          answer:
            "Click 'Join as a Cleaner' in the footer, complete your profile with your experience, availability, and pricing, then start receiving booking requests!",
        },
        {
          question: "How do I get paid?",
          answer:
            "You earn 85% of each booking amount. Payments are processed automatically after service completion and deposited to your bank account within 2-7 business days.",
        },
        {
          question: "Can I set my own schedule and rates?",
          answer:
            "Absolutely! You have full control over your availability, service areas, and hourly rates. Update your profile anytime to reflect changes.",
        },
        {
          question: "What if a customer cancels?",
          answer:
            "Cancellations more than 24 hours in advance won't affect you. Late cancellations (within 24 hours) result in partial payment to compensate for your reserved time.",
        },
      ],
    },
    {
      category: "Account & Technical",
      questions: [
        {
          question: "I forgot my password. How do I reset it?",
          answer:
            "On the login page, click 'Forgot Password' and enter your email. You'll receive a password reset link within minutes.",
        },
        {
          question: "How do I update my profile information?",
          answer:
            "Log in to your account and navigate to your profile settings. From there you can update your contact information, availability, and service preferences.",
        },
        {
          question: "Is my personal information secure?",
          answer:
            "Yes, we use industry-standard encryption and security practices. Read our Privacy Policy for more details on how we protect your data.",
        },
        {
          question: "Can I delete my account?",
          answer:
            "Yes, you can request account deletion by contacting our support team. Please note this action is permanent and cannot be undone.",
        },
      ],
    },
  ];

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
          <h1 className="text-5xl font-bold mb-6">Help Center</h1>
          <p className="text-xl mb-8">
            Find answers to common questions or contact our support team
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help..."
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
              No results found for &quot;{searchQuery}&quot;. Try different keywords or{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">
                contact us
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
            Still need help?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Our support team is here to assist you with any questions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 hover:shadow-xl transition-all shadow-lg"
            >
              Contact Support
            </Link>
            <a
              href="mailto:hello@sparkle.example"
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 hover:shadow-lg transition-all"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-5xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Quick Links
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/services"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:border-blue-300 transition-all text-center border-2 border-gray-200"
          >
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Our Services
            </h3>
            <p className="text-gray-600 text-sm">
              Learn about our cleaning options
            </p>
          </Link>
          <Link
            href="/terms"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:border-blue-300 transition-all text-center border-2 border-gray-200"
          >
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Terms of Service
            </h3>
            <p className="text-gray-600 text-sm">
              Read our terms and conditions
            </p>
          </Link>
          <Link
            href="/privacy"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:border-blue-300 transition-all text-center border-2 border-gray-200"
          >
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Privacy Policy
            </h3>
            <p className="text-gray-600 text-sm">
              How we protect your data
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
