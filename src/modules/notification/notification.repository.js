import db from "../../database/index.js";

export const getAll = async (limit = 10, offset = 0, filters) => {
  const { rows, count } = await db.Notification.findAndCountAll({
    where: { ...filters },
    attributes: ["id", "message", "isRead", "createdAt"],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
  return [rows, count];
};
/**
 * Updates the read status of a notification.
 *
 * @param {string} id - the id of the notification
 * @param {string} recipientId - the id of the recipient
 * @returns {Promise<void>} - a promise that resolves when the operation is complete
 */
export const updateRead = async (filters) => {
  return await db.Notification.update(
    { isRead: true },
    {
      where: filters,
    },
  );
};
const metaRepository = { getAll, updateRead };
export default metaRepository;
