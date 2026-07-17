// backend/service/ai/retrieval/formEntries.js
import FormEntry from "../../../models/formEntryModel.js";
import { rankAndLimit } from "./scoring.js";
import { titleCase } from "../textUtils.js";

/** Retrieves relevant patient-recorded health background entries (allergies, chronic
 * conditions, family history, etc. — see features/health-forms on the frontend). */
export async function retrieveFormEntries({ patientId, query, limit }) {
  const entries = await FormEntry.find({ patientId })
    .select("category data description createdAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const candidates = entries.map((e) => {
    const dataText = e.data && typeof e.data === "object" ? Object.entries(e.data).map(([k, v]) => `${k}: ${v}`).join(", ") : String(e.data || "");
    return {
      category: "formEntries",
      id: e._id.toString(),
      title: titleCase(e.category),
      text: [dataText, e.description].filter(Boolean).join(" — "),
      date: e.createdAt,
      meta: { category: e.category },
    };
  });

  return rankAndLimit(candidates, query, limit);
}
