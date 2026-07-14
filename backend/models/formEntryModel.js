// backend/models/formEntryModel.js
import mongoose from "mongoose";
import { encryptMedicalRecord, decryptMedicalRecord } from "../utils/encryption.js";

const { Schema, model } = mongoose;

/**
 * FormEntry
 * - patientId: the patient whose record this is (ref to User)
 * - createdBy: objectId referencing either User or Doctor (refPath used)
 * - creatorModel: "User" | "Doctor"
 * - category: free text category
 * - data: mixed JSON from the questionnaire (key/value) - ENCRYPTED
 * - parsedFields: optional structured fields - ENCRYPTED
 * - description: free text
 * - isVerifiedByDoctor: boolean
 * - isEncrypted: flag indicating if data is encrypted
 * - dataHash: SHA-256 hash for data integrity verification
 */

const formEntrySchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "creatorModel",
    },
    creatorModel: { type: String, required: true, enum: ["User", "Doctor"] },

    category: { type: String, required: true, trim: true },
    data: { type: Schema.Types.Mixed, default: {} }, // store questionnaire answers (encrypted)
    parsedFields: { type: Schema.Types.Mixed, default: {} }, // optional structured extraction (encrypted)
    description: { type: String, default: "" },

    isVerifiedByDoctor: { type: Boolean, default: false },
    isEncrypted: { type: Boolean, default: false }, // flag for encryption status
    dataHash: { type: String, default: null }, // SHA-256 hash for integrity

    // audit
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  {
    timestamps: false, // using createdAt/updatedAt manually
  }
);

formEntrySchema.index({ patientId: 1, createdAt: -1 });

// Encrypt data before saving
formEntrySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  
  // Only encrypt if not already encrypted
  if (!this.isEncrypted && this.data && Object.keys(this.data).length > 0) {
    try {
      const encryptedData = encryptMedicalRecord(this.data);
      this.data = encryptedData.data || encryptedData;
      this.dataHash = encryptedData._integrity;
      this.isEncrypted = true;
    } catch (error) {
      console.error('Failed to encrypt medical record:', error);
      // Continue without encryption on error
    }
  }
  
  next();
});

// Decrypt data after finding
formEntrySchema.post('find', function(docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      if (doc.isEncrypted && doc.data) {
        try {
          doc.data = decryptMedicalRecord({ ...doc.data, _integrity: doc.dataHash });
        } catch (error) {
          console.error('Failed to decrypt medical record:', error);
        }
      }
    });
  }
});

formEntrySchema.post('findOne', function(doc) {
  if (doc && doc.isEncrypted && doc.data) {
    try {
      doc.data = decryptMedicalRecord({ ...doc.data, _integrity: doc.dataHash });
    } catch (error) {
      console.error('Failed to decrypt medical record:', error);
    }
  }
});

delete mongoose.models.FormEntry;
export default mongoose.model("FormEntry", formEntrySchema);
