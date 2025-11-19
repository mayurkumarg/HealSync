import FormEntry from "../../models/formEntryModel.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

export default async function updateFormEntry(req, res) {
  try {
    const actor = req.actor;
    if (!actor) return res.status(401).json({ status: "failed", message: "Unauthorized" });

    const { id } = req.params;
    const updates = req.body;
    if (!id) return res.status(400).json({ status: "failed", message: "id required." });

    const entry = await FormEntry.findById(id);
    if (!entry) return res.status(404).json({ status: "failed", message: "Form entry not found." });

    // If actor is User
    if (actor.type === "user") {
      if (actor.doc._id.toString() !== entry.createdBy.toString()) {
        return res.status(403).json({ status: "failed", message: "Users can only update entries they created." });
      }
      Object.assign(entry, updates);
      await entry.save();
      return res.status(200).json({ status: "success", data: entry });
    }

    // Actor is Doctor
    if (actor.type === "doctor") {
      if (entry.createdBy.toString() === actor.doc._id.toString() && entry.creatorModel === "Doctor") {
        Object.assign(entry, updates);
        await entry.save();
        return res.status(200).json({ status: "success", data: entry });
      }

      const access = await PatientAccess.findOne({
        patientId: new ObjectId(entry.patientId),
        doctorId: actor.doc._id,
        isActive: true
      });

      if (!access) {
        return res.status(403).json({ status: "failed", message: "Doctor does not have access to this patient." });
      }

      if (access.accessType === "edit" || access.accessType === "full") {
        Object.assign(entry, updates);
        entry.isVerifiedByDoctor = true;
        await entry.save();
        return res.status(200).json({ status: "success", data: entry });
      }

      return res.status(403).json({ status: "failed", message: "Doctor has view-only access and cannot update entries." });
    }

    return res.status(403).json({ status: "failed", message: "Unauthorized actor." });
  } catch (err) {
    console.error("updateFormEntry:", err);
    return res.status(500).json({ status: "error", message: "Could not update entry." });
  }
}