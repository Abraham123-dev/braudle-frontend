"use client";

import React from "react";
import Link from "next/link";

export const Footer = () => (
  <footer className="pt-24 pb-12 px-8 max-w-7xl mx-auto border-t border-gray-100 mt-12 bg-gray-50">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
      {/* Branding Section */}
      <div className="md:col-span-5 space-y-8">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 text-lg">Building the brain of the next generation of students.</h4>
          <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
            Braudle is a high-fidelity AI tutor designed to move students away from passive summaries and toward deep conceptual mastery.
          </p>
        </div>
      </div>

      <div className="md:col-span-1 hidden md:block"></div>
      
      {/* Sitemap Links */}
      <div className="md:col-span-2 space-y-6">
        <h4 className="font-semibold text-gray-400 text-xs uppercase tracking-widest">Sitemap</h4>
        <ul className="space-y-4 text-[13px] text-gray-600 font-normal">
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
      
      <div className="md:col-span-2 space-y-6">
        <h4 className="font-semibold text-gray-400 text-xs uppercase tracking-widest">Support</h4>
        <ul className="space-y-4 text-[13px] text-gray-600 font-normal">
          <li className="hover:text-brand-green cursor-pointer transition-colors">Help Center</li>
          <li className="hover:text-brand-green cursor-pointer transition-colors">Community</li>
          <li><Link href="/privacy" className="hover:text-brand-green transition-colors">Privacy Policy</Link></li>
          <li><Link href="/terms" className="hover:text-brand-green transition-colors">Terms</Link></li>
        </ul>
      </div>

      <div className="md:col-span-2 space-y-6">
        <h4 className="font-semibold text-gray-400 text-xs uppercase tracking-widest">Contact</h4>
        <ul className="space-y-4 text-[13px] text-gray-600 font-normal">
          <li className="text-brand-green font-medium">hello@braudle.ai</li>
          <li>Lagos, Nigeria</li>
        </ul>
      </div>
    </div>

    {/* Large Signature Text matched to image */}
    <div className="relative pt-12 overflow-hidden border-t border-gray-200/50">
      <div className="flex justify-center items-start">
        <h3 className="text-[22vw] font-bold text-brand-green leading-[0.8] tracking-[-0.05em] select-none block text-center lowercase">
          braudle
        </h3>
        <span className="text-[2vw] font-bold text-brand-green border-[0.2vw] border-brand-green rounded-full w-[4vw] h-[4vw] flex items-center justify-center -mt-[2vw] ml-2">
          R
        </span>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-12 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
        <p>© 2026 Braudle AI. All rights reserved.</p>
        <div className="flex gap-8">
          <span>Sustainability</span>
          <span>Accessibility</span>
        </div>
      </div>
    </div>
  </footer>
);
