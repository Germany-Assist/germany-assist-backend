import { sequelize } from "../configs/database.js";
import { disconnectRedis } from "../configs/redis.js";
import { QueueManager } from "../configs/bullMQ.config.js";
import { infoLogger, errorLogger } from "../utils/loggers.js";
import { shutdownCron } from "../cron/index.js";

let isShuttingDown = false;

export async function shutdown(event, server, io) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  infoLogger(`Shutdown initiated: ${event}`);

  try {
    // 1 Stop cron first
    await shutdownCron();

    // 2. Stop Socket.IO connections
    if (io) {
      // Stop accepting new connections
      io.close();

      // Force all existing sockets to disconnect immediately
      for (const [id, socket] of io.sockets.sockets) {
        socket.disconnect(true); // force disconnect
      }

      // Wait a short moment to let disconnect events propagate
      await new Promise((res) => setTimeout(res, 100));
      infoLogger("All sockets disconnected");
    }

    // 3 Stop HTTP server safely
    if (server?.listening) {
      await new Promise((res, rej) =>
        server.close((err) => (err ? rej(err) : res())),
      );
    } else {
      infoLogger("Server not running, skipping server.close()");
    }

    // 4 Stop BullMQ workers & events
    await QueueManager.shutdownAll();

    // 5 Close DB
    await sequelize?.close();

    // 6 Close Redis
    await disconnectRedis();

    infoLogger("Shutdown complete");
    process.exit(0);
  } catch (err) {
    errorLogger("Shutdown failed", err);
    process.exit(1);
  }
}
