import Pharmacy from "../../models/medical/pharmacy.js";
import { createAuthMiddleware } from "../../middleware/authFactory.js";

// Attaches the full Pharmacy doc as req.user (kept as "user" for backward compatibility — every
// controllers/pharmacy/functionality/*.js controller reads req.user.id, which still works since
// Mongoose documents expose an `.id` virtual alongside the real `.name`/`.email` fields).
const pharmacyAuth = createAuthMiddleware({
  Model: Pharmacy,
  reqKey: "user",
  role: "pharmacy",
  requireVerified: true,
});

export default pharmacyAuth;
