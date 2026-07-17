import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import Medicine from "../../../models/medical/medicine.js";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";

const addStock = handelAsyncFunction(async (req, res, next) => {
  const pharmacyId = req.user.id; // linked to your schema
  const {
    brandName,
    genericName,
    manufacturer,
    dosageForm,
    strength,
    quantity,
    price,
    expiryDate,
    batchNo
  } = req.body;

  if (!brandName || !genericName || !quantity || !price || !expiryDate) {
    return next(new CustomError(400, "Required fields missing."));
  }

  // Check if medicine exists
  let medicine = await Medicine.findOne({ brandName });

  if (!medicine) {
    medicine = await Medicine.create({
      brandName,
      genericName,
      manufacturer,
      dosageForm,
      strength,
    });
  }

  // Prevent duplicate stock in same pharmacy
  const duplicate = await PharmacyStock.findOne({
    pharmacyId,
    medicineId: medicine._id,
  });

  if (duplicate) {
    return next(new CustomError(400, "This medicine already exists in your stock."));
  }

  const stock = await PharmacyStock.create({
    pharmacyId,
    medicineId: medicine._id,
    quantity,
    price,
    expiryDate,
    batchNo,
  });

  res.status(201).json({
    status: "success",
    message: "Medicine added to stock.",
    data: stock,
  });
});

export default addStock;
