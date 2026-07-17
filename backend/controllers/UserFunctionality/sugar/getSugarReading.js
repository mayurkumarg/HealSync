import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import SugarTracking from "../../../models/sugar.js";
import { resetDailyIntakeIfNeeded } from "../../../utils/resetDailyIntake.js";

/**
 * @desc   Get Sugar readings OR Sugar medication document (not both)
 * @route  GET /sugar/reading?include=document
 * @route  GET /sugar/reading?include=readings&range=month&limit=50
 * @access User
 */

const getSugarReadings = handelAsyncFunction(async (req, res, next) => {

    const userId = req.user._id;

    // include: "document" | "readings"
    const include = req.query.include || "readings";

    if (!["document", "readings"].includes(include)) {
        return next(new CustomError(400, "include must be 'document' or 'readings'."));
    }

    /** -------------------- Fetch Profile -------------------- */
    const sugarProfile = await SugarTracking.findOne({ userId });

    if (!sugarProfile) {
        return next(new CustomError(404, "No Sugar profile found for this user."));
    }

    /** ----------------------------------------------------------
     * OPTION 1 → RETURN ONLY DOCUMENT DETAILS
     * ---------------------------------------------------------- */
    if (include === "document") {
        resetDailyIntakeIfNeeded(sugarProfile);
        await sugarProfile.save().catch(() => {});

        return res.status(200).json({
            status: "success",
            message: "Sugar medication document fetched successfully.",
            document: {
                drugName: sugarProfile.drugName,
                dosage: sugarProfile.dosage,
                tabletsPerDay: sugarProfile.tabletsPerDay,
                stockAvailable: sugarProfile.stockAvailable,
                todaysIntake: sugarProfile.todaysIntake
            }
        });
    }

    /** ----------------------------------------------------------
     * OPTION 2 → RETURN ONLY READINGS
     * ---------------------------------------------------------- */

    const range = req.query.range || "all";
    const forGraph = req.query.for === "graph";
    const page = Number(req.query.page) || 1;

    // limit (min=1, max=500)
    let limit = Number(req.query.limit) || 100;
    if (limit > 500) limit = 500;
    if (limit < 1) limit = 1;

    const skip = (page - 1) * limit;

    /** -------------------- Clone Readings -------------------- */
    let readings = [...sugarProfile.readings];

    /** -------------------- Range Filter -------------------- */
    const now = new Date();

    if (range === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        readings = readings.filter(r => r.recordedAt >= weekAgo);
    }

    if (range === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        readings = readings.filter(r => r.recordedAt >= monthAgo);
    }

    if (range === "year") {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        readings = readings.filter(r => r.recordedAt >= yearAgo);
    }

    /** -------------------- Sort by Newest -------------------- */
    readings.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

    /** -------------------- Pagination -------------------- */
    const total = readings.length;
    const paginated = readings.slice(skip, skip + limit);

    if (!paginated.length) {
        return res.status(404).json({
            status: "failed",
            message: "No sugar readings found for this range or page.",
        });
    }

    /** -------------------- Graph Mode (lightweight) -------------------- */
    let readingData = paginated;

    if (forGraph) {
        readingData = paginated.map(r => ({
            level: r.level,
            type: r.type,
            status: r.status,
            recordedAt: r.recordedAt
        }));
    }

    /** -------------------- Response -------------------- */
    return res.status(200).json({
        status: "success",
        message: "Sugar readings fetched successfully.",
        range,
        forGraph,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
        count: readingData.length,
        readings: readingData
    });
});

export default getSugarReadings;
