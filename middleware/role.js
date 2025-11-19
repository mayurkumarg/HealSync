import CustomError from "../utils/customError.js";

export const allowRoles = (...allowed) => {
  return (req, res, next) => {
    const role = req.userRole || req.hospitalRole || req.doctorRole || req.type;

    if (!allowed.includes(role)) {
      return next(new CustomError(403, "Access denied. Not authorized."));
    }

    next();
  };
};
