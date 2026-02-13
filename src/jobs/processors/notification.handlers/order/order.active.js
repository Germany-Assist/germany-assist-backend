import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import emailService from "../../../../services/email/email.service.js";
import { AppError } from "../../../../utils/error.class.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { orderActiveEmail } from "../../../../services/email/templates/orderActive.js";

async function handleOrderActive(data) {
  // sample data coming from stripe processor passed from the notification processor
  // const data = {
  //   amount: pi.amount,
  //   status: "active",
  //   userId: metadata.userId,
  //   serviceId: metadata.serviceId,
  //   relatedId: metadata.relatedId,
  //   relatedType: metadata.relatedType,
  //   serviceProviderId: metadata.serviceProviderId,
  //   stripePaymentIntentId: pi.id,
  //   currency: "usd",
  // };

  const {
    serviceId,
    userId,
    serviceProviderId,
    relatedType,
    relatedId,
    amount,
  } = data;
  const [user, service] = await Promise.all([
    db.User.findByPk(userId, { attributes: ["email"] }),
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
  //TODO add url based on the frontend
  const message = `Successful payment from user ${user.email} for ${relatedType} ${hashIdUtil.hashIdEncode(relatedId)} of service ${service.title}`;

  const notificationData = [
    {
      message,
      url: "",
      type: "info",
      userId: userId,
      metadata: {
        serviceProviderId: serviceProviderId,
        serviceId: service.id,
      },
    },
  ];
  const notification = await sequelize.transaction(async (t) => {
    return db.Notification.bulkBuild(notificationData, { transaction: t });
  });
  socketNotificationServices.sendSocketNotification(userId, {
    message,
  });
  const html = orderActiveEmail({
    providerName: service.ServiceProvider.name,
    userEmail: user.email,
    relatedType,
    relatedHashId,
    serviceTitle: service.title,
    amount: amount / 100,
  });

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
}

export default handleOrderActive;
