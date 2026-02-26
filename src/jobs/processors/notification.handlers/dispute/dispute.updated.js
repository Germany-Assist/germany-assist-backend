import { sequelize } from "../../../../configs/database.js";
import db from "../../../../database/index.js";
import { disputeEmail } from "../../../../services/email/templates/disputeTemplate.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { AppError } from "../../../../utils/error.class.js";
import { errorLogger } from "../../../../utils/loggers.js";
import emailQueue from "../../../../jobs/queues/email.queue.js";

//on any update
export default async function handleDisputeUpdated({
  disputeId,
  status,
  resolution,
}) {
  const transaction = await sequelize.transaction();

  try {
    const hashedDisputeId = hashIdUtil.hashIdEncode(disputeId);
    const dispute = await db.Dispute.findOne({
      where: { id: disputeId },
      include: [
        { model: db.Order, attributes: ["id"] },
        { model: db.User, attributes: ["id", "email"] },
        { model: db.ServiceProvider, attributes: ["id", "email", "name"] },
      ],
    });

    if (!dispute) {
      throw new AppError(404, `Dispute ${hashedDisputeId} not found`, true);
    }

    const hashedOrderId = hashIdUtil.hashIdEncode(dispute.Order.id);
    const providerMessage = `Update for dispute ${hashedDisputeId} for order "${hashedOrderId} the dispute was ${status} ${resolution ? `with resolution ${resolution}` : ""}.`;

    const userEmailHtml = disputeEmail({
      title: `Dispute Update ${status}`,
      recipientName: dispute.User.email,
      message: providerMessage,
      orderId: hashedOrderId,
      disputeId: hashedDisputeId,
    });

    const providerEmailHtml = disputeEmail({
      title: `Dispute Update ${status}`,
      recipientName: dispute.ServiceProvider.name || dispute.ServiceProvider.email,
      message: providerMessage,
      orderId: hashedOrderId,
      disputeId: hashedDisputeId,
    });

    const providerNotification = await db.Notification.create(
      {
        message: providerMessage,
        url: "",
        type: "info",
        serviceProviderId: dispute.ServiceProvider.id,
      },
      { transaction },
    );

    const adminNotification = await db.Notification.create(
      {
        message: providerMessage,
        url: "",
        type: "info",
        isAdmin: true,
      },
      { transaction },
    );

    const userNotification = await db.Notification.create(
      {
        message: providerMessage,
        url: "",
        type: "info",
        userId: dispute.User.id,
      },
      { transaction },
    );

    await transaction.commit();

    socketNotificationServices.sendSocketNotificationToProvider(
      dispute.ServiceProvider.id,
      {
        id: hashIdUtil.hashIdEncode(providerNotification.id),
        message: providerMessage,
      },
    );

    socketNotificationServices.sendSocketNotificationAdmin({
      id: hashIdUtil.hashIdEncode(adminNotification.id),
      message: providerMessage,
    });

    socketNotificationServices.sendSocketNotification(dispute.User.id, {
      id: hashIdUtil.hashIdEncode(userNotification.id),
      message: providerMessage,
    });

    // Queue emails
    emailQueue.add("sendEmail", {
      to: dispute.ServiceProvider.email,
      subject: "Dispute Updated - Germany Assist",
      html: providerEmailHtml,
    });
    emailQueue.add("sendEmail", {
      to: dispute.User.email,
      subject: "Dispute Updated - Germany Assist",
      html: userEmailHtml,
    });

  } catch (externalError) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    errorLogger("Failed handling dispute update:", externalError);
    throw externalError;
  }

  return { success: true };
}
