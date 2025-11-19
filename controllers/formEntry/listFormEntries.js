// backend/controllers/formEntry/listFormEntries.js
import FormEntry from "../../models/formEntryModel.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

export default async function listFormEntries(req, res) {
  try {
    const actor = req.actor;
    if (!actor) return res.status(401).json({ status: "failed", message: "Unauthorized" });

    const { patientId } = req.params;
    if (!patientId) return res.status(400).json({ status: "failed", message: "patientId required." });

    // Validate and convert patientId to ObjectId
    if (!mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ status: "failed", message: "Invalid patientId." });
    }
    const pId = new ObjectId(patientId);

    // Normalize actor type to lowercase
    const actorType = (actor.type || "").toString().toLowerCase();
    const isUser = actorType === "user";

    // If actor is User: only allow if same user
    if (isUser) {
      if (actor.doc._id.toString() !== pId.toString()) {
        return res.status(403).json({ status: "failed", message: "Users can only view their own entries." });
      }
    } else {
      // Doctor: ensure has at least view access
      const access = await PatientAccess.findOne({
        patientId: pId,
        doctorId: actor.doc._id,
        isActive: true
      });

      if (!access) {
        return res.status(403).json({ status: "failed", message: "Doctor does not have access to this patient's history." });
      }
    }

    const entries = await FormEntry.find({ patientId: pId })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .lean();

    return res.status(200).json({ status: "success", count: entries.length, data: entries });
  } catch (err) {
    console.error("listFormEntries:", err);
    return res.status(500).json({ status: "error", message: "Could not list entries." });
  }
}