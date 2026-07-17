import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import userModel from "../../models/userModel.js";
import generateToken from "../../service/token.js";
import { mailForgotPassword } from "../../service/email.js";


const forgotPassword = handelAsyncFunction(async (req, res, next) => {

    //~ forgot password
    
    //^ extract the field from the body
    const { email } = req.body;

    //^ raise error if user not specified the email
    if (!email)
        return next(new CustomError(400, "Email is required field."));

    //^ check for the user in the database
    const user = await userModel.findOne({ email });

    //^ if no user exists or account is not verified raise the error
    if (!user || !user.verified)
        return next(new CustomError(400, `No user exists with email ${email}. Please try again.`));

    //^ if exists generate the token and mail the token to the specified email address
    const token = generateToken();
    const tokenExpire = Date.now() + 10 * 60 * 1000;

    //^ link for resetting the password — points at the frontend's ResetPassword page
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}?role=patient`;

    user.token = token;
    user.tokenExpires = tokenExpire;

    await user.save();

    //^ mail the password reset link to the user email address — fire-and-forget, must not block
    mailForgotPassword(user.name, resetLink, email)
        .then((mailRes) => {
            if (!mailRes?.success) console.error("forgotPassword mail error:", mailRes?.error);
        })
        .catch((err) => console.error("forgotPassword mail error:", err.message));

    //? notify user that the reset password link has been sent
    res.status(200).send({
        status: "success",
        messgae: `An email has been sent to ${email}. Please click the link to reset your password.`
    });

});


export {
    forgotPassword
};
