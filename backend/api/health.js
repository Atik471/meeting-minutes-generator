import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { corsOptions } from "../src/cors.js";

dotenv.config();

const app = express();

app.use(cors(corsOptions));
app.use((req, res, next) => {
  req.url = "/";
  next();
});

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend server is running" });
});

export default app;