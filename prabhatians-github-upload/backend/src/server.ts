import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";

async function start() {
  const app = createApp();
  const server = app.listen(env.PORT, () => console.log(`PRABHATIANS API listening on http://localhost:${env.PORT}/api`));
  try { await connectDatabase(); }
  catch (error) { console.error(error instanceof Error ? error.message : "MongoDB connection failed."); }
  const shutdown = async () => { server.close(); await disconnectDatabase(); process.exit(0); };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}
start().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "API startup failed."); process.exitCode = 1; });
