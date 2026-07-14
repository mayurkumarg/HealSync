import PatientAccess from "../../models/hospital/patientAccessModel.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";

/**
 * Doctor updates patient profile or health form
 * PATCH /api/doctor-access/patient/:patientId/update
 * DEPRECATED: Doctors can only VIEW and UPLOAD new data, not edit existing records
 */
const updatePatientRecord = handelAsyncFunction(async (req, res, next) => {
  const doctor = req.doctor;
  const { patientId } = req.params;
  const { type, data } = req.body;

  if (!type || !['profile', 'form'].includes(type)) {
    return next(new CustomError(400, "Invalid update type. Must be 'profile' or 'form'."));
  }

  if (!data || Object.keys(data).length === 0) {
    return next(new CustomError(400, "No data provided for update."));
  }

  // Verify active access
  const access = await PatientAccess.findOne({
    patientId,
    doctorId: doctor._id,
    isActive: true
  });

  if (!access) {
    return next(new CustomError(403, "You don't have access to this patient's records."));
  }

  // Check expiry
  if (access.expiresAt && new Date() > new Date(access.expiresAt)) {
    return next(new CustomError(403, "Your access to this patient has expired."));
  }

  // Doctors cannot edit existing data - only view and upload new data
  return next(new CustomError(403, "Doctors can only view patient records and upload new data. Editing existing records is not allowed."));
});

export default updatePatientRecord;
