import {
  AIChatSession,
  MedicalDocument,
  FormEntry,
  Patient,
  MedicationSchedule
} from "../models/models.js";

import { callOllama } from "./helpers/llmHelper.js";

/* ---------------------------------------------------------
   GENERALIZED INTENT ANALYZER
--------------------------------------------------------- */
function detectIntent(question) {
  const q = question.toLowerCase();

  // Topics
  if (q.includes("blood") || q.includes("cbc") || q.includes("hemoglobin"))
    return { topic: "blood", time: "auto" };

  if (q.includes("diabetes") || q.includes("hba1c") || q.includes("glucose"))
    return { topic: "diabetes", time: "auto" };

  if (q.includes("bp") || q.includes("blood pressure"))
    return { topic: "bp", time: "auto" };

  if (q.includes("thyroid"))
    return { topic: "thyroid", time: "auto" };

  if (q.includes("compare"))
    return { topic: "general", type: "compare", time: "recent" };

  if (q.includes("latest") || q.includes("recent"))
    return { topic: "general", time: "latest" };

  return { topic: "general", time: "all" };
}

/* ---------------------------------------------------------
   STRUCTURED DATA FILTERING
--------------------------------------------------------- */
function filterDocuments(documents, intent) {
  const topic = intent.topic;

  if (topic === "blood")
    return documents.filter(doc => doc.type === "lab_report");

  if (topic === "diabetes")
    return documents.filter(doc =>
      (doc.nlp?.text || "").toLowerCase().includes("glucose")
      || (doc.nlp?.text || "").toLowerCase().includes("hba1c")
    );

  if (topic === "bp")
    return documents.filter(doc =>
      doc.ocr?.text?.toLowerCase().includes("blood pressure")
    );

  // Default → return all documents
  return documents;
}

function filterFormEntries(formEntries, intent) {
  const topic = intent.topic;

  if (topic === "blood")
    return formEntries.filter(e => e.category?.toLowerCase().includes("blood"));

  if (topic === "diabetes")
    return formEntries.filter(e =>
      e.data?.toLowerCase().includes("diabetes") ||
      e.data?.toLowerCase().includes("hba1c")
    );

  if (topic === "bp")
    return formEntries.filter(e =>
      e.data?.toLowerCase().includes("bp") ||
      e.data?.toLowerCase().includes("blood pressure")
    );

  return formEntries;
}

/* ---------------------------------------------------------
   CHUNK BUILDER
--------------------------------------------------------- */
function buildContextBlock({ docs, formEntries, patient, meds }) {

  const docBlock = docs.map((d, i) => `
=== DOCUMENT ${i+1} ===
Type: ${d.type}
Date: ${d.uploadedAt}
OCR:
${d.ocr?.text || ""}
Summary:
${d.nlp?.summary || ""}
=== END DOCUMENT ===
`).join("\n");

  const formBlock = formEntries.map((f, i) => `
=== FORM ENTRY ${i+1} ===
Category: ${f.category}
Data: ${f.data}
Date: ${f.createdAt}
=== END ENTRY ===
`).join("\n");

  const patientBlock = `
=== PATIENT INFO ===
Name: ${patient?.name}
Gender: ${patient?.gender}
Age: ${patient?.age || ""}
ABHA: ${patient?.abhaId}
=== END PATIENT INFO ===
`;

  const medsBlock = meds.length ? meds.map((m, i) => `
=== MEDICATION ${i+1} ===
Medicine: ${m.medicineName}
Dosage: ${m.dosage}
Notes: ${m.notes}
=== END MEDICATION ===
`).join("\n") : "";

  return `${patientBlock}\n${formBlock}\n${docBlock}\n${medsBlock}`;
}

/* ---------------------------------------------------------
   MAIN CHAT HANDLER — FULLY GENERALIZED
--------------------------------------------------------- */
export async function handleChat(req, res) {
  try {
    const { patientId, userId, question } = req.body;

    const session = await AIChatSession.create({
      sessionId: Math.random().toString(36).slice(2, 10),
      patientId,
      initiatedByUserId: userId,
      status: "active",
      promptSnapshot: question
    });

    // Fetch all data
    const documents = await MedicalDocument.find({ patientId }).sort({ uploadedAt: -1 }).lean();
    const formEntries = await FormEntry.find({ patientId }).lean();
    const patient = await Patient.findById(patientId).lean();
    const meds = await MedicationSchedule.find({ patientId }).lean();

    // Detect intent
    const intent = detectIntent(question);

    // Filter based on intent
    const relevantDocs = filterDocuments(documents, intent);
    const relevantForm = filterFormEntries(formEntries, intent);

    // Time filtering (if asked)
    if (intent.time === "latest") {
      relevantDocs.splice(1);
      relevantForm.splice(1);
    }

    // Build context
    const context = buildContextBlock({
      docs: relevantDocs,
      formEntries: relevantForm,
      patient,
      meds
    });

    // Build final prompt
    const finalPrompt = `
You are HealSync Medical AI.

Use ONLY the relevant data below based on patient's question.

CONTEXT:
${context}

QUESTION:
${question}

RESPONSE POLICY:
- Use only related documents (topic filtering already applied)
- If blood question → only blood data
- If diabetes question → only diabetes data
- Be short, precise, medically accurate
- Use latest data first when unclear
    `;

    const answer = await callOllama(finalPrompt);

    session.status = "completed";
    session.response = answer;
    await session.save();

    res.json({ ok: true, answer });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
