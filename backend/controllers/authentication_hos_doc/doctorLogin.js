import { createLoginController } from "../../middleware/authControllerFactory.js";
import Doctor from "../../models/hospital/doctorModel.js";

const doctorLogin = createLoginController({
  Model: Doctor,
  notRegisteredMessage: () => "Doctor not registered/verified.",
  extraJwtClaims: () => ({ type: "doctor" }),
  successMessage: () => "Doctor login successful.",
});

export default doctorLogin;
