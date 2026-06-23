"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Start your learning journey.",
      features: ["5 PDFs/day, unlimited images", "Adaptive Teach Mode", "Advanced 'Explain Like I'm' levels", "Deep Misconception Insights", "10MB PDF support"],
      cta: "Get Started",
      highlight: false
    },
    {
      name: "Pro",
      price: "$12",
      description: "For serious students.",
      features: ["Unlimited documents", "Voice Learning Mode", "Real-time AI Audio", "Advanced Breakdown Mode", "Priority AI Processing"],
      cta: "Go Pro",
      highlight: true
    },
    {
      name: "Team",
      price: "$29",
      description: "For study groups & schools.",
      features: ["Collaborative study rooms", "Admin dashboard", "Plagiarism check", "Direct tutor Export"],
      cta: "Contact Us",
      highlight: false
    }
  ];

  return (
    <section id="pricing" className="py-24 scroll-mt-20">
      <div className="text-center mb-16 space-y-4 px-8">
          <h2 className="text-3xl lg:text-5xl font-semibold text-gray-900 tracking-tight">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 max-w-xl mx-auto font-normal text-base lg:text-lg">
              Choose the plan that fits your study habits. From solo learners to entire classrooms.
          </p>
      </div>

      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
              <div 
                  key={plan.name}
                  className={`p-8 lg:p-10 rounded-[32px] lg:rounded-[40px] border flex flex-col h-full transition-colors ${
                      plan.highlight 
                      ? "bg-brand-forest text-white border-brand-green" 
                      : "bg-white text-gray-900 border-gray-100"
                  }`}
              >
                  <div className="mb-8">
                      <h3 className="text-xl lg:text-2xl font-semibold mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                          <span className="text-4xl lg:text-5xl font-semibold tracking-tight">{plan.price}</span>
                          <span className={`text-[10px] font-medium uppercase tracking-wider ${plan.highlight ? "text-white/60" : "text-gray-400"}`}>/month</span>
                      </div>
                      <p className={`mt-4 text-[13px] font-normal leading-relaxed ${plan.highlight ? "text-white/70" : "text-gray-500"}`}>
                          {plan.description}
                      </p>
                  </div>

                  <ul className="space-y-4 mb-10 lg:mb-12 flex-1">
                      {plan.features.map(feat => (
                          <li key={feat} className="flex items-start gap-3">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.highlight ? "bg-brand-lime text-brand-green" : "bg-brand-green/10 text-brand-green"}`}>
                                  <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
                              </div>
                              <span className={`text-[13.5px] font-normal ${plan.highlight ? "text-white/90" : "text-gray-600"}`}>{feat}</span>
                          </li>
                      ))}
                  </ul>

                  <Link 
                      href="/login"
                      className={`w-full py-4 rounded-xl font-medium text-[15px] text-center transition-colors ${
                          plan.highlight 
                          ? "bg-brand-lime text-brand-green hover:bg-brand-lime/90" 
                          : "bg-gray-900 text-white hover:bg-black"
                      }`}
                  >
                      {plan.cta}
                  </Link>
              </div>
          ))}
      </div>
    </section>
  );
};
