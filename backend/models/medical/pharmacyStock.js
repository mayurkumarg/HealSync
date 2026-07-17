import mongoose from "mongoose";
const { Schema, model } = mongoose;

const pharmacyStockSchema = new Schema(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },

    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
    },

    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    batchNo: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["available", "low", "out_of_stock"],
      default: "available",
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One stock row per pharmacy+medicine — matches registerStock.js's existing "already stocks
// this" check, now enforced at the DB level too, and speeds up every stock list/search/stats query.
pharmacyStockSchema.index({ pharmacyId: 1, medicineId: 1 }, { unique: true });
pharmacyStockSchema.index({ medicineId: 1 });

pharmacyStockSchema.pre("save", function (next) {
  if (this.quantity === 0) this.status = "out_of_stock";
  else if (this.quantity < 10) this.status = "low";
  else this.status = "available";

  this.lastUpdated = Date.now();
  next();
});

export default model("PharmacyStock", pharmacyStockSchema);
