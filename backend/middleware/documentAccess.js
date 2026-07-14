// backend/middleware/documentAccess.js
import { MedicalDocument, AuditLog } from "../models/models.js";
import PatientAccess from "../models/hospital/patientAccessModel.js";

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
 * Middleware to check if a doctor/hospital has an active, unexpired PatientAccess
 * grant for the requested patient. Must run after doctorAuthorize or hospitalAuthorize
 * (which set req.doctor/req.role or req.hospital/req.role — there is no req.user here).
 */
export const verifyAuthorizedAccess = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const requesterRole = req.role;
    const requester = requesterRole === "doctor" ? req.doctor : requesterRole === "hospital" ? req.hospital : null;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required"
      });
    }

    if (!requester || !['doctor', 'hospital'].includes(requesterRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only authorized medical professionals can access patient documents.",
        error: "UNAUTHORIZED_ROLE"
      });
    }

    const requesterId = requester._id.toString();
    const accessQuery = {
      patientId,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      ...(requesterRole === "doctor" ? { doctorId: requesterId } : { hospitalId: requesterId }),
    };

    const access = await PatientAccess.findOne(accessQuery);

    if (!access) {
      console.warn(`[UNAUTHORIZED_ACCESS] ${requesterRole} ${requesterId} has no active access grant for patient ${patientId}`);
      return res.status(403).json({
        success: false,
        message: "You don't have active access to this patient's records.",
        error: "NO_ACTIVE_ACCESS_GRANT"
      });
    }

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
  // Support req.user (authorize), req.actor (identifyActor), req.doctor/req.hospital (doctorAuthorize/hospitalAuthorize)
  const user = req.user || req.actor?.doc || req.doctor || req.hospital;
  const userType = req.actor?.type || req.role || 'patient';

  if (!user) {
    console.warn('[DOCUMENT_ACCESS_AUDIT] No user found in request');
    return next();
  }

  const patientId = req.params.patientId || (userType === 'patient' ? user._id.toString() : req.body.patientId || null);

  const accessLog = {
    timestamp: new Date().toISOString(),
    userId: user._id.toString(),
    userRole: user.role || userType,
    action: req.method,
    endpoint: req.originalUrl,
    documentId: req.params.id || 'N/A',
    patientId: patientId || 'N/A',
    ip: req.ip || req.connection.remoteAddress
  };

  console.log('[DOCUMENT_ACCESS_AUDIT]', JSON.stringify(accessLog));

  // Persist for HIPAA-style audit trail; a logging failure must never block the request.
  try {
    await AuditLog.create({
      action: `${req.method} ${req.originalUrl}`,
      performedBy: user._id,
      patientId: patientId && patientId !== 'N/A' ? patientId : undefined,
      documentId: req.params.id || undefined,
      extra: { userRole: accessLog.userRole, ip: accessLog.ip },
    });
  } catch (err) {
    console.error('[DOCUMENT_ACCESS_AUDIT] Failed to persist audit log:', err.message);
  }

  next();
};

export default {
  verifyDocumentOwnership,
  verifyAuthorizedAccess,
  auditDocumentAccess
};
