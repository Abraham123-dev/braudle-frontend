import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPolicy() {
  const lastUpdated = "July 1, 2026";

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navbar />
      <main className="pt-32 pb-24 px-8">
        <div className="max-w-3xl mx-auto space-y-12">
          <header className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-semibold text-brand-forest tracking-tight">Privacy Policy</h1>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Last Updated: {lastUpdated}</p>
          </header>

          <section className="space-y-6">
            <p className="text-gray-600 leading-relaxed">
              At Braudle, we take your privacy and the security of your educational data seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our AI tutoring platform.
            </p>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-brand-forest">1. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                We collect information you provide directly to us, such as when you create an account, upload study materials (PDFs, audio, images), and interact with our AI tutor. This includes your name, email address, and any content within your uploaded materials.
              </p>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                <strong>Payment Information:</strong> If you subscribe to our paid plans (Plus or Large), all transaction data is processed securely by our designated payment processor partners. Braudle does not store your credit card or financial login credentials on its servers.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-brand-forest">2. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                We use your information to provide and improve our services, specifically to:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 text-[15px]">
                <li>Process your study materials to generate tutoring sessions and quizzes.</li>
                <li>Personalize your learning experience based on your performance.</li>
                <li>Analyze usage patterns to improve our AI models and user interface.</li>
                <li>Communicate with you about your account and service updates.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-brand-forest">3. Data Security</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                We implement industry-standard security measures to protect your data. Your uploaded materials are processed securely, and we do not sell your personal information or study data to third parties.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-brand-forest">4. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                You have the right to access, correct, or delete your personal information and uploaded study materials at any time through your account settings or by contacting our support team.
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
