'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by paragraphs or lines to structure
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-left w-full">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // 1. Headers (###, ##, #)
        if (trimmed.startsWith('###')) {
          const text = trimmed.replace(/^###\s*/, '');
          return (
            <h4 key={lineIdx} className="text-sm font-bold text-brand-forest mt-4 mb-2">
              {parseInlineMarkdown(text)}
            </h4>
          );
        }
        if (trimmed.startsWith('##')) {
          const text = trimmed.replace(/^##\s*/, '');
          return (
            <h3 key={lineIdx} className="text-base font-bold text-brand-forest mt-5 mb-2">
              {parseInlineMarkdown(text)}
            </h3>
          );
        }
        if (trimmed.startsWith('#')) {
          const text = trimmed.replace(/^#\s*/, '');
          return (
            <h2 key={lineIdx} className="text-lg font-bold text-brand-forest mt-6 mb-3">
              {parseInlineMarkdown(text)}
            </h2>
          );
        }

        // 2. Bullet list items (starting with •, -, *)
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const text = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2 mt-1">
              <span className="text-brand-green mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-brand-green" />
              <p className="text-sm font-medium text-brand-forest leading-relaxed flex-1">
                {parseInlineMarkdown(text)}
              </p>
            </div>
          );
        }

        // 3. Numbered lists (1., 2., etc.)
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const text = numMatch[2];
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2 mt-1">
              <span className="text-xs font-bold text-brand-green shrink-0 mt-0.5">{num}.</span>
              <p className="text-sm font-medium text-brand-forest leading-relaxed flex-1">
                {parseInlineMarkdown(text)}
              </p>
            </div>
          );
        }

        // 4. Empty line
        if (!trimmed) {
          return <div key={lineIdx} className="h-2" />;
        }

        // 5. Standard paragraph
        return (
          <p key={lineIdx} className="text-sm font-medium text-brand-forest leading-relaxed">
            {parseInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Inline helper to parse bold text **text** and `code` inline
function parseInlineMarkdown(text: string) {
  // Regex to split by bold ** and inline code `
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-extrabold text-brand-forest">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-brand-green border border-gray-200/50">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
