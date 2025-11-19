// backend/routes/documentRoute.js
import express from "express";
import { getAllDocuments, getDocumentById, deleteDocument } from "../controllers/documentController.js";

const router = express.Router();

router.get("/", getAllDocuments);
router.get("/:id", getDocumentById);
router.delete("/:id", deleteDocument);

export default router;
