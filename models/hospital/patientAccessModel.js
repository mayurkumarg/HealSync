import mongoose from "mongoose";
const { Schema, model } = mongoose;

const patientAccessSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", default: null },
  grantedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  accessType: { type: String, enum: ["view", "edit", "full"], default: "view" },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default model("PatientAccess", patientAccessSchema);
