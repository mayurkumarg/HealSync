import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import Medicine from "../../../models/medical/medicine.js";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";
import CustomError from "../../../utils/customError.js";

/**
 * @route  DELETE /api/medicine/:id
 * @desc   Remove a global medicine catalog entry. Blocked while any pharmacy still stocks it —
 *         the catalog is shared across all pharmacies, so deleting it out from under an existing
 *         PharmacyStock row would orphan that row's medicineId reference.
 */
const deleteMedicine = handelAsyncFunction(async (req, res, next) => {
  const { id } = req.params;

  const stockedBy = await PharmacyStock.countDocuments({ medicineId: id });
  if (stockedBy > 0) {
    return next(
      new CustomError(
        400,
        `Cannot delete: ${stockedBy} pharmacy stock ${stockedBy === 1 ? "entry" : "entries"} still reference this medicine. Remove that stock first.`
      )
    );
  }

  const deleted = await Medicine.findByIdAndDelete(id);
  if (!deleted) {
    return next(new CustomError(404, "Medicine not found."));
  }

  res.status(200).json({ status: "success", message: "Medicine deleted successfully." });
});

export default deleteMedicine;
