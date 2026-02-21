import { func } from "testdouble";
import { getIO } from "../index.js";

export function sendSocketNotification(userId, payload) {
  const io = getIO();
  io.to(`user:${userId}`).emit("notification", JSON.stringify(payload));
}
export function sendSocketNotificationToProvider(providerId, payload) {
  const io = getIO();
  io.to(`provider:${providerId}`).emit("notification", JSON.stringify(payload));
}
export function sendSocketNotificationAdmin(payload) {
  const io = getIO();
  io.to(`admin`).emit("notification", JSON.stringify(payload));
}
export function sendSocketNotificationToUsers(usersIds, payload) {
  const io = getIO();
  usersIds.forEach((id) => {
    io.to(`user:${id}`).emit("notification", JSON.stringify(payload));
  });
}

const socketNotificationServices = {
  sendSocketNotification,
  sendSocketNotificationToUsers,
  sendSocketNotificationToProvider,
  sendSocketNotificationAdmin,
};
export default socketNotificationServices;
