'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, FileQuestion, Loader2, Clock, BookOpen, RotateCcw, MessageCircle, X } from 'lucide-react';
import { Quiz, Question, WeakTopic } from '@/hooks/useSession';
import { renderInlineContent } from '@/components/tutor/MarkdownRenderer';
import { useStore } from '@/lib/store';

/* ─── Utility helpers ─────────────────────────────────────────── */

const cleanOptionText = (text: string) => {
  if (!text) return '';
  return text.replace(/^[a-zA-Z][\.\)]\s*/, '');
};

function isAnswerMatch(selected: string, correct: string, options?: string[], optionIdx?: number): boolean {
  if (!selected || !correct) return false;
  const cleanSel = selected.trim();
  const cleanCorr = correct.trim();
  if (cleanSel.toLowerCase() === cleanCorr.toLowerCase()) return true;
  if (cleanCorr.toLowerCase() === 'true' || cleanCorr.toLowerCase() === 'false') {
    if (cleanSel.toLowerCase() === 't' && cleanCorr.toLowerCase() === 'true') return true;
    if (cleanSel.toLowerCase() === 'f' && cleanCorr.toLowerCase() === 'false') return true;
    return false;
  }
  const parseOption = (text: string) => {
    const match = text.match(/^([A-D])\s*[\.\)\:-]/i);
    if (match) return { letter: match[1].toLowerCase(), text: text.slice(match[0].length).trim().toLowerCase() };
    return { letter: '', text: text.trim().toLowerCase() };
  };
  const selParsed = parseOption(cleanSel);
  const corrParsed = parseOption(cleanCorr);
  if (corrParsed.letter && selParsed.letter && corrParsed.letter === selParsed.letter) return true;
  if (/^[A-D]\.?$/i.test(cleanCorr)) {
    if (selParsed.letter === cleanCorr.replace(/[\.\)\:-]/g, '').trim().toLowerCase()) return true;
  }
  if (/^[A-D]\.?$/i.test(cleanSel)) {
    if (corrParsed.letter === cleanSel.replace(/[\.\)\:-]/g, '').trim().toLowerCase()) return true;
  }
  if (options && options.length > 0) {
    const studentIdx = optionIdx !== undefined && optionIdx !== -1 ? optionIdx : options.findIndex(o => o.trim().toLowerCase() === cleanSel.toLowerCase());
    const correctIdx = options.findIndex(o => o.trim().toLowerCase() === cleanCorr.toLowerCase());
    const sL = studentIdx !== -1 ? String.fromCharCode(97 + studentIdx) : null;
    const cL = correctIdx !== -1 ? String.fromCharCode(97 + correctIdx) : null;
    const cClean = cleanCorr.replace(/[\.\)\:-]/g, '').trim().toLowerCase();
    if (cClean.length === 1 && sL && cClean === sL) return true;
    const sClean = cleanSel.replace(/[\.\)\:-]/g, '').trim().toLowerCase();
    if (sClean.length === 1 && cL && sClean === cL) return true;
    if (sL && cL && sL === cL) return true;
  }
  const strip = (s: string) => s.replace(/^([A-D])\s*[\.\)\:-]\s*/i, '').trim().toLowerCase();
  return strip(cleanSel) === strip(cleanCorr);
}

