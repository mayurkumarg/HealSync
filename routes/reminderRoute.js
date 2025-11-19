import express from "express";
import {
  createReminder,
  getUserReminders,
  getUpcomingReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  markReminderCompleted,
  dismissReminder,
  getReminderStats,
} from "../controllers/reminder/reminderController.js";
import authorize from "../controllers/authorization.js";

const router = express.Router();

// Protect all routes with authentication
router.use(authorize);

// Create a new reminder
router.post("/", createReminder);

// Get all reminders for the authenticated user
router.get("/", getUserReminders);

// Get upcoming reminders
router.get("/upcoming", getUpcomingReminders);

// Get reminder statistics
router.get("/stats", getReminderStats);

// Get reminder by ID
router.get("/:reminderId", getReminderById);

// Update a reminder
router.put("/:reminderId", updateReminder);

// Delete a reminder
router.delete("/:reminderId", deleteReminder);

// Mark reminder as completed
router.patch("/:reminderId/complete", markReminderCompleted);

// Dismiss a reminder
router.patch("/:reminderId/dismiss", dismissReminder);

export default router;
