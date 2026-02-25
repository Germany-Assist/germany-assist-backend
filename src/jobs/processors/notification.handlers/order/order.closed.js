import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import emailService from "../../../../services/email/email.service.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import { orderStatusEmail } from "../../../../services/email/templates/orderStatusEmail.js";

// triggered when the provider closes onetime order
// triggered when the job closes the timeline order

async function handleOrderClosed({ orderId }) {
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

  const providerMessage = `Successfully closed order ${hashedOrderId} of service "${order.Service.title}". Your money will be released shortly after the holding duration passes with no dispute.`;

  const userMessage = `The service provider ${order.ServiceProvider.name} closed your order ${hashedOrderId} for service "${order.Service.title}". Please open a dispute if needed within the allowed dispute window.`;

  const transaction = await sequelize.transaction();

  const providerEmailHtml = orderStatusEmail({
    title: "Order Successfully completed",
    recipientName: order.ServiceProvider.name,
    mainMessage: providerMessage,
    orderId: hashedOrderId,
    serviceTitle: order.Service.title,
    paidBy: order.User.email,
  });

  const userEmailHtml = orderStatusEmail({
    title: "Your Order Has Been Closed",
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

    // Socket Notifications
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
        subject: "Order Successfully Closed - Germany Assist",
        html: providerEmailHtml,
      }),
      emailService.sendEmail({
        to: order.User.email,
        subject: "Your Order Has Been Closed - Germany Assist",
        html: userEmailHtml,
      }),
    ]);
    await transaction.commit();
  } catch (externalError) {
    errorLogger("Post-commit side effects failed:", externalError);
    await transaction.rollback();
    throw externalError;
  }

  return { success: true };
}

export default handleOrderClosed;
