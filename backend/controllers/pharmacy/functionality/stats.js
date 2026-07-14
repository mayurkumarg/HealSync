import mongoose from "mongoose";
import PharmacyStock from "../../../models/medical/pharmacyStock.js";

export const getAllStats = async (req, res) => {
  try {
    const topN = parseInt(req.query.topN, 10) || 10;
    const expDays = parseInt(req.query.days, 10) || 30;
    const updatesDays = parseInt(req.query.updateDays, 10) || 30;

    const now = new Date();
    const inDays = new Date(now.getTime() + expDays * 24 * 60 * 60 * 1000);
    const since = new Date();
    since.setDate(since.getDate() - updatesDays);

    const totalValuePerPharmacyPipeline = [
      {
        $group: {
          _id: "$pharmacyId",
          totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
          totalQuantity: { $sum: "$quantity" },
          itemCount: { $sum: 1 },
        },
      },
      { $sort: { totalValue: -1 } },
    ];

    const totalQuantityPerMedicinePipeline = [
      {
        $group: {
          _id: "$medicineId",
          totalQuantity: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
          avgPrice: { $avg: "$price" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: topN },
    ];

    const distinctMedicinesPerPharmacyPipeline = [
      {
        $group: {
          _id: "$pharmacyId",
          distinctMedicines: { $addToSet: "$medicineId" },
        },
      },
      {
        $project: {
          distinctCount: { $size: "$distinctMedicines" },
          distinctMedicines: 1,
        },
      },
      { $sort: { distinctCount: -1 } },
    ];

    const lowOutCountsPerPharmacyPipeline = [
      { $match: { status: { $in: ["low", "out_of_stock"] } } },
      {
        $group: {
          _id: "$pharmacyId",
          lowCount: { $sum: { $cond: [{ $eq: ["$status", "low"] }, 1, 0] } },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ["$status", "out_of_stock"] }, 1, 0] },
          },
          totalAffectedQuantity: {
            $sum: {
              $cond: [
                { $in: ["$status", ["low", "out_of_stock"]] },
                "$quantity",
                0,
              ],
            },
          },
        },
      },
    ];

    const expiringAndExpiredPipeline = [
      {
        $project: {
          pharmacyId: 1,
          medicineId: 1,
          batchNo: 1,
          expiryDate: 1,
          quantity: 1,
          isExpired: { $lt: ["$expiryDate", now] },
          expiresSoon: {
            $and: [
              { $gte: ["$expiryDate", now] },
              { $lte: ["$expiryDate", inDays] },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$pharmacyId",
          expiredQuantity: { $sum: { $cond: ["$isExpired", "$quantity", 0] } },
          expiringSoonQuantity: {
            $sum: { $cond: ["$expiresSoon", "$quantity", 0] },
          },
          expiredBatches: {
            $push: {
              $cond: [
                "$isExpired",
                {
                  medicineId: "$medicineId",
                  batchNo: "$batchNo",
                  qty: "$quantity",
                  expiryDate: "$expiryDate",
                },
                "$$REMOVE",
              ],
            },
          },
          expiringSoonBatches: {
            $push: {
              $cond: [
                "$expiresSoon",
                {
                  medicineId: "$medicineId",
                  batchNo: "$batchNo",
                  qty: "$quantity",
                  expiryDate: "$expiryDate",
                },
                "$$REMOVE",
              ],
            },
          },
        },
      },
    ];

    const avgPricePerMedicinePipeline = [
      {
        $group: {
          _id: "$medicineId",
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          sampleCount: { $sum: 1 },
        },
      },
      { $sort: { avgPrice: -1 } },
      { $limit: topN },
    ];

    const topMedicinesByQuantityPipeline = [
      {
        $group: {
          _id: "$medicineId",
          totalQuantity: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: topN },
    ];

    const topMedicinesByValuePipeline = [
      {
        $group: {
          _id: "$medicineId",
          totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      { $sort: { totalValue: -1 } },
      { $limit: topN },
    ];

    const updatesPerDayPipeline = [
      { $match: { updatedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          updates: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const [
      totalValuePerPharmacy,
      totalQuantityPerMedicine,
      distinctMedicinesPerPharmacy,
      lowOutCountsPerPharmacy,
      expiringAndExpired,
      avgPricePerMedicine,
      topMedicinesByQuantity,
      topMedicinesByValue,
      updatesPerDay,
    ] = await Promise.all([
      PharmacyStock.aggregate(totalValuePerPharmacyPipeline),
      PharmacyStock.aggregate(totalQuantityPerMedicinePipeline),
      PharmacyStock.aggregate(distinctMedicinesPerPharmacyPipeline),
      PharmacyStock.aggregate(lowOutCountsPerPharmacyPipeline),
      PharmacyStock.aggregate(expiringAndExpiredPipeline),
      PharmacyStock.aggregate(avgPricePerMedicinePipeline),
      PharmacyStock.aggregate(topMedicinesByQuantityPipeline),
      PharmacyStock.aggregate(topMedicinesByValuePipeline),
      PharmacyStock.aggregate(updatesPerDayPipeline),
    ]);

    return res.json({
      success: true,
      data: {
        totalValuePerPharmacy,
        totalQuantityPerMedicine,
        distinctMedicinesPerPharmacy,
        lowOutCountsPerPharmacy,
        expiringAndExpired,
        avgPricePerMedicine,
        topMedicinesByQuantity,
        topMedicinesByValue,
        updatesPerDay,
      },
      meta: { topN, expDays, updatesDays },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export default { getAllStats };
