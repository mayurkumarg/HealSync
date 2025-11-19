import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import BPReading from "../../../models/bp.js";

/**
 * @desc   Add a new blood pressure reading for a user
 * @route  POST /api/health/bp/add
 * @access Public | User
 */

//~ convert dd/mm/yyyy OR dd/mm/yyyy hh:mm to JS Date()
function parseCustomDate(dateStr) {
  const [datePart, timePart] = dateStr.split(" ");

  const [day, month, year] = datePart.split("/").map(Number);
  if (!day || !month || !year) return null;

  let hours = 0, minutes = 0;

  if (timePart) {
    const [h, m] = timePart.split(":").map(Number);
    hours = h || 0;
    minutes = m || 0;
  }

  return new Date(year, month - 1, day, hours, minutes);
}

const addBpReading = handelAsyncFunction(async (req, res, next) => {

    const userId = req.user._id;
  const {
    systolic,
    diastolic,
    pulse,
    recordedAt,
    drugName,
    dosage,
    tabletsPerDay,
    stockAvailable,
  } = req.body;

  /** -------------------- Validate Required Fields -------------------- */
  if (!systolic || !diastolic || !recordedAt) {
    return next(
      new CustomError(
        400,
        "userId, systolic, diastolic and recordedAt are required."
      )
    );
  }

  /** -------------------- Convert Date (support dd/mm/yyyy) -------------------- */
  let recordDate;

  if (recordedAt.includes("/")) {
    recordDate = parseCustomDate(recordedAt);
  } else {
    recordDate = new Date(recordedAt);
  }

  if (!recordDate || isNaN(recordDate.getTime())) {
    return next(
      new CustomError(
        400,
        "Invalid date format. Use dd/mm/yyyy or a valid ISO format."
      )
    );
  }

  /** -------------------- Helper Functions -------------------- */
  const getBpCategory = (s, d) => {
    if (s >= 180 || d >= 120) return "Hypertensive Crisis";
    if (s >= 140 || d >= 90) return "Stage 2 Hypertension";
    if (s >= 130 || d >= 80) return "Stage 1 Hypertension";
    if (s >= 120 && d < 80) return "Elevated";
    return "Normal";
  };

  const getBpStatus = (s, d) => {
    if (s < 90 || d < 60) return "low";
    if (s > 130 || d > 80) return "high";
    return "normal";
  };

  const calculateDelta = (current, previous) => {
    if (!previous) return { systolic: 0, diastolic: 0, pulse: 0 };
    return {
      systolic: current.systolic - previous.systolic,
      diastolic: current.diastolic - previous.diastolic,
      pulse: current.pulse - previous.pulse,
    };
  };

  const generateSuggestions = (category) => {
    const tips = [];

    if (category === "Normal")
      tips.push("Your BP is normal. Maintain your lifestyle.");

    if (category === "Elevated")
      tips.push("Reduce salt intake and keep monitoring BP.");

    if (category.includes("Stage 1"))
      tips.push(
        "Your BP is slightly high. Avoid stress & monitor regularly."
      );

    if (category.includes("Stage 2"))
      tips.push("Your BP is very high. Consider consulting a doctor.");

    if (category === "Hypertensive Crisis")
      tips.push("Seek immediate medical attention.");

    return tips;
  };

  /** -------------------- Fetch Previous Reading -------------------- */
  const previous = await BPReading.findOne({ userId }).sort({
    recordedAt: -1,
  });

  /** -------------------- Calculate Dynamic Fields -------------------- */
  const current = { systolic, diastolic, pulse };
  const delta = calculateDelta(current, previous);
  const category = getBpCategory(systolic, diastolic);
  const status = getBpStatus(systolic, diastolic);
  const suggestions = generateSuggestions(category);

  /** -------------------- Save to Database -------------------- */
  const newReading = await BPReading.create({
    userId,
    systolic,
    diastolic,
    pulse,
    category,
    status,

    drugName,
    dosage,
    tabletsPerDay,
    stockAvailable,

    recordedAt: recordDate,
    weekday: recordDate.getDay(),
    month: recordDate.getMonth() + 1,

    delta,
    suggestions,
  });

  /** -------------------- Success Response -------------------- */
  return res.status(201).json({
    status: "success",
    message: "Blood Pressure reading added successfully.",
    data: newReading,
  });
});

export default addBpReading;
