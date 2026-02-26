import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { disputeEmail } from "../../../../services/email/templates/disputeTemplate.js";
import { AppError } from "../../../../utils/error.class.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import { sequelize } from "../../../../configs/database.js";
import emailQueue from "../../../../jobs/queues/email.queue.js";

//only on creation
export default async function handleDisputeRaised({ disputeId }) {
  const transaction = await sequelize.transaction();

  try {
    const dispute = await db.Dispute.findOne({
      where: { id: disputeId },
      include: [
        { model: db.Order, attributes: ["id"] },
        { model: db.User, attributes: ["id", "email"] },
        { model: db.ServiceProvider, attributes: ["id", "email", "name"] },
      ],
    });

    if (!dispute) {
      throw new AppError(404, `Dispute ${disputeId} not found`, true);
    }

    const hashedDisputeId = hashIdUtil.hashIdEncode(disputeId);
    const hashedOrderId = hashIdUtil.hashIdEncode(dispute.Order.id);
    const message = `A new dispute ${hashedDisputeId} was raised for order "${hashedOrderId}".`;

    const userEmailHtml = disputeEmail({
      title: `Dispute Raised`,
      recipientName: dispute.User.email,
      message,
      orderId: hashedOrderId,
      disputeId: hashedDisputeId,
    });

    const providerEmailHtml = disputeEmail({
      title: `Dispute Raised`,
      recipientName:
        dispute.ServiceProvider.name || dispute.ServiceProvider.email,
      message,
      orderId: hashedOrderId,
      disputeId: hashedDisputeId,
    });

    const providerNotification = await db.Notification.create(
      {
        message,
        url: "",
        type: "info",
        serviceProviderId: dispute.ServiceProvider.id,
        metadata: {
          disputeId: dispute.id,
        },
      },
      { transaction },
    );

    const adminNotification = await db.Notification.create(
      {
        message,
        url: "",
        type: "info",
        isAdmin: true,
        metadata: {
          disputeId: dispute.id,
        },
      },
      { transaction },
    );

    const userNotification = await db.Notification.create(
      {
        message,
        url: "",
        type: "info",
        userId: dispute.User.id,
        metadata: {
          disputeId: dispute.id,
        },
      },
      { transaction },
    );

    await transaction.commit();

    socketNotificationServices.sendSocketNotificationToProvider(
      dispute.ServiceProvider.id,
      {
        id: hashIdUtil.hashIdEncode(providerNotification.id),
        message,
      },
    );

    socketNotificationServices.sendSocketNotificationAdmin({
      id: hashIdUtil.hashIdEncode(adminNotification.id),
      message,
    });

    socketNotificationServices.sendSocketNotification(dispute.User.id, {
      id: hashIdUtil.hashIdEncode(userNotification.id),
      message,
    });

    // Queue emails
    emailQueue.add("sendEmail", {
      to: dispute.ServiceProvider.email,
      subject: "Dispute Raised - Germany Assist",
      html: providerEmailHtml,
    });
    emailQueue.add("sendEmail", {
      to: dispute.User.email,
      subject: "Dispute Raised - Germany Assist",
      html: userEmailHtml,
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    errorLogger("Failed handling dispute raised:", error);
    throw error;
  }

  return { success: true };
}
