import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import { orderStatusEmail } from "../../../../services/email/templates/orderStatusEmail.js";
import emailQueue from "../../../../jobs/queues/email.queue.js";

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

  if (!order || !order.User || !order.ServiceProvider || !order.Service) {
    throw new Error(`Order ${orderId} or its relations (User/ServiceProvider/Service) not found`);
  }

  const hashedOrderId = hashIdUtil.hashIdEncode(orderId);

  const providerMessage = `Successfully rejected order ${hashedOrderId} of service "${order.Service.title}".`;

  const userMessage = `The service provider ${order.ServiceProvider.name} rejected your order "${order.Service.title}". please be patient while we process the request and handle the financial situation`;

  const transaction = await sequelize.transaction();

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

    await transaction.commit();

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

    // Queue emails
    await Promise.all([
      emailQueue.add("sendEmail", {
        to: order.ServiceProvider.email,
        subject: "Order Was Rejected - Germany Assist",
        html: providerEmailHtml,
      }),
      emailQueue.add("sendEmail", {
        to: order.User.email,
        subject: "Your Order Has Been rejected - Germany Assist",
        html: userEmailHtml,
      }),
    ]);
    } catch (externalError) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    errorLogger("Failed handling order rejection:", externalError);
    throw externalError;
    }

  return { success: true };
}

export default handleOrderRejected;
