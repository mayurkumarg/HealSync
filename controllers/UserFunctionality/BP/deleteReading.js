import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import BPTracking from "../../../models/bp.js";

/**
 * @desc   Delete BP document OR a specific reading using query
 * @route  DELETE /api/health/bp/delete?type=reading&id=XYZ
 * @route  DELETE /api/health/bp/delete?type=document
 * @access User
 */

const deleteBpReading = handelAsyncFunction(async (req, res, next) => {

    //~ extract user and query params
    const userId = req.user._id;
    const { type, id: readingId } = req.query;

    /** ------------------------------------------------
     *  TYPE 1 → Delete entire BP document
     *  ------------------------------------------------ */
    if (type === "document") {

        const deleted = await BPTracking.findOneAndDelete({ userId });

        if (!deleted) {
            return next(new CustomError(404, "No BP tracking profile found."));
        }

        return res.status(200).json({
            status: "success",
            message: "BP tracking document deleted successfully.",
        });
    }

    /** ------------------------------------------------
     *  TYPE 2 → Delete specific reading
     *  ------------------------------------------------ */
    if (type === "reading") {

        //^ validate reading ID
        if (!readingId) {
            return next(new CustomError(400, "Reading ID is required for deletion."));
        }

        //~ find user bp profile
        const bpProfile = await BPTracking.findOne({ userId });

        if (!bpProfile) {
            return next(new CustomError(404, "BP tracking profile not found."));
        }

        //~ find index of reading inside array
        const index = bpProfile.readings.findIndex(
            (r) => r._id.toString() === readingId
        );

        if (index === -1) {
            return next(new CustomError(404, "Reading not found."));
        }

        //~ remove reading from array
        bpProfile.readings.splice(index, 1);

        //~ update recentSuggestion (use latest reading if exists)
        if (bpProfile.readings.length > 0) {
            const latest = bpProfile.readings[bpProfile.readings.length - 1];

            // simple default suggestion
            bpProfile.recentSuggestion = latest.category || null;
        } else {
            bpProfile.recentSuggestion = null;
        }

        await bpProfile.save();

        return res.status(200).json({
            status: "success",
            message: "BP reading deleted successfully.",
        });
    }

    /** ------------------------------------------------
     *  INVALID TYPE
     *  ------------------------------------------------ */
    return next(new CustomError(400, "Invalid delete type. Use 'reading' or 'document'."));
});

export default deleteBpReading;
