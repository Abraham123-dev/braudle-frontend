'use client';

import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MarkdownRendererProps {
  content: string;
}

// Sub-component to render LaTeX formulas safely with KaTeX
export function MathRenderer({ formula, block = false }: { formula: string; block?: boolean }) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode: block,
          throwOnError: false,
        });
      } catch (err) {
        console.error('KaTeX rendering error:', err);
        containerRef.current.textContent = formula;
      }
    }
  }, [formula, block]);

  if (block) {
    return (
      <div className="my-6 overflow-x-auto select-all w-full py-2">
        <span ref={containerRef} className="block text-[17px] text-brand-forest text-center" />
      </div>
    );
  }

  return (
    <span 
      ref={containerRef} 
      className="inline text-brand-forest align-middle mx-0.5" 
    />
  );
}

// Definitions for the parsed blocks
type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'code-block'; language: string; code: string }
  | { type: 'math-block'; formula: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

// Parsing function that scans markdown text line-by-line and groups them into blocks
function parseMarkdown(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split('\n');
  
  let currentBlock: any = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // --- 1. CODE BLOCK ---
    if (trimmed.startsWith('```')) {
      if (currentBlock && currentBlock.type === 'code-block') {
        blocks.push(currentBlock);
        currentBlock = null;
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        const lang = trimmed.slice(3).trim();
        currentBlock = { type: 'code-block', language: lang, code: '' };
      }
      continue;
    }
    
    if (currentBlock && currentBlock.type === 'code-block') {
      currentBlock.code += (currentBlock.code ? '\n' : '') + line;
      continue;
    }

    // --- 2. MATH BLOCK ($$ ... $$) ---
    // Handle single line math block: $$ formula $$
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'math-block', formula: trimmed.slice(2, -2).trim() });
      continue;
    }

    // Handle multiline math block starting with $$
    if (trimmed.startsWith('$$')) {
      if (currentBlock && currentBlock.type === 'math-block') {
        blocks.push(currentBlock);
        currentBlock = null;
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'math-block', formula: '' };
      }
      continue;
    }
    
    if (currentBlock && currentBlock.type === 'math-block') {
      if (trimmed.endsWith('$$')) {
        currentBlock.formula += (currentBlock.formula ? '\n' : '') + line.slice(0, line.length - 2);
        blocks.push(currentBlock);
        currentBlock = null;
      } else {
        currentBlock.formula += (currentBlock.formula ? '\n' : '') + line;
      }
      continue;
    }

    // Handle standard LaTeX block brackets: \[ ... \]
    if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'math-block', formula: trimmed.slice(2, -2).trim() });
      continue;
    }

    // --- 3. TABLES (| cell | cell |) ---
    if (trimmed.startsWith('|')) {
      const isSeparator = /^\|[\s\-\|:]+\|$/.test(trimmed);
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
      
      if (isSeparator) {
        continue; // skip separator lines, but table stays open
      }
      
      if (currentBlock && currentBlock.type === 'table') {
        currentBlock.rows.push(cells);
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'table', headers: cells, rows: [] };
      }
      continue;
    } else {
      if (currentBlock && currentBlock.type === 'table') {
        blocks.push(currentBlock);
        currentBlock = null;
      }
    }

    // --- 4. BLOCKQUOTE (> ...) ---
    if (trimmed.startsWith('>')) {
      const quoteText = line.replace(/^\s*>\s*/, '');
      if (currentBlock && currentBlock.type === 'blockquote') {
        currentBlock.text += '\n' + quoteText;
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'blockquote', text: quoteText };
      }
      continue;
    } else {
      if (currentBlock && currentBlock.type === 'blockquote') {
        blocks.push(currentBlock);
        currentBlock = null;
      }
    }

    // --- 5. LISTS (Bullet & Numbered) ---
    const bulletMatch = line.match(/^(\s*)([-*•+])\s+(.*)/);
    if (bulletMatch) {
      const text = bulletMatch[3];
      if (currentBlock && currentBlock.type === 'list' && !currentBlock.ordered) {
        currentBlock.items.push(text);
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'list', ordered: false, items: [text] };
      }
      continue;
    }

    const numberedMatch = line.match(/^(\s*)(\d+)[.)]\s+(.*)/);
    if (numberedMatch) {
      const text = numberedMatch[3];
      if (currentBlock && currentBlock.type === 'list' && currentBlock.ordered) {
        currentBlock.items.push(text);
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'list', ordered: true, items: [text] };
      }
      continue;
    }

    if (currentBlock && currentBlock.type === 'list') {
      blocks.push(currentBlock);
      currentBlock = null;
    }

    // --- 6. HEADINGS (# heading) ---
    if (trimmed.startsWith('#')) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        blocks.push({ type: 'heading', level, text });
        continue;
      }
    }

    // --- 7. EMPTY LINES ---
    if (!trimmed) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // --- 8. PARAGRAPHS ---
    if (currentBlock && currentBlock.type === 'paragraph') {
      currentBlock.text += '\n' + line;
    } else {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = { type: 'paragraph', text: line };
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

// Helper to determine if a matched dollar sign expression is actual math or currency/text
function isMathExpression(expr: string): boolean {
  const trimmed = expr.trim();
  if (!trimmed) return false;
  // If it contains a backslash, it's almost certainly a LaTeX command (e.g. \rho, \frac, \phi)
  if (trimmed.includes('\\')) return true;
  // If it has no spaces, it is highly likely to be math (e.g. $x$, $10$, $h_z$)
  if (!trimmed.includes(' ')) return true;
  // If it has spaces, look for common math indicators to avoid false positives (like currency ranges)
  return /[[\]{}_^=+\-*/<>~|]/.test(trimmed);
}

// Inline content renderer: parses math, bold, and code inside text strings
export function renderInlineContent(text: string): React.ReactNode {
  if (!text) return '';

  // Extract inline math: $...$ or \(...\)
  // The regex captures $ followed by any non-$ non-newline chars followed by $, 
  // or \( followed by any chars followed by \)
  const parts = text.split(/(\$(?:[^$\n])+?\$|\\\\?\((?:.+?)\\\\?\))/g);

  return parts.map((part, idx) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const formula = part.slice(1, -1);
      if (isMathExpression(formula)) {
        return <MathRenderer key={`math-${idx}`} formula={formula} block={false} />;
      }
    }
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const formula = part.slice(2, -2);
      return <MathRenderer key={`math-${idx}`} formula={formula} block={false} />;
    }

    return parseInlineMarkdown(part, idx);
  });
}

