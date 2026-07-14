import cron from "node-cron";
import bpTracking from "../../models/bp.js";
import sugarTracking from "../../models/sugar.js";
import {sendDrugRefillReminderEmail} from "../../service/email.js";

/**
 * Reminder Job
 * schedule: "M" | "A" | "E"
 */
export const reminderJob = async (schedule) => {
  try {
    // Fetch all BP + Sugar tracking documents
    const [bpDocs, sugarDocs] = await Promise.all([
      bpTracking.find({}).populate("userId").exec(),
      sugarTracking.find({}).populate("userId").exec(),
    ]);

    // Merge both lists
    const entries = [
      ...bpDocs.map((doc) => ({ type: "bp", doc })),
      ...sugarDocs.map((doc) => ({ type: "sugar", doc })),
    ];

    // Tablets per day → which reminders apply
    const getActiveSlots = (perDay) => {
      if (!perDay || perDay <= 0) return [];
      if (perDay === 1) return ["M"];
      if (perDay === 2) return ["M", "E"];
      return ["M", "A", "E"]; // default 3/day
    };

    // Process each document
    for (const item of entries) {
      const doc = item.doc;

      const { tabletsPerDay, stockAvailable } = doc;
      let todaysIntake = typeof doc.todaysIntake === "number" ? doc.todaysIntake : 0;

      if (!tabletsPerDay || stockAvailable == null) continue;

      const activeSlots = getActiveSlots(tabletsPerDay);
      if (!activeSlots.includes(schedule)) continue;

      if (todaysIntake >= tabletsPerDay) continue; // prevent overdose

      // Deduct stock + increase intake
      doc.stockAvailable = Math.max(0, Number(stockAvailable) - 1);
      doc.todaysIntake = todaysIntake + 1;

      // If save fails → silently skip
      await doc.save().catch(() => {});
      
      // Low stock notification (< 7 tablets)
      if (doc.stockAvailable <= 7) {
          sendDrugRefillReminderEmail(item.doc.userId,item.type,item.doc);
      }
    }

  } catch (err) {
    // Prevent cron from crashing
    // reportCronError(err); (optional)
  }
};

/** Cron Scheduler */
function sendBPSugarReminder() {
  // Production example:
  cron.schedule("0 9 * * *", () => reminderJob("M"));
  cron.schedule("0 14 * * *", () => reminderJob("A"));
  cron.schedule("0 20 * * *", () => reminderJob("E"));

  // // Test mode (runs every minute)
  // cron.schedule("0 * * * * *", () => reminderJob("M"));
  // cron.schedule("20 * * * * *", () => reminderJob("A"));
  // cron.schedule("40 * * * * *", () => reminderJob("E"));
}

export default sendBPSugarReminder;
