// backend/middleware/documentAccess.js
import { MedicalDocument } from "../models/models.js";

/**
 * Middleware to verify patient owns the document
 * Used for sensitive operations (view, update, delete)
 */
export const verifyDocumentOwnership = async (req, res, next) => {
  try {
    const documentId = req.params.id;
    const patientId = req.user._id.toString();

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required"
      });
    }

    const document = await MedicalDocument.findById(documentId).select('patientId uploadedBy');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    // Check if the authenticated user is the document owner
    if (document.patientId.toString() !== patientId) {
      console.warn(`[OWNERSHIP_VIOLATION] User ${patientId} attempted to access document ${documentId} owned by ${document.patientId}`);
      
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own medical documents.",
        error: "OWNERSHIP_VIOLATION"
      });
    }

    // Attach document to request for further use
    req.document = document;
    next();

  } catch (error) {
    console.error('[VERIFY_OWNERSHIP_ERROR]', error);
    return res.status(500).json({
      success: false,
      message: "Error verifying document ownership",
      error: error.message
    });
  }
};

/**
 * Middleware to check if user has authorized access to another patient's documents
 * Used for doctors/hospitals with proper access grants
 */
export const verifyAuthorizedAccess = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const requesterId = req.user._id.toString();
    const requesterRole = req.user.role || req.userType; // Support both doctor and hospital

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required"
      });
    }

    // If accessing own documents, allow
    if (patientId === requesterId) {
      return next();
    }

    // Check if requester is a doctor or hospital with valid access
    if (!['doctor', 'hospital'].includes(requesterRole)) {
      console.warn(`[UNAUTHORIZED_ACCESS] User ${requesterId} with role ${requesterRole} attempted to access patient ${patientId} documents`);
      
      return res.status(403).json({
        success: false,
        message: "Access denied. Only authorized medical professionals can access patient documents.",
        error: "UNAUTHORIZED_ROLE"
      });
    }

    // TODO: Add access token verification here
    // const hasAccess = await verifyAccessToken(requesterId, patientId);
    // if (!hasAccess) { return res.status(403).json(...) }

    console.log(`[AUTHORIZED_ACCESS] ${requesterRole} ${requesterId} accessing patient ${patientId} documents`);
    next();

  } catch (error) {
    console.error('[VERIFY_AUTHORIZED_ACCESS_ERROR]', error);
    return res.status(500).json({
      success: false,
      message: "Error verifying authorized access",
      error: error.message
    });
  }
};

/**
 * Audit log for document access
 * Logs all document access attempts for compliance (HIPAA)
 */
export const auditDocumentAccess = async (req, res, next) => {
  // Support both req.user (authorize middleware) and req.actor (identifyActor middleware)
  const user = req.user || req.actor?.doc;
  const userType = req.actor?.type || req.userType || 'patient';
  
  if (!user) {
    console.warn('[DOCUMENT_ACCESS_AUDIT] No user found in request');
    return next();
  }

  const accessLog = {
    timestamp: new Date().toISOString(),
    userId: user._id.toString(),
    userRole: user.role || userType,
    action: req.method,
    endpoint: req.originalUrl,
    documentId: req.params.id || 'N/A',
    patientId: req.params.patientId || (userType === 'patient' ? user._id.toString() : req.body.patientId || 'N/A'),
    ip: req.ip || req.connection.remoteAddress
  };

  console.log('[DOCUMENT_ACCESS_AUDIT]', JSON.stringify(accessLog));
  
  // TODO: Save to audit log collection in database
  // await AuditLog.create(accessLog);

  next();
};

export default {
  verifyDocumentOwnership,
  verifyAuthorizedAccess,
  auditDocumentAccess
};
