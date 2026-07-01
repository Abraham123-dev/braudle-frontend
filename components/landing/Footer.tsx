"use client";

import React from "react";
import Link from "next/link";

export const Footer = () => (
  <footer className="pt-14 md:pt-24 pb-10 px-5 sm:px-8 max-w-7xl mx-auto border-t border-gray-100 mt-10 md:mt-12 bg-gray-50">
    <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-12 mb-14 md:mb-24">
      {/* Branding Section — full width on mobile */}
      <div className="col-span-2 md:col-span-5 space-y-4 md:space-y-8">
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 text-base md:text-lg leading-snug">Building the brain of the next generation of students.</h4>
          <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
            Braudle is a high-fidelity AI tutor designed to move students away from passive summaries and toward deep conceptual mastery.
          </p>
        </div>
      </div>

      <div className="hidden md:block md:col-span-1" />

      {/* Sitemap */}
      <div className="col-span-1 md:col-span-2 space-y-4 md:space-y-6">
        <h4 className="font-semibold text-gray-400 text-[10px] md:text-xs uppercase tracking-widest">Sitemap</h4>
        <ul className="space-y-3 md:space-y-4 text-[13px] text-gray-600 font-normal">
          {[
            { label: "About Us", href: "#" },
            { label: "How it works", href: "#how-it-works" },
            { label: "FAQ", href: "#faq" }
          ].map(item => (
            <li key={item.label}>
              <a href={item.href} className="hover:text-brand-green transition-colors">{item.label}</a>
            </li>
          ))}
        </ul>
      </div>

      {/* Support */}
      <div className="col-span-1 md:col-span-2 space-y-4 md:space-y-6">
        <h4 className="font-semibold text-gray-400 text-[10px] md:text-xs uppercase tracking-widest">Support</h4>
        <ul className="space-y-3 md:space-y-4 text-[13px] text-gray-600 font-normal">
          <li className="hover:text-brand-green cursor-pointer transition-colors">Help Center</li>
          <li className="hover:text-brand-green cursor-pointer transition-colors">Community</li>
          <li><Link href="/privacy" className="hover:text-brand-green transition-colors">Privacy Policy</Link></li>
          <li><Link href="/terms" className="hover:text-brand-green transition-colors">Terms</Link></li>
        </ul>
      </div>

      {/* Contact */}
      <div className="col-span-2 md:col-span-2 space-y-4 md:space-y-6">
        <h4 className="font-semibold text-gray-400 text-[10px] md:text-xs uppercase tracking-widest">Contact</h4>
        <ul className="space-y-3 text-[13px] text-gray-600 font-normal">
          <li className="text-brand-green font-medium">hello@braudle.ai</li>
          <li>Lagos, Nigeria</li>
        </ul>
      </div>
    </div>

    {/* Large Signature Text */}
    <div className="relative pt-8 md:pt-12 overflow-hidden border-t border-gray-200/50">
      <div className="flex justify-center items-start">
        <h3 className="text-[22vw] font-bold text-brand-green leading-[0.8] tracking-[-0.05em] select-none block text-center lowercase">
          braudle
        </h3>
        <span className="text-[2vw] font-bold text-brand-green border-[0.2vw] border-brand-green rounded-full w-[4vw] h-[4vw] flex items-center justify-center -mt-[2vw] ml-2">
          R
        </span>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-8 md:mt-12 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
        <p>© 2026 Braudle AI. All rights reserved.</p>
        <div className="flex gap-6 md:gap-8">
          <span>Sustainability</span>
          <span>Accessibility</span>
        </div>
      </div>
    </div>
  </footer>
);
