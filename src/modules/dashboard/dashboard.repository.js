import { Op } from "sequelize";
import db from "../../database/index.js";

export async function totalGross(filters) {
  return await db.Order.sum("amount", {
    where: {
      status: ["active", "pending_completion", "completed"],
      ...filters,
    },
  });
}
export async function totalEscrow(filters) {
  return await db.Order.sum("amount", {
    where: {
      status: ["pending_completion"],
      ...filters,
    },
  });
}

export async function disputes(filters) {
  return await db.Order.count({
    where: {
      status: ["pending_completion"],
      ...filters,
    },
    include: [
      {
        model: db.Dispute,
        where: { status: { [Op.in]: ["open", "in_review"] } },
        require: true,
        attributes: [],
      },
    ],
  });
}
export async function totalBalance(filters) {
  return await db.Payout.sum("amountToPay", {
    where: {
      status: ["pending"],
      ...filters,
    },
  });
}
export async function totalServices() {
  return await db.Service.count();
}
export async function totalLiveServices() {
  return await db.Service.count({
    where: { status: "approved" },
  });
}
export async function totalPendingServices() {
  return await db.Service.count({
    where: { status: "pending" },
  });
}
export async function totalRejectedServices() {
  return await db.Service.count({
    where: { status: "rejected" },
  });
}

const dashboardRepository = {
  totalGross,
  disputes,
  totalBalance,
  totalEscrow,
  totalServices,
  totalLiveServices,
  totalPendingServices,
  totalRejectedServices,
};
export default dashboardRepository;
