// backend/routes/documentAI.js
import express from "express";
import fs from "fs";
import path from "path";
import upload from "../service/multer.js";
import uploadToCloud from "../utils/uploadToCloud.js";
import { processDocumentAI } from "../controllers/documentAIController.js";
import { MedicalDocument, Notification } from "../models/models.js";
import authorize from "../controllers/authorization.js";
import doctorAuthorize from "../middleware/doctorAuthorize.js";
import identifyActor from "../middleware/identifyActor.js";
import { auditDocumentAccess } from "../middleware/documentAccess.js";
import PatientAccess from "../models/hospital/patientAccessModel.js";
import { documentUploadLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

// Patient upload route
router.post("/upload", authorize, documentUploadLimiter, auditDocumentAccess, upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ ok: false, error: "file required" });

    // SECURITY: Get authenticated user's ID - documents can only be uploaded for self
    const patientId = req.user._id.toString();
    const uploadedBy = req.user._id.toString();

    console.log(`[DOCUMENT_UPLOAD] Patient ${patientId} uploading document: ${req.file.originalname}`);

    if (!patientId || !uploadedBy) {
      return res.status(400).json({ ok: false, error: "Authentication required" });
    }

    /* --------------------------------------------------------
     * 0) SAVE BUFFER TO TEMP FILE (CRITICAL FIX)
     * -------------------------------------------------------- */
    const tempDir = "./tmpUploads";
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    // SECURITY: path.basename() strips any directory components from the client-controlled
    // filename — without it, a name like "../../../../etc/cron.d/evil" would let path.join()
    // resolve outside tempDir, letting an authenticated user write a file anywhere on disk.
    const tempPath = path.join(tempDir, `${Date.now()}-${path.basename(req.file.originalname)}`);
    fs.writeFileSync(tempPath, req.file.buffer);   // <-- buffer saved to disk

    /* --------------------------------------------------------
     * 1) PROCESS DOCUMENT (now using real file path)
     * -------------------------------------------------------- */
    const aiResult = await processDocumentAI({
      patientId,
      uploadedBy,
      filePath: tempPath,                // <-- FIXED
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    });

    // If NOT medical → delete temp file and exit
    if (!aiResult.isMedical) {
      try { fs.unlinkSync(tempPath); } catch {}
      return res.json({
        ok: false,
        stored: false,
        message: "Non-medical document. Not saved or uploaded.",
        aiResult,
      });
    }

    /* --------------------------------------------------------
     * 2) UPLOAD TO CLOUD AFTER AI CONFIRMATION
     * -------------------------------------------------------- */
    const uploadResult = await uploadToCloud([req.file], "report");
    const uploadedFile = uploadResult[0];
    if (!uploadedFile) {
      try { fs.unlinkSync(tempPath); } catch {}
      return res.status(502).json({ ok: false, error: "Cloud storage upload failed. Please try again." });
    }

    /* --------------------------------------------------------
     * 3) SAVE DOCUMENT TO DB
     * -------------------------------------------------------- */
    const savedDoc = await MedicalDocument.create({
      patientId,
      uploadedBy,
      type: aiResult.type || "other_medical_document",
      fileName: req.file.originalname,
      fileUrl: uploadedFile.url,
      fileType: req.file.mimetype,
      description: aiResult.summary || null,
      ocr: aiResult.ocr || {},
      nlp: aiResult.nlp || {},
      indexedKeywords: aiResult.keywords || [],
    });

    // Remove temp file
    try { fs.unlinkSync(tempPath); } catch {}

    console.log(`[DOCUMENT_SAVED] Document ${savedDoc._id} saved for patient ${patientId}, encrypted: ${savedDoc.isEncrypted}`);

    return res.json({
      ok: true,
      stored: true,
      message: "Medical document uploaded & saved successfully",
      cloudUpload: uploadedFile,
      aiResult,
      savedDocument: savedDoc,
    });

  } catch (err) {
    console.error('[DOCUMENT_UPLOAD_ERROR]', err);
    return res.status(500).json({
      ok: false,
      error: "Could not process this document. Please try again.",
    });
  }
});

