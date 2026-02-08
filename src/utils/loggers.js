import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { v4 as uuidv4 } from "uuid";
import { LOG_LEVEL, NODE_ENV } from "../configs/serverConfig.js";
import util from "node:util";
import { captureError } from "./sentry.util.js";
import { error } from "node:console";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};
winston.loggers.add("errorLogger", {
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.metadata(),
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
      let logString = `${timestamp} ${level}: ${message}`;
      const meta = metadata?.error || metadata;
      if (meta && Object.keys(meta).length > 0) {
        if (meta && typeof meta === "object") {
          const { statusCode, headers, trace } = meta;
          let safeResponse;
          try {
            safeResponse = JSON.stringify({
              statusCode,
              headers: headers ? Object.keys(headers).slice(0, 5) : undefined,
              trace,
            });
          } catch {
            safeResponse = util.inspect(meta, { depth: 2 });
          }

          logString += ` | response: ${safeResponse}`;
        } else {
          console.log(typeof meta);
          logString += ` | metadata: ${util.inspect(meta, { depth: 3 })}`;
        }
      }

      if (stack) logString += `\n${stack}`;
      return logString;
    })
  ),
  transports: [
    NODE_ENV === "dev"
      ? new winston.transports.Console()
      : new winston.transports.Console({
          format: winston.format.printf(
            ({ timestamp }) =>
              `${timestamp} error occurred please check the logs`
          ),
        }),
    new DailyRotateFile({
      filename: "./logs/errors-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});
winston.loggers.add("httpLogger", {
  levels: levels,
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.printf(({ timestamp, level, message, LogMetaData }) => {
      return `${timestamp} ${level}: ${LogMetaData || ""} ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: "./logs/http-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});
winston.loggers.add("debugLogger", {
  levels: levels,
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      level: "info",
      filename: "./logs/info-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

export const debugLogger = winston.loggers.get("debugLogger").debug;
export const infoLogger = winston.loggers.get("debugLogger").info;
export const httpLogger = winston.loggers.get("httpLogger").http;
export const rawErrorLogger = winston.loggers.get("errorLogger").error;

export const errorLogger = (error) => {
  rawErrorLogger(error);
  captureError(error);
};
