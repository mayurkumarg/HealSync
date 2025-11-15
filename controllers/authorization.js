import CustomError from "../utils/customError.js";
import { verifyJwt } from "../service/JWT.js";
import Pharmacy from "../models/medical/pharmacy.js";
import handelAsyncFunction from "../utils/asyncFunctionHandler.js";

function getError() {
    return new CustomError(401, "Unauthorized to access this route.");
}

const pharmacyAuthorize = handelAsyncFunction(async (req, res, next) => {

    //~ Step 1: extract the authorization header
    const { authorization } = req.headers;

    //^ Step 2: header missing → unauthorized
    if (!authorization)
        return next(getError());

    //~ Extract token: "Bearer tokenHere"
    const token = authorization.split(" ")[1];

    //^ Step 3: token missing → unauthorized
    if (!token)
        return next(getError());

    //~ Step 4: verify JWT signature and integrity
    const decoded = verifyJwt(token); 
    // { id, iat, exp }

    //~ Step 5: ensure pharmacy exists in DB
    const pharmacy = await Pharmacy.findById(decoded.id);

    if (!pharmacy) {
        return next(new CustomError(401, "Pharmacy no longer exists."));
    }

    //~ Step 6: ensure email is verified
    if (!pharmacy.verified) {
        return next(new CustomError(403, "Please verify your pharmacy email first."));
    }

    //~ Step 7: ensure token is not older than password change
    if (pharmacy.passwordChangedAt) {
        const changedTimestamp = Math.floor(pharmacy.passwordChangedAt.getTime() / 1000);

        if (decoded.iat < changedTimestamp) {
            return next(new CustomError(401, "Password changed recently. Please log in again."));
        }
    }

    //~ Step 8: attach pharmacy data to request
    req.user = pharmacy;

    //~ Continue
    next();
});

export default pharmacyAuthorize;
