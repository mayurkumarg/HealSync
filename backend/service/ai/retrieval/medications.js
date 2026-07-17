// backend/service/ai/retrieval/medications.js
import BPTracking from "../../../models/bp.js";
import SugarTracking from "../../../models/sugar.js";
import Reminder from "../../../models/medical/reminder.js";
import { formatDate } from "../textUtils.js";

/** "What am I taking?" pulls from three places that each capture medication differently:
 * chronic BP/Sugar drug tracking, active medication reminders, and doctor-prescribed
 * consultation prescriptions (see retrieval/consultations.js — kept separate there to avoid
 * duplicating consultation context, since a consultation chunk already carries it). */
export async function retrieveMedications({ patientId }) {
  const [bp, sugar, reminders] = await Promise.all([
    BPTracking.findOne({ userId: patientId }).select("drugName dosage tabletsPerDay stockAvailable").lean(),
    SugarTracking.findOne({ userId: patientId }).select("drugName dosage tabletsPerDay stockAvailable").lean(),
    Reminder.find({ userId: patientId, reminderType: "medication", status: { $in: ["pending", "sent"] } })
      .select("title description reminderDateTime")
      .sort({ reminderDateTime: -1 })
      .limit(10)
      .lean(),
  ]);

  const lines = [];
  if (bp?.drugName) lines.push(`${bp.drugName} ${bp.dosage || ""} — ${bp.tabletsPerDay || "?"}x/day for blood pressure, ${bp.stockAvailable ?? "?"} tablets remaining.`);
  if (sugar?.drugName) lines.push(`${sugar.drugName} ${sugar.dosage || ""} — ${sugar.tabletsPerDay || "?"}x/day for blood sugar, ${sugar.stockAvailable ?? "?"} tablets remaining.`);
  reminders.forEach((r) => lines.push(`${r.title}${r.description ? ` — ${r.description}` : ""} (reminder set for ${formatDate(r.reminderDateTime)})`));

  if (lines.length === 0) return [];

  return [
    {
      category: "medications",
      id: `meds-${patientId}`,
      title: "Current Medications",
      text: lines.join("\n"),
      date: new Date(),
    },
  ];
}
