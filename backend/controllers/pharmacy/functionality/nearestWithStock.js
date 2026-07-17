// controllers/pharmacy/findNearest.js
import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";
import Pharmacy from "../../../models/medical/pharmacy.js";

const findNearest = handelAsyncFunction(async (req, res) => {
  const { lat, lng, medicineId } = req.query;

  const stockHolders = await PharmacyStock.find({
    medicineId,
    quantity: { $gt: 0 }
  }).distinct("pharmacyId");

  const pharmacies = await Pharmacy.find({
    _id: { $in: stockHolders },
    geoLocation: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: 5000
      }
    }
  });

  res.status(200).json({ status: "success", data: pharmacies });
});

export default findNearest;
