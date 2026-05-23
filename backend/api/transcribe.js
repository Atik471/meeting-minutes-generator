import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import transcribeRoute from "../src/transcribeRoute.js";
import { corsOptions } from "../src/cors.js";

dotenv.config();

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
  req.url = "/";
  next();
});
app.use(transcribeRoute);

export default app;