import hashIdUtil from "../../utils/hashId.util.js";

export function toResponse(dispute) {
  return {
    id: hashIdUtil.hashIdEncode(dispute.id),
    userId: hashIdUtil.hashIdEncode(dispute.userId),
    serviceProviderId: dispute.serviceProviderId,
    orderId: hashIdUtil.hashIdEncode(dispute.orderId),
    status: dispute.status,
    createdAt: dispute.createdAt,
    reason: dispute.reason,
    description: dispute.description,
    resolution: dispute.resolution,
    resolvedAt: dispute.resolvedAt,
  };
}
