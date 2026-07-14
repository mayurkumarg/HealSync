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
    await userModel.findOneAndUpdate(
      { email },
      {
        ...req.body,
        password: await bcrypt.hash(
          req.body.password,
          parseInt(process.env.SALTROUNDS) || 10
        ),
        tokenExpires: expireTime,
        token: verificationToken,
      }
    );
  } else {
    // Create new user
    await userModel.create({
      ...req.body,
      tokenExpires: expireTime,
      verified: false,
      token: verificationToken,
    });
  }

  // Build verification link
  const link = `${req.protocol}://${req.get("host")}/api/auth/verify/${verificationToken}`;

  // Send verification email
  const mailerRes = await mail(req.body.name, link, email, next);

  // testing logic was correct → use it:
  if (!mailerRes || mailerRes.success === false) {
    return next(
      new CustomError(500, "Our email server is down! Please try again later.")
    );
  }

  // Email sent successfully
  return res.status(201).send({
    status: "success",
    message: `Email sent to your ${email} address. Please verify your email`,
  });
});

export default createUser;
