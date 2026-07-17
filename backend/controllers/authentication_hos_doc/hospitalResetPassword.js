import { createResetPasswordController } from "../../middleware/authControllerFactory.js";
import Hospital from "../../models/hospital/hospitalModel.js";

const hospitalResetPassword = createResetPasswordController({ Model: Hospital });

export default hospitalResetPassword;
