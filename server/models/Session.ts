import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Use client-side ID
    userId: { type: String, required: true, index: true },
    scenario: { type: String },
    language: { type: String },
    level: { type: String },
    turnsCount: { type: Number },
    startedAt: { type: Date },
    endedAt: { type: Date },
    transcript: { type: mongoose.Schema.Types.Mixed }, // Optional: store full transcript
    createdAt: { type: Date, default: Date.now }
});

export const Session = mongoose.model('Session', sessionSchema);
