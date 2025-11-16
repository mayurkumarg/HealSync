import mongoose from "mongoose";
const { Schema, model } = mongoose;

const pharmacyStockSchema = new Schema(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true
    },

    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true
    },

    quantity: {
      type: Number,
      default: 0,
      min: [0, "Quantity cannot be negative"]
    },

    price: {
      type: Number,
      required: [true, "Price is required"]
    },

    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"]
    },

    batchNo: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: ["available", "low", "out_of_stock"],
      default: "available"
    },

    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Auto-update status & lastUpdated
pharmacyStockSchema.pre("save", function (next) {
  if (this.quantity === 0) this.status = "out_of_stock";
  else if (this.quantity < 10) this.status = "low";
  else this.status = "available";

  this.lastUpdated = Date.now();

  next();
});

export default model("PharmacyStock", pharmacyStockSchema);
