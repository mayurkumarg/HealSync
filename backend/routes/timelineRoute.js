import { Router } from "express";
import authorize from "../controllers/authorization.js";
import getTimeline from "../controllers/timeline/getTimeline.js";

const router = Router();

router.get("/mine", authorize, getTimeline);

export default router;
