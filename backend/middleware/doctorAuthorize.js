// backend/middleware/doctorAuthorize.js
import Doctor from "../models/hospital/doctorModel.js";
import { verifyJwt } from "../service/JWT.js";
import CustomError from "../utils/customError.js";
import handelAsyncFunction from "../utils/asyncFunctionHandler.js";

const doctorAuthorize = handelAsyncFunction(async (req, res, next) => {
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

  const doctor = await Doctor.findById(decoded.id).select("+password");
  if (!doctor) return next(new CustomError(401, "Doctor no longer exists."));

  // attach doctor and role
  req.doctor = doctor;
  req.role = "doctor";

  next();
});

export default doctorAuthorize;