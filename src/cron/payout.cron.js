import cron from "node-cron";
import db from "../database/index.js";
import { Op, Sequelize } from "sequelize";
import { sequelize } from "../configs/database.js";
import { errorLogger, infoLogger } from "../utils/loggers.js";
import {
  AUDIT_LOGS_CONSTANTS,
  NOTIFICATION_EVENTS,
} from "../configs/constants.js";
import auditLogsRepository from "../modules/auditLogs/auditLogs.repository.js";
import notificationQueue from "../jobs/queues/notification.queue.js";
const testDuration = "0 * * * * *";
const actualDuration = "0 0 0 * * *";

const payoutCron = cron.schedule("0 * * * * * *", async () => {
  const transaction = await sequelize.transaction();
  try {
    const orders = await db.Order.findAll({
      where: {
        status: "pending_completion",
        updatedAt: {
          [Op.lte]: Sequelize.literal("NOW() - INTERVAL '14 days'"),
        },
        id: {
          [Op.notIn]: Sequelize.literal(`(
            SELECT "order_id"
            FROM "disputes"
            WHERE status != 'resolved'
          )`),
        },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (orders.length === 0) {
      infoLogger("No closed Order ready to move");
      await transaction.commit();
      return;
    }

    await db.Order.update(
      { status: "completed" },
      {
        where: { id: orders.map((o) => o.id) },
        transaction,
      },
    );

    const payouts = orders.map((order) => ({
      orderId: order.id,
      amount: Number(order.amount),
      serviceProviderId: order.serviceProviderId,
      amountToPay: Number(order.amount) * 0.8,
      currency: order.currency,
      status: "pending",
    }));

    const logsData = orders.map((order) => ({
      orderId: order.id,
      action: AUDIT_LOGS_CONSTANTS.ORDER_UPDATE,
      reason: "Order was completed since 14 days passed with no active dispute",
      oldValue: order.toJSON(),
      newValue: { ...order.toJSON(), status: "completed" },
      actorType: AUDIT_LOGS_CONSTANTS.ACTOR_SYSTEM,
    }));
    for (let i = 0; i < orders.length; i++) {
      await notificationQueue.add(NOTIFICATION_EVENTS.ORDER.COMPLETED, {
        orderId: orders[i].id,
      });
    }
    await db.Payout.bulkCreate(payouts, { transaction });
    await auditLogsRepository.createBulkNewLogRecords(logsData, transaction);
    await transaction.commit();
    infoLogger(`Successfully moved ${orders.length} orders to payouts`);
  } catch (err) {
    await transaction.rollback();
    errorLogger(err);
  }
});
payoutCron.start();

export default payoutCron;
