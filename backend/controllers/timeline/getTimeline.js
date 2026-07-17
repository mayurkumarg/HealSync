import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import BPTracking from "../../models/bp.js";
import SugarTracking from "../../models/sugar.js";
import { MedicalDocument } from "../../models/models.js";
import Consultation from "../../models/consultationModel.js";
import FormEntry from "../../models/formEntryModel.js";

/**
 * @route  GET /api/timeline/mine
 * @desc   Chronological feed of a patient's health events — readings, documents, completed
 *         consultations, and health-background entries — merged from their existing collections.
 *         Purely a read/merge view; no new data is stored.
 * @access Patient
 */
const getTimeline = handelAsyncFunction(async (req, res) => {
  const patientId = req.user._id;
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));

  const [bp, sugar, docs, consultations, forms] = await Promise.all([
    BPTracking.findOne({ userId: patientId }).select("readings").lean(),
    SugarTracking.findOne({ userId: patientId }).select("readings").lean(),
    MedicalDocument.find({ patientId }).sort({ uploadedAt: -1 }).limit(limit).select("fileName type uploadedAt").lean(),
    Consultation.find({ patientId, status: "completed" })
      .sort({ scheduledAt: -1 })
      .limit(limit)
      .populate("doctorId", "name specialization")
      .select("doctorId scheduledAt notes prescriptionText completedAt")
      .lean(),
    FormEntry.find({ patientId }).sort({ createdAt: -1 }).limit(limit).select("category description createdAt").lean(),
  ]);

  const events = [];

  for (const r of (bp?.readings ?? []).slice(-limit)) {
    events.push({
      type: "bp_reading",
      date: r.recordedAt,
      title: `Blood pressure ${r.systolic}/${r.diastolic}`,
      detail: r.category,
    });
  }

  for (const r of (sugar?.readings ?? []).slice(-limit)) {
    events.push({
      type: "sugar_reading",
      date: r.recordedAt,
      title: `Blood sugar ${r.level} mg/dL`,
      detail: r.status,
    });
  }

  for (const d of docs) {
    events.push({
      type: "document",
      date: d.uploadedAt,
      title: d.fileName || "Document uploaded",
      detail: d.type ? d.type.replace(/_/g, " ") : null,
    });
  }

  for (const c of consultations) {
    const doctorName = c.doctorId?.name ? `Dr. ${c.doctorId.name}` : "your doctor";
    events.push({
      type: "consultation",
      date: c.completedAt || c.scheduledAt,
      title: `Consultation with ${doctorName}`,
      detail: c.prescriptionText ? "Prescription issued" : c.notes ? "Notes added" : null,
    });
  }

  for (const f of forms) {
    events.push({
      type: "form_entry",
      date: f.createdAt,
      title: `${f.category.replace(/_/g, " ")} recorded`,
      detail: f.description || null,
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return res.status(200).json({ status: "success", data: events.slice(0, limit) });
});

export default getTimeline;
