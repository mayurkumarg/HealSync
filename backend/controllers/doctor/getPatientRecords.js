import PatientAccess from "../../models/hospital/patientAccessModel.js";
import User from "../../models/userModel.js";
import FormEntry from "../../models/formEntryModel.js";
import { MedicalDocument } from "../../models/models.js";
import BPTracking from "../../models/bp.js";
import SugarTracking from "../../models/sugar.js";
import Reminder from "../../models/medical/reminder.js";
import { logAccessActivity } from "../../utils/activityLogger.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";

/**
 * Doctor views patient records
 * GET /api/doctor/patient/:patientId/records
 * Returns patient profile, health forms, documents based on access level
 */
const getPatientRecords = handelAsyncFunction(async (req, res, next) => {
  const doctor = req.doctor;
  const { patientId } = req.params;

  // Verify doctor has active access to this patient
  const access = await PatientAccess.findOne({
    patientId,
    doctorId: doctor._id,
    isActive: true,
    $or: [
      { expiresAt: null }, // No expiry
      { expiresAt: { $gt: new Date() } } // Not expired
    ]
  });

  if (!access) {
    return next(new CustomError(403, "You don't have active access to this patient's records."));
  }

  // Fetch patient data
  const patient = await User.findById(patientId)
    .select('-password -token -tokenExpires -otp -otpExpires')
    .lean();

  if (!patient) {
    return next(new CustomError(404, "Patient not found."));
  }

  // Fetch health forms with creator info
  const healthForms = await FormEntry.find({ patientId })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Fetch medical documents
  const documents = await MedicalDocument.find({ patientId })
    .sort({ uploadedAt: -1 })
    .limit(50)
    .lean();

  // Fetch BP readings
  const bpData = await BPTracking.findOne({ userId: patientId })
    .select('-__v')
    .lean();

  // Fetch Sugar readings
  const sugarData = await SugarTracking.findOne({ userId: patientId })
    .select('-__v')
    .lean();

  // Fetch Reminders
  const reminders = await Reminder.find({ userId: patientId })
    .sort({ reminderDateTime: -1 })
    .limit(20)
    .lean();

  // Log this activity
  await logAccessActivity({
    patientId,
    doctorId: doctor._id,
    accessId: access._id,
    action: 'view_dashboard',
    details: {
      resourceType: 'patient_records',
      resourceId: patientId
    },
    req
  });

  res.status(200).json({
    status: 'success',
    data: {
      patient,
      healthForms,
      documents,
      bpData: bpData || null,
      sugarData: sugarData || null,
      reminders: reminders || [],
      accessInfo: {
        accessType: 'view',
        expiresAt: access.expiresAt,
        grantedAt: access.createdAt,
        canView: true,
        canUpload: true,
        canEdit: false,
        canDelete: false
      }
    }
  });
});

export default getPatientRecords;
