// controllers/pharmacy/locationController.js
import Pharmacy from "../../models/medical/pharmacy.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";

/**
 * GET /api/pharmacy/pharmacy/:id
 */
export const getPharmacyById = handelAsyncFunction(async (req, res, next) => {
  const { id } = req.params;
  const ph = await Pharmacy.findById(id).lean();
  if (!ph) return next(new CustomError(404, "Pharmacy not found"));
  res.status(200).json({ status: "success", data: ph });
});
