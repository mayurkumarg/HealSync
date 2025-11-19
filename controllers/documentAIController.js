// backend/controllers/documentAIController.js
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

import { MedicalDocument, AuditLog, Notification } from "../models/models.js";
import { callOllama } from "./helpers/llmHelper.js";

/* helpers */
function normalizeFileType(mime) {
  if (!mime) return "unknown";
  if (mime.includes("jpeg")) return "image/jpeg";
  if (mime.includes("jpg")) return "image/jpg";
  if (mime.includes("png")) return "image/png";
  if (mime.includes("pdf")) return "application/pdf";
  if (mime.includes("msword")) return "application/msword";
  if (mime.includes("wordprocessingml"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (mime.includes("text")) return "text/plain";
  return mime;
}
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
    const r = await axios.post(url, form, { headers: form.getHeaders(), timeout: 120000 });
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
  if (lower.includes("hba1c") || lower.includes("hb a1c")) out.labs = out.labs || {}, out.labs.hba1c = (text.match(/hb.?a1c[:\s]*([0-9.]+)/i) || [])[1] || null;
  if (lower.includes("bp") || lower.includes("blood pressure")) out.vitals = { bp: "mentioned" };
  if (lower.includes("tablet") || lower.includes("mg")) out.medications = ["Medication (detected)"];
  return out;
}

/* LLM-based document type classifier */
async function classifyMedicalDocumentAI(text) {
  if (!text || text.trim().length < 20) return { isMedical: false, type: "non_medical" };

  const prompt = `
You are an expert in medical document classification. Read the OCR text and return JSON only with these keys:
{
  "isMedical": true/false,
  "type": "prescription | lab_report | diagnostic_report | imaging_report | discharge_summary | medical_certificate | hospital_bill | other_medical_document | non_medical"
}
OCR_TEXT:
${text}
  `;

  try {
    const resp = await callOllama(prompt);
    const match = String(resp).match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (err) {
    console.error("Classifier error:", err?.message || err);
  }
  return { isMedical: false, type: "non_medical" };
}

/* Optional: short summary generator */
async function generateSummary(text) {
  if (!text || text.trim().length < 30) return "";
  const prompt = `Summarize the following medical document in 2-4 concise sentences, focusing on diagnoses, important lab values, medications and any action items.\n\n${text}`;
  return await callOllama(prompt);
}

/* Main process */
export async function processDocumentAI({ patientId, uploadedBy, filePath, fileName, fileType }) {
  // 1. OCR
  const ocrResp = await ocrSpaceFile(filePath);
  const parsedText = ocrResp?.ParsedResults?.[0]?.ParsedText ? cleanText(ocrResp.ParsedResults[0].ParsedText) : "";

  // 2. Classification
  const docClass = await classifyMedicalDocumentAI(parsedText);

  // If not medical -> remove file and return rejection
  if (!docClass.isMedical) {
    try { fs.unlinkSync(filePath); } catch (e) {}
    return { ok: false, isMedical: false, type: docClass.type, message: "Not a medical-related document", parsedText };
  }

  // 3. NLP extraction (fallback)
  const parsedFields = fallbackParseTextToFields(parsedText);

  // 4. Summary
  const summary = await generateSummary(parsedText);

  // 5. Save to DB
  const stored = await MedicalDocument.create({
    patientId,
    uploadedBy,
    type: docClass.type === "other_medical_document" ? "update" : docClass.type,
    fileName,
    fileUrl: path.resolve(filePath),
    fileType: normalizeFileType(fileType),
    uploadedAt: new Date(),
    ocr: { text: parsedText, ocrEngine: "OCR.space", processedAt: new Date() },
    nlp: { entities: parsedFields, keyValues: parsedFields, summary, modelVersion: "v1", processedAt: new Date() },
    indexedKeywords: parsedFields.medications || [],
  });

  // 6. Audit log
  await AuditLog.create({
    action: "document_uploaded",
    performedBy: uploadedBy,
    patientId,
    documentId: stored._id,
    timestamp: new Date(),
  });

  // 7. Notification
  await Notification.create({
    userId: uploadedBy,
    type: "document_upload",
    message: `${fileName} processed`,
    relatedDocument: stored._id,
    sentAt: new Date(),
  });

  return { ok: true, isMedical: true, type: docClass.type, stored, parsedText, parsedFields, summary };
}
