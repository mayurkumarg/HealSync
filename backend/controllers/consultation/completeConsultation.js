import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Consultation from "../../models/consultationModel.js";
import { Notification } from "../../models/models.js";

/**
 * @route  PATCH /api/consultations/:id/complete
 * @body   { notes?, prescriptionText? }
 * @access Doctor
 */
const completeConsultation = handelAsyncFunction(async (req, res, next) => {
  const consultation = await Consultation.findOne({ _id: req.params.id, doctorId: req.doctor._id });
  if (!consultation) return next(new CustomError(404, "Consultation not found."));
  if (!["requested", "confirmed"].includes(consultation.status)) {
    return next(new CustomError(400, `Cannot complete a consultation with status "${consultation.status}".`));
  }

  consultation.status = "completed";
  consultation.notes = req.body.notes || null;
  consultation.prescriptionText = req.body.prescriptionText || null;
  consultation.completedAt = new Date();
  await consultation.save();

  Notification.create({
    userId: consultation.patientId,
    type: "consultation",
    message: `Dr. ${req.doctor.name} completed your consultation${consultation.notes ? " and added notes" : ""}.`,
  }).catch((err) => console.error("[NOTIFICATION] Failed to create:", err.message));

  res.status(200).json({ status: "success", message: "Consultation marked complete.", data: consultation });
});

export default completeConsultation;
