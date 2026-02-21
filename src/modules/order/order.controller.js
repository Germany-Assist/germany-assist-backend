import orderService, { getOrdersForSP } from "../order/order.services.js";
import hashIdUtil from "../../utils/hashId.util.js";
import authUtil from "../../utils/authorize.util.js";
import { sequelize } from "../../configs/database.js";
import notificationQueue from "../../jobs/queues/notification.queue.js";
import { NOTIFICATION_EVENTS } from "../../configs/constants.js";
export async function payOrder(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, ["client"], false);
    const message = await orderService.payOrder(req);
    res.send({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrdersSP(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, [
      "service_provider_rep",
      "service_provider_root",
    ]);
    const orders = await orderService.getOrdersForSP(
      req.auth.relatedId,
      req.query,
    );
    res.send(orders);
  } catch (err) {
    next(err);
  }
}
export async function getOrdersClient(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, ["client"]);
    const orders = await orderService.getOrdersForClient(
      req.auth.id,
      req.query,
    );
    res.send(orders);
  } catch (err) {
    next(err);
  }
}
export async function serviceProviderCloseOrder(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const user = await authUtil.checkRoleAndPermission(req.auth, [
      "service_provider_rep",
      "service_provider_root",
    ]);
    const { orderId } = req.params;

    await orderService.serviceProviderCloseOrder({
      orderId: hashIdUtil.hashIdDecode(orderId),
      auth: req.auth,
      user,
      transaction,
    });
    await notificationQueue.add(NOTIFICATION_EVENTS.ORDER.CLOSED, {
      orderId: hashIdUtil.hashIdDecode(orderId),
    });
    await transaction.commit();
    res.send({
      success: true,
      message:
        "The Order was closed successfully 14 days for the escrow window",
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
}
export async function checkIfUserBoughtService(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, ["client"]);
    const orders = await orderService.checkIfUserBoughtService({
      userId: req.auth.id,
      serviceId: req.params.serviceId,
    });
    res.send(orders);
  } catch (err) {
    next(err);
  }
}

const orderController = {
  serviceProviderCloseOrder,
  checkIfUserBoughtService,
  payOrder,
  getOrdersSP,
  getOrdersClient,
};

export default orderController;
