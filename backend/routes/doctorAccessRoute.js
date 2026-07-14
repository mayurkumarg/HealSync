import express from "express";
import doctorAuthorize from "../middleware/doctorAuthorize.js";
import getPatientRecords from "../controllers/doctor/getPatientRecords.js";
import requestAccessByDoctor from "../controllers/doctor/requestAccessByDoctor.js";
import updatePatientRecord from "../controllers/doctor/updatePatientRecord.js";

const router = express.Router();

// Get specific patient's records (requires active access)
router.get("/patient/:patientId/records", doctorAuthorize, getPatientRecords);

// Update patient profile or health form (requires edit/full access)
router.patch("/patient/:patientId/update", doctorAuthorize, updatePatientRecord);

// Request access to a patient (sends OTP to patient)
router.post("/request-access", doctorAuthorize, requestAccessByDoctor);

export default router;
