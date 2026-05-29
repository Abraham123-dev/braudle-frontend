"use client";

import React from "react";
import { motion } from "framer-motion";
import { Upload, Cpu, GraduationCap } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      title: "Upload your materials",
      description: "Upload PDFs, lecture audio, notes, or even images of your whiteboard. Braudle's AI ingests every format with precision.",
      color: "bg-brand-green/10 text-brand-green"
    },
    {
      icon: Cpu,
      title: "Start 'Teach Mode'",
      description: "Instead of reading a summary, your AI tutor explains concepts step-by-step. It pauses to ask you questions, ensuring you understand before moving on.",
      color: "bg-brand-lime/20 text-brand-forest"
    },
    {
      icon: GraduationCap,
      title: "Conquer the Quiz",
      description: "Test your knowledge with adaptive quizzes that target your weak spots. Get instant feedback and deep explanations for every answer.",
      color: "bg-brand-forest text-brand-lime"
    }
  ];

  return (
    <section id="how-it-works" className="py-12 md:py-24 px-6 md:px-8 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-20 gap-8">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 tracking-tight leading-[1.1]">
              How it works
            </h2>
            <p className="text-gray-500 font-normal text-base md:text-lg">
              From raw data to deep understanding. Three simple steps 
              to transform how you learn.
            </p>
          </div>
          <div className="hidden lg:block h-[1px] flex-1 bg-gray-100 mb-6 mx-12" />
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[40px] left-0 w-full h-[1px] bg-gray-100 -z-10" />
          
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="space-y-6 relative bg-white sm:bg-transparent p-6 sm:p-0 rounded-3xl border border-gray-100 sm:border-none shadow-sm sm:shadow-none"
            >
              <div className="relative inline-block">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center ${step.color} border border-black/5`}>
                  <step.icon className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 md:w-8 md:h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center font-medium text-gray-400 text-[10px]">
                  0{i + 1}
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 leading-tight">{step.title}</h3>
                <p className="text-gray-500 font-normal leading-relaxed text-[13.5px] md:text-[14px]">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};