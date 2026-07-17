import generateToken from "../../service/token.js";
import { mail } from "../../service/email.js";
import Hospital from "../../models/hospital/hospitalModel.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import { resolveGeoLocation } from "../../utils/resolveGeoLocation.js";

const createHospital = handelAsyncFunction(async (req, res, next) => {

  if (!req.body || !req.body.email) return next(new CustomError(400, "No data sent or email missing."));

  const { email } = req.body;

  // Resolve location — use given coordinates, or geocode the address as a fallback for when
  // the browser couldn't/wouldn't share device geolocation.
  req.body.geoLocation = await resolveGeoLocation({ geoLocation: req.body.geoLocation, address: req.body.address });

  const existing = await Hospital.findOne({ email });

  const verificationToken = generateToken();
  const expireTime = Date.now() + 10 * 60 * 1000;

  if (existing && existing.verified) {
    return next(new CustomError(400, "Hospital already exists."));
  }

  if (existing && !existing.verified) {
    const updateData = {
      ...req.body,
      password: req.body.password, // pre-save hook will hash when saved
      token: verificationToken,
      tokenExpires: expireTime
    };
    // Ensure GeoJSON type is set for updates
    if (updateData.geoLocation && updateData.geoLocation.coordinates) {
      updateData.geoLocation.type = "Point";
    }
    await Hospital.findOneAndUpdate({ email }, updateData);
  } else {
    const createData = {
      ...req.body,
      token: verificationToken,
      tokenExpires: expireTime,
      verified: false
    };
    if (createData.geoLocation && createData.geoLocation.coordinates) {
      createData.geoLocation.type = "Point";
    }
    await Hospital.create(createData);
  }

  // send verification email
  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify/${verificationToken}?role=hospital`;
  const mailRes = await mail(req.body.name || "Hospital", link, email);

  // CHECK: standardized return from email.js
  if (!mailRes || mailRes.success === false) {
    console.error("createHospital mail error:", mailRes && mailRes.error);
    return next(new CustomError(500, "Email server error."));
  }

  res.status(201).send({ status: "success", message: `Verification email sent to ${email}` });
});

export default createHospital;
