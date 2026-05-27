"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export const Hero = () => (
  <section className="pt-20 lg:pt-32 pb-24 px-8 max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 items-center gap-16 lg:text-left text-center">
      <div className="space-y-10">
        <div className="space-y-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">For Students & Self-Learners</span>
          
          <h1 className="text-5xl lg:text-[72px] font-semibold text-brand-forest leading-[1.1] tracking-tight flex flex-wrap lg:justify-start justify-center items-center gap-x-4">
            Master any subject
            <span className="inline-flex items-center gap-2 px-6 py-2 bg-brand-lime rounded-full text-brand-forest text-2xl lg:text-4xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 lg:w-10 lg:h-10">
                <rect x="3" y="14" width="4" height="6" rx="1" fill="currentColor" />
                <rect x="10" y="9" width="4" height="11" rx="1" fill="currentColor" />
                <rect x="17" y="4" width="4" height="16" rx="1" fill="currentColor" />
              </svg>
              3x
            </span>
            more efficiently
          </h1>
        </div>
        
        <p className="text-lg lg:text-xl text-gray-500 max-w-2xl lg:mx-0 mx-auto leading-relaxed font-normal">
          The AI tutor that doesn't just give you answers <br className="hidden md:block" />
          — it actually teaches you how to find them.
        </p>
        
        <div className="flex flex-row items-center lg:justify-start justify-center gap-3">
          <Link href="/login" className="flex-1 sm:flex-none px-6 sm:px-10 py-4 bg-brand-green text-white rounded-full font-semibold text-sm sm:text-lg hover:bg-brand-forest transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-green/10 whitespace-nowrap">
            Try out now
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden sm:block">
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link href="#how-it-works" className="flex-1 sm:flex-none px-6 sm:px-10 py-4 bg-white text-brand-green border border-brand-green/10 rounded-full font-semibold text-sm sm:text-lg hover:bg-brand-green/5 transition-all text-center whitespace-nowrap">
            Learn more
          </Link>
        </div>
        
        <div className="flex items-center lg:justify-start justify-center gap-2 text-sm text-gray-400 font-medium pt-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="8" fill="#006B3F"/>
            <path d="M11 6L7 10L5 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>A new way to master your studies</span>
        </div>
      </div>

      <motion.div 
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="relative rounded-[48px] overflow-hidden aspect-[4/5] lg:aspect-square xl:aspect-[4/5] w-full max-w-xl lg:max-w-none mx-auto shadow-2xl bg-brand-green p-8 lg:p-12 flex flex-col justify-between"
      >
        {/* Tinted Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-brand-green/60 mix-blend-multiply z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-green via-transparent to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
            alt="Students studying"
            className="w-full h-full object-cover grayscale opacity-50"
          />
        </div>

        {/* Card Content (Matched to your reference) */}
        <div className="relative z-20">
          <span className="inline-block px-4 py-1.5 bg-brand-lime text-brand-forest text-[10px] font-bold uppercase tracking-widest rounded-full mb-6">
            Study Smarter
          </span>
          <h2 className="text-4xl lg:text-5xl font-semibold text-white leading-[1.1] tracking-tight">
            Turn Your Notes <br /> Into Expert <br /> Knowledge
          </h2>
        </div>

        <div className="relative z-20 mt-auto">
          <Link href="/login" className="flex items-center justify-center gap-3 w-full py-5 bg-brand-forest/40 backdrop-blur-md border border-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-brand-forest/60 transition-all group">
            Upload Your First Note
            <svg width="18" height="18" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform">
              <path d="M2 6H10M10 6L7 3M10 6L7 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);
