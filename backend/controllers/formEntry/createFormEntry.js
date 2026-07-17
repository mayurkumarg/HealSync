// backend/controllers/formEntry/createFormEntry.js
import FormEntry from "../../models/formEntryModel.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";
import userModel from "../../models/userModel.js";
import { notifyDoctorFormEntry } from "../../service/email.js";

/**
 * Creates a new form entry.
 * - If actor is a patient, they can create for themselves.
 * - If actor is a doctor, they must have 'view' access granted via PatientAccess (allows viewing and uploading).
 *
 * Body: { patientId, formType, data, ... }
 */
export default async function createFormEntry(req, res) {
  try {
    const actor = req.actor;
    if (!actor) {
      return res.status(401).json({ status: "failed", message: "Unauthorized." });
    }

    const { formType, data, description } = req.body;
    if (!formType || !data) {
      return res.status(400).json({ status: "failed", message: "formType and data are required." });
    }

    // Get patientId from body if provided (for doctors creating for patients)
    // Otherwise use actor's ID (patient creating for themselves)
    let patientId = req.body.patientId || actor.doc._id.toString();
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
      });

      // Check expiry if expiresAt is set
      const isExpired = access?.expiresAt && new Date() > new Date(access.expiresAt);

      // Check if access exists and is not expired (view access allows uploading new data)
      if (access && !isExpired) {
        canCreate = true;
      }


      const userDetails = await userModel.findById(patientId);


      // notifyForm(doctor=actor.doc, patient=userDetails);
      //notify user that doctor has created a form entry for them
      notifyDoctorFormEntry(actor.doc, userDetails,req.body,"Prescription");

    }



    if (!canCreate) {
      return res.status(403).json({ status: "failed", message: "You do not have permission to create a form entry for this patient." });
    }

    // Permission granted, create the form entry
    const formEntry = await FormEntry.create({
      patientId: patientId,
      category: formType,
      data: data,
      description: description || "",
      createdBy: actor.doc._id,
      creatorModel: actor.type.charAt(0).toUpperCase() + actor.type.slice(1),
    });

    return res.status(201).json({ status: "success", data: formEntry });

  } catch (err) {
    console.error("[FORM ENTRY] Error:", err);
    return res.status(500).json({ status: "error", message: "Could not create form entry." });
  }
}