import Reminder from "../../models/medical/reminder.js";
import asyncFunctionHandler from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import mongoose from "mongoose";

// Create a new reminder
export const createReminder = asyncFunctionHandler(async (req, res, next) => {
  const userId = req.user._id;
  const {
    title,
    description,
    reminderType,
    reminderDateTime,
    notificationTime,
    customNotificationMinutes,
    notificationChannels,
    recurringPattern,
    relatedItems,
    notes,
    priority,
    location,
  } = req.body;

  // Validation
  if (!title || !reminderDateTime || !reminderType) {
    return next(new CustomError(400, "Please provide title, reminderDateTime, and reminderType"));
  }

  // Check if reminder date is in the future
  if (new Date(reminderDateTime) < new Date()) {
    return next(new CustomError(400, "Reminder date must be in the future"));
  }

  const reminder = new Reminder({
    userId,
    title,
    description,
    reminderType,
    reminderDateTime,
    notificationTime: notificationTime || "15-minutes-before",
    customNotificationMinutes,
    notificationChannels: notificationChannels || {
      email: true,
      sms: false,
      pushNotification: true,
      inApp: true,
    },
    recurringPattern,
    relatedItems,
    notes,
    priority: priority || "medium",
    location,
  });

  await reminder.save();

  res.status(201).json({
    success: true,
    message: "Reminder created successfully",
    data: reminder,
  });
});

// Get all reminders for a user
export const getUserReminders = asyncFunctionHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { status, reminderType, sortBy = "reminderDateTime" } = req.query;

  let query = { userId };

  if (status) {
    query.status = status;
  }

  if (reminderType) {
    query.reminderType = reminderType;
  }

  const reminders = await Reminder.find(query)
    .sort({ [sortBy]: 1 })
    .lean();

  res.status(200).json({
    success: true,
    count: reminders.length,
    data: reminders,
  });
});

// Get upcoming reminders (next 7 days)
export const getUpcomingReminders = asyncFunctionHandler(async (req, res, next) => {
  const userId = req.user._id;
  const days = req.query.days || 7;

  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const reminders = await Reminder.find({
    userId,
    reminderDateTime: {
      $gte: now,
      $lte: futureDate,
    },
    status: { $in: ["pending", "sent"] },
  })
    .sort({ reminderDateTime: 1 })
    .lean();

  res.status(200).json({
    success: true,
    count: reminders.length,
    data: reminders,
  });
});

// Get reminder by ID
export const getReminderById = asyncFunctionHandler(async (req, res, next) => {
  const { reminderId } = req.params;
  const userId = req.user._id;

  const reminder = await Reminder.findOne({
    _id: reminderId,
    userId,
  });

  if (!reminder) {
    return next(new CustomError(404, "Reminder not found"));
  }

  res.status(200).json({
    success: true,
    data: reminder,
  });
});

// Update a reminder
export const updateReminder = asyncFunctionHandler(async (req, res, next) => {
  const { reminderId } = req.params;
  const userId = req.user._id;
  const updateData = req.body;

  // Don't allow updating userId
  delete updateData.userId;

  // Validate reminderDateTime if being updated
  if (updateData.reminderDateTime && new Date(updateData.reminderDateTime) < new Date()) {
    return next(new CustomError(400, "Reminder date must be in the future"));
  }

  const reminder = await Reminder.findOneAndUpdate(
    { _id: reminderId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!reminder) {
    return next(new CustomError(404, "Reminder not found"));
  }

  res.status(200).json({
    success: true,
    message: "Reminder updated successfully",
    data: reminder,
  });
});

// Delete a reminder
export const deleteReminder = asyncFunctionHandler(async (req, res, next) => {
  const { reminderId } = req.params;
  const userId = req.user._id;

  const reminder = await Reminder.findOneAndDelete({
    _id: reminderId,
    userId,
  });

  if (!reminder) {
    return next(new CustomError(404, "Reminder not found"));
  }

  res.status(200).json({
    success: true,
    message: "Reminder deleted successfully",
  });
});

// Mark reminder as completed
export const markReminderCompleted = asyncFunctionHandler(async (req, res, next) => {
  const { reminderId } = req.params;
  const userId = req.user._id;

  const reminder = await Reminder.findOneAndUpdate(
    { _id: reminderId, userId },
    { status: "completed" },
    { new: true }
  );

  if (!reminder) {
    return next(new CustomError(404, "Reminder not found"));
  }

  res.status(200).json({
    success: true,
    message: "Reminder marked as completed",
    data: reminder,
  });
});

// Dismiss a reminder
export const dismissReminder = asyncFunctionHandler(async (req, res, next) => {
  const { reminderId } = req.params;
  const userId = req.user._id;

  const reminder = await Reminder.findOneAndUpdate(
    { _id: reminderId, userId },
    { status: "dismissed" },
    { new: true }
  );

  if (!reminder) {
    return next(new CustomError(404, "Reminder not found"));
  }

  res.status(200).json({
    success: true,
    message: "Reminder dismissed",
    data: reminder,
  });
});

// Get reminder statistics for user
export const getReminderStats = asyncFunctionHandler(async (req, res, next) => {
  const userId = req.user._id;

  const stats = await Reminder.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const typeStats = await Reminder.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$reminderType",
        count: { $sum: 1 },
      },
    },
  ]);

  // Transform stats into expected format
  const statusMap = {
    total: 0,
    pending: 0,
    completed: 0,
    dismissed: 0
  };

  // Count total and group by status
  stats.forEach(stat => {
    statusMap.total += stat.count;
    if (stat._id === 'pending') statusMap.pending = stat.count;
    if (stat._id === 'completed') statusMap.completed = stat.count;
    if (stat._id === 'dismissed') statusMap.dismissed = stat.count;
  });

  res.status(200).json({
    success: true,
    data: statusMap,
    statusStats: stats,
    typeStats: typeStats,
  });
});
