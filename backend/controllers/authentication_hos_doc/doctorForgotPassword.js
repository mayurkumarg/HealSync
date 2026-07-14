import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import Doctor from "../../models/hospital/doctorModel.js";
import CustomError from "../../utils/customError.js";
import generateToken from "../../service/token.js";
import { mailForgotPassword } from "../../service/email.js";

const doctorForgotPassword = handelAsyncFunction(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new CustomError(400, "Email is required"));

  const doctor = await Doctor.findOne({ email });
  if (!doctor) return res.status(404).send({
    status: "failed",
    message: `Doctor with email ${email} not found`
  });

  const resetToken = generateToken();
  const expire = Date.now() + 10 * 60 * 1000;

  doctor.token = resetToken;
  doctor.tokenExpires = expire;
  await doctor.save();

  const link = `${req.protocol}://${req.get("host")}/api/doctor/reset-password/${resetToken}`;

  const mailRes = await mailForgotPassword(doctor.name, link, doctor.email);
  if (!mailRes || mailRes.success === false) {
    console.error("doctorForgotPassword mail error:", mailRes && mailRes.error);
    return next(new CustomError(500, "Email service error"));
  }

  res.status(200).send({
    status: "success",
    message: "Reset link sent to your email"
  });
});

export default doctorForgotPassword;