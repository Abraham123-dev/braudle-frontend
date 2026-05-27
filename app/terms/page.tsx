import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function TermsConditions() {
  const lastUpdated = "May 20, 2026";

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navbar />
      <main className="pt-32 pb-24 px-8">
        <div className="max-w-3xl mx-auto space-y-12">
          <header className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-semibold text-brand-forest tracking-tight">Terms & Conditions</h1>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Last Updated: {lastUpdated}</p>
          </header>

          <section className="space-y-6">
            <p className="text-gray-600 leading-relaxed">
              By using Braudle, you agree to comply with and be bound by the following terms and conditions. Please review them carefully before using our platform.
            </p>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-brand-forest">1. Use of Service</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                Braudle provides an AI-powered tutoring service. You agree to use the platform only for lawful educational purposes and in a way that does not infringe the rights of others.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-brand-forest">2. Account Responsibility</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-brand-forest">3. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                You retain ownership of the study materials you upload to Braudle. However, by uploading materials, you grant us a license to process and analyze them to provide the tutoring service to you. The Braudle platform, including its AI models, code, and design, is the property of Braudle.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-brand-forest">4. Limitations of AI</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                While our AI is highly advanced, it is an automated system. Braudle is intended as a study aid and should not be the sole source of information for critical academic or professional decisions. We do not guarantee the absolute accuracy of all AI-generated content.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-brand-forest">5. Termination</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                We reserve the right to suspend or terminate your account if you violate these terms or engage in misuse of the platform.
              </p>
            </div>
          </section>

          <footer className="pt-12 border-t border-gray-100">
            <Link href="/" className="text-brand-green font-medium hover:underline flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Home
            </Link>
          </footer>
        </div>
      </main>
      <Footer />
    </div>
  );
}
