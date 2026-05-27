"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const navLinks = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "mailto:hello@braudle.ai" }
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const id = href.substring(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setIsOpen(false);
      }
    }
  };

  return (
    <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full relative z-[60]">
      <div className="flex items-center gap-2">
        <Link href="/" className={`font-semibold text-xl transition-colors duration-300 tracking-tight ${isOpen ? "text-white" : "text-brand-green"}`}>Braudle</Link>
      </div>
      
      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map(link => (
          <a 
            key={link.label} 
            href={link.href} 
            onClick={(e) => handleScroll(e, link.href)}
            className="text-[13px] font-normal text-gray-500 hover:text-brand-green transition-colors cursor-pointer"
          >
            {link.label}
          </a>
        ))}
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6">
          <Link href="/login" className="text-[13px] font-normal text-gray-500 hover:text-brand-green">Log in</Link>
          <Link href="/login" className="px-5 py-2 bg-brand-green text-white text-[13px] font-medium rounded-full hover:bg-brand-forest transition-all flex items-center gap-2">
            Try out now
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="translate-y-[0.5px]">
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Custom Mobile Menu Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex md:hidden flex-col gap-1.5 items-end justify-center h-10 w-10 group relative z-[70]"
          aria-label="Toggle Menu"
        >
          <div className={`h-0.5 rounded-full transition-all duration-300 ${isOpen ? "w-7 rotate-45 translate-y-2 bg-white" : "w-6 bg-brand-forest"}`} />
          <div className={`h-0.5 rounded-full transition-all duration-300 ${isOpen ? "w-0 opacity-0 bg-white" : "w-4 bg-brand-forest"}`} />
          <div className={`h-0.5 rounded-full transition-all duration-300 ${isOpen ? "w-7 -rotate-45 -translate-y-2 bg-white" : "w-6 bg-brand-forest"}`} />
        </button>
      </div>

      {/* Full-Screen Mobile Menu Overlay */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 min-h-screen w-screen bg-brand-green z-[55] flex flex-col p-8 pt-12"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-20"
            >
              <Link href="/" onClick={() => setIsOpen(false)} className="font-semibold text-2xl text-white tracking-tight">Braudle</Link>
            </motion.div>

            <div className="flex flex-col gap-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.05 + i * 0.05, 
                    ease: "easeOut" 
                  }}
                >
                  <a
                    href={link.href}
                    onClick={(e) => handleScroll(e, link.href)}
                    className="group relative inline-block text-3xl font-semibold text-white tracking-tight transition-all"
                  >
                    <span className="relative z-10 group-hover:text-brand-lime transition-colors duration-200">
                      {link.label}
                    </span>
                  </a>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="mt-auto pb-12 flex flex-col gap-6"
            >
              <div className="h-[1px] w-full bg-white/10 mb-6" />
              <Link href="/login" onClick={() => setIsOpen(false)} className="text-2xl font-semibold text-white/60 hover:text-brand-lime text-left transition-colors">Login</Link>
              <Link href="/login" onClick={() => setIsOpen(false)} className="w-full py-5 bg-brand-lime text-brand-forest rounded-2xl text-xl font-semibold shadow-2xl text-center hover:scale-[1.02] active:scale-[0.98] transition-all">
                Get Started Free
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
