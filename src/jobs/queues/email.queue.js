import QueueManager from "../../configs/bullMQ.config.js";
const emailQueue = QueueManager.createQueue("email-events").queue;
export default emailQueue;
