import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Doctor from "../../models/hospital/doctorModel.js";

/**
 * @route  PATCH /api/consultations/doctor/settings
 * @body   { enabled?, fee?, avgMinutes? }
 * @access Doctor
 */
const updateConsultationSettings = handelAsyncFunction(async (req, res, next) => {
  const { enabled, fee, avgMinutes } = req.body;

  const update = {};
  if (typeof enabled === "boolean") update["consultation.enabled"] = enabled;
  if (fee !== undefined) update["consultation.fee"] = fee === null ? null : Number(fee);
  if (avgMinutes !== undefined) update["consultation.avgMinutes"] = Number(avgMinutes);

  if (Object.keys(update).length === 0) {
    return next(new CustomError(400, "No settings provided."));
  }

  const doctor = await Doctor.findByIdAndUpdate(req.doctor._id, update, {
    new: true,
    runValidators: true,
  }).select("consultation");

  res.status(200).json({ status: "success", message: "Consultation settings updated.", data: doctor.consultation });
});

export default updateConsultationSettings;
