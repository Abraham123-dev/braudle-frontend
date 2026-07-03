"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

export const Pricing = () => {
  const { user, setUser, setPricingModalOpen } = useStore();
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<"plus" | "pro" | null>(null);

  const plans = [
    {
      name: "Free",
      price: "₦0",
      value: 0,
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
      price: "₦5,999",
      value: 5999,
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
      name: "Pro",
      price: "₦14,999",
      value: 14999,
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
      cta: "Go Pro",
      highlight: false
    }
  ];

  const loadPaystackScript = () => {
    return new Promise((resolve) => {
      if ((window as any).PaystackPop) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => resolve(true);
      document.body.appendChild(script);
    });
  };

  const handlePaystackPayment = async (planKey: "plus" | "pro", amountNaira: number) => {
    if (!user) return;
    setIsPaying(planKey);

    const handleVerification = async (reference: string) => {
      try {
        const verifyRes = await api.post<any>("/payments/verify", {
          reference,
          plan: planKey,
        });
        if (verifyRes.status === "success" && verifyRes.data?.user) {
          setUser(verifyRes.data.user);
          localStorage.setItem("braudle_user", JSON.stringify(verifyRes.data.user));
          setSuccessPlan(planKey);
        } else {
          alert("Payment verification succeeded, but user data failed to update. Please refresh the page.");
        }
      } catch (verifyError: any) {
        console.error("Verification failed:", verifyError);
        alert(`Payment succeeded, but verification failed: ${verifyError.message || "Please contact support."}`);
      }
    };

    try {
      await loadPaystackScript();
      const handler = (window as any).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxxxxxxxxxxxxxxxxxxxxx",
        email: user.email,
        amount: amountNaira * 100, // in kobo
        currency: "NGN",
        callback: function(response: any) {
          handleVerification(response.reference);
        },
        onClose: function() {
          alert("Payment window closed.");
        },
      });
      handler.openIframe();
    } catch (err: any) {
      alert(`Could not open checkout popup: ${err.message}`);
    } finally {
      setIsPaying(null);
    }
  };

  if (successPlan) {
    const isProPlan = successPlan === 'pro';
    const unlockedBenefits = isProPlan ? [
      "Unlimited uploads (max 50MB file size)",
      "Highest AI response prioritization",
      "Unlimited Flashcards generated directly from notes",
      "Unlimited adaptive Exam Prep sets",
      "Unlimited comprehensive Study Practice Guides",
      "Highest Tutor token reset speed",
      "Priority customer developer support"
    ] : [
      "10 PDFs uploaded per day (max 25MB file size)",
      "Higher Tutor chat token budget resets",
      "5 Flashcard decks generated per day",
      "5 adaptive Study Practice Guides per day",
      "5 detailed Exam Prep mock exams per day",
      "Priority response speed from the AI models"
    ];

    return (
      <div className="max-w-md mx-auto py-10 px-6 text-center space-y-8 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm relative">
            <Check className="w-10 h-10 stroke-[3px]" />
            <span className="absolute -top-1 -right-1 text-emerald-500 animate-bounce">
              <Sparkles className="w-5 h-5 fill-emerald-500" />
            </span>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-brand-forest tracking-tight">Upgrade Successful!</h3>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
              You are now upgraded to the <span className="font-extrabold text-brand-green uppercase">{successPlan} Plan</span>
            </p>
          </div>
        </div>

        {/* Benefits list card */}
        <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-3xl p-6 text-left space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            What you've unlocked:
          </span>
          <ul className="space-y-3">
            {unlockedBenefits.map((benefit, idx) => (
              <li key={idx} className="flex gap-2.5 items-start text-xs font-semibold text-zinc-600 leading-normal">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3px]" />
                </div>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => {
            setSuccessPlan(null);
            setPricingModalOpen(false);
          }}
          className="w-full py-4 bg-brand-green hover:bg-brand-green/90 text-white rounded-2xl text-sm font-bold shadow-xs cursor-pointer active:scale-[0.98] transition-all"
        >
          Let's Start Studying
        </button>
      </div>
    );
  }

  return (
    <section id="pricing" className="py-14 md:py-24 scroll-mt-20">
      <div className="text-center mb-10 md:mb-16 space-y-3 px-5 sm:px-8">
        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold text-gray-900 tracking-tight">Simple, Transparent Pricing</h2>
        <p className="text-gray-500 max-w-xl mx-auto font-normal text-sm md:text-base lg:text-lg">
          Choose the plan that fits your study habits. From solo learners to entire classrooms.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
        {plans.map((plan) => {
          const planKey = plan.name.toLowerCase();
          const isCurrentPlan = 
            user?.plan === planKey || 
            ((user?.plan === "free" || !user?.plan) && planKey === "free");

          return (
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

              {!user ? (
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
              ) : (
                <button
                  disabled={isCurrentPlan || planKey === "free" || isPaying !== null}
                  onClick={() => {
                    if (planKey === "free") return;
                    handlePaystackPayment(planKey as "plus" | "pro", plan.value);
                  }}
                  className={`w-full py-3.5 rounded-xl font-medium text-sm text-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.highlight
                    ? "bg-brand-lime text-brand-green hover:bg-brand-lime/90 active:scale-[0.98]"
                    : "bg-gray-900 text-white hover:bg-black active:scale-[0.98]"
                  }`}
                >
                  {isPaying === planKey ? (
                    "Loading..."
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    plan.cta
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

