import { Router } from "express";
import authorize from "../controllers/authorization.js";
import doctorAuthorize from "../middleware/doctorAuthorize.js";
import identifyActor from "../middleware/identifyActor.js";

import listDoctors from "../controllers/consultation/listDoctors.js";
import getDoctorSlots from "../controllers/consultation/getDoctorSlots.js";
import bookConsultation from "../controllers/consultation/bookConsultation.js";
import listMyConsultations from "../controllers/consultation/listMyConsultations.js";
import listDoctorConsultations from "../controllers/consultation/listDoctorConsultations.js";
import confirmConsultation from "../controllers/consultation/confirmConsultation.js";
import completeConsultation from "../controllers/consultation/completeConsultation.js";
import cancelConsultation from "../controllers/consultation/cancelConsultation.js";
import updateConsultationSettings from "../controllers/consultation/updateConsultationSettings.js";

const router = Router();

// ---- Patient: discovery + booking ----
router.get("/doctors", authorize, listDoctors);
router.get("/doctors/:doctorId/slots", authorize, getDoctorSlots);
router.post("/", authorize, bookConsultation);
router.get("/mine", authorize, listMyConsultations);

// ---- Doctor: settings + workflow ----
router.patch("/doctor/settings", doctorAuthorize, updateConsultationSettings);
router.get("/doctor/list", doctorAuthorize, listDoctorConsultations);
router.patch("/:id/confirm", doctorAuthorize, confirmConsultation);
router.patch("/:id/complete", doctorAuthorize, completeConsultation);

// ---- Shared: either party can cancel ----
router.patch("/:id/cancel", identifyActor, cancelConsultation);

export default router;
