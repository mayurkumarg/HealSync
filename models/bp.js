import mongoose from "mongoose";

const readingSchema = new mongoose.Schema(
  {
    systolic: {
      type: Number,
      required: true,
    },

    diastolic: {
      type: Number,
      required: true,
    },

    pulse: {
      type: Number,
      default: null,
    },

    category: {
      type: String,
      enum: [
        "Normal",
        "Elevated",
        "Stage 1 Hypertension",
        "Stage 2 Hypertension",
        "Hypertensive Crisis",
      ],
      required: true,
    },

    status: {
      type: String, // "normal", "high", "low"
      required: true,
    },

    recordedAt: {
      type: Date,
      required: true,
    },

    weekday: {
      type: Number, // 0-6 → weekly trend
      required: true,
    },

    month: {
      type: Number, // 1-12 → monthly trend
      required: true,
    },

    delta: {
      systolic: { type: Number, default: 0 },
      diastolic: { type: Number, default: 0 },
      pulse: { type: Number, default: 0 },
    },
  },
  { _id: true } // allow individual IDs for each reading
);

const bpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
    },

    // Medication Tracking
    drugName: { type: String, default: null },
    dosage: { type: String, default: null },
    tabletsPerDay: { type: Number, default: null },
    stockAvailable: { type: Number, default: null },

    // Universal suggestion for latest reading
    recentSuggestion: {
      type: String,
      default: null,
    },

    // All readings
    readings: [readingSchema],
  },
  { timestamps: true }
);


export default mongoose.model("BPTracking", bpSchema);
