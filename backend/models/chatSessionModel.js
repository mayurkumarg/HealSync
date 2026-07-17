import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Persists AI Assistant conversations. Replaces the old single-shot `AIChatSession` (models.js)
 * — that one only ever stored the latest prompt/response snapshot and was never read back
 * anywhere in the app (safe to leave as dead legacy rather than migrate). This model stores the
 * full turn-by-turn thread per (patient, participant) so history survives a page refresh and can
 * back future features (resuming a conversation, session review, analytics) without a schema
 * change — the frontend itself only ever sends a short rolling window for prompt context.
 */
const messageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    sources: [{ category: String, title: String, date: Date }],
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: false }
);

const chatSessionSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Who is actually chatting — the patient themselves, or a doctor reviewing the patient.
    participantRole: { type: String, enum: ["patient", "doctor"], required: true },
    participantId: { type: Schema.Types.ObjectId, required: true },
    messages: [messageSchema],
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatSessionSchema.index({ patientId: 1, participantRole: 1, participantId: 1, lastActivityAt: -1 });

delete mongoose.models.ChatSession;
export default mongoose.model("ChatSession", chatSessionSchema);
