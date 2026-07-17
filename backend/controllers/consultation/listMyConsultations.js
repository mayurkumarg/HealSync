import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import Consultation from "../../models/consultationModel.js";

/**
 * @route  GET /api/consultations/mine?scope=upcoming|past|all
 * @access Patient
 */
const listMyConsultations = handelAsyncFunction(async (req, res) => {
  const patientId = req.user._id;
  const scope = req.query.scope || "all";

  const filter = { patientId };
  if (scope === "upcoming") {
    filter.scheduledAt = { $gte: new Date() };
    filter.status = { $in: ["requested", "confirmed"] };
  } else if (scope === "past") {
    filter.$or = [{ scheduledAt: { $lt: new Date() } }, { status: { $in: ["completed", "cancelled", "no_show"] } }];
  }

  const consultations = await Consultation.find(filter)
    .sort({ scheduledAt: scope === "past" ? -1 : 1 })
    .populate("doctorId", "name specialization")
    .lean();

  res.status(200).json({ status: "success", data: consultations });
});

export default listMyConsultations;
