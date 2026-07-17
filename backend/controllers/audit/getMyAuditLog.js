import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import { AuditLog } from "../../models/models.js";
import Doctor from "../../models/hospital/doctorModel.js";
import User from "../../models/userModel.js";

/**
 * @route  GET /api/audit/mine
 * @desc   Patient-visible record-access log — "who viewed your records and when." AuditLog rows
 *         are written by middleware/documentAccess.js's auditDocumentAccess on every document/
 *         record read, but were never read back to the patient before this. Excludes the
 *         patient's own routine self-views (performedBy === the patient) so this only surfaces
 *         genuine third-party access — the actual trust-relevant signal.
 * @access Patient
 */
const getMyAuditLog = handelAsyncFunction(async (req, res) => {
  const patientId = req.user._id;

  const entries = await AuditLog.find({ patientId, performedBy: { $ne: patientId } })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

  // performedBy can be a Doctor or a User id depending on who acted (see extra.userRole) — the
  // schema ref only covers User, so resolve names manually rather than via populate().
  const doctorIds = entries.filter((e) => e.extra?.userRole === "doctor").map((e) => e.performedBy);
  const otherIds = entries.filter((e) => e.extra?.userRole !== "doctor").map((e) => e.performedBy);

  const [doctors, users] = await Promise.all([
    Doctor.find({ _id: { $in: doctorIds } }).select("name specialization").lean(),
    User.find({ _id: { $in: otherIds } }).select("name").lean(),
  ]);
  const nameById = new Map([
    ...doctors.map((d) => [d._id.toString(), { name: d.name, role: "doctor", specialization: d.specialization }]),
    ...users.map((u) => [u._id.toString(), { name: u.name, role: "user" }]),
  ]);

  const data = entries.map((e) => ({
    _id: e._id,
    action: e.action,
    documentId: e.documentId || null,
    timestamp: e.timestamp,
    performedBy: nameById.get(e.performedBy?.toString()) || { name: "Someone", role: e.extra?.userRole || "unknown" },
  }));

  res.status(200).json({ status: "success", data });
});

export default getMyAuditLog;
