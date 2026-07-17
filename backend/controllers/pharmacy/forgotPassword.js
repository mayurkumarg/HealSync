import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Pharmacy from "../../models/medical/pharmacy.js";
import generateToken from "../../service/token.js";
import { mailForgotPassword } from "../../service/email.js";

const forgotPasswordPharmacy = handelAsyncFunction(async (req, res, next) => {
  //~ Step 1: Extract email from request body
  const { email } = req.body;

  if (!email)
    return next(new CustomError(400, "Email is a required field."));

  //~ Step 2: Check if pharmacy exists and is verified
  const pharmacy = await Pharmacy.findOne({ email });

  if (!pharmacy || !pharmacy.verified) {
    return next(
      new CustomError(
        400,
        `No verified pharmacy exists with email ${email}. Please try again.`
      )
    );
  }

  //~ Step 3: Generate reset token and expiry (valid for 10 minutes)
  const token = generateToken();
  const tokenExpire = Date.now() + 10 * 60 * 1000;

  //~ Step 4: Build reset link
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${token}?role=pharmacy`;

  //~ Step 5: Update pharmacy document
  pharmacy.token = token;
  pharmacy.tokenExpires = tokenExpire;
  await pharmacy.save();

  //~ Step 6: Send email with reset link
  const mailerRes = await mailForgotPassword(pharmacy.name, resetLink, email);
  if (!mailerRes || mailerRes.success === false) {
    return next(
      new CustomError(
        500,
        "Our email server is down! Please try again later."
      )
    );
  }

  //~ Step 7: Send success response
  res.status(200).send({
    status: "success",
    message: `An email has been sent to ${email}. Please click the link to reset your password.`,
  });
});

export default forgotPasswordPharmacy;
