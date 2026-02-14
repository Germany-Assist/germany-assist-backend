import {
  AUDIT_LOGS_CONSTANTS,
  NOTIFICATION_EVENTS,
} from "../configs/constants.js";
import cron from "node-cron";
import db from "../database/index.js";
import { Op, Sequelize } from "sequelize";
import { sequelize } from "../configs/database.js";
import { errorLogger, infoLogger } from "../utils/loggers.js";
import auditLogsRepository from "../modules/auditLogs/auditLogs.repository.js";
import notificationQueue from "../jobs/queues/notification.queue.js";

const timelinesClosingCron = cron.schedule("0 * * * * *", async () => {
  const transaction = await sequelize.transaction();
  try {
    const orders = await db.Order.findAll({
      where: {
        status: "active",
        relatedType: "timeline",
        relatedId: {
          [Op.in]: Sequelize.literal(`(
            SELECT id
            FROM "timelines"
            WHERE "end_date" <= NOW()
          )`),
        },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (orders.length === 0) {
      infoLogger("No timeline was closed");
      await transaction.commit();
      return;
    }

    const closedOrder = await db.Order.update(
      { status: "pending_completion" },
      {
        where: { id: orders.map((o) => o.id) },
        transaction,
        returning: true,
      },
    );
    await notificationQueue.add(NOTIFICATION_EVENTS.ORDER.CLOSED, {
      orderId: closedOrder.id,
    });
    const logsData = orders.map((order) => ({
      orderId: order.id,
      action: AUDIT_LOGS_CONSTANTS.ORDER_UPDATE, // ideally a constant
      reason: "Order automatically closed due to Timeline reaching end date",
      oldValue: order.toJSON(),
      newValue: { ...order.toJSON(), status: "pending_completion" },
      actorType: AUDIT_LOGS_CONSTANTS.ACTOR_SYSTEM,
    }));

    await auditLogsRepository.createBulkNewLogRecords(logsData, transaction);

    await transaction.commit();
    infoLogger(`${orders.length} timelines were closed`);
  } catch (err) {
    await transaction.rollback();
    errorLogger("timeline cron failed:", err);
  }
});
timelinesClosingCron.start();

export default timelinesClosingCron;
