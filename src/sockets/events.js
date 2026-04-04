import db from "../database/index.js";
import { errorLogger } from "../utils/loggers.js";

// src/sockets/events.js
export function registerEvents(socket, io) {
  if (!socket.auth || !socket.auth.id) {
    errorLogger(
      `Socket ${socket.id} attempted to connect without valid auth data.`,
    );
    return socket.disconnect(true);
  }

  socket.join(`user:${socket.auth.id}`);

  if (socket.auth.role === "admin" || socket.auth.role === "super_admin") {
    socket.join(`admin`);
  } else if (
    socket.auth.role === "service_provider_root" ||
    socket.auth.role === "service_provider_rep"
  ) {
    socket.join(`provider:${socket.auth.relatedId}`);
  }

  socket.on("markNotificationAsRead", async ({ id: notificationId }) => {
    try {
      await db.Notification.update(
        { isRead: true },
        { where: { id: notificationId, userId: socket.auth.id } },
      );
    } catch (error) {
      errorLogger(error);
    }
  });
  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
}
