//this not used for now its just for legacy

import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import emailService from "../../../../services/email/email.service.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import { orderStatusEmail } from "../../../../services/email/templates/orderStatusEmail.js";
import serviceStatusEmail from "../../../../services/email/templates/serviceStatusEmail.js";
// called only after the admin approves the service
async function handleServiceApproved({ serviceId }) {
  if (!serviceId) {
    throw new Error("serviceId is required");
  }
  const service = await db.Service.findOne({
    where: { id: serviceId },
    include: [
      { model: db.ServiceProvider, attributes: ["id", "email", "name"] },
    ],
  });

  if (!service) {
    throw new Error(`service ${serviceId} not found`);
  }

  const hashedServiceId = hashIdUtil.hashIdEncode(serviceId);

  const providerMessage = `Successfully Admin Approved service "${service.title}" with id ${hashedServiceId}.`;

  const transaction = await sequelize.transaction();

  const providerEmailHtml = serviceStatusEmail({
    title: "Service Successfully Approved",
    recipientName: service.ServiceProvider.name,
    mainMessage: providerMessage,
    serviceId: hashedServiceId,
    serviceTitle: service.title,
    status: "Approved",
  });

  try {
    const providerNotification = await db.Notification.create(
      {
        message: providerMessage,
        url: "",
        type: "info",
        serviceProviderId: service.ServiceProvider.id,
        metadata: {
          serviceProviderId: service.ServiceProvider.id,
          serviceId: service.id,
        },
      },
      { transaction },
    );
    const adminNotification = await db.Notification.create(
      {
        message: providerMessage,
        url: "",
        type: "info",
        isAdmin: true,
        metadata: {
          serviceProviderId: service.ServiceProvider.id,
          serviceId: service.id,
        },
      },
      { transaction },
    );

    socketNotificationServices.sendSocketNotificationToProvider(
      service.ServiceProvider.id,
      {
        id: hashIdUtil.hashIdEncode(providerNotification.id),
        message: providerMessage,
      },
    );
    socketNotificationServices.sendSocketNotificationAdmin({
      id: hashIdUtil.hashIdEncode(adminNotification.id),
      message: providerMessage,
    });
    await Promise.all([
      emailService.sendEmail({
        to: service.ServiceProvider.email,
        subject: "Service Approved - Germany Assist",
        html: providerEmailHtml,
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

export default handleServiceApproved;
