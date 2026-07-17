// backend/service/ai/contextBuilder.js
import { titleCase, formatDate } from "./textUtils.js";

const TOTAL_CHAR_BUDGET = 7000;
const MAX_CHUNK_CHARS = 900;

const CATEGORY_LABELS = {
  documents: "Medical Documents & Reports",
  formEntries: "Health Background",
  medications: "Medications",
  vitals: "Vitals",
  consultations: "Consultation History",
};

/**
 * Builds a concise, structured context block from ranked retrieval chunks within a fixed
 * character budget (a cheap proxy for token budget — good enough given Groq's per-request
 * pricing/latency scales with tokens and we don't need exact counts). Chunks are consumed
 * highest-score-first across categories so the most relevant material survives truncation.
 * Returns both the prompt-ready text and a `sources` list the caller can use to tell the model
 * (and, in the future, the UI) exactly what was consulted.
 */
export function buildContext(chunks) {
  if (chunks.length === 0) {
    return { contextText: "", sources: [], isEmpty: true };
  }

  const sorted = [...chunks].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const grouped = new Map();
  const sources = [];
  let used = 0;

  for (const chunk of sorted) {
    if (used >= TOTAL_CHAR_BUDGET) break;
    const text = chunk.text.length > MAX_CHUNK_CHARS ? chunk.text.slice(0, MAX_CHUNK_CHARS) + "…" : chunk.text;
    const entry = `[${chunk.title}${chunk.date ? ` — ${formatDate(chunk.date)}` : ""}]\n${text}`;
    if (used + entry.length > TOTAL_CHAR_BUDGET) continue;

    used += entry.length;
    if (!grouped.has(chunk.category)) grouped.set(chunk.category, []);
    grouped.get(chunk.category).push(entry);
    sources.push({ category: chunk.category, title: chunk.title, date: chunk.date });
  }

  const contextText = [...grouped.entries()]
    .map(([category, entries]) => `## ${CATEGORY_LABELS[category] || titleCase(category)}\n${entries.join("\n\n")}`)
    .join("\n\n");

  return { contextText, sources, isEmpty: false };
}
