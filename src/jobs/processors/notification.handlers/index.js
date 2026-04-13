import { NOTIFICATION_EVENTS } from "../../../configs/constants.js";

// Service
import handleServiceCreated from "./service/service.created.js";
import handleRequestedReview from "./service/service.requestedReview.js";
import handleServiceApproved from "./service/service.approved.js";
import handleServiceRejected from "./service/service.rejected.js";
import handleServicePaused from "./service/service.paused.js";
import handleServiceResumed from "./service/service.resumed.js";
// Order
import handleOrderRefunded from "./order/order.refunded.js";
import handleOrderActive from "./order/order.active.js";
import handleOrderClosed from "./order/order.closed.js";
import handleOrderCompleted from "./order/order.completed.js";
import handleOrderCanceled from "./order/order.canceled.js";
// import handleOrderRejected from "./order/order.rejected.js";
// import handleOrderAccepted from "./order/order.accepted.js";

// Dispute
import handleDisputeRaised from "./dispute/dispute.raised.js";
import handleDisputeUpdated from "./dispute/dispute.updated.js";

export const handlers = {
  // Service
  // draft creation or direct request to publish will be realized from the service in the handler
  [NOTIFICATION_EVENTS.SERVICE.CREATED]: handleServiceCreated,
  [NOTIFICATION_EVENTS.SERVICE.REQUESTED_REVIEW]: handleRequestedReview,
  [NOTIFICATION_EVENTS.SERVICE.APPROVED]: handleServiceApproved,
  [NOTIFICATION_EVENTS.SERVICE.REJECTED]: handleServiceRejected,
  [NOTIFICATION_EVENTS.SERVICE.PAUSED]: handleServicePaused,
  [NOTIFICATION_EVENTS.SERVICE.RESUMED]: handleServiceResumed,
  //UPDATED
  // ,
  // [NOTIFICATION_EVENTS.SERVICE.UNPUBLISHED]: handleServiceUnpublished,

  // Order
  [NOTIFICATION_EVENTS.ORDER.REFUNDED]: handleOrderRefunded,
  [NOTIFICATION_EVENTS.ORDER.ACTIVE]: handleOrderActive,
  [NOTIFICATION_EVENTS.ORDER.CLOSED]: handleOrderClosed,
  [NOTIFICATION_EVENTS.ORDER.COMPLETED]: handleOrderCompleted,
  [NOTIFICATION_EVENTS.ORDER.CANCELED]: handleOrderCanceled,
  // [NOTIFICATION_EVENTS.ORDER.REJECTED]: handleOrderRejected,
  // [NOTIFICATION_EVENTS.ORDER.ACCEPTED]: handleOrderAccepted,

  // Dispute
  [NOTIFICATION_EVENTS.DISPUTE.RAISED]: handleDisputeRaised,
  [NOTIFICATION_EVENTS.DISPUTE.UPDATED]: handleDisputeUpdated,
};
