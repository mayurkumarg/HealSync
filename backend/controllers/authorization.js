import userModel from "../models/userModel.js";
import { createAuthMiddleware } from "../middleware/authFactory.js";

// Patient auth — verifies the Bearer JWT, loads the User, attaches it as req.user.
const authorize = createAuthMiddleware({
  Model: userModel,
  reqKey: "user",
  role: "patient",
});

export default authorize;
