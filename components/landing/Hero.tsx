"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export const Hero = () => (
  <section className="pt-20 lg:pt-32 pb-12 md:pb-24 px-8 max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 items-center gap-16 lg:text-left text-center">
      <div className="space-y-10">
        <div className="space-y-6">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400">For Students & Self-Learners</span>
          
          <h1 className="text-5xl lg:text-[72px] font-semibold text-brand-forest leading-[1.05] tracking-tight flex flex-wrap lg:justify-start justify-center items-center gap-x-4">
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
        
        <p className="text-base lg:text-[17px] text-gray-500/80 max-w-xl lg:mx-0 mx-auto leading-relaxed font-normal">
          The AI tutor that doesn't just give you answers <br className="hidden md:block" />
          — it actually teaches you how to master the concepts.
        </p>
        
        <div className="flex flex-row items-center lg:justify-start justify-center gap-4">
          <Link href="/login" className="px-7 py-3.5 bg-brand-green text-white rounded-full font-medium text-[15px] hover:bg-brand-forest transition-colors whitespace-nowrap">
            Get Started Free
          </Link>
          <Link href="#how-it-works" className="px-7 py-3.5 bg-gray-50 text-gray-600 rounded-full font-medium text-[15px] hover:bg-gray-100 transition-colors text-center whitespace-nowrap">
            Learn more
          </Link>
        </div>
        
        <div className="flex items-center lg:justify-start justify-center gap-3 text-[13px] text-gray-400 font-normal pt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
          <span>No credit card required to start</span>
        </div>
      </div>

      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 md:gap-4 w-full h-[650px] md:h-[500px] lg:h-[600px]"
      >
        {/* Box 1: The Product / Vision - Full width on small mobile, back to 1x1 on Tablet */}
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            show: { y: 0, opacity: 1 }
          }}
          className="relative rounded-[24px] overflow-hidden bg-brand-green p-6 flex flex-col justify-end group col-span-2 md:col-span-1"
        >
          <div className="absolute inset-0 z-0 opacity-40 group-hover:scale-105 transition-transform duration-700">
            <img 
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Deep Work"
              className="w-full h-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-brand-green/40 mix-blend-multiply" />
          </div>
          <div className="relative z-10 space-y-2">
            <span className="text-[9px] font-bold text-brand-lime uppercase tracking-[0.2em]">The Mission</span>
            <h3 className="text-xl font-semibold text-white leading-tight">Elite Tutoring <br /> for Everyone.</h3>
          </div>
        </motion.div>

        {/* Box 2: The Adaptive Intelligence (Brand Color) */}
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            show: { y: 0, opacity: 1 }
          }}
          className="relative rounded-[24px] overflow-hidden bg-brand-forest p-6 flex flex-col justify-between border border-white/10"
        >
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-50">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <p className="text-[13px] md:text-sm font-medium text-white/90 leading-snug italic">
            "It finds where my logic breaks and fixes it."
          </p>
        </motion.div>

        {/* Box 3: The Mastery (Lime Stat) */}
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            show: { y: 0, opacity: 1 }
          }}
          className="relative rounded-[24px] overflow-hidden bg-brand-lime p-6 flex flex-col justify-center"
        >
          <h4 className="text-4xl md:text-5xl font-bold text-brand-forest tracking-tighter">3x</h4>
          <p className="text-[9px] font-bold text-brand-forest uppercase tracking-[0.15em] mt-1">Faster Concept <br /> Retention</p>
          <div className="mt-4 flex gap-1">
            {[1,2,3].map(i => <div key={i} className="h-1 w-full bg-brand-forest/20 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: "100%" }}
                 transition={{ delay: 1, duration: 1.5 }}
                 className="h-full bg-brand-forest"
               />
            </div>)}
          </div>
        </motion.div>

        {/* Box 4: The Hero CTA / Upload - Wide bar at the bottom */}
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            show: { y: 0, opacity: 1 }
          }}
          className="relative rounded-[24px] overflow-hidden bg-gray-50 p-6 flex items-center justify-between group cursor-pointer hover:bg-gray-100 transition-colors col-span-2 md:col-span-1"
        >
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">Ready to level up?</h3>
            <p className="text-[11px] text-gray-500 mt-1">Join 2,000+ students today</p>
          </div>
          <Link href="/login" className="relative z-10 w-12 h-12 rounded-full bg-brand-green text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-brand-green/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  </section>
);
