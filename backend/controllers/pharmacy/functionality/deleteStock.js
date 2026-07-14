// controllers/pharmacy/stock/deleteStock.js
import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";
import CustomError from "../../../utils/customError.js";

const deleteStock = handelAsyncFunction(async (req, res, next) => {
  const pharmacyId = req.user.id;
  const { stockId } = req.params;

  const item = await PharmacyStock.findOneAndDelete({
    _id: stockId,
    pharmacyId
  });

  if (!item) return next(new CustomError(404, "Item not found"));

  res.status(200).json({ status: "success", message: "Deleted" });
});

export default deleteStock;
