import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import Hospital from "../../models/hospital/hospitalModel.js";

const getHospitalProfile = handelAsyncFunction(async (req, res) => {
  const hospital = await Hospital.findById(req.hospital._id).select("-password -token -tokenExpires");
  res.status(200).send({ status: "success", data: hospital });
});

export { getHospitalProfile };
