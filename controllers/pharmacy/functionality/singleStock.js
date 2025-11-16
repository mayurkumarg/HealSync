// controllers/pharmacy/stock/getStockItem.js
import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";
import CustomError from "../../../utils/customError.js";

const getStockItem = handelAsyncFunction(async (req, res, next) => {
  const pharmacyId = req.user.id;
  const { stockId } = req.params;

  const item = await PharmacyStock.findOne({
    _id: stockId,
    pharmacyId
  }).populate("medicineId");

  if (!item) return next(new CustomError(404, "Not found"));

  res.status(200).json({ status: "success", data: item });
});

export default getStockItem;
