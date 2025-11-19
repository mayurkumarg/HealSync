import cron from "node-cron";
import Reminder from "../models/medical/reminder.js";
import { sendReminderNotification } from "./socket.js";
import { sendReminderEmail } from "./email.js";
import User from "../models/userModel.js";

let scheduledJobs = new Map();

export const initializeScheduler = () => {
  console.log("Initializing Reminder Scheduler...");

  // Test: Run immediately once
  setTimeout(() => {
    console.log("[TEST] Running manual check...");
    checkAndSendReminders();
  }, 1000);

  // Run every 30 seconds using setInterval instead of cron
  setInterval(async () => {
    try {
      console.log("[SCHEDULER] Running scheduler check...");
      await checkAndSendReminders();
    } catch (error) {
      console.error("Error in reminder scheduler:", error);
    }
  }, 30000); // Every 30 seconds for testing

  console.log("✓ Reminder Scheduler initialized successfully (30-second interval)");
};

// Check and send reminders
export const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    console.log(`[Scheduler] Checking reminders... Now: ${now.toISOString()}`);

    // Find all pending reminders that are:
    // 1. Due within the next 5 minutes, OR
    // 2. Already past due (within last 5 minutes) and not yet sent
    const reminders = await Reminder.find({
      reminderDateTime: {
        $gte: fiveMinutesAgo,
        $lte: fiveMinutesLater,
      },
      status: "pending",
    }).populate("userId", "email firstName lastName");

    console.log(`[Scheduler] Found ${reminders.length} reminders to process`);

    for (const reminder of reminders) {
      const storedTime = new Date(reminder.reminderDateTime);
      console.log(
        `[Scheduler] Processing: ${reminder.title}, Stored UTC: ${reminder.reminderDateTime}, Current: ${now.toISOString()}`
      );

      // Check if current time has passed or reached the reminder time
      const timeDiff = now.getTime() - storedTime.getTime();
      if (timeDiff >= 0) {
        // Reminder is due or overdue - check notification preferences
        const notificationTime = calculateNotificationTime(reminder);

        if (shouldSendNotification(reminder, notificationTime)) {
          console.log(
            `[Scheduler] Sending reminder: ${reminder.title} (${timeDiff}ms past due)`
          );
          await sendReminder(reminder);
        } else {
          console.log(
            `[Scheduler] Notification time not reached for: ${reminder.title}. Current: ${now.toISOString()}, Notification time: ${notificationTime.toISOString()}`
          );
        }
      } else {
        console.log(
          `[Scheduler] Reminder not ready yet (${Math.abs(timeDiff)}ms until due)`
        );
      }
    }
  } catch (error) {
    console.error("Error in checkAndSendReminders:", error);
  }
};

// Calculate when notification should be sent
const calculateNotificationTime = (reminder) => {
  const reminderTime = new Date(reminder.reminderDateTime);
  let notificationMinutes = 0;

  switch (reminder.notificationTime) {
    case "on-time":
      notificationMinutes = 0;
      break;
    case "15-minutes-before":
      notificationMinutes = 15;
      break;
    case "1-hour-before":
      notificationMinutes = 60;
      break;
    case "1-day-before":
      notificationMinutes = 24 * 60;
      break;
    case "custom":
      notificationMinutes = reminder.customNotificationMinutes || 15;
      break;
    default:
      notificationMinutes = 15;
  }

  return new Date(reminderTime.getTime() - notificationMinutes * 60 * 1000);
};

// Check if notification should be sent
const shouldSendNotification = (reminder, notificationTime) => {
  const now = new Date();
  const timeDiff = now.getTime() - notificationTime.getTime();

  // Send notification if we're within 1 minute of the scheduled time
  return timeDiff >= 0 && timeDiff <= 60000;
};

// Send reminder through all enabled channels
export const sendReminder = async (reminder) => {
  try {
    console.log(`Sending reminder: ${reminder._id} to user: ${reminder.userId}`);

    const notificationRecord = {
      sentAt: new Date(),
      status: "sent",
    };

    // Send via Socket.IO (Real-time notification)
    if (reminder.notificationChannels.inApp) {
      notificationRecord.channel = "in-app";
      sendReminderNotification(reminder.userId._id.toString(), reminder);
    }

    // Send via Email
    if (reminder.notificationChannels.email && reminder.userId.email) {
      notificationRecord.channel = "email";
      try {
        await sendReminderEmail(reminder);
        console.log(`Email sent to ${reminder.userId.email}`);
      } catch (emailError) {
        console.error(`Failed to send email:`, emailError);
      }
    }

    // Update reminder status and add notification record
    reminder.sentNotifications.push(notificationRecord);
    reminder.status = "sent";
    await reminder.save();

    console.log(`Reminder ${reminder._id} processed successfully`);
  } catch (error) {
    console.error(`Error sending reminder ${reminder._id}:`, error);
  }
};

// Clean up expired reminders (older than 30 days and completed)
export const cleanupExpiredReminders = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await Reminder.deleteMany({
      $or: [
        {
          status: "completed",
          updatedAt: { $lt: thirtyDaysAgo },
        },
        {
          status: "dismissed",
          updatedAt: { $lt: thirtyDaysAgo },
        },
      ],
    });

    console.log(`Cleaned up ${result.deletedCount} expired reminders`);
  } catch (error) {
    console.error("Error cleaning up expired reminders:", error);
  }
};

// Process recurring reminders
export const processRecurringReminders = async () => {
  try {
    const recurringReminders = await Reminder.find({
      "recurringPattern.isRecurring": true,
      status: "completed",
    });

    console.log(`Processing ${recurringReminders.length} recurring reminders`);

    for (const reminder of recurringReminders) {
      // Check if recurring pattern has not ended
      if (
        !reminder.recurringPattern.endDate ||
        new Date(reminder.recurringPattern.endDate) > new Date()
      ) {
        const nextReminderDate = calculateNextRecurrenceDate(reminder);

        if (nextReminderDate) {
          // Create a new reminder instance
          const newReminder = new Reminder({
            userId: reminder.userId,
            title: reminder.title,
            description: reminder.description,
            reminderType: reminder.reminderType,
            reminderDateTime: nextReminderDate,
            notificationTime: reminder.notificationTime,
            customNotificationMinutes: reminder.customNotificationMinutes,
            notificationChannels: reminder.notificationChannels,
            recurringPattern: reminder.recurringPattern,
            relatedItems: reminder.relatedItems,
            notes: reminder.notes,
            priority: reminder.priority,
            location: reminder.location,
          });

          await newReminder.save();
          console.log(`Created new recurring reminder for ${nextReminderDate}`);
        }
      }
    }
  } catch (error) {
    console.error("Error processing recurring reminders:", error);
  }
};

// Calculate next recurrence date
const calculateNextRecurrenceDate = (reminder) => {
  const lastDate = new Date(reminder.reminderDateTime);
  const { frequency, endDate, daysOfWeek } = reminder.recurringPattern;
  let nextDate = new Date(lastDate);

  switch (frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "bi-weekly":
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  // Check if next date exceeds end date
  if (endDate && nextDate > new Date(endDate)) {
    return null;
  }

  return nextDate;
};

// Stop all scheduled jobs
export const stopScheduler = () => {
  for (const [jobName, job] of scheduledJobs.entries()) {
    job.stop();
    console.log(`Stopped scheduled job: ${jobName}`);
  }
  scheduledJobs.clear();
};

// Get scheduler status
export const getSchedulerStatus = () => {
  return {
    isRunning: scheduledJobs.size > 0,
    activeJobs: Array.from(scheduledJobs.keys()),
    jobCount: scheduledJobs.size,
  };
};
