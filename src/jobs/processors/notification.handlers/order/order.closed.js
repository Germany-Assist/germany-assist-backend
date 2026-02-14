import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import emailService from "../../../../services/email/email.service.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { closedOrderEmail } from "../../../../services/email/templates/closedOrderEmail.js";
import { errorLogger } from "../../../../utils/loggers.js";

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

  try {
    await db.Notification.create(
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

    await db.Notification.create(
      {
        message: providerMessage,
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

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  try {
    // Socket Notifications
    socketNotificationServices.sendSocketNotification(order.User.id, {
      message: userMessage,
    });

    socketNotificationServices.sendSocketNotification(
      order.ServiceProvider.id,
      {
        message: providerMessage,
      },
    );

    // Email Template
    const html = closedOrderEmail({
      orderId: hashedOrderId,
      providerName: order.ServiceProvider.name,
      userEmail: order.User.email,
      serviceTitle: order.Service.title,
    });

    await Promise.all([
      emailService.sendEmail({
        to: order.ServiceProvider.email,
        subject: "Order Successfully Closed - Germany Assist",
        html,
      }),
      emailService.sendEmail({
        to: order.User.email,
        subject: "Your Order Has Been Closed - Germany Assist",
        html,
      }),
    ]);
  } catch (externalError) {
    errorLogger("Post-commit side effects failed:", externalError);
    throw externalError;
  }

  return { success: true };
}

export default handleOrderClosed;
