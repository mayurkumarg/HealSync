// backend/routes/chatRoute.js
import express from "express";
import { handleChat } from "../controllers/chatController.js";
import authorize from "../controllers/authorization.js";

const router = express.Router();

router.post("/", authorize, handleChat);

export default router;
