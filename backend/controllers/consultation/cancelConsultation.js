import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Consultation from "../../models/consultationModel.js";
import { Notification } from "../../models/models.js";

/**
 * @route  PATCH /api/consultations/:id/cancel
 * @body   { reason? }
 * @access Patient or Doctor (via identifyActor)
 */
const cancelConsultation = handelAsyncFunction(async (req, res, next) => {
  const actor = req.actor;
  if (!actor) return next(new CustomError(401, "Unauthorized."));

  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) return next(new CustomError(404, "Consultation not found."));

  const isPatient = actor.type === "user" && actor.doc._id.toString() === consultation.patientId.toString();
  const isDoctor = actor.type === "doctor" && actor.doc._id.toString() === consultation.doctorId.toString();
  if (!isPatient && !isDoctor) {
    return next(new CustomError(403, "You do not have permission to cancel this consultation."));
  }

  if (["completed", "cancelled"].includes(consultation.status)) {
    return next(new CustomError(400, `Cannot cancel a consultation with status "${consultation.status}".`));
  }

  consultation.status = "cancelled";
  consultation.cancelledBy = isPatient ? "patient" : "doctor";
  consultation.cancelReason = req.body.reason || null;
  await consultation.save();

  if (isDoctor) {
    Notification.create({
      userId: consultation.patientId,
      type: "consultation",
      message: `Dr. ${actor.doc.name} cancelled your consultation${consultation.cancelReason ? `: ${consultation.cancelReason}` : "."}`,
    }).catch((err) => console.error("[NOTIFICATION] Failed to create:", err.message));
  }

  res.status(200).json({ status: "success", message: "Consultation cancelled.", data: consultation });
});

export default cancelConsultation;
