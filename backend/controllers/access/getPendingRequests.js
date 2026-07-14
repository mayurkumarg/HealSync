import PatientAccess from "../../models/hospital/patientAccessModel.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";

/**
 * Get pending access requests for patient (waiting for OTP approval)
 * GET /api/access/pending-requests
 * Auth: Patient JWT (req.actor.type === 'User')
 */
const getPendingRequests = handelAsyncFunction(async (req, res, next) => {
  const actor = req.actor;
  
  if (!actor || actor.type.toLowerCase() !== "user") {
    return next(new CustomError(401, "Only patients can view pending requests."));
  }

  const patientId = actor.doc._id;

  // Find all inactive (pending) access requests for this patient
  const pendingRequests = await PatientAccess.find({
    patientId,
    isActive: false,
    createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Only last 10 minutes (OTP validity)
  })
  .populate('doctorId', 'name email specialization phone_no')
  .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: {
      requests: pendingRequests,
      count: pendingRequests.length
    }
  });
});

export default getPendingRequests;
