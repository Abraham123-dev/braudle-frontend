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
          <div className="max-w-5xl mx-auto bg-[#FFC527] py-12 lg:py-16 px-8 lg:px-12 relative overflow-hidden shadow-sm">
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
              <div className="space-y-6 max-w-lg">
                <h2 className="text-3xl lg:text-5xl font-semibold text-brand-forest tracking-tight leading-[1.1]">
                  Your education deserves <br /> better tools
                </h2>
                <p className="text-brand-forest/70 text-base lg:text-lg font-normal">
                  No matter what you're studying, Braudle is where <br className="hidden lg:block" />
                  deep understanding begins.
                </p>
                <div className="pt-2 flex justify-center md:justify-start">
                  <Link href="/login" className="px-8 py-3.5 bg-[#2E1D13] text-white font-medium text-[15px] rounded-xl hover:bg-[#3d271a] transition-colors active:opacity-90 inline-block">
                    Try for free
                  </Link>
                </div>
              </div>

              {/* Illustration placeholder - matching image style */}
              <div className="relative w-full max-w-xs aspect-[4/3] flex items-center justify-center">
                <style jsx>{`
                  .avatar-group { display: flex; gap: 0.75rem; position: relative; }
                  .avatar { width: 60px; height: 75px; border: 3px solid #2E1D13; border-radius: 30px 30px 8px 8px; background: transparent; position: relative; }
                  .avatar::after { content: ''; position: absolute; top: 15px; left: 15px; width: 30px; height: 30px; border-top: 3px solid #2E1D13; border-radius: 50%; }
                `}</style>
                <div className="avatar-group scale-110">
                   <div className="avatar" />
                   <div className="avatar translate-y-3" />
                   <div className="avatar" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
