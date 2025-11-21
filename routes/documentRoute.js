// backend/routes/documentRoute.js
import express from "express";
import { getAllDocuments, getDocumentById, deleteDocument } from "../controllers/documentController.js";
import authorize from "../controllers/authorization.js";

const router = express.Router();

router.get("/", authorize, getAllDocuments);
router.get("/:id", authorize, getDocumentById);
router.delete("/:id", authorize, deleteDocument);

export default router;
