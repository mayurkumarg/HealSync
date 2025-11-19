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

  const link = `${req.protocol}://${req.get("host")}/api/hospital/reset-password/${resetToken}`;

  const mailRes = await mailForgotPassword(hospital.name, link, hospital.email);
  if (!mailRes || mailRes.success === false) {
    console.error("hospitalForgotPassword mail error:", mailRes && mailRes.error);
    return next(new CustomError(500, "Email service error"));
  }

  res.status(200).send({
    status: "success",
    message: "Reset link sent to your email"
  });
});

export default hospitalForgotPassword;