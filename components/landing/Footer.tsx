"use client";

import React from "react";
import Link from "next/link";

export const Footer = () => (
  <footer className="pt-24 pb-12 px-8 max-w-7xl mx-auto border-t border-gray-100 mt-12 bg-[#F7F7F7]">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
      {/* Newsletter Section */}
      <div className="md:col-span-5 space-y-8">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 text-lg">Join our newsletter to stay up to date on the latest news and updates.</h4>
          <div className="relative max-w-md">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full pl-6 pr-32 py-4 bg-white rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-sm"
            />
            <button className="absolute right-1 top-1 bottom-1 px-8 bg-brand-forest text-white rounded-full text-sm font-semibold hover:bg-black transition-colors">
              Subscribe
            </button>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            By subscribing, you agree to our Privacy Policy and consent to receive updates from us.
          </p>
        </div>
        
        {/* Social Icons - Circular Style from image */}
        <div className="flex gap-4">
          {['f', 'i', 'in', 'y'].map((icon) => (
            <div key={icon} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 hover:border-brand-green hover:text-brand-green cursor-pointer transition-all uppercase">
              {icon}
            </div>
          ))}
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
            { label: "Pricing", href: "#pricing" },
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
