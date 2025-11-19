// backend/controllers/access/listAccesses.js
import PatientAccess from "../../models/hospital/patientAccessModel.js";

/**
 * List accesses:
 * - If patient: list doctors who have access to them
 * - If doctor: list patients to which they have access
 */
export default async function listAccesses(req, res) {
  try {
    const actor = req.actor;
    if (!actor) return res.status(401).json({ status: "failed", message: "Unauthorized." });

    if (actor.type.toLowerCase() === "user") {
      const items = await PatientAccess.find({ patientId: actor.doc._id }).populate("doctorId", "name email specialization").lean();
      return res.status(200).json({ status: "success", count: items.length, data: items });
    } else if (actor.type.toLowerCase() === "doctor") {
      const items = await PatientAccess.find({ doctorId: actor.doc._id }).populate("patientId", "name email phone_no").lean();
      return res.status(200).json({ status: "success", count: items.length, data: items });
    } else {
      return res.status(400).json({ status: "failed", message: "Unknown actor type." });
    }
  } catch (err) {
    console.error("listAccesses:", err);
    return res.status(500).json({ status: "error", message: "Could not list accesses." });
  }
}
