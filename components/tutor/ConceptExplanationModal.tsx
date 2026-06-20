'use client';

import React from 'react';

interface ConceptExplanationModalProps {
  concept: string;
  onAskTutor: (concept: string) => void;
  onClose: () => void;
}

export default function ConceptExplanationModal({
  concept,
  onAskTutor,
  onClose,
}: ConceptExplanationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-gray-100 max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green block">Concept Overview</span>
          <h4 className="font-extrabold text-sm text-brand-forest mt-0.5">{concept}</h4>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed font-normal">
          Would you like Braudle to explain the details and key insights of <strong>{concept}</strong> in the chat now?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onAskTutor(concept)}
            className="flex-1 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Ask Tutor
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-150 hover:bg-gray-50 text-gray-500 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
