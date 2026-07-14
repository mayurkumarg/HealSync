import PatientAccess from "../../models/hospital/patientAccessModel.js";
import User from "../../models/userModel.js";
import { logAccessActivity } from "../../utils/activityLogger.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";

/**
 * Doctor submits OTP (that patient received) to complete access request
 * POST /api/access/approve-doctor-request
 * Body: { requestId, otp }
 * Auth: Doctor JWT (req.actor or req.doctor)
 */
const approveDoctorRequest = handelAsyncFunction(async (req, res, next) => {
  // Support both identifyActor middleware (req.actor) and doctorAuthorize (req.doctor)
  const doctor = req.doctor || (req.actor?.type === 'doctor' ? req.actor.doc : null);
  
  if (!doctor) {
    return next(new CustomError(401, "Only doctors can submit OTP for access requests."));
  }

  const { requestId, otp } = req.body;

  if (!requestId || !otp) {
    return next(new CustomError(400, "Request ID and OTP are required."));
  }

  // Find the pending access request
  const accessRequest = await PatientAccess.findOne({
    _id: requestId,
    doctorId: doctor._id,
    isActive: false
  }).populate('patientId', 'name email phone_no otp otpExpires');

  if (!accessRequest) {
    return next(new CustomError(404, "Access request not found or already processed."));
  }

  const patient = accessRequest.patientId;

  // Verify OTP
  if (!patient.otp || patient.otp !== otp) {
    return next(new CustomError(401, "Invalid OTP. Please check the code sent to patient."));
  }

  if (patient.otpExpires && Date.now() > patient.otpExpires) {
    return next(new CustomError(401, "OTP has expired. Please request access again."));
  }

  // Activate the access
  accessRequest.isActive = true;
  await accessRequest.save();

  // Clear OTP
  await User.updateOne(
    { _id: patient._id },
    { $set: { otp: null, otpExpires: null } }
  );

  // Log activity
  await logAccessActivity({
    patientId: patient._id,
    doctorId: doctor._id,
    accessId: accessRequest._id,
    action: 'access_granted',
    details: {
      method: 'doctor_otp_verification',
      resourceType: 'access_request',
      resourceId: requestId
    },
    req
  });

  res.status(200).json({
    status: 'success',
    message: `Access granted! You can now access ${patient.name}'s medical records.`,
    data: {
      accessId: accessRequest._id,
      patientName: patient.name,
      accessType: accessRequest.accessType,
      expiresAt: accessRequest.expiresAt
    }
  });
});

export default approveDoctorRequest;
