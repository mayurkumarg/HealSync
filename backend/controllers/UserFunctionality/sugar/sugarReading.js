import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import SugarTracking from "../../../models/sugar.js";

/**
 * @desc   Add a new sugar reading (does NOT require medication fields)
 * @route  POST /api/health/sugar/readings/add
 * @access User
 */

//~ convert dd/mm/yyyy OR dd/mm/yyyy hh:mm → Date()
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

const addSugarReading = handelAsyncFunction(async (req, res, next) => {

  //~ extract user id
  const userId = req.user._id;

  //~ extract fields
  const { level, type, recordedAt } = req.body;

  /** -------------------- Validate Required Fields -------------------- */
  if (!level || !type || !recordedAt) {
    return next(
      new CustomError(
        400,
        "level, type and recordedAt are required fields."
      )
    );
  }

  /** -------------------- Fetch Sugar Profile -------------------- */
  let sugarProfile = await SugarTracking.findOne({ userId });

  if (!sugarProfile) {
    return next(
      new CustomError(
        400,
        "Please initialize sugar tracking profile first."
      )
    );
  }

  /** -------------------- Convert Date -------------------- */
  const recordDate = recordedAt.includes("/")
    ? parseCustomDate(recordedAt)
    : new Date(recordedAt);

  if (!recordDate || isNaN(recordDate.getTime())) {
    return next(
      new CustomError(400, "Invalid date format. Use dd/mm/yyyy or a valid date string.")
    );
  }

  /** -------------------- Helper Functions -------------------- */

  const getSugarStatus = (value, type) => {
    // Fasting ranges
    if (type === "fasting") {
      if (value < 70) return "Low";
      if (value >= 70 && value <= 99) return "Normal";
      if (value >= 100 && value <= 125) return "Pre-diabetic";
      return "Diabetic";
    }

    // Post-meal ranges
    if (type === "post-meal") {
      if (value < 90) return "Low";
      if (value <= 140) return "Normal";
      if (value <= 199) return "Pre-diabetic";
      return "Diabetic";
    }

    // Random test
    if (type === "random") {
      if (value < 70) return "Low";
      if (value <= 140) return "Normal";
      if (value <= 199) return "Pre-diabetic";
      return "Diabetic";
    }

    return "Normal";
  };

  const prev = sugarProfile.readings[sugarProfile.readings.length - 1];
  const delta = prev ? level - prev.level : 0;

  const status = getSugarStatus(level, type);

  /** -------------------- Generate Universal Suggestion -------------------- */

  const suggestionMap = {
    Normal: "Your sugar level is normal. Maintain good lifestyle habits.",
    Low: "Your sugar level is low. Consider taking glucose or a sweet snack.",
    "Pre-diabetic": "Your sugar level is high. Avoid sweets and monitor regularly.",
    Diabetic: "Warning: High sugar level. Consider consulting your doctor.",
  };

  const recentSuggestion = suggestionMap[status];

  /** -------------------- Prepare Reading Object -------------------- */

  const newReading = {
    level,
    type,
    status,
    delta,
    recordedAt: recordDate,
    weekday: recordDate.getDay(),
    month: recordDate.getMonth() + 1,
  };

  /** -------------------- Push Reading & Update Stock -------------------- */

  // Push, capping the embedded array so a long-lived account can't grow this document
  // unboundedly.
  const READINGS_CAP = 730; // ~2 years of daily readings, generous for real usage
  sugarProfile.readings.push(newReading);
  if (sugarProfile.readings.length > READINGS_CAP) {
    sugarProfile.readings = sugarProfile.readings.slice(-READINGS_CAP);
  }
  sugarProfile.recentSuggestion = recentSuggestion;

  // reduce medication stock
  if (sugarProfile.tabletsPerDay && sugarProfile.stockAvailable !== null) {
    sugarProfile.stockAvailable = Math.max(
      0,
      sugarProfile.stockAvailable - sugarProfile.tabletsPerDay
    );
  }

  /** -------------------- Save Profile -------------------- */
  await sugarProfile.save();

  /** -------------------- SUCCESS -------------------- */
  return res.status(201).json({
    status: "success",
    message: "Sugar reading added successfully.",
    data: sugarProfile,
  });

});

export default addSugarReading;
