import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const pharmacySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Pharmacy name is required"],
      trim: true,
    },

    address: {
      type: String,
      required: [true, "Pharmacy address is required"],
      trim: true,
    },

    contactNo: {
      type: String,
      required: [true, "Contact number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit contact number"],
      unique: true,
    },

    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: [true, "GeoJSON type must be 'Point'"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "GeoJSON coordinates are required"],
        validate: {
          validator: function (coords) {
            return coords.length === 2;
          },
          message: "Coordinates must contain [longitude, latitude]",
        },
      },
    },

    verification: {
      licenseNo: {
        type: String,
        required: [true, "License number is required"],
        trim: true,
      },
      gstNo: {
        type: String,
        trim: true,
      },
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      verifiedAt: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      documents: {
        type: [String],
        default: [],
      },
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /\S+@\S+\.\S+/.test(v);
        },
        message: "Please provide a valid email address.",
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, 
    },

    token: {
      type: String,
      default: null,
    },

    tokenExpires: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    // 🏪 Business Info
    isOpen: {
      type: Boolean,
      default: true,
    },

    openingHours: {
      open: { type: String, default: "09:00" },
      close: { type: String, default: "21:00" },
    },

    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be below 0"],
      max: [5, "Rating cannot exceed 5"],
    },

    totalRatings: {
      type: Number,
      default: 0,
      min: [0, "Total ratings cannot be negative"],
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

pharmacySchema.index({ geoLocation: "2dsphere" });

pharmacySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const saltRounds = parseInt(process.env.SALTROUNDS) || 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  this.passwordChangedAt = Date.now();
  next();
});

pharmacySchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};



const Pharmacy = model("Pharmacy", pharmacySchema);
export default Pharmacy;
