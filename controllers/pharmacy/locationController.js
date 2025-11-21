// controllers/pharmacy/locationController.js
import Pharmacy from "../../models/medical/pharmacy.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";

/**
 * GET /api/pharmacy/nearby?lat=&lng=&radius=
 * radius in kilometers (default 5)
 */
export const getNearbyPharmacies = handelAsyncFunction(async (req, res, next) => {
  const { lat, lng, radius = 5 } = req.query;

  if (!lat || !lng) return next(new CustomError(400, "lat and lng are required"));

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radiusKm = parseFloat(radius);

  if (Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(radiusKm)) {
    return next(new CustomError(400, "lat, lng and radius must be numbers"));
  }

  const earthRadiusKm = 6378.1;

  const pharmacies = await Pharmacy.find({
    geoLocation: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusKm / earthRadiusKm],
      },
    },
  }).lean();

  res.status(200).json({ status: "success", results: pharmacies.length, data: pharmacies });
});

/**
 * GET /api/pharmacy/search-medicine?name=&lat=&lng=&radius=
 * If lat/lng/radius provided, results are restricted by radius.
 * Returns matchedMedicines for convenience.
 */
export const searchByMedicine = handelAsyncFunction(async (req, res, next) => {
  const { name, lat, lng, radius } = req.query;
  if (!name) return next(new CustomError(400, "medicine name is required"));

  const reg = new RegExp(name, "i");
  const query = { "medicines.name": { $regex: reg } };

  if (lat && lng && radius) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    if (Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(radiusKm)) {
      return next(new CustomError(400, "lat/lng/radius must be numbers"));
    }
    const earthRadiusKm = 6378.1;
    query.geoLocation = {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusKm / earthRadiusKm],
      },
    };
  }

  const pharmacies = await Pharmacy.find(query).lean();

  const results = pharmacies.map(ph => {
    const matchedMedicines = (ph.medicines || []).filter(m => reg.test(m.name));
    return { ...ph, matchedMedicines };
  });

  res.status(200).json({ status: "success", results: results.length, data: results });
});

/**
 * GET /api/pharmacy/filter?medicine=&lat=&lng=&radius=
 * Combined filter endpoint; both params optional.
 */
export const filterPharmacies = handelAsyncFunction(async (req, res, next) => {
  const { medicine, lat, lng, radius } = req.query;
  const query = {};

  if (medicine) {
    query["medicines.name"] = { $regex: new RegExp(medicine, "i") };
  }

  if (lat && lng && radius) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    if (Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(radiusKm)) {
      return next(new CustomError(400, "lat/lng/radius must be numbers"));
    }
    const earthRadiusKm = 6378.1;
    query.geoLocation = {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusKm / earthRadiusKm],
      },
    };
  }

  const pharmacies = await Pharmacy.find(query).lean();

  res.status(200).json({ status: "success", results: pharmacies.length, data: pharmacies });
});

/**
 * PUT /api/pharmacy/inventory
 * Body: { medicines: [{ name, brand, price, stock }, ...] }
 * Upserts medicines by name (case-insensitive). Preserves other fields.
 * PROTECTED: Uses req.user.id from pharmacyAuth middleware
 */
export const updateInventory = handelAsyncFunction(async (req, res, next) => {
  const pharmacyId = req.user?.id; // from JWT middleware
  
  if (!pharmacyId) {
    return next(new CustomError(401, "Unauthorized. Please login."));
  }
  
  const { medicines } = req.body;

  if (!Array.isArray(medicines)) return next(new CustomError(400, "medicines array required in body"));

  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) return next(new CustomError(404, "Pharmacy not found"));

  medicines.forEach((m) => {
    if (!m.name) return;
    const foundIndex = pharmacy.medicines.findIndex(x => x.name.toLowerCase() === m.name.toLowerCase() && (!m.brand || (x.brand && x.brand.toLowerCase() === m.brand.toLowerCase())));
    if (foundIndex >= 0) {
      // update existing
      pharmacy.medicines[foundIndex].price = typeof m.price === "number" ? m.price : pharmacy.medicines[foundIndex].price;
      pharmacy.medicines[foundIndex].stock = typeof m.stock === "number" ? m.stock : pharmacy.medicines[foundIndex].stock;
      if (m.brand) pharmacy.medicines[foundIndex].brand = m.brand;
      pharmacy.medicines[foundIndex].updatedAt = new Date();
    } else {
      // push new entry
      pharmacy.medicines.push({
        name: m.name,
        brand: m.brand || "",
        price: typeof m.price === "number" ? m.price : 0,
        stock: typeof m.stock === "number" ? m.stock : 0,
        updatedAt: new Date(),
      });
    }
  });

  await pharmacy.save();
  res.status(200).json({ status: "success", data: pharmacy });
});

/**
 * GET /api/pharmacy/:id
 */
export const getPharmacyById = handelAsyncFunction(async (req, res, next) => {
  const { id } = req.params;
  const ph = await Pharmacy.findById(id).lean();
  if (!ph) return next(new CustomError(404, "Pharmacy not found"));
  res.status(200).json({ status: "success", data: ph });
});
