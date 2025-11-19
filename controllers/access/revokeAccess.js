// backend/controllers/access/revokeAccess.js
import PatientAccess from "../../models/hospital/patientAccessModel.js";
import mongoose from "mongoose";

/**
 * Patient revokes an active access entry.
 * Body: { doctorId }
 * Auth: patient
 */
export default async function revokeAccess(req, res) {
  try {
    const actor = req.actor;
    if (!actor || actor.type.toLowerCase() !== "user") return res.status(401).json({ status: "failed", message: "Only patient may revoke access." });
    const { doctorId } = req.body;
    if (!doctorId) return res.status(400).json({ status: "failed", message: "doctorId required." });

    const pa = await PatientAccess.findOneAndUpdate(
      { patientId: actor.doc._id, doctorId: mongoose.Types.ObjectId(doctorId), isActive: true },
      { isActive: false, expiresAt: new Date() },
      { new: true }
    );

    if (!pa) return res.status(404).json({ status: "failed", message: "Active access not found." });
    return res.status(200).json({ status: "success", message: "Access revoked.", data: pa });
  } catch (err) {
    console.error("revokeAccess:", err);
    return res.status(500).json({ status: "error", message: "Could not revoke access." });
  }
}
