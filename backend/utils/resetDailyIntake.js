/**
 * Zeroes a BPTracking/SugarTracking doc's todaysIntake counter if it was last reset on an
 * earlier calendar day (local time). Call this before reading OR incrementing todaysIntake —
 * without it, once a patient hits tabletsPerDay the reminder cron's `todaysIntake >= tabletsPerDay`
 * guard stays tripped forever, since nothing else ever brings the counter back down.
 * Mutates `doc` in place; does not save — caller decides when to persist.
 */
export function resetDailyIntakeIfNeeded(doc) {
  if (!doc || doc.tabletsPerDay == null) return doc;

  const today = new Date();
  const isNewDay = !doc.lastIntakeDate || new Date(doc.lastIntakeDate).toDateString() !== today.toDateString();

  if (isNewDay && (doc.todaysIntake ?? 0) !== 0) {
    doc.todaysIntake = 0;
  }
  if (isNewDay) {
    doc.lastIntakeDate = today;
  }
  return doc;
}
