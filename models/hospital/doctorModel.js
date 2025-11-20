import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const doctorSchema = new Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },

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

const Doctor = mongoose.models.Doctor || model("Doctor", doctorSchema);


export default Doctor;