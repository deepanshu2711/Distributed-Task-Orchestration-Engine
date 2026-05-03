import { Queue } from "bullmq";
import { connection } from "./connections.js";

export const taskQueue = new Queue("tasks", {
  connection,
});
