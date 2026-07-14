import AccessActivityLog from "../models/AccessActivityLog.js";

/**
 * Utility to log doctor activities on patient records
 * @param {Object} params - Logging parameters
 * @param {String} params.patientId - Patient's user ID
 * @param {String} params.doctorId - Doctor's ID
 * @param {String} params.accessId - PatientAccess ID
 * @param {String} params.action - Action type
 * @param {Object} params.details - Additional context
 * @param {Object} params.req - Express request object (optional, for IP/UA)
 */
export async function logAccessActivity({
  patientId,
  doctorId,
  accessId,
  action,
  details = {},
  req = null
}) {
  try {
    const logData = {
      patientId,
      doctorId,
      accessId,
      action,
      details: {
        ...details,
        ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
        userAgent: req?.headers?.['user-agent'] || 'unknown'
      }
    };

    await AccessActivityLog.create(logData);
  } catch (error) {
    console.error('Failed to log access activity:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
}

/**
 * Get activity logs for a patient (what doctors have done)
 */
export async function getPatientActivityLogs(patientId, limit = 50) {
  try {
    return await AccessActivityLog.find({ patientId })
      .populate('doctorId', 'name email specialization')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return [];
  }
}

/**
 * Get activity logs for a doctor (what they've accessed)
 */
export async function getDoctorActivityLogs(doctorId, limit = 50) {
  try {
    return await AccessActivityLog.find({ doctorId })
      .populate('patientId', 'name email')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return [];
  }
}
