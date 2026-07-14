  import mongoose from "mongoose";
  import bcrypt from "bcrypt";

  const { Schema, model } = mongoose;

  const hospitalSchema = new Schema(
    {
      name: {
        type: String,
        required: [true, "Hospital/Center name is required"],
        trim: true,
      },
      type: {
        type: String,
        enum: ["hospital", "clinic", "lab", "diagnostic_center"],
        required: true,
        default: "hospital",
      },
      address: {
        type: String,
        required: [true, "Address is required"],
        trim: true,
      },
      contactNo: {
        type: String,
        required: [true, "Contact number is required"],
        match: [
          /^\+?[0-9]{10,15}$/,
          "Please enter a valid contact number (10-15 digits).",
        ],
        unique: true,
      },
      geoLocation: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [lng, lat]
      },

      verification: {
        registrationNo: { type: String, required: true, trim: true },
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
        verifiedAt: Date,
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        documents: { type: [String], default: [] },
      },

      servicesOffered: { type: [String], default: [] },

      // Authentication fields (hospital acts like account)
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      password: { type: String, required: true, select: false },
      verified: { type: Boolean, default: false },

      // email verification token fields
      token: { type: String, default: null },
      tokenExpires: { type: Date, default: null },

      isOpen: { type: Boolean, default: true },
      rating: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
  );

  hospitalSchema.index({ geoLocation: "2dsphere" });

  hospitalSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const rounds = parseInt(process.env.SALTROUNDS) || 10;
    this.password = await bcrypt.hash(this.password, rounds);
    next();
  });

  hospitalSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
  };

delete mongoose.models.Hospital;
export default mongoose.model("Hospital", hospitalSchema);

