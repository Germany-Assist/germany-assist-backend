import { sequelize } from "../../../../configs/database.js";
import db from "../../../../database/index.js";
import { disputeEmail } from "../../../../services/email/templates/disputeTemplate.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { AppError } from "../../../../utils/error.class.js";
import { errorLogger } from "../../../../utils/loggers.js";
import emailQueue from "../../../../jobs/queues/email.queue.js";

const EMAIL_SUBJECT = "Dispute Updated - Germany Assist";

// on any update
export default async function handleDisputeUpdated({
  disputeId,
  status,
  resolution,
}) {
  const transaction = await sequelize.transaction();

  try {
    const dispute = await db.Dispute.findOne({
      where: { id: disputeId },
      transaction, // ✅ important
      include: [
        { model: db.Order, attributes: ["id"] },
        { model: db.User, attributes: ["id", "email", "name"] },
        {
          model: db.ServiceProvider,
          attributes: ["id", "email", "name"],
        },
      ],
    });

    const hashedDisputeId = hashIdUtil.hashIdEncode(disputeId);

    if (!dispute) {
      throw new AppError(404, `Dispute ${hashedDisputeId} not found`, true);
    }

    // ✅ relation safety
    if (!dispute.Order || !dispute.User || !dispute.ServiceProvider) {
      throw new AppError(500, "Dispute relations missing", true);
    }

    const hashedOrderId = hashIdUtil.hashIdEncode(dispute.Order.id);

    // ✅ fixed message formatting bug (you had missing quote)
    const message = `Update for dispute ${hashedDisputeId} for order "${hashedOrderId}". The dispute was ${status}${
      resolution ? ` with resolution "${resolution}"` : ""
    }.`;

    // ✅ emails
    const userEmailHtml = disputeEmail({
      title: `Dispute Update ${status}`,
      recipientName: dispute.User.name || dispute.User.email,
      message,
      orderId: hashedOrderId,
      disputeId: hashedDisputeId,
    });

    const providerEmailHtml = disputeEmail({
      title: `Dispute Update ${status}`,
      recipientName:
        dispute.ServiceProvider.name || dispute.ServiceProvider.email,
      message,
      orderId: hashedOrderId,
      disputeId: hashedDisputeId,
    });

    // ✅ DRY notifications
    const createNotification = (data) =>
      db.Notification.create(data, { transaction });

    const baseNotification = {
      message,
      url: "",
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

    // ✅ commit before side effects
    await transaction.commit();

    // ✅ sockets
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

    // ✅ queue emails
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
    // ✅ safe rollback
    try {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
    } catch (rollbackError) {
      errorLogger("Rollback failed:", rollbackError);
    }

    errorLogger("Failed handling dispute update:", error);
    throw error;
  }
}
