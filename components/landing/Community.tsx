"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

export const Community = () => (
  <section id="community" className="py-12 md:py-24 px-6 md:px-8 max-w-7xl mx-auto scroll-mt-20">
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
      <div className="grid grid-cols-2 gap-4 md:gap-6 order-2 lg:order-1">
        <div className="aspect-[4/5] rounded-[24px] bg-gray-200 overflow-hidden">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center" />
        </div>
        <div className="aspect-[4/5] rounded-[24px] bg-brand-green p-4 sm:p-8 flex flex-col justify-center gap-2 sm:gap-4 text-white">
          <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white/50" />
          <p className="text-sm sm:text-xl font-medium italic leading-[1.3]">
            "I spend more time learning than just organizing."
          </p>
        </div>
        <div className="aspect-[4/5] rounded-[24px] bg-brand-lime p-4 sm:p-8 flex flex-col justify-end">
          <h2 className="text-3xl sm:text-5xl font-semibold text-brand-green tracking-tighter">94%</h2>
          <p className="text-[8px] sm:text-[10px] font-medium text-brand-green uppercase tracking-[0.2em] mt-1 sm:mt-2 leading-tight">Study Efficiency <br /> Increase</p>
        </div>
        <div className="aspect-[4/5] rounded-[24px] bg-gray-200 overflow-hidden">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center" />
        </div>
      </div>
      
      <div className="space-y-8 md:space-y-12 order-1 lg:order-2 text-center lg:text-left">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight tracking-tight">
          Join the <span className="text-brand-green">Braudle</span> Community
        </h2>
        
        <div className="space-y-8 md:space-y-10">
          {[
            { name: "Sarah Chen", role: "Medical Student", text: "As a med student, the volume of info is insane. Braudle helps me master complex anatomy through its Teach Mode." },
            { name: "Marcus Thorne", role: "Law Student", text: "I used to struggle with foundational concepts. Braudle's misconception detection caught exactly where my logic was flawed." }
          ].map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 shrink-0 border border-gray-50" />
              <div className="space-y-2">
                <p className="text-gray-600 italic font-normal text-sm sm:text-[15px]">"{item.text}"</p>
                <p className="text-brand-green font-medium flex flex-wrap justify-center sm:justify-start gap-2 text-[12px] sm:text-[13px]">
                  {item.name} <span className="text-gray-400 font-normal">— {item.role}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
