import { verifyJwt } from "../service/JWT.js";
import handelAsyncFunction from "../utils/asyncFunctionHandler.js";
import CustomError from "../utils/customError.js";

/**
 * Extracts and verifies the Bearer JWT from a request. Shared by createAuthMiddleware() and by
 * multi-model middleware (e.g. identifyActor) that can't use the single-model factory below.
 * Throws CustomError on any failure — callers running inside handelAsyncFunction don't need try/catch.
 */
export function verifyBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new CustomError(401, "You are not logged in.");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new CustomError(401, "You are not logged in.");
  }

  let decoded;
  try {
    decoded = verifyJwt(token);
  } catch (err) {
    throw new CustomError(401, "Invalid or expired token.");
  }

  const id = decoded?.id || decoded?._id || decoded?.userId || decoded?.sub;
  if (!id) {
    throw new CustomError(401, "Invalid token.");
  }

  return { decoded, id };
}

/**
 * Builds a single-identity auth middleware (patient/doctor/hospital/pharmacy). Consolidates what
 * used to be near-duplicate JWT-verify-then-load-model logic in controllers/authorization.js,
 * middleware/doctorAuthorize.js, middleware/hospitalAuthorize.js, and
 * controllers/pharmacy/pharmacyAuthorizer.js.
 *
 * @param {Object} opts
 * @param {import('mongoose').Model} opts.Model - the Mongoose model to load the identity from
 * @param {string} opts.reqKey - property to attach the loaded doc to on `req` (e.g. "user", "doctor")
 * @param {string} opts.role - human-readable role name, used in error messages and set as `req.role`
 * @param {string} [opts.selectFields] - optional `.select()` string for the lookup query
 * @param {boolean} [opts.requireVerified] - if true, 403s when `doc.verified` is falsy
 */
export function createAuthMiddleware({ Model, reqKey, role, selectFields = "", requireVerified = false }) {
  return handelAsyncFunction(async (req, res, next) => {
    const { decoded, id } = verifyBearerToken(req);

    const doc = await Model.findById(id).select(selectFields);
    if (!doc) {
      return next(new CustomError(401, `${role.charAt(0).toUpperCase() + role.slice(1)} no longer exists.`));
    }

    if (requireVerified && !doc.verified) {
      return next(new CustomError(403, "Please verify your email first."));
    }

    if (doc.passwordChangedAt) {
      const changedTimestamp = Math.floor(doc.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        return next(new CustomError(401, "Password changed. Please log in again."));
      }
    }

    req[reqKey] = doc;
    req.role = role;
    next();
  });
}
