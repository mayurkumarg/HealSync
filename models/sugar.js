import mongoose from "mongoose";

const sugarSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    level: {
      type: Number,
      required: true,
    },

    type: {
      type: String, // "fasting" | "random" | "post-meal"
      required: true,
    },

    status: {
      type: String, // Normal | High | Low | Pre-diabetic | Diabetic
      required: true,
    },

    // NEW MEDICATION FIELDS
    drugName: {
      type: String,
      default: null,    // e.g., "Metformin", "Glimepiride"
    },

    dosage: {
      type: String,     // e.g., "500mg twice daily"
      default: null,
    },

    stockAvailable: {
      type: Number,     // tablets left
      default: null,
    },
    // END MEDICATION FIELDS

    recordedAt: {
      type: Date,
      required: true,
    },

    weekday: {
      type: Number, // for weekly trends
      required: true,
    },

    month: {
      type: Number, // for monthly trends
      required: true,
    },

    delta: {
      type: Number, // change from the previous sugar level
      default: 0,
    },

    suggestions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("SugarReading", sugarSchema);
