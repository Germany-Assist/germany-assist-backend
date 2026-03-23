import { sequelize } from "../../configs/database.js";
import {
  AUDIT_LOGS_CONSTANTS,
  NOTIFICATION_EVENTS,
  STRIPE_EVENTS,
} from "../../configs/constants.js";
import { debugLogger, errorLogger, infoLogger } from "../../utils/loggers.js";
import stripeServices from "../../services/stripe.service.js";
import notificationQueue from "../queues/notification.queue.js";
import orderRepository from "../../modules/order/order.repository.js";
import auditLogsRepository from "../../modules/auditLogs/auditLogs.repository.js";
export async function stripeProcessor(job) {
  const startTime = Date.now();
  const event = job.data.event;
  const eventId = event.id;
  try {
    const stripeEvent = await stripeServices.getStripeEvent(eventId);
    if (stripeEvent?.status === "processed") {
      infoLogger(`Event ${eventId} already processed, skipping`);
      return;
    }
    const metadata = event.data.object?.metadata;
    const t = await sequelize.transaction();
    try {
      switch (event.type) {
        case STRIPE_EVENTS.PAYMENT_CREATED: {
          await stripeServices.createStripeEvent(event, "pending");
          infoLogger(`Created stripe event ${event.id}`);
          break;
        }
        case STRIPE_EVENTS.PAYMENT_SUCCESS: {
          const pi = event.data.object;
          if (!metadata) {
            throw new Error(`Missing metadata for Stripe event: ${event.id}`);
          }
          const orderData = {
            amount: pi.amount,
            status: "active",
            userId: metadata.userId,
            serviceId: metadata.serviceId,
            relatedId: metadata.relatedId,
            relatedType: metadata.relatedType,
            serviceProviderId: metadata.serviceProviderId,
            stripePaymentIntentId: pi.id,
            currency: "usd",
          };
          const order = await orderRepository.createOrder(orderData, t);
          const logData = {
            orderId: order.id,
            action: AUDIT_LOGS_CONSTANTS.ORDER_CREATE,
            reason: STRIPE_EVENTS.PAYMENT_SUCCESS,
            newValue: order.toJSON(),
            actorType: "system",
          };
          await auditLogsRepository.createNewLogRecord(logData, t);
          await notificationQueue.add(
            NOTIFICATION_EVENTS.ORDER.ACTIVE,
            orderData,
          );
          break;
        }
        case STRIPE_EVENTS.PAYMENT_FAILED: {
          debugLogger(`Payment Failed: ${event.id}`);
          break;
        }
        default:
          debugLogger(`Unhandled Stripe event: ${event.type} - ${event.id}`);
      }
      await stripeServices.updateStripeEvent(event.id, "processed", t);
      await t.commit();
      const processingTime = Date.now() - startTime;
      infoLogger(`Job ${job.id} completed in ${processingTime}ms`);
    } catch (err) {
      if (t && !t.finished) {
        await t.rollback();
      }
      errorLogger(err);
      throw err;
    }
  } catch (err) {
    errorLogger(`Job ${job.id} failed:`, err);
    throw err;
  }
}
export default stripeProcessor;
