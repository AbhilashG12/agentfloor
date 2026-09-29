import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { z } from "zod";

const app = express();
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Redis Setup
const redis = createClient({ url: "redis://localhost:6379" });
redis.connect();

// Zod Schema from packages/contracts
const SummarizedEventSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  source: z.string(),
  summaryText: z.string(),
  tokensIn: z.number(),
  tokensOut: z.number(),
  costUsd: z.number(),
  ts: z.number(),
});

// Ingestion Endpoint
app.post("/api/v1/events", async (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== "Bearer dev_api_key_123")
    return res.status(401).send("Unauthorized");

  try {
    // 1. Validate exactly
    const event = SummarizedEventSchema.parse(req.body);
    const teamId = "team_alpha"; // Hardcoded for MVP

    // 2. Update Presence in Redis (Hash: teamId -> userId -> State)
    await redis.hSet(`presence:${teamId}`, event.userId, JSON.stringify(event));

    // 3. (MVP DB Mock) Here you would insert into Postgres using Drizzle

    // 4. Fan-out via WebSockets instantly
    io.emit("presence_update", event);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Invalid payload" });
  }
});

// WebSocket Connection handler
io.on("connection", async (socket) => {
  console.log("Frontend connected");
  // Send current state immediately on load
  const currentPresence = await redis.hGetAll("presence:team_alpha");
  socket.emit("initial_state", currentPresence);
});

httpServer.listen(3001, () => console.log("Gateway running on 3001"));
