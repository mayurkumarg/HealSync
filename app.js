import express from "express";
import userRoute from "./routes/userRoute.js"
import globalErrorHandler from "./controllers/Error/globalErrorhandler.js";
import CustomError from "./utils/customError.js";
import pharmacyRouter from "./routes/pharmacyRoute.js";
import medicineRouter from "./routes/medicineRoute.js";

const app = express();




//^middleware for the post body data
app.use(express.json())

//^ router that manages the authentication functionality
app.use("/api/auth",userRoute);

//^router for managing the pharmacy functionality
app.use("/api/pharmacy",pharmacyRouter);

//^router for managing the medicine functionality
app.use("/api/medicine",medicineRouter);

//^ middleware for serving the static files
// app.use(express.static("public"));


//^ 404 route middleware
app.use("*",(req,res,next)=>{
    next(new CustomError(404,`${req.baseUrl} not found in our server.`))
})

//^global error handler
app.use(globalErrorHandler);


export default app;

