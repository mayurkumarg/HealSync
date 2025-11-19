import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import BPTracking from "../../../models/bp.js";

/**
 * @desc   Initialize or update BP tracking profile (medication only)
 * @route  POST /api/health/bp/init
 * @access User
 */

const initBpProfile = handelAsyncFunction(async (req, res, next) => {

    const userId = req.user._id;

    const { drugName, dosage, tabletsPerDay, stockAvailable } = req.body;

    if (!drugName || !dosage || !tabletsPerDay || stockAvailable === undefined) {
        return next(new CustomError(400, "All medication fields are required."));
    }

    let bpProfile = await BPTracking.findOne({ userId });

    // If not exists → create new
    if (!bpProfile) {
        bpProfile = await BPTracking.create({
            userId,
            drugName,
            dosage,
            tabletsPerDay,
            stockAvailable,
        });
    } else {
        // Update existing medication details
        bpProfile.drugName = drugName;
        bpProfile.dosage = dosage;
        bpProfile.tabletsPerDay = tabletsPerDay;
        bpProfile.stockAvailable = stockAvailable;
        await bpProfile.save();
    }

    return res.status(200).json({
        status: "success",
        message: "BP profile initialized/updated successfully.",
        data: bpProfile,
    });

});

export default initBpProfile;
