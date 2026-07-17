import handelAsyncFunction from "../utils/asyncFunctionHandler.js";
import CustomError from "../utils/customError.js";
import { getJWT } from "../service/JWT.js";

/**
 * Builds a login controller for a single identity (patient/doctor/hospital/pharmacy). Consolidates
 * what used to be four near-identical email+password-check-then-JWT controllers
 * (authentication/login.js, authentication_hos_doc/doctorLogin.js, loginHospital.js,
 * pharmacy/loginPharmacy.js) — mirrors the shape of createAuthMiddleware() in authFactory.js.
 *
 * @param {Object} opts
 * @param {import('mongoose').Model} opts.Model - the Mongoose model to look the identity up in
 * @param {(email: string) => string} opts.notRegisteredMessage - error text when no verified account matches
 * @param {(doc: any) => Object} [opts.extraJwtClaims] - additional fields merged into the JWT payload
 * @param {(doc: any) => string} [opts.successMessage] - success response message
 */
export function createLoginController({
  Model,
  notRegisteredMessage,
  extraJwtClaims = () => ({}),
  successMessage = () => "Login successful.",
}) {
  return handelAsyncFunction(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new CustomError(400, "Email and password are required fields to login."));
    }

    const doc = await Model.findOne({ email }).select("+password");
    if (!doc || !doc.verified) {
      return next(new CustomError(401, notRegisteredMessage(email)));
    }

    const ok = await doc.comparePassword(password);
    if (!ok) {
      return next(new CustomError(401, "Invalid password."));
    }

    const token = getJWT({ id: doc._id, email: doc.email, ...extraJwtClaims(doc) });

    res.status(200).send({ status: "success", message: successMessage(doc), token });
  });
}

/**
 * Builds a reset-password controller for a single identity — consolidates what used to be
 * near-identical token-lookup-then-set-password controllers (doctorResetPassword.js,
 * hospitalResetPassword.js). Patient and pharmacy reset-password controllers have their own extra
 * behavior (serving a legacy HTML form) and aren't migrated onto this — only the two that were
 * genuinely identical.
 *
 * @param {Object} opts
 * @param {import('mongoose').Model} opts.Model - the Mongoose model to look the identity up in
 */
export function createResetPasswordController({ Model }) {
  return handelAsyncFunction(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return next(new CustomError(400, "Password is required"));

    const doc = await Model.findOne({
      token,
      tokenExpires: { $gt: Date.now() },
    }).select("+password");

    if (!doc) return next(new CustomError(400, "Invalid or expired reset token."));

    doc.password = password;
    doc.token = null;
    doc.tokenExpires = null;
    await doc.save();

    res.status(200).send({ status: "success", message: "Password reset successful" });
  });
}
