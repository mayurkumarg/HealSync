// backend/controllers/chatController.js
import { runChat } from "../service/ai/chatService.js";
import { AIServiceError } from "../service/ai/groqClient.js";

/**
 * @route  POST /api/chat
 * @desc   Patient AI Assistant — RAG chat grounded in the signed-in patient's own records.
 * @body   { question: string, history?: {role, content}[] }
 * @access Patient
 */
export async function handleChat(req, res) {
  const { question, history } = req.body;
  const patientId = req.user._id.toString();

  try {
    const { answer, sources } = await runChat({
      patientId,
      patientName: req.user.name,
      question,
      role: "patient",
      participantId: patientId,
      history,
    });

    res.json({ ok: true, answer, sources });
  } catch (err) {
    if (err instanceof AIServiceError) {
      console.error(`[chat] ${err.code}:`, err.message);
      return res.status(err.status && err.status < 500 ? err.status : 200).json({
        ok: false,
        error: err.code,
        answer: err.message,
      });
    }
    console.error("[chat] Unexpected error:", err);
    res.status(500).json({ ok: false, error: "INTERNAL_ERROR", answer: "Something went wrong. Please try again." });
  }
}
