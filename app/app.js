import express from "express";
import connectDB from "../config/databaseConfig.js";
import adminRouter from "../router/adminRoutes.js";

connectDB();
const app = express();

app.use(express.json());

// Import and use routes
app.use("/api/admin", adminRouter);
export default app;
