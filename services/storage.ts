import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Correction {
    you_said: string;
    better: string;
    tip: string;
    category: 'grammar' | 'vocab' | 'register' | 'pronunciation_guess' | 'word_choice' | 'fluency';
}

export interface SavedPhrase {
    phrase: string;
    translation: string;
    example_sentence: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    pronunciation_hint?: string;
}

export interface SessionRecap {
    saved_phrases: SavedPhrase[];
    top_corrections: Correction[];
    suggestions: string[];
}

export interface SessionRecord {
    id: string;
    date: string; // ISO string
    scenario: string;
    scenarioTitle?: string; // Stored human-readable title
    scenarioRole?: string;  // Stored role
    language: string;
    nativeLanguage?: string; // Added for correct flashcard display
    level: string;
    turnsCount: number;
    transcript: any[]; // Full message history
    recap?: SessionRecap; // Consolidated recap
}

export interface FlashcardData {
    id: string;
    front: string; // Phrase
    back: string;  // Translation + Example
    context: string; // Pronunciation / Notes
    sessionId: string;
    originalPhrase?: SavedPhrase;
    language?: string; // Target language of this specific card
    nativeLanguage?: string; // Native language context
}

const KEYS = {
    SESSIONS: 'yap2learn_sessions',
    FLASHCARDS: 'yap2learn_flashcards',
};

export const StorageService = {
    // --- Sessions ---
    saveSession: async (session: SessionRecord) => {
        try {
            const existing = await StorageService.getHistory();
            const updated = [session, ...existing];
            await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save session', e);
        }
    },

    getHistory: async (): Promise<SessionRecord[]> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.SESSIONS);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('Failed to get history', e);
            return [];
        }
    },

    // --- Flashcards ---
    saveFlashcards: async (newCards: FlashcardData[]) => {
        try {
            const existing = await StorageService.getFlashcards();
            const updated = [...existing, ...newCards];
            await AsyncStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save flashcards', e);
        }
    },

    getFlashcards: async (sessionId?: string): Promise<FlashcardData[]> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.FLASHCARDS);
            const allCards: FlashcardData[] = json ? JSON.parse(json) : [];

            if (sessionId) {
                return allCards.filter(c => c.sessionId === sessionId);
            }
            return allCards;
        } catch (e) {
            console.error('Failed to get flashcards', e);
            return [];
        }
    },

    // --- Debug ---
    clearAll: async () => {
        await AsyncStorage.clear();
    }
};
