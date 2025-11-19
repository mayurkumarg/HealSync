import { Router } from "express";
import authorization from "./../controllers/authorization.js";
import initBpReading from "../controllers/UserFunctionality/BP/bpReading.js";
import getBpReadings from "../controllers/UserFunctionality/BP/getBpReading.js";
import updateBpReading from "../controllers/UserFunctionality/BP/updateReading.js";
import deleteBpReading from "../controllers/UserFunctionality/BP/deleteReading.js";
import addBpReading from "../controllers/UserFunctionality/BP/addReadings.js";

const userFuncRoutes = Router();

userFuncRoutes.post("/BP", authorization,initBpReading);
userFuncRoutes.post("/BP/BPReadings", authorization,addBpReading);

userFuncRoutes.get("/BP", authorization,getBpReadings);
// userFuncRoutes.patch("/health/bp/update/:id", authorization, updateBpReading);
userFuncRoutes.delete("/BP", authorization, deleteBpReading);

export default userFuncRoutes;