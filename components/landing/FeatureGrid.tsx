"use client";

import React from "react";
import { Search, BrainCircuit, Target, ShieldCheck } from "lucide-react";

export const FeatureGrid = () => (
  <section id="features" className="py-14 md:py-24 px-5 sm:px-8 bg-gray-50/50 scroll-mt-20">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-10 md:mb-20 space-y-3">
        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold text-gray-900 tracking-tight">
          A Complete System That Actually <br className="hidden md:block" /> Teaches You
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-normal text-sm md:text-base lg:text-lg px-2">
          Stop relying on passive summaries. Braudle acts as your dedicated private tutor,
          providing interactive learning and deep understanding.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {[
          { icon: BrainCircuit, title: "Smart Layout Reading", desc: "Drop any file—PDFs, slides, or photos of your handwriting. The AI reads it contextually, keeping paragraphs, lists, and key definitions together instead of chopping them in half." },
          { icon: Search, title: "Laser-Precision Search", desc: "Find exactly what you need in seconds. Search scans for exact words, formulas, page numbers, or general ideas, instantly bringing them up for the AI to explain." },
          { icon: BrainCircuit, title: "Teach & Breakdown", desc: "Experience step-by-step guidance. Need it simpler? Just trigger 'Break It Down' for any confusing concept." },
          { icon: Target, title: "Adaptive Quizzes", desc: "Test yourself with quizzes that target your weak spots. The AI learns where you're struggling and adapts in real-time." },
          { icon: ShieldCheck, title: "Explain Like I'm...", desc: "Switch between Beginner, Intermediate, and Advanced explanation depths mid-session to match your comfort level." },
          { icon: Target, title: "Voice Tutor", desc: "Natural speech-to-speech interaction. Talk to Braudle and hear responses as if you're in a real private tutoring session." }
        ].map((feat, i) => (
          <div key={i} className="bg-white p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-gray-100 h-full hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-5 md:mb-8">
              <feat.icon className="w-5 h-5 md:w-6 md:h-6 text-brand-green" />
            </div>
            <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-2 md:mb-4">{feat.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-normal">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
