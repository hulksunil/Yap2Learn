import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Flashcard } from './models/Flashcard';
import { Correction } from './models/Correction';
import { Session } from './models/Session';

// Config
dotenv.config({ path: '../.env' }); // Load env from root
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('Connected to MongoDB Atlas'))
        .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.warn('MONGODB_URI not found. Sync features will fail.');
}

// Gemini Setup
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const embeddingModel = genAI ? genAI.getGenerativeModel({ model: "text-embedding-004" }) : null;

// Helper: Generate Embedding
async function getEmbedding(text: string): Promise<number[] | null> {
    if (!embeddingModel) return null;
    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Embedding error:', error);
        return null;
    }
}

// Routes

// 1. Sync Session (Fire-and-forget sync from client)
app.post('/api/sync-session', async (req: any, res: any) => {
    try {
        const { userId, session, flashcards, corrections } = req.body;

        if (!userId || !session) {
            return res.status(400).json({ error: 'Missing userId or session' });
        }

        // 1. Save Session
        await Session.updateOne(
            { id: session.id },
            { $set: { ...session, userId } },
            { upsert: true }
        );

        // 2. Bulk Write Flashcards
        let insertedFlashcards = 0;
        if (flashcards && flashcards.length > 0) {
            const ops = flashcards.map((f: any) => ({
                updateOne: {
                    filter: { userId, phrase: f.front, scenarioId: f.sessionId }, // loose dedup
                    update: {
                        $set: {
                            userId,
                            language: session.language,
                            level: session.level,
                            scenarioId: session.scenario,
                            phrase: f.front,
                            translation: f.back, // simplified mapping
                            context: f.context,
                            sourceSessionId: session.id
                        }
                    },
                    upsert: true
                }
            }));
            const result = await Flashcard.bulkWrite(ops);
            insertedFlashcards = result.upsertedCount + result.modifiedCount;
        }

        // 3. Bulk Write Corrections
        let insertedCorrections = 0;
        if (corrections && corrections.length > 0) {
            const ops = corrections.map((c: any) => ({
                updateOne: {
                    filter: { userId, userSaid: c.you_said, corrected: c.better, scenarioId: session.scenario },
                    update: {
                        $set: {
                            userId,
                            language: session.language,
                            level: session.level,
                            scenarioId: session.scenario,
                            userSaid: c.you_said,
                            corrected: c.better,
                            tip: c.tip,
                            sourceSessionId: session.id
                        }
                    },
                    upsert: true
                }
            }));
            const result = await Correction.bulkWrite(ops);
            insertedCorrections = result.upsertedCount + result.modifiedCount;
        }

        res.json({ ok: true, stats: { insertedFlashcards, insertedCorrections } });

    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Sync failed' });
    }
});

// 2. Embed Pending (Background job)
app.post('/api/embed-pending', async (req: any, res: any) => {
    if (!embeddingModel) return res.status(503).json({ error: 'Embeddings not configured' });

    try {
        const LIMIT = req.body.limit || 20;

        // Find items without embedding
        const pendingFlashcards = await Flashcard.find({ embedding: { $exists: false } }).limit(LIMIT);
        let updatedCount = 0;

        for (const card of pendingFlashcards) {
            const vector = await getEmbedding(card.phrase);
            if (vector) {
                card.embedding = vector;
                await card.save();
                updatedCount++;
            }
        }

        // Find corrections without embedding
        if (updatedCount < LIMIT) {
            const pendingCorrections = await Correction.find({ embedding: { $exists: false } }).limit(LIMIT - updatedCount);
            for (const item of pendingCorrections) {
                const vector = await getEmbedding(item.corrected);
                if (vector) {
                    item.embedding = vector;
                    await item.save();
                    updatedCount++;
                }
            }
        }

        res.json({ ok: true, updated: updatedCount });

    } catch (error) {
        console.error('Embed job error:', error);
        res.status(500).json({ error: 'Embed job failed' });
    }
});

// 3. Get Flashcards by Scenario
app.get('/api/flashcards/by-scenario', async (req: any, res: any) => {
    try {
        const { userId, scenarioId, language, limit } = req.query;
        const query: any = { userId };

        if (scenarioId) query.scenarioId = scenarioId;
        if (language) query.language = language;

        const cards = await Flashcard.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit) || 50);

        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// 3b. Get All Scenarios (Unique)
app.get('/api/scenarios', async (req: any, res: any) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'UserId required' });

        // Get distinct scenario IDs from Flashcards collection
        const scenarios = await Flashcard.distinct('scenarioId', { userId });
        res.json(scenarios);
    } catch (error) {
        console.error('Scenario list error:', error);
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// 4. Get "Struggled With" Flashcards (Vector Search)
app.get('/api/flashcards/struggles', async (req: any, res: any) => {
    try {
        const { userId, language, limit } = req.query;
        if (!userId) return res.status(400).json({ error: 'UserId required' });

        // 1. Get recent mistakes/corrections to find what user struggles with
        const recentCorrections = await Correction.find({ userId, language })
            .sort({ createdAt: -1 })
            .limit(5); // Last 5 mistakes

        if (recentCorrections.length === 0) {
            return res.json([]);
        }

        // 2. Collect vectors from corrections
        const vectors = recentCorrections
            .filter(c => c.embedding && c.embedding.length > 0)
            .map(c => ({ vector: c.embedding, text: c.corrected }));

        if (vectors.length === 0) {
            // FALLBACK: No embeddings? Return recent flashcards from same scenarios
            const scenarios = recentCorrections.map(c => c.scenarioId);
            const fallback = await Flashcard.find({
                userId,
                scenarioId: { $in: scenarios }
            }).limit(parseInt(limit) || 10);
            return res.json(fallback.map(f => ({ ...f.toObject(), reason: 'Related to recent scenarios' })));
        }

        // 3. Vector Search for each correction
        // Note: In a real app, we might centroid the vectors or do multiple queries. 
        // Here we'll take the most recent one to find "similar to your last mistake"
        const targetVector = vectors[0].vector;

        // MongoDB Atlas Vector Search Aggregation
        const results = await Flashcard.aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": targetVector,
                    "numCandidates": 50,
                    "limit": parseInt(limit) || 10
                }
            },
            {
                "$match": {
                    userId: userId, // Ensure we only see our own cards
                    language: language
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "phrase": 1,
                    "translation": 1,
                    "context": 1,
                    "score": { "$meta": "vectorSearchScore" }
                }
            }
        ]);

        // Annotate with reason
        const annotated = results.map(r => ({
            ...r,
            reason: `Related to mistake: "${vectors[0].text}"`
        }));

        res.json(annotated);

    } catch (error) {
        console.error('Vector search error:', error);
        // Fallback to simple recent if userId exists
        if (req.query.userId) {
            const fallback = await Flashcard.find({ userId: req.query.userId }).sort({ createdAt: -1 }).limit(10);
            res.json(fallback);
        } else {
            res.json([]);
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
