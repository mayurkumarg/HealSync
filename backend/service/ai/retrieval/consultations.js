// backend/service/ai/retrieval/consultations.js
import Consultation from "../../../models/consultationModel.js";
import { rankAndLimit } from "./scoring.js";
import { formatDate } from "../textUtils.js";

/** Retrieves relevant past consultations (doctor notes, prescriptions, reasons for visit) — the
 * "what did my doctor say/prescribe" and "generate a consultation summary" use cases. */
export async function retrieveConsultations({ patientId, query, limit }) {
  const consultations = await Consultation.find({ patientId, status: "completed" })
    .select("doctorId scheduledAt reason notes prescriptionText")
    .populate("doctorId", "name specialization")
    .sort({ scheduledAt: -1 })
    .limit(30)
    .lean();

  const candidates = consultations.map((c) => ({
    category: "consultations",
    id: c._id.toString(),
    title: `Consultation with Dr. ${c.doctorId?.name || "Unknown"} (${c.doctorId?.specialization || "General"})`,
    text: [c.reason && `Reason: ${c.reason}`, c.notes && `Notes: ${c.notes}`, c.prescriptionText && `Prescription: ${c.prescriptionText}`]
      .filter(Boolean)
      .join(" | "),
    date: c.scheduledAt,
  }));

  return rankAndLimit(candidates.filter((c) => c.text), query, limit).map((c) => ({
    ...c,
    title: `${c.title} — ${formatDate(c.date)}`,
  }));
}
