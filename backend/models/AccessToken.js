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

const accessTokenSchema = new Schema(
  {
    shortCode: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    purpose: { type: String, enum: ["grant", "request"], default: "grant" },
    
    // Permission type
    accessType: {
      type: String,
      enum: ["view", "edit", "full"],
      default: "view",
    },
    
    // Expiry configuration
    expiryDuration: {
      type: String,
      enum: ["1hour", "6hours", "12hours", "24hours", "3days", "7days", "30days", "until_revoked"],
      default: "24hours"
    },
    expiresAt: { type: Date, required: false }, // null if until_revoked
    
    used: { type: Boolean, default: false },
    claimedBy: { type: Schema.Types.ObjectId, ref: "Doctor", default: null },
    claimedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

accessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // optional TTL index cleanup if desired

export default model("AccessToken", accessTokenSchema);
