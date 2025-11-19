import FormEntry from "../../models/formEntryModel.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

export default async function deleteFormEntry(req, res) {
  try {
    const actor = req.actor;
    if (!actor) return res.status(401).json({ status: "failed", message: "Unauthorized" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ status: "failed", message: "id required." });

    const entry = await FormEntry.findById(id);
    if (!entry) return res.status(404).json({ status: "failed", message: "Form entry not found." });

    // Users can delete only their own created entries
    if (actor.type === "user") {
      if (actor.doc._id.toString() !== entry.createdBy.toString()) {
        return res.status(403).json({ status: "failed", message: "Users can only delete entries they created." });
      }
      await entry.deleteOne();
      return res.status(200).json({ status: "success", message: "Deleted." });
    }

    // Doctor: can delete if they created or if they have 'full' access
    if (actor.type === "doctor") {
      if (entry.createdBy.toString() === actor.doc._id.toString() && entry.creatorModel === "Doctor") {
        await entry.deleteOne();
        return res.status(200).json({ status: "success", message: "Deleted." });
      }

      const access = await PatientAccess.findOne({
        patientId: new ObjectId(entry.patientId),
        doctorId: actor.doc._id,
        isActive: true
      });

      if (!access) {
        return res.status(403).json({ status: "failed", message: "Doctor does not have access to this patient." });
      }

      if (access.accessType === "full") {
        await entry.deleteOne();
        return res.status(200).json({ status: "success", message: "Deleted." });
      }

      return res.status(403).json({ status: "failed", message: "Doctor lacks permission to delete this entry." });
    }

    return res.status(403).json({ status: "failed", message: "Unauthorized actor." });
  } catch (err) {
    console.error("deleteFormEntry:", err);
    return res.status(500).json({ status: "error", message: "Could not delete entry." });
  }
}