export const STRIPE_EVENTS = {
  PAYMENT_SUCCESS: "payment_intent.succeeded",
  PAYMENT_CREATED: "payment_intent.created",
  PAYMENT_FAILED: "payment_intent.payment_failed",
};

export const NOTIFICATION_EVENTS = {
  SERVICE: {
    CREATED: "service.created",
    APPROVED: "service.approved",
    REJECTED: "service.rejected",
    PUBLISHED: "service.published",
    UNPUBLISHED: "service.unpublished",
  },
  ORDER: {
    REFUNDED: "order.refunded",
    ACTIVE: "order.active",
    CLOSED: "order.closed",
    COMPLETED: "order.completed",
    REJECTED: "order.rejected",
    CANCELED: "order.canceled",
    ACCEPTED: "order.accepted",
  },
  DISPUTE: {
    RAISED: "dispute.raised",
    UPDATED: "dispute.updated",
    CLOSED: "dispute.closed",
  },
};

export const AUDIT_LOGS_CONSTANTS = {
  ORDER_CREATE: "order.create",
  ORDER_UPDATE: "order.update",
  ORDER_CANCEL: "order.cancel",
  ACTOR_SYSTEM: "system",
  ACTOR_ADMIN: "admin",
  ACTOR_CLIENT: "client",
  ACTOR_PROVIDER: "provider",
};
