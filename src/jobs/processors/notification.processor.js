import { handlers } from "./notification.handlers/index.js";
import { errorLogger } from "../../utils/loggers.js";

async function notificationProcessor(job) {
  const { data, name, id } = job;
  const handler = handlers[name];
  if (!handler) {
    errorLogger(`Unhandled notification event: ${name}`, {
      jobId: id,
      data,
    });
    return;
  }
  try {
    await handler(data);
  } catch (error) {
    errorLogger(error, {
      jobId: id,
      eventName: name,
      userId: data?.userId,
    });
    throw error;
  }
}

export default notificationProcessor;
