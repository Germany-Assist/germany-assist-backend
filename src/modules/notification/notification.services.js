import hashIdUtil from "../../utils/hashId.util.js";
import notificationRepository from "./notification.repository.js";

export const getAll = async (id, page = 0, limit = 10) => {
  const offset = (page - 1) * limit;
  const [rows, count] = await notificationRepository.getAll(id, limit, offset);
  const metadata = {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
  const sanitizedNotifications = rows.map((notification) => {
    return {
      id: hashIdUtil.hashIdEncode(notification.id),
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  });
  return { notifications: sanitizedNotifications, metadata };
};
/**
 * Updates the read status of a notification.
 *
 * @param {string} recipientId - the id of the recipient
 * @returns {Promise<void>} - a promise that resolves when the operation is complete
 */
export const updateRead = async ({ recipientId, notificationId }) => {
  const notificationIdDecoded = hashIdUtil.hashIdDecode(notificationId);
  const notification = await notificationRepository.updateRead(
    notificationIdDecoded,
    recipientId,
  );
  return notification;
};

const notificationServices = { getAll, updateRead };
export default notificationServices;
