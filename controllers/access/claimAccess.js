// backend/controllers/access/claimAccess.js
import AccessToken from "../../models/AccessToken.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js"; // existing file
import mongoose from "mongoose";

const { Types } = mongoose;

/**
 * Doctor calls this endpoint to claim access with token (from QR) or shortCode.
 * Body: { token?: string, shortCode?: string, patientId?: string, otp?: string (optional) }
 * Auth: doctor JWT via identifyActor middleware
 *
 * Flow: finds AccessToken (not expired & not used), creates PatientAccess entry linking doctor & patient.
 */
export default async function claimAccess(req, res) {
  try {
    const actor = req.actor;
    if (!actor || actor.type.toLowerCase() !== "doctor")
      return res
        .status(401)
        .json({
          status: "failed",
          message: "Only doctors may claim access with this endpoint.",
        });

    const { token, shortCode } = req.body;
    if (!token && !shortCode)
      return res
        .status(400)
        .json({ status: "failed", message: "token or shortCode required." });

    const filter = token ? { token } : { shortCode };
    const accessToken = await AccessToken.findOne(filter);
    if (!accessToken)
      return res
        .status(404)
        .json({ status: "failed", message: "Access token not found." });

    if (accessToken.used)
      return res
        .status(410)
        .json({ status: "failed", message: "This code was already used." });
    if (new Date() > accessToken.expiresAt)
      return res
        .status(410)
        .json({ status: "failed", message: "This code has expired." });

    // Create or upsert PatientAccess
    const patientId = accessToken.patientId;
    const doctorId = actor.doc._id;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // default 15 minutes; you could derive from token

    const pa = await PatientAccess.findOneAndUpdate(
      { patientId, doctorId },
      {
        $setOnInsert: {
          hospitalId: actor.doc.hospitalId || null,
          grantedBy: patientId, // granted by patient (the token creator)
        },
        $set: {
          accessType: accessToken.accessType,
          expiresAt,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Mark token used
    accessToken.used = true;
    await accessToken.save();

    return res.status(200).json({ status: "success", data: pa });
  } catch (err) {
    console.error("claimAccess:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Could not claim access." });
  }
}
