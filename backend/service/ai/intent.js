// backend/service/ai/intent.js

/**
 * Lightweight, rule-based intent detector. Deliberately not an LLM call — classifying "which
 * data categories does this question touch" from a short list of keyword sets is fast, free, and
 * accurate enough for routing retrieval, and keeps the pipeline's latency/cost down to a single
 * Groq call per turn instead of two.
 */

const CATEGORY_KEYWORDS = {
  documents: [
    "report", "lab", "result", "test", "x-ray", "xray", "scan", "imaging", "mri", "ct scan",
    "ultrasound", "biopsy", "discharge", "certificate", "bill", "document",
  ],
  medications: [
    "medicine", "medication", "prescri", "dose", "dosage", "tablet", "drug", "pill", "refill",
    "stock", "taking", "on any", "prescribed",
  ],
  diagnoses: [
    "diagnos", "condition", "disease", "allerg", "chronic", "symptom", "problem",
  ],
  consultations: [
    "consult", "visit", "appointment", "doctor said", "doctor told", "notes", "advice", "advised",
  ],
  vitals: [
    "bp", "blood pressure", "sugar", "glucose", "hba1c", "trend", "trending", "reading", "vitals",
    "pulse", "heart rate",
  ],
};

const COMPARE_WORDS = ["compare", "versus", "vs", "difference between", "changed", "improv", "worsen"];
const SUMMARY_WORDS = ["summarize", "summary", "overview", "everything", "my health", "my history", "tell me about"];

export function detectIntent(question) {
  const q = (question || "").toLowerCase();
  const categories = new Set();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => q.includes(kw))) categories.add(category);
  }

  const isCompare = COMPARE_WORDS.some((w) => q.includes(w));
  const isSummary = SUMMARY_WORDS.some((w) => q.includes(w)) || categories.size === 0;

  // A summary request (or a question with no clear category) pulls a bit from everything,
  // recency-biased, rather than returning nothing.
  if (isSummary) {
    Object.keys(CATEGORY_KEYWORDS).forEach((c) => categories.add(c));
  }

  return {
    categories,
    isCompare,
    isSummary,
    // Compare/summary requests need more items per category to have something to compare/summarize.
    perCategoryLimit: isCompare ? 5 : isSummary ? 3 : 4,
  };
}
