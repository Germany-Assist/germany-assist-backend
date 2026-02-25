import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import emailService from "../../../../services/email/email.service.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import { orderStatusEmail } from "../../../../services/email/templates/orderStatusEmail.js";
// called only when admin triggers refund
async function handleOrderRefunded({ orderId }) {
  if (!orderId) {
    throw new Error("orderId is required");
  }
  const order = await db.Order.findOne({
    where: { id: orderId },
    include: [
      { model: db.User, attributes: ["id", "email"] },
      { model: db.ServiceProvider, attributes: ["id", "email", "name"] },
      { model: db.Service, attributes: ["id", "title"] },
    ],
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const hashedOrderId = hashIdUtil.hashIdEncode(orderId);

  const providerMessage = `Order ${hashedOrderId} of service "${order.Service.title}" Was refunded.`;

  const userMessage = `Order ${hashedOrderId} of service "${order.Service.title}" Was refunded.`;

  const transaction = await sequelize.transaction();

  const providerEmailHtml = orderStatusEmail({
    title: "Order Refunded",
    recipientName: order.ServiceProvider.name,
    mainMessage: providerMessage,
    orderId: hashedOrderId,
    serviceTitle: order.Service.title,
    paidBy: order.User.email,
  });

  const userEmailHtml = orderStatusEmail({
    title: "Your Order Has Been Refunded",
    recipientName: order.User.email,
    mainMessage: userMessage,
    orderId: hashedOrderId,
    serviceTitle: order.Service.title,
  });

  try {
    const userNotification = await db.Notification.create(
      {
        message: userMessage,
        url: "",
        type: "info",
        userId: order.User.id,
        metadata: {
          serviceProviderId: order.ServiceProvider.id,
          serviceId: order.Service.id,
          orderId,
        },
      },
      { transaction },
    );

    const providerNotification = await db.Notification.create(
      {
        message: providerMessage,
        url: "",
        type: "info",
        serviceProviderId: order.ServiceProvider.id,
        metadata: {
          serviceProviderId: order.ServiceProvider.id,
          serviceId: order.Service.id,
          orderId,
        },
      },
      { transaction },
    );

    socketNotificationServices.sendSocketNotification(order.User.id, {
      id: hashIdUtil.hashIdEncode(userNotification.id),
      message: userMessage,
    });

    socketNotificationServices.sendSocketNotificationToProvider(
      order.ServiceProvider.id,
      {
        id: hashIdUtil.hashIdEncode(providerNotification.id),
        message: providerMessage,
      },
    );

    await Promise.all([
      emailService.sendEmail({
        to: order.ServiceProvider.email,
        subject: "Order Refunded - Germany Assist",
        html: providerEmailHtml,
      }),
      emailService.sendEmail({
        to: order.User.email,
        subject: "Your Order Has Been Refunded - Germany Assist",
        html: userEmailHtml,
      }),
    ]);
    await transaction.commit();
  } catch (externalError) {
    await transaction.rollback();
    errorLogger("Post-commit side effects failed:", externalError);
    throw externalError;
  }

  return { success: true };
}

export default handleOrderRefunded;
