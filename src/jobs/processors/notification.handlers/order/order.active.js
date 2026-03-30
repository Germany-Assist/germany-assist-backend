import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import { AppError } from "../../../../utils/error.class.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { successfulPaymentEmail } from "../../../../services/email/templates/successfulPayment.js";
import emailQueue from "../../../../jobs/queues/email.queue.js";
import { errorLogger } from "../../../../utils/loggers.js";

// triggered on successful payment
async function handleOrderActive(data) {
  const {
    serviceId,
    userId,
    serviceProviderId,
    relatedType,
    relatedId,
    amount,
  } = data;

  // 1 Fetch data outside transaction
  const [user, service] = await Promise.all([
    db.User.findByPk(userId, { attributes: ["id", "email"] }),
    db.Service.findByPk(serviceId, {
      include: [{ model: db.ServiceProvider }],
    }),
  ]);

  if (!user || !service || !service.ServiceProvider) {
    throw new AppError(
      `User, Service or ServiceProvider not found: userId=${userId}, serviceId=${serviceId}`,
    );
  }

  const relatedHashId = hashIdUtil.hashIdEncode(relatedId);

  const providerMessage = `Successful payment from user ${user.email} for ${relatedType} ${relatedHashId} of service ${service.title}`;

  const userMessage = `Your payment was successful for ${relatedType} ${relatedHashId} of service ${service.title}`;

  const transaction = await sequelize.transaction();

  try {
    const userNotification = await db.Notification.create(
      {
        message: userMessage,
        url: "",
        type: "info",
        userId: userId,
        metadata: {
          serviceProviderId,
          serviceId: service.id,
          relatedId,
        },
      },
      { transaction },
    );

    const providerNotification = await db.Notification.create(
      {
        message: providerMessage,
        url: "",
        type: "info",
        serviceProviderId: serviceProviderId,
        metadata: {
          serviceProviderId,
          serviceId: service.id,
          relatedId,
        },
      },
      { transaction },
    );

    await transaction.commit();

    // socket
    socketNotificationServices.sendSocketNotification(userId, {
      id: hashIdUtil.hashIdEncode(userNotification.id),
      message: userMessage,
    });

    socketNotificationServices.sendSocketNotificationToProvider(
      serviceProviderId,
      {
        id: hashIdUtil.hashIdEncode(providerNotification.id),
        message: providerMessage,
      },
    );

    // email template
    const html = successfulPaymentEmail({
      providerName: service.ServiceProvider.name,
      userEmail: user.email,
      relatedType,
      relatedHashId,
      serviceTitle: service.title,
      amount: amount / 100,
    });

    // Queue emails in parallel
    await Promise.all([
      emailQueue.add("sendEmail", {
        to: service.ServiceProvider?.email,
        subject: "Successful Purchase from Germany-Assist",
        html,
      }),
      emailQueue.add("sendEmail", {
        to: user.email,
        subject: "Successful Purchase from Germany-Assist",
        html,
      }),
    ]);
  } catch (externalError) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    errorLogger("Failed handling order active:", externalError);
    throw externalError;
  }

  return { success: true };
}

export default handleOrderActive;
