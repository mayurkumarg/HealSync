import { createResetPasswordController } from "../../middleware/authControllerFactory.js";
import Doctor from "../../models/hospital/doctorModel.js";

const doctorResetPassword = createResetPasswordController({ Model: Doctor });

export default doctorResetPassword;
