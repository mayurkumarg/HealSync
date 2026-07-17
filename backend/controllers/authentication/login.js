import { createLoginController } from "../../middleware/authControllerFactory.js";
import userModel from "../../models/userModel.js";

const login = createLoginController({
  Model: userModel,
  notRegisteredMessage: (email) =>
    `No user is registered with e-mail ${email}. Please create the account.`,
  extraJwtClaims: (doc) => ({ username: doc.username }),
  successMessage: (doc) => `Login to account ${doc.username} is successful.`,
});

export default login;
