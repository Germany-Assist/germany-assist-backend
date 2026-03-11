import { AppError } from "../../utils/error.class.js";
import hashIdUtil from "../../utils/hashId.util.js";
import orderRepository from "../order/order.repository.js";
import disputeRepository from "./dispute.repository.js";
import { NOTIFICATION_EVENTS } from "../../configs/constants.js";
import notificationQueue from "../../jobs/queues/notification.queue.js";
import orderService from "../order/order.services.js";
/**
 * Open a dispute for an order.
 * @param {object} data - data object containing the order id, reason and description.
 * @param {object} auth - auth object containing the user id.
 * @throws {AppError} if the order is invalid or the user is not the buyer.
 * @throws {AppError} if the order status is not active or pending completion.
 * @returns {Promise<void>}
 */
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
  const dispute = await disputeRepository.create({
    userId: auth.id,
    serviceProviderId: order.serviceProviderId,
    orderId,
    reason: reason,
    description: description,
  });
  notificationQueue.add(NOTIFICATION_EVENTS.DISPUTE.RAISED, {
    disputeId: dispute.id,
  });
}

export async function providerResponse({ body, disputeId, auth }) {
  const filters = {};
  const { response } = body;
  filters.serviceProviderId = auth.relatedId;
  filters.id = disputeId;
  const dispute = await disputeRepository.updateDispute(filters, {
    providerResponse: response,
  });
  notificationQueue.add(NOTIFICATION_EVENTS.DISPUTE.UPDATED, {
    disputeId: dispute.id,
  });
  return dispute;
}
export async function listDisputes(query, auth) {
  const role = auth.role;
  const filters = {
    status: query.status,
    orderId: query.orderId ? hashIdUtil.hashIdDecode(query.orderId) : undefined,
    resolution: query.resolution,
  };

  if (role === "client") {
    filters.userId = auth.id;
    if (query.serviceProviderId)
      filters.serviceProviderId = query.serviceProviderId;
  } else if (
    role === "service_provider_root" ||
    role === "service_provider_rep"
  ) {
    filters.serviceProviderId = auth.relatedId;
    if (query.userId)
      filters.userId = query.userId
        ? hashIdUtil.hashIdDecode(query.userId)
        : undefined;
  } else if (role === "admin" || role === "super_admin") {
    if (query.userId) filters.userId = hashIdUtil.hashIdDecode(query.userId);
    if (query.serviceProviderId)
      filters.serviceProviderId = query.serviceProviderId;
  } else {
    throw new AppError(403, "Unauthorized", false, "Unauthorized");
  }
  const result = await disputeRepository.findAll({
    page: query.page,
    limit: query.limit,
    filters,
  });

  return result;
}

export async function markInReview(id, user) {
  const dispute = await disputeRepository.findById(id);
  if (!dispute)
    throw new AppError(404, "Dispute not found", true, "Dispute not found");
  if (dispute.status !== "open") {
    throw new AppError(
      403,
      "Only open disputes can be reviewed",
      false,
      "Only open disputes can be reviewed",
    );
  }
  dispute.status = "in_review";
  await dispute.save();
  notificationQueue.add(NOTIFICATION_EVENTS.DISPUTE.UPDATED, {
    disputeId: dispute.id,
    status: "in_review",
  });
  return dispute;
}

export async function resolveDispute(disputeId, resolution) {
  const validResolutions = ["buyer_won", "provider_won", "cancelled"];
  if (!validResolutions.includes(resolution)) {
    throw new Error("Invalid resolution");
  }
  const filters = { id: disputeId };
  const dispute = await disputeRepository.updateDispute(filters, {
    status: "resolved",
    resolution,
  });
  notificationQueue.add(NOTIFICATION_EVENTS.DISPUTE.UPDATED, {
    disputeId: dispute.id,
    status: "resolved",
    resolution,
  });
  // i should update the order status and flow
  return dispute;
}
export async function cancelDispute(disputeId, clientId) {
  const filters = { id: disputeId, userId: clientId };
  const dispute = await disputeRepository.updateDispute(filters, {
    status: "resolved",
    resolution: "cancelled",
  });
  notificationQueue.add(NOTIFICATION_EVENTS.DISPUTE.UPDATED, {
    disputeId: dispute.id,
    status: "resolved",
    resolution: "cancelled",
  });
  return;
}
const disputeService = {
  resolveDispute,
  markInReview,
  listDisputes,
  openDispute,
  cancelDispute,
  providerResponse,
};
export default disputeService;
