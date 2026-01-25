import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    audioUrl?: string; // Placeholder for audio path
    feedback?: { // Identifying corrections
        original: string;
        improved: string;
        explanation: string;
    };
    translation?: string;
    suggestedResponse?: {
        text: string;
        translation: string;
    };
}

interface SessionState {
    // Persistent Configuration
    nativeLanguage: string;
    targetLanguage: string;
    hasOnboarded: boolean;

    // Session-Specific Configuration
    level: string;
    scenario: string;

    // Session Data
    transcript: Message[];
    status: 'idle' | 'recording' | 'processing' | 'speaking';

    // Actions
    setLanguages: (native: string, target: string) => void;
    completeOnboarding: () => void;
    setSessionConfig: (level: string, scenario: string) => void;
    addMessage: (msg: Message) => void;
    setStatus: (status: SessionState['status']) => void;
    resetSession: () => void;

    // Deprecated but keeping for compatibility during refactor if needed (will remove or alias)
    setConfig: (lang: 'English' | 'French', level: string, scenario: string) => void;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            // Default Values
            nativeLanguage: 'English',
            targetLanguage: 'French',
            hasOnboarded: false,

            level: 'Intermediate',
            scenario: 'cafe',
            transcript: [],
            status: 'idle',

            setLanguages: (native, target) => set({ nativeLanguage: native, targetLanguage: target }),

            completeOnboarding: () => set({ hasOnboarded: true }),

            setSessionConfig: (level, scenario) => set({ level, scenario }),

            // Legacy compatibility: Maps the old "language" arg to targetLanguage for now
            setConfig: (language, level, scenario) => set({ targetLanguage: language, level, scenario }),

            addMessage: (msg) => set((state) => ({
                transcript: [...state.transcript, msg]
            })),

            setStatus: (status) => set({ status }),

            resetSession: () => set({
                transcript: [],
                status: 'idle'
            }),
        }),
        {
            name: 'yap2learn-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                nativeLanguage: state.nativeLanguage,
                targetLanguage: state.targetLanguage,
                hasOnboarded: state.hasOnboarded
            }),
        }
    )
);
