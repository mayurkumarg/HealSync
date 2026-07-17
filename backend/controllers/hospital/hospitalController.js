import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Hospital from "../../models/hospital/hospitalModel.js";

const getHospitalProfile = handelAsyncFunction(async (req, res) => {
  const hospital = await Hospital.findById(req.hospital._id).select("-password -token -tokenExpires");
  res.status(200).send({ status: "success", data: hospital });
});

/**
 * @desc   Update hospital/facility profile
 * @route  PATCH /api/hospital/profile
 * @access Hospital (protected)
 */
const updateHospitalProfile = handelAsyncFunction(async (req, res, next) => {
  const hospitalId = req.hospital?._id;
  if (!hospitalId) return next(new CustomError(401, "Unauthorized. Please login again."));

  const { name, type, address, contactNo, isOpen, geoLocation, servicesOffered, registrationNo } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (type) updateData.type = type;
  if (address) updateData.address = address;
  if (contactNo) updateData.contactNo = contactNo;
  if (typeof isOpen === "boolean") updateData.isOpen = isOpen;
  if (Array.isArray(servicesOffered)) updateData.servicesOffered = servicesOffered;
  if (geoLocation?.coordinates) updateData.geoLocation = { type: "Point", coordinates: geoLocation.coordinates };

  // Changing the registration number re-triggers verification, same as pharmacy license/GST edits.
  if (registrationNo) {
    updateData.verification = {
      registrationNo,
      status: "pending",
      verifiedBy: null,
      verifiedAt: null,
    };
  }

  const updated = await Hospital.findByIdAndUpdate(hospitalId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -token -tokenExpires");

  if (!updated) return next(new CustomError(404, "Hospital not found."));

  res.status(200).json({ status: "success", message: "Hospital updated successfully.", data: updated });
});

export { getHospitalProfile, updateHospitalProfile };
