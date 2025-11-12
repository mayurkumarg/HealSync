import dotenv from "dotenv/config";
import connectDB from "./configure/mongoDB.js"


import app from "./app.js"

const PORT = process.env.PORT || 5050 ;

connectDB();


app.listen(PORT,() => {
    console.log(`server running on port ${PORT}`);
})
