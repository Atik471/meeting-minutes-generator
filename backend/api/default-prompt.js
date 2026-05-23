import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { SYSTEM_PROMPT } from "../src/utils.js";

dotenv.config();

const app = express();

app.use(cors());
app.use((req, res, next) => {
  req.url = "/";
  next();
});

app.get("/", (req, res) => {
  res.json({ prompt: SYSTEM_PROMPT });
});

export default app;