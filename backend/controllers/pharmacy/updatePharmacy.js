import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Pharmacy from "../../models/medical/pharmacy.js";

/**
 * @desc   Update pharmacy profile
 * @route  PATCH /api/pharmacy/profile
 * @access Pharmacy (protected)
 */
const updatePharmacy = handelAsyncFunction(async (req, res, next) => {
  const pharmacyId = req.user?.id; // from JWT middleware

  if (!pharmacyId)
    return next(new CustomError(401, "Unauthorized. Please login again."));

  // Extract fields user is allowed to update
  const {
    name,
    address,
    contactNo,
    openingHours,
    isOpen,
    geoLocation,
    gstNo,
    licenseNo,
  } = req.body;

  // Build update object
  const updateData = {};

  if (name) updateData.name = name;
  if (address) updateData.address = address;
  if (contactNo) updateData.contactNo = contactNo;
  if (typeof isOpen === "boolean") updateData.isOpen = isOpen;

  if (openingHours) {
    updateData.openingHours = {
      open: openingHours.open || "09:00",
      close: openingHours.close || "21:00",
    };
  }

  if (geoLocation) {
    updateData.geoLocation = {
      type: "Point",
      coordinates: geoLocation.coordinates,
    };
  }

  // If license or GST changes → set verification to pending
  if (gstNo || licenseNo) {
    updateData["verification"] = {
      ...updateData.verification,
      licenseNo: licenseNo,
      gstNo: gstNo,
      status: "pending",
      verifiedBy: null,
      verifiedAt: null,
    };
  }

  // Update pharmacy record
  const updatedPharmacy = await Pharmacy.findByIdAndUpdate(
    pharmacyId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedPharmacy)
    return next(new CustomError(404, "Pharmacy not found."));

  res.status(200).json({
    status: "success",
    message: "Pharmacy updated successfully.",
    pharmacy: updatedPharmacy,
  });
});

export default updatePharmacy;
