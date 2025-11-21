// backend/controllers/access/generateAccessToken.js
import crypto from "crypto";
import AccessToken from "../../models/AccessToken.js";
import { generateQRCodeDataURL } from "../../utils/qrService.js";
import mongoose from "mongoose";

const { Types } = mongoose;

/**
 * Patient calls this to create a short code + QR to show doctor.
 * Body: { accessType?: "view"|"edit"|"full", ttlMinutes?: number }
 * Returns: { shortCode, token, expiresAt, qrDataUrl, url }
 *
 * NOTE: QR contains the clickable URL: `${BACKEND_ORIGIN}/api/access/scan?token=${token}`
 * This allows generic scanners (Google camera) to open the URL immediately.
 */

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || `http://localhost:${process.env.PORT || 5000}`;

export default async function generateAccessToken(req, res) {
  try {
    const actor = req.actor;
    if (!actor || actor.type.toLowerCase() !== "user") return res.status(401).json({ status: "failed", message: "Only patient (user) may create tokens." });

    const patientId = actor.doc._id;
    const { accessType = "view", expiryDuration = "24hours" } = req.body;

    // Validate accessType
    if (!["view", "edit", "full"].includes(accessType)) {
      return res.status(400).json({ status: "failed", message: "Invalid accessType. Must be view, edit, or full." });
    }

    // Validate expiryDuration
    const validDurations = ["1hour", "6hours", "12hours", "24hours", "3days", "7days", "30days", "until_revoked"];
    if (!validDurations.includes(expiryDuration)) {
      return res.status(400).json({ status: "failed", message: "Invalid expiryDuration." });
    }

    // Calculate expiry time based on duration
    let expiresAt = null;
    if (expiryDuration !== "until_revoked") {
      const durationMap = {
        "1hour": 1 * 60,
        "6hours": 6 * 60,
        "12hours": 12 * 60,
        "24hours": 24 * 60,
        "3days": 3 * 24 * 60,
        "7days": 7 * 24 * 60,
        "30days": 30 * 24 * 60
      };
      const minutes = durationMap[expiryDuration];
      expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    }

    // generate short code (6 digits) and secure token
    const shortCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const token = crypto.randomBytes(24).toString("hex");

    const at = await AccessToken.create({
      shortCode,
      token,
      patientId,
      purpose: "grant",
      accessType,
      expiryDuration,
      expiresAt
    });

    // Create a clickable URL that the QR will encode
    const url = `${BACKEND_ORIGIN}/api/access/scan?token=${encodeURIComponent(at.token)}`;

    // Generate QR of the url
    const qrDataUrl = await generateQRCodeDataURL(url);

    return res.status(201).json({
      status: "success",
      data: {
        shortCode: at.shortCode,
        token: at.token,
        expiresAt: at.expiresAt,
        expiryDuration: at.expiryDuration,
        url,
        qrDataUrl,
        accessType: at.accessType,
        permissions: {
          view: true,
          edit: ["edit", "full"].includes(at.accessType),
          full: at.accessType === "full"
        }
      }
    });
  } catch (err) {
    console.error("generateAccessToken:", err);
    return res.status(500).json({ status: "error", message: "Could not generate access token." });
  }
}
