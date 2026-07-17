import express from "express";
import createUser from "../controllers/authentication/createUser.js";
import verifyEmail from "../controllers/authentication/verifyEmail.js";
import login from "../controllers/authentication/login.js";
import authorize from "../controllers/authorization.js";
import { forgotPassword } from "../controllers/authentication/password.js";
import { passwordResetClient, passwordResetServer } from "../controllers/authentication/resetPassword.js";
import { getMyProfile, updateMyProfile } from "../controllers/authentication/profile.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiters.js";

const userRouter = express.Router();

userRouter.post("/sign-up", authLimiter, createUser);
userRouter.get("/verify/:token", verifyEmail);
userRouter.post("/login", authLimiter, login);
userRouter.post("/forgot-password", passwordResetLimiter, forgotPassword);
userRouter.get("/reset-password/:token", passwordResetClient);
userRouter.post("/reset-password/:token", passwordResetLimiter, passwordResetServer);

userRouter.get("/me", authorize, getMyProfile);
userRouter.patch("/me", authorize, updateMyProfile);

export default userRouter;
