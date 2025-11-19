import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import BPTracking from "../../../models/bp.js";

/**
 * @desc   Update BP document OR a specific reading
 * @route  PATCH /api/health/bp/update?type=reading&id=XYZ
 * @route  PATCH /api/health/bp/update?type=document
 * @access User
 */

const updateBpReading = handelAsyncFunction(async (req, res, next) => {

    //~ extract user id and query params
    const userId = req.user._id;
    const { type, id: readingId } = req.query;

    //~ fetch BP profile
    const bpProfile = await BPTracking.findOne({ userId });

    if (!bpProfile) {
        return next(new CustomError(404, "BP tracking profile not found."));
    }

    /** ------------------------------------------------
     *  TYPE 1 → Update Entire BP Document (Medication fields)
     *  ------------------------------------------------ */
    if (type === "document") {

        const allowedDocFields = [
            "drugName",
            "dosage",
            "tabletsPerDay",
            "stockAvailable"
        ];

        allowedDocFields.forEach(field => {
            if (req.body[field] !== undefined) {
                bpProfile[field] = req.body[field];
            }
        });

        await bpProfile.save();

        return res.status(200).json({
            status: "success",
            message: "BP document updated successfully.",
            data: bpProfile
        });
    }

    /** ------------------------------------------------
     *  TYPE 2 → Update Specific Reading
     *  ------------------------------------------------ */
    if (type === "reading") {

        //^ validate reading ID
        if (!readingId) {
            return next(new CustomError(400, "Reading ID is required."));
        }

        //~ find the reading inside array
        const reading = bpProfile.readings.id(readingId);

        if (!reading) {
            return next(new CustomError(404, "Reading not found."));
        }

        //~ list of allowed fields inside reading
        const allowedReadingFields = [
            "systolic",
            "diastolic",
            "pulse",
            "recordedAt"
        ];

        //~ update allowed fields
        allowedReadingFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                reading[field] = req.body[field];
            }
        });

        //~ handle date parsing
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

        //~ Save profile after updating the array item
        await bpProfile.save();

        return res.status(200).json({
            status: "success",
            message: "BP reading updated successfully.",
            data: reading
        });
    }

    /** ------------------------------------------------
     *  INVALID TYPE
     *  ------------------------------------------------ */
    return next(new CustomError(400, "Invalid update type. Use 'document' or 'reading'."));
});

export default updateBpReading;
