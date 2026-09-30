import { Kafka } from "kafkajs";
import { Pool } from "pg";
import express from "express";

const pool = new Pool({
  connectionString:
    "postgres://agentfloor:password@localhost:5432/agentfloor_db",
});
const kafka = new Kafka({
  clientId: "api-gateway",
  brokers: ["localhost:9092"],
});
const producer = kafka.producer();
const app = express();
// 1. The HTTP Endpoint (Write to DB + Outbox atomically)
app.post("/api/v1/events", async (req, res) => {
  const event = req.body; // Assume Zod validated
  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // Start Transaction

    // Insert actual event
    await client.query(
      `INSERT INTO agent_events (user_id, summary_text, tokens_in, cost_usd) VALUES ($1, $2, $3, $4)`,
      [event.userId, event.summaryText, event.tokensIn, event.costUsd],
    );

    // Insert into Outbox for Kafka
    await client.query(
      `INSERT INTO outbox (topic, payload, status) VALUES ($1, $2, 'PENDING')`,
      ["agent.events.summarized", JSON.stringify(event)],
    );

    await client.query("COMMIT"); // Atomic success
    res.status(200).send({ success: true });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).send({ error: "Database transaction failed" });
  } finally {
    client.release();
  }
});

// 2. The Background Relay (Outbox -> Kafka)
async function startOutboxRelay() {
  await producer.connect();

  setInterval(async () => {
    const { rows } = await pool.query(
      `SELECT * FROM outbox WHERE status = 'PENDING' LIMIT 50`,
    );
    if (rows.length === 0) return;

    for (const row of rows) {
      try {
        await producer.send({
          topic: row.topic,
          messages: [
            { value: row.payload, key: JSON.parse(row.payload).userId },
          ], // Key by userId to guarantee order
        });

        // Mark as processed only AFTER successful publish
        await pool.query(
          `UPDATE outbox SET status = 'PROCESSED' WHERE id = $1`,
          [row.id],
        );
      } catch (err) {
        console.error("Kafka publish failed, will retry next tick", err);
        break; // Stop processing this batch
      }
    }
  }, 2000); // Poll every 2 seconds
}
startOutboxRelay();
