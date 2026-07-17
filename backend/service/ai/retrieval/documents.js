// backend/service/ai/retrieval/documents.js
import { MedicalDocument } from "../../../models/models.js";
import { rankAndLimit } from "./scoring.js";
import { titleCase } from "../textUtils.js";

/** Retrieves relevant uploaded medical documents (reports, prescriptions, scans, OCR text) for
 * a patient. Permission is enforced entirely by the caller passing a patientId the requester is
 * authorized for — this retriever never takes an identity, only a scope. */
export async function retrieveDocuments({ patientId, query, limit }) {
  const docs = await MedicalDocument.find({ patientId })
    .select("type fileName uploadedAt ocr nlp description")
    .sort({ uploadedAt: -1 })
    .limit(50) // candidate pool before relevance ranking
    .lean();

  const candidates = docs.map((d) => ({
    category: "documents",
    id: d._id.toString(),
    title: `${titleCase(d.type)}${d.fileName ? ` — ${d.fileName}` : ""}`,
    text: [d.nlp?.summary, d.ocr?.text, d.description].filter(Boolean).join(" "),
    date: d.uploadedAt,
    meta: { type: d.type },
  }));

  return rankAndLimit(candidates, query, limit);
}
