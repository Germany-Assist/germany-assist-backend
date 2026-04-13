import { SERVICES_STATUS } from "../../configs/constants.js";
import db from "../../database/index.js";
import { AppError } from "../../utils/error.class.js";
import { Op } from "sequelize";

export async function getOrdersForSP(SPId, filters = {}) {
  // pagination (safe & predictable)
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Number(filters.limit) || 20, 100);
  const offset = (page - 1) * limit;
  // base order filters
  const where = {
    serviceProviderId: SPId,
  };
  // order status filter
  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = ["active", "pending_completion", "completed"];
  }
  // optional order filters
  if (filters.type) {
    where.relatedType = filters.type;
  }
  if (filters.serviceId) {
    where.serviceId = filters.serviceId;
  }
  // ALWAYS include dispute info (1-to-1)
  const include = [
    {
      model: db.Dispute,
      attributes: ["id", "status"],
      required: false, // LEFT JOIN
    },
    {
      model: db.Service,
      attributes: ["title"],
    },
    {
      model: db.Payout,
      required: false,
    },
  ];
  // filter: only disputed orders
  if (filters.onlyDisputed) {
    where["$Dispute.id$"] = { [Op.ne]: null };
  }
  // filter: specific dispute status
  if (filters.disputeStatus) {
    where["$Dispute.status$"] = filters.disputeStatus;
  }
  const { rows, count } = await db.Order.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    data: rows,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getServiceForPayment({ serviceId, optionId, type }) {
  const include = [];
  if (type === "oneTime") {
    include.push({
      model: db.Variant,
      as: "variants",
      where: { id: optionId },
      required: true,
    });
  } else if (type === "timeline") {
    include.push({
      model: db.Timeline,
      as: "timelines",
      where: { id: optionId },
      required: true,
    });
  }
  const service = await db.Service.findOne({
    raw: true,
    nest: true,
    where: { id: serviceId, status: SERVICES_STATUS.approved },
    include,
  });
  if (!service) throw new AppError(500, "failed to find service", false);
  return service;
}

export async function createOrder(data, t) {
  return await db.Order.create(data, {
    transaction: t,
  });
}

export async function serviceProviderFindOrder({ orderId, SPID, transaction }) {
  return await db.Order.findOne({
    where: {
      id: orderId,
      status: "active",
      relatedType: "oneTime",
      serviceProviderId: SPID,
    },
    transaction,
  });
}

export async function getOrdersForClient(userId, filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Number(filters.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const where = {
    userId: userId,
  };
  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = ["active", "pending_completion", "completed"];
  }
  // optional order filters
  if (filters.type) {
    where.relatedType = filters.type;
  }
  if (filters.serviceId) {
    where.serviceId = filters.serviceId;
  }
  const include = [
    {
      model: db.Dispute,
      attributes: ["id", "status"],
      required: false, // LEFT JOIN
    },
    {
      model: db.Service,
      attributes: ["title"],
    },
  ];
  if (filters.onlyDisputed) {
    where["$Dispute.id$"] = { [Op.ne]: null };
  }
  if (filters.disputeStatus) {
    where["$Dispute.status$"] = filters.disputeStatus;
  }
  const { rows, count } = await db.Order.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
  return {
    data: rows,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}
export async function findOrderById(orderId) {
  return await db.Order.findByPk(orderId, { raw: true });
}

export const checkIfUserBoughtService = async (userId, serviceId) => {
  const bought = db.Order.findAll({
    attributes: ["relatedId"],
    where: {
      userId,
      serviceId,
      status: { [Op.in]: ["active", "completed", "pending_completion"] },
    },
  });
  return bought;
};
const orderRepository = {
  serviceProviderFindOrder,
  findOrderById,
  getOrdersForSP,
  getOrdersForClient,
  getServiceForPayment,
  createOrder,
  checkIfUserBoughtService,
};
export default orderRepository;
