import { pool } from "./libs/pg.js";
import { taskQueue } from "./libs/queues.js";

console.log("orchestrator started");

async function relayOutbox() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("🔍 Fetching outbox entries...");

    const { rows: entries } = await client.query(`
      SELECT * FROM outbox
      WHERE published = false
      ORDER BY created_at
      LIMIT 50
      FOR UPDATE SKIP LOCKED
    `);

    if (entries.length === 0) {
      console.log("😴 No outbox entries found");
      await client.query("COMMIT");
      return;
    }

    console.log(`📦 Found ${entries.length} outbox entries`);

    for (const entry of entries) {
      try {
        console.log(`➡️ Processing entry ${entry.id}`);

        const payload = entry.payload;

        await taskQueue.add("TASK", payload, {
          jobId: entry.task_id,
        });

        await client.query(`UPDATE outbox SET published = true WHERE id = $1`, [
          entry.id,
        ]);

        console.log(`✅ Published entry ${entry.id}`);
      } catch (err) {
        console.error(`❌ Failed to process entry ${entry.id}`, err);
      }
    }

    await client.query("COMMIT");
    console.log("✅ Batch committed");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("💥 Transaction failed, rolled back", e);
  } finally {
    client.release();
  }
}

async function startRelay() {
  while (true) {
    await relayOutbox();
    await new Promise((res) => setTimeout(res, 1000));
  }
}

startRelay();
