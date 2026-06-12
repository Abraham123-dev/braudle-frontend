'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, BrainCircuit, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface Question {
  _id: string;
  question: string;
  type: string;
  options?: string[];
  // Provided after submit:
  answer?: string;
  explanation?: string;
  studentAnswer?: string;
  isCorrect?: boolean;
}

interface QuizData {
  _id: string;
  sessionId: string;
  documentId: string;
  totalQuestions: number;
  questions: Question[];
  score?: number;
}

export default function QuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  
  // State for taking the quiz
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // State for results
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [newLevel, setNewLevel] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await api.get<any>(`/quiz/${params.id}`);
        if (res.status === 'success' && res.quiz) {
          setQuiz(res.quiz);
          if (res.quiz.score !== undefined) {
            setIsSubmitted(true);
          }
        } else {
          // If the backend returns the quiz directly in the root or different shape
          setQuiz(res.quiz || res);
          if (res.score !== undefined || res.quiz?.score !== undefined) {
            setIsSubmitted(true);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [params.id]);

  const handleOptionSelect = (questionId: string, option: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const res = await api.post<any>(`/quiz/${params.id}/submit`, { answers: formattedAnswers });
      
      if (res.status === 'success' && res.quiz) {
        setQuiz(res.quiz);
        setNewLevel(res.newLevel || null);
        setIsSubmitted(true);
        setCurrentQuestionIndex(0); // reset index for reviewing results
      } else {
        throw new Error('Failed to submit quiz');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F7F2]">
        <div className="w-8 h-8 rounded-lg bg-[#4A783A] flex items-center justify-center animate-pulse">
          <div className="w-4 h-4 bg-[#C2E1A6] rounded-sm rotate-45" />
        </div>
        <p className="mt-4 text-[#6B7280] font-medium text-sm">Preparing your quiz...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F7F2] p-6 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-medium text-[#1B3B2B] mb-2">Quiz Error</h2>
        <p className="text-[#6B7280] mb-6">{error || 'Could not load quiz.'}</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-[#4A783A] text-white px-6 py-2.5 rounded-xl font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progressPercent = Math.round(((currentQuestionIndex + 1) / quiz.totalQuestions) * 100);

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F7F2] text-[#1B3B2B] font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7DF] px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push(quiz.sessionId ? `/session/${quiz.sessionId}` : '/dashboard')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F6F7F2] text-[#6B7280] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-sm">Knowledge Check</h1>
            <p className="text-[11px] text-[#6B7280] font-medium">Question {currentQuestionIndex + 1} of {quiz.totalQuestions}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-32 h-2 bg-[#E5E7DF] rounded-full overflow-hidden">
            <div className="h-full bg-[#4A783A] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center">
        
        {/* Results Summary Banner */}
        {isSubmitted && currentQuestionIndex === 0 && (
          <div className="w-full max-w-2xl bg-white border border-[#E5E7DF] rounded-3xl p-6 md:p-8 mb-8 shadow-sm text-center animate-in fade-in slide-in-from-top-4">
            <div className="w-16 h-16 bg-[#EDF5E8] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#4A783A]">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-serif font-medium text-[#1B3B2B] mb-2">
              Score: {quiz.score}%
            </h2>
            <p className="text-[#6B7280] mb-4">
              {quiz.score && quiz.score >= 80 ? 'Excellent work! You mastered this material.' : 'Good effort! Review the explanations below.'}
            </p>
            {newLevel && (
              <div className="inline-flex items-center gap-2 bg-[#FFC527]/20 text-[#2E1D13] px-4 py-2 rounded-full font-semibold text-sm border border-[#FFC527]/30">
                🎉 Level Up! You are now an {newLevel} learner.
              </div>
            )}
          </div>
        )}

        <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#E5E7DF] shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {/* Question Area */}
          <div className="p-6 md:p-8 flex-1">
            <h3 className="text-xl md:text-2xl font-semibold text-[#1B3B2B] leading-snug mb-8">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {currentQuestion.type === 'mcq' && currentQuestion.options?.map((option, idx) => {
                const isSelected = answers[currentQuestion._id] === option;
                
                let optionClasses = "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ";
                
                if (isSubmitted) {
                  const isCorrectAnswer = currentQuestion.answer === option;
                  const isStudentChoice = currentQuestion.studentAnswer === option;
                  
                  if (isCorrectAnswer) {
                    optionClasses += "bg-[#EDF5E8] border-[#4A783A] text-[#1B3B2B]";
                  } else if (isStudentChoice && !isCorrectAnswer) {
                    optionClasses += "bg-red-50 border-red-200 text-red-900 opacity-70";
                  } else {
                    optionClasses += "bg-white border-[#E5E7DF] text-[#6B7280] opacity-50";
                  }
                } else {
                  if (isSelected) {
                    optionClasses += "bg-[#EDF5E8] border-[#4A783A] text-[#1B3B2B] shadow-sm";
                  } else {
                    optionClasses += "bg-white border-[#E5E7DF] hover:border-[#C2E1A6] text-[#6B7280] hover:bg-[#F6F7F2]";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isSubmitted}
                    onClick={() => handleOptionSelect(currentQuestion._id, option)}
                    className={optionClasses}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected && !isSubmitted ? 'border-[#4A783A] bg-[#4A783A]' : 
                      isSubmitted && currentQuestion.answer === option ? 'border-[#4A783A] bg-[#4A783A]' :
                      isSubmitted && currentQuestion.studentAnswer === option ? 'border-red-500 bg-red-500' :
                      'border-[#D1D5C9]'
                    }`}>
                      {(isSelected || (isSubmitted && (currentQuestion.answer === option || currentQuestion.studentAnswer === option))) && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-[15px] font-medium">{option}</span>
                  </button>
                );
              })}
              
              {currentQuestion.type !== 'mcq' && (
                <textarea
                  disabled={isSubmitted}
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleOptionSelect(currentQuestion._id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 bg-[#F6F7F2] border border-[#D1D5C9] rounded-xl focus:outline-none focus:border-[#4A783A] focus:ring-1 focus:ring-[#4A783A] min-h-[120px] resize-y disabled:opacity-70"
                />
              )}
            </div>

            {/* Explanation Area (Visible after submit) */}
            {isSubmitted && (
              <div className={`mt-8 p-5 rounded-2xl ${currentQuestion.isCorrect ? 'bg-[#EDF5E8] border border-[#C2E1A6]' : 'bg-red-50 border border-red-100'}`}>
                <div className="flex items-start gap-3">
                  {currentQuestion.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-[#4A783A] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className={`font-semibold mb-1 ${currentQuestion.isCorrect ? 'text-[#4A783A]' : 'text-red-700'}`}>
                      {currentQuestion.isCorrect ? 'Correct!' : 'Incorrect'}
                    </h4>
                    <p className="text-sm text-[#1B3B2B] leading-relaxed">
                      {currentQuestion.explanation || 'No explanation provided.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="bg-[#F6F7F2]/50 border-t border-[#E5E7DF] p-4 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#1B3B2B] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            {currentQuestionIndex === quiz.totalQuestions - 1 && !isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length < quiz.totalQuestions}
                className="flex items-center gap-2 bg-[#4A783A] hover:bg-[#3D6330] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === quiz.totalQuestions - 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1B3B2B] bg-white border border-[#E5E7DF] hover:bg-[#F6F7F2] rounded-xl shadow-sm disabled:opacity-30 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
