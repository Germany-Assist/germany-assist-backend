import db from "../../database/index.js";
import { AppError } from "../../utils/error.class.js";
import hashIdUtil from "../../utils/hashId.util.js";
import stripeUtils from "../../utils/stripe.util.js";
import orderRepository from "./order.repository.js";
import { v4 as uuidv4 } from "uuid";
import ordersMapper from "./order.mapper.js";
import { Sequelize } from "sequelize";
import { sequelize } from "../../configs/database.js";
import auditLogsRepository from "../auditLogs/auditLogs.repository.js";
import { AUDIT_LOGS_CONSTANTS } from "../../configs/constants.js";

export async function getOrdersForSP(SPId, filters) {
  const orders = await orderRepository.getOrdersForSP(SPId, filters);
  return { ...orders, data: ordersMapper.sanitizeOrders(orders.data) };
}
async function checkIfUserBoughtService(data) {
  const userId = data.userId;
  const serviceId = hashIdUtil.hashIdDecode(data.serviceId);
  const bought = await orderRepository.checkIfUserBoughtService(
    userId,
    serviceId,
  );
  if (!bought || bought.length < 1) return false;
  return bought.map((i) => hashIdUtil.hashIdEncode(i.relatedId));
}
export async function payOrder(req) {
  const serviceId = hashIdUtil.hashIdDecode(req.query.serviceId);
  const optionId = hashIdUtil.hashIdDecode(req.query.optionId);
  const type = req.query.type;
  const service = await orderRepository.getServiceForPayment({
    serviceId,
    optionId,
    type,
  });
  const metadata = {
    serviceId,
    userId: req.auth.id,
    serviceProviderId: service.serviceProviderId,
    relatedType: type,
    relatedId: optionId,
  };
  const amount =
    type === "timeline" ? service.timelines.price : service.variants.price;
  // // in the future subscription may go here
  if (amount === 0) {
    const t = await sequelize.transaction();
    //free service
    const orderData = {
      amount: 0,
      status: "active",
      userId: metadata.userId,
      serviceId: metadata.serviceId,
      serviceProviderId: service.serviceProviderId,
      relatedType: type,
      relatedId: optionId,
      stripePaymentIntentId: uuidv4(),
      currency: "usd",
    };
    const order = await orderRepository.createOrder(orderData, t);
    const logData = {
      orderId: order.id,
      action: AUDIT_LOGS_CONSTANTS.ORDER_CREATE,
      reason: "free service",
      newValue: order.toJSON(),
      actorType: AUDIT_LOGS_CONSTANTS.ACTOR_SYSTEM,
    };
    await auditLogsRepository.createNewLogRecord(logData, t);

    return { success: true };
  } else {
    //paid service
    const pi = await stripeUtils.createPaymentIntent({ amount, metadata });
    return {
      clientSecret: pi.client_secret,
    };
  }
}

export async function serviceProviderCloseOrder({
  orderId,
  auth,
  user,
  transaction,
}) {
  const order = await orderRepository.serviceProviderFindOrder({
    orderId,
    SPID: auth.relatedId,
    transaction,
  });
  if (!order)
    throw new AppError(404, "order not found", false, "something went wrong");
  const logData = {
    orderId: order.id,
    action: AUDIT_LOGS_CONSTANTS.ORDER_UPDATE,
    reason: "Order was closed by the service provider",
    actorSnapshot: user,
    oldValue: order.toJSON(),
    newValue: { ...order.toJSON(), status: "completed" },
    actorType: AUDIT_LOGS_CONSTANTS.ACTOR_PROVIDER,
  };
  await order.update({ status: "pending_completion" }, { transaction });
  await auditLogsRepository.createNewLogRecord(logData, transaction);
  return;
}

export async function getOrdersForClient(userId, filters) {
  const orders = await orderRepository.getOrdersForClient(userId, filters);
  return { ...orders, data: ordersMapper.sanitizeOrders(orders.data) };
}

export const orderService = {
  getOrdersForSP,
  serviceProviderCloseOrder,
  getOrdersForClient,
  payOrder,
  checkIfUserBoughtService,
};
export default orderService;
