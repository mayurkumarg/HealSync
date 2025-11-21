// models.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

/* ---------- PATIENT ---------- */
const patientSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ["M", "F", "Other"] },
  bloodGroup: String,
  allergies: [String],
  chronicConditions: { type: Map, of: String },
  emergencyContact: String,
  linkedHospitals: [{ type: Schema.Types.ObjectId, ref: "Hospital" }],
  linkedDoctors: [{ type: Schema.Types.ObjectId, ref: "Doctor" }],
  fingerprintHash: String,
  healthSnapshot: {
    lastUpdated: Date,
    summaryText: String,
    keyVitals: { type: Map, of: String },
  },
  createdAt: { type: Date, default: Date.now },
});
export const Patient = model("Patient", patientSchema);

/* ---------- HOSPITAL ---------- */
const hospitalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["hospital", "clinic", "lab", "diagnostic_center"],
    default: "hospital",
  },
  address: String,
  contactNo: String,
  email: String,
  geoLocation: {
    latitude: Number,
    longitude: Number,
  },
  verification: {
    registrationNo: String,
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    documents: [String],
  },
  servicesOffered: [String],
  totalDoctors: { type: Number, default: 0 },
  totalBeds: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["open", "closed", "busy", "offline"],
    default: "open",
  },
  lastStatusUpdate: { type: Date, default: Date.now },
  authorizedPatients: [{ type: Schema.Types.ObjectId, ref: "Patient" }],
  createdAt: { type: Date, default: Date.now },
});
export const Hospital = model("Hospital", hospitalSchema);

/* ---------- DOCTOR ---------- */
const doctorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital" },
  specialization: String,
  licenseNo: String,
  experienceYears: Number,
  authorizedPatients: [{ type: Schema.Types.ObjectId, ref: "Patient" }],
  createdAt: { type: Date, default: Date.now },
});
export const Doctor = model("Doctor", doctorSchema);

/* ---------- OCR / NLP ---------- */
const ocrExtractionSchema = new Schema(
  {
    text: String,
    confidence: Number,
    pages: Number,
    language: String,
    ocrEngine: String,
    processedAt: Date,
  },
  { _id: false }
);

const nlpExtractionSchema = new Schema(
  {
    entities: Schema.Types.Mixed,
    keyValues: Schema.Types.Mixed,
    summary: String,
    modelVersion: String,
    confidence: Number,
    processedAt: Date,
  },
  { _id: false }
);

/* ---------- MedicalDocument ---------- */
const medicalDocumentSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

  /* UPDATED: new generalized document types */
  type: {
    type: String,
    enum: [
      "prescription",
      "lab_report",
      "diagnostic_report",
      "imaging_report",
      "discharge_summary",
      "medical_certificate",
      "hospital_bill",
      "other_medical_document",
      "update",
    ],
    required: true,
  },

  fileName: String,
  fileUrl: { type: String, required: true },
  fileType: {
    type: String,
    enum: [
      "image/jpg",
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    required: true,
  },

  description: String,
  uploadedAt: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "approved", "discarded"],
    default: "pending",
  },

  ocr: ocrExtractionSchema,
  nlp: nlpExtractionSchema,
  indexedKeywords: [String],
});
medicalDocumentSchema.index({ patientId: 1, uploadedAt: -1 });
export const MedicalDocument = model("MedicalDocument", medicalDocumentSchema);

/* ---------- MedicationSchedule ---------- */
const medicationScheduleSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  medicineName: String,
  dosage: String,
  frequency: {
    type: String,
    enum: ["daily", "twice daily", "custom"],
    default: "daily",
  },
  startDate: Date,
  endDate: Date,
  reminderTimes: [String],
  status: {
    type: String,
    enum: ["active", "completed", "missed"],
    default: "active",
  },
});
export const MedicationSchedule = model(
  "MedicationSchedule",
  medicationScheduleSchema
);

/* ---------- FormEntry ---------- */
const formEntrySchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  data: Schema.Types.Mixed,
  parsedFields: Schema.Types.Mixed,
  description: String,
  isVerifiedByDoctor: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
export const FormEntry = model("FormEntry", formEntrySchema);

/* ---------- Notification ---------- */
const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: [
      "reminder",
      "update",
      "alert",
      "document_upload",
      "data_package_ready",
      "ai_chat_invite",
      "form_entry",
    ],
    required: true,
  },
  message: String,
  relatedDocument: { type: Schema.Types.ObjectId, ref: "MedicalDocument" },
  sentAt: { type: Date, default: Date.now },
  readStatus: { type: Boolean, default: false },
});
export const Notification = model("Notification", notificationSchema);

/* ---------- Audit ---------- */
const auditLogSchema = new Schema({
  action: String,
  performedBy: { type: Schema.Types.ObjectId, ref: "User" },
  patientId: { type: Schema.Types.ObjectId, ref: "Patient" },
  documentId: { type: Schema.Types.ObjectId, ref: "MedicalDocument" },
  timestamp: { type: Date, default: Date.now },
  extra: Schema.Types.Mixed,
});
export const AuditLog = model("AuditLog", auditLogSchema);

/* ---------- AI Chat Session ---------- */
const aiChatSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  initiatedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
  promptSnapshot: String,
  modelUsed: String,
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  status: { type: String, enum: ["active", "completed"], default: "active" },
});
export const AIChatSession = model("AIChatSession", aiChatSessionSchema);
