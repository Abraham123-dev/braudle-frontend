"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "₦0",
      description: "Start your learning journey.",
      features: [
        "5 PDFs/day (max 10MB)",
        "Tutor Chat (6h token reset)",
        "PDF Summary generated once",
        "1 Flashcard gen / day (per doc)",
        "1 Practice Guide / day (per doc)",
        "1 Exam Prep / day (per doc)"
      ],
      cta: "Get Started",
      highlight: false
    },
    {
      name: "Plus",
      price: "₦6,000",
      description: "For serious students.",
      features: [
        "10 PDFs/day (max 25MB)",
        "Higher Tutor token budget",
        "5 Flashcard gens/day",
        "5 Practice Guides/day",
        "5 Exam Preps/day",
        "Priority AI responses",
        "Early access features"
      ],
      cta: "Go Plus",
      highlight: true
    },
    {
      name: "Large",
      price: "₦15,000",
      description: "For power learners.",
      features: [
        "Unlimited uploads (max 50MB)",
        "Highest Tutor token budget",
        "Unlimited Flashcards",
        "Unlimited Practice Guides",
        "Unlimited Exam Prep",
        "Priority support",
        "Highest response priority"
      ],
      cta: "Go Large",
      highlight: false
    }
  ];

  return (
    <section id="pricing" className="py-14 md:py-24 scroll-mt-20">
      <div className="text-center mb-10 md:mb-16 space-y-3 px-5 sm:px-8">
        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold text-gray-900 tracking-tight">Simple, Transparent Pricing</h2>
        <p className="text-gray-500 max-w-xl mx-auto font-normal text-sm md:text-base lg:text-lg">
          Choose the plan that fits your study habits. From solo learners to entire classrooms.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`p-6 md:p-8 lg:p-10 rounded-[24px] lg:rounded-[40px] border flex flex-col h-full transition-colors ${
              plan.highlight
              ? "bg-brand-forest text-white border-brand-green"
              : "bg-white text-gray-900 border-gray-100"
            }`}
          >
            <div className="mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">{plan.price}</span>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${plan.highlight ? "text-white/60" : "text-gray-400"}`}>/month</span>
              </div>
              <p className={`mt-3 text-[13px] font-normal leading-relaxed ${plan.highlight ? "text-white/70" : "text-gray-500"}`}>
                {plan.description}
              </p>
            </div>

            <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 lg:mb-12 flex-1">
              {plan.features.map(feat => (
                <li key={feat} className="flex items-start gap-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.highlight ? "bg-brand-lime text-brand-green" : "bg-brand-green/10 text-brand-green"}`}>
                    <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
                  </div>
                  <span className={`text-[13px] font-normal ${plan.highlight ? "text-white/90" : "text-gray-600"}`}>{feat}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className={`w-full py-3.5 rounded-xl font-medium text-sm text-center transition-colors ${
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
