import jwt from "jsonwebtoken";
import CustomError from "../../utils/customError.js";
import Pharmacy from "../..//models/medical/pharmacy.js";
import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";

const pharmacyAuth = handelAsyncFunction(async (req, res, next) => {
  let token;

  // Authorization Header → Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token found
  if (!token) {
    return next(new CustomError(401, "You are not logged in!"));
  }

  // Verify JWT
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.SECRECT_CODE);
  } catch (err) {
    return next(new CustomError(401, "Invalid or expired token."));
  }

  // Find pharmacy from DB
  const pharmacy = await Pharmacy.findById(decoded.id);

  if (!pharmacy) {
    return next(
      new CustomError(401, "The pharmacy belonging to this token no longer exists.")
    );
  }

  // Check if email is verified
  if (!pharmacy.verified) {
    return next(new CustomError(403, "Please verify your email first."));
  }

  // Attach pharmacy info to request
  req.user = {
    id: pharmacy._id,
    email: pharmacy.email,
    role: "pharmacy",
    name: pharmacy.name
  };

  next();
});

export default pharmacyAuth;
