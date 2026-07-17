import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const doctorSchema = new Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  phone_no: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    minlength: 10,
    maxlength: 15,
    validate: {
      validator: function (v) {
        return /^\d+$/.test(v);
      },
      message: "Phone number should contain only digits."
    }
  },

  hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", default: null }, // null => independent
  specialization: { type: String, default: null },
  licenseNo: { type: String, unique: true, sparse: true }, // sparse allows null
  experienceYears: { type: Number, default: 0 },

  verified: { type: Boolean, default: false },
  token: { type: String, default: null },
  tokenExpires: { type: Date, default: null },

  verification: {
    document: String,
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    verifiedAt: Date,
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },

  // Consultation module (opt-in — a doctor only appears in patient discovery once enabled)
  consultation: {
    enabled: { type: Boolean, default: false },
    fee: { type: Number, default: null, min: 0 },
    avgMinutes: { type: Number, default: 20, min: 5, max: 120 },
  }
}, { timestamps: true });

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const rounds = parseInt(process.env.SALTROUNDS) || 10;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

doctorSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};


delete mongoose.models.Doctor;
export default mongoose.model("Doctor", doctorSchema);