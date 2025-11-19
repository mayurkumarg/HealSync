// backend/routes/formEntryRoute.js
import express from "express";
import identifyActor from "../middleware/identifyActor.js";

import createFormEntry from "../controllers/formEntry/createFormEntry.js";
import listFormEntries from "../controllers/formEntry/listFormEntries.js";
import getFormEntry from "../controllers/formEntry/getFormEntry.js";
import updateFormEntry from "../controllers/formEntry/updateFormEntry.js";
import deleteFormEntry from "../controllers/formEntry/deleteFormEntry.js";

const router = express.Router();

// All endpoints require authentication (User or Doctor) via identifyActor
router.post("/create", identifyActor, createFormEntry);
router.get("/list/:patientId", identifyActor, listFormEntries);
router.get("/:id", identifyActor, getFormEntry);
router.put("/:id", identifyActor, updateFormEntry);
router.delete("/:id", identifyActor, deleteFormEntry);

export default router;
