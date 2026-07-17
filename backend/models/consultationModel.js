import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Consultation — an appointment-based telehealth booking between a patient and a doctor.
 * Deliberately does not implement live video/audio itself yet: `mode` records the intended
 * channel so a real-time layer (WebRTC/chat) can be layered on top later without a schema
 * change, while this pass focuses on the booking/workflow/records backbone.
 */
const consultationSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", default: null },

    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 5, max: 120 },
    mode: { type: String, enum: ["video", "audio", "chat", "in_person"], default: "video" },

    reason: { type: String, trim: true, maxlength: 500 },
    fee: { type: Number, default: null, min: 0 },

    status: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled", "no_show"],
      default: "requested",
    },
    cancelledBy: { type: String, enum: ["patient", "doctor", null], default: null },
    cancelReason: { type: String, default: null },

    // Filled in by the doctor once the consultation happens.
    notes: { type: String, default: null },
    prescriptionText: { type: String, default: null },
    completedAt: { type: Date, default: null },

    // The PatientAccess grant auto-created for this booking so the doctor can review records.
    accessGrantId: { type: Schema.Types.ObjectId, ref: "PatientAccess", default: null },
  },
  { timestamps: true }
);

consultationSchema.index({ doctorId: 1, scheduledAt: 1 });
consultationSchema.index({ patientId: 1, scheduledAt: -1 });

delete mongoose.models.Consultation;
export default mongoose.model("Consultation", consultationSchema);
