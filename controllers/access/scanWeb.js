// backend/controllers/access/scanWeb.js
import AccessToken from "../../models/AccessToken.js";
import User from "../../models/userModel.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";

/**
 * GET /api/access/scan?token=...
 * - Validates token exists and is not used/expired.
 * - Marks token used (one-time).
 * - Renders an HTML read-only page with patient info.
 * - Optionally includes a "Claim Access" button that opens doctor login/claim flow.
 *
 * Security note: this page is ephemeral (token one-time). Do not include extremely sensitive full records
 * unless you require doctor login. For basic identity, contact summary or emergency info it's acceptable.
 */

export default async function scanWeb(req, res) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send("<h3>Invalid request: token missing</h3>");

    const accessToken = await AccessToken.findOne({ token });
    if (!accessToken) return res.status(404).send("<h3>Invalid or expired link.</h3>");
    if (accessToken.used) return res.status(410).send("<h3>This link has already been used or revoked.</h3>");
    if (new Date() > accessToken.expiresAt) return res.status(410).send("<h3>This link has expired.</h3>");

    // fetch patient basic data
    const patient = await User.findById(accessToken.patientId).lean();
    if (!patient) return res.status(404).send("<h3>Patient not found.</h3>");

    // Mark the token used (one-time) BEFORE rendering to avoid race conditions (atomic-ish)
    accessToken.used = true;
    await accessToken.save();

    // Build minimal patient display. Customize fields as needed.
    const safeData = {
      name: patient.name || "—",
      email: patient.email || "—",
      phone_no: patient.phone_no || "—",
      age: patient.age || "",
      gender: patient.gender || "",
      emergencyContact: patient.emergencyContact || ""
    };

    // Simple HTML response — you can style it or replace with full front-end later.
    const claimUrl = `${process.env.FRONTEND_ORIGIN || ""}/claim?token=${encodeURIComponent(token)}`; // optional front-end claim flow
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>Patient Quick View</title>
        <style>
          body{font-family: system-ui,Segoe UI,Roboto,Arial;margin:20px;color:#222}
          .card{border:1px solid #ddd;padding:18px;border-radius:8px;max-width:600px}
          h1{font-size:20px;margin:0 0 10px}
          dl{display:grid;grid-template-columns:140px 1fr;gap:6px 12px}
          .note{margin-top:14px;color:#555;font-size:13px}
          .actions{margin-top:18px}
          a.button{display:inline-block;padding:10px 14px;border-radius:8px;text-decoration:none;background:#0066ff;color:#fff}
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Patient Quick View</h1>
          <p class="note">This link can be used only once and will expire at ${new Date(accessToken.expiresAt).toLocaleString()}.</p>
          <dl>
            <dt>Name</dt><dd>${safeData.name}</dd>
            <dt>Email</dt><dd>${safeData.email}</dd>
            <dt>Phone</dt><dd>${safeData.phone_no}</dd>
            <dt>Age</dt><dd>${safeData.age}</dd>
            <dt>Gender</dt><dd>${safeData.gender}</dd>
            <dt>Emergency</dt><dd>${safeData.emergencyContact}</dd>
            <dt>Access type</dt><dd>${accessToken.accessType}</dd>
          </dl>
          <div class="actions">
            <!-- If you want doctors to claim and create PatientAccess, link to your frontend login/claim flow -->
            <a class="button" href="${claimUrl}" target="_blank" rel="noopener">Claim access (doctor login)</a>
          </div>
          <div class="note">
            If you are not the intended recipient, please ask the patient to revoke access immediately.
          </div>
        </div>
      </body>
      </html>
    `;

    // Return HTML
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    console.error("scanWeb:", err);
    return res.status(500).send("<h3>Server error</h3>");
  }
}
