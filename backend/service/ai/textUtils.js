// backend/service/ai/textUtils.js

export function titleCase(s) {
  if (!s) return "";
  return String(s).replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(d) {
  if (!d) return "unknown date";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
