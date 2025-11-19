// backend/models/AccessToken.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * AccessToken: short lived token used to grant access quickly.
 * - shortCode: human friendly 6-digit code (string)
 * - token: long random token (for security if you want)
 * - patientId: User who created the token
 * - purpose: e.g. 'grant' | 'request'
 * - accessType: view|edit|full (default view)
 * - expiresAt: Date when this code expires
 * - used: boolean
 */

const accessTokenSchema = new Schema({
  shortCode: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true },
  patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  purpose: { type: String, enum: ["grant", "request"], default: "grant" },
  accessType: { type: String, enum: ["view", "edit", "full"], default: "view" },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, { timestamps: true });

accessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // optional TTL index cleanup if desired

export default model("AccessToken", accessTokenSchema);
