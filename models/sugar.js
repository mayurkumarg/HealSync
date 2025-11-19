import mongoose from "mongoose";

/* ------------------ Sugar Reading Subdocument ------------------ */
const sugarReadingSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ["fasting", "random", "post-meal"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Normal", "High", "Low", "Pre-diabetic", "Diabetic"],
      required: true,
    },

    recordedAt: {
      type: Date,
      required: true,
    },

    weekday: {
      type: Number, // 0–6
      required: true,
    },

    month: {
      type: Number, // 1–12
      required: true,
    },

    delta: {
      type: Number, // difference from previous reading
      default: 0,
    },
  },
  { _id: true }
);

/* ------------------ Sugar Tracking Parent Schema ------------------ */
const sugarSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "User",
    },

    /* -------- Medication Tracking -------- */
    drugName: {
      type: String,
      default: null,
    },

    dosage: {
      type: String,
      default: null,
    },

    tabletsPerDay: {
      type: Number,
      default: null,
    },

    stockAvailable: {
      type: Number,
      default: null,
    },

    /* -------- Latest suggestion (universal) -------- */
    recentSuggestion: {
      type: String,
      default: null,
    },

    /* -------- Array of readings -------- */
    readings: [sugarReadingSchema],
  },
  { timestamps: true }
);

export default mongoose.model("SugarTracking", sugarSchema);
