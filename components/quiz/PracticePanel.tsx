import React, { useState, useEffect, useRef } from 'react';
import { Award, ChevronRight, AlertCircle, FileQuestion, ChevronLeft, Loader2 } from 'lucide-react';
import { Quiz, Question } from '@/hooks/useSession';
import { renderInlineContent } from '@/components/tutor/MarkdownRenderer';
import { useStore } from '@/lib/store';

const cleanOptionText = (text: string) => {
  if (!text) return '';
  return text.replace(/^[a-zA-Z][\.\)]\s*/, '');
};

function isAnswerMatch(selected: string, correct: string, options?: string[], optionIdx?: number): boolean {
  if (!selected || !correct) return false;
  
  const cleanSel = selected.trim();
  const cleanCorr = correct.trim();
  
  if (cleanSel.toLowerCase() === cleanCorr.toLowerCase()) {
    return true;
  }

  // Boolean/True-False grading
  if (cleanCorr.toLowerCase() === 'true' || cleanCorr.toLowerCase() === 'false') {
    if (cleanSel.toLowerCase() === 't' && cleanCorr.toLowerCase() === 'true') return true;
    if (cleanSel.toLowerCase() === 'f' && cleanCorr.toLowerCase() === 'false') return true;
    return false;
  }
  
  const parseOption = (text: string) => {
    const match = text.match(/^([A-D])\s*[\.\)\:-]/i);
    if (match) {
      return {
        letter: match[1].toLowerCase(),
        text: text.slice(match[0].length).trim().toLowerCase()
      };
    }
    return {
      letter: '',
      text: text.trim().toLowerCase()
    };
  };
  
  const selParsed = parseOption(cleanSel);
  const corrParsed = parseOption(cleanCorr);
  
  if (corrParsed.letter && selParsed.letter && corrParsed.letter === selParsed.letter) {
    return true;
  }
  
  if (/^[A-D]\.?$/i.test(cleanCorr)) {
    const correctLetter = cleanCorr.replace(/[\.\)\:-]/g, '').trim().toLowerCase();
    if (selParsed.letter === correctLetter) {
      return true;
    }
  }

  if (/^[A-D]\.?$/i.test(cleanSel)) {
    const selectedLetter = cleanSel.replace(/[\.\)\:-]/g, '').trim().toLowerCase();
    if (corrParsed.letter === selectedLetter) {
      return true;
    }
  }

  // Match using options index if available
  if (options && options.length > 0) {
    const studentIdx = optionIdx !== undefined && optionIdx !== -1 ? optionIdx : options.findIndex(opt => opt.trim().toLowerCase() === cleanSel.toLowerCase());
    const correctIdx = options.findIndex(opt => opt.trim().toLowerCase() === cleanCorr.toLowerCase());

    const studentLetter = studentIdx !== -1 ? String.fromCharCode(97 + studentIdx) : null;
    const correctLetter = correctIdx !== -1 ? String.fromCharCode(97 + correctIdx) : null;

    const cleanCorrLetterOnly = cleanCorr.replace(/[\.\)\:-]/g, '').trim().toLowerCase();
    if (cleanCorrLetterOnly.length === 1 && studentLetter && cleanCorrLetterOnly === studentLetter) {
      return true;
    }

    const cleanSelLetterOnly = cleanSel.replace(/[\.\)\:-]/g, '').trim().toLowerCase();
    if (cleanSelLetterOnly.length === 1 && correctLetter && cleanSelLetterOnly === correctLetter) {
      return true;
    }

    if (studentLetter && correctLetter && studentLetter === correctLetter) {
      return true;
    }
  }
  
  const stripPrefix = (str: string) => str.replace(/^([A-D])\s*[\.\)\:-]\s*/i, '').trim().toLowerCase();
  if (stripPrefix(cleanSel) === stripPrefix(cleanCorr)) {
    return true;
  }
  
  return false;
}

