import userModel from "./../../models/userModel.js";
import generateToken from "../../service/token.js";
import mail from "../../service/email.js";
import bcrypt from "bcrypt";
import CustomError from "../../utils/customError.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";

const createUser = handelAsyncFunction(async (req, res, next) => {
  // Verify that data and email are provided
  if (!Object.keys(req.body).length || !req.body.email) {
    return next(new CustomError(400, "No data was sent."));
  }

  const { email } = req.body;

  // Check if user already exists
  const userExists = await userModel.findOne({ email });

  if (userExists && userExists.verified) {
    return next(new CustomError(400, "User already exists."));
  }

  // Generate verification token + expiry
  const verificationToken = generateToken();
  const expireTime = Date.now() + 10 * 60 * 1000;

  // Update if user exists but not verified
  if (userExists && !userExists.verified) {
    // SECURITY: allowlist the fields a re-signup is allowed to touch. Spreading the raw req.body
    // into the update let a client set `verified`/`role` (or any other schema field) directly,
    // bypassing email verification entirely — never spread untrusted input into a Mongoose update.
    await userModel.findOneAndUpdate(
      { email },
      {
        name: req.body.name,
        username: req.body.username,
        phone_no: req.body.phone_no,
        password: await bcrypt.hash(
          req.body.password,
          parseInt(process.env.SALTROUNDS) || 10
        ),
        verified: false,
        tokenExpires: expireTime,
        token: verificationToken,
      }
    );
  } else {
    // Create new user
    await userModel.create({
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
      phone_no: req.body.phone_no,
      password: req.body.password,
      tokenExpires: expireTime,
      verified: false,
      token: verificationToken,
    });
  }

  // Build verification link — points at the frontend's VerifyEmail page, which calls the
  // matching role-specific backend verify endpoint itself.
  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify/${verificationToken}?role=patient`;

  // Account creation must not block on email delivery — a slow/unreachable SMTP path (real risk
  // on some hosts) would otherwise hang the whole signup request. Fire-and-forget with logging;
  // the account already exists and can be verified via a resend if this fails.
  mail(req.body.name, link, email)
    .then((mailRes) => {
      if (!mailRes?.success) console.error("[createUser] Verification email failed to send:", mailRes?.error);
    })
    .catch((err) => console.error("[createUser] Verification email failed to send:", err.message));

  return res.status(201).send({
    status: "success",
    message: `Email sent to your ${email} address. Please verify your email`,
  });
});

export default createUser;
