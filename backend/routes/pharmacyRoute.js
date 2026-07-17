import { Router } from "express";
import createPharmacy from "../controllers/pharmacy/register.js";
import verifyPharmacyEmail from "../controllers/pharmacy/pharmacyEmailVerification.js";
import loginPharmacy from "../controllers/pharmacy/loginPharmacy.js";
import forgotPasswordPharmacy from "../controllers/pharmacy/forgotPassword.js";
import {passwordResetServerPharmacy,passwordResetClientPharmacy} from "../controllers/pharmacy/resetPassword.js";
import getNearbyPharmacies from "../controllers/pharmacy/findNearPharmacy.js";
import updatePharmacy from "../controllers/pharmacy/updatePharmacy.js";
import pharmacyAuth from "../controllers/pharmacy/pharmacyAuthorizer.js";
import registerStock from "../controllers/pharmacy/functionality/registerStock.js";
import updateStock from "../controllers/pharmacy/functionality/updateStock.js";
import deleteStock from "../controllers/pharmacy/functionality/deleteStock.js";
import getAllStock from "../controllers/pharmacy/functionality/getAllStock.js";
import getStockItem from "../controllers/pharmacy/functionality/singleStock.js";
import searchStock from "../controllers/pharmacy/functionality/searchStock.js";
import lowStock from "../controllers/pharmacy/functionality/lowCostAlert.js";
import expiryAlert from "../controllers/pharmacy/functionality/expiryAlert.js";

import { getPharmacyById } from "../controllers/pharmacy/locationController.js";
import { getAllStats } from "../controllers/pharmacy/functionality/stats.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiters.js";

const pharmacyRouter = Router();

// ============= PUBLIC ROUTES (No Auth) =============
// Registration & Email Verification
pharmacyRouter.post("/", authLimiter, createPharmacy);
pharmacyRouter.get("/verify/:token", verifyPharmacyEmail);

// Login
pharmacyRouter.post("/login", authLimiter, loginPharmacy);

// Password Reset Flow
pharmacyRouter.post("/forgot-password", passwordResetLimiter, forgotPasswordPharmacy);
pharmacyRouter.get("/reset-password/:token", passwordResetClientPharmacy);
pharmacyRouter.post("/reset-password/:token", passwordResetLimiter, passwordResetServerPharmacy);

// Public Pharmacy Search (for patients/users)
pharmacyRouter.get("/nearby", getNearbyPharmacies);
pharmacyRouter.get("/pharmacy/:id", getPharmacyById); // Renamed to avoid conflict

// NOTE: search-medicine / filter / inventory (embedded pharmacy.medicines array) routes were
// removed here — that field doesn't exist on the Pharmacy schema (see ARCHITECTURE.md's
// Known Limitations). Real inventory lives in PharmacyStock/Medicine, see /stock/* below.

// ============= PROTECTED ROUTES (Pharmacy Auth Required) =============
// Pharmacy Profile Management
pharmacyRouter.get("/me", pharmacyAuth, (req, res) => {
  const p = req.user.toObject();
  delete p.password;
  delete p.token;
  delete p.tokenExpires;
  res.status(200).send({ status: "success", data: p });
});
pharmacyRouter.patch("/profile", pharmacyAuth, updatePharmacy); // Fixed: removed unused param

// Stock Management - Stats route
pharmacyRouter.get("/stock/stats", pharmacyAuth, getAllStats);

// Stock Management - Specific routes BEFORE parameterized routes
pharmacyRouter.get("/stock/search", pharmacyAuth, searchStock);
pharmacyRouter.get("/stock/low", pharmacyAuth, lowStock);
pharmacyRouter.get("/stock/expiry", pharmacyAuth, expiryAlert);
pharmacyRouter.get("/stock", pharmacyAuth, getAllStock);
pharmacyRouter.post("/stock", pharmacyAuth, registerStock);

// Parameterized stock routes MUST come AFTER specific routes
pharmacyRouter.get("/stock/:stockId", pharmacyAuth, getStockItem);
pharmacyRouter.patch("/stock/:stockId", pharmacyAuth, updateStock);
pharmacyRouter.delete("/stock/:stockId", pharmacyAuth, deleteStock);

export default pharmacyRouter;