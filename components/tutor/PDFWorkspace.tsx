'use client';

import React, { useRef, useState, useEffect } from 'react';
import { List } from 'react-window';
// @ts-ignore
import * as pdfjs from 'pdfjs-dist';
import { useFloating, shift, flip, offset, inline } from '@floating-ui/react';
import { FileText, Sparkles, X, Award } from 'lucide-react';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

// Set up the PDF.js worker using standard cdnjs
const pdfjsVersion = '6.1.200';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`;

interface PDFWorkspaceProps {
  documentId: string;
  onExplainSelection: (text: string) => void;
  onExplainPage?: (pageNum: number, pageText: string) => void;
  onGenerateQuizPage?: (pageNum: number, pageText: string) => void;
  onGenerateFlashcardsPage?: (pageNum: number, pageText: string) => void;
  onClose?: () => void;
  isActive?: boolean;
  docTitle?: string;
  isChatAgentOpen?: boolean;
  onToggleChatAgent?: () => void;
  targetPage?: number | null;
  onClearTargetPage?: () => void;
}

export default function PDFWorkspace({ 
  documentId, 
  onExplainSelection, 
  onExplainPage,
  onGenerateQuizPage,
  onGenerateFlashcardsPage,
  onClose,
  isActive = true,
  docTitle = 'Document',
  isChatAgentOpen = false,
  onToggleChatAgent,
  targetPage = null,
  onClearTargetPage
}: PDFWorkspaceProps) {
  const [pdf, setPdf] = useState<any>(null);
  const [selectedText, setSelectedText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<any>(null);
  const [visiblePage, setVisiblePage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ height: 600, width: 320 });
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });

  useEffect(() => {
    if (targetPage !== null && targetPage > 0 && targetPage <= (pdf?.numPages || 1)) {
      if (listRef.current) {
        try {
          listRef.current.scrollToItem(targetPage - 1, "center");
        } catch (err) {
          // Safe check
        }
      }
      if (onClearTargetPage) {
        onClearTargetPage();
      }
    }
  }, [targetPage, pdf]);

  useEffect(() => {
    if (!pdf) return;
    pdf.getPage(1).then((page: any) => {
      const viewport = page.getViewport({ scale: 1 });
      setPageSize({ width: viewport.width, height: viewport.height });
    }).catch((err: any) => {
      console.error('[PDF WORKSPACE] Failed to read page 1 size:', err);
    });
  }, [pdf]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { height, width } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ height, width });
      }
    });

    resizeObserver.observe(container);

    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ height: rect.height, width: rect.width });
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isActive]);

  const horizontalMargin = dimensions.width < 640 ? 16 : 48;
  const targetWidth = dimensions.width - horizontalMargin;
  const targetHeight = targetWidth * (pageSize.height / pageSize.width);
  const calculatedRowHeight = targetHeight + 36;

  // Floating UI configurations for floating toolbar
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(10), flip(), shift(), inline()],
  });

  useEffect(() => {
    let active = true;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch secure pre-signed R2 URL from backend
        const response: any = await api.get(`/documents/${documentId}/view`);
        const { viewUrl } = response;

        if (!active) return;

        const loadingTask = pdfjs.getDocument({
          url: viewUrl,
          withCredentials: false
        });
        
        const loadedPdf = await loadingTask.promise;
        if (active) {
          setPdf(loadedPdf);
        }
      } catch (err: any) {
        console.error('[PDF WORKSPACE] Failed to load PDF:', err);
        if (active) {
          setError(err.message || 'Failed to render PDF document. Please try again.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      active = false;
    };
  }, [documentId]);

  useEffect(() => {
    if (listRef.current) {
      try {
        listRef.current.resetAfterIndex(0);
      } catch (err) {
        // Safe check
      }
    }
  }, [dimensions.width, calculatedRowHeight]);

  // Document Mouse Selection Event Listener for popup toolbar
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        setSelectedText(text);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    const handleMouseDown = () => {
      setIsOpen(false);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Row Renderer for virtualization
  const PageRow = ({ 
    index, 
    style, 
    ariaAttributes 
  }: { 
    index: number; 
    style: React.CSSProperties; 
    ariaAttributes: {
      "aria-posinset": number;
      "aria-setsize": number;
      role: "listitem";
    };
  }) => {
    const pageNum = index + 1;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const textLayerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!pdf) return;

      let active = true;
      let renderTask: any = null;
      let textLayerInstance: any = null;

      const renderPage = async () => {
        try {
          const page = await pdf.getPage(pageNum);
          if (!active) return;

          // Calculate scale based on container dimensions
          const horizontalMargin = dimensions.width < 640 ? 16 : 48;
          const targetWidth = dimensions.width - horizontalMargin;
          const computedScale = targetWidth / pageSize.width;

          const viewport = page.getViewport({ scale: computedScale });

          const canvas = canvasRef.current;
          if (!canvas) return;

          const context = canvas.getContext('2d');
          if (!context) return;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (!active) return;

          // Render canvas visual layer
          renderTask = page.render({
            canvasContext: context,
            viewport: viewport,
          });

          await renderTask.promise;
          if (!active) return;

          // Render transparent selection layer overlay
          const textContent = await page.getTextContent();
          if (!active) return;

          const textLayer = textLayerRef.current;
          if (textLayer) {
            textLayer.innerHTML = '';
            textLayer.style.height = `${viewport.height}px`;
            textLayer.style.width = `${viewport.width}px`;

            textLayerInstance = new pdfjs.TextLayer({
              textContentSource: textContent,
              container: textLayer,
              viewport: viewport,
            });
            await textLayerInstance.render();
          }
        } catch (e: any) {
          if (e.name !== 'RenderingCancelledException' && active) {
            console.error('[PDF WORKER PAGE] Render failed:', e.message);
          }
        }
      };

      renderPage();

      return () => {
        active = false;
        if (renderTask) {
          renderTask.cancel();
        }
        if (textLayerInstance) {
          textLayerInstance.cancel();
        }
      };
    }, [pdf, pageNum, pageSize, dimensions.width]);

    const horizontalMargin = dimensions.width < 640 ? 16 : 48;
    const computedWidth = dimensions.width - horizontalMargin;

    return (
      <div 
        {...ariaAttributes}
        style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '24px' }}
      >
        <div className="mb-2 text-[10px] font-black text-zinc-400 select-none uppercase tracking-widest">
          Page {pageNum} of {pdf.numPages}
        </div>
        <div 
          className="relative bg-white rounded-2xl overflow-hidden border border-zinc-200/50 shadow-2xs select-text max-w-full"
          style={{ height: 'fit-content', width: computedWidth }}
        >
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} />
          {/* Overlay text selection layer */}
          <div
            ref={textLayerRef}
            className="textLayer absolute inset-0 select-text pointer-events-auto opacity-0"
            style={{
              mixBlendMode: 'multiply',
              cursor: 'text',
            }}
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in fade-in duration-300">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-100 border-t-brand-green animate-spin" />
          <Logo size={42} className="animate-pulse object-contain" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-brand-forest text-sm">Opening Study Source...</h3>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Loading PDF pages</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-brand-forest text-sm">Could not read notes</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const handleActivePageAction = async (action: 'explain' | 'quiz' | 'flashcards') => {
    if (!pdf) return;
    try {
      setActionLoading(true);
      const page = await pdf.getPage(visiblePage);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      
      if (action === 'explain' && onExplainPage) {
        onExplainPage(visiblePage, pageText);
      } else if (action === 'quiz' && onGenerateQuizPage) {
        onGenerateQuizPage(visiblePage, pageText);
      } else if (action === 'flashcards' && onGenerateFlashcardsPage) {
        onGenerateFlashcardsPage(visiblePage, pageText);
      }
    } catch (err) {
      console.error(`[PDF WORKSPACE] Failed to run active page action ${action}:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-zinc-55/30 relative w-full max-w-full">
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2 font-sans select-none">
        {onToggleChatAgent && (
          <button
            onClick={onToggleChatAgent}
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs ${
              isChatAgentOpen 
                ? 'bg-brand-green border-brand-green text-white font-bold'
                : 'bg-white border-zinc-200 text-zinc-400 hover:text-brand-forest hover:bg-zinc-50'
            }`}
            title={isChatAgentOpen ? "Close PDF chat assistant" : "Open PDF chat assistant"}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isChatAgentOpen ? 'fill-white text-white' : 'text-zinc-400'}`} />
            <span>AI Chat</span>
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white text-zinc-400 hover:text-brand-forest border border-zinc-200/50 shadow-3xs cursor-pointer active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div ref={containerRef} className="flex-grow overflow-hidden select-text w-full h-full max-w-full">
        {pdf && (
          <List
            listRef={listRef}
            rowCount={pdf.numPages}
            rowHeight={calculatedRowHeight}
            rowComponent={PageRow}
            rowProps={{}}
            className="scrollbar-thin py-4 animate-in fade-in duration-300"
            style={{ height: '100%', width: '100%' }}
            onRowsRendered={({ startIndex }) => {
              setVisiblePage(startIndex + 1);
            }}
          />
        )}
      </div>

      {/* Floating Active Page Action Tray */}
      {pdf && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/95 backdrop-blur-md text-white rounded-full py-1.5 pl-4 pr-1.5 flex items-center gap-3.5 shadow-lg border border-zinc-700/80 select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300 shrink-0">
            Page {visiblePage} of {pdf.numPages}
          </span>
          
          <span className="w-[1px] h-4 bg-zinc-700 shrink-0" />
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleActivePageAction('explain')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-brand-lime hover:bg-white/10 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 fill-brand-lime text-brand-lime shrink-0" />
              <span>Explain</span>
            </button>
            
            <button
              onClick={() => handleActivePageAction('quiz')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/10 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <FileText className="w-3 h-3 text-zinc-300 shrink-0" />
              <span>Quiz</span>
            </button>
            
            <button
              onClick={() => handleActivePageAction('flashcards')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/10 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <Award className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Selection Toolbar Portal */}
      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="bg-brand-charcoal text-white px-4 py-2.5 rounded-2xl flex items-center gap-3.5 shadow-lg border border-brand-green/20 z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          <button
            onClick={() => {
              onExplainSelection(selectedText);
              setIsOpen(false);
              window.getSelection()?.removeAllRanges();
            }}
            className="flex items-center gap-2 hover:text-brand-lime text-xs font-black uppercase tracking-wider cursor-pointer transition-all active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5 fill-brand-lime text-brand-lime shrink-0" />
            <span>Explain Selection</span>
          </button>
          
          <span className="text-zinc-700 font-normal">|</span>
          
          <button
            onClick={() => {
              setIsOpen(false);
              window.getSelection()?.removeAllRanges();
            }}
            className="text-[10px] text-zinc-400 hover:text-white font-extrabold uppercase tracking-widest cursor-pointer transition-all"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
