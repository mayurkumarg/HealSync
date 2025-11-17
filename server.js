import dotenv from "dotenv/config";
import connectDB from "./configure/mongoDB.js"


import app from "./app.js"

const PORT = process.env.PORT || 5050 ;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT,() => {
            console.log(`server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to the database. Server not started.", error);
    }
};

startServer();
