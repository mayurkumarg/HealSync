import PatientAccess from "../../models/hospital/patientAccessModel.js";
import User from "../../models/userModel.js";
import FormEntry from "../../models/formEntryModel.js";
import { logAccessActivity } from "../../utils/activityLogger.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";

/**
 * Doctor updates patient profile or health form
 * PATCH /api/doctor-access/patient/:patientId/update
 * Body: { type: 'profile' | 'form', data: {...}, formId?: '...' }
 * Requires edit or full access
 */
const updatePatientRecord = handelAsyncFunction(async (req, res, next) => {
  const doctor = req.doctor;
  const { patientId } = req.params;
  const { type, data, formId } = req.body;

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

  // Check permissions - must have edit or full access
  if (access.accessType === 'view') {
    return next(new CustomError(403, "You only have view access. Edit permission required."));
  }

  let updatedRecord;
  let changesMade = {};

  if (type === 'profile') {
    // Update patient profile
    const patient = await User.findById(patientId);
    if (!patient) {
      return next(new CustomError(404, "Patient not found."));
    }

    // Restrict fields that can be updated
    const allowedFields = ['age', 'gender', 'phone_no', 'emergencyContact', 'address', 'bloodGroup'];
    const updateData = {};
    
    // Track changes
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        changesMade[field] = {
          before: patient[field],
          after: data[field]
        };
        updateData[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return next(new CustomError(400, "No valid fields to update."));
    }

    // Update patient
    Object.assign(patient, updateData);
    updatedRecord = await patient.save();

    // Remove sensitive fields
    const patientData = patient.toObject();
    delete patientData.password;
    delete patientData.passwordResetToken;
    delete patientData.otp;
    delete patientData.otpExpires;

    updatedRecord = patientData;

    // Log activity
    await logAccessActivity({
      patientId,
      doctorId: doctor._id,
      accessId: access._id,
      action: 'edit_profile',
      details: {
        resourceType: 'profile',
        changesMade
      },
      req
    });

  } else if (type === 'form') {
    // Update health form
    if (!formId) {
      return next(new CustomError(400, "Form ID is required for form updates."));
    }

    const form = await FormEntry.findById(formId);
    if (!form) {
      return next(new CustomError(404, "Health form not found."));
    }

    if (form.patientId.toString() !== patientId) {
      return next(new CustomError(403, "This form doesn't belong to the specified patient."));
    }

    // Track changes
    changesMade = {
      formType: form.formType,
      before: { ...form.data },
      after: data
    };

    // Update form data
    form.data = { ...form.data, ...data };
    form.updatedAt = Date.now();
    updatedRecord = await form.save();

    // Log activity
    await logAccessActivity({
      patientId,
      doctorId: doctor._id,
      accessId: access._id,
      action: 'edit_form',
      details: {
        resourceType: 'health_form',
        resourceId: formId,
        changesMade
      },
      req
    });
  }

  res.status(200).json({
    status: 'success',
    message: `Patient ${type} updated successfully.`,
    data: {
      updated: updatedRecord,
      changes: changesMade
    }
  });
});

export default updatePatientRecord;