// Doctor upload document for patient route
router.post("/upload-for-patient", identifyActor, documentUploadLimiter, auditDocumentAccess, upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ ok: false, error: "file required" });

    // Check if actor is a doctor
    if (req.actor?.type !== "doctor") {
      console.error(`[DOCTOR_DOCUMENT_UPLOAD] Access denied - Actor type: ${req.actor?.type}`);
      return res.status(403).json({ ok: false, error: "Only doctors can upload documents for patients" });
    }

    const doctorId = req.actor.doc._id.toString();
    const { patientId } = req.body;

    if (!patientId) {
      console.error(`[DOCTOR_DOCUMENT_UPLOAD] Missing patientId in request body`);
      return res.status(400).json({ ok: false, error: "patientId required" });
    }

    console.log(`[DOCTOR_DOCUMENT_UPLOAD] Doctor ${doctorId} uploading document for patient ${patientId}`);

    // Verify doctor has access to this patient (any active access allows upload)
    const accessRecord = await PatientAccess.findOne({
      patientId,
      doctorId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    console.log(`[DOCTOR_DOCUMENT_UPLOAD] Access record found:`, accessRecord ? `YES - Type: ${accessRecord.accessType}` : 'NO');
    
    if (!accessRecord) {
      console.error(`[DOCTOR_DOCUMENT_UPLOAD] No access found for doctor ${doctorId} to patient ${patientId}`);
      
      // Check if access exists with different status
      const anyAccess = await PatientAccess.findOne({ patientId, doctorId });
      if (anyAccess) {
        console.log(`[DOCTOR_DOCUMENT_UPLOAD] Found access with isActive: ${anyAccess.isActive}, expires: ${anyAccess.expiresAt}`);
      }
      
      return res.status(403).json({ 
        ok: false, 
        error: "You don't have active access to this patient. Please request access first or check if your access has expired." 
      });
    }

    console.log(`[DOCTOR_DOCUMENT_UPLOAD] Access verified - Doctor ${doctorId} can upload for patient ${patientId}`);

    /* --------------------------------------------------------
     * 0) SAVE BUFFER TO TEMP FILE
     * -------------------------------------------------------- */
    const tempDir = "./tmpUploads";
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    // SECURITY: path.basename() strips any directory components from the client-controlled
    // filename — without it, a name like "../../../../etc/cron.d/evil" would let path.join()
    // resolve outside tempDir, letting an authenticated user write a file anywhere on disk.
    const tempPath = path.join(tempDir, `${Date.now()}-${path.basename(req.file.originalname)}`);
    fs.writeFileSync(tempPath, req.file.buffer);

    /* --------------------------------------------------------
     * 1) PROCESS DOCUMENT
     * -------------------------------------------------------- */
    const aiResult = await processDocumentAI({
      patientId,
      uploadedBy: doctorId,
      filePath: tempPath,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    });

    // If NOT medical → delete temp file and exit
    if (!aiResult.isMedical) {
      try { fs.unlinkSync(tempPath); } catch {}
      return res.json({
        ok: false,
        stored: false,
        message: "Non-medical document. Not saved or uploaded.",
        aiResult,
      });
    }

    /* --------------------------------------------------------
     * 2) UPLOAD TO CLOUD AFTER AI CONFIRMATION
     * -------------------------------------------------------- */
    const uploadResult = await uploadToCloud([req.file], "report");
    const uploadedFile = uploadResult[0];
    if (!uploadedFile) {
      try { fs.unlinkSync(tempPath); } catch {}
      return res.status(502).json({ ok: false, error: "Cloud storage upload failed. Please try again." });
    }

    /* --------------------------------------------------------
     * 3) SAVE DOCUMENT TO DB
     * -------------------------------------------------------- */
    const savedDoc = await MedicalDocument.create({
      patientId,
      uploadedBy: doctorId,
      type: aiResult.type || "other_medical_document",
      fileName: req.file.originalname,
      fileUrl: uploadedFile.url,
      fileType: req.file.mimetype,
      description: aiResult.summary || null,
      ocr: aiResult.ocr || {},
      nlp: aiResult.nlp || {},
      indexedKeywords: aiResult.keywords || [],
    });

    // Remove temp file
    try { fs.unlinkSync(tempPath); } catch {}

    console.log(`[DOCTOR_DOCUMENT_SAVED] Doctor ${doctorId} uploaded document ${savedDoc._id} for patient ${patientId}`);

    Notification.create({
      userId: patientId,
      type: "document_upload",
      message: `${req.actor.doc.name || "Your doctor"} added a new document: ${req.file.originalname}`,
      relatedDocument: savedDoc._id,
    }).catch((err) => console.error("[NOTIFICATION] Failed to create:", err.message));

    return res.json({
      ok: true,
      stored: true,
      message: "Medical document uploaded & saved successfully",
      cloudUpload: uploadedFile,
      aiResult,
      savedDocument: savedDoc,
    });

  } catch (err) {
    console.error('[DOCTOR_DOCUMENT_UPLOAD_ERROR]', err);
    return res.status(500).json({
      ok: false,
      error: "Could not process this document. Please try again.",
    });
  }
});

export default router;
