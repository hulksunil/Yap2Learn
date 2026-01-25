import { create } from 'zustand';

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
}

interface SessionState {
    // Configuration
    language: 'English' | 'French';
    level: string;
    scenario: string;

    // Session Data
    transcript: Message[];
    status: 'idle' | 'recording' | 'processing' | 'speaking';

    // Actions
    setConfig: (lang: 'English' | 'French', level: string, scenario: string) => void;
    addMessage: (msg: Message) => void;
    setStatus: (status: SessionState['status']) => void;
    resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    language: 'French',
    level: 'Intermediate',
    scenario: 'cafe',
    transcript: [],
    status: 'idle',

    setConfig: (language, level, scenario) => set({ language, level, scenario }),

    addMessage: (msg) => set((state) => ({
        transcript: [...state.transcript, msg]
    })),

    setStatus: (status) => set({ status }),

    resetSession: () => set({
        transcript: [],
        status: 'idle'
    }),
}));
