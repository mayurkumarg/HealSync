import PatientAccess from "../../models/hospital/patientAccessModel.js";
import User from "../../models/userModel.js";
import Doctor from "../../models/hospital/doctorModel.js";
import { sendOtpToPhone } from "../../utils/otpService.js";
import { logAccessActivity } from "../../utils/activityLogger.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";

/**
 * Doctor requests access to a patient (without QR/token)
 * POST /api/access/request-by-doctor
 * Body: { patientPhone, accessType, reason }
 * Sends OTP to patient for approval
 */
const requestAccessByDoctor = handelAsyncFunction(async (req, res, next) => {
  const doctor = req.doctor;
  let { patientPhone, accessType = 'view', reason, expiryDuration = '24hours' } = req.body;

  if (!patientPhone) {
    return next(new CustomError(400, "Patient phone number is required."));
  }

  // Only view access is supported (allows viewing and uploading new data)
  if (accessType !== 'view') {
    return next(new CustomError(400, "Only 'view' access type is supported. This allows doctors to view and upload new data."));
  }

  // Convert frontend duration format to backend format
  expiryDuration = normalizeDuration(expiryDuration);

  // Find patient by phone
  const patient = await User.findOne({ phone_no: patientPhone });
  if (!patient) {
    return next(new CustomError(404, "Patient with this phone number not found."));
  }

  // Check if access already exists
  const existingAccess = await PatientAccess.findOne({
    patientId: patient._id,
    doctorId: doctor._id,
    isActive: true
  });

  if (existingAccess) {
    return next(new CustomError(400, "You already have active access to this patient."));
  }

  // Send OTP via phone/WhatsApp - this generates and stores the OTP
  const otpResult = await sendOtpToPhone(patient.phone_no, 'doctor-access-request', 6, 600);
  
  // Log the result for debugging
  console.log('OTP Send Result:', otpResult);
  
  if (!otpResult.ok && otpResult.via === 'whatsapp-error') {
    console.error('WhatsApp sending failed, but continuing with stored OTP for testing');
    // Don't fail the request - OTP is logged in console for development
  }

  // Store OTP info in patient record for verification (use the same OTP if available from fallback)
  const otp = otpResult.code || Math.floor(100000 + Math.random() * 900000).toString();
  patient.otp = otp;
  patient.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await patient.save();

  // Create pending access request (inactive until approved)
  const pendingAccess = await PatientAccess.create({
    patientId: patient._id,
    doctorId: doctor._id,
    hospitalId: doctor.hospitalId || null,
    grantedBy: patient._id,
    accessType,
    expiryDuration,
    expiresAt: expiryDuration === 'until_revoked' ? null : new Date(Date.now() + parseDuration(expiryDuration)),
    isActive: false, // Will be activated after OTP approval
    reason: reason || null
  });

  res.status(200).json({
    status: 'success',
    message: `Access request sent. An OTP has been sent to the patient at ${maskPhone(patient.phone_no)}.`,
    data: {
      requestId: pendingAccess._id,
      patientName: patient.name,
      patientPhone: maskPhone(patient.phone_no),
      otpSentTo: patient.phone_no,
      via: otpResult.via
    },
    // Include OTP in development mode for testing
    ...(process.env.NODE_ENV === 'DEV' && { debug: { otp: otp } })
  });
});

// Helper to normalize duration format from frontend (1h, 6h, 1d) to backend (1hour, 6hours, 24hours)
function normalizeDuration(duration) {
  const durationMap = {
    '1h': '1hour',
    '6h': '6hours',
    '12h': '12hours',
    '1d': '24hours',
    '3d': '3days',
    '7d': '7days',
    '14d': '7days', // Map to closest valid value
    '30d': '30days',
    'until_revoked': 'until_revoked'
  };
  return durationMap[duration] || duration; // Return as-is if already in correct format
}

// Helper to parse duration string to milliseconds
function parseDuration(duration) {
  const map = {
    '1hour': 1 * 60 * 60 * 1000,
    '6hours': 6 * 60 * 60 * 1000,
    '12hours': 12 * 60 * 60 * 1000,
    '24hours': 24 * 60 * 60 * 1000,
    '3days': 3 * 24 * 60 * 60 * 1000,
    '7days': 7 * 24 * 60 * 60 * 1000,
    '30days': 30 * 24 * 60 * 60 * 1000
  };
  return map[duration] || map['24hours'];
}

// Helper to mask phone number
function maskPhone(phone) {
  if (!phone || phone.length < 4) return phone;
  return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
}

export default requestAccessByDoctor;
