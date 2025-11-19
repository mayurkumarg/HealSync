// backend/routes/formEntryRoute.js
import express from "express";
import { createFormEntry } from "../controllers/formEntryController.js";

const router = express.Router();

router.post("/", createFormEntry);

export default router;
