import Pharmacy from "../../models/medical/pharmacy.js";
import generateToken from "../../service/token.js";
import mail from "../../service/email.js";
import bcrypt from "bcrypt";
import CustomError from "../../utils/customError.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";

const createPharmacy = handelAsyncFunction(async (req, res, next) => {
  // ^ Step 1: Validate request body
  if (!Object.keys(req.body).length || !req.body.email) {
    return next(new CustomError(400, "No data was sent."));
  }

  const { email, contactNo } = req.body;

  // ^ Step 2: Check if pharmacy already exists (by email or contact)
  const existingPharmacy = await Pharmacy.findOne({
    $or: [{ email }, { contactNo }],
  });

  if (existingPharmacy && existingPharmacy.verified) {
    return next(new CustomError(400, "Pharmacy already exists and verified."));
  }

  // ^ Step 3: Generate verification token and expiry
  const verificationToken = generateToken();
  const expireTime = Date.now() + 10 * 60 * 1000; // 10 minutes

  // ^ Step 4: Update unverified pharmacy OR create new record
  if (existingPharmacy && !existingPharmacy.verified) {
    await Pharmacy.findOneAndUpdate(
      { email: existingPharmacy.email },
      {
        ...req.body,
        password: await bcrypt.hash(req.body.password, +process.env.SALTROUNDS),
        tokenExpires: expireTime,
        token: verificationToken,
      }
    );
  } else {
    await Pharmacy.create({
      ...req.body,
      tokenExpires: expireTime,
      verified: false,
      token: verificationToken,
    });
  }

  // ^ Step 5: Generate email verification link
  const link = `${req.protocol}://${req.get(
    "host"
  )}/api/pharmacy/verify/${verificationToken}`;

  // ^ Step 6: Send verification email
  const mailerRes = await mail(req.body.name, link, email, next);

  if (!mailerRes || mailerRes.success === false) {
    return next(
      new CustomError(500, "Our email server is down! Please try again later.")
    );
  }

  // ^ Step 7: Successful registration
  res.status(201).send({
    status: "success",
    message: `A verification email has been sent to ${email}. Please verify your email.`,
  });
});

export default createPharmacy;
