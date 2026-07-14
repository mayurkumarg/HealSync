import handelAsyncFunction from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import SugarTracking from "../../../models/sugar.js";

/**
 * @desc   Initialize or update Sugar tracking profile (medication only)
 * @route  POST /api/health/sugar/init
 * @access User
 */

const initSugarProfile = handelAsyncFunction(async (req, res, next) => {

    //~ extract user id
    const userId = req.user._id;

    //~ extract medication fields
    const { drugName, dosage, tabletsPerDay, stockAvailable } = req.body;

    //^ validate medication fields
    if (!drugName || !dosage || !tabletsPerDay || stockAvailable === undefined) {
        return next(new CustomError(400, "All medication fields are required."));
    }

    //~ find sugar profile
    let sugarProfile = await SugarTracking.findOne({ userId });

    /** -------------------- Create New Document -------------------- */
    if (!sugarProfile) {
        sugarProfile = await SugarTracking.create({
            userId,
            drugName,
            dosage,
            tabletsPerDay,
            stockAvailable,
        });
    } 
    /** -------------------- Update Existing Medication Details -------------------- */
    else {
        sugarProfile.drugName = drugName;
        sugarProfile.dosage = dosage;
        sugarProfile.tabletsPerDay = tabletsPerDay;
        sugarProfile.stockAvailable = stockAvailable;

        await sugarProfile.save();
    }

    /** -------------------- SUCCESS -------------------- */
    return res.status(200).json({
        status: "success",
        message: "Sugar profile initialized/updated successfully.",
        data: sugarProfile,
    });

});

export default initSugarProfile;
