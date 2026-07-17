// backend/controllers/doctor/doctorChatController.js
import User from "../../models/userModel.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";
import { runChat } from "../../service/ai/chatService.js";
import { AIServiceError } from "../../service/ai/groqClient.js";

/**
 * @route  POST /api/doctor/chat
 * @desc   Doctor AI Assistant — RAG chat grounded in an authorized patient's records.
 * @body   { question: string, patientId: string, history?: {role, content}[] }
 * @access Doctor (requires an active, unexpired PatientAccess grant for the given patient)
 */
export async function handleDoctorChat(req, res) {
  const { question, patientId, history } = req.body;
  const doctorId = req.doctor._id.toString();

  if (!patientId) {
    return res.status(400).json({ ok: false, error: "PATIENT_ID_REQUIRED", answer: "A patient must be specified." });
  }

  // Permission validation — the entire retrieval pipeline downstream trusts this check; nothing
  // else in the AI module re-verifies access, by design, so it must happen here before any data
  // is touched.
  const access = await PatientAccess.findOne({
    patientId,
    doctorId,
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
  if (!access) {
    return res.status(403).json({
      ok: false,
      error: "ACCESS_DENIED",
      answer: "You don't have active access to this patient's records.",
    });
  }

  try {
    const patient = await User.findById(patientId).select("name").lean();
    const { answer, sources } = await runChat({
      patientId,
      patientName: patient?.name,
      question,
      role: "doctor",
      participantId: doctorId,
      history,
    });

    res.json({ ok: true, answer, sources });
  } catch (err) {
    if (err instanceof AIServiceError) {
      console.error(`[doctorChat] ${err.code}:`, err.message);
      return res.status(err.status && err.status < 500 ? err.status : 200).json({
        ok: false,
        error: err.code,
        answer: err.message,
      });
    }
    console.error("[doctorChat] Unexpected error:", err);
    res.status(500).json({ ok: false, error: "INTERNAL_ERROR", answer: "Something went wrong. Please try again." });
  }
}
