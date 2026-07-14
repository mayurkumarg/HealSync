// backend/controllers/documentController.js
import { MedicalDocument } from "../models/models.js";
import fs from "fs";

export const getAllDocuments = async (req, res) => {
  try {
    // SECURITY: Only return documents belonging to the authenticated patient
    const patientId = req.user._id.toString();
    
    const docs = await MedicalDocument.find({ patientId })
      .sort({ uploadedAt: -1 })
      .lean();
      
    return res.status(200).json({ 
      success: true, 
      count: docs.length, 
      data: docs,
      message: `Retrieved ${docs.length} document(s) for patient ${patientId}`
    });
  } catch (err) {
    console.error('[GET_DOCUMENTS_ERROR]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const patientId = req.user._id.toString();
    
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    
    // SECURITY: Verify the document belongs to the authenticated patient
    if (doc.patientId.toString() !== patientId) {
      console.warn(`[ACCESS_DENIED] User ${patientId} attempted to access document ${req.params.id} owned by ${doc.patientId}`);
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. You can only access your own medical documents." 
      });
    }
    
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error('[GET_DOCUMENT_BY_ID_ERROR]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const patientId = req.user._id.toString();
    
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    
    // SECURITY: Verify the document belongs to the authenticated patient
    if (doc.patientId.toString() !== patientId) {
      console.warn(`[DELETE_DENIED] User ${patientId} attempted to delete document ${req.params.id} owned by ${doc.patientId}`);
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. You can only delete your own medical documents." 
      });
    }

    // Delete physical file if it exists
    try { 
      if (doc.fileUrl && fs.existsSync(doc.fileUrl)) {
        fs.unlinkSync(doc.fileUrl);
        console.log(`[FILE_DELETED] Physical file deleted: ${doc.fileUrl}`);
      }
    } catch(e) { 
      console.warn("[FILE_DELETE_WARNING] Physical file deletion failed:", e); 
    }

    await MedicalDocument.findByIdAndDelete(req.params.id);
    console.log(`[DOCUMENT_DELETED] Document ${req.params.id} deleted by patient ${patientId}`);
    
    return res.status(200).json({ 
      success: true, 
      message: "Document deleted successfully" 
    });
  } catch (err) {
    console.error('[DELETE_DOCUMENT_ERROR]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Get documents for a specific patient (admin/doctor use)
export const getPatientDocuments = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!patientId) {
      return res.status(400).json({ success: false, message: "Patient ID is required" });
    }
    
    const docs = await MedicalDocument.find({ patientId })
      .sort({ uploadedAt: -1 })
      .lean();
      
    return res.status(200).json({ 
      success: true, 
      count: docs.length, 
      data: docs,
      patientId 
    });
  } catch (err) {
    console.error('[GET_PATIENT_DOCUMENTS_ERROR]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
