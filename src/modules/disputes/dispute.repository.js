import db from "../../database/index.js";
import { AppError } from "../../utils/error.class.js";

export function create(data) {
  return db.Dispute.create(data);
}

export function findById(id) {
  return db.Dispute.findByPk(id);
}

export async function findAll({ page = 1, limit = 20, filters }) {
  const offset = (page - 1) * limit;
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.orderId) where.orderId = filters.orderId;
  if (filters.resolution) where.resolution = filters.resolution;
  if (filters.userId) where.userId = filters.userId;
  if (filters.serviceProviderId)
    where.serviceProviderId = filters.serviceProviderId;
  const { rows, count } = await db.Dispute.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [["createdAt", "DESC"]],
  });
  return {
    meta: {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
    },
    rows,
  };
}

export async function updateDispute(filters, updates) {
  const dispute = await db.Dispute.findOne({ where: filters });
  if (!dispute)
    throw new AppError(404, "Dispute not found", false, "Dispute not found");
  await dispute.update(updates);
  return dispute;
}
const disputeRepository = {
  create,
  findById,
  findAll,
  updateDispute,
};

export default disputeRepository;
