import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import Doctor from "../../models/hospital/doctorModel.js";
import CustomError from "../../utils/customError.js";

/**
 * Get all doctors associated with the hospital
 */
export const getHospitalDoctors = handelAsyncFunction(async (req, res, next) => {
  const hospital = req.hospital;
  if (!hospital) return next(new CustomError(401, "Unauthorized."));

  const doctors = await Doctor.find({ hospitalId: hospital._id })
    .select("-password -token -tokenExpires")
    .sort({ createdAt: -1 });

  res.status(200).send({
    status: "success",
    data: {
      total: doctors.length,
      doctors
    }
  });
});

/**
 * Get a single doctor by ID (must belong to this hospital)
 */
export const getDoctorById = handelAsyncFunction(async (req, res, next) => {
  const hospital = req.hospital;
  const { doctorId } = req.params;

  if (!hospital) return next(new CustomError(401, "Unauthorized."));

  const doctor = await Doctor.findOne({
    _id: doctorId,
    hospitalId: hospital._id
  }).select("-password -token -tokenExpires");

  if (!doctor) {
    return next(new CustomError(404, "Doctor not found or doesn't belong to your hospital."));
  }

  res.status(200).send({ status: "success", data: doctor });
});

/**
 * Update doctor information (hospital admin only)
 */
export const updateDoctor = handelAsyncFunction(async (req, res, next) => {
  const hospital = req.hospital;
  const { doctorId } = req.params;

  if (!hospital) return next(new CustomError(401, "Unauthorized."));

  // Don't allow password updates through this endpoint
  const { password, email, username, ...updateData } = req.body;

  const doctor = await Doctor.findOneAndUpdate(
    { _id: doctorId, hospitalId: hospital._id },
    updateData,
    { new: true, runValidators: true }
  ).select("-password -token -tokenExpires");

  if (!doctor) {
    return next(new CustomError(404, "Doctor not found or doesn't belong to your hospital."));
  }

  res.status(200).send({
    status: "success",
    message: "Doctor updated successfully",
    data: doctor
  });
});

/**
 * Delete/Remove doctor from hospital
 */
export const deleteDoctor = handelAsyncFunction(async (req, res, next) => {
  const hospital = req.hospital;
  const { doctorId } = req.params;

  if (!hospital) return next(new CustomError(401, "Unauthorized."));

  const doctor = await Doctor.findOneAndDelete({
    _id: doctorId,
    hospitalId: hospital._id
  });

  if (!doctor) {
    return next(new CustomError(404, "Doctor not found or doesn't belong to your hospital."));
  }

  res.status(200).send({
    status: "success",
    message: "Doctor removed successfully"
  });
});

/**
 * Toggle doctor verification status
 */
export const toggleDoctorVerification = handelAsyncFunction(async (req, res, next) => {
  const hospital = req.hospital;
  const { doctorId } = req.params;
  const { status } = req.body; // 'verified', 'pending', 'rejected'

  if (!hospital) return next(new CustomError(401, "Unauthorized."));

  if (!['verified', 'pending', 'rejected'].includes(status)) {
    return next(new CustomError(400, "Invalid status. Must be 'verified', 'pending', or 'rejected'."));
  }

  const doctor = await Doctor.findOneAndUpdate(
    { _id: doctorId, hospitalId: hospital._id },
    {
      'verification.status': status,
      'verification.verifiedAt': status === 'verified' ? new Date() : null,
      'verification.verifiedBy': status === 'verified' ? hospital._id : null
    },
    { new: true }
  ).select("-password -token -tokenExpires");

  if (!doctor) {
    return next(new CustomError(404, "Doctor not found or doesn't belong to your hospital."));
  }

  res.status(200).send({
    status: "success",
    message: `Doctor verification status updated to ${status}`,
    data: doctor
  });
});

/**
 * Get doctor statistics
 */
export const getDoctorStats = handelAsyncFunction(async (req, res, next) => {
  const hospital = req.hospital;
  if (!hospital) return next(new CustomError(401, "Unauthorized."));

  const totalDoctors = await Doctor.countDocuments({ hospitalId: hospital._id });
  const verifiedDoctors = await Doctor.countDocuments({
    hospitalId: hospital._id,
    'verification.status': 'verified'
  });
  const pendingDoctors = await Doctor.countDocuments({
    hospitalId: hospital._id,
    'verification.status': 'pending'
  });

  const specializations = await Doctor.aggregate([
    { $match: { hospitalId: hospital._id } },
    { $group: { _id: "$specialization", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.status(200).send({
    status: "success",
    data: {
      totalDoctors,
      verifiedDoctors,
      pendingDoctors,
      rejectedDoctors: totalDoctors - verifiedDoctors - pendingDoctors,
      specializations
    }
  });
});
