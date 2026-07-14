// backend/controllers/access/approveRequest.js
import AccessToken from "../../models/AccessToken.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";
import { verifyOtpForPhone } from "../../utils/otpService.js";

/**
 * Patient approves a request (sent via requestAccess).
 * Body: { shortCode, otp }  OR { token, otp }
 * Auth: patient user JWT (req.actor.type === 'User') OR no auth but then must verify OTP
 */
export default async function approveRequest(req, res) {
  try {
    const { shortCode, token, otp } = req.body;
    if (!shortCode && !token) return res.status(400).json({ status: "failed", message: "shortCode or token required." });

    const filter = token ? { token } : { shortCode };
    const accessToken = await AccessToken.findOne(filter);
    if (!accessToken) return res.status(404).json({ status: "failed", message: "Request not found." });
    if (accessToken.used) return res.status(410).json({ status: "failed", message: "Request already processed." });
    if (new Date() > accessToken.expiresAt) return res.status(410).json({ status: "failed", message: "Request expired." });

    // Verify OTP - the OTP was sent to patient phone during requestAccess
    // If req.actor is patient and matches token.patientId we can skip OTP optionally
    if (req.actor && req.actor.type === "User" && req.actor.doc._id.toString() === accessToken.patientId.toString()) {
      // patient authenticated — skip OTP
    } else {
      // OTP required
      if (!otp) return res.status(400).json({ status: "failed", message: "OTP required." });
      // get patient phone - for simplicity load user
      const User = (await import("../../models/userModel.js")).default;
      const patient = await User.findById(accessToken.patientId);
      if (!patient) return res.status(404).json({ status: "failed", message: "Patient not found." });
      const ok = verifyOtpForPhone(patient.phone_no, otp, "access");
      if (!ok) return res.status(400).json({ status: "failed", message: "Invalid or expired OTP." });
    }

    // Now create PatientAccess linking the doctor (we stored doctorId on the AccessToken? Not in current design)
    // For this pattern we expect that requestAccess recorded who requested in some side-channel. Simpler approach:
    // We'll mark the AccessToken as used and return success; the requesting doctor should then call claimAccess with the token.
    accessToken.used = true;
    await accessToken.save();

    return res.status(200).json({ status: "success", message: "Request approved. Doctor may now claim using the token." });
  } catch (err) {
    console.error("approveRequest:", err);
    return res.status(500).json({ status: "error", message: "Could not approve request." });
  }
}