import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import emailService from "../../../../services/email/email.service.js";
import { AppError } from "../../../../utils/error.class.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { successfulPaymentEmail } from "../../../../services/email/templates/successfulPayment.js";
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

  if (!user || !service) {
    throw new AppError(
      `User or Service not found: userId=${userId}, serviceId=${serviceId}`,
    );
  }

  const relatedHashId = hashIdUtil.hashIdEncode(relatedId);

  const providerMessage = `Successful payment from user ${user.email} for ${relatedType} ${relatedHashId} of service ${service.title}`;

  const userMessage = `Your payment was successful for ${relatedType} ${relatedHashId} of service ${service.title}`;

  const transaction = await sequelize.transaction();

  try {
    await db.Notification.create(
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

    await db.Notification.create(
      {
        message: providerMessage,
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

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  try {
    // socket
    socketNotificationServices.sendSocketNotification(userId, {
      message: userMessage,
    });

    socketNotificationServices.sendSocketNotification(serviceProviderId, {
      message: providerMessage,
    });

    // email template
    const html = successfulPaymentEmail({
      providerName: service.ServiceProvider.name,
      userEmail: user.email,
      relatedType,
      relatedHashId,
      serviceTitle: service.title,
      amount: amount / 100,
    });

    // send emails in parallel
    await Promise.all([
      emailService.sendEmail({
        to: service.ServiceProvider?.email,
        subject: "Successful Purchase from Germany-Assist",
        html,
      }),
      emailService.sendEmail({
        to: user.email,
        subject: "Successful Purchase from Germany-Assist",
        html,
      }),
    ]);
  } catch (externalError) {
    errorLogger("Post-commit side effects failed:", externalError);
    throw externalError;
  }

  return { success: true };
}

export default handleOrderActive;
