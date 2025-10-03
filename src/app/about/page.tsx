"use client";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="bg-primary-light min-h-screen text-gray-800">
      {/* Hero */}
      <section className="bg-primary-dark text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">About Sparkle</h1>
        <p className="text-lg max-w-2xl mx-auto">
          Making trusted cleaning services simple, reliable, and accessible for everyone.
        </p>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto py-16 px-6 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-bold mb-4 text-primary-dark">Our Mission</h2>
          <p className="mb-4">
            Sparkle was founded with a simple idea: finding trusted cleaners should be as easy 
            as ordering a ride or booking a table. We connect customers with reliable cleaners 
            who care about quality and detail.
          </p>
          <p>
            Whether it’s a one-time deep clean or ongoing help, Sparkle makes sure the process 
            is quick, transparent, and worry-free.
          </p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-3">How It Works</h3>
          <ul className="space-y-3 text-sm">
            <li>✅ Post your cleaning request in minutes</li>
            <li>✅ Choose from trusted, verified cleaners</li>
            <li>✅ Book and pay securely through our app</li>
            <li>✅ Relax while we handle the rest</li>
          </ul>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6 text-primary-dark">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-xl shadow-sm">
              <h3 className="font-semibold mb-2">Trust & Safety</h3>
              <p className="text-sm">Every cleaner is verified and reviewed to keep your home safe.</p>
            </div>
            <div className="p-6 border rounded-xl shadow-sm">
              <h3 className="font-semibold mb-2">Quality Service</h3>
              <p className="text-sm">We hold high standards to make sure every booking leaves your home sparkling.</p>
            </div>
            <div className="p-6 border rounded-xl shadow-sm">
              <h3 className="font-semibold mb-2">Community</h3>
              <p className="text-sm">We empower cleaners with fair opportunities and customers with reliable service.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-dark text-white text-center py-16 px-6">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="mb-6">Join Sparkle today and experience stress-free cleaning.</p>
        <Link 
          href="/auth/signup" 
          className="bg-highlight px-6 py-3 rounded-lg text-white font-semibold hover:bg-accent transition"
        >
          Join as a Customer
        </Link>
      </section>
    </main>
  );
}
