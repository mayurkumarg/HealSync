// backend/routes/accessRoute.js
import express from "express";
import identifyActor from "../middleware/identifyActor.js";
import generateAccessToken from "../controllers/access/generateAccessToken.js";
import claimAccess from "../controllers/access/claimAccess.js";
import requestAccess from "../controllers/access/requestAccess.js";
import approveRequest from "../controllers/access/approveRequest.js";
import listAccesses from "../controllers/access/listAccesses.js";
import revokeAccess from "../controllers/access/revokeAccess.js";
import revokeToken from "../controllers/access/revokeToken.js";
import scanWeb from "../controllers/access/scanWeb.js";
import getActivityLogs from "../controllers/access/getActivityLogs.js";
import approveDoctorRequest from "../controllers/access/approveDoctorRequest.js";
import grantAccessByPhone from "../controllers/access/grantAccessByPhone.js";
import getPendingRequests from "../controllers/access/getPendingRequests.js";

const router = express.Router();

// Patient creates short code/QR (QR contains clickable URL to /api/access/scan?token=...)
router.post("/generate", identifyActor, generateAccessToken);

// Patient grants access to doctor using doctor's phone number
router.post("/grant-by-phone", identifyActor, grantAccessByPhone);

// Doctor claims by scanning QR or entering short code (API claim - for app)
router.post("/claim", identifyActor, claimAccess);

// Doctor requests access (not scanning QR)
router.post("/request", identifyActor, requestAccess);

// Patient approves doctor request (via OTP or auth)
router.post("/approve", identifyActor, approveRequest);

// List accesses (patient or doctor)
router.get("/list", identifyActor, listAccesses);

// Patient revoke active PatientAccess
router.post("/revoke", identifyActor, revokeAccess);

// Patient revoke a generated token before it is scanned
router.post("/revoke-token", identifyActor, revokeToken);

// Patient views activity logs (what doctors accessed)
router.get("/activity-logs", identifyActor, getActivityLogs);

// Patient gets pending access requests (waiting for OTP approval)
router.get("/pending-requests", identifyActor, getPendingRequests);

// Patient approves doctor's access request with OTP
router.post("/approve-doctor-request", identifyActor, approveDoctorRequest);

// Public scan endpoint - this is the clickable link encoded in the QR.
// No auth required (by design) — but token must be valid. This renders a one-time HTML quick-view.
router.get("/scan", scanWeb);

export default router;
