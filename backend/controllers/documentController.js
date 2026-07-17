// backend/controllers/documentController.js
import { MedicalDocument } from "../models/models.js";
import fs from "fs";
import supabase from "../configure/supabase.js";

const DOCUMENT_BUCKET = "report";

/** Extract the storage object path from a Supabase public URL, e.g.
 * ".../storage/v1/object/public/report/169900-file.png" -> "169900-file.png". */
function supabaseObjectPath(fileUrl) {
  const marker = `/object/public/${DOCUMENT_BUCKET}/`;
  const idx = fileUrl?.indexOf(marker);
  return idx === -1 || idx === undefined ? null : fileUrl.slice(idx + marker.length);
}

export const getAllDocuments = async (req, res) => {
  try {
    // SECURITY: Only return documents belonging to the authenticated patient
    const patientId = req.user._id.toString();

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      MedicalDocument.find({ patientId })
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MedicalDocument.countDocuments({ patientId }),
    ]);

    return res.status(200).json({
      status: "success",
      count: docs.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: docs,
      message: `Retrieved ${docs.length} document(s) for patient ${patientId}`
    });
  } catch (err) {
    console.error('[GET_DOCUMENTS_ERROR]', err);
    return res.status(500).json({ status: "failed", message: "Could not load documents. Please try again." });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const patientId = req.user._id.toString();
    
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ status: "failed", message: "Document not found" });
    }

    // SECURITY: Verify the document belongs to the authenticated patient
    if (doc.patientId.toString() !== patientId) {
      console.warn(`[ACCESS_DENIED] User ${patientId} attempted to access document ${req.params.id} owned by ${doc.patientId}`);
      return res.status(403).json({
        status: "failed",
        message: "Access denied. You can only access your own medical documents."
      });
    }

    return res.status(200).json({ status: "success", data: doc });
  } catch (err) {
    console.error('[GET_DOCUMENT_BY_ID_ERROR]', err);
    return res.status(500).json({ status: "failed", message: "Could not load this document. Please try again." });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const patientId = req.user._id.toString();
    
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ status: "failed", message: "Document not found" });
    }

    // SECURITY: Verify the document belongs to the authenticated patient
    if (doc.patientId.toString() !== patientId) {
      console.warn(`[DELETE_DENIED] User ${patientId} attempted to delete document ${req.params.id} owned by ${doc.patientId}`);
      return res.status(403).json({
        status: "failed",
        message: "Access denied. You can only delete your own medical documents."
      });
    }

    // Delete the underlying file — either a Supabase Storage object (the normal case) or, for
    // documents created before Supabase was configured, a leftover local temp path.
    try {
      const objectPath = supabaseObjectPath(doc.fileUrl);
      if (objectPath && supabase) {
        const { error } = await supabase.storage.from(DOCUMENT_BUCKET).remove([objectPath]);
        if (error) console.warn("[FILE_DELETE_WARNING] Supabase object deletion failed:", error.message);
        else console.log(`[FILE_DELETED] Supabase object deleted: ${objectPath}`);
      } else if (doc.fileUrl && fs.existsSync(doc.fileUrl)) {
        fs.unlinkSync(doc.fileUrl);
        console.log(`[FILE_DELETED] Physical file deleted: ${doc.fileUrl}`);
      }
    } catch(e) {
      console.warn("[FILE_DELETE_WARNING] File deletion failed:", e);
    }

    await MedicalDocument.findByIdAndDelete(req.params.id);
    console.log(`[DOCUMENT_DELETED] Document ${req.params.id} deleted by patient ${patientId}`);

    return res.status(200).json({
      status: "success",
      message: "Document deleted successfully"
    });
  } catch (err) {
    console.error('[DELETE_DOCUMENT_ERROR]', err);
    return res.status(500).json({ status: "failed", message: "Could not delete this document. Please try again." });
  }
};

// Get documents for a specific patient (admin/doctor use)
export const getPatientDocuments = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!patientId) {
      return res.status(400).json({ status: "failed", message: "Patient ID is required" });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      MedicalDocument.find({ patientId })
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MedicalDocument.countDocuments({ patientId }),
    ]);

    return res.status(200).json({
      status: "success",
      count: docs.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: docs,
      patientId
    });
  } catch (err) {
    console.error('[GET_PATIENT_DOCUMENTS_ERROR]', err);
    return res.status(500).json({ status: "failed", message: "Could not load this patient's documents. Please try again." });
  }
};
