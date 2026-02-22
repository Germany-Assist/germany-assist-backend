import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import emailService from "../../../../services/email/email.service.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import { orderStatusEmail } from "../../../../services/email/templates/orderStatusEmail.js";
import serviceStatusEmail from "../../../../services/email/templates/serviceStatusEmail.js";
// called only after the service is rejected
async function handleServiceRejection({ serviceId, reason }) {
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
  const providerMessage = `Your service was Rejected service "${service.title}" with id ${hashedServiceId} please note that the rejection stops the service further explanation will be sent to the user rejection reason: ${reason ? reason : "not provided please contact the admin"} .`;
  const transaction = await sequelize.transaction();
  try {
    await db.Notification.create(
      {
        message: providerMessage,
        url: "",
        type: "info",
        recipientId: service.ServiceProvider.id,
        metadata: {
          serviceProviderId: service.ServiceProvider.id,
          serviceId: service.id,
        },
      },
      { transaction },
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const providerEmailHtml = serviceStatusEmail({
    title: "Service Rejected",
    recipientName: service.ServiceProvider.name,
    mainMessage: providerMessage,
    serviceId: hashedServiceId,
    serviceTitle: service.title,
    status: "Rejected",
  });

  try {
    socketNotificationServices.sendSocketNotificationToProvider(
      service.ServiceProvider.id,
      {
        message: providerMessage,
      },
    );
    socketNotificationServices.sendSocketNotificationAdmin({
      message: providerMessage,
    });
    await Promise.all([
      emailService.sendEmail({
        to: service.ServiceProvider.email,
        subject: "Service Rejected - Germany Assist",
        html: providerEmailHtml,
      }),
    ]);
  } catch (externalError) {
    errorLogger("Post-commit side effects failed:", externalError);
    throw externalError;
  }

  return { success: true };
}

export default handleServiceRejection;
