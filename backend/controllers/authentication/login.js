import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import userModel from "../../models/userModel.js";
import { getJWT } from "../../service/JWT.js";

const login = handelAsyncFunction(async (req, res, next) => {

    //~ I need to go through the series of checks to allow user to login
    
    //^ step 1: verify that user has sent the email and password
    const { email, password } = req.body;

    if (!email || !password)
        return next(new CustomError(400, "Email and password are the required fields to login."));

    //^ step 2: verify user exists and verified their email address
    const user = await userModel.findOne({ email }).select("+password");

    if (!user || !user.verified) {
        return next(
            new CustomError(
                401,
                `No user is registered with e-mail ${email}. Please create the account.`
            )
        );
    }

    //^ step 3: compare the sent password with the hashed password in the database
    const result = await user.comparePassword(password, user.password);

    if (!result)
        return next(new CustomError(401, "Invalid password!."));

    //^ step 4: now we assign the token to the user 
    const JWT = getJWT({
        id: user._id,
        email: user.email,
        username: user.username
    });

    //^ send response with status code and JWT
    res.status(200).send({
        status: "success",
        message: `Login to account ${user.username} is successful.`,
        token: JWT
    });

});

export default login;
