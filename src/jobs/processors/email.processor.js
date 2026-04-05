import { errorLogger } from "../../utils/loggers.js";
import emailService from "../../services/email/email.service.js";

async function emailProcessor(job) {
  const { data, name, id } = job;
  try {
    await emailService.sendEmail(data);
  } catch (error) {
    errorLogger(error, {
      jobId: id,
      eventName: name,
      userId: data?.userId,
    });
    throw error;
  }
}

export default emailProcessor;
