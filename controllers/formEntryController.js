// backend/controllers/formEntryController.js
import { FormEntry } from "../models/models.js";

export const createFormEntry = async (req, res) => {
  try {
    const { patientId, createdBy, category, data, description } = req.body;
    if (!patientId || !createdBy || !category || !data) return res.status(400).json({ ok: false, error: "Missing fields" });

    const entry = await FormEntry.create({
      patientId,
      createdBy,
      category,
      data,
      description,
      createdAt: new Date(),
    });

    return res.status(201).json({ ok: true, entry });
  } catch (err) {
    console.error("Form entry error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
