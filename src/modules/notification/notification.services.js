import hashIdUtil from "../../utils/hashId.util.js";
import notificationRepository from "./notification.repository.js";

export const getAll = async (id, query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 100);
  const offset = (page - 1) * limit;
  const filters = {};
  filters.recipientId = id;
  if (query.isRead !== undefined) {
    filters.isRead = query.isRead === "true";
  }
  const [rows, count] = await notificationRepository.getAll(
    limit,
    offset,
    filters,
  );
  const meta = {
    total: count,
    page,
    limit,
    pages: Math.ceil(count / limit),
  };
  const sanitizedNotifications = rows.map((notification) => {
    return {
      id: hashIdUtil.hashIdEncode(notification.id),
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  });
  return { notifications: sanitizedNotifications, meta };
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
