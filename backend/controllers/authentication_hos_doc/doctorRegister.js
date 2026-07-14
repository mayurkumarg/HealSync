import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import Doctor from "../../models/hospital/doctorModel.js";
import generateToken from "../../service/token.js";
import { mail } from "../../service/email.js";
import CustomError from "../../utils/customError.js";

const doctorRegister = handelAsyncFunction(async (req, res, next) => {
  if (!req.body || !req.body.email) return next(new CustomError(400, "Please send doctor details and email."));

  const { email } = req.body;
  const existing = await Doctor.findOne({ email });

  const verificationToken = generateToken();
  const expireTime = Date.now() + 10 * 60 * 1000;

  if (existing && existing.verified) return next(new CustomError(400, "Doctor already exists."));

  if (existing && !existing.verified) {
    await Doctor.findOneAndUpdate({ email }, {
      ...req.body,
      token: verificationToken,
      tokenExpires: expireTime
    });
  } else {
    await Doctor.create({
      ...req.body,
      token: verificationToken,
      tokenExpires: expireTime,
      verified: false
    });
  }

  const link = `${req.protocol}://${req.get("host")}/api/doctor/verify/${verificationToken}`;
  const mailRes = await mail(req.body.name || "Doctor", link, email);

  if (!mailRes || mailRes.success === false) {
    console.error("doctorRegister mail error:", mailRes && mailRes.error);
    return next(new CustomError(500, "Email sending failed."));
  }

  res.status(201).send({ status: "success", message: `Doctor verification email sent to ${email}` });
});

export default doctorRegister;
