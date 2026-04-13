import e from "express";

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
    REQUESTED_REVIEW: "service.requestedReview",
    PAUSED: "service.paused",
    RESUMED: "service.resumed",
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
  },
  ACCOUNT: {
    PASSWORD_RESET: "account.password_reset",
    PASSWORD_CHANGED: "account.password_changed",
    EMAIL_CHANGED: "account.email_changed",
    EMAIL_VERIFIED: "account.email_verified",
    EMAIL_VERIFICATION_SENT: "account.email_verification_sent",
  },
};

export const TOKENS_CONSTANTS = {
  PASSWORD_RESET: "passwordReset",
  EMAIL_VERIFICATION: "emailVerification",
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

export const SERVICES_STATUS = {
  approved: "approved",
  draft: "draft",
  pending: "pending", //provider
  active: "active", //admin
  rejected: "rejected", //admin
  archived: "archived",
};
export const SERVICE_TYPES = {
  oneTime: "oneTime",
  timeline: "timeline",
};

export const ORDER_STATUS = {
  ACTIVE: "active",
  CLOSED: "closed",
  COMPLETED: "completed",
  CANCELED: "canceled",
  REJECTED: "rejected",
  REFUNDED: "refunded",
};

export const SERVICE_ACTIONS = {
  PAUSE: "pause",
  RESUME: "resume",
};
