import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.raw({ type: "application/octet-stream", limit: "100mb" }));
app.use((req, res, next) => {
  req.url = "/";
  next();
});

app.post("/", (req, res) => {
  console.log("📥 Test upload endpoint hit");
  console.log("Body size:", req.body?.length || 0, "bytes");
  res.json({ status: "ok", message: "Test upload received", bytesReceived: req.body?.length || 0 });
});

export default app;