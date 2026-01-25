import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    language: { type: String, required: true },
    level: { type: String },
    scenarioId: { type: String },
    phrase: { type: String, required: true },
    translation: { type: String },
    example: { type: String },
    context: { type: String }, // Pronunciation hint or context
    sourceSessionId: { type: String },
    createdAt: { type: Date, default: Date.now },
    embedding: { type: [Number], index: true }, // Vector search index
}, {
    timestamps: true
});

// Compound index for deduplication
flashcardSchema.index({ userId: 1, phrase: 1, scenarioId: 1, language: 1 }, { unique: true });

export const Flashcard = mongoose.model('Flashcard', flashcardSchema);
