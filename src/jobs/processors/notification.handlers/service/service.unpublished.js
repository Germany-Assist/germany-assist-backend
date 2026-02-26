import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import serviceStatusEmail from "../../../../services/email/templates/serviceStatusEmail.js";
import emailQueue from "../../../../jobs/queues/email.queue.js";

// Called only after the service is unpublished
async function handleServiceUnpublished({ serviceId }) {
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
  const providerMessage = `Successfully Unpublished service "${service.title}" with id ${hashedServiceId}. The service won’t be live, but you can publish it anytime.`;

  const providerEmailHtml = serviceStatusEmail({
    title: "Service Successfully Unpublished",
    recipientName: service.ServiceProvider.name,
    mainMessage: providerMessage,
    serviceId: hashedServiceId,
    serviceTitle: service.title,
    status: "Unpublished",
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

    // Fire-and-forget socket notifications
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
      subject: "Service Unpublished - Germany Assist",
      html: providerEmailHtml,
    });

    return { success: true };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    errorLogger("Failed handling service unpublished:", error);
    throw error;
  }
}

export default handleServiceUnpublished;
