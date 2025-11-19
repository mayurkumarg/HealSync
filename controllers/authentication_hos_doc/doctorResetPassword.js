import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import Doctor from "../../models/hospital/doctorModel.js";
import CustomError from "../../utils/customError.js";

const doctorResetPassword = handelAsyncFunction(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) return next(new CustomError(400, "Password is required"));

  const doctor = await Doctor.findOne({
    token,
    tokenExpires: { $gt: Date.now() }
  }).select("+password");

  if (!doctor)
    return next(new CustomError(400, "Invalid or expired reset token."));

  doctor.password = password;
  doctor.token = null;
  doctor.tokenExpires = null;
  await doctor.save();

  res.status(200).send({
    status: "success",
    message: "Password reset successful"
  });
});

export default doctorResetPassword;