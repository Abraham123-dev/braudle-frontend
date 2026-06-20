'use client';

import React from 'react';
import { Award, ChevronRight, AlertCircle, FileQuestion } from 'lucide-react';
import { Quiz, Question } from '@/hooks/useSession';

interface PracticePanelProps {
  quiz: Quiz | null;
  selectedAnswers: Record<string, string>;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loadingQuiz: boolean;
  submittingQuiz: boolean;
  quizResult: any;
  onClose: () => void;
  onGenerateQuiz: () => void;
  onSubmitQuiz: (e: React.FormEvent) => void;
  isEmbed?: boolean;
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
}: PracticePanelProps) {
  const content = (
    <>
      {/* Panel Top Nav Bar (Only shown when not embedded) */}
      {!isEmbed && (
        <div className="flex items-center justify-between pb-4 border-b border-gray-50 mb-6">
          <div className="flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-brand-green" />
            <span className="font-bold text-sm text-brand-forest">Practice Questions</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl border border-gray-100 text-gray-400 hover:text-brand-forest hover:bg-gray-50 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {loadingQuiz ? (
        <div className="flex-1 flex flex-col justify-between h-full space-y-6 animate-pulse select-none">
          <div className="space-y-6 text-left">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="space-y-3">
                <div className="h-3 w-28 bg-gray-100 rounded-full" />
                <div className="h-4 w-5/6 bg-gray-100 rounded-full" />
                <div className="space-y-2">
                  <div className="h-10 bg-gray-50 border border-gray-100 rounded-xl" />
                  <div className="h-10 bg-gray-50 border border-gray-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-11 bg-gray-100 rounded-xl mt-4" />
        </div>
      ) : quizResult ? (
        /* Graded Quiz Result Card */
        <div className="flex-1 flex flex-col justify-between h-full space-y-6 overflow-y-auto pr-1">
          <div className="space-y-6">
            <div className="p-5 bg-brand-green/5 border border-brand-green/10 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green block">
                Grading Result
              </span>
              <h4 className="text-3xl font-black text-brand-forest">
                {quizResult.score}%
              </h4>
              <p className="text-xs text-gray-400 font-medium">
                {quizResult.newLevel ? `Advanced to ${quizResult.newLevel.toUpperCase()} level!` : 'Test completed successfully.'}
              </p>
            </div>

            {/* Individual question feedback cards */}
            <div className="space-y-4">
              {(quizResult.quiz?.questions || []).map((q: Question, idx: number) => (
                <div key={q._id} className="p-4 border border-gray-100 rounded-2xl space-y-2 bg-gray-50/20">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold text-gray-400">
                      Question {idx + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      q.isCorrect 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {q.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-brand-forest">{q.question}</h5>
                  <p className="text-[11px] text-gray-500">
                    Your answer: <strong className="text-brand-forest font-semibold">{q.studentAnswer}</strong>
                  </p>
                  {!q.isCorrect && q.options && (
                    <p className="text-[11px] text-emerald-600">
                      Correct answer: <strong className="font-semibold">{q.options[0]}</strong>
                    </p>
                  )}
                  {q.feedback && (
                    <p className="text-[10px] text-brand-forest/60 italic pt-1 border-t border-gray-100/50 leading-relaxed font-normal">
                      {q.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onGenerateQuiz}
            className="w-full py-3 bg-brand-green text-white rounded-xl text-xs font-bold hover:bg-brand-green/90 transition-all cursor-pointer mt-4"
          >
            Take another quiz
          </button>
        </div>
      ) : quiz ? (
        /* Render Active Practice Quiz to answer */
        <form onSubmit={onSubmitQuiz} className="flex-1 flex flex-col justify-between h-full space-y-6 overflow-y-auto pr-1">
          <div className="space-y-6">
            {quiz.questions.map((q, idx) => (
              <div key={q._id} className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green">
                  Question {idx + 1} of {quiz.totalQuestions}
                </span>
                <h4 className="font-bold text-sm text-brand-forest leading-snug">
                  {q.question}
                </h4>

                {/* Multiple choice option buttons */}
                {q.options && q.options.length > 0 ? (
                  <div className="space-y-2">
                    {q.options.map((option) => {
                      const isSelected = selectedAnswers[q._id] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSelectedAnswers(prev => ({ ...prev, [q._id]: option }))}
                          className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'border-brand-green bg-brand-green/5'
                              : 'border-gray-100 hover:border-gray-200 bg-white'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Subjective theory answer input box */
                  <textarea
                    required
                    value={selectedAnswers[q._id] || ''}
                    onChange={(e) => setSelectedAnswers(prev => ({ ...prev, [q._id]: e.target.value }))}
                    placeholder="Write your explanation here..."
                    className="w-full h-20 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-base sm:text-xs font-medium text-brand-forest focus:border-brand-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green transition-all"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submittingQuiz}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-green text-white rounded-xl text-xs font-bold hover:bg-brand-green/90 transition-all cursor-pointer active:scale-[0.98] mt-4"
          >
            {submittingQuiz ? 'Evaluating answers...' : 'Submit Answers'}
          </button>
        </form>
      ) : (
        /* Empty/Initial Welcome Sidebar Panel state */
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <Award className="w-12 h-12 text-gray-300" />
          <p className="text-xs text-gray-400 font-medium max-w-[200px] leading-relaxed">
            No active quiz loaded. Click below to generate adaptive questions from your notes.
          </p>
          <button
            onClick={onGenerateQuiz}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-brand-forest hover:bg-gray-50 transition-all cursor-pointer"
          >
            Generate Quiz
          </button>
        </div>
      )}
    </>
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
