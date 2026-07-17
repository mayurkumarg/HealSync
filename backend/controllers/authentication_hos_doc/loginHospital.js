import { createLoginController } from "../../middleware/authControllerFactory.js";
import Hospital from "../../models/hospital/hospitalModel.js";

const loginHospital = createLoginController({
  Model: Hospital,
  notRegisteredMessage: (email) => `Hospital with email ${email} not registered/verified.`,
  extraJwtClaims: () => ({ type: "hospital" }),
  successMessage: () => "Hospital login successful.",
});

export default loginHospital;
