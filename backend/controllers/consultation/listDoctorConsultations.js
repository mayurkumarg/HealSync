import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import Consultation from "../../models/consultationModel.js";

/**
 * @route  GET /api/consultations/doctor/list?scope=today|upcoming|past|all
 * @access Doctor
 */
const listDoctorConsultations = handelAsyncFunction(async (req, res) => {
  const doctorId = req.doctor._id;
  const scope = req.query.scope || "all";

  const filter = { doctorId };
  const now = new Date();

  if (scope === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    filter.scheduledAt = { $gte: start, $lte: end };
    filter.status = { $in: ["requested", "confirmed"] };
  } else if (scope === "upcoming") {
    filter.scheduledAt = { $gte: now };
    filter.status = { $in: ["requested", "confirmed"] };
  } else if (scope === "past") {
    filter.$or = [{ scheduledAt: { $lt: now } }, { status: { $in: ["completed", "cancelled", "no_show"] } }];
  }

  const consultations = await Consultation.find(filter)
    .sort({ scheduledAt: scope === "past" ? -1 : 1 })
    .populate("patientId", "name email phone_no")
    .lean();

  res.status(200).json({ status: "success", data: consultations });
});

export default listDoctorConsultations;
