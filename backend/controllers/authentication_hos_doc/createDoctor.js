import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import Hospital from "../../models/hospital/hospitalModel.js";
import Doctor from "../../models/hospital/doctorModel.js";
import generateToken from "../../service/token.js";
import { mail } from "../../service/email.js";
import CustomError from "../../utils/customError.js";

/**
 * hospital (req.hospital) must be set by hospitalAuthorize middleware
 * Body should contain doctor details (email,name,username,password,specialization,licenseNo,...)
 */
const createDoctorByHospital = handelAsyncFunction(async (req, res, next) => {
  const hospital = req.hospital;
  if (!hospital) return next(new CustomError(401, "Unauthorized."));

  if (!req.body || !req.body.email) return next(new CustomError(400, "Doctor email required."));

  const { email } = req.body;
  const existing = await Doctor.findOne({ email });

  // generate token for doctor verification
  const token = generateToken();
  const tokenExpires = Date.now() + 10 * 60 * 1000;

  if (existing && existing.verified) {
    return next(new CustomError(400, "Doctor already exists and verified."));
  }

  const doctorData = {
    ...req.body,
    hospitalId: hospital._id,
    token,
    tokenExpires,
    verified: false
  };

  // Ensure GeoJSON type is set for updates/creation
  if (doctorData.geoLocation && doctorData.geoLocation.coordinates) {
    doctorData.geoLocation.type = "Point";
  }

  if (existing && !existing.verified) {
    await Doctor.findOneAndUpdate({ email }, doctorData);
  } else {
    // The password will be hashed by the pre-save hook in the Doctor model
    await Doctor.create(doctorData);
  }

  // Send email to doctor with verification link and hospital info
  const link = `${req.protocol}://${req.get("host")}/api/doctor/verify/${token}`;
  const mailRes = await mail(req.body.name || "Doctor", link, email);

  if (!mailRes || mailRes.success === false) {
    console.error("createDoctor mail error:", mailRes && mailRes.error);
    return next(new CustomError(500, "Email service error."));
  }

  res.status(201).send({ status: "success", message: `Doctor created & verification email sent to ${email}` });
});

export default createDoctorByHospital;
