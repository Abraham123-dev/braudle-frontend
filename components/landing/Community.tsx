"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

export const Community = () => (
  <section id="community" className="py-24 px-8 max-w-7xl mx-auto scroll-mt-20">
    <div className="grid lg:grid-cols-2 gap-24 items-center">
      <div className="grid grid-cols-2 gap-6">
        <div className="aspect-[4/5] rounded-[24px] bg-gray-200 overflow-hidden shadow-sm">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center" />
        </div>
        <div className="aspect-[4/5] rounded-[24px] bg-brand-green p-8 flex flex-col justify-center gap-4 text-white shadow-sm">
          <ShieldCheck className="w-8 h-8 text-white/50" />
          <p className="text-xl font-semibold italic leading-snug">
            "I finally spend more time learning than just organizing my notes."
          </p>
        </div>
        <div className="aspect-[4/5] rounded-[24px] bg-brand-lime p-8 flex flex-col justify-end shadow-sm">
          <h2 className="text-4xl lg:text-5xl font-semibold text-brand-green tracking-tighter">94%</h2>
          <p className="text-[10px] font-semibold text-brand-green uppercase tracking-[0.1em] mt-2 leading-tight">Study Efficiency <br /> Increase</p>
        </div>
        <div className="aspect-[4/5] rounded-[24px] bg-gray-200 overflow-hidden shadow-sm">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center" />
        </div>
      </div>
      
      <div className="space-y-12">
        <h2 className="text-3xl lg:text-5xl font-semibold text-gray-900 leading-tight tracking-tight">
          Join the <span className="text-brand-green">Braudle</span> Community
        </h2>
        
        <div className="space-y-10">
          {[
            { name: "Sarah Chen", role: "Medical Student", text: "As a med student, the volume of info is insane. Braudle helps me master complex anatomy through its Teach Mode rather than just memorizing blindly." },
            { name: "Marcus Thorne", role: "Law Student", text: "I used to struggle with foundational concepts. Braudle's misconception detection caught exactly where my logic was flawed." }
          ].map((item, i) => (
            <div key={i} className="flex gap-6">
              <div className="w-14 h-14 rounded-full bg-gray-100 shrink-0 shadow-sm border border-gray-50" />
              <div className="space-y-2">
                <p className="text-gray-600 italic font-normal">"{item.text}"</p>
                <p className="text-brand-green font-semibold flex flex-wrap gap-2 text-sm">
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
