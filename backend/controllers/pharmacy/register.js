import Pharmacy from "../../models/medical/pharmacy.js";
import generateToken from "../../service/token.js";
import mail from "../../service/email.js";
import bcrypt from "bcrypt";
import CustomError from "../../utils/customError.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import { resolveGeoLocation } from "../../utils/resolveGeoLocation.js";

const createPharmacy = handelAsyncFunction(async (req, res, next) => {
  // ^ Step 1: Validate request body
  if (!Object.keys(req.body).length || !req.body.email) {
    return next(new CustomError(400, "No data was sent."));
  }

  const { email, contactNo, address, geoLocation } = req.body;

  // ^ Step 1b: Resolve location — use given coordinates, or geocode the address as a fallback
  // for when the browser couldn't/wouldn't share device geolocation.
  const resolvedGeoLocation = await resolveGeoLocation({ geoLocation, address });
  req.body.geoLocation = resolvedGeoLocation;

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
        password: await bcrypt.hash(req.body.password, parseInt(process.env.SALTROUNDS) || 10),
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
  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify/${verificationToken}?role=pharmacy`;

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