interface PracticePanelProps {
  quiz: Quiz | null;
  selectedAnswers: Record<string, string>;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loadingQuiz: boolean;
  submittingQuiz: boolean;
  quizResult: any;
  onClose: () => void;
  onGenerateQuiz: (format?: string, numQuestions?: number, instructions?: string, isExam?: boolean) => void;
  onSubmitQuiz: (e: React.FormEvent) => void;
  isEmbed?: boolean;
  isExam?: boolean;
  onGradeQuestion?: (questionId: string, answer: string) => Promise<any>;
  onExplainQuestion?: (question: any, studentAnswer: string, correctAnswer: string) => void;
}

export default function PracticePanel({
  quiz,
  selectedAnswers,
  setSelectedAnswers,
  loadingQuiz,
  submittingQuiz,
  quizResult,
  onClose,
  onGenerateQuiz,
  onSubmitQuiz,
  isEmbed = false,
  isExam = false,
  onGradeQuestion,
  onExplainQuestion,
}: PracticePanelProps) {
  const user = useStore((state) => state.user);
  const [format, setFormat] = useState<'objective' | 'theory' | 'mixed' | 'story-based'>(isExam ? 'mixed' : 'objective');
  const [numQuestions, setNumQuestions] = useState<number>(isExam ? 10 : 5);
  const [instructions, setInstructions] = useState<string>('');
  const [examCountType, setExamCountType] = useState<'10' | '20' | '30' | 'custom'>(isExam ? '10' : '10');

  const [limitError, setLimitError] = useState<{ type: 'quiz' | 'exam'; remaining: string } | null>(null);

  const checkGenerationLimit = (type: 'quiz' | 'exam'): { limited: boolean; remainingTimeStr: string } => {
    const userPlan = user?.plan || 'free';
    const isPro = userPlan === 'plus' || userPlan === 'large';
    if (isPro) return { limited: false, remainingTimeStr: '' };

    const lastGenKey = type === 'exam' ? 'braudle_last_generated_exam' : 'braudle_last_generated_quiz';
    const lastGenTimeStr = localStorage.getItem(lastGenKey);
    if (!lastGenTimeStr) return { limited: false, remainingTimeStr: '' };

    const lastGenTime = Number(lastGenTimeStr);
    const now = Date.now();
    const cooldown = 3 * 24 * 60 * 60 * 1000; // 3 days in ms

    if (now - lastGenTime < cooldown) {
      const remainingMs = cooldown - (now - lastGenTime);
      const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
      let remainingStr = '';
      if (remainingHours >= 24) {
        const days = Math.floor(remainingHours / 24);
        const hours = remainingHours % 24;
        remainingStr = `${days}d ${hours}h`;
      } else {
        remainingStr = `${remainingHours}h`;
      }
      return { limited: true, remainingTimeStr: remainingStr };
    }

    return { limited: false, remainingTimeStr: '' };
  };

  useEffect(() => {
    if (!isExam) {
      setFormat('objective');
    } else {
      setFormat('mixed');
    }
    setLimitError(null);
  }, [isExam]);

  // Pagination index
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  
  // Real-time graded questions cache
  const [gradedQuestions, setGradedQuestions] = useState<Record<string, {
    isCorrect: boolean;
    feedback: string;
    correctAnswer: string;
    explanation: string;
  }>>({});

  // Local grading status indicators
  const [isGradingTheory, setIsGradingTheory] = useState<boolean>(false);
  
  // Custom theory input answer
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({});

  // Hint collapsible state
  const [isHintOpen, setIsHintOpen] = useState<boolean>(false);

  // Keep track of the active quiz ID to prevent resetting pagination index when the parent updates the quiz object
  const previousQuizIdRef = useRef<string | null>(null);

  // Sync state with quiz when it loads or changes
  useEffect(() => {
    if (quiz) {
      const graded: typeof gradedQuestions = {};
      const selectAns: typeof selectedAnswers = {};
      const theoryAns: Record<string, string> = {};

      quiz.questions.forEach(q => {
        if (q.studentAnswer) {
          selectAns[q._id] = q.studentAnswer;
          theoryAns[q._id] = q.studentAnswer;
          graded[q._id] = {
            isCorrect: !!q.isCorrect,
            feedback: q.feedback || '',
            correctAnswer: q.answer || '',
            explanation: q.explanation || ''
          };
        }
      });

      setGradedQuestions(graded);
      setSelectedAnswers(selectAns);
      setTheoryAnswers(theoryAns);
      
      const quizId = quiz._id || (quiz as any).id || null;
      if (previousQuizIdRef.current !== quizId) {
        setCurrentQuestionIdx(0);
        previousQuizIdRef.current = quizId;
      }
      setIsHintOpen(false);
    } else {
      setGradedQuestions({});
      setSelectedAnswers({});
      setTheoryAnswers({});
      setCurrentQuestionIdx(0);
      previousQuizIdRef.current = null;
      setIsHintOpen(false);
    }
  }, [quiz, setSelectedAnswers]);

  // Handle MCQ/True-False selection and instant grade
  const handleSelectOption = async (questionId: string, option: string) => {
    if (gradedQuestions[questionId] || !onGradeQuestion) return;
    
    // Set immediate local selected answer
    setSelectedAnswers(prev => ({ ...prev, [questionId]: option }));
    
    // Call backend grade endpoint
    const res = await onGradeQuestion(questionId, option);
    if (res) {
      setGradedQuestions(prev => ({
        ...prev,
        [questionId]: {
          isCorrect: res.isCorrect,
          feedback: res.feedback,
          correctAnswer: res.correctAnswer,
          explanation: res.explanation
        }
      }));
    }
  };

  // Handle Theory response instant grade submit
  const handleSubmitTheoryAnswer = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    const answerText = theoryAnswers[questionId]?.trim();
    if (!answerText || gradedQuestions[questionId] || !onGradeQuestion || isGradingTheory) return;

    setIsGradingTheory(true);
    // Set local selected answer
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerText }));
    
    const res = await onGradeQuestion(questionId, answerText);
    if (res) {
      setGradedQuestions(prev => ({
        ...prev,
        [questionId]: {
          isCorrect: res.isCorrect,
          feedback: res.feedback,
          correctAnswer: res.correctAnswer,
          explanation: res.explanation
        }
      }));
    }
    setIsGradingTheory(false);
  };

  // Make sure numQuestions doesn't exceed 15 for exam when toggled
  useEffect(() => {
    if (isExam && numQuestions > 15) {
      setNumQuestions(15);
    }
  }, [isExam, numQuestions]);

  // Calculate correct question count
  const correctCount = Object.values(gradedQuestions).filter(g => g.isCorrect).length;

  const content = (
    <div className="flex flex-col h-full justify-between">
      
      {/* Panel Top Nav Bar (Only shown when not embedded) */}
      {!isEmbed && (
        <div className="flex items-center justify-between pb-4 border-b border-gray-50 mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-brand-green" />
            <span className="font-bold text-sm text-brand-forest">
              {isExam ? 'Exam Simulation' : 'Practice Questions'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl border border-gray-150 text-gray-400 hover:text-brand-forest hover:bg-gray-50 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {loadingQuiz ? (
        <div className="flex-1 flex flex-col justify-center items-center h-full space-y-4 py-12 select-none text-center">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-zinc-100 border-t-brand-green animate-spin" />
            <FileQuestion className="w-5 h-5 text-brand-green animate-pulse" />
          </div>
          <div className="space-y-1">
            <h5 className="font-extrabold text-sm text-brand-forest">
              {isExam ? 'Generating Exam Simulation' : 'Generating Practice Arena'}
            </h5>
            <p className="text-[10px] text-gray-400 max-w-[200px] leading-relaxed">
              Analyzing notes content & crafting custom pedagogical questions...
            </p>
          </div>
        </div>
      ) : quiz ? (
        /* Render Active Practice Quiz - Paginated (one question at a time) */
        <div className="flex-1 flex flex-col justify-between h-full min-h-0">
          
          {/* Header Progress Info */}
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3 border-b border-zinc-100 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green">
                {quiz.isExam ? 'EXAM' : 'PRACTICE'}
              </span>
              <span>•</span>
              <span>Question {currentQuestionIdx + 1} of {quiz.totalQuestions}</span>
            </div>
            <span className="text-brand-green font-extrabold bg-brand-green/5 px-2.5 py-0.5 rounded-full">
              Score: {correctCount} / {quiz.totalQuestions} Correct
            </span>
          </div>

          {/* Core Question Layout (Scrollable middle container) */}
          <div className="flex-1 overflow-y-auto py-5 space-y-5 text-left min-h-0 pr-1">
            {(() => {
              const q = quiz.questions[currentQuestionIdx];
              if (!q) return null;
              
              const gradeInfo = gradedQuestions[q._id];
              const hasBeenGraded = !!gradeInfo;
              
              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Question Text */}
                  <h4 className="font-extrabold text-[17px] sm:text-xl text-brand-forest leading-relaxed">
                    {renderInlineContent(q.question)}
                  </h4>

                  {/* MCQ Options / Theory inputs */}
                  {q.options && q.options.length > 0 ? (
                    <div className="space-y-3">
                      {q.options.map((option, idx) => {
                        const isSelected = selectedAnswers[q._id] === option;
                        const isCorrectAnswer = isAnswerMatch(option, gradeInfo?.correctAnswer || q.answer || '', q.options, idx);

                        const optionText = cleanOptionText(option);
                        const letter = String.fromCharCode(65 + idx); // A, B, C, D...

                        let cardStyle = 'border-gray-150 bg-white text-brand-forest hover:border-zinc-300';
                        if (hasBeenGraded) {
                          if (isCorrectAnswer) {
                            cardStyle = 'bg-[#E6F4EA] border-[#34A853]/45 text-[#137333] border-2';
                          } else if (isSelected) {
                            cardStyle = 'bg-[#FCE8E6] border-[#D93025]/45 text-[#C5221F] border-2';
                          } else {
                            cardStyle = 'border-gray-150 bg-white text-gray-300 opacity-60 pointer-events-none';
                          }
                        } else if (isSelected) {
                          cardStyle = 'border-brand-green bg-brand-green/5 text-brand-green font-semibold';
                        }

                        return (
                          <div
                            key={option}
                            onClick={() => handleSelectOption(q._id, option)}
                            className={`w-full p-4 rounded-2xl border text-left text-sm sm:text-base font-semibold transition-all cursor-pointer shadow-3xs ${cardStyle}`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Option Prefix Letter */}
                              <span className="font-extrabold uppercase shrink-0 mt-0.5 opacity-60">
                                {letter}.
                              </span>
                              
                              <div className="flex-1 min-w-0">
                                <div>{renderInlineContent(optionText)}</div>
                                
                                {/* Right Answer explanation box nested inside correct option card */}
                                {hasBeenGraded && isCorrectAnswer && (
                                  <div className="mt-3 pt-3 border-t border-[#34A853]/15 text-xs sm:text-sm text-[#137333]/90 font-medium leading-relaxed animate-in fade-in duration-200">
                                    <div className="font-extrabold mb-1">✓ Right answer</div>
                                    {renderInlineContent(gradeInfo.explanation || q.explanation || '')}
                                  </div>
                                )}

                                {/* Not Quite feedback box nested inside incorrect option card */}
                                {hasBeenGraded && isSelected && !isCorrectAnswer && (
                                  <div className="mt-3 pt-3 border-t border-[#D93025]/15 text-xs sm:text-sm text-[#C5221F]/90 font-medium leading-relaxed animate-in fade-in duration-200">
                                    <div className="font-extrabold mb-1">✕ Not quite</div>
                                    {renderInlineContent(gradeInfo.feedback || '')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Subjective theory answer input box */
                    <form onSubmit={(e) => handleSubmitTheoryAnswer(e, q._id)} className="space-y-4">
                      {hasBeenGraded ? (
                        <div className="space-y-4">
                          {/* Student Answer */}
                          <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50 text-sm font-medium text-brand-forest">
                            <span className="text-[10px] font-extrabold text-gray-400 block mb-1.5 uppercase">Your Response:</span>
                            <p>{theoryAnswers[q._id] || ''}</p>
                          </div>

                          {/* Evaluation Card */}
                          <div className={`p-4 border rounded-2xl text-sm sm:text-base font-medium leading-relaxed shadow-3xs ${
                            gradeInfo.isCorrect 
                              ? 'bg-[#E6F4EA] border-[#34A853]/45 text-[#137333]' 
                              : 'bg-[#FCE8E6] border-[#D93025]/45 text-[#C5221F]'
                          }`}>
                            <div className="font-extrabold mb-1">
                              {gradeInfo.isCorrect ? '✓ Right answer' : '✕ Not quite'}
                            </div>
                            <div className="mt-1">{renderInlineContent(gradeInfo.feedback)}</div>
                            {!gradeInfo.isCorrect && gradeInfo.correctAnswer && (
                              <div className="mt-2.5 pt-2.5 border-t border-[#D93025]/15">
                                <span className="font-extrabold text-[10px] uppercase block mb-1">Expected Answer:</span>
                                <div className="font-normal opacity-90">{renderInlineContent(gradeInfo.correctAnswer)}</div>
                              </div>
                            )}
                            {gradeInfo.explanation && (
                              <div className={`mt-2.5 pt-2.5 border-t ${
                                gradeInfo.isCorrect ? 'border-[#34A853]/15' : 'border-[#D93025]/15'
                              }`}>
                                <span className="font-extrabold text-[10px] uppercase block mb-1">Explanation:</span>
                                <div className="font-normal opacity-90">{renderInlineContent(gradeInfo.explanation)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          <textarea
                            required
                            disabled={isGradingTheory}
                            value={theoryAnswers[q._id] || ''}
                            onChange={(e) => setTheoryAnswers(prev => ({ ...prev, [q._id]: e.target.value }))}
                            placeholder="Write your explanation here..."
                            className="w-full h-28 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-sm sm:text-base font-medium text-brand-forest focus:border-brand-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green transition-all disabled:opacity-65"
                          />
                          <button
                            type="submit"
                            disabled={isGradingTheory || !theoryAnswers[q._id]?.trim()}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-green hover:bg-brand-green/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs active:scale-[0.98]"
                          >
                            {isGradingTheory ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Evaluating Answer...</span>
                              </>
                            ) : (
                              <span>Submit Answer</span>
                            )}
                          </button>
                        </div>
                      )}
                    </form>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Sticky Bottom Actions Container: Collapse Hint & Pagination Controls */}
          <div className="border-t border-zinc-100 pt-4 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              {/* Left Side: Hint (if not graded) or Explain (if graded) */}
              <div>
                {(() => {
                  const q = quiz.questions[currentQuestionIdx];
                  if (!q) return null;
                  const gradeInfo = gradedQuestions[q._id];
                  const hasBeenGraded = !!gradeInfo;

                  if (hasBeenGraded) {
                    return onExplainQuestion ? (
                      <button
                        type="button"
                        onClick={() => {
                          const studentAns = selectedAnswers[q._id] || theoryAnswers[q._id] || '';
                          onExplainQuestion(q, studentAns, gradeInfo.correctAnswer || q.answer || '');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-[11px] font-bold text-gray-600 transition-all cursor-pointer shadow-3xs"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>Explain</span>
                      </button>
                    ) : null;
                  }

                  return (
                    <button
                      type="button"
                      onClick={() => setIsHintOpen(!isHintOpen)}
                      className="flex items-center gap-1 text-[11px] font-black text-gray-400 hover:text-brand-forest transition-colors cursor-pointer select-none uppercase tracking-wider animate-in fade-in"
                    >
                      <span>Hint</span>
                      <svg className={`w-3.5 h-3.5 transition-transform ${isHintOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  );
                })()}
              </div>

              {/* Right Side: Navigation Buttons */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={currentQuestionIdx === 0}
                  onClick={() => {
                    setIsHintOpen(false);
                    setCurrentQuestionIdx(prev => Math.max(0, prev - 1));
                  }}
                  className="px-5 py-2.5 text-xs font-bold border border-zinc-200 hover:border-zinc-300 text-zinc-600 bg-white rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentQuestionIdx === quiz.questions.length - 1}
                  onClick={() => {
                    setIsHintOpen(false);
                    setCurrentQuestionIdx(prev => Math.min(quiz.questions.length - 1, prev + 1));
                  }}
                  className="px-6 py-2.5 text-xs font-extrabold bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none shadow-3xs active:scale-[0.98]"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Hint dropdown under the actions bar */}
            {isHintOpen && !gradedQuestions[quiz.questions[currentQuestionIdx]?._id] && (
              <div className="p-3.5 bg-zinc-50 border border-zinc-200/40 rounded-xl text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-sm animate-in fade-in duration-200 text-left">
                💡 Focus on the concepts of <strong className="text-zinc-600 font-semibold">{quiz.questions[currentQuestionIdx]?.topic || 'this section'}</strong>. Review how this fits into the document summary equations.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Setup Form Configuration state */
        <div className="flex-1 flex flex-col justify-start text-left space-y-6 animate-in fade-in duration-200">
          <div className="space-y-2">
            <h4 className="font-extrabold text-base text-brand-forest">
              {isExam ? 'Setup Exam Simulator' : 'Setup Practice Arena'}
            </h4>
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
              Tailor the AI Tutor questions to test your learning style and goals.
            </p>
          </div>

          <div className="space-y-4">
            {/* Format choice */}
            {isExam && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">
                  Question Format
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'objective', label: '🔘 Objective / MCQ', desc: 'Rigorous option-based recall and concept testing.' },
                    { id: 'theory', label: '✍️ Theory / Subjective', desc: 'Detailed conceptual questions requiring written essays.' },
                    { id: 'mixed', label: '🎯 Mixed formats', desc: 'A blended variation of objective and theory exercises.' },
                    { id: 'story-based', label: '📖 Story-based Scenario', desc: 'Tricky real-world narrative questions testing deep thinking.' }
                  ].map((item) => {
                    const isSelected = format === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormat(item.id as any)}
                        className={`p-3.5 border rounded-2xl text-left transition-all cursor-pointer group flex flex-col w-full ${
                          isSelected 
                            ? 'border-brand-green bg-brand-green/5' 
                            : 'border-gray-150 bg-white hover:bg-gray-50/40'
                        }`}
                      >
                        <span className="font-bold text-xs text-brand-forest block">
                          {item.label}
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium mt-0.5 leading-normal">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Questions count */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">
                  {isExam ? 'Exam Question Count' : 'Practice Guide Length'}
                </label>
                <span className="text-[10px] font-extrabold text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded-full">
                  {numQuestions} questions
                </span>
              </div>

              {!isExam ? (
                // Practice Guide: Quick (5), Standard (10), Comprehensive (15)
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 5, label: 'Quick', desc: '5 Qs' },
                    { id: 10, label: 'Standard', desc: '10 Qs' },
                    { id: 15, label: 'Comprehensive', desc: '15 Qs' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNumQuestions(c.id)}
                      className={`py-3 px-2 border rounded-xl flex flex-col items-center justify-center transition-all ${
                        numQuestions === c.id
                          ? 'border-brand-green bg-brand-green/5 text-brand-green'
                          : 'border-gray-150 bg-white text-brand-forest hover:bg-gray-50/40'
                      }`}
                    >
                      <span className="font-bold text-[11px]">{c.label}</span>
                      <span className="text-[8px] text-gray-400 font-semibold mt-0.5">{c.desc}</span>
                    </button>
                  ))}
                </div>
              ) : (
                // Exam Prep: 10, 20, 30, Custom
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: '10', label: '10 Qs' },
                      { id: '20', label: '20 Qs' },
                      { id: '30', label: '30 Qs' },
                      { id: 'custom', label: 'Custom' }
                    ].map((c) => {
                      const isSelected = examCountType === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setExamCountType(c.id as any);
                            if (c.id !== 'custom') {
                              setNumQuestions(Number(c.id));
                            }
                          }}
                          className={`py-3 px-1.5 border rounded-xl flex flex-col items-center justify-center transition-all ${
                            isSelected
                              ? 'border-brand-green bg-brand-green/5 text-brand-green'
                              : 'border-gray-150 bg-white text-brand-forest hover:bg-gray-50/40'
                          }`}
                        >
                          <span className="font-bold text-[11px]">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {examCountType === 'custom' && (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="5"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-green"
                      />
                      <div className="flex justify-between text-[8px] font-bold text-gray-400 px-1 uppercase tracking-wider">
                        <span>5 Qs</span>
                        <span>25 Qs</span>
                        <span>50 Qs</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom focus instructions */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">
                Custom Focus / Instructions (Optional)
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Focus on key formulas or Section 3..."
                className="w-full p-3 border border-gray-150 rounded-xl bg-white text-xs font-medium text-brand-forest focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
              />
            </div>
          </div>

          {limitError ? (
            <div className="p-4 bg-rose-50 border border-rose-150/40 rounded-2xl text-left space-y-3 animate-in fade-in duration-200 mt-4">
              <div className="flex gap-2 text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs font-bold leading-normal">
                  Limit reached for {limitError.type === 'exam' ? 'Exam Prep' : 'Practice Guide'} generation!
                </div>
              </div>
              <p className="text-[10px] text-rose-600/90 leading-relaxed">
                Free tier users can only generate one {limitError.type === 'exam' ? 'exam' : 'practice guide'} every 3 days. 
                You can generate another in <span className="font-extrabold">{limitError.remaining}</span>, or upgrade plan for instant access!
              </p>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/#pricing';
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center active:scale-[0.98] shadow-3xs"
              >
                Upgrade Plan
              </button>
            </div>
          ) : (
            <button
              onClick={async () => {
                const check = checkGenerationLimit(isExam ? 'exam' : 'quiz');
                if (check.limited) {
                  setLimitError({ type: isExam ? 'exam' : 'quiz', remaining: check.remainingTimeStr });
                  return;
                }
                try {
                  await onGenerateQuiz(format, numQuestions, instructions, isExam);
                  const lastGenKey = isExam ? 'braudle_last_generated_exam' : 'braudle_last_generated_quiz';
                  localStorage.setItem(lastGenKey, Date.now().toString());
                } catch (err: any) {
                  const msg = err.message || '';
                  const match = msg.match(/Available in (.*)\./i) || msg.match(/in (.*)\./i);
                  const remainingTime = match ? match[1] : '3d 0h';
                  setLimitError({ type: isExam ? 'exam' : 'quiz', remaining: remainingTime });
                }
              }}
              disabled={loadingQuiz}
              className="w-full py-3.5 bg-brand-green hover:bg-brand-green/90 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs mt-4 flex items-center justify-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed"
            >
              <FileQuestion className="w-4 h-4" />
              <span>{loadingQuiz ? 'Generating...' : `Generate ${isExam ? 'Exam questions' : 'Practice questions'}`}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (isEmbed) {
    return <div className="flex-1 flex flex-col justify-between h-full">{content}</div>;
  }

  return (
    <aside className="absolute inset-y-0 right-0 w-full md:relative md:w-96 border-l border-gray-100 bg-white p-6 flex flex-col justify-between overflow-y-auto shrink-0 z-40 animate-in slide-in-from-right-4 duration-300 text-left">
      {content}
    </aside>
  );
}
