import { createLoginController } from "../../middleware/authControllerFactory.js";
import Pharmacy from "../../models/medical/pharmacy.js";

const loginPharmacy = createLoginController({
  Model: Pharmacy,
  notRegisteredMessage: (email) =>
    `No verified pharmacy is registered with email ${email}. Please register or verify your account.`,
  extraJwtClaims: (doc) => ({ name: doc.name, type: "pharmacy" }),
  successMessage: (doc) => `Login successful for pharmacy "${doc.name}".`,
});

export default loginPharmacy;
