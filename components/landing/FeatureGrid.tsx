"use client";

import React from "react";
import { Search, BrainCircuit, Target, ShieldCheck } from "lucide-react";

export const FeatureGrid = () => (
  <section id="features" className="py-24 px-8 bg-gray-50/50 scroll-mt-20">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20 space-y-4">
        <h2 className="text-3xl lg:text-5xl font-semibold text-gray-900 tracking-tight">
          A Complete System That Actually <br className="hidden md:block" /> Teaches You
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-normal text-base lg:text-lg">
          Stop relying on passive summaries. Braudle acts as your dedicated private tutor, 
          providing interactive learning and deep understanding.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Search, title: "Multi-Format Input", desc: "Drop PDFs, lecture audio, or images. Our AI seamlessly digests all formats into personalized lessons." },
          { icon: BrainCircuit, title: "Teach Mode", desc: "Experience step-by-step guidance. Braudle breaks down complex concepts intuitively, ensuring you truly understand." },
          { icon: Target, title: "Practice & Exam Mode", desc: "Test yourself with tailored quizzes that adapt to your performance, simulating real exam conditions." },
          { icon: ShieldCheck, title: "Misconception Detection", desc: "Braudle uniquely identifies the root causes behind your mistakes, correcting core misunderstandings." }
        ].map((feat, i) => (
          <div key={i} className="bg-white p-10 rounded-[40px] border border-gray-100 hover:shadow-lg transition-all h-full">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-8">
              <feat.icon className="w-6 h-6 text-brand-green" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{feat.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-normal">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
