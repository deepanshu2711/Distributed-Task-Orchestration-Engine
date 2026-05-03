import express from "express";
import { v1Routes } from "./routes/v1/index.js";

export const app = express();

app.use(express.json());

app.use("/api/v1", v1Routes);
