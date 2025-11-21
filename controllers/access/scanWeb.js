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
    if (accessToken.used) return res.status(410).send("<h3>This access code has already been claimed by a doctor.</h3>");
    if (accessToken.expiresAt && new Date() > accessToken.expiresAt) return res.status(410).send("<h3>This link has expired.</h3>");

    // fetch patient basic data
    const patient = await User.findById(accessToken.patientId).lean();
    if (!patient) return res.status(404).send("<h3>Patient not found.</h3>");

    // Build minimal patient display
    const safeData = {
      name: patient.name || "—",
      email: patient.email || "—",
      phone_no: patient.phone_no || "—",
      age: patient.age || "",
      gender: patient.gender || "",
      emergencyContact: patient.emergencyContact || ""
    };

    // Permission labels
    const permissionLabels = {
      view: "👁️ View Only - Can view medical records",
      edit: "✏️ View & Edit - Can view and update records",
      full: "🔓 Full Access - Complete access to all records"
    };

    // Expiry info
    const expiryInfo = accessToken.expiryDuration === 'until_revoked' 
      ? '♾️ Valid until patient revokes access'
      : `Valid for ${accessToken.expiryDuration.replace('hours', ' Hours').replace('days', ' Days')} (until ${new Date(accessToken.expiresAt).toLocaleString()})`;

    // Frontend claim URL - doctor will be redirected to login if not authenticated
    const claimUrl = `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/doctor/claim-access?token=${encodeURIComponent(token)}`;
    
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>Patient Access Code - HealSync</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 24px;
            text-align: center;
          }
          .header h1 {
            font-size: 24px;
            margin-bottom: 8px;
          }
          .header p {
            font-size: 14px;
            opacity: 0.9;
          }
          .content {
            padding: 24px;
          }
          .permission-badge {
            background: #f0f4ff;
            border: 2px solid #667eea;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
            text-align: center;
          }
          .permission-badge h3 {
            color: #667eea;
            font-size: 18px;
            margin-bottom: 8px;
          }
          .permission-badge p {
            color: #666;
            font-size: 14px;
          }
          .info-grid {
            display: grid;
            gap: 12px;
            margin-bottom: 20px;
          }
          .info-row {
            display: grid;
            grid-template-columns: 120px 1fr;
            gap: 12px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .info-label {
            font-weight: 600;
            color: #555;
            font-size: 14px;
          }
          .info-value {
            color: #333;
            font-size: 14px;
          }
          .expiry-info {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #856404;
          }
          .claim-btn {
            display: block;
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            text-align: center;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            transition: transform 0.2s;
          }
          .claim-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
          }
          .instructions {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 16px;
          }
          .instructions h4 {
            color: #1976d2;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .instructions ol {
            margin-left: 20px;
            color: #555;
            font-size: 13px;
            line-height: 1.6;
          }
          .warning {
            background: #ffebee;
            border-left: 4px solid #f44336;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            color: #c62828;
          }
          .short-code {
            text-align: center;
            padding: 16px;
            background: #f0f4ff;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .short-code p {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
          }
          .short-code h2 {
            font-size: 36px;
            font-family: 'Courier New', monospace;
            color: #667eea;
            letter-spacing: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 HealSync Patient Access</h1>
            <p>Secure Medical Record Sharing</p>
          </div>
          
          <div class="content">
            <div class="short-code">
              <p>Access Code</p>
              <h2>${accessToken.shortCode}</h2>
            </div>

            <div class="permission-badge">
              <h3>${permissionLabels[accessToken.accessType]}</h3>
              <p>${expiryInfo}</p>
            </div>

            <div class="instructions">
              <h4>📱 For Doctors:</h4>
              <ol>
                <li>Click the "Claim Access" button below</li>
                <li>Login with your doctor credentials</li>
                <li>You'll receive ${accessToken.accessType} access to this patient's records</li>
                <li>Access will be valid as specified above</li>
              </ol>
            </div>

            <a href="${claimUrl}" class="claim-btn">
              🔐 Claim Access as Doctor
            </a>

            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Patient Name</span>
                <span class="info-value">${safeData.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Age</span>
                <span class="info-value">${safeData.age || 'Not specified'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Gender</span>
                <span class="info-value">${safeData.gender || 'Not specified'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contact</span>
                <span class="info-value">${safeData.phone_no}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Emergency</span>
                <span class="info-value">${safeData.emergencyContact || 'Not specified'}</span>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This is a one-time access code. Once claimed by a doctor, it cannot be used again. If you are not the intended recipient, please contact the patient immediately.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    console.error("scanWeb:", err);
    return res.status(500).send("<h3>Server error</h3>");
  }
}
