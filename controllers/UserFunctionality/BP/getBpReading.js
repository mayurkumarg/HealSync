import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import BPTracking from "../../../models/bp.js";

/**
 * @desc   Get BP readings with pagination & optional graph-only data
 * @route  GET /bp/reading?page=1&limit=50&for=graph&range=month
 * @access User
 */

const getBpReadings = handelAsyncFunction(async (req, res, next) => {

    //~ extract user id
    const userId = req.user._id;

    //~ extract optional queries
    const range = req.query.range || "all"; 
    const forGraph = req.query.for === "graph"; 
    const page = Number(req.query.page) || 1;

    //~ limit from query (DEFAULT = 100, MAX = 500)
    let limit = Number(req.query.limit) || 100;
    if (limit > 500) limit = 500;
    if (limit < 1) limit = 1;

    const skip = (page - 1) * limit;

    /** -------------------- Fetch User Profile -------------------- */
    const bpProfile = await BPTracking.findOne({ userId });

    if (!bpProfile) {
        return next(new CustomError(404, "No BP profile found for this user."));
    }

    /** -------------------- Clone All Readings -------------------- */
    let readings = [...bpProfile.readings];

    /** -------------------- Apply Range Filter -------------------- */
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

    /** -------------------- Sort (Newest First) -------------------- */
    readings.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

    /** -------------------- Pagination -------------------- */
    const total = readings.length;
    const paginated = readings.slice(skip, skip + limit);

    if (!paginated.length) {
        return res.status(404).json({
            status: "failed",
            message: "No readings found for the selected range or page.",
        });
    }

    /** -------------------- Graph Mode Optimization -------------------- */
    let responseData = paginated;

    if (forGraph) {
        responseData = paginated.map(r => ({
            systolic: r.systolic,
            diastolic: r.diastolic,
            pulse: r.pulse,
            category: r.category,
            recordedAt: r.recordedAt,
        }));
    }

    /** -------------------- SUCCESS -------------------- */
    return res.status(200).json({
        status: "success",
        message: "BP readings fetched successfully.",
        range,
        forGraph,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
        count: responseData.length,
        data: responseData,
    });
});

export default getBpReadings;
