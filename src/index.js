import "./utils/loggers.js";
import "./jobs/index.js";
import { server, io } from "./server.js";
import { startup } from "./bootstrap/startup.js";
import { shutdown } from "./bootstrap/shutdown.js";
import {
  SERVER_PORT,
  NODE_ENV,
  ENV_IS_LOADED,
} from "./configs/serverConfig.js";
import { infoLogger, errorLogger } from "./utils/loggers.js";

if (NODE_ENV !== "test") {
  server.listen(SERVER_PORT, async () => {
    try {
      if (!ENV_IS_LOADED) throw new Error("Env not loaded");

      await startup();

      infoLogger(`🚀 Server running on port ${SERVER_PORT}`);
      infoLogger(`🏗️  Mode: ${NODE_ENV}`);
      process.on("SIGINT", () => shutdown("SIGINT", server, io));
      process.on("SIGTERM", () => shutdown("SIGTERM", server, io));
      process.on("uncaughtException", (e) =>
        shutdown("uncaughtException", server, io, e),
      );
      process.on("unhandledRejection", (r) =>
        shutdown("unhandledRejection", server, io, r),
      );
    } catch (err) {
      errorLogger(err);
      await shutdown("Startup failure", server, io);
    }
  });
}
