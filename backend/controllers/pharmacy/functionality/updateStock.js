// controllers/pharmacy/stock/updateStock.js
import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";
import CustomError from "../../../utils/customError.js";

const updateStock = handelAsyncFunction(async (req, res, next) => {
  const pharmacyId = req.user.id;
  const { stockId } = req.params;
  const updates = req.body;

  // 1️⃣ No empty body
  if (!updates || Object.keys(updates).length === 0) {
    return next(new CustomError(400, "No update fields provided."));
  }

  // 2️⃣ Allowed fields only
  const allowedFields = ["quantity", "price", "expiryDate", "batchNo"];
  const invalidKeys = Object.keys(updates).filter(
    (key) => !allowedFields.includes(key)
  );

  if (invalidKeys.length > 0) {
    return next(
      new CustomError(
        400,
        `Invalid field(s): ${invalidKeys.join(", ")}. Allowed fields: ${allowedFields.join(", ")}`
      )
    );
  }

  // 3️⃣ Validate quantity
  if (updates.quantity !== undefined) {
    if (typeof updates.quantity !== "number" || updates.quantity < 0) {
      return next(new CustomError(400, "Quantity must be a positive number."));
    }
  }

  // 4️⃣ Validate price
  if (updates.price !== undefined) {
    if (typeof updates.price !== "number" || updates.price <= 0) {
      return next(new CustomError(400, "Price must be greater than 0."));
    }
  }

  // 5️⃣ Validate expiryDate
  if (updates.expiryDate) {
    const expDate = new Date(updates.expiryDate);
    if (isNaN(expDate.getTime())) {
      return next(new CustomError(400, "Invalid expiry date."));
    }

    const today = new Date();
    if (expDate < today) {
      return next(
        new CustomError(400, "Expiry date must be in the future.")
      );
    }
  }

  // 6️⃣ Update stock
  let stock = await PharmacyStock.findOne({ _id: stockId, pharmacyId });

  if (!stock) return next(new CustomError(404, "Stock item not found."));

  // Apply updates manually
  if (updates.quantity !== undefined) stock.quantity = updates.quantity;
  if (updates.price !== undefined) stock.price = updates.price;
  if (updates.expiryDate) stock.expiryDate = updates.expiryDate;
  if (updates.batchNo) stock.batchNo = updates.batchNo;

  // 7️⃣ Auto-update status
  if (stock.quantity === 0) stock.status = "out_of_stock";
  else if (stock.quantity < 10) stock.status = "low";
  else stock.status = "available";

  stock.lastUpdated = Date.now();

  await stock.save();

  res.status(200).json({
    status: "success",
    message: "Stock updated successfully.",
    data: stock,
  });
});

export default updateStock;
