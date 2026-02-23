import { AppError } from "../../utils/error.class.js";
import hashIdUtil from "../../utils/hashId.util.js";
import orderRepository from "../order/order.repository.js";
import disputeRepository from "./dispute.repository.js";
import { NOTIFICATION_EVENTS } from "../../configs/constants.js";
import notificationQueue from "../../jobs/queues/notification.queue.js";
export async function openDispute(data, auth) {
  const { description, reason } = data;
  const orderId = hashIdUtil.hashIdDecode(data.orderId);
  // validate the order that exists with the user as a buyer and the is either active or pending completion
  const order = await orderRepository.findOrderById(orderId);
  if (!order) throw new AppError(404, "invalid order", false, "invalid order");
  if (order.userId !== auth.id)
    throw new AppError(403, "invalid buyer", false, "invalid buyer");
  if (order.status !== "active" && order.status !== "pending_completion")
    throw new AppError(404, "invalid action", true, "invalid action");
  await disputeRepository.create({
    userId: auth.id,
    serviceProviderId: order.serviceProviderId,
    orderId,
    reason: reason,
    description: description,
  });
  notificationQueue.add(NOTIFICATION_EVENTS.DISPUTE.RAISED, {
    orderId,
  });
  return;
}

export async function listDisputesProvider(query, auth) {
  const filters = {
    status: query.status,
    orderId: hashIdUtil.hashIdDecode(query.orderId),
    userId: hashIdUtil.hashIdDecode(query.userId),
    status: query.status,
    resolution: query.resolution,
    serviceProviderId: auth.relatedId,
  };
  return disputeRepository.findAllPaginated({
    page: query.page,
    limit: query.limit,
    filters,
  });
}
export async function listDisputesClient(query, auth) {
  const filters = {
    status: query.status,
    orderId: hashIdUtil.hashIdDecode(query.orderId),
    status: query.status,
    resolution: query.resolution,
    serviceProviderId: query.serviceProviderId,
    userId: auth.id,
  };
  return disputeRepository.findAllPaginated({
    page: query.page,
    limit: query.limit,
    filters,
  });
}
export async function listDisputesAdmin(query) {
  const filters = {
    status: query.status,
    orderId: hashIdUtil.hashIdDecode(query.orderId),
    status: query.status,
    resolution: query.resolution,
    serviceProviderId: query.serviceProviderId,
    userId: hashIdUtil.hashIdDecode(query.userId),
  };

  return disputeRepository.findAllPaginated({
    page: query.page,
    limit: query.limit,
    filters,
  });
}
export async function getDisputeById(id, user) {
  const dispute = await disputeRepository.findById(id);
  if (!dispute) throw new Error("Dispute not found");

  if (user.role !== "admin" && dispute.openedBy !== "buyer") {
    throw new Error("Forbidden");
  }

  return dispute;
}

export async function markInReview(id, user) {
  if (user.role !== "admin") throw new Error("Forbidden");

  const dispute = await disputeRepository.findById(id);
  if (!dispute) throw new Error("Dispute not found");

  if (dispute.status !== "open") {
    throw new Error("Only open disputes can be reviewed");
  }

  dispute.status = "in_review";
  await dispute.save();

  return dispute;
}

export async function resolveDispute(id, data, user) {
  if (user.role !== "admin") throw new Error("Forbidden");

  const dispute = await disputeRepository.findById(id);
  if (!dispute) throw new Error("Dispute not found");

  if (dispute.status === "resolved") {
    throw new Error("Dispute already resolved");
  }

  dispute.status = "resolved";
  dispute.resolution = data.resolution;
  dispute.resolvedAt = new Date();

  await dispute.save();
  return dispute;
}

const disputeService = {
  resolveDispute,
  markInReview,
  getDisputeById,
  listDisputesClient,
  listDisputesAdmin,
  listDisputesProvider,
  openDispute,
};
export default disputeService;
