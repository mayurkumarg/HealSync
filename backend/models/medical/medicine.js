    import mongoose from "mongoose";
const { Schema, model } = mongoose;

const medicineSchema = new Schema(
  {
    genericName: {
      type: String,
      required: [true, "Generic name is required"],
      trim: true
    },

    brandName: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true
    },

    manufacturer: {
      type: String,
      trim: true
    },

    dosageForm: {
      type: String,  // Tablet, Capsule, Syrup...
      trim: true
    },

    strength: {
      type: String, // e.g., 650mg, 500mg
      trim: true
    }
  },
  { timestamps: true }
);

export default model("Medicine", medicineSchema);
