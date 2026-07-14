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

/* LLM-based document type classifier */
async function classifyMedicalDocumentAI(text) {
  if (!text || text.trim().length < 20)
    return { isMedical: false, type: "non_medical" };

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
    console.log("[LLM] Sending classification request to Ollama (Llama 3.1)...");
    const resp = await callOllama(prompt);
    console.log("[LLM] Raw Ollama Response:");
    console.log(resp);
    const match = String(resp).match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      console.log("[LLM] Parsed Classification:", parsed);
      return parsed;
    }
  } catch (err) {
    console.error("[LLM] Classifier error:", err?.message || err);
  }
  return { isMedical: false, type: "non_medical" };
}

/* Optional: short summary generator */
async function generateSummary(text) {
  if (!text || text.trim().length < 30) return "";
  const prompt = `Summarize the following medical document in 2-4 concise sentences, focusing on diagnoses, important lab values, medications and any action items.\n\n${text}`;
  console.log("[LLM] Sending summary request to Ollama (Llama 3.1)...");
  const summary = await callOllama(prompt);
  console.log("[LLM] Generated Summary:");
  console.log(summary);
  return summary;
}

/* Main process */
export async function processDocumentAI({ patientId, uploadedBy, filePath, fileName, fileType }) {
  console.log("\n========== DOCUMENT AI PROCESSING START ==========");
  console.log("File:", fileName);
  console.log("Patient ID:", patientId);
  
  // 1. OCR
  console.log("\n[1] Running OCR...");
  const ocrResp = await ocrSpaceFile(filePath);
  const parsedText = ocrResp?.ParsedResults?.[0]?.ParsedText ? cleanText(ocrResp.ParsedResults[0].ParsedText) : "";
  console.log("[1] OCR Result (first 500 chars):");
  console.log(parsedText.substring(0, 500));
  console.log("[1] OCR Text Length:", parsedText.length, "characters");

  // 2. Classification
  console.log("\n[2] Classifying document with AI...");
  const docClass = await classifyMedicalDocumentAI(parsedText);
  console.log("[2] Classification Result:", JSON.stringify(docClass, null, 2));

  // If not medical -> remove file and return rejection
  if (!docClass.isMedical) {
    console.log("[2] ⚠️  Document rejected: Not medical");
    console.log("========== DOCUMENT AI PROCESSING END ==========\n");
    try { fs.unlinkSync(filePath); } catch (e) {}
    return { ok: false, isMedical: false, type: docClass.type, message: "Not a medical-related document", parsedText };
  }

  // 3. NLP extraction (fallback)
  console.log("\n[3] Extracting medical entities (NLP)...");
  const parsedFields = fallbackParseTextToFields(parsedText);
  console.log("[3] Parsed Fields:", JSON.stringify(parsedFields, null, 2));

  // 4. Summary
  console.log("\n[4] Generating AI summary...");
  const summary = await generateSummary(parsedText);
  console.log("[4] AI Summary:");
  console.log(summary);

  // 5. Save to DB
  console.log("\n[5] Saving to database...");
  const stored = await MedicalDocument.create({
    patientId,
    uploadedBy,
    type: docClass.type === "other_medical_document" ? "update" : docClass.type,
    fileName,
    fileUrl: path.resolve(filePath),
    fileType: normalizeFileType(fileType),
    uploadedAt: new Date(),
    ocr: { text: parsedText, ocrEngine: "OCR.space", processedAt: new Date() },
    nlp: {
      entities: parsedFields,
      keyValues: parsedFields,
      summary,
      modelVersion: "v1",
      processedAt: new Date(),
    },
    indexedKeywords: parsedFields.medications || [],
  });
  console.log("[5] Document saved with ID:", stored._id);

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

  console.log("\n[✓] Document processing completed successfully!");
  console.log("[✓] Final Result:", {
    isMedical: true,
    type: docClass.type,
    documentId: stored._id,
    hasOCR: !!parsedText,
    hasSummary: !!summary,
    extractedFields: Object.keys(parsedFields)
  });
  console.log("========== DOCUMENT AI PROCESSING END ==========\n");

  return { ok: true, isMedical: true, type: docClass.type, stored, parsedText, parsedFields, summary };
}
