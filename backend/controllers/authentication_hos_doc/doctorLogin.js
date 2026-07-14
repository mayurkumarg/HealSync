import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Doctor from "../../models/hospital/doctorModel.js";
import { getJWT } from "../../service/JWT.js";

const doctorLogin = handelAsyncFunction(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new CustomError(400, "Email and password required."));

  const doctor = await Doctor.findOne({ email }).select("+password");
  if (!doctor || !doctor.verified) return next(new CustomError(401, `Doctor not registered/verified.`));

  const ok = await doctor.comparePassword(password);
  if (!ok) return next(new CustomError(401, "Invalid password."));

  const token = getJWT({ id: doctor._id, email: doctor.email, type: "doctor" });
  res.status(200).send({ status: "success", message: "Doctor login successful.", token });
});

export default doctorLogin;
