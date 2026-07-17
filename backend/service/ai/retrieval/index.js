// backend/service/ai/retrieval/index.js
import { retrieveDocuments } from "./documents.js";
import { retrieveFormEntries } from "./formEntries.js";
import { retrieveVitals } from "./vitals.js";
import { retrieveMedications } from "./medications.js";
import { retrieveConsultations } from "./consultations.js";

/**
 * Category -> retriever map. "diagnoses" has no dedicated data source of its own — diagnosis
 * information lives inside documents (OCR/AI summary), health-background form entries
 * (chronic_conditions/allergies), and consultation notes, so it fans out to those three.
 */
const RETRIEVERS = {
  documents: [retrieveDocuments],
  formEntries: [retrieveFormEntries],
  diagnoses: [retrieveDocuments, retrieveFormEntries, retrieveConsultations],
  medications: [retrieveMedications],
  vitals: [retrieveVitals],
  consultations: [retrieveConsultations],
};

/**
 * Runs the retrievers implied by the detected intent, scoped to a single patientId (permission
 * enforcement happens entirely in the caller — this module only ever sees an already-authorized
 * patientId). Dedupes chunks that multiple categories pulled in (e.g. "diagnoses" overlapping
 * with "documents") by id, keeping the highest score.
 *
 * @param {{patientId: string, query: string, intent: ReturnType<typeof import("../intent.js").detectIntent>}} args
 */
export async function retrieveContext({ patientId, query, intent }) {
  const retrieverFns = new Set();
  for (const category of intent.categories) {
    (RETRIEVERS[category] || []).forEach((fn) => retrieverFns.add(fn));
  }
  // No category matched anything retrievable (shouldn't happen — intent.js defaults to summary,
  // which selects every category) — fall back to documents so the assistant isn't empty-handed.
  if (retrieverFns.size === 0) retrieverFns.add(retrieveDocuments);

  const results = await Promise.all(
    [...retrieverFns].map((fn) => fn({ patientId, query, limit: intent.perCategoryLimit }).catch((err) => {
      console.error(`[retrieval] ${fn.name} failed:`, err.message);
      return [];
    }))
  );

  const byId = new Map();
  for (const chunk of results.flat()) {
    const existing = byId.get(chunk.id);
    if (!existing || (chunk.score ?? 0) > (existing.score ?? 0)) byId.set(chunk.id, chunk);
  }

  return [...byId.values()];
}
