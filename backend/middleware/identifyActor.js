import User from "../models/userModel.js";
import Doctor from "../models/hospital/doctorModel.js";
import { verifyBearerToken } from "./authFactory.js";
import handelAsyncFunction from "../utils/asyncFunctionHandler.js";
import CustomError from "../utils/customError.js";

// Generic auth for endpoints usable by either a patient or a doctor — tries User first, then
// Doctor, and attaches whichever matched as req.actor = { type, doc }. Uses the same shared
// token-verification step as the single-identity middlewares (authFactory.js) so there's one
// JWT secret source and one error shape across the whole app.
const identifyActor = handelAsyncFunction(async (req, res, next) => {
  const { id } = verifyBearerToken(req);

  let actorDoc = await User.findById(id).select("+password +token");
  if (actorDoc) {
    req.actor = { type: "user", doc: actorDoc };
    return next();
  }

  actorDoc = await Doctor.findById(id).populate("hospitalId").select("+password +token");
  if (actorDoc) {
    req.actor = { type: "doctor", doc: actorDoc };
    return next();
  }

  return next(new CustomError(401, "User or Doctor not found for provided token."));
});

export default identifyActor;
