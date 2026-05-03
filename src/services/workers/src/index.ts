import { Job, Worker } from "bullmq";

import { connection } from "./libs/connections.js";
import { JobType } from "./libs/job-types.js";

console.log("worker started");

const worker = new Worker(
  "tasks",
  async (job: Job) => {
    switch (job.name) {
      case JobType.TASK:
        console.log("Processing task:", job.data);
        break;
    }
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} done`);
});
