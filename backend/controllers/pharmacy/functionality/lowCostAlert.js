// controllers/pharmacy/stock/lowStock.js
import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";

const lowStock = handelAsyncFunction(async (req, res) => {
  const pharmacyId = req.user.id;

  const items = await PharmacyStock.find({
    pharmacyId,
    quantity: { $lt: 10 }
  }).populate("medicineId");

  res.status(200).json({ status: "success", data: items });
});

export default lowStock;
