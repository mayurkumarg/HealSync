import mongoose from "mongoose";
const { Schema, model } = mongoose;

const patientAccessSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", default: null },
    grantedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    accessType: {
      type: String,
      enum: ["view"],  // Only view access - allows viewing and uploading new data, but NOT editing
      default: "view",
    },
    expiryDuration: {
      type: String,
      enum: ["1hour", "6hours", "12hours", "24hours", "3days", "7days", "30days", "until_revoked"],
      default: "24hours"
    },
    expiresAt: { type: Date, default: null }, // null means until_revoked
    isActive: { type: Boolean, default: true },
    reason: { type: String, default: null }, // doctor's stated reason, for the OTP-request flow's audit trail
  },
  { timestamps: true }
);

delete mongoose.models.PatientAccess;
export default mongoose.model("PatientAccess", patientAccessSchema);