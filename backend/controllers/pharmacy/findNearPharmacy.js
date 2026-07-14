import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Pharmacy from "../../models/medical/pharmacy.js";

/**
 * @desc   Find nearest pharmacies based on coordinates
 * @route  GET /api/pharmacy/nearby?lat=12.9967&lng=76.1033&distance=5000
 * @access Public
 */
const getNearbyPharmacies = handelAsyncFunction(async (req, res, next) => {
  // Extract query parameters
  const { lat, lng, distance } = req.query;

  //  Validate coordinates
  if (!lat || !lng) {
    return next(new CustomError(400, "Latitude and Longitude are required."));
  }

  // Default distance → 5 km if not provided
  const maxDistance = distance ? Number(distance) : 5000; // in meters

  //  Geospatial query using $near
  const pharmacies = await Pharmacy.find({
    geoLocation: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: maxDistance,
      },
    },
  }).select("name address contactNo rating isOpen geoLocation verification openingHours");

  //  If no results
  if (!pharmacies.length) {
    return res.status(404).json({
      status: "failed",
      message: "No nearby pharmacies found within the specified distance.",
    });
  }

  //  Success response
  res.status(200).json({
    status: "success",
    count: pharmacies.length,
    message: "Nearby pharmacies retrieved successfully.",
    data: pharmacies,
  });
});

export default getNearbyPharmacies;
