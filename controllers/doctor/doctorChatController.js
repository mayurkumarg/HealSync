import {
  MedicalDocument,
  FormEntry
} from "../../models/models.js";
import User from "../../models/userModel.js";
import BPTracking from "../../models/bp.js";
import SugarTracking from "../../models/sugar.js";
import Reminder from "../../models/medical/reminder.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";
import { callOllama } from "../helpers/llmHelper.js";

/* ---------------------------------------------------------
   DOCTOR CHAT HANDLER - SUMMARIZE PATIENT DATA
--------------------------------------------------------- */
export async function handleDoctorChat(req, res) {
  try {
    const { question, patientId } = req.body;
    const doctorId = req.doctor._id.toString();

    if (!patientId) {
      return res.status(400).json({ 
        ok: false, 
        error: "Patient ID is required" 
      });
    }

    console.log("\n========== DOCTOR AI CHAT SESSION START ==========");
    console.log("Doctor ID:", doctorId);
    console.log("Patient ID:", patientId);
    console.log("Question:", question);

    // Verify doctor has access to this patient
    const access = await PatientAccess.findOne({
      patientId,
      doctorId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!access) {
      console.log("❌ Access denied: Doctor does not have active access to this patient");
      console.log("========== DOCTOR AI CHAT SESSION END (DENIED) ==========\n");
      return res.status(403).json({ 
        ok: false, 
        error: "You do not have access to this patient's data" 
      });
    }

    // Fetch patient data
    const patient = await User.findById(patientId).select('-password -passwordHash -accountHash -token -tokenExpires').lean();
    const documents = await MedicalDocument.find({ patientId }).sort({ uploadedAt: -1 }).lean();
    const formEntries = await FormEntry.find({ patientId }).populate('createdBy', 'name').sort({ createdAt: -1 }).lean();
    const bpData = await BPTracking.findOne({ patientId }).lean();
    const sugarData = await SugarTracking.findOne({ patientId }).lean();
    const reminders = await Reminder.find({ userId: patientId }).sort({ dateTime: -1 }).lean();

    console.log("\n[CHAT] Data Retrieved:");
    console.log("- Patient:", patient?.name);
    console.log("- Documents:", documents.length);
    console.log("- Form Entries:", formEntries.length);
    console.log("- BP Readings:", bpData?.readings?.length || 0);
    console.log("- Sugar Readings:", sugarData?.readings?.length || 0);
    console.log("- Reminders:", reminders.length);

    // Build comprehensive context
    const context = buildDoctorContext({
      patient,
      documents,
      formEntries,
      bpData,
      sugarData,
      reminders
    });

    console.log("[CHAT] Context size:", context.length, "characters");

    // Limit context size to prevent timeout
    let trimmedContext = context;
    if (context.length > 8000) {
      console.log("[CHAT] ⚠️  Context too large, trimming to 8000 characters");
      trimmedContext = context.substring(0, 8000) + "\n...(context truncated for faster response)";
    }

    // Build final prompt for doctor
    const finalPrompt = `You are HealSync Medical AI assisting a doctor. Provide a professional medical summary.

PATIENT DATA:
${trimmedContext}

DOCTOR'S QUESTION: ${question}

RULES:
- Provide a clear, professional medical summary
- Highlight important findings, trends, and concerns
- Use medical terminology appropriately
- Keep response focused and actionable (3-5 sentences)
- If asked to summarize, organize by: demographics, diagnoses, medications, vital trends, recent documents
- If no relevant data, state "No data available for this category"
    `;

    console.log("[CHAT] Final prompt size:", finalPrompt.length, "characters");

    const answer = await callOllama(finalPrompt);

    console.log("\n[LLM] AI Chat Response:");
    console.log(answer);

    // Fallback if Ollama fails
    if (!answer || answer.trim() === "") {
      console.error("[CHAT] ⚠️  No response from LLM, using fallback message");
      const fallbackAnswer = "I'm sorry, I'm having trouble connecting to the AI service right now. Please make sure Ollama is running with 'ollama serve' and the llama3.1 model is installed. You can view the patient's data directly on this page.";
      
      console.log("========== DOCTOR AI CHAT SESSION END (TIMEOUT) ==========\n");
      return res.json({ ok: true, answer: fallbackAnswer });
    }

    console.log("[✓] Chat response generated successfully");
    console.log("========== DOCTOR AI CHAT SESSION END ==========\n");

    res.json({ ok: true, answer });

  } catch (err) {
    console.error("Doctor chat error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ---------------------------------------------------------
   CONTEXT BUILDER FOR DOCTOR VIEW
--------------------------------------------------------- */
function buildDoctorContext({ patient, documents, formEntries, bpData, sugarData, reminders }) {
  
  // Patient demographics
  const patientBlock = `
=== PATIENT PROFILE ===
Name: ${patient?.name || 'N/A'}
Age: ${patient?.age || 'N/A'}
Gender: ${patient?.gender || 'N/A'}
Phone: ${patient?.phone_no || 'N/A'}
Email: ${patient?.email || 'N/A'}
Emergency Contact: ${patient?.emergencyContact || 'N/A'}
=== END PROFILE ===
`;

  // Medical documents
  const docBlock = documents.length > 0 ? documents.slice(0, 10).map((d, i) => {
    const ocrText = (d.ocr?.text || d.ocrText || "").substring(0, 800);
    const nlpSummary = d.nlp?.summary || d.description || "";
    const entities = Array.isArray(d.nlp?.entities) ? d.nlp.entities.join(', ') : 
                     Array.isArray(d.entities) ? d.entities.join(', ') : "";
    
    return `
=== DOCUMENT ${i+1} ===
Type: ${d.type || 'N/A'}
Uploaded: ${d.uploadedAt || d.createdAt || 'N/A'}
Filename: ${d.fileName || 'N/A'}
OCR Text: ${ocrText}${(d.ocr?.text || d.ocrText || "").length > 800 ? "...(truncated)" : ""}
AI Summary: ${nlpSummary}
Medical Terms: ${entities}
=== END DOCUMENT ===
`;
  }).join("\n") : "No documents available.\n";

  // Health forms
  const formBlock = formEntries.length > 0 ? formEntries.slice(0, 10).map((f, i) => `
=== FORM ENTRY ${i+1} ===
Category: ${f.category || f.formType || 'N/A'}
Created: ${f.createdAt || 'N/A'}
Created By: ${f.createdBy?.name || 'N/A'}
Data: ${typeof f.data === 'object' ? JSON.stringify(f.data) : f.data || 'N/A'}
Description: ${f.description || 'N/A'}
=== END ENTRY ===
`).join("\n") : "No form entries available.\n";

  // Blood Pressure Data
  const bpBlock = bpData && bpData.readings?.length > 0 ? `
=== BLOOD PRESSURE TRACKING ===
Medication: ${bpData.medication?.drugName || 'None'} ${bpData.medication?.dosage || ''}
Tablets/Day: ${bpData.medication?.tabletsPerDay || 'N/A'}
Current Stock: ${bpData.medication?.currentStock || 'N/A'}

Recent Readings (last 5):
${bpData.readings.slice(0, 5).map((r, i) => 
  `${i+1}. ${r.systolic}/${r.diastolic} mmHg, Pulse: ${r.pulse} bpm (${new Date(r.recordedAt).toLocaleDateString()})`
).join('\n')}
=== END BP TRACKING ===
` : "No BP tracking data available.\n";

  // Sugar Data
  const sugarBlock = sugarData && sugarData.readings?.length > 0 ? `
=== BLOOD SUGAR TRACKING ===
Medication: ${sugarData.medication?.drugName || 'None'} ${sugarData.medication?.dosage || ''}
Tablets/Day: ${sugarData.medication?.tabletsPerDay || 'N/A'}
Current Stock: ${sugarData.medication?.currentStock || 'N/A'}

Recent Readings (last 5):
${sugarData.readings.slice(0, 5).map((r, i) => 
  `${i+1}. ${r.level} mg/dL (${r.type}), ${new Date(r.recordedAt).toLocaleDateString()}`
).join('\n')}
=== END SUGAR TRACKING ===
` : "No sugar tracking data available.\n";

  // Reminders
  const reminderBlock = reminders.length > 0 ? `
=== UPCOMING REMINDERS ===
${reminders.slice(0, 5).map((r, i) => 
  `${i+1}. ${r.title} - ${r.description} (${new Date(r.dateTime).toLocaleDateString()}) [${r.status}]`
).join('\n')}
=== END REMINDERS ===
` : "No reminders set.\n";

  return `${patientBlock}\n${formBlock}\n${docBlock}\n${bpBlock}\n${sugarBlock}\n${reminderBlock}`;
}
