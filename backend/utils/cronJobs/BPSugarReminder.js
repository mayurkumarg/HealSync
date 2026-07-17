import cron from "node-cron";
import bpTracking from "../../models/bp.js";
import sugarTracking from "../../models/sugar.js";
import {sendDrugRefillReminderEmail} from "../../service/email.js";
import { resetDailyIntakeIfNeeded } from "../resetDailyIntake.js";

/**
 * Reminder Job
 * schedule: "M" | "A" | "E"
 */
export const reminderJob = async (schedule) => {
  try {
    // Narrow the query to only docs that could possibly need a dose today — was previously an
    // unfiltered find({}) scanning the entire collection three times a day.
    const filter = { tabletsPerDay: { $gt: 0 }, stockAvailable: { $ne: null } };
    const [bpDocs, sugarDocs] = await Promise.all([
      bpTracking.find(filter).populate("userId").exec(),
      sugarTracking.find(filter).populate("userId").exec(),
    ]);

    // Merge both lists
    const entries = [
      ...bpDocs.map((doc) => ({ type: "bp", doc, Model: bpTracking })),
      ...sugarDocs.map((doc) => ({ type: "sugar", doc, Model: sugarTracking })),
    ];

    // Tablets per day → which reminders apply
    const getActiveSlots = (perDay) => {
      if (!perDay || perDay <= 0) return [];
      if (perDay === 1) return ["M"];
      if (perDay === 2) return ["M", "E"];
      return ["M", "A", "E"]; // default 3/day
    };

    // Collect per-doc updates and flush as one batched bulkWrite per model instead of a
    // sequential await-per-document save loop — same decision logic, one round-trip instead of N.
    const bulkOpsByModel = new Map();
    const refillNotifications = [];

    for (const item of entries) {
      const doc = item.doc;
      const { tabletsPerDay, stockAvailable } = doc;

      resetDailyIntakeIfNeeded(doc); // zero todaysIntake if it's a new day since the last dose
      const todaysIntake = typeof doc.todaysIntake === "number" ? doc.todaysIntake : 0;

      const activeSlots = getActiveSlots(tabletsPerDay);
      if (!activeSlots.includes(schedule)) continue;
      if (todaysIntake >= tabletsPerDay) continue; // prevent overdose

      const newStock = Math.max(0, Number(stockAvailable) - 1);
      const newIntake = todaysIntake + 1;

      if (!bulkOpsByModel.has(item.Model)) bulkOpsByModel.set(item.Model, []);
      bulkOpsByModel.get(item.Model).push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { stockAvailable: newStock, todaysIntake: newIntake, lastIntakeDate: doc.lastIntakeDate } },
        },
      });

      if (newStock <= 7) {
        refillNotifications.push(() =>
          sendDrugRefillReminderEmail(doc.userId, item.type, { ...doc.toObject(), stockAvailable: newStock })
        );
      }
    }

    await Promise.all(
      [...bulkOpsByModel.entries()].map(([Model, ops]) => (ops.length ? Model.bulkWrite(ops) : null))
    );
    // Email sends stay best-effort/fire-and-forget, same as before — a failed email shouldn't
    // block the batch write that already succeeded.
    refillNotifications.forEach((send) => send().catch(() => {}));
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
