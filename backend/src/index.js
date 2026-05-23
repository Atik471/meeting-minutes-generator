import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import transcribeRoute from "./transcribeRoute.js";
import { SYSTEM_PROMPT } from "./utils.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend server is running" });
});

// Get default system prompt
app.get("/api/default-prompt", (req, res) => {
  res.json({ prompt: SYSTEM_PROMPT });
});

// Test upload endpoint to debug streaming
app.post("/api/test-upload", express.raw({ type: 'application/octet-stream', limit: '100mb' }), (req, res) => {
  console.log('📥 Test upload endpoint hit');
  console.log('Body size:', req.body?.length || 0, 'bytes');
  res.json({ status: 'ok', message: 'Test upload received', bytesReceived: req.body?.length || 0 });
});

// Transcribe route
app.use("/api/transcribe", transcribeRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Meeting Minutes Backend Server running on http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`API Endpoint: POST http://localhost:${PORT}/api/transcribe`);
  console.log(`Test Endpoint: POST http://localhost:${PORT}/api/test-upload`);
});
