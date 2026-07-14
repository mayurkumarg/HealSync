import { getPatientActivityLogs } from "../../utils/activityLogger.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";

/**
 * Patient views their access activity logs
 * GET /api/access/activity-logs
 * Shows what doctors have accessed/modified
 */
const getActivityLogs = handelAsyncFunction(async (req, res, next) => {
  const actor = req.actor;
  
  if (!actor || actor.type.toLowerCase() !== "user") {
    return next(new CustomError(401, "Only patients can view activity logs."));
  }

  const patientId = actor.doc._id;
  const limit = parseInt(req.query.limit) || 50;

  const logs = await getPatientActivityLogs(patientId, limit);

  res.status(200).json({
    status: 'success',
    data: logs
  });
});

export default getActivityLogs;
