import mongoose from 'mongoose';

const correctionSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    language: { type: String, required: true },
    level: { type: String },
    scenarioId: { type: String },
    userSaid: { type: String, required: true },
    corrected: { type: String, required: true },
    tip: { type: String },
    sourceSessionId: { type: String },
    createdAt: { type: Date, default: Date.now },
    embedding: { type: [Number], index: true }, // Vector search index on 'corrected' or 'userSaid'
}, {
    timestamps: true
});

// Compound index for deduplication
correctionSchema.index({ userId: 1, userSaid: 1, corrected: 1, scenarioId: 1, language: 1 }, { unique: true });

export const Correction = mongoose.model('Correction', correctionSchema);
