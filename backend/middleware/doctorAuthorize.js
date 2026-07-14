// backend/middleware/doctorAuthorize.js
import Doctor from "../models/hospital/doctorModel.js";
import { createAuthMiddleware } from "./authFactory.js";

const doctorAuthorize = createAuthMiddleware({
  Model: Doctor,
  reqKey: "doctor",
  role: "doctor",
  selectFields: "+password",
});

export default doctorAuthorize;
