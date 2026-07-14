import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Hospital from "../../models/hospital/hospitalModel.js";

const hospitalResetPassword = handelAsyncFunction(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) return next(new CustomError(400, "Password is required"));

  const hospital = await Hospital.findOne({
    token,
    tokenExpires: { $gt: Date.now() }
  }).select("+password");

  if (!hospital)
    return next(new CustomError(400, "Invalid or expired reset token."));

  hospital.password = password;
  hospital.token = null;
  hospital.tokenExpires = null;

  await hospital.save();

  res.status(200).send({
    status: "success",
    message: "Password reset successful"
  });
});

export default hospitalResetPassword;