// Helper for bold, concept emphasis, and monospace formatting
function parseInlineMarkdown(text: string, parentKey: number) {
  // Split by bold (**bold** or __bold__), inline code (`code`), and single emphasis (*concept* or _concept_)
  const subParts = text.split(/(\*\*.*?\*\*|__.*?__|`.*?`|\*[^\*]+?\*|_[^_]+?_)/g);

  return (
    <React.Fragment key={parentKey}>
      {subParts.map((sub, idx) => {
        if (sub.startsWith('**') && sub.endsWith('**')) {
          return (
            <strong key={idx} className="font-extrabold text-brand-forest">
              {sub.slice(2, -2)}
            </strong>
          );
        }
        if (sub.startsWith('__') && sub.endsWith('__')) {
          return (
            <strong key={idx} className="font-extrabold text-brand-forest">
              {sub.slice(2, -2)}
            </strong>
          );
        }
        if (sub.startsWith('`') && sub.endsWith('`')) {
          return (
            <code key={idx} className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono text-brand-green border border-zinc-200/50 break-words whitespace-pre-wrap">
              {sub.slice(1, -1)}
            </code>
          );
        }
        if (sub.startsWith('*') && sub.endsWith('*')) {
          return (
            <mark key={idx} className="bg-brand-yellow/20 text-brand-forest font-bold px-1.5 py-0.5 rounded border border-brand-yellow/30 mx-0.5 inline-block sm:inline leading-none">
              {sub.slice(1, -1)}
            </mark>
          );
        }
        if (sub.startsWith('_') && sub.endsWith('_')) {
          return (
            <mark key={idx} className="bg-brand-yellow/20 text-brand-forest font-bold px-1.5 py-0.5 rounded border border-brand-yellow/30 mx-0.5 inline-block sm:inline leading-none">
              {sub.slice(1, -1)}
            </mark>
          );
        }
        return sub;
      })}
    </React.Fragment>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const blocks = parseMarkdown(content);

  return (
    <div className="space-y-4 text-left w-full max-w-full min-w-0 break-words text-[15px] sm:text-[16px] leading-relaxed text-brand-forest/90 font-normal">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            const hClass = 
              block.level === 1 
                ? 'text-2xl font-extrabold text-brand-forest mt-8 mb-4 border-b border-zinc-100 pb-2' 
                : block.level === 2 
                ? 'text-xl font-extrabold text-brand-forest mt-6 mb-3' 
                : block.level === 3 
                ? 'text-lg font-bold text-brand-forest mt-5 mb-2' 
                : 'text-base font-bold text-brand-forest mt-4 mb-2';
            const Tag = `h${Math.min(block.level, 4)}` as 'h1' | 'h2' | 'h3' | 'h4';
            return (
              <Tag key={idx} className={hClass}>
                {renderInlineContent(block.text)}
              </Tag>
            );
          }

          case 'list': {
            const ListTag = block.ordered ? 'ol' : 'ul';
            return (
              <ListTag key={idx} className="space-y-2.5 my-3 pl-1">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2.5">
                    {block.ordered ? (
                      <span className="font-extrabold text-brand-green shrink-0 mt-0.5 text-sm w-5 text-right">
                        {itemIdx + 1}.
                      </span>
                    ) : (
                      <span className="text-brand-green mt-2.5 shrink-0 w-2.5 h-2.5 rounded-full bg-brand-green/80" />
                    )}
                    <span className="flex-1 leading-relaxed text-[15px] sm:text-[16px]">
                      {renderInlineContent(item)}
                    </span>
                  </li>
                ))}
              </ListTag>
            );
          }

          case 'blockquote': {
            const rawText = block.text.trim();
            let calloutType: 'key' | 'tip' | 'analogy' | 'warning' | null = null;
            let displayHeader = '';
            let contentText = rawText;
            let themeClass = '';

            if (rawText.startsWith('[!KEY]')) {
              calloutType = 'key';
              displayHeader = '🔑 Key Takeaway';
              contentText = rawText.slice(6).trim();
              themeClass = 'border-[#3D5F30] bg-[#3D5F30]/5 text-[#3D5F30]';
            } else if (rawText.startsWith('[!TIP]')) {
              calloutType = 'tip';
              displayHeader = '💡 Study Tip';
              contentText = rawText.slice(6).trim();
              themeClass = 'border-amber-500 bg-amber-500/[0.03] text-amber-700';
            } else if (rawText.startsWith('[!ANALOGY]')) {
              calloutType = 'analogy';
              displayHeader = '🧠 Analogy';
              contentText = rawText.slice(10).trim();
              themeClass = 'border-brand-green/45 bg-[#F6F7F2]/60 text-brand-forest';
            } else if (rawText.startsWith('[!WARNING]')) {
              calloutType = 'warning';
              displayHeader = '⚠️ Watch Out';
              contentText = rawText.slice(10).trim();
              themeClass = 'border-rose-500 bg-rose-500/[0.02] text-rose-700';
            }

            if (calloutType) {
              return (
                <div 
                  key={idx} 
                  className={`border-l-4 pl-4 pr-3 py-3 rounded-r-2xl my-4 text-[15px] sm:text-[16px] leading-relaxed shadow-3xs ${themeClass}`}
                >
                  <div className="font-extrabold text-xs uppercase tracking-wider mb-1 select-none flex items-center gap-1.5">
                    {displayHeader}
                  </div>
                  <div className="text-brand-forest/90 font-normal">
                    {renderInlineContent(contentText)}
                  </div>
                </div>
              );
            }

            return (
              <blockquote key={idx} className="border-l-4 border-brand-green bg-brand-green/5 pl-4 pr-3 py-3 rounded-r-2xl italic my-4 text-brand-forest/90 text-[15px] sm:text-[16px] leading-relaxed">
                {renderInlineContent(block.text)}
              </blockquote>
            );
          }

          case 'code-block':
            return (
              <pre key={idx} className="my-4 p-4 bg-zinc-900 text-zinc-100 rounded-2xl overflow-x-auto text-[13px] font-mono border border-zinc-800 leading-normal select-all">
                <code>{block.code}</code>
              </pre>
            );

          case 'math-block':
            return <MathRenderer key={idx} formula={block.formula} block={true} />;

          case 'table':
            return (
              <div key={idx} className="overflow-x-auto my-5 border border-zinc-200 rounded-2xl shadow-3xs">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-5 py-3 text-left text-xs font-bold text-brand-forest uppercase tracking-wider">
                          {renderInlineContent(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-100">
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-50/50 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-5 py-3.5 text-[14px] sm:text-[15px] text-brand-forest">
                            {renderInlineContent(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'paragraph':
          default:
            return (
              <p key={idx} className="my-3 text-[15px] sm:text-[16px] leading-relaxed text-brand-forest/90 font-normal break-words">
                {renderInlineContent(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
