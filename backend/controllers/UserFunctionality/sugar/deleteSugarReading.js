import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import SugarTracking from "../../../models/sugar.js";

/**
 * @desc   Delete Sugar document OR a specific reading using query
 * @route  DELETE /api/health/sugar/delete?type=reading&id=XYZ
 * @route  DELETE /api/health/sugar/delete?type=document
 * @access User
 */

const deleteSugarReading = handelAsyncFunction(async (req, res, next) => {

    //~ extract user and query params
    const userId = req.user._id;
    const { type, id: readingId } = req.query;

    /** ------------------------------------------------
     *  TYPE 1 → Delete entire Sugar document
     *  ------------------------------------------------ */
    if (type === "document") {

        const deleted = await SugarTracking.findOneAndDelete({ userId });

        if (!deleted) {
            return next(new CustomError(404, "No Sugar tracking profile found."));
        }

        return res.status(200).json({
            status: "success",
            message: "Sugar tracking document deleted successfully.",
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

        //~ find user sugar profile
        const sugarProfile = await SugarTracking.findOne({ userId });

        if (!sugarProfile) {
            return next(new CustomError(404, "Sugar tracking profile not found."));
        }

        //~ find index of reading inside array
        const index = sugarProfile.readings.findIndex(
            (r) => r._id.toString() === readingId
        );

        if (index === -1) {
            return next(new CustomError(404, "Sugar reading not found."));
        }

        //~ remove reading from array
        sugarProfile.readings.splice(index, 1);

        //~ update recentSuggestion (based on latest reading)
        if (sugarProfile.readings.length > 0) {
            const latest = sugarProfile.readings[sugarProfile.readings.length - 1];
            sugarProfile.recentSuggestion = latest.status || null;
        } else {
            sugarProfile.recentSuggestion = null;
        }

        await sugarProfile.save();

        return res.status(200).json({
            status: "success",
            message: "Sugar reading deleted successfully.",
        });
    }

    /** ------------------------------------------------
     *  INVALID TYPE
     *  ------------------------------------------------ */
    return next(new CustomError(400, "Invalid delete type. Use 'reading' or 'document'."));
});

export default deleteSugarReading;
