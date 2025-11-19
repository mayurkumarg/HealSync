import express from "express";
import createHospital from "../controllers/authentication_hos_doc/createHospital.js";
import verifyHospitalEmail from "../controllers/authentication_hos_doc/verifyHospitalEmail.js";
import loginHospital from "../controllers/authentication_hos_doc/loginHospital.js";
import hospitalAuthorize from "../middleware/hospitalAuthorize.js";
import { getHospitalProfile } from "../controllers/hospital/hospitalController.js";
import createDoctorByHospital from "../controllers/authentication_hos_doc/createDoctor.js";
import hospitalForgotPassword from "../controllers/authentication_hos_doc/hospitalForgotPassword.js";
import hospitalResetPassword from "../controllers/authentication_hos_doc/hospitalResetPassword.js";

const router = express.Router();

// public
router.post("/sign-up", createHospital);
router.get("/verify/:token", verifyHospitalEmail);
router.post("/login", loginHospital);

// protected hospital-only
router.get("/me", hospitalAuthorize, getHospitalProfile);
router.post("/create-doctor", hospitalAuthorize, createDoctorByHospital);

router.post("/forgot-password", hospitalForgotPassword);
router.post("/reset-password/:token", hospitalResetPassword);


export default router;
