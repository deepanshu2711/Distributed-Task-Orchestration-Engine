import type { Request, Response } from "express";
import { JobType } from "../libs/job-types.js";
import { taskQueue } from "../libs/queues.js";

export async function createTask(req: Request, res: Response) {
  const job = await taskQueue.add(
    JobType.TASK,
    {
      taskId: "123",
      data: req.body,
    },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    },
  );

  res.status(200).json({ jobId: job.id });
}
