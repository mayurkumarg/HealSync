import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import Medicine from "../../../models/medical/medicine.js";
import Pharmacy from "../../../models/medical/pharmacy.js";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";

/**
 * @route  GET /api/medicine/search-nearby?medicine=&lat=&lng=&radius=
 * @desc   Public medicine-availability search: which nearby pharmacies stock a medicine, at what
 *         price/quantity. No login required — patient-facing "medicine discovery" feature.
 * @access Public
 */
const searchMedicineNearby = handelAsyncFunction(async (req, res, next) => {
  const { medicine, lat, lng, radius = 10 } = req.query;

  if (!medicine) {
    return next(new CustomError(400, "Please provide a medicine name to search for."));
  }

  const matchedMedicines = await Medicine.find({
    $or: [
      { brandName: { $regex: medicine, $options: "i" } },
      { genericName: { $regex: medicine, $options: "i" } },
    ],
  });

  if (!matchedMedicines.length) {
    return res.status(200).json({ status: "success", count: 0, data: [] });
  }

  const medicineIds = matchedMedicines.map((m) => m._id);

  let pharmacyIds = null;
  if (lat && lng) {
    const maxDistance = Number(radius) * 1000; // km -> meters
    const nearbyPharmacies = await Pharmacy.find({
      geoLocation: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: maxDistance,
        },
      },
    }).select("_id");
    pharmacyIds = nearbyPharmacies.map((p) => p._id);

    if (!pharmacyIds.length) {
      return res.status(200).json({ status: "success", count: 0, data: [] });
    }
  }

  const stockQuery = {
    medicineId: { $in: medicineIds },
    quantity: { $gt: 0 },
    ...(pharmacyIds && { pharmacyId: { $in: pharmacyIds } }),
  };

  const stock = await PharmacyStock.find(stockQuery)
    .populate("medicineId", "brandName genericName manufacturer dosageForm strength")
    .populate("pharmacyId", "name address contactNo geoLocation isOpen rating");

  const results = stock
    .filter((s) => s.medicineId && s.pharmacyId) // guard against orphaned references
    .map((s) => ({
      medicine: s.medicineId,
      pharmacy: s.pharmacyId,
      price: s.price,
      quantity: s.quantity,
      expiryDate: s.expiryDate,
    }))
    .sort((a, b) => a.price - b.price);

  res.status(200).json({
    status: "success",
    count: results.length,
    data: results,
  });
});

export default searchMedicineNearby;
