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


const pharmacyRouter = Router();

pharmacyRouter.post("/",createPharmacy);
pharmacyRouter.get("/verify/:token",verifyPharmacyEmail);
pharmacyRouter.post("/login",loginPharmacy);


pharmacyRouter.post("/forgot-password",forgotPasswordPharmacy);
pharmacyRouter.get("/reset-password/:token",passwordResetClientPharmacy);
pharmacyRouter.post("/reset-password/:token",passwordResetServerPharmacy);

pharmacyRouter.get("/nearby", getNearbyPharmacies);
pharmacyRouter.patch("/:pharmacyId", pharmacyAuth,updatePharmacy);

pharmacyRouter.post("/stock", pharmacyAuth, registerStock);
pharmacyRouter.patch("/stock/:stockId", pharmacyAuth, updateStock);
pharmacyRouter.delete("/stock/:stockId", pharmacyAuth, deleteStock);
pharmacyRouter.get("/stock",pharmacyAuth,getAllStock)
pharmacyRouter.get("/stock/:stockId",pharmacyAuth,getStockItem);
pharmacyRouter.get("/stock/search", pharmacyAuth, searchStock);
pharmacyRouter.get("/stock/nearest", pharmacyAuth, findNearest);
pharmacyRouter.get("/stock/low", pharmacyAuth, lowStock);
pharmacyRouter.get("/stock/expiry", pharmacyAuth, expiryAlert);

export default pharmacyRouter;