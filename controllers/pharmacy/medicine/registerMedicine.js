import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import Medicine from "../../../models/medical/medicine.js";

/**
 * @route   POST /api/medicine/register
 * @desc    Register a new medicine in the global catalog
 * @access  Admin / Pharmacy (optional)
 */
const registerMedicine = handelAsyncFunction(async (req, res, next) => {
  const {
    genericName,
    brandName,
    manufacturer,
    dosageForm,
    strength,
  } = req.body;

  // Validate fields
  if (!genericName || !brandName) {
    return next(
      new CustomError(400, "Both genericName and brandName are required fields.")
    );
  }

  // Convert to consistent format for storing
  const normalizedBrand = brandName.trim().toLowerCase();
  const normalizedGeneric = genericName.trim().toLowerCase();

  // Check if this brand already exists
  const existingMedicine = await Medicine.findOne({
    brandName: new RegExp(`^${normalizedBrand}$`, "i"),
  });

  if (existingMedicine) {
    return next(
      new CustomError(400, "This brand already exists in the medicine catalog.")
    );
  }

  // Create the new medicine entry
  const medicine = await Medicine.create({
    genericName,
    brandName,
    manufacturer,
    dosageForm,
    strength,
  });

  res.status(201).json({
    status: "success",
    message: "Medicine registered successfully.",
    data: medicine,
  });
});

export default registerMedicine;
