import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import Medicine from "../../../models/medical/medicine.js";
import CustomError from "../../../utils/customError.js";

/**
 * @route GET /api/medicine/find
 * @desc  Find medicine by ANY field with pagination
 */
const findMedicine = handelAsyncFunction(async (req, res, next) => {
  const {
    id,
    brand,
    generic,
    manufacturer,
    strength,
    dosageForm,
    page = 1,
    limit = 10,
  } = req.query;

  let query = {};

  // 1️⃣ If ID → return directly
  if (id) {
    const med = await Medicine.findById(id);
    if (!med) return next(new CustomError(404, "No medicine found with that ID"));

    return res.status(200).json({
      status: "success",
      data: med,
    });
  }

  // 2️⃣ Build search query
  if (brand) query.brandName = { $regex: brand, $options: "i" };
  if (generic) query.genericName = { $regex: generic, $options: "i" };
  if (manufacturer) query.manufacturer = { $regex: manufacturer, $options: "i" };
  if (strength) query.strength = { $regex: strength, $options: "i" };
  if (dosageForm) query.dosageForm = { $regex: dosageForm, $options: "i" };

  if (Object.keys(query).length === 0)
    return next(new CustomError(400, "Please provide at least one search parameter."));

  // 3️⃣ Pagination values
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Count total matching docs
  const total = await Medicine.countDocuments(query);

  // 4️⃣ Perform paginated search
  const medicines = await Medicine.find(query)
    .sort({ brandName: 1 })
    .skip(skip)
    .limit(limitNum);

  if (!medicines.length) {
    return next(new CustomError(404, "No medicines match your search criteria."));
  }

  // 5️⃣ Response with pagination info
  res.status(200).json({
    status: "success",
    totalResults: total,
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
    limit: limitNum,
    results: medicines.length,
    data: medicines,
  });
});

export default findMedicine;
