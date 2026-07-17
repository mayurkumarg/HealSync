import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Doctor from "../../models/hospital/doctorModel.js";
import Consultation from "../../models/consultationModel.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";

const VALID_MODES = ["video", "audio", "chat", "in_person"];

/**
 * @route  POST /api/consultations
 * @desc   Patient books a consultation with a doctor. Also grants (or extends) a 7-day
 *         PatientAccess "view" grant so the doctor can review the patient's records ahead of
 *         and around the appointment — reuses the existing permission system rather than
 *         inventing a parallel one for consultations.
 * @access Patient
 */
const bookConsultation = handelAsyncFunction(async (req, res, next) => {
  const patientId = req.user._id;
  const { doctorId, scheduledAt, reason, mode } = req.body;

  if (!doctorId || !scheduledAt) {
    return next(new CustomError(400, "doctorId and scheduledAt are required."));
  }
  if (mode && !VALID_MODES.includes(mode)) {
    return next(new CustomError(400, `mode must be one of: ${VALID_MODES.join(", ")}`));
  }

  const slotDate = new Date(scheduledAt);
  if (Number.isNaN(slotDate.getTime()) || slotDate <= new Date()) {
    return next(new CustomError(400, "scheduledAt must be a valid future date/time."));
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor || !doctor.verified || !doctor.consultation?.enabled) {
    return next(new CustomError(404, "Doctor not found or not open for consultations."));
  }

  const durationMinutes = doctor.consultation.avgMinutes || 20;
  const slotEnd = new Date(slotDate.getTime() + durationMinutes * 60000);

  // Re-check the slot is still free (defends against a race with getDoctorSlots' snapshot).
  const conflict = await Consultation.findOne({
    doctorId,
    status: { $in: ["requested", "confirmed"] },
    scheduledAt: { $lt: slotEnd },
    $expr: { $gt: [{ $add: ["$scheduledAt", { $multiply: ["$durationMinutes", 60000] }] }, slotDate.getTime()] },
  });
  if (conflict) {
    return next(new CustomError(409, "That slot was just booked. Please pick another time."));
  }

  // Grant (or extend) 7-day record access for this doctor, consistent with the existing
  // access-sharing system used everywhere else in the app.
  const expiresAt = new Date(Math.max(slotEnd.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1000);
  const accessGrant = await PatientAccess.findOneAndUpdate(
    { patientId, doctorId },
    {
      $setOnInsert: { grantedBy: patientId, hospitalId: doctor.hospitalId || null },
      $set: {
        accessType: "view",
        expiryDuration: "7days",
        expiresAt,
        isActive: true,
        reason: "Consultation booking",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const consultation = await Consultation.create({
    patientId,
    doctorId,
    hospitalId: doctor.hospitalId || null,
    scheduledAt: slotDate,
    durationMinutes,
    mode: mode || "video",
    reason: reason || null,
    fee: doctor.consultation.fee ?? null,
    accessGrantId: accessGrant._id,
  });

  res.status(201).json({ status: "success", message: "Consultation requested.", data: consultation });
});

export default bookConsultation;
