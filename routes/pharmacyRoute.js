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
import findNearest from "../controllers/pharmacy/functionality/nearestWithStock.js";
import lowStock from "../controllers/pharmacy/functionality/lowCostAlert.js";
import expiryAlert from "../controllers/pharmacy/functionality/expiryAlert.js";

import {
  searchByMedicine,
  filterPharmacies,
  updateInventory,
  getPharmacyById,
} from "../controllers/pharmacy/locationController.js";
import { getAllStats } from "../controllers/pharmacy/functionality/stats.js";

const pharmacyRouter = Router();

// ============= PUBLIC ROUTES (No Auth) =============
// Registration & Email Verification
pharmacyRouter.post("/", createPharmacy);
pharmacyRouter.get("/verify/:token", verifyPharmacyEmail);

// Login
pharmacyRouter.post("/login", loginPharmacy);

// Password Reset Flow
pharmacyRouter.post("/forgot-password", forgotPasswordPharmacy);
pharmacyRouter.get("/reset-password/:token", passwordResetClientPharmacy);
pharmacyRouter.post("/reset-password/:token", passwordResetServerPharmacy);

// Public Pharmacy Search (for patients/users)
pharmacyRouter.get("/nearby", getNearbyPharmacies);
pharmacyRouter.get("/search-medicine", searchByMedicine);
pharmacyRouter.get("/filter", filterPharmacies);
pharmacyRouter.get("/pharmacy/:id", getPharmacyById); // Renamed to avoid conflict

// ============= PROTECTED ROUTES (Pharmacy Auth Required) =============
// Pharmacy Profile Management
pharmacyRouter.patch("/profile", pharmacyAuth, updatePharmacy); // Fixed: removed unused param
pharmacyRouter.put("/inventory", pharmacyAuth, updateInventory); // Fixed: secured + removed :id param

// Stock Management - Stats route
pharmacyRouter.get("/stock/stats", pharmacyAuth, getAllStats);

// Stock Management - Specific routes BEFORE parameterized routes
pharmacyRouter.get("/stock/search", pharmacyAuth, searchStock);
pharmacyRouter.get("/stock/nearest", pharmacyAuth, findNearest);
pharmacyRouter.get("/stock/low", pharmacyAuth, lowStock);
pharmacyRouter.get("/stock/expiry", pharmacyAuth, expiryAlert);
pharmacyRouter.get("/stock", pharmacyAuth, getAllStock);
pharmacyRouter.post("/stock", pharmacyAuth, registerStock);

// Parameterized stock routes MUST come AFTER specific routes
pharmacyRouter.get("/stock/:stockId", pharmacyAuth, getStockItem);
pharmacyRouter.patch("/stock/:stockId", pharmacyAuth, updateStock);
pharmacyRouter.delete("/stock/:stockId", pharmacyAuth, deleteStock);

export default pharmacyRouter;