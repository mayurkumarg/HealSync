// backend/routes/chatRoute.js
import express from "express";
import { handleChat } from "../controllers/chatController.js";
import authorize from "../controllers/authorization.js";
import { chatLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/", authorize, chatLimiter, handleChat);

export default router;
