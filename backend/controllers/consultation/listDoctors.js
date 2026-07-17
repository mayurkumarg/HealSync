import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import Doctor from "../../models/hospital/doctorModel.js";

/**
 * @route  GET /api/consultations/doctors?specialization=&search=&page=&limit=
 * @desc   Patient-facing discovery of doctors open for consultation bookings.
 * @access Patient
 *
 * Gated on `verified` (email-verified) + `consultation.enabled` rather than the business
 * `verification.status`, because that status can only ever be set by a hospital — an
 * independently self-registered doctor (hospitalId: null) has no path to "verified" business
 * status at all, which would otherwise make them permanently undiscoverable.
 */
const listDoctors = handelAsyncFunction(async (req, res) => {
  const { specialization, search } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter = { verified: true, "consultation.enabled": true };
  if (specialization) filter.specialization = { $regex: `^${specialization}$`, $options: "i" };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { specialization: { $regex: search, $options: "i" } },
    ];
  }

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .select("name specialization experienceYears verification hospitalId consultation")
      .populate("hospitalId", "name type")
      .sort({ experienceYears: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    data: doctors,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

export default listDoctors;
