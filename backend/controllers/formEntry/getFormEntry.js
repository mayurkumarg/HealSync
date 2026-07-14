import FormEntry from "../../models/formEntryModel.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

export default async function getFormEntry(req, res) {
  try {
    const actor = req.actor;
    if (!actor) return res.status(401).json({ status: "failed", message: "Unauthorized" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ status: "failed", message: "id required." });

    const entry = await FormEntry.findById(id).populate("createdBy", "name email").lean();
    if (!entry) return res.status(404).json({ status: "failed", message: "Form entry not found." });

    // authorization: if actor is User, must be the patient
    if (actor.type === "user") {
      if (actor.doc._id.toString() !== entry.patientId.toString()) {
        return res.status(403).json({ status: "failed", message: "Users can only view their own entries." });
      }
    } else {
      // Doctor -> ensure has view access
      const access = await PatientAccess.findOne({
        patientId: new ObjectId(entry.patientId),
        doctorId: actor.doc._id,
        isActive: true
      });
      if (!access) {
        return res.status(403).json({ status: "failed", message: "Doctor does not have access to this patient." });
      }
    }

    return res.status(200).json({ status: "success", data: entry });
  } catch (err) {
    console.error("getFormEntry:", err);
    return res.status(500).json({ status: "error", message: "Could not fetch entry." });
  }
}