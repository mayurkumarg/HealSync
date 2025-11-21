// backend/routes/documentAI.js
import express from "express";
import fs from "fs";
import path from "path";
import upload from "../service/multer.js";
import uploadToCloud from "../utils/uploadToCloud.js";
import { processDocumentAI } from "../controllers/documentAIController.js";
import { MedicalDocument } from "../models/models.js";
import authorize from "../controllers/authorization.js";

const router = express.Router();

router.post("/upload", authorize, upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ ok: false, error: "file required" });

    // Get user from authorization middleware
    const patientId = req.user._id.toString();
    const uploadedBy = req.user._id.toString();

    if (!patientId || !uploadedBy) {
      return res.status(400).json({ ok: false, error: "patientId and uploadedBy required" });
    }

    /* --------------------------------------------------------
     * 0) SAVE BUFFER TO TEMP FILE (CRITICAL FIX)
     * -------------------------------------------------------- */
    const tempDir = "./tmpUploads";
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const tempPath = path.join(tempDir, `${Date.now()}-${req.file.originalname}`);
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

    return res.json({
      ok: true,
      stored: true,
      message: "Medical document uploaded & saved successfully",
      cloudUpload: uploadedFile,
      aiResult,
      savedDocument: savedDoc,
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.toString(),
    });
  }
});

export default router;