function getGradeData(score: number): { grade: string; label: string; ringColor: string; textColor: string; bg: string; border: string } {
  if (score >= 90) return { grade: 'A', label: 'Outstanding', ringColor: '#006B3F', textColor: 'text-brand-green', bg: 'bg-brand-lime/30', border: 'border-brand-lime' };
  if (score >= 80) return { grade: 'B', label: 'Great work', ringColor: '#006B3F', textColor: 'text-brand-green', bg: 'bg-brand-lime/20', border: 'border-brand-lime/60' };
  if (score >= 70) return { grade: 'C', label: 'Good effort', ringColor: '#FFC527', textColor: 'text-amber-700', bg: 'bg-brand-yellow/20', border: 'border-brand-yellow/60' };
  if (score >= 60) return { grade: 'D', label: 'Keep studying', ringColor: '#f97316', textColor: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
  return { grade: 'F', label: 'Review & retry', ringColor: '#dc2626', textColor: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ─── Types ───────────────────────────────────────────────────── */

interface PracticePanelProps {
  quiz: Quiz | null;
  selectedAnswers: Record<string, string>;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loadingQuiz: boolean;
  submittingQuiz: boolean;
  quizResult: any;
  quizWeakTopics?: WeakTopic[];
  onClose: () => void;
  onGenerateQuiz: (
    format?: string,
    numQuestions?: number,
    instructions?: string,
    isExam?: boolean,
    difficulty?: string,
    timeLimit?: number,
    revealStyle?: 'instant' | 'end',
    conceptFocus?: string
  ) => void;
  onSubmitQuiz: (e: React.FormEvent) => void;
  isEmbed?: boolean;
  isExam?: boolean;
  onGradeQuestion?: (questionId: string, answer: string) => Promise<any>;
  onExplainQuestion?: (question: any, studentAnswer: string, correctAnswer: string) => void;
  onReviewWeakTopic?: (topic: string) => void;
  topics?: string[];
}

/* ─── Component ───────────────────────────────────────────────── */

export default function PracticePanel({
  quiz,
  selectedAnswers,
  setSelectedAnswers,
  loadingQuiz,
  submittingQuiz,
  quizResult,
  quizWeakTopics = [],
  onClose,
  onGenerateQuiz,
  onSubmitQuiz,
  isEmbed = false,
  isExam = false,
  onGradeQuestion,
  onExplainQuestion,
  onReviewWeakTopic,
  topics = [],
}: PracticePanelProps) {
  const user = useStore((state) => state.user);

  /* ── Setup form ── */
  const [format, setFormat] = useState<'objective' | 'theory' | 'mixed' | 'story-based'>('mixed');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [instructions, setInstructions] = useState<string>('');
  const [isTimed, setIsTimed] = useState<boolean>(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [revealStyle, setRevealStyle] = useState<'instant' | 'end'>('instant');
  const [examCountType, setExamCountType] = useState<'10' | '20' | '30' | 'custom'>('10');
  const [limitError, setLimitError] = useState<{ type: 'quiz' | 'exam'; remaining: string } | null>(null);
  const [conceptFocus, setConceptFocus] = useState<string>('');

  useEffect(() => {
    setLimitError(null);
  }, [format, difficulty, numQuestions, instructions, isTimed, timeLimitMinutes, revealStyle, examCountType, isExam]);

  /* ── Timer ── */
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [autoSubmitted, setAutoSubmitted] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Quiz taking ── */
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [gradedQuestions, setGradedQuestions] = useState<Record<string, {
    isCorrect: boolean; feedback: string; correctAnswer: string; explanation: string;
  }>>({});
  const [isGradingTheory, setIsGradingTheory] = useState<boolean>(false);
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({});
  const [isHintOpen, setIsHintOpen] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const previousQuizIdRef = useRef<string | null>(null);

  /* ── Limit check ── */
  const checkGenerationLimit = (type: 'quiz' | 'exam') => {
    const plan = user?.plan || 'free';
    if (plan === 'plus' || plan === 'pro') return { limited: false, remainingTimeStr: '' };
    const userId = user?.id || user?._id || 'guest';
    const key = type === 'exam' ? `braudle_last_generated_exam_${userId}` : `braudle_last_generated_quiz_${userId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return { limited: false, remainingTimeStr: '' };
    
    let timestamps: number[] = [];
    try {
      timestamps = JSON.parse(stored);
      if (!Array.isArray(timestamps)) {
        timestamps = [Number(stored)];
      }
    } catch {
      timestamps = [Number(stored)];
    }

    const cooldown = 86400000;
    timestamps = timestamps.filter(t => Date.now() - t < cooldown);

    if (timestamps.length >= 3) {
      const oldest = Math.min(...timestamps);
      const remainingMs = cooldown - (Date.now() - oldest);
      const hrs = Math.ceil(remainingMs / 3600000);
      const str = hrs >= 24 ? `${Math.floor(hrs / 24)}d ${hrs % 24}h` : `${hrs}h`;
      return { limited: true, remainingTimeStr: str };
    }
    return { limited: false, remainingTimeStr: '' };
  };

  /* ── Sync quiz on load ── */
  useEffect(() => {
    if (quiz) {
      const graded: typeof gradedQuestions = {};
      const sel: typeof selectedAnswers = {};
      const theory: Record<string, string> = {};
      quiz.questions.forEach(q => {
        if (q.studentAnswer) {
          sel[q._id] = q.studentAnswer;
          theory[q._id] = q.studentAnswer;
          graded[q._id] = { isCorrect: !!q.isCorrect, feedback: q.feedback || '', correctAnswer: q.answer || '', explanation: q.explanation || '' };
        }
      });
      setGradedQuestions(graded);
      setSelectedAnswers(sel);
      setTheoryAnswers(theory);
      const qid = quiz._id;
      if (previousQuizIdRef.current !== qid) {
        setCurrentQuestionIdx(0);
        setShowResults(false);
        previousQuizIdRef.current = qid;
        if (quiz.timeLimit && quiz.timeLimit > 0 && !autoSubmitted) {
          setTimeLeft(quiz.timeLimit * 60);
          setTimerActive(true);
        }
      }
      setIsHintOpen(false);
    } else {
      setGradedQuestions({});
      setSelectedAnswers({});
      setTheoryAnswers({});
      setCurrentQuestionIdx(0);
      setShowResults(false);
      setTimerActive(false);
      setAutoSubmitted(false);
      previousQuizIdRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [quiz, setSelectedAnswers]);

  /* ── Timer countdown ── */
  useEffect(() => {
    if (!timerActive) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerActive(false);
          setAutoSubmitted(true);
          document.getElementById('quiz-end-submit-btn')?.click();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  /* ── Graders ── */
  const handleSelectOption = async (questionId: string, option: string) => {
    if (!quiz) return;
    if (quiz.revealStyle === 'end') { setSelectedAnswers(prev => ({ ...prev, [questionId]: option })); return; }
    if (gradedQuestions[questionId] || !onGradeQuestion) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: option }));
    const res = await onGradeQuestion(questionId, option);
    if (res) setGradedQuestions(prev => ({ ...prev, [questionId]: { isCorrect: res.isCorrect, feedback: res.feedback, correctAnswer: res.correctAnswer, explanation: res.explanation } }));
  };

  const handleSubmitTheoryAnswer = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    const text = theoryAnswers[questionId]?.trim();
    if (!text || !onGradeQuestion || isGradingTheory) return;
    if (quiz?.revealStyle === 'end') { setSelectedAnswers(prev => ({ ...prev, [questionId]: text })); return; }
    if (gradedQuestions[questionId]) return;
    setIsGradingTheory(true);
    setSelectedAnswers(prev => ({ ...prev, [questionId]: text }));
    const res = await onGradeQuestion(questionId, text);
    if (res) setGradedQuestions(prev => ({ ...prev, [questionId]: { isCorrect: res.isCorrect, feedback: res.feedback, correctAnswer: res.correctAnswer, explanation: res.explanation } }));
    setIsGradingTheory(false);
  };

  const correctCount = Object.values(gradedQuestions).filter(g => g.isCorrect).length;
  const finalScore = quiz?.score ?? (quiz ? Math.round((correctCount / quiz.questions.length) * 100) : 0);
  const { grade, label: gradeLabel, textColor: gradeText, bg: gradeBg, border: gradeBorder, ringColor } = getGradeData(finalScore);

  /* ── Difficulty config ── */
  const diffCfg = {
    easy:   { emoji: '🟢', label: 'Easy' },
    medium: { emoji: '🟡', label: 'Medium' },
    hard:   { emoji: '🔴', label: 'Hard' },
    expert: { emoji: '🔱', label: 'Expert' },
  };

  /* ─────────────────────────── RESULTS SCREEN ─────────────────────────── */
  const renderResults = () => {
    const topicStats: Record<string, { c: number; t: number; sourceSection?: number }> = {};
    quiz?.questions.forEach(q => {
      const topic = q.topic || 'General';
      if (!topicStats[topic]) topicStats[topic] = { c: 0, t: 0, sourceSection: q.sourceSection };
      topicStats[topic].t++;
      if (gradedQuestions[q._id]?.isCorrect) topicStats[topic].c++;
    });
    const weak = quizWeakTopics.length > 0 
      ? quizWeakTopics 
      : Object.entries(topicStats)
          .filter(([, s]) => s.t > 0 && (s.c / s.t) < 0.75)
          .map(([topic, s]) => ({ topic, accuracy: Math.round((s.c / s.t) * 100), sourceSection: s.sourceSection }));
    const strong = Object.entries(topicStats).filter(([, s]) => s.t > 0 && (s.c / s.t) >= 0.75).map(([topic, s]) => ({ topic, pct: Math.round((s.c / s.t) * 100) }));

    return (
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto py-2">
        {/* Grade card — Braudle yellow accent */}
        <div className={`rounded-[20px] border-2 ${gradeBorder} ${gradeBg} p-6 flex items-center gap-5`}>
          <div className="relative shrink-0">
            {/* Ring */}
            <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
              <circle cx="34" cy="34" r="30" stroke="#e5e7eb" strokeWidth="6" />
              <circle
                cx="34" cy="34" r="30"
                stroke={ringColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - finalScore / 100)}`}
                transform="rotate(-90 34 34)"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-2xl font-semibold tracking-tight ${gradeText}`}>{grade}</span>
          </div>
          <div>
            <div className={`text-3xl font-semibold tracking-tight ${gradeText}`}>{finalScore}%</div>
            <div className="text-[11px] text-gray-500 font-normal mt-0.5">{correctCount} of {quiz?.totalQuestions} correct</div>
            <div className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-[0.15em]">{gradeLabel}</div>
          </div>
        </div>

        {/* Weak areas */}
        {weak.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Areas to Review</span>
            </div>
            <div className="space-y-2">
              {weak.map((wt, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-[16px] p-4 flex items-center gap-3 hover:border-gray-200 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-brand-forest truncate">{wt.topic}</div>
                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                      {wt.accuracy}% accuracy{wt.sourceSection ? ` · from Section ${wt.sourceSection}` : ''}
                    </div>
                    {/* Accuracy bar */}
                    <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-yellow rounded-full" style={{ width: `${wt.accuracy}%` }} />
                    </div>
                  </div>
                  {onReviewWeakTopic && (
                    <button
                      type="button"
                      onClick={() => onReviewWeakTopic(wt.topic)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-brand-forest hover:bg-brand-green text-white font-medium text-[10px] rounded-full transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Review
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strong topics */}
        {strong.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Strengths ✓</span>
            <div className="flex flex-wrap gap-1.5">
              {strong.map((st, i) => (
                <span key={i} className="px-3 py-1 bg-brand-lime/20 border border-brand-lime/40 rounded-full text-[10px] font-semibold text-brand-forest">
                  {st.topic} · {st.pct}%
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Review answers */}
        <button
          type="button"
          onClick={() => setShowResults(false)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 hover:border-gray-300 bg-white text-brand-forest font-medium text-sm rounded-full transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Review Answers
        </button>
      </div>
    );
  };

  /* ─────────────────────────── MAIN CONTENT ───────────────────────────── */
  const content = (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      {!isEmbed && (
        <div className="flex items-center justify-between pb-5 border-b border-gray-100 mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-brand-green" />
            <span className="font-semibold text-sm text-brand-forest">
              {isExam ? 'Exam Simulator' : 'Practice Questions'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[11px] font-medium text-gray-400 hover:text-brand-forest transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {loadingQuiz ? (
        /* Loading state */
        <div className="flex-1 flex flex-col items-center justify-center py-16 gap-5 select-none text-center">
          <div className="w-12 h-12 rounded-[20px] bg-gray-50 border border-gray-100 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-[20px] border-2 border-brand-green/20 border-t-brand-green animate-spin" />
            <FileQuestion className="w-4 h-4 text-brand-green" />
          </div>
          <div>
            <p className="font-semibold text-sm text-brand-forest">{isExam ? 'Building your exam…' : 'Generating questions…'}</p>
            <p className="text-[11px] text-gray-400 font-normal mt-1">Analysing your notes</p>
          </div>
        </div>

      ) : quiz ? (
        /* Quiz active or results */
        showResults ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Results</span>
              <button type="button" onClick={() => setShowResults(false)} className="text-[11px] font-medium text-brand-green hover:text-brand-forest transition-colors cursor-pointer">
                ← Questions
              </button>
            </div>
            {renderResults()}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between min-h-0">
            {/* Progress bar + meta */}
            <div className="shrink-0 space-y-3 pb-5 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Exam / Practice badge */}
                  <span className={`text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full ${quiz.isExam ? 'bg-brand-forest text-brand-lime' : 'bg-brand-lime/30 text-brand-forest'}`}>
                    {quiz.isExam ? 'Exam' : 'Practice'}
                  </span>
                  {/* Difficulty badge */}
                  {quiz.difficulty && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                      {diffCfg[quiz.difficulty as keyof typeof diffCfg]?.emoji} {diffCfg[quiz.difficulty as keyof typeof diffCfg]?.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Timer */}
                  {timerActive && (
                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                      <Clock className="w-3 h-3" />
                      {formatTime(timeLeft)}
                    </span>
                  )}
                  {/* Score pill */}
                  {quiz.revealStyle === 'instant'
                    ? <span className="text-[10px] font-semibold text-brand-green">{correctCount}/{quiz.totalQuestions} ✓</span>
                    : <span className="text-[10px] font-normal text-gray-400">{Object.keys(selectedAnswers).length}/{quiz.totalQuestions} answered</span>
                  }
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-lime rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / quiz.totalQuestions) * 100}%` }}
                />
              </div>
              <div className="text-[10px] font-normal text-gray-400">
                Question {currentQuestionIdx + 1} of {quiz.totalQuestions}
              </div>
            </div>

            {/* Question body */}
            <div className="flex-1 overflow-y-auto py-5 space-y-5 min-h-0 pr-1">
              {(() => {
                const q = quiz.questions[currentQuestionIdx];
                if (!q) return null;
                const gradeInfo = gradedQuestions[q._id];
                const hasBeenGraded = !!gradeInfo && quiz.revealStyle === 'instant';

                return (
                  <div className="space-y-5">
                    {/* Provenance pill — Braudle yellow */}
                    {(q.topic || q.sourceSection) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {q.topic && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-yellow/15 border border-brand-yellow/30 rounded-full text-[10px] font-semibold text-brand-forest/80">
                            <BookOpen className="w-2.5 h-2.5" />
                            {q.topic}
                          </span>
                        )}
                        {q.sourceSection && (
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-normal text-gray-400">
                            Section {q.sourceSection}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Question text */}
                    <h4 className="font-semibold text-[17px] text-brand-forest leading-snug tracking-tight">
                      {renderInlineContent(q.question)}
                    </h4>

                    {/* MCQ options */}
                    {q.options && q.options.length > 0 ? (
                      <div className="space-y-2.5">
                        {q.options.map((option, idx) => {
                          const isSelected = selectedAnswers[q._id] === option;
                          const isCorrect = hasBeenGraded && isAnswerMatch(option, gradeInfo.correctAnswer || q.answer || '', q.options, idx);
                          const isWrong = hasBeenGraded && isSelected && !isCorrect;
                          const letter = String.fromCharCode(65 + idx);
                          const text = cleanOptionText(option);

                          let cardCls = 'border-gray-100 bg-white text-brand-forest hover:border-gray-200 hover:bg-gray-50/50';
                          if (hasBeenGraded) {
                            if (isCorrect) cardCls = 'border-brand-lime bg-brand-lime/15 text-brand-forest';
                            else if (isWrong) cardCls = 'border-red-200 bg-red-50 text-red-800';
                            else cardCls = 'border-gray-100 bg-white text-gray-300 pointer-events-none opacity-50';
                          } else if (isSelected) {
                            cardCls = 'border-brand-green bg-brand-green/5 text-brand-forest ring-1 ring-brand-green/20';
                          }

                          return (
                            <div
                              key={option}
                              onClick={() => handleSelectOption(q._id, option)}
                              className={`w-full p-4 rounded-[16px] border text-left text-sm font-normal transition-all cursor-pointer ${cardCls}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-[11px] font-semibold text-gray-400 shrink-0 mt-0.5 uppercase">{letter}.</span>
                                <div className="flex-1 min-w-0">
                                  <div>{renderInlineContent(text)}</div>
                                  {/* Inline result */}
                                  {hasBeenGraded && isCorrect && (
                                    <div className="mt-3 pt-3 border-t border-brand-lime/30 text-[12px] text-brand-forest/80 font-normal leading-relaxed">
                                      <span className="font-semibold text-brand-green">Correct. </span>
                                      {renderInlineContent(gradeInfo.explanation || q.explanation || '')}
                                    </div>
                                  )}
                                  {hasBeenGraded && isWrong && (
                                    <div className="mt-3 pt-3 border-t border-red-100 text-[12px] text-red-700/80 font-normal leading-relaxed">
                                      <span className="font-semibold">Incorrect. </span>
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
                      /* Theory answer */
                      <form onSubmit={(e) => handleSubmitTheoryAnswer(e, q._id)} className="space-y-3">
                        {hasBeenGraded ? (
                          <div className="space-y-3">
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-[16px] text-sm font-normal text-gray-600">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 block mb-1.5">Your Answer</span>
                              {theoryAnswers[q._id]}
                            </div>
                            <div className={`p-4 rounded-[16px] border text-sm font-normal leading-relaxed ${gradeInfo.isCorrect ? 'bg-brand-lime/10 border-brand-lime/30 text-brand-forest' : 'bg-red-50 border-red-100 text-red-800'}`}>
                              <span className="font-semibold">{gradeInfo.isCorrect ? 'Good answer. ' : 'Not quite. '}</span>
                              {renderInlineContent(gradeInfo.feedback)}
                              {!gradeInfo.isCorrect && gradeInfo.correctAnswer && (
                                <div className="mt-2.5 pt-2.5 border-t border-red-100 text-[11px] text-red-600/80">
                                  <span className="font-semibold uppercase tracking-wide block mb-1 text-[9px]">Model Answer</span>
                                  {renderInlineContent(gradeInfo.correctAnswer)}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <textarea
                              required
                              disabled={isGradingTheory}
                              value={theoryAnswers[q._id] || ''}
                              onChange={(e) => setTheoryAnswers(prev => ({ ...prev, [q._id]: e.target.value }))}
                              placeholder="Write your explanation here…"
                              className="w-full h-28 rounded-[16px] border border-gray-100 bg-gray-50/50 p-4 text-sm font-normal text-brand-forest placeholder:text-gray-300 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green/20 transition-all resize-none disabled:opacity-50"
                            />
                            <button
                              type="submit"
                              disabled={isGradingTheory || !theoryAnswers[q._id]?.trim()}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-green hover:bg-brand-forest text-white rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isGradingTheory
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Evaluating…</>
                                : quiz.revealStyle === 'end' ? 'Save Answer' : 'Submit Answer'
                              }
                            </button>
                          </div>
                        )}
                      </form>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Bottom nav */}
            <div className="shrink-0 border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                {/* Hint / Explain */}
                {(() => {
                  const q = quiz.questions[currentQuestionIdx];
                  if (!q) return null;
                  const gi = gradedQuestions[q._id];
                  if (gi && quiz.revealStyle === 'instant' && onExplainQuestion) {
                    return (
                      <button
                        type="button"
                        onClick={() => onExplainQuestion(q, selectedAnswers[q._id] || theoryAnswers[q._id] || '', gi.correctAnswer || q.answer || '')}
                        className="text-[11px] font-medium text-gray-400 hover:text-brand-forest transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Explain in chat
                      </button>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => setIsHintOpen(!isHintOpen)}
                      className="text-[11px] font-medium text-gray-400 hover:text-brand-forest transition-colors cursor-pointer select-none flex items-center gap-1"
                    >
                      💡 Hint
                      <svg className={`w-3.5 h-3.5 transition-transform ${isHintOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  );
                })()}

                {/* Navigation */}
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={currentQuestionIdx === 0}
                    onClick={() => { setIsHintOpen(false); setCurrentQuestionIdx(p => Math.max(0, p - 1)); }}
                    className="px-5 py-2.5 border border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-600 bg-white rounded-full transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  {currentQuestionIdx < quiz.questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => { setIsHintOpen(false); setCurrentQuestionIdx(p => Math.min(quiz.questions.length - 1, p + 1)); }}
                      className="px-6 py-2.5 bg-brand-forest hover:bg-brand-green text-white rounded-full text-sm font-medium transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="quiz-end-submit-btn"
                      onClick={(e) => {
                        if (quiz.revealStyle === 'end') onSubmitQuiz(e as any);
                        setShowResults(true);
                      }}
                      className="px-5 py-2.5 bg-brand-green hover:bg-brand-forest text-white rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {quiz.revealStyle === 'end' ? 'Submit & Results' : 'See Results'}
                    </button>
                  )}
                </div>
              </div>

              {/* Hint dropdown */}
              {isHintOpen && (() => {
                const q = quiz.questions[currentQuestionIdx];
                return !gradedQuestions[q?._id] ? (
                  <div className="p-3.5 bg-brand-yellow/10 border border-brand-yellow/25 rounded-[16px] text-[11px] text-brand-forest/70 font-normal leading-relaxed animate-in fade-in duration-200">
                    💡 Focus on how <strong className="font-semibold text-brand-forest">{q?.topic || 'this concept'}</strong> is defined and applied in your notes.
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )
      ) : (
        /* ──────────────────── SETUP FORM ──────────────────── */
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-1">
              {isExam ? 'Exam Simulator' : 'Practice Arena'}
            </span>
            <h4 className="font-semibold text-base text-brand-forest tracking-tight leading-tight">
              How do you want to be tested?
            </h4>
            <p className="text-[12px] text-gray-400 font-normal mt-1 leading-relaxed">
              All settings are optional — you're in full control.
            </p>
          </div>

          {/* ── Difficulty ── */}
          <div className="space-y-2.5">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block">Difficulty</label>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'medium', 'hard', 'expert'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`py-3 px-1 rounded-[16px] border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    difficulty === d
                      ? 'border-brand-forest bg-brand-forest text-white'
                      : 'border-gray-100 bg-white text-brand-forest hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base leading-none">{diffCfg[d].emoji}</span>
                  <span className="text-[9px] font-semibold">{diffCfg[d].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Question Format ── */}
          <div className="space-y-2.5">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block">Question Format</label>
            <div className="space-y-2">
              {[
                { id: 'objective',   label: 'Objective / MCQ',     desc: 'Option-based recall and testing.' },
                { id: 'theory',      label: 'Theory / Subjective', desc: 'Written essay responses.' },
                { id: 'mixed',       label: 'Mixed Formats',       desc: 'Blend of objective and theory.' },
                { id: 'story-based', label: 'Scenario Questions',  desc: 'Real-world case studies.' },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormat(item.id as any)}
                  className={`w-full p-3.5 rounded-[16px] border text-left transition-all cursor-pointer ${
                    format === item.id ? 'border-brand-green bg-brand-green/5' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-[13px] text-brand-forest">{item.label}</div>
                  <div className="text-[10px] text-gray-400 font-normal mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Question count ── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Questions</label>
              <span className="text-[10px] font-semibold text-brand-green bg-brand-lime/25 px-2.5 py-0.5 rounded-full">{numQuestions} Qs</span>
            </div>
            {!isExam ? (
              <div className="grid grid-cols-3 gap-2">
                {[{ n: 5, l: 'Quick' }, { n: 10, l: 'Standard' }, { n: 15, l: 'Full' }].map(({ n, l }) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumQuestions(n)}
                    className={`py-3 rounded-[16px] border flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                      numQuestions === n ? 'border-brand-forest bg-brand-forest text-white' : 'border-gray-100 bg-white text-brand-forest hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-semibold text-[13px]">{n}</span>
                    <span className="text-[9px] font-normal opacity-70">{l}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {(['10', '20', '30', 'custom'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setExamCountType(c); if (c !== 'custom') setNumQuestions(Number(c)); }}
                      className={`py-3 rounded-[16px] border text-[11px] font-semibold transition-all cursor-pointer ${
                        examCountType === c ? 'border-brand-forest bg-brand-forest text-white' : 'border-gray-100 bg-white text-brand-forest hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {c === 'custom' ? '…' : c}
                    </button>
                  ))}
                </div>
                {examCountType === 'custom' && (
                  <div className="space-y-2">
                    <input type="range" min="5" max="30" step="5" value={numQuestions}
                      onChange={e => setNumQuestions(Number(e.target.value))}
                      className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer accent-brand-green"
                    />
                    <div className="flex justify-between text-[8px] font-normal text-gray-400">
                      <span>5</span><span>15</span><span>30</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Reveal style ── */}
          <div className="space-y-2.5">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block">Answer Reveal</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'instant', label: 'Instant Reveal', desc: 'Graded after each answer.' },
                { id: 'end',     label: 'End Reveal',     desc: 'All shown at the finish.' },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRevealStyle(item.id as any)}
                  className={`p-3.5 rounded-[16px] border text-left transition-all cursor-pointer ${
                    revealStyle === item.id ? 'border-brand-green bg-brand-green/5' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-[12px] text-brand-forest">{item.label}</div>
                  <div className="text-[9px] text-gray-400 font-normal mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Timed mode ── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Timed Mode</label>
              <button
                type="button"
                onClick={() => setIsTimed(!isTimed)}
                className={`relative rounded-full transition-all cursor-pointer shrink-0 ${isTimed ? 'bg-brand-green' : 'bg-gray-200'}`}
                style={{ width: 40, height: 22 }}
              >
                <span
                  className="absolute top-0.5 bg-white rounded-full shadow-sm transition-all"
                  style={{ width: 18, height: 18, left: isTimed ? 20 : 2 }}
                />
              </button>
            </div>
            {isTimed && (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-1.5">
                  {[5, 10, 15, 20, 30].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTimeLimitMinutes(m)}
                      className={`py-2 rounded-[12px] border text-[11px] font-semibold transition-all cursor-pointer ${
                        timeLimitMinutes === m ? 'border-brand-forest bg-brand-forest text-white' : 'border-gray-100 bg-white text-brand-forest hover:border-gray-200'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 font-normal">Auto-submits when time runs out.</p>
              </div>
            )}
          </div>

          {/* ── Concept Focus Selection (Multi-select Pills) ── */}
          {topics && topics.length > 0 && (
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block">
                Concept Focus <span className="font-normal normal-case">· Optional</span>
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-gray-50/50 border border-gray-100 rounded-[16px]">
                {topics.map((t) => {
                  const selectedList = conceptFocus ? conceptFocus.split(',').map(x => x.trim()).filter(Boolean) : [];
                  const isSelected = selectedList.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        let newList;
                        if (isSelected) {
                          newList = selectedList.filter(x => x !== t);
                        } else {
                          newList = [...selectedList, t];
                        }
                        setConceptFocus(newList.join(','));
                      }}
                      className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer select-none active:scale-[0.98] ${
                        isSelected 
                          ? 'bg-brand-green border-brand-green text-white shadow-3xs'
                          : 'bg-white border-zinc-200 text-brand-forest hover:bg-zinc-50'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-gray-400 font-normal">Select specific concepts to focus on, or deselect all to cover the entire source material.</p>
            </div>
          )}

          {/* ── Custom focus ── */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block">
              Focus / Instructions <span className="font-normal normal-case">· Optional</span>
            </label>
            <input
              type="text"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Focus on key formulas from Chapter 3…"
              className="w-full px-4 py-3 border border-gray-100 rounded-[16px] bg-white text-[13px] font-normal text-brand-forest placeholder:text-gray-300 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
            />
          </div>

          {/* ── CTA ── */}
          {limitError ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-[20px] space-y-3 relative">
              <button 
                type="button"
                onClick={() => setLimitError(null)}
                className="absolute top-3.5 right-3.5 p-1 text-red-400 hover:text-red-700 rounded-lg hover:bg-red-100/40 transition-all cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex gap-2 text-red-700 text-sm font-semibold pr-6">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Daily limit reached
              </div>
              <p className="text-[11px] text-red-500/90 font-normal leading-relaxed">
                Free accounts can generate three {limitError.type}s per day. Try again in <strong>{limitError.remaining}</strong>.
              </p>
              <button
                type="button"
                onClick={() => useStore.getState().setPricingModalOpen(true)}
                className="w-full py-3 bg-brand-forest hover:bg-brand-green text-white font-medium text-sm rounded-full transition-colors cursor-pointer text-center"
              >
                Upgrade Plan
              </button>
            </div>
          ) : (
            <button
              onClick={async () => {
                const check = checkGenerationLimit(isExam ? 'exam' : 'quiz');
                if (check.limited) { setLimitError({ type: isExam ? 'exam' : 'quiz', remaining: check.remainingTimeStr }); return; }
                try {
                  await onGenerateQuiz(
                    format,
                    numQuestions,
                    instructions || undefined,
                    isExam,
                    difficulty,
                    isTimed ? timeLimitMinutes : 0,
                    revealStyle,
                    conceptFocus || undefined
                  );
                  const userId = user?.id || user?._id || 'guest';
                  const key = isExam ? `braudle_last_generated_exam_${userId}` : `braudle_last_generated_quiz_${userId}`;
                  const stored = localStorage.getItem(key);
                  let timestamps: number[] = [];
                  if (stored) {
                    try {
                      timestamps = JSON.parse(stored);
                      if (!Array.isArray(timestamps)) {
                        timestamps = [Number(stored)];
                      }
                    } catch {
                      timestamps = [Number(stored)];
                    }
                  }
                  timestamps.push(Date.now());
                  localStorage.setItem(key, JSON.stringify(timestamps));
                } catch (err: any) {
                  const m = err.message || '';
                  if (err.status === 429 || m.toLowerCase().includes('limit') || m.toLowerCase().includes('cooldown') || m.toLowerCase().includes('available in')) {
                    const match = m.match(/Available in (.*)\./i) || m.match(/in (.*)\./i);
                    setLimitError({ type: isExam ? 'exam' : 'quiz', remaining: match ? match[1] : '24h' });
                  } else {
                    alert(m || 'An unexpected error occurred while generating the quiz.');
                  }
                }
              }}
              disabled={loadingQuiz}
              className="w-full py-3.5 bg-brand-green hover:bg-brand-forest text-white rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FileQuestion className="w-4 h-4" />
              {loadingQuiz ? 'Generating…' : `Generate ${isExam ? 'Exam' : 'Practice'}`}
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (isEmbed) return <div className="flex-1 flex flex-col justify-between h-full">{content}</div>;

  return (
    <aside className="absolute inset-y-0 right-0 w-full md:relative md:w-96 border-l border-gray-100 bg-white p-6 flex flex-col overflow-y-auto shrink-0 z-40 animate-in slide-in-from-right-4 duration-300">
      {content}
    </aside>
  );
}
