import axios from 'axios';
import { StorageService } from '../storage';
import { UserService } from '../userService';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
const ENABLE_SYNC = process.env.EXPO_PUBLIC_ENABLE_MONGODB_SYNC === 'true';

// Helper for fire-and-forget requests with timeout
const safeRequest = async (promise: Promise<any>) => {
    try {
        // Race between request and 2s timeout
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
        await Promise.race([promise, timeout]);
    } catch (e) {
        console.log('Mongo Sync skipped/failed (non-blocking):', e);
    }
};

export const MongoService = {
    syncSession: async (sessionId: string) => {
        if (!ENABLE_SYNC) return;

        console.log('🔄 Triggering background sync for session:', sessionId);

        // 1. Gather Data
        const userId = await UserService.getUserId();
        const history = await StorageService.getHistory();
        const session = history.find(s => s.id === sessionId);
        const flashcards = await StorageService.getFlashcards(sessionId);

        if (!session) return;

        // 2. Prepare Payload
        const payload = {
            userId,
            session,
            flashcards: flashcards,
            corrections: session.recap?.top_corrections || []
        };

        // 3. Send (Fire & Forget)
        safeRequest(axios.post(`${BASE_URL}/sync-session`, payload)).then(() => {
            // After sync, trigger embedding generation
            safeRequest(axios.post(`${BASE_URL}/embed-pending`, { userId, limit: 10 }));
        });
    },

    syncHistory: async () => {
        console.log('Sync Debug: ENABLE_SYNC =', ENABLE_SYNC);
        if (!ENABLE_SYNC) {
            console.log('Sync Aborted: Feature flag disabled');
            return 0;
        }
        try {
            console.log('🚀 Starting full history sync...');
            const history = await StorageService.getHistory();
            console.log('Sync Debug: Found sessions count =', history.length);

            let count = 0;
            for (const session of history) {
                await MongoService.syncSession(session.id);
                count++;
                await new Promise(r => setTimeout(r, 100)); // prevent partial failure
            }
            return count;
        } catch (e) {
            console.error('History sync failed', e);
            return 0;
        }
    },

    getFlashcardsByScenario: async (scenarioId: string, language: string) => {
        if (!ENABLE_SYNC) return [];
        try {
            const userId = await UserService.getUserId();
            // Fetch ALL cards for this scenario from the backend
            const res = await axios.get(`${BASE_URL}/flashcards/by-scenario`, {
                params: { userId, scenarioId, language, limit: 100 }, // Increased limit for review
                timeout: 3000
            });
            return res.data;
        } catch (error) {
            console.log('Scenario fetch failed', error);
            return [];
        }
    },

    getAvailableScenarios: async () => {
        if (!ENABLE_SYNC) return [];
        try {
            const userId = await UserService.getUserId();
            const res = await axios.get(`${BASE_URL}/scenarios`, {
                params: { userId },
                timeout: 2000
            });
            return res.data || [];
        } catch (error) {
            console.log('Failed to fetch scenarios list', error);
            return [];
        }
    },

    getStruggledFlashcards: async (language: string) => {
        if (!ENABLE_SYNC) return [];
        try {
            const userId = await UserService.getUserId();
            const res = await axios.get(`${BASE_URL}/flashcards/struggles`, {
                params: { userId, language, limit: 15 },
                timeout: 3000 // slightly longer for vector search
            });
            return res.data;
        } catch (error) {
            console.log('Struggle fetch failed', error);
            return [];
        }
    }
};
