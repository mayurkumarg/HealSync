// controllers/pharmacy/stock/getAllStock.js
import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";

const getAllStock = handelAsyncFunction(async (req, res) => {
  const pharmacyId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const total = await PharmacyStock.countDocuments({ pharmacyId });

  const data = await PharmacyStock.find({ pharmacyId })
    .populate("medicineId")
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    status: "success",
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data
  });
});

export default getAllStock;
