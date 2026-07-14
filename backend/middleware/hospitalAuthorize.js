// backend/middleware/hospitalAuthorize.js
import Hospital from "../models/hospital/hospitalModel.js";
import { verifyJwt } from "../service/JWT.js";
import CustomError from "../utils/customError.js";
import handelAsyncFunction from "../utils/asyncFunctionHandler.js";

const hospitalAuthorize = handelAsyncFunction(async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return next(new CustomError(401, "Unauthorized"));

  const token = authorization.split(" ")[1];
  if (!token) return next(new CustomError(401, "Unauthorized"));

  let decoded;
  try {
    decoded = verifyJwt(token);
  } catch (err) {
    return next(new CustomError(401, "Invalid token"));
  }

  if (!decoded || !decoded.id) return next(new CustomError(401, "Invalid token"));

  const hospital = await Hospital.findById(decoded.id);
  if (!hospital) return next(new CustomError(401, "Hospital no longer exists."));

  // attach hospital and role
  req.hospital = hospital;
  req.role = "hospital";

  next();
});

export default hospitalAuthorize;
