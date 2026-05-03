import type { Request, Response } from "express";
import { pool } from "../libs/pg.js";

export async function createTask(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { taskId, type = "task" } = req.body;

    await client.query("BEGIN");

    const sql = `INSERT INTO tasks (idempotency_key, type, payload, status) VALUES ($1, $2, $3, 'PENDING') ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`;
    const taskResult = await client.query(sql, [taskId, type, req.body]);

    if (taskResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(200).json({
        message: "Task already exists",
        taskId,
      });
    }

    const task = taskResult.rows[0];

    const outbox_sql = `INSERT INTO outbox (task_id, event_type, payload) VALUES ($1, $2, $3)`;
    await client.query(outbox_sql, [
      task.id,
      "TASK_CREATED",
      JSON.stringify({ taskId: task.id }),
    ]);

    await client.query("COMMIT");

    res.status(200).json({ taskId: task.id });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
