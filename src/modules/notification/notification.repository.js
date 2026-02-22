import db from "../../database/index.js";
/**
 * Retrieves all notifications for a given recipient.
 *
 * @param {string} id - the id of the recipient
 * @returns {Promise<Array<Object>>} - an array of notifications
 */
export const getAll = async (id, limit = 10, offset = 0) => {
  const { rows, count } = await db.Notification.findAndCountAll({
    where: { recipientId: id, isRead: false },
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
export const updateRead = async (id, recipientId) => {
  await db.Notification.update(
    { isRead: true },
    {
      where: { id, recipientId },
    },
  );
};
const metaRepository = { getAll, updateRead };
export default metaRepository;
