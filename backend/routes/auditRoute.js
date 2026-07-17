import { Router } from "express";
import authorize from "../controllers/authorization.js";
import getMyAuditLog from "../controllers/audit/getMyAuditLog.js";

const router = Router();

router.get("/mine", authorize, getMyAuditLog);

export default router;
