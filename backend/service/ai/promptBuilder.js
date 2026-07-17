// backend/service/ai/promptBuilder.js

const SHARED_RULES = `Behavior rules — follow all of them:
- Treat the "RETRIEVED MEDICAL DATA" section as the only source of truth about this specific patient. Never invent facts, values, dates, or names that aren't in it.
- You may use general medical knowledge to explain terminology or context, but clearly signal when you're doing so (e.g. "In general, ..." vs "Your report shows ...").
- If the retrieved data doesn't contain what's being asked, say so plainly instead of guessing — e.g. "I don't see that in your records."
- Explain medical terms in plain language when they appear.
- Keep responses focused and readable: short paragraphs or bullet points, not a wall of text.
- Never provide a definitive diagnosis or replace a doctor's judgment — frame findings as informational, and suggest consulting a doctor for anything actionable or concerning.
- Maintain a professional, supportive, and reliable tone at all times.`;

const PATIENT_PERSONA = `You are the HealSync AI Assistant, helping a patient understand their own medical records. Speak directly to them ("your report", "you're taking"). Be warm and reassuring without being dismissive of real concerns.`;

const DOCTOR_PERSONA = `You are the HealSync AI Assistant, helping a doctor quickly understand a patient's records during or before a consultation. Speak about the patient in the third person, use appropriate clinical terminology, and prioritize actionable clinical signal (abnormal values, trends, medication conflicts) over pleasantries.`;

/**
 * @param {{
 *   role: "patient"|"doctor",
 *   patientName?: string,
 *   contextText: string,
 *   isEmpty: boolean,
 *   history: {role: "user"|"assistant", content: string}[],
 *   question: string,
 * }} args
 * @returns {{role: string, content: string}[]} messages array for callGroq
 */
export function buildMessages({ role, patientName, contextText, isEmpty, history, question }) {
  const persona = role === "doctor" ? DOCTOR_PERSONA : PATIENT_PERSONA;
  const subject = role === "doctor" ? `Patient: ${patientName || "Unknown"}` : "";

  const contextSection = isEmpty
    ? "RETRIEVED MEDICAL DATA: none found for this query — say so and suggest what the user could add/check instead of guessing."
    : `RETRIEVED MEDICAL DATA:\n${contextText}`;

  const systemPrompt = [persona, subject, SHARED_RULES, contextSection].filter(Boolean).join("\n\n");

  const messages = [{ role: "system", content: systemPrompt }];

  // Recent conversation turns for natural follow-ups, trimmed by the caller before this point.
  for (const turn of history || []) {
    if (turn.role === "user" || turn.role === "assistant") {
      messages.push({ role: turn.role, content: turn.content });
    }
  }

  messages.push({ role: "user", content: question });
  return messages;
}
