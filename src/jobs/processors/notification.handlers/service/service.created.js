import db from "../../../../database/index.js";
import socketNotificationServices from "../../../../sockets/services/notificationService.js";
import { sequelize } from "../../../../configs/database.js";
import hashIdUtil from "../../../../utils/hashId.util.js";
import { errorLogger } from "../../../../utils/loggers.js";
import serviceStatusEmail from "../../../../services/email/templates/serviceStatusEmail.js";
import emailQueue from "../../../../jobs/queues/email.queue.js";
import { SERVICES_STATUS } from "../../../../configs/constants.js";

// Called only after the service is created
async function handleServiceCreated({ serviceId }) {
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
  const draftMessage =
    "We noticed you started creating a service but didn't finish. Complete your setup now to start receiving requests from clients in Germany  ";
  const requestedReviewMessage = `Successfully created new service "${service.title}" with id ${hashedServiceId}. Your Service is Currently being reviewed by our team. Note that the service still requires admin approval to be live and visible.`;
  const providerMessage =
    service.status === SERVICES_STATUS.pending
      ? requestedReviewMessage
      : draftMessage;

  const adminMessage = `Provider ${service.ServiceProvider.name} created new service "${service.title}" with id ${hashedServiceId} as a ${service.status} service.`;

  const providerEmailHtml = serviceStatusEmail({
    title: "Service Successfully Created",
    recipientName: service.ServiceProvider.name,
    mainMessage: providerMessage,
    serviceId: hashedServiceId,
    serviceTitle: service.title,
    status: "Created",
  });

  // Use a transaction for DB writes
  const transaction = await sequelize.transaction();
  try {
    // Create notifications
    const [providerNotification, adminNotification] = await Promise.all([
      db.Notification.create(
        {
          message: providerMessage,
          url: "",
          type: "info",
          serviceProviderId: service.ServiceProvider.id,
          metadata: {
            serviceProviderId: service.ServiceProvider.id,
            serviceId: hashedServiceId,
          },
        },
        { transaction },
      ),
      db.Notification.create(
        {
          message: adminMessage,
          url: "",
          type: "info",
          isAdmin: true,
          metadata: {
            serviceProviderId: service.ServiceProvider.id,
            serviceId: hashedServiceId,
          },
        },
        { transaction },
      ),
    ]);

    await transaction.commit();

    // Send socket notifications (fire-and-forget style)
    socketNotificationServices.sendSocketNotificationToProvider(
      service.ServiceProvider.id,
      {
        id: hashIdUtil.hashIdEncode(providerNotification.id),
        message: providerMessage,
      },
    );
    // i only want to notify the admin when its requesting approval
    if (service.status === SERVICES_STATUS.pending)
      socketNotificationServices.sendSocketNotificationAdmin({
        id: hashIdUtil.hashIdEncode(adminNotification.id),
        message: adminMessage,
      });
    await emailQueue.add("sendEmail", {
      to: service.ServiceProvider.email,
      subject: "Service Created - Germany Assist",
      html: providerEmailHtml,
    });

    return { success: true };
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    errorLogger("Failed handling service created:", error);
    throw error;
  }
}

export default handleServiceCreated;
