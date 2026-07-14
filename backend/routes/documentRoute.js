// backend/routes/documentRoute.js
import express from "express";
import { getAllDocuments, getDocumentById, deleteDocument, getPatientDocuments } from "../controllers/documentController.js";
import authorize from "../controllers/authorization.js";
import doctorAuthorize from "../middleware/doctorAuthorize.js";
import hospitalAuthorize from "../middleware/hospitalAuthorize.js";
import { 
  verifyDocumentOwnership, 
  verifyAuthorizedAccess, 
  auditDocumentAccess 
} from "../middleware/documentAccess.js";

const router = express.Router();

// Patient routes - access only their own documents
// Audit all document access for HIPAA compliance
router.get("/", authorize, auditDocumentAccess, getAllDocuments);
router.get("/:id", authorize, auditDocumentAccess, verifyDocumentOwnership, getDocumentById);
router.delete("/:id", authorize, auditDocumentAccess, verifyDocumentOwnership, deleteDocument);

// Doctor/Hospital routes - access specific patient's documents (with authorization check)
router.get("/patient/:patientId", doctorAuthorize, auditDocumentAccess, verifyAuthorizedAccess, getPatientDocuments);
router.get("/hospital/patient/:patientId", hospitalAuthorize, auditDocumentAccess, verifyAuthorizedAccess, getPatientDocuments);

export default router;
