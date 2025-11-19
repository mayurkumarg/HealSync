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
userFuncRoutes.patch("/BP", authorization, updateBpReading);
userFuncRoutes.delete("/BP", authorization, deleteBpReading);


import initSugarProfile from "../controllers/UserFunctionality/sugar/intiSugarTracking.js";
import addSugarReading from "../controllers/UserFunctionality/sugar/sugarReading.js";
import getSugarReadings from "../controllers/UserFunctionality/sugar/getSugarReading.js";
import updateSugarReading from "../controllers/UserFunctionality/sugar/updateSugar.js";
import deleteSugarReading from "../controllers/UserFunctionality/sugar/deleteDocNReading.js";

userFuncRoutes.post("/Sugar", authorization,initSugarProfile);
userFuncRoutes.post("/Sugar/SugarReadings", authorization,addSugarReading);

userFuncRoutes.get("/Sugar", authorization,getSugarReadings);
userFuncRoutes.patch("/Sugar", authorization, updateSugarReading);
userFuncRoutes.delete("/Sugar", authorization, deleteSugarReading);
export default userFuncRoutes;