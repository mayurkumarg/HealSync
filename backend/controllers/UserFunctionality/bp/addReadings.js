import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import BPTracking from "../../../models/bp.js";

/**
 * @desc   Add a new BP reading (does NOT require medication fields)
 * @route  POST /api/health/bp/readings/add
 * @access User
 */

function parseCustomDate(dateStr) {
  const [datePart, timePart] = dateStr.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  let hours = 0, minutes = 0;

  if (timePart) {
    const [h, m] = timePart.split(":").map(Number);
    hours = h || 0;
    minutes = m || 0;
  }

  return new Date(year, month - 1, day, hours, minutes);
}

const addReading = handelAsyncFunction(async (req, res, next) => {

  const userId = req.user._id;
  const { systolic, diastolic, pulse, recordedAt } = req.body;

  if (!systolic || !diastolic || !recordedAt) {
    return next(new CustomError(400, "systolic, diastolic and recordedAt are required."));
  }

  let bpProfile = await BPTracking.findOne({ userId });

  if (!bpProfile) {
    return next(new CustomError(400, "Please initialize BP profile first."));
  }

  // Convert date
  const recordDate = recordedAt.includes("/")
    ? parseCustomDate(recordedAt)
    : new Date(recordedAt);

  if (!recordDate || isNaN(recordDate.getTime())) {
    return next(new CustomError(400, "Invalid date format."));
  }

  // Helper functions
  const getCategory = (s, d) => {
    if (s >= 180 || d >= 120) return "Hypertensive Crisis";
    if (s >= 140 || d >= 90) return "Stage 2 Hypertension";
    if (s >= 130 || d >= 80) return "Stage 1 Hypertension";
    if (s >= 120 && d < 80) return "Elevated";
    return "Normal";
  };

  const getStatus = (s, d) => {
    if (s < 90 || d < 60) return "low";
    if (s > 130 || d > 80) return "high";
    return "normal";
  };

  const prev = bpProfile.readings[bpProfile.readings.length - 1];

  const delta = prev
    ? {
        systolic: systolic - prev.systolic,
        diastolic: diastolic - prev.diastolic,
        pulse: pulse - prev.pulse,
      }
    : { systolic: 0, diastolic: 0, pulse: 0 };

  const category = getCategory(systolic, diastolic);
  const status = getStatus(systolic, diastolic);

  // One universal suggestion
  const suggestionMap = {
    Normal: "Your BP is normal. Maintain your lifestyle.",
    Elevated: "BP slightly elevated. Reduce salt intake.",
    "Stage 1 Hypertension": "Your BP is high. Reduce stress & monitor.",
    "Stage 2 Hypertension": "Very high BP. Consult a doctor.",
    "Hypertensive Crisis": "⚠ IMMEDIATE medical attention required.",
  };

  const recentSuggestion = suggestionMap[category];

  const newReading = {
    systolic,
    diastolic,
    pulse,
    category,
    status,
    delta,
    recordedAt: recordDate,
    weekday: recordDate.getDay(),
    month: recordDate.getMonth() + 1,
  };

  // Push, capping the embedded array so a long-lived account can't grow this document
  // unboundedly (readings are still fully available via pagination if ever needed — this just
  // bounds how much a single BPTracking document can hold).
  const READINGS_CAP = 730; // ~2 years of daily readings, generous for real usage
  bpProfile.readings.push(newReading);
  if (bpProfile.readings.length > READINGS_CAP) {
    bpProfile.readings = bpProfile.readings.slice(-READINGS_CAP);
  }
  bpProfile.recentSuggestion = recentSuggestion;

  // Deduct stock
  if (bpProfile.tabletsPerDay && bpProfile.stockAvailable !== null) {
    bpProfile.stockAvailable = Math.max(
      0,
      bpProfile.stockAvailable - bpProfile.tabletsPerDay
    );
  }

  await bpProfile.save();

  return res.status(201).json({
    status: "success",
    message: "BP reading added successfully.",
    data: bpProfile,
  });

});

export default addReading;
