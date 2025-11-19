import express from "express";
import doctorRegister from "../controllers/authentication_hos_doc/doctorRegister.js";
import verifyDoctorEmail from "../controllers/authentication_hos_doc/verifyDoctorEmail.js";
import doctorLogin from "../controllers/authentication_hos_doc/doctorLogin.js";
import doctorAuthorize from "../middleware/doctorAuthorize.js";
import doctorForgotPassword from "../controllers/authentication_hos_doc/doctorForgotPassword.js";
import doctorResetPassword from "../controllers/authentication_hos_doc/doctorResetPassword.js";

const router = express.Router();

router.post("/sign-up", doctorRegister);
router.get("/verify/:token", verifyDoctorEmail);
router.post("/login", doctorLogin);

router.post("/forgot-password", doctorForgotPassword);
router.post("/reset-password/:token", doctorResetPassword);

// example protected endpoint
router.get("/me", doctorAuthorize, (req, res) => {
  const d = req.doctor.toObject();
  delete d.password;
  delete d.token;
  delete d.tokenExpires;
  res.status(200).send({ status: "success", data: d });
});

export default router;
