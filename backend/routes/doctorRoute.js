import express from "express";
import doctorRegister from "../controllers/authentication_hos_doc/doctorRegister.js";
import verifyDoctorEmail from "../controllers/authentication_hos_doc/verifyDoctorEmail.js";
import doctorLogin from "../controllers/authentication_hos_doc/doctorLogin.js";
import doctorAuthorize from "../middleware/doctorAuthorize.js";
import doctorForgotPassword from "../controllers/authentication_hos_doc/doctorForgotPassword.js";
import doctorResetPassword from "../controllers/authentication_hos_doc/doctorResetPassword.js";
import { handleDoctorChat } from "../controllers/doctor/doctorChatController.js";
import { authLimiter, passwordResetLimiter, chatLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/sign-up", authLimiter, doctorRegister);
router.get("/verify/:token", verifyDoctorEmail);
router.post("/login", authLimiter, doctorLogin);

router.post("/forgot-password", passwordResetLimiter, doctorForgotPassword);
router.get("/reset-password/:token", (req, res) => {
  // Fallback for anyone hitting the backend URL directly — send them to the real frontend route.
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${req.params.token}?role=doctor`);
});
router.post("/reset-password/:token", passwordResetLimiter, doctorResetPassword);

// example protected endpoint
router.get("/me", doctorAuthorize, (req, res) => {
  const d = req.doctor.toObject();
  delete d.password;
  delete d.token;
  delete d.tokenExpires;
  res.status(200).send({ status: "success", data: d });
});

// AI Chat for Patient Data Summary
router.post("/chat", doctorAuthorize, chatLimiter, handleDoctorChat);

export default router;
