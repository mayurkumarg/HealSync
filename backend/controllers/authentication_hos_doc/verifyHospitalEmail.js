import Hospital from "../../models/hospital/hospitalModel.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";

const verifyHospitalEmail = handelAsyncFunction(async (req, res, next) => {
  const { token } = req.params;
  const hospital = await Hospital.findOne({
    token,
    tokenExpires: { $gt: Date.now() }
  });

  if (!hospital) return res.status(400).send({ status: "failed", message: "Link expired or invalid." });
  if (hospital.verified) return res.status(400).send({ status: "failed", message: "Already verified." });

  hospital.verified = true;
  hospital.token = null;
  hospital.tokenExpires = null;
  await hospital.save();

  res.status(200).send({ status: "success", message: "Hospital email verified successfully." });
});

export default verifyHospitalEmail;
