import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import serviceStatusEmail from "../../../../services/email/templates/serviceStatusEmail.js";
import emailQueue from "../../../../jobs/queues/email.queue.js";

// Called only after the service is rejected
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
    throw new Error(`Service ${serviceId} not found`);
  }

  const hashedServiceId = hashIdUtil.hashIdEncode(serviceId);
  const providerMessage = `Your service "${service.title}" with id ${hashedServiceId} was rejected. Rejection stops the service. Reason: ${reason || "not provided, please contact the admin"}.`;

  const providerEmailHtml = serviceStatusEmail({
    title: "Service Rejected",
    recipientName: service.ServiceProvider.name,
    mainMessage: providerMessage,
    serviceId: hashedServiceId,
    serviceTitle: service.title,
    status: "Rejected",
  });

  const transaction = await sequelize.transaction();

  try {
    // Create notifications in parallel
    const [providerNotification, adminNotification] = await Promise.all([
      db.Notification.create(
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
      ),
      db.Notification.create(
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
      ),
    ]);

    // Commit DB changes first
    await transaction.commit();

    // Fire-and-forget: socket notifications
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

    // Queue email
    emailQueue.add("sendEmail", {
      to: service.ServiceProvider.email,
      subject: "Service Rejected - Germany Assist",
      html: providerEmailHtml,
    });

    return { success: true };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    errorLogger("Failed handling service rejection:", error);
    throw error;
  }
}

export default handleServiceRejection;
