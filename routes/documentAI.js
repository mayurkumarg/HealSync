// backend/routes/documentAI.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { processDocumentAI } from "../controllers/documentAIController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_ ]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({ storage });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "file required" });

    const { patientId, uploadedBy } = req.body;
    if (!patientId || !uploadedBy) return res.status(400).json({ ok: false, error: "patientId and uploadedBy required" });

    const out = await processDocumentAI({
      patientId,
      uploadedBy,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    });

    return res.json(out);
  } catch (err) {
    console.error("AI Upload ERR:", err);
    return res.status(500).json({ ok: false, error: err.toString() });
  }
});

export default router;
