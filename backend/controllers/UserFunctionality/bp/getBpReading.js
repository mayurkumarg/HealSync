import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import BPTracking from "../../../models/bp.js";
import { resetDailyIntakeIfNeeded } from "../../../utils/resetDailyIntake.js";

/**
 * @desc   Get BP readings OR BP document (not both)
 * @route  GET /bp/reading?include=document
 * @route  GET /bp/reading?include=readings&range=month&limit=50
 * @access User
 */

const getBpReadings = handelAsyncFunction(async (req, res, next) => {

    const userId = req.user._id;

    // include = document | readings
    const include = req.query.include || "readings";

    if (!["document", "readings"].includes(include)) {
        return next(new CustomError(400, "include must be 'document' or 'readings'"));
    }

    const bpProfile = await BPTracking.findOne({ userId });

    if (!bpProfile) {
        return next(new CustomError(404, "No BP profile found for this user."));
    }

    /** -------------------------------------------------
     * OPTION 1 → RETURN ONLY DOCUMENT
     * ------------------------------------------------- */
    if (include === "document") {
        resetDailyIntakeIfNeeded(bpProfile);
        await bpProfile.save().catch(() => {});

        return res.status(200).json({
            status: "success",
            message: "BP medication document fetched successfully.",
            document: {
                drugName: bpProfile.drugName,
                dosage: bpProfile.dosage,
                tabletsPerDay: bpProfile.tabletsPerDay,
                stockAvailable: bpProfile.stockAvailable,
                recentSuggestion: bpProfile.recentSuggestion,
                todaysIntake: bpProfile.todaysIntake
            }
        });
    }

    /** -------------------------------------------------
     * OPTION 2 → RETURN ONLY READINGS
     * ------------------------------------------------- */

    const range = req.query.range || "all";
    const forGraph = req.query.for === "graph";
    const page = Number(req.query.page) || 1;

    // limit with safe boundaries
    let limit = Number(req.query.limit) || 100;
    if (limit > 500) limit = 500;
    if (limit < 1) limit = 1;

    const skip = (page - 1) * limit;

    let readings = [...bpProfile.readings];
    const now = new Date();

    // Range filters
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

    // Sort newest first
    readings.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

    const total = readings.length;
    const paginated = readings.slice(skip, skip + limit);

    if (!paginated.length) {
        return res.status(404).json({
            status: "failed",
            message: "No readings found for this range or page.",
        });
    }

    // Graph mode → reduce payload
    let readingData = paginated;
    if (forGraph) {
        readingData = paginated.map(r => ({
            systolic: r.systolic,
            diastolic: r.diastolic,
            pulse: r.pulse,
            category: r.category,
            recordedAt: r.recordedAt
        }));
    }

    return res.status(200).json({
        status: "success",
        message: "BP readings fetched successfully.",
        limit,
        page,
        range,
        forGraph,
        totalPages: Math.ceil(total / limit),
        count: readingData.length,
        readings: readingData
    });
});

export default getBpReadings;
