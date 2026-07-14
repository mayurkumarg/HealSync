import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Pharmacy from "../../models/medical/pharmacy.js";
import { getJWT } from "../../service/JWT.js";

const loginPharmacy = handelAsyncFunction(async (req, res, next) => {
  //~ Step 1: Verify that pharmacy sent email and password
  const { email, password } = req.body;

  if (!email || !password)
    return next(
      new CustomError(400, "Email and password are required fields to login.")
    );

  //~ Step 2: Check if pharmacy exists and has verified email
  const pharmacy = await Pharmacy.findOne({ email }).select("+password");

  if (!pharmacy || !pharmacy.verified) {
    return next(
      new CustomError(
        401,
        `No verified pharmacy is registered with email ${email}. Please register or verify your account.`
      )
    );
  }

  //~ Step 3: Compare the entered password with hashed password
  const isPasswordMatch = await pharmacy.comparePassword(
    password,
    pharmacy.password
  );

  if (!isPasswordMatch)
    return next(new CustomError(401, "Invalid password! Please try again."));

  //~ Step 4: Generate JWT for the pharmacy
  const JWT = getJWT({
    id: pharmacy._id,
    email: pharmacy.email,
    name: pharmacy.name,
    type: "pharmacy",
  });

  //~ Step 5: Send successful response
  res.status(200).send({
    status: "success",
    message: `Login successful for pharmacy "${pharmacy.name}".`,
    token: JWT,
  });
});

export default loginPharmacy;
