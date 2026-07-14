import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import Medicine from "../../../models/medical/medicine.js";
import CustomError from "../../../utils/customError.js";

/**
 * @route PATCH /api/medicine/:id
 * @desc  Update global medicine details
 */
const updateMedicine = handelAsyncFunction(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  // Ensure at least 1 field is provided
  if (Object.keys(updates).length === 0) {
    return next(new CustomError(400, "No update fields provided."));
  }

  // If updating brandName → ensure it's unique
  if (updates.brandName) {
    const exists = await Medicine.findOne({
      brandName: { $regex: `^${updates.brandName}$`, $options: "i" }
    });

    if (exists && exists._id.toString() !== id) {
      return next(new CustomError(400, "Another medicine with this brand name already exists."));
    }
  }

  // Perform update
  const updated = await Medicine.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });

  if (!updated) {
    return next(new CustomError(404, "Medicine not found."));
  }

  res.status(200).json({
    status: "success",
    message: "Medicine updated successfully.",
    data: updated
  });
});

export default updateMedicine;
