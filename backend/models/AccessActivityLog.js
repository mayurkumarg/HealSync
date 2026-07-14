import mongoose from "mongoose";
const { Schema, model } = mongoose;

/**
 * AccessActivityLog - Tracks every action doctors perform on patient records
 * Used for audit trail, patient transparency, and security monitoring
 */
const accessActivityLogSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    accessId: { type: Schema.Types.ObjectId, ref: "PatientAccess", required: true },
    
    action: {
      type: String,
      enum: [
        "access_granted",      // When access is first claimed
        "view_dashboard",      // Viewed patient dashboard
        "view_documents",      // Viewed documents list
        "view_document",       // Opened specific document
        "view_health_forms",   // Viewed health forms
        "view_form",          // Opened specific form
        "view_vitals",        // Viewed health tracking data
        "edit_form",          // Modified health form
        "create_form",        // Created new form entry
        "delete_form",        // Deleted form entry
        "edit_profile",       // Modified patient profile
        "access_revoked"      // When access was revoked
      ],
      required: true
    },
    
    // Additional context about the action
    details: {
      resourceType: { type: String }, // e.g., "document", "form", "vital"
      resourceId: { type: Schema.Types.ObjectId }, // ID of the resource accessed
      resourceName: { type: String }, // Name/title of resource
      changesMade: { type: Schema.Types.Mixed }, // For edit actions, store what changed
      ipAddress: { type: String },
      userAgent: { type: String }
    },
    
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

// Index for efficient queries
accessActivityLogSchema.index({ patientId: 1, timestamp: -1 });
accessActivityLogSchema.index({ doctorId: 1, timestamp: -1 });
accessActivityLogSchema.index({ accessId: 1, timestamp: -1 });

delete mongoose.models.AccessActivityLog;
export default mongoose.model("AccessActivityLog", accessActivityLogSchema);
