"use client";

import React from "react";
import { ShieldCheck, BookOpen, Brain, Target } from "lucide-react";

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
      
      <div className="space-y-8 md:space-y-10 order-1 lg:order-2 text-center lg:text-left">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight tracking-tight">
          Why students choose <span className="text-brand-green">Braudle</span>
        </h2>
        
        <div className="space-y-6 md:space-y-8">
          {[
            { 
              icon: BookOpen, 
              title: "It understands your materials", 
              text: "Your tutor reads every page of your notes, pulls out the key topics, and builds a lesson plan — so you never study blind."
            },
            { 
              icon: Brain, 
              title: "It understands you", 
              text: "Braudle tracks your strengths, catches your misconceptions, and adapts explanations to match your level and learning speed."
            },
            { 
              icon: Target, 
              title: "It makes studying feel easier", 
              text: "Heavy textbooks become bite-sized lessons. Complex concepts get broken down. You always know what to focus on next."
            }
          ].map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-green/10 shrink-0 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-brand-green" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-[15px] font-semibold text-gray-900">{item.title}</h4>
                <p className="text-gray-500 font-normal text-sm leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

