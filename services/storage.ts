import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SessionRecord {
    id: string;
    date: string; // ISO string
    scenario: string;
    language: string;
    level: string;
    turnsCount: number;
}

export interface FlashcardData {
    id: string;
    front: string; // Original (Wrong)
    back: string;  // Improved (Right)
    context: string; // Explanation
    phonetic?: string;
    sessionId: string;
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

    getFlashcards: async (): Promise<FlashcardData[]> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.FLASHCARDS);
            return json ? JSON.parse(json) : [];
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
