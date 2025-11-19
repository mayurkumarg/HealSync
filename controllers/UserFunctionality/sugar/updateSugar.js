import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import SugarTracking from "../../../models/sugar.js";

/**
 * @desc   Update Sugar document OR a specific sugar reading
 * @route  PATCH /api/health/sugar/update?type=reading&id=XYZ
 * @route  PATCH /api/health/sugar/update?type=document
 * @access User
 */

const updateSugarReading = handelAsyncFunction(async (req, res, next) => {

    //~ extract user id and query params
    const userId = req.user._id;
    const { type, id: readingId } = req.query;

    //~ fetch Sugar profile
    const sugarProfile = await SugarTracking.findOne({ userId });

    if (!sugarProfile) {
        return next(new CustomError(404, "Sugar tracking profile not found."));
    }

    /** ------------------------------------------------
     *  TYPE 1 → Update Entire Sugar Document (Medication fields)
     *  ------------------------------------------------ */
    if (type === "document") {

        const allowedDocFields = [
            "drugName",
            "dosage",
            "tabletsPerDay",
            "stockAvailable"
        ];

        allowedDocFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                sugarProfile[field] = req.body[field];
            }
        });

        await sugarProfile.save();

        return res.status(200).json({
            status: "success",
            message: "Sugar document updated successfully.",
            data: sugarProfile
        });
    }

    /** ------------------------------------------------
     *  TYPE 2 → Update Specific Sugar Reading
     *  ------------------------------------------------ */
    if (type === "reading") {

        //^ reading ID required
        if (!readingId) {
            return next(new CustomError(400, "Reading ID is required."));
        }

        //~ find the reading by _id
        const reading = sugarProfile.readings.id(readingId);

        if (!reading) {
            return next(new CustomError(404, "Sugar reading not found."));
        }

        //~ allowed fields for reading update
        const allowedReadingFields = [
            "level",
            "type",
            "status",
            "recordedAt"
        ];

        allowedReadingFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                reading[field] = req.body[field];
            }
        });

        /** -------------------- Date Parsing -------------------- */
        if (req.body.recordedAt) {
            if (req.body.recordedAt.includes("/")) {
                const [datePart, timePart] = req.body.recordedAt.split(" ");
                const [day, month, year] = datePart.split("/").map(Number);

                let hours = 0, minutes = 0;
                if (timePart) {
                    const [h, m] = timePart.split(":").map(Number);
                    hours = h || 0;
                    minutes = m || 0;
                }

                reading.recordedAt = new Date(year, month - 1, day, hours, minutes);
            } else {
                reading.recordedAt = new Date(req.body.recordedAt);
            }
        }

        //~ save updated subdocument
        await sugarProfile.save();

        return res.status(200).json({
            status: "success",
            message: "Sugar reading updated successfully.",
            data: reading
        });
    }

    /** ------------------------------------------------
     *  INVALID TYPE
     *  ------------------------------------------------ */
    return next(new CustomError(400, "Invalid update type. Use 'document' or 'reading'."));
});

export default updateSugarReading;
