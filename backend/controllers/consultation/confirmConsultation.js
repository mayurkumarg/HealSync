import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Consultation from "../../models/consultationModel.js";

/**
 * @route  PATCH /api/consultations/:id/confirm
 * @access Doctor
 */
const confirmConsultation = handelAsyncFunction(async (req, res, next) => {
  const consultation = await Consultation.findOne({ _id: req.params.id, doctorId: req.doctor._id });
  if (!consultation) return next(new CustomError(404, "Consultation not found."));
  if (consultation.status !== "requested") {
    return next(new CustomError(400, `Cannot confirm a consultation with status "${consultation.status}".`));
  }

  consultation.status = "confirmed";
  await consultation.save();

  res.status(200).json({ status: "success", message: "Consultation confirmed.", data: consultation });
});

export default confirmConsultation;
