import express from "express";
import { createTask } from "../../controller/task.controller.js";

export const taskRoutes = express.Router();

taskRoutes.post("/", createTask);
