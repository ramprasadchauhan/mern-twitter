import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./db/connectDB.js";

dotenv.config();

const app = express();

app.use("/api/auth", authRoutes);

const port = process.env.PORT || 3000;
connectDB();
app.listen(port, () => {
  console.log(`app is running on port ${port} `);
});
