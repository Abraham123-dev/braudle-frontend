"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

export const FAQ = () => {
  const faqs = [
    {
      question: "How does the AI tutor actually teach?",
      answer: "Unlike standard AI that just gives you answers, Braudle uses a Socratic method. It breaks down complex topics into digestible steps and asks you leading questions to ensure you're actually building the mental models required for mastery."
    },
    {
      question: "What files can I upload?",
      answer: "You can upload PDFs, Word documents, text files, and even audio recordings of lectures. Our AI can also 'read' images of handwritten notes or whiteboards."
    },
    {
      question: "Is there a limit to how much I can study?",
      answer: "On the free tier you can upload up to 5 PDFs (up to 10MB each) and unlimited images per day. Your AI tutor sessions and quizzes are unlimited — study as much as you want."
    },
    {
      question: "Can I use it for exam preparation?",
      answer: "Yes! Use 'Exam Mode' to generate adaptive quizzes based on your materials. The AI identifies your weak spots and gives you targeted practice to conquer them."
    }
  ];

  return (
    <section id="faq" className="py-14 md:py-24 px-5 sm:px-8 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold text-gray-950 tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-1">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left hover:text-brand-green transition-colors gap-4"
      >
        <span className="text-[15px] sm:text-base md:text-lg font-semibold text-gray-900 leading-snug">{question}</span>
        {isOpen ? <Minus className="w-4 h-4 text-gray-400 shrink-0" /> : <Plus className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-500 font-normal leading-relaxed text-sm md:text-base">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};