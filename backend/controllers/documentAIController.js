// backend/controllers/documentAIController.js
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

import { callGroq } from "../service/ai/groqClient.js";

/* helpers */
function cleanText(t) {
  if (!t) return "";
  return String(t).replace(/\r/g, " ").replace(/\s+/g, " ").trim();
}

/* OCR.space call (can be swapped for another OCR) */
export async function ocrSpaceFile(filePath) {
  try {
    const form = new FormData();
    form.append("apikey", process.env.OCR_API_KEY || "");
    form.append("language", "eng");
    form.append("isOverlayRequired", "false");
    form.append("OCREngine", "2");
    form.append("file", fs.createReadStream(filePath));

    const url = process.env.OCR_URL || "https://api.ocr.space/parse/image";
    const r = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: 120000,
    });
    return r.data;
  } catch (err) {
    console.error("OCR error:", err?.message || err);
    return null;
  }
}

/* Basic NLP fallback extraction (improve as needed) */
function fallbackParseTextToFields(text) {
  const out = {};
  const lower = (text || "").toLowerCase();
  if (lower.includes("diabetes")) out.diagnoses = ["Diabetes"];
  if (lower.includes("hba1c") || lower.includes("hb a1c"))
    (out.labs = out.labs || {}),
      (out.labs.hba1c =
        (text.match(/hb.?a1c[:\s]*([0-9.]+)/i) || [])[1] || null);
  if (lower.includes("bp") || lower.includes("blood pressure"))
    out.vitals = { bp: "mentioned" };
  if (lower.includes("tablet") || lower.includes("mg"))
    out.medications = ["Medication (detected)"];
  return out;
}

/* LLM-based document type classifier. Falls back to accepting the document (rather than
 * silently rejecting every upload) when the LLM is unreachable or returns nothing parseable —
 * classification is a nice-to-have enhancement, not a gate on the core upload feature. */
async function classifyMedicalDocumentAI(text) {
  if (!text || text.trim().length < 20)
    return { isMedical: true, type: "other_medical_document", classified: false };

  const messages = [
    {
      role: "system",
      content:
        'You are an expert in medical document classification. Read the OCR text and reply with JSON only, no prose, in the shape {"isMedical": true|false, "type": "prescription|lab_report|diagnostic_report|imaging_report|discharge_summary|medical_certificate|hospital_bill|other_medical_document|non_medical"}.',
    },
    { role: "user", content: `OCR_TEXT:\n${text}` },
  ];

  try {
    const resp = await callGroq(messages, { temperature: 0, maxTokens: 100 });
    const match = String(resp).match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { ...parsed, classified: true };
    }
  } catch (err) {
    console.error("[AI] Classifier error:", err?.message || err);
  }
  // AI unavailable/misconfigured — accept the document unclassified rather than block upload.
  return { isMedical: true, type: "other_medical_document", classified: false };
}

/* Short summary generator, used for both the document detail view and as RAG context later. */
async function generateSummary(text) {
  if (!text || text.trim().length < 30) return "";
  const messages = [
    {
      role: "system",
      content: "Summarize the following medical document in 2-4 concise sentences, focusing on diagnoses, important lab values, medications and any action items. Plain text only, no markdown.",
    },
    { role: "user", content: text },
  ];
  try {
    const summary = await callGroq(messages, { temperature: 0.2, maxTokens: 250 });
    return summary;
  } catch (err) {
    console.error("[AI] Summary error:", err?.message || err);
    return "";
  }
}

/* Main process */
export async function processDocumentAI({ patientId, uploadedBy, filePath, fileName, fileType }) {
  // Deliberately no logging of OCR text, AI summaries, or classification content anywhere in this
  // pipeline — that's medical document content (PHI) and has no business in server logs, even in
  // dev. Only operational metadata (ids, counts, pass/fail) is logged.
  console.log(`[DOCUMENT_AI] Processing "${fileName}" for patient ${patientId}`);

  // 1. OCR
  const ocrResp = await ocrSpaceFile(filePath);
  const parsedText = ocrResp?.ParsedResults?.[0]?.ParsedText ? cleanText(ocrResp.ParsedResults[0].ParsedText) : "";

  // 2. Classification
  const docClass = await classifyMedicalDocumentAI(parsedText);

  // If not medical -> remove file and return rejection
  if (!docClass.isMedical) {
    console.log(`[DOCUMENT_AI] Rejected "${fileName}" — not a medical document`);
    try { fs.unlinkSync(filePath); } catch (e) {}
    return { ok: false, isMedical: false, type: docClass.type, message: "Not a medical-related document", parsedText };
  }

  // 3. NLP extraction (fallback)
  const parsedFields = fallbackParseTextToFields(parsedText);

  // 4. Summary
  const summary = await generateSummary(parsedText);

  // Persistence (the MedicalDocument row, audit log, notification) happens in the route handler
  // once the file is actually uploaded to cloud storage — this function only runs OCR,
  // classification and NLP so the caller decides whether/where to store the result. (Previously
  // this also wrote its own MedicalDocument with fileUrl pointing at the local temp path, which
  // got immediately deleted — a duplicate, broken record on every upload.)
  console.log(`[DOCUMENT_AI] Processed "${fileName}" — type=${docClass.type}, classified=${docClass.classified}`);

  return {
    ok: true,
    isMedical: true,
    type: docClass.type,
    ocr: { text: parsedText, ocrEngine: "OCR.space", processedAt: new Date() },
    nlp: { entities: parsedFields, keyValues: parsedFields, summary, modelVersion: "v1", processedAt: new Date() },
    keywords: parsedFields.medications || [],
    summary,
    parsedText,
    parsedFields,
  };
}
