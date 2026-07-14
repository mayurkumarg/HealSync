// backend/controllers/access/claimAccess.js
import AccessToken from "../../models/AccessToken.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js"; // existing file
import { logAccessActivity } from "../../utils/activityLogger.js";
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
    
    if (accessToken.expiresAt && new Date() > accessToken.expiresAt) 
      return res
        .status(410)
        .json({ status: "failed", message: "This code has expired." });

    // Create or upsert PatientAccess
    const patientId = accessToken.patientId;
    const doctorId = actor.doc._id;

    // Use the token's expiry duration for the access
    let accessExpiresAt = accessToken.expiresAt; // Use token's expiry or null if until_revoked

    const pa = await PatientAccess.findOneAndUpdate(
      { patientId, doctorId },
      {
        $setOnInsert: {
          hospitalId: actor.doc.hospitalId || null,
          grantedBy: patientId, // granted by patient (the token creator)
        },
        $set: {
          accessType: accessToken.accessType,
          expiresAt: accessExpiresAt,
          expiryDuration: accessToken.expiryDuration,
          isActive: true
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Mark token used and claimed
    accessToken.used = true;
    accessToken.claimedBy = doctorId;
    accessToken.claimedAt = new Date();
    await accessToken.save();

    // Log this access grant activity
    await logAccessActivity({
      patientId,
      doctorId,
      accessId: pa._id,
      action: 'access_granted',
      details: {
        method: 'qr_code_scanned',
        resourceType: 'access_token',
        resourceId: accessToken._id,
        shortCode: accessToken.shortCode
      },
      req
    });

    return res.status(200).json({ status: "success", data: pa });
  } catch (err) {
    console.error("claimAccess:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Could not claim access." });
  }
}
