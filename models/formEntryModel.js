// backend/models/formEntryModel.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

/**
 * FormEntry
 * - patientId: the patient whose record this is (ref to User)
 * - createdBy: objectId referencing either User or Doctor (refPath used)
 * - creatorModel: "User" | "Doctor"
 * - category: free text category
 * - data: mixed JSON from the questionnaire (key/value)
 * - parsedFields: optional structured fields
 * - description: free text
 * - isVerifiedByDoctor: boolean
 */

const formEntrySchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "creatorModel"
  },
  creatorModel: { type: String, required: true, enum: ["User", "Doctor"] },

  category: { type: String, required: true, trim: true },
  data: { type: Schema.Types.Mixed, default: {} }, // store questionnaire answers
  parsedFields: { type: Schema.Types.Mixed, default: {} }, // optional structured extraction
  description: { type: String, default: "" },

  isVerifiedByDoctor: { type: Boolean, default: false },

  // audit
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
}, {
  timestamps: false // using createdAt/updatedAt manually
});

formEntrySchema.index({ patientId: 1, createdAt: -1 });

formEntrySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.FormEntry || mongoose.model("FormEntry", formEntrySchema);

