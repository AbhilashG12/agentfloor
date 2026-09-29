import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { LineChart, Line, Tooltip, ResponsiveContainer } from "recharts";

// 1. Define the strict TypeScript contract (matches our Rust Zod schema)
interface SummarizedEvent {
  userId: string;
  sessionId: string;
  source: string;
  summaryText: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  ts: number;
}

export default function App() {
  const [presence, setPresence] = useState<Record<string, SummarizedEvent>>({});
  const [selectedUser, setSelectedUser] = useState<SummarizedEvent | null>(
    null,
  );

  useEffect(() => {
    // Connect to your Express Gateway
    const socket = io("http://localhost:3001");

    socket.on("initial_state", (state: Record<string, string>) => {
      // Parse Redis Hash strings back to JSON objects
      const parsed = Object.keys(state).reduce(
        (acc, key) => {
          acc[key] = JSON.parse(state[key]);
          return acc;
        },
        {} as Record<string, SummarizedEvent>,
      );

      setPresence(parsed);
    });

    socket.on("presence_update", (event: SummarizedEvent) => {
      setPresence((prev) => ({ ...prev, [event.userId]: event }));

      // Update the side panel instantly if we are currently inspecting this user
      setSelectedUser((prev) => (prev?.userId === event.userId ? event : prev));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Mock data for the sparkline chart (Later, fetch this from Postgres)
  const mockChartData = [
    { time: "10:00", tokens: 1200 },
    { time: "10:05", tokens: 3500 },
    { time: "10:10", tokens: 800 },
  ];

  return (
    <div className="h-screen w-full bg-slate-900 overflow-hidden relative font-sans text-white">
      <h1 className="absolute top-4 left-4 text-2xl font-bold tracking-tight z-10">
        AgentFloor
      </h1>

      {/* The 2D Canvas Area */}
      {Object.values(presence).map((user, index) => (
        <div
          key={user.userId}
          // Hardcoding positions for MVP. Later, tie this to user coordinates.
          className="absolute flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
          style={{ top: `${30 + index * 20}%`, left: `${40 + index * 10}%` }}
          onClick={() => setSelectedUser(user)}
        >
          {/* Speech Bubble */}
          <div className="bg-white text-black px-4 py-2 rounded-xl mb-2 text-sm shadow-xl max-w-xs text-center relative animate-fade-in">
            {user.summaryText}
            {/* Bubble Tail */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45"></div>
          </div>

          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-xl shadow-lg">
            🧑‍💻
          </div>
          <span className="mt-2 text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
            Dev {index + 1}
          </span>
        </div>
      ))}

      {/* Analytics Modal (Side Panel) */}
      {selectedUser && (
        <div className="absolute right-0 top-0 h-full w-96 bg-slate-800 border-l border-slate-700 p-6 shadow-2xl z-20 transition-transform">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Session Analytics</h2>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 mb-6 border border-slate-700">
            <p className="text-sm text-slate-400 mb-1">Current Action</p>
            <p className="text-sm font-medium">{selectedUser.summaryText}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400">Tokens Burned</p>
              <p className="text-xl font-mono mt-1">
                {selectedUser.tokensIn + selectedUser.tokensOut}
              </p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400">Est. Cost</p>
              <p className="text-xl font-mono text-emerald-400 mt-1">
                ${selectedUser.costUsd.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="h-48 w-full mt-4">
            <p className="text-xs text-slate-400 mb-2">
              Token Usage (Last Hour)
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                  }}
                  itemStyle={{ color: "#c7d2fe" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
