import { Router } from "express";
import authorization from "./../controllers/authorization.js";
import addBpReading from "../controllers/UserFunctionality/BP/bpReading.js";

const userFuncRoutes = Router();

userFuncRoutes.post("/BPReading", authorization,addBpReading);

export default userFuncRoutes;