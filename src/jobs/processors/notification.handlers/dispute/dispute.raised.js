import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { disputeEmail } from "../../../../services/email/templates/disputeTemplate.js";
import { AppError } from "../../../../utils/error.class.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import { sequelize } from "../../../../configs/database.js";
import emailQueue from "../../../../jobs/queues/email.queue.js";

const EMAIL_SUBJECT = "Dispute Raised - Germany Assist";

// only on creation
export default async function handleDisputeRaised({ disputeId }) {
  const transaction = await sequelize.transaction();

  try {
    // ✅ Fetch inside transaction
    const dispute = await db.Dispute.findOne({
      where: { id: disputeId },
      transaction,
      include: [
        { model: db.Order, attributes: ["id"] },
        { model: db.User, attributes: ["id", "email", "name"] },
        {
          model: db.ServiceProvider,
          attributes: ["id", "email", "name"],
        },
      ],
    });

    if (!dispute) {
      throw new AppError(404, `Dispute ${disputeId} not found`, true);
    }

    // ✅ Safety checks
    if (!dispute.Order || !dispute.User || !dispute.ServiceProvider) {
      throw new AppError(500, "Dispute relations missing", true);
    }

    const hashedDisputeId = hashIdUtil.hashIdEncode(dispute.id);
    const hashedOrderId = hashIdUtil.hashIdEncode(dispute.Order.id);

    const message = `A new dispute ${hashedDisputeId} was raised for order "${hashedOrderId}".`;

    // ✅ Emails
    const userEmailHtml = disputeEmail({
      title: "Dispute Raised",
      recipientName: dispute.User.name || dispute.User.email,
      message,
      orderId: hashedOrderId,
      disputeId: hashedDisputeId,
    });

    const providerEmailHtml = disputeEmail({
      title: "Dispute Raised",
      recipientName:
        dispute.ServiceProvider.name || dispute.ServiceProvider.email,
      message,
      orderId: hashedOrderId,
      disputeId: hashedDisputeId,
    });

    // ✅ DRY notification creator
    const createNotification = (data) =>
      db.Notification.create(data, { transaction });

    const baseNotification = {
      message,
      url: "", // consider adding frontend link
      type: "info",
      metadata: { disputeId: dispute.id },
    };

    const [providerNotification, adminNotification, userNotification] =
      await Promise.all([
        createNotification({
          ...baseNotification,
          serviceProviderId: dispute.ServiceProvider.id,
        }),
        createNotification({
          ...baseNotification,
          isAdmin: true,
        }),
        createNotification({
          ...baseNotification,
          userId: dispute.User.id,
        }),
      ]);

    // ✅ Commit before side effects
    await transaction.commit();

    // ✅ Socket notifications
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

    // ✅ Queue emails (async, non-blocking)
    await Promise.all([
      emailQueue.add("sendEmail", {
        to: dispute.ServiceProvider.email,
        subject: EMAIL_SUBJECT,
        html: providerEmailHtml,
      }),
      emailQueue.add("sendEmail", {
        to: dispute.User.email,
        subject: EMAIL_SUBJECT,
        html: userEmailHtml,
      }),
    ]);

    return { success: true };
  } catch (error) {
    try {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
    } catch (rollbackError) {
      errorLogger("Rollback failed:", rollbackError);
    }

    errorLogger("Failed handling dispute raised:", error);
    throw error;
  }
}
