import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import emailService from "../../../../services/email/email.service.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import { orderStatusEmail } from "../../../../services/email/templates/orderStatusEmail.js";
// trigger by user successful cancel
// trigger by provider successful cancel
async function handleOrderCanceled({ orderId }) {
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

  const providerMessage = `Order ${hashedOrderId} of service "${order.Service.title}" has been canceled please note that any cancellation that happens within the window will be refunded.`;

  const userMessage = `Order ${hashedOrderId} for service "${order.Service.title}". has been canceled please note that any cancellation that happens within the window will be refunded.`;

  const transaction = await sequelize.transaction();

  try {
    await db.Notification.create(
      {
        message: userMessage,
        url: "",
        type: "info",
        recipientId: order.User.id,
        recipientType: "user",
        metadata: {
          serviceProviderId: order.ServiceProvider.id,
          serviceId: order.Service.id,
          orderId,
        },
      },
      { transaction },
    );

    await db.Notification.create(
      {
        message: providerMessage,
        url: "",
        type: "info",
        recipientId: order.ServiceProvider.id,
        recipientType: "service_provider",
        metadata: {
          serviceProviderId: order.ServiceProvider.id,
          serviceId: order.Service.id,
          orderId,
        },
      },
      { transaction },
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const providerEmailHtml = orderStatusEmail({
    title: "Order Canceled",
    recipientName: order.ServiceProvider.name,
    mainMessage: `Order ${hashedOrderId} Was Canceled Admins will review and process request for refunds.`,
    orderId: hashedOrderId,
    serviceTitle: order.Service.title,
    paidBy: order.User.email,
  });

  const userEmailHtml = orderStatusEmail({
    title: "Your Order Has Been Canceled",
    recipientName: order.User.email,
    mainMessage: `Admins will review and process request for refunds.`,
    orderId: hashedOrderId,
    serviceTitle: order.Service.title,
  });

  try {
    socketNotificationServices.sendSocketNotification(order.User.id, {
      message: userMessage,
    });

    socketNotificationServices.sendSocketNotification(
      order.ServiceProvider.id,
      {
        message: providerMessage,
      },
    );

    await Promise.all([
      emailService.sendEmail({
        to: order.ServiceProvider.email,
        subject: "Order Canceled - Germany Assist",
        html: providerEmailHtml,
      }),
      emailService.sendEmail({
        to: order.User.email,
        subject: "Order Canceled - Germany Assist",
        html: userEmailHtml,
      }),
    ]);
  } catch (externalError) {
    errorLogger("Post-commit side effects failed:", externalError);
    throw externalError;
  }

  return { success: true };
}

export default handleOrderCanceled;
