import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import transcribeRoute from "./transcribeRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend server is running" });
});

// Transcribe route
app.use("/api/transcribe", transcribeRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Meeting Minutes Backend Server running on http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`API Endpoint: POST http://localhost:${PORT}/api/transcribe`);
});
