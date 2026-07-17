// backend/service/ai/retrieval/vitals.js
import BPTracking from "../../../models/bp.js";
import SugarTracking from "../../../models/sugar.js";
import { formatDate } from "../textUtils.js";

/** Vitals aren't ranked per-reading like documents — a handful of trend readings is the unit of
 * meaning, not a single data point. Returns up to one BP chunk and one Sugar chunk, each a
 * compact summary of the most recent readings plus medication adherence, when the patient has
 * any tracking data at all (retrieval is skipped entirely for a patient with no readings). */
export async function retrieveVitals({ patientId, limit = 6 }) {
  const [bp, sugar] = await Promise.all([
    BPTracking.findOne({ userId: patientId }).lean(),
    SugarTracking.findOne({ userId: patientId }).lean(),
  ]);

  const chunks = [];

  if (bp?.readings?.length) {
    const recent = [...bp.readings].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)).slice(0, limit);
    const lines = recent.map((r) => `${formatDate(r.recordedAt)}: ${r.systolic}/${r.diastolic} mmHg (${r.category || "n/a"})`);
    const medLine = bp.drugName ? `Medication: ${bp.drugName} ${bp.dosage || ""}, ${bp.tabletsPerDay || "?"}/day, ${bp.stockAvailable ?? "?"} tablets left, ${bp.todaysIntake ?? 0} taken today.` : "No BP medication on file.";
    chunks.push({
      category: "vitals",
      id: `bp-${patientId}`,
      title: "Blood Pressure Tracking",
      text: `Recent BP readings (most recent first):\n${lines.join("\n")}\n${medLine}`,
      date: recent[0]?.recordedAt,
    });
  }

  if (sugar?.readings?.length) {
    const recent = [...sugar.readings].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)).slice(0, limit);
    const lines = recent.map((r) => `${formatDate(r.recordedAt)}: ${r.level} mg/dL (${r.type || "n/a"}, ${r.status || "n/a"})`);
    const medLine = sugar.drugName ? `Medication: ${sugar.drugName} ${sugar.dosage || ""}, ${sugar.tabletsPerDay || "?"}/day, ${sugar.stockAvailable ?? "?"} tablets left, ${sugar.todaysIntake ?? 0} taken today.` : "No diabetes medication on file.";
    chunks.push({
      category: "vitals",
      id: `sugar-${patientId}`,
      title: "Blood Sugar Tracking",
      text: `Recent blood sugar readings (most recent first):\n${lines.join("\n")}\n${medLine}`,
      date: recent[0]?.recordedAt,
    });
  }

  return chunks;
}
