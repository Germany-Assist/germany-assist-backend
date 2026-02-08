import redis from "./redis.js";
import { Queue, QueueEvents, Worker } from "bullmq";
import { NODE_ENV } from "./serverConfig.js";
import { debugLogger, errorLogger, infoLogger } from "../utils/loggers.js";

const isTest = NODE_ENV === "test";
const bullPrefix = `bullmq:${NODE_ENV}`;
export const defaultQueueOptions = {
  connection: redis,
  prefix: bullPrefix,
  defaultJobOptions: {
    attempts: 10,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
};

export class QueueManager {
  constructor() {
    this.queues = new Map();
    this.events = new Map();
    this.workers = new Map();
  }

  createQueue(name, options = {}) {
    if (isTest) {
      const stubQueue = { add: async () => {} };
      const stubEvents = { on: () => {} };
      this.queues.set(name, stubQueue);
      this.events.set(name, stubEvents);
      return { queue: stubQueue, events: stubEvents };
    }

    const queue = new Queue(name, { ...defaultQueueOptions, ...options });
    const events = new QueueEvents(name, {
      connection: redis,
      prefix: bullPrefix,
    });
    (queue.listAllJobs = async () => {
      await listAllJobs(queue);
    })();
    events.on("waiting", ({ jobId }) =>
      debugLogger(`[${name}] waiting ${jobId}`),
    );
    events.on("active", ({ jobId }) =>
      debugLogger(`[${name}] active ${jobId}`),
    );
    events.on("completed", ({ jobId }) =>
      debugLogger(`[${name}] completed ${jobId}`),
    );
    events.on("failed", ({ jobId, failedReason }) =>
      errorLogger(`[${name}] failed ${jobId}`, failedReason),
    );
    events.on("error", (err) =>
      errorLogger(`[${name}] QueueEvents error`, err),
    );

    this.queues.set(name, queue);
    this.events.set(name, events);
    return { queue, events };
  }

  createWorker(name, processor, options = {}) {
    if (isTest) return null;
    debugLogger(`creating ${name} worker`);
    const worker = new Worker(name, processor, {
      connection: redis,
      prefix: bullPrefix,
      concurrency: 1,
      autorun: true,
      ...options,
    });
    worker.on("completed", (job) =>
      infoLogger(`[${name}] job ${job.id} completed`),
    );
    worker.on("failed", (job, err) =>
      errorLogger(`[${name}] job ${job.id} failed`, err),
    );
    worker.on("error", (err) => errorLogger(`[${name}] worker error`, err));

    this.workers.set(name, worker);
    return worker;
  }

  async shutdownAll() {
    // close workers
    for (const worker of this.workers.values()) {
      infoLogger("Closing All the bullmq-workers");
      await worker?.close();
    }
    // close queue events
    for (const events of this.events.values()) {
      infoLogger("Closing All the bullmq-events");
      await events?.close();
    }
    // optionally close queues (not mandatory)
    for (const queue of this.queues.values()) {
      infoLogger("Closing All the bullmq-queues");
      await queue?.close();
    }
  }
}
export default QueueManager = new QueueManager();

export async function listAllJobs(queue) {
  try {
    const jobs = await queue.getJobs([
      "waiting",
      "delayed",
      "active",
      "failed",
      "completed",
    ]);

    const jobsList = jobs.map(async (job) => {
      const state = await job.getState(); // ✅ fetch actual state from Redis
      const eventId = job.data?.event?.id || job.data?.id || "undefined";
      return `${job.id} - ${job.name} - ${eventId} - ${state}`;
    });

    const QueueStatus = {
      title: `=== ${queue.name} Queue Status ===`,
      jobs: await Promise.all(jobsList),
    };
    console.log(QueueStatus);
    return jobs;
  } catch (error) {
    errorLogger("Error listing jobs:", error);
    return [];
  }
}
