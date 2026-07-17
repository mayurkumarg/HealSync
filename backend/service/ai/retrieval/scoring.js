// backend/service/ai/retrieval/scoring.js

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "my", "me", "i", "of", "to", "in", "on", "for",
  "and", "or", "what", "which", "who", "how", "do", "does", "did", "please", "tell", "about",
  "this", "that", "with", "have", "has", "had", "any", "am", "be", "been", "can", "you",
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .match(/[a-z0-9%.]+/g)
    ?.filter((t) => t.length > 2 && !STOPWORDS.has(t)) || [];
}

/** Keyword-overlap relevance score between a query and a candidate's searchable text, with a
 * recency tie-break. No embeddings/vector DB in this stack — this is the pragmatic retrieval
 * strategy that fits HealSync's existing MongoDB-only infrastructure (see ARCHITECTURE.md). */
export function scoreRelevance(query, text, date) {
  const queryTokens = new Set(tokenize(query));
  const textTokens = tokenize(text);
  if (queryTokens.size === 0 || textTokens.length === 0) return 0;

  let overlap = 0;
  const textTokenSet = new Set(textTokens);
  for (const qt of queryTokens) {
    if (textTokenSet.has(qt)) overlap += 1;
    else if (textTokens.some((tt) => tt.includes(qt) || qt.includes(tt))) overlap += 0.5;
  }

  const recencyBoost = date ? Math.max(0, 1 - (Date.now() - new Date(date).getTime()) / (365 * 24 * 3600 * 1000)) * 0.3 : 0;
  return overlap + recencyBoost;
}

/** Rank candidates by relevance to the query, always keeping the most recent items even with a
 * weak/zero keyword match (so "summarize my history" still returns something useful). */
export function rankAndLimit(candidates, query, limit) {
  const scored = candidates.map((c) => ({ ...c, score: scoreRelevance(query, c.text, c.date) }));
  scored.sort((a, b) => b.score - a.score || new Date(b.date || 0) - new Date(a.date || 0));
  return scored.slice(0, limit);
}
