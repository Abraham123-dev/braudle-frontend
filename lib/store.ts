import { create } from 'zustand';
import { User } from './auth';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type?: 'explanation' | 'question' | 'answer' | 'feedback';
}

export interface StudentProfile {
  level: 'beginner' | 'intermediate' | 'advanced';
  weakTopics: string[];
  strongTopics: string[];
  totalSessions: number;
  averageScore: number;
  goal: string;
  learningStyle: string;
  subjects: string[];
}

export interface StudySession {
  id: string;
  documentId: string;
  documentTitle: string;
  mode: 'teach' | 'quiz' | 'breakdown' | 'exam';
  status: 'active' | 'completed' | 'abandoned';
  currentChunkIndex: number;
  totalChunks: number;
  messages: ChatMessage[];
  score?: number;
  summary?: string;
}

interface BraudleState {
  // Auth state
  user: User | null;
  profile: StudentProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: StudentProfile | null) => void;
  setIsLoading: (isLoading: boolean) => void;

  // Global pricing modal state
  isPricingModalOpen: boolean;
  setPricingModalOpen: (open: boolean) => void;

  isOffline: boolean;
  connectionError: boolean;
  setIsOffline: (isOffline: boolean) => void;
  setConnectionError: (connectionError: boolean) => void;

  // Active Session state
  activeSession: StudySession | null;
  setActiveSession: (session: StudySession | null) => void;
  updateActiveSession: (updates: Partial<StudySession>) => void;
  addMessageToActiveSession: (message: ChatMessage) => void;
  streamTokenToLastMessage: (token: string) => void;

  // Onboarding state
  onboardingStep: number;
  onboardingData: {
    level?: 'beginner' | 'intermediate' | 'advanced';
    subjects?: string[];
    style?: string;
    goal?: string;
  };
  setOnboardingStep: (step: number) => void;
  updateOnboardingData: (data: Partial<BraudleState['onboardingData']>) => void;
  resetOnboarding: () => void;
}

export const useStore = create<BraudleState>((set) => ({
  // Auth state
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  isPricingModalOpen: false,
  setPricingModalOpen: (open) => set({ isPricingModalOpen: open }),
  isOffline: false,
  connectionError: false,
  setIsOffline: (isOffline) => set({ isOffline }),
  setConnectionError: (connectionError) => set({ connectionError }),

  // Active Session state
  activeSession: null,
  setActiveSession: (session) => set({ activeSession: session }),
  updateActiveSession: (updates) =>
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, ...updates }
        : null,
    })),
  addMessageToActiveSession: (message) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            messages: [...state.activeSession.messages, message],
          }
        : null,
    })),
  streamTokenToLastMessage: (token) =>
    set((state) => {
      if (!state.activeSession) return {};
      const messages = [...state.activeSession.messages];
      if (messages.length === 0) return {};
      
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        messages[messages.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + token,
        };
      }
      return {
        activeSession: {
          ...state.activeSession,
          messages,
        },
      };
    }),

  // Onboarding state
  onboardingStep: 1,
  onboardingData: {},
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  updateOnboardingData: (data) =>
    set((state) => ({
      onboardingData: { ...state.onboardingData, ...data },
    })),
  resetOnboarding: () => set({ onboardingStep: 1, onboardingData: {} }),
}));
