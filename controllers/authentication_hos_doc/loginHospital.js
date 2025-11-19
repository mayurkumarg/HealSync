import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Hospital from "../../models/hospital/hospitalModel.js";
import { getJWT } from "../../service/JWT.js";

const loginHospital = handelAsyncFunction(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new CustomError(400, "Email and password required."));

  const hospital = await Hospital.findOne({ email }).select("+password");
  if (!hospital || !hospital.verified) return next(new CustomError(401, `Hospital with email ${email} not registered/verified.`));

  const ok = await hospital.comparePassword(password);
  if (!ok) return next(new CustomError(401, "Invalid password."));

  const token = getJWT({ id: hospital._id, email: hospital.email, type: "hospital" });
  res.status(200).send({ status: "success", message: "Hospital login successful.", token });
});

export default loginHospital;
