import QueueManager from "../../configs/bullMQ.config.js";
import emailProcessor from "../processors/email.processor.js";
const emailWorker = QueueManager.createWorker("email-events", emailProcessor);
