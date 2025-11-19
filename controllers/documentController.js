// backend/controllers/documentController.js
import { MedicalDocument } from "../models/models.js";
import fs from "fs";

export const getAllDocuments = async (req, res) => {
  try {
    const docs = await MedicalDocument.find().sort({ uploadedAt: -1 }).lean();
    return res.status(200).json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });

    try { if (doc.fileUrl && fs.existsSync(doc.fileUrl)) fs.unlinkSync(doc.fileUrl); } catch(e) { console.warn("file delete failed", e); }

    await MedicalDocument.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Document deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
