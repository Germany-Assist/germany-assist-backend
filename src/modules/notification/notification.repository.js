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

export const updateRead = async (filters, isRead = true) => {
  return await db.Notification.update(
    { isRead },
    {
      where: filters,
    },
  );
};
const metaRepository = { getAll, updateRead };
export default metaRepository;
