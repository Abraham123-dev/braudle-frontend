"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Community } from "@/components/landing/Community";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-lime selection:text-brand-green antialiased">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <FeatureGrid />
        <Pricing />
        <Community />
        <FAQ />
        
        {/* Final CTA Container - Minimal style */}
        <section className="px-8 mb-24">
          <div className="max-w-7xl mx-auto bg-brand-forest rounded-[32px] lg:rounded-[48px] py-16 lg:py-20 px-8 text-center space-y-10 relative overflow-hidden shadow-xl">
             <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-4xl lg:text-7xl font-semibold text-white tracking-tight leading-[1.1]">
                Start Learning Better Today
              </h2>
              <p className="text-white/70 text-base lg:text-lg font-normal">
                Join our community and transform how you master your subjects with a true AI tutor.
              </p>
              <div className="pt-4 flex flex-col items-center gap-6">
                <Link href="/login" className="px-10 py-5 bg-brand-lime text-brand-green font-semibold text-xl rounded-2xl hover:scale-105 transition-all shadow-lg active:scale-95">
                  Get Started for Free
                </Link>
                <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">
                  No credit card required. Free plan includes basic tutoring limits.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
