import { Router } from "express";
import createPharmacy from "../controllers/pharmacy/register.js";
import verifyPharmacyEmail from "../controllers/pharmacy/pharmacyEmailVerification.js";
import loginPharmacy from "../controllers/pharmacy/loginPharmacy.js";
import forgotPasswordPharmacy from "../controllers/pharmacy/forgotPassword.js";
import {passwordResetServerPharmacy,passwordResetClientPharmacy} from "../controllers/pharmacy/resetPassword.js";

const pharmacyRouter = Router();

pharmacyRouter.post("/",createPharmacy);
pharmacyRouter.get("/verify/:token",verifyPharmacyEmail);
pharmacyRouter.post("/login",loginPharmacy);


pharmacyRouter.post("/forgot-password",forgotPasswordPharmacy);
pharmacyRouter.get("/reset-password/:token",passwordResetClientPharmacy);
pharmacyRouter.post("/reset-password/:token",passwordResetServerPharmacy);




export default pharmacyRouter;