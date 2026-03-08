import { AppError } from "../../utils/error.class.js";
import hashIdUtil from "../../utils/hashId.util.js";
import notificationRepository from "./notification.repository.js";

export const getAll = async (id, userType, query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 100);
  const offset = (page - 1) * limit;
  const filters = {};
  if (
    (userType === "admin" || userType === "super_admin") &&
    query.isAdmin !== undefined
  )
    filters.isAdmin = query.isAdmin === "true";

  if (userType === "client") filters.userId = id;
  if (
    userType === "service_provider_root" ||
    userType === "service_provider_rep"
  )
    filters.serviceProviderId = id;

  if (query.isRead !== "all") {
    filters.isRead = query.isRead === "true";
    if (query.isRead === "false" || query.isRead === undefined)
      filters.isRead = false;
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

export const updateRead = async ({
  recipientId,
  userType,
  notificationIds,
}) => {
  const decodedNotificationIds = notificationIds.map((id) =>
    hashIdUtil.hashIdDecode(id),
  );
  const filters = { id: decodedNotificationIds };
  if (userType === "client") filters.userId = recipientId;
  if (
    userType === "service_provider_root" ||
    userType === "service_provider_rep"
  )
    filters.serviceProviderId = recipientId;
  if (userType === "admin" || userType === "super_admin")
    filters.isAdmin = true;
  const notification = await notificationRepository.updateRead(filters);
  if (!notification[0])
    throw new AppError(
      404,
      "Notification not found",
      true,
      "Notification not found",
    );
  return notification;
};

const notificationServices = { getAll, updateRead };
export default notificationServices;
