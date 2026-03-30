import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import serviceStatusEmail from "../../../../services/email/templates/serviceStatusEmail.js";
import emailQueue from "../../../../jobs/queues/email.queue.js";

// Called only after the admin approves the service
async function handleServiceApproved({ serviceId }) {
  if (!serviceId) {
    throw new Error("serviceId is required");
  }

  // Fetch service with provider info
  const service = await db.Service.findOne({
    where: { id: serviceId },
    include: [
      { model: db.ServiceProvider, attributes: ["id", "email", "name"] },
    ],
  });

  if (!service || !service.ServiceProvider) {
    throw new Error(`Service ${serviceId} or its ServiceProvider not found`);
  }

  const hashedServiceId = hashIdUtil.hashIdEncode(serviceId);
  const providerMessage = `Successfully Admin Approved service "${service.title}" with id ${hashedServiceId}.`;

  const providerEmailHtml = serviceStatusEmail({
    title: "Service Successfully Approved",
    recipientName: service.ServiceProvider.name,
    mainMessage: providerMessage,
    serviceId: hashedServiceId,
    serviceTitle: service.title,
    status: "Approved",
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

    // Send socket notifications (fire-and-forget)
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
    await emailQueue.add("sendEmail", {
      to: service.ServiceProvider.email,
      subject: "Service Approved - Germany Assist",
      html: providerEmailHtml,
    });

    return { success: true };
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    errorLogger("Failed handling service approval:", error);
    throw error;
  }
}

export default handleServiceApproved;
