import mongoose from "mongoose";

const bpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

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
      type: String, // simple status → "normal", "high", "low"
      required: true,
    },

    // Medication tracking
    drugName: {
      type: String,
      default: null,
    },

    dosage: {
      type: String, // Example: "10mg once daily"
      default: null,
    },

    tabletsPerDay: {
      type: Number, // For tracking daily intake
      default: null,
    },

    stockAvailable: {
      type: Number, // How many tablets left
      default: null,
    },

    // Date fields
    recordedAt: {
      type: Date,
      required: true,
    },

    weekday: {
      type: Number, // 0–6 → for weekly trends
      required: true,
    },

    month: {
      type: Number, // 1–12 → for monthly trends
      required: true,
    },

    // Changes from last reading
    delta: {
      systolic: { type: Number, default: 0 },
      diastolic: { type: Number, default: 0 },
      pulse: { type: Number, default: 0 },
    },

    // AI or rule-based suggestions
    suggestions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("BPReading", bpSchema);
