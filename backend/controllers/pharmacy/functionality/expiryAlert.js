// controllers/pharmacy/stock/expiryAlert.js
import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";

const expiryAlert = handelAsyncFunction(async (req, res) => {
  const pharmacyId = req.user.id;

  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiring = await PharmacyStock.find({
    pharmacyId,
    expiryDate: { $lte: in30 }
  }).populate("medicineId");

  res.status(200).json({ status: "success", data: expiring });
});

export default expiryAlert;
