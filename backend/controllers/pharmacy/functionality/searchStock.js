// controllers/pharmacy/stock/searchStock.js
import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";
import Medicine from "../../../models/medical/medicine.js";

const searchStock = handelAsyncFunction(async (req, res) => {
  const pharmacyId = req.user.id;
  const { q } = req.query;

  const meds = await Medicine.find({
    $or: [
      { brandName: { $regex: q, $options: "i" } },
      { genericName: { $regex: q, $options: "i" } }
    ]
  });

  const ids = meds.map(m => m._id);

  const stock = await PharmacyStock.find({
    pharmacyId,
    medicineId: { $in: ids }
  }).populate("medicineId");

  res.status(200).json({ status: "success", data: stock });
});

export default searchStock;
