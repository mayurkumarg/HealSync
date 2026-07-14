import Doctor from "../../models/hospital/doctorModel.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";

const verifyDoctorEmail = handelAsyncFunction(async (req, res, next) => {
  const { token } = req.params;
  const doc = await Doctor.findOne({ token, tokenExpires: { $gt: Date.now() } });

  if (!doc) return res.status(400).send({ status: "failed", message: "Invalid or expired link." });
  if (doc.verified) return res.status(400).send({ status: "failed", message: "Already verified." });

  doc.verified = true;
  doc.token = null;
  doc.tokenExpires = null;
  await doc.save();

  res.status(200).send({ status: "success", message: "Doctor verified successfully." });
});

export default verifyDoctorEmail;
