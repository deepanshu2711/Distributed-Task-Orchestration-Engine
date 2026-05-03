import express from "express";
import { taskRoutes } from "./task.routes.js";

export const v1Routes = express.Router();

v1Routes.use("/tasks", taskRoutes);
