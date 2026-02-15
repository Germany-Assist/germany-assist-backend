import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import emailService from "../../../../services/email/email.service.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import { orderStatusEmail } from "../../../../services/email/templates/orderStatusEmail.js";
// called by the provider when the order is rejected
// might be called from the system if there was a window to accept orders
async function handleOrderRejected({ orderId }) {
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

  const providerMessage = `Successfully rejected order ${hashedOrderId} of service "${order.Service.title}".`;

  const userMessage = `The service provider ${order.ServiceProvider.name} rejected your order "${order.Service.title}". please be patient while we process the request and handle the financial situation`;

  const transaction = await sequelize.transaction();

  try {
    await db.Notification.create(
      {
        message: userMessage,
        url: "",
        type: "info",
        recipientId: order.User.id,
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
    title: "Order Was Rejected",
    recipientName: order.ServiceProvider.name,
    mainMessage: providerMessage,
    orderId: hashedOrderId,
    serviceTitle: order.Service.title,
    paidBy: order.User.email,
  });

  const userEmailHtml = orderStatusEmail({
    title: "Your Order Has Been Rejected by the provider",
    recipientName: order.User.email,
    mainMessage: userMessage,
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
        subject: "Order Was Rejected - Germany Assist",
        html: providerEmailHtml,
      }),
      emailService.sendEmail({
        to: order.User.email,
        subject: "Your Order Has Been rejected - Germany Assist",
        html: userEmailHtml,
      }),
    ]);
  } catch (externalError) {
    errorLogger("Post-commit side effects failed:", externalError);
    throw externalError;
  }

  return { success: true };
}

export default handleOrderRejected;
