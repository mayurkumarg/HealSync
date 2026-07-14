import { Router } from "express";

const medicineRouter = Router();
import registerMedicine from "../controllers/pharmacy/medicine/registerMedicine.js";
import findMedicine from "../controllers/pharmacy/medicine/findMedicine.js";
import searchMedicineNearby from "../controllers/pharmacy/medicine/searchNearby.js";
import pharmacyAuth from "../controllers/pharmacy/pharmacyAuthorizer.js";
import updateMedicine from "../controllers/pharmacy/medicine/updateMedicine.js";

// Public: patient-facing "find nearby pharmacy that stocks this medicine" search — no login required.
medicineRouter.get("/search-nearby", searchMedicineNearby);

medicineRouter.patch("/:id", pharmacyAuth, updateMedicine);
medicineRouter.post("/", pharmacyAuth, registerMedicine);
medicineRouter.get("/",pharmacyAuth, findMedicine);

export default medicineRouter;