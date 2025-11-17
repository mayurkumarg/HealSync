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

    //^ link for resetting the password
    const resetLink = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${token}`;

    user.token = token;
    user.tokenExpires = tokenExpire;

    await user.save();

    //^ mail the password reset link to the user email address
    const mailerRes = await mailForgotPassword(user.name, resetLink, email);

    if (mailerRes) {
        return next(new CustomError(500, "Our email server is down! Please try again later."));
    }

    //? notify user that the reset password link has been sent
    res.status(200).send({
        status: "success",
        messgae: `An email has been sent to ${email}. Please click the link to reset your password.`
    });

});


export {
    forgotPassword
};
