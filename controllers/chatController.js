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

  const docBlock = docs.map((d, i) => {
    // Limit OCR text to first 1000 chars to prevent huge prompts
    const ocrText = (d.ocr?.text || "").substring(0, 1000);
    return `
=== DOCUMENT ${i+1} ===
Type: ${d.type}
Date: ${d.uploadedAt}
OCR: ${ocrText}${(d.ocr?.text || "").length > 1000 ? "...(truncated)" : ""}
Summary: ${d.nlp?.summary || ""}
=== END DOCUMENT ===
`;
  }).join("\n");

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
    const { question } = req.body;
    
    // Get user from authorization middleware
    const patientId = req.user._id.toString();
    const userId = req.user._id.toString();

    console.log("\n========== AI CHAT SESSION START ==========");
    console.log("Patient ID:", patientId);
    console.log("Question:", question);

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

    console.log("\n[CHAT] Context prepared:");
    console.log("- Documents:", relevantDocs.length);
    console.log("- Form Entries:", relevantForm.length);
    console.log("- Medications:", meds.length);
    console.log("- Context size:", context.length, "characters");

    // Limit context size to prevent timeout (max ~5000 chars for faster processing)
    let trimmedContext = context;
    if (context.length > 5000) {
      console.log("[CHAT] ⚠️  Context too large, trimming to 5000 characters");
      trimmedContext = context.substring(0, 5000) + "\n...(context truncated for faster response)";
    }

    // Build final prompt
    const finalPrompt = `You are HealSync Medical AI. Answer in 2-3 sentences maximum.

CONTEXT:
${trimmedContext}

QUESTION: ${question}

RULES:
- Be extremely brief (2-3 sentences)
- Use only the data provided above
- If no relevant data, say "No data found"
    `;

    console.log("[CHAT] Final prompt size:", finalPrompt.length, "characters");

    const answer = await callOllama(finalPrompt);

    console.log("\n[LLM] AI Chat Response:");
    console.log(answer);

    // If no answer (Ollama failed), provide fallback
    if (!answer || answer.trim() === "") {
      console.error("[CHAT] ⚠️  No response from LLM, using fallback message");
      const fallbackAnswer = "I'm sorry, I'm having trouble connecting to the AI service right now. Please make sure Ollama is running with 'ollama serve' and the llama3.1 model is installed with 'ollama pull llama3.1'. You can also check your medical records directly in the Documents section.";
      
      session.status = "timeout";
      session.response = fallbackAnswer;
      session.endedAt = new Date();
      await session.save();
      
      console.log("========== AI CHAT SESSION END (TIMEOUT) ==========\n");
      return res.json({ ok: true, answer: fallbackAnswer });
    }

    session.status = "completed";
    session.response = answer;
    session.endedAt = new Date();
    await session.save();

    console.log("[✓] Chat session saved successfully");
    console.log("========== AI CHAT SESSION END ==========\n");

    res.json({ ok: true, answer });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
