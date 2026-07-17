// backend/service/ai/chatService.js
import { detectIntent } from "./intent.js";
import { retrieveContext } from "./retrieval/index.js";
import { buildContext } from "./contextBuilder.js";
import { buildMessages } from "./promptBuilder.js";
import { callGroq, AIServiceError } from "./groqClient.js";
import ChatSession from "../../models/chatSessionModel.js";

const MAX_HISTORY_TURNS = 6; // ~3 user/assistant pairs — enough for natural follow-ups, cheap in tokens

/**
 * The full pipeline: Intent Detection -> RAG Retrieval -> Context Builder -> Prompt Builder ->
 * Groq -> persisted response. Callers (chatController.js / doctorChatController.js) are
 * responsible for authentication + permission validation *before* calling this — by the time
 * `patientId` reaches here it must already be a scope the requester is authorized for.
 *
 * @param {{
 *   patientId: string,
 *   patientName?: string,
 *   question: string,
 *   role: "patient"|"doctor",
 *   participantId: string,   // who is asking — the patient's own id, or the doctor's id
 *   history?: {role: "user"|"assistant", content: string}[],
 * }} args
 */
export async function runChat({ patientId, patientName, question, role, participantId, history = [] }) {
  if (!question || !question.trim()) {
    throw new AIServiceError("Please enter a question.", { code: "EMPTY_QUESTION" });
  }

  const intent = detectIntent(question);
  const chunks = await retrieveContext({ patientId, query: question, intent });
  const { contextText, sources, isEmpty } = buildContext(chunks);

  const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);
  const messages = buildMessages({
    role,
    patientName,
    contextText,
    isEmpty,
    history: trimmedHistory,
    question,
  });

  const answer = await callGroq(messages);

  persistTurn({ patientId, role, participantId, question, answer, sources }).catch((err) =>
    console.error("[chatService] Failed to persist chat turn:", err.message)
  );

  return { answer, sources, intent: [...intent.categories] };
}

async function persistTurn({ patientId, role, participantId, question, answer, sources }) {
  const session = await ChatSession.findOneAndUpdate(
    { patientId, participantRole: role, participantId },
    { $setOnInsert: { patientId, participantRole: role, participantId } },
    { upsert: true, new: true }
  );

  session.messages.push({ role: "user", content: question });
  session.messages.push({ role: "assistant", content: answer, sources });
  // Cap stored history so a long-lived session doc doesn't grow unbounded.
  if (session.messages.length > 100) session.messages = session.messages.slice(-100);
  session.lastActivityAt = new Date();
  await session.save();
}
