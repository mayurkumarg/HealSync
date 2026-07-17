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

  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify/${verificationToken}?role=doctor`;

  // Account creation must not block on email delivery — fire-and-forget with logging.
  mail(req.body.name || "Doctor", link, email)
    .then((mailRes) => {
      if (!mailRes?.success) console.error("doctorRegister mail error:", mailRes?.error);
    })
    .catch((err) => console.error("doctorRegister mail error:", err.message));

  res.status(201).send({ status: "success", message: `Doctor verification email sent to ${email}` });
});

export default doctorRegister;
