import cron from "node-cron";
import PatientAccess from "../../models/hospital/patientAccessModel.js";

/**
 * Deactivates PatientAccess grants whose expiresAt has passed but are still marked active.
 * AccessToken (the pre-claim short code/QR) already self-expires via a Mongo TTL index; the
 * PatientAccess grant it turns into does not, so this is the equivalent cleanup for grants.
 */
export const cleanupExpiredPatientAccess = async () => {
  try {
    const result = await PatientAccess.updateMany(
      { isActive: true, expiresAt: { $ne: null, $lt: new Date() } },
      { $set: { isActive: false } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[PatientAccessCleanup] Deactivated ${result.modifiedCount} expired access grant(s).`);
    }
  } catch (err) {
    console.error("[PatientAccessCleanup] Error:", err.message);
  }
};

export const startPatientAccessCleanup = () => {
  // Daily at 2:15 AM — offset from the reminder scheduler's 2 AM cleanup job to avoid contention.
  cron.schedule("15 2 * * *", cleanupExpiredPatientAccess);
};
