import { Router } from "express";

const medicineRouter = Router();
import registerMedicine from "../controllers/pharmacy/medicine/registerMedicine.js";
import findMedicine from "../controllers/pharmacy/medicine/findMedicine.js";
import pharmacyAuth from "../controllers/pharmacy/pharmacyAuthorizer.js";
import updateMedicine from "../controllers/pharmacy/medicine/updateMedicine.js";

medicineRouter.patch("/:id", updateMedicine);
medicineRouter.post("/", pharmacyAuth, registerMedicine); 
medicineRouter.get("/",pharmacyAuth, findMedicine);

export default medicineRouter;