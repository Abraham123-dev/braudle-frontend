'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/auth';
import QuizQuestion, { Question } from '@/components/quiz/QuizQuestion';
import QuizResults from '@/components/quiz/QuizResults';
import { ArrowLeft, Loader2, Award, ChevronRight, Check } from 'lucide-react';

export default function QuizSessionPage() {
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  useEffect(() => {
    const loggedUser = auth.getCurrentUser();
    if (!loggedUser) {
      router.replace('/login');
      return;
    }

    setLoading(true);

    // Mock quiz questions fetch from Groq pipeline
    setTimeout(() => {
      setQuestions([
        {
          id: 'q-1',
          question: 'What is the primary role of the folded inner membrane (cristae) in mitochondria?',
          type: 'mcq',
          options: [
            'To store water molecules for cell cooling',
            'To provide a larger surface area for chemical reactions producing ATP',
            'To manufacture proteins for the cell nucleus',
            'To act as a storage site for waste products'
          ],
          answer: 'To provide a larger surface area for chemical reactions producing ATP',
          explanation: 'The folded structure of the inner membrane creates deep ridges called cristae, which increases the available surface area. This space allows more energy production enzymes to operate simultaneously, yielding higher quantities of ATP.'
        },
        {
          id: 'q-2',
          question: 'True or False: Mitochondria are often called the powerhouse of the cell because they produce energy.',
          type: 'true_false',
          options: ['True', 'False'],
          answer: 'True',
          explanation: 'Mitochondria are universally known as the powerhouses of cells because they carry out cellular respiration and synthesis the chemical energy carrier ATP.'
        },
        {
          id: 'q-3',
          question: 'Describe in your own words how the function of the mitochondrion would be impacted if its outer membrane was punctured.',
          type: 'theory',
          answer: 'Puncturing the outer membrane breaks down the electrochemical gradient, letting molecules leak out and halting ATP production.',
          explanation: 'If the outer membrane is punctured, the delicate electrochemical gradient maintained between the inner and outer membranes collapses. The proton motive force required to run ATP synthase is lost, preventing the organelle from producing ATP.'
        }
      ]);
      setLoading(false);
    }, 800);
  }, [docId, router]);

  const handleSelectAnswer = (ans: string) => {
    const qId = questions[currentQuestionIndex].id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: ans,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);

    // Simulate HF Embeddings and Groq Theory grading logic
    setTimeout(() => {
      // Evaluate mock responses
      const evaluatedQuestions = questions.map((q) => {
        const studentAns = answers[q.id] || '';
        let isCorrect = false;

        if (q.type === 'mcq' || q.type === 'true_false') {
          isCorrect = studentAns === q.answer;
        } else {
          // Open theory grading: search for keywords (mitochondria, gradient, ATP, leak)
          isCorrect = studentAns.toLowerCase().includes('leak') || 
                      studentAns.toLowerCase().includes('gradient') ||
                      studentAns.toLowerCase().includes('atp');
        }

        return {
          ...q,
          studentAnswer: studentAns,
          isCorrect,
        };
      });

      const correctCount = evaluatedQuestions.filter((q) => q.isCorrect).length;
      const finalScorePercentage = Math.round((correctCount / questions.length) * 100);

      setQuestions(evaluatedQuestions);
      setQuizScore(finalScorePercentage);
      setSubmitting(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  // If score is calculated, display results
  if (quizScore !== null) {
    return (
      <QuizResults
        questions={questions}
        score={quizScore}
        onComplete={() => router.push('/dashboard')}
      />
    );
  }

  const activeQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswer = answers[activeQuestion.id] || '';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-zinc-100 z-10 dark:bg-zinc-950 dark:border-zinc-900">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-zinc-900 dark:text-zinc-50">Adaptive Quiz</span>
          </div>

          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {submitting ? (
          <div className="text-center flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Evaluating answers...
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Hugging Face similarity models are assessing your text responses.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress indicators */}
            <div className="w-full flex gap-1.5 h-1.5 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-full flex-1 transition-all rounded-full ${
                    idx <= currentQuestionIndex
                      ? 'bg-indigo-600 dark:bg-indigo-500'
                      : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            {/* Question Component */}
            <QuizQuestion
              question={activeQuestion}
              index={currentQuestionIndex}
              selectedAnswer={currentAnswer}
              onSelectAnswer={handleSelectAnswer}
            />

            {/* Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                disabled={isFirstQuestion}
                onClick={handleBack}
                className="rounded-xl border border-zinc-200 px-5 py-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Previous
              </button>

              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-md dark:bg-indigo-700 dark:hover:bg-indigo-800"
                >
                  Submit Quiz <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-md dark:bg-indigo-700 dark:hover:bg-indigo-800"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
