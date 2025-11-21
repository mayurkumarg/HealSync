import express from "express";
import createHospital from "../controllers/authentication_hos_doc/createHospital.js";
import verifyHospitalEmail from "../controllers/authentication_hos_doc/verifyHospitalEmail.js";
import loginHospital from "../controllers/authentication_hos_doc/loginHospital.js";
import hospitalAuthorize from "../middleware/hospitalAuthorize.js";
import { getHospitalProfile } from "../controllers/hospital/hospitalController.js";
import createDoctorByHospital from "../controllers/authentication_hos_doc/createDoctor.js";
import hospitalForgotPassword from "../controllers/authentication_hos_doc/hospitalForgotPassword.js";
import hospitalResetPassword from "../controllers/authentication_hos_doc/hospitalResetPassword.js";
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
router.post("/sign-up", createHospital);
router.get("/verify/:token", verifyHospitalEmail);
router.post("/login", loginHospital);

// password reset
router.post("/forgot-password", hospitalForgotPassword);
router.get("/reset-password/:token", (req, res) => {
  // Redirect to frontend React app
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/hospital/reset-password/${req.params.token}`);
});
router.post("/reset-password/:token", hospitalResetPassword);

// protected hospital-only routes
router.get("/me", hospitalAuthorize, getHospitalProfile);

// Doctor management endpoints
router.post("/create-doctor", hospitalAuthorize, createDoctorByHospital);
router.get("/doctors", hospitalAuthorize, getHospitalDoctors);
router.get("/doctors/stats", hospitalAuthorize, getDoctorStats);
router.get("/doctors/:doctorId", hospitalAuthorize, getDoctorById);
router.put("/doctors/:doctorId", hospitalAuthorize, updateDoctor);
router.delete("/doctors/:doctorId", hospitalAuthorize, deleteDoctor);
router.patch("/doctors/:doctorId/verify", hospitalAuthorize, toggleDoctorVerification);


export default router;
