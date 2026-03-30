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

const buildRecipientFilters = (recipientId, userType) => {
  const filters = {};

  if (userType === "client") {
    filters.userId = recipientId;
  }

  if (
    userType === "service_provider_root" ||
    userType === "service_provider_rep"
  ) {
    filters.serviceProviderId = recipientId;
  }

  return filters;
};

export const updateRead = async ({
  recipientId,
  userType,
  notificationIds,
  all = false,
  markAs = "read",
}) => {
  const filters = buildRecipientFilters(recipientId, userType);
  const isRead = markAs === "read" ? true : false;
  if (all) {
    return await notificationRepository.updateRead(filters, isRead);
  }
  if (!notificationIds || notificationIds.length === 0) {
    throw new AppError(400, "notificationIds are required", true);
  }

  const decodedNotificationIds = notificationIds.map((id) =>
    hashIdUtil.hashIdDecode(id),
  );

  filters.id = decodedNotificationIds;
  console.log(isRead);
  const result = await notificationRepository.updateRead(filters, isRead);

  if (!result[0]) {
    throw new AppError(
      404,
      "Notification not found",
      true,
      "Notification not found",
    );
  }

  return result;
};

const notificationServices = { getAll, updateRead };
export default notificationServices;
