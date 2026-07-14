// backend/controllers/access/requestAccess.js
import AccessToken from "../../models/AccessToken.js";
import User from "../../models/userModel.js";
import { sendOtpToPhone } from "../../utils/otpService.js";
import mongoose from "mongoose";
import crypto from "crypto";

/**
 * Doctor requests access to a patient (if they don't have a short-code/QR).
 * Body: { patientPhoneOrId, accessType }
 * This creates a 'request' token and triggers an OTP/push to the patient.
 */
export default async function requestAccess(req, res) {
  try {
    const actor = req.actor;
    if (!actor || actor.type.toLowerCase() !== "doctor") return res.status(401).json({ status: "failed", message: "Only doctor may request access." });

    const { patientPhoneOrId, accessType = "view", ttlMinutes = 15 } = req.body;
    if (!patientPhoneOrId) return res.status(400).json({ status: "failed", message: "patientPhoneOrId required." });

    // Find patient by phone or id
    let patient = null;
    if (/^\d+$/.test(patientPhoneOrId) && patientPhoneOrId.length >= 10) {
      patient = await User.findOne({ phone_no: patientPhoneOrId });
    }
    if (!patient && mongoose.isValidObjectId(patientPhoneOrId)) {
      patient = await User.findById(patientPhoneOrId);
    }
    if (!patient) return res.status(404).json({ status: "failed", message: "Patient not found." });

    // create AccessToken with purpose=request
    const shortCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const at = await AccessToken.create({
      shortCode,
      token,
      patientId: patient._id,
      purpose: "request",
      accessType,
      expiresAt
    });

    // send OTP to patient (so patient can approve via OTP)
    const smsResult = await sendOtpToPhone(patient.phone_no, "access", 6, 300);

    return res.status(201).json({
      status: "success",
      data: {
        requestId: at._id,
        shortCode: at.shortCode,
        expiresAt: at.expiresAt,
        sms: smsResult.via // for dev you'll get code in response in dev fallback
      },
      debug: smsResult.code ? { otp: smsResult.code } : undefined
    });
  } catch (err) {
    console.error("requestAccess:", err);
    return res.status(500).json({ status: "error", message: "Could not create request." });
  }
}
