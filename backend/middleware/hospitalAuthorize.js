// backend/middleware/hospitalAuthorize.js
import Hospital from "../models/hospital/hospitalModel.js";
import { createAuthMiddleware } from "./authFactory.js";

const hospitalAuthorize = createAuthMiddleware({
  Model: Hospital,
  reqKey: "hospital",
  role: "hospital",
});

export default hospitalAuthorize;
