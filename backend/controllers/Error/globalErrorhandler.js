import developmentError from "./developmentError.js"

// Translate Mongoose's own error types into clean, consistent CustomError-shaped responses instead
// of letting them fall through as raw 500s with internal Mongoose messages.
const handleCastErrorDB = (err) =>
    Object.assign(new Error(`Invalid ${err.path}: ${err.value}.`), { statusCode: 400, status: "fail" });

const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    return Object.assign(new Error(`${field} '${value}' is already in use.`), { statusCode: 409, status: "fail" });
};

const handleValidationErrorDB = (err) => {
    const messages = Object.values(err.errors).map((e) => e.message);
    return Object.assign(new Error(`Invalid input: ${messages.join(". ")}`), { statusCode: 400, status: "fail" });
};

const globalErrorHandler = (error, req, res, next) => {

    let err = error;
    if (err.name === "CastError") err = handleCastErrorDB(err);
    else if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    else if (err.name === "ValidationError") err = handleValidationErrorDB(err);

    //^if the error caused is not by the mistake of user its internal server error
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    //~ sending the different format for application in the prodution and one in development
    if( process.env.NODE_ENV === "development"){

        developmentError(err,res);
        return;
    }

    // Production error response
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
}


export default globalErrorHandler;