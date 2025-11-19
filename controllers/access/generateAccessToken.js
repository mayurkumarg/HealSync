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
    const { accessType = "view", ttlMinutes = 15 } = req.body;

    // generate short code (6 digits) and secure token
    const shortCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const at = await AccessToken.create({
      shortCode,
      token,
      patientId,
      purpose: "grant",
      accessType,
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
        token: at.token, // for debugging / internal flows
        expiresAt: at.expiresAt,
        url,
        qrDataUrl,
        accessType: at.accessType
      }
    });
  } catch (err) {
    console.error("generateAccessToken:", err);
    return res.status(500).json({ status: "error", message: "Could not generate access token." });
  }
}
