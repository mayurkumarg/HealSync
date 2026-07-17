import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Hospital from "../../models/hospital/hospitalModel.js";
import generateToken from "../../service/token.js";
import { mailForgotPassword } from "../../service/email.js";

const hospitalForgotPassword = handelAsyncFunction(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new CustomError(400, "Email is required"));

  const hospital = await Hospital.findOne({ email });
  if (!hospital) return res.status(404).send({
    status: "failed",
    message: `Hospital with email ${email} not found`
  });

  const resetToken = generateToken();
  const expire = Date.now() + 10 * 60 * 1000;

  hospital.token = resetToken;
  hospital.tokenExpires = expire;
  await hospital.save();

  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}?role=hospital`;

  mailForgotPassword(hospital.name, link, hospital.email)
    .then((mailRes) => {
      if (!mailRes?.success) console.error("hospitalForgotPassword mail error:", mailRes?.error);
    })
    .catch((err) => console.error("hospitalForgotPassword mail error:", err.message));

  res.status(200).send({
    status: "success",
    message: "Reset link sent to your email"
  });
});

export default hospitalForgotPassword;