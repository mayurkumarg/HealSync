// backend/controllers/access/revokeAccess.js
import PatientAccess from "../../models/hospital/patientAccessModel.js";
import { logAccessActivity } from "../../utils/activityLogger.js";
import mongoose from "mongoose";

const { Types } = mongoose;

/**
 * Patient revokes an active access entry.
 * Body: { doctorId } OR { accessId }
 * Auth: patient (identifyActor)
 */
export default async function revokeAccess(req, res) {
  try {
    const actor = req.actor;
    if (!actor || actor.type.toLowerCase() !== "user") {
      return res.status(401).json({ status: "failed", message: "Only patient may revoke access." });
    }

    const { doctorId, accessId } = req.body;
    
    // Support both methods: by doctorId or by accessId
    let query = { patientId: actor.doc._id, isActive: true };
    
    if (accessId) {
      query._id = new Types.ObjectId(accessId);
    } else if (doctorId) {
      query.doctorId = new Types.ObjectId(doctorId);
    } else {
      return res.status(400).json({ status: "failed", message: "doctorId or accessId required." });
    }

    const pa = await PatientAccess.findOneAndUpdate(
      query,
      { isActive: false, expiresAt: new Date() },
      { new: true }
    );

    if (!pa) {
      return res.status(404).json({ status: "failed", message: "Active access not found." });
    }

    // Log the revocation activity
    await logAccessActivity({
      patientId: actor.doc._id,
      doctorId: pa.doctorId,
      accessId: pa._id,
      action: 'access_revoked',
      details: {
        method: 'patient_revoked',
        previousAccessType: pa.accessType,
        revokedAt: new Date()
      },
      req
    });

    return res.status(200).json({ status: "success", message: "Access revoked.", data: pa });
  } catch (err) {
    console.error("revokeAccess:", err);
    return res.status(500).json({ status: "error", message: "Could not revoke access." });
  }
}
