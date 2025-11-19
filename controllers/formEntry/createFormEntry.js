// backend/controllers/formEntry/createFormEntry.js
import FormEntry from "../../models/formEntryModel.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";

/**
 * Creates a new form entry.
 * - If actor is a patient, they can create for themselves.
 * - If actor is a doctor, they must have 'edit' or 'full' access granted via PatientAccess.
 *
 * Body: { patientId, formType, data, ... }
 */
export default async function createFormEntry(req, res) {
  try {
    const actor = req.actor;
    if (!actor) {
      return res.status(401).json({ status: "failed", message: "Unauthorized." });
    }

    const { patientId, formType, data } = req.body;
    if (!patientId || !formType || !data) {
      return res.status(400).json({ status: "failed", message: "patientId, formType, and data are required." });
    }

    let canCreate = false;

    // Case 1: The actor is the patient themselves.
    if (actor.type.toLowerCase() === "user" && actor.doc._id.toString() === patientId) {
      canCreate = true;
    }
    // Case 2: The actor is a doctor.
    else if (actor.type.toLowerCase() === "doctor") {
      const access = await PatientAccess.findOne({
        patientId: patientId,
        doctorId: actor.doc._id,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      // Check if access exists and has sufficient permissions
      if (access && ["edit", "full"].includes(access.accessType)) {
        canCreate = true;
      }
    }

    if (!canCreate) {
      return res.status(403).json({ status: "failed", message: "You do not have permission to create a form entry for this patient." });
    }

    // Permission granted, create the form entry
    const formEntry = await FormEntry.create({
      patientId: patientId,
      category: formType, // Assuming formType maps to category
      data: data,
      createdBy: actor.doc._id,
      creatorModel: actor.type, // This was the missing field
    });

    return res.status(201).json({ status: "success", data: formEntry });

  } catch (err) {
    console.error("createFormEntry:", err);
    return res.status(500).json({ status: "error", message: "Could not create form entry." });
  }
}