import express from "express";
import createHospital from "../controllers/authentication_hos_doc/createHospital.js";
import verifyHospitalEmail from "../controllers/authentication_hos_doc/verifyHospitalEmail.js";
import loginHospital from "../controllers/authentication_hos_doc/loginHospital.js";
import hospitalAuthorize from "../middleware/hospitalAuthorize.js";
import { getHospitalProfile, updateHospitalProfile } from "../controllers/hospital/hospitalController.js";
import createDoctorByHospital from "../controllers/authentication_hos_doc/createDoctor.js";
import hospitalForgotPassword from "../controllers/authentication_hos_doc/hospitalForgotPassword.js";
import hospitalResetPassword from "../controllers/authentication_hos_doc/hospitalResetPassword.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiters.js";
import {
  getHospitalDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  toggleDoctorVerification,
  getDoctorStats
} from "../controllers/hospital/manageDoctors.js";

const router = express.Router();

// public
router.post("/sign-up", authLimiter, createHospital);
router.get("/verify/:token", verifyHospitalEmail);
router.post("/login", authLimiter, loginHospital);

// password reset
router.post("/forgot-password", passwordResetLimiter, hospitalForgotPassword);
router.get("/reset-password/:token", (req, res) => {
  // Fallback for anyone hitting the backend URL directly — send them to the real frontend route.
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${req.params.token}?role=hospital`);
});
router.post("/reset-password/:token", passwordResetLimiter, hospitalResetPassword);

// protected hospital-only routes
router.get("/me", hospitalAuthorize, getHospitalProfile);
router.patch("/profile", hospitalAuthorize, updateHospitalProfile);

// Doctor management endpoints
router.post("/create-doctor", hospitalAuthorize, createDoctorByHospital);
router.get("/doctors", hospitalAuthorize, getHospitalDoctors);
router.get("/doctors/stats", hospitalAuthorize, getDoctorStats);
router.get("/doctors/:doctorId", hospitalAuthorize, getDoctorById);
router.put("/doctors/:doctorId", hospitalAuthorize, updateDoctor);
router.delete("/doctors/:doctorId", hospitalAuthorize, deleteDoctor);
router.patch("/doctors/:doctorId/verify", hospitalAuthorize, toggleDoctorVerification);


export default router;
